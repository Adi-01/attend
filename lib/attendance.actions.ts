"use server";

import { WorkLocation } from "@/constants/location";
import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { revalidatePath } from "next/cache";
import { Query } from "node-appwrite";

export async function getAttendanceData(page = 1, limit = 10) {
  try {
    const { tables } = await createAdminClient();

    const offset = (page - 1) * limit;

    const res = await tables.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.attendanceCollectionId,
      queries: [
        Query.orderDesc("$createdAt"),
        Query.limit(limit),
        Query.offset(offset),
        Query.notEqual("workLocation", "Nagaur"),
      ],
    });

    return {
      success: true,
      attendanceData: res.rows,
      total: res.total, // IMPORTANT: Appwrite returns total rows
    };
  } catch (error: any) {
    return {
      success: false,
      attendanceData: [],
      error: error?.message || "Something went wrong",
    };
  }
}

export async function getMonthlyAttendanceData(month: number, year: number) {
  try {
    const { tables } = await createAdminClient();

    const lastDay = new Date(year, month, 0).getDate();
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(
      2,
      "0",
    )}-${lastDay}T23:59:59.999`;

    const res = await tables.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.attendanceCollectionId,
      queries: [
        Query.between("checkInAt", startDate, endDate),
        Query.orderAsc("checkInAt"), // Ordered oldest to newest
        Query.limit(5000),
      ],
    });

    // Updated Types - Key is now userId (string)
    const userMap: Record<
      string,
      {
        userName: string;
        days: Record<
          string,
          {
            count: number;
            working: boolean;
            locations: string[];
            workingLocation?: string;
          }
        >;
      }
    > = {};

    res.rows.forEach((row: any) => {
      const userId = row.userId; // 👈 1. Use userId as the unique identifier

      if (!userId) return; // Safeguard against bad data

      // 2. Initialize User using userId
      if (!userMap[userId]) {
        userMap[userId] = {
          userName: row.userName,
          days: {},
        };
      } else {
        // 3. Update the name to the latest one.
        // Since we query orderAsc, the last row processed has the most recent name.
        userMap[userId].userName = row.userName;
      }

      const dateOnly = row.checkInAt?.split("T")[0];
      const location = row.workLocation || "N/A";

      if (dateOnly) {
        // 4. Initialize Day
        const dayData = userMap[userId].days[dateOnly] || {
          count: 0,
          working: false,
          locations: [],
          workingLocation: undefined,
        };

        if (row.checkOutAt) {
          // Completed Shift
          dayData.count += 1;
          dayData.locations.push(location);
        } else {
          // Active Shift
          dayData.working = true;
          dayData.workingLocation = location;
        }

        userMap[userId].days[dateOnly] = dayData; // 👈 Use userId here too
      }
    });

    // Fill missing days
    const daysInMonth = lastDay;
    Object.values(userMap).forEach((u) => {
      for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(
          d,
        ).padStart(2, "0")}`;

        if (!u.days[dateKey]) {
          u.days[dateKey] = { count: 0, working: false, locations: [] };
        }
      }
    });
    // console.log(Object.values(userMap));
    return {
      success: true,
      attendanceData: Object.values(userMap),
    };
  } catch (error: any) {
    console.error("Error fetching monthly attendance:", error);
    return {
      success: false,
      attendanceData: [],
      error: error?.message || "Something went wrong",
    };
  }
}

export async function getMonthlyExportData(
  month: number,
  year: number,
  location: WorkLocation,
) {
  try {
    const { tables } = await createAdminClient();

    // Calculate correct start and end date for the selected month
    const lastDay = new Date(year, month, 0).getDate();
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    // Include the entire last day
    const endDate = `${year}-${String(month).padStart(
      2,
      "0",
    )}-${lastDay}T23:59:59.999`;

    const res = await tables.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.attendanceCollectionId,
      queries: [
        Query.between("checkInAt", startDate, endDate),
        Query.orderAsc("checkInAt"), // Ordered by date for the PDF
        Query.equal("workLocation", location),
        Query.limit(5000), // High limit to fetch all records for the month
      ],
    });

    return { success: true, data: res.rows };
  } catch (error: any) {
    console.error("Export Fetch Error:", error);
    return { success: false, data: [] };
  }
}

export async function updateAttendanceTime(
  rowId: string,
  field: "checkIn" | "checkOut",
  newValue: string,
) {
  try {
    const { tables } = await createAdminClient();

    // 1. Map the UI "field" to the actual Appwrite Column ID
    const dbColumn = field === "checkIn" ? "checkInAt" : "checkOutAt";

    // 2. Perform the update
    const res = await tables.updateRow(
      appwriteConfig.databaseId,
      appwriteConfig.attendanceCollectionId,
      rowId,
      {
        [dbColumn]: newValue,
      },
    );

    // 3. Optional: Revalidate the cache so the page updates immediately
    revalidatePath("/attendance");

    return {
      success: true,
      updatedRow: res,
    };
  } catch (error: any) {
    console.error("Update Attendance Error:", error);
    return {
      success: false,
      error: error?.message || "Failed to update attendance record",
    };
  }
}

export async function getNagaurAttendanceData(page = 1, limit = 10) {
  try {
    const { tables } = await createAdminClient();

    const offset = (page - 1) * limit;

    const res = await tables.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.attendanceCollectionId,
      queries: [
        Query.orderDesc("$createdAt"),
        Query.limit(limit),
        Query.offset(offset),
        Query.equal("workLocation", "Nagaur"),
      ],
    });

    return {
      success: true,
      attendanceData: res.rows,
      total: res.total, // IMPORTANT: Appwrite returns total rows
    };
  } catch (error: any) {
    return {
      success: false,
      attendanceData: [],
      error: error?.message || "Something went wrong",
    };
  }
}
