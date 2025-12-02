"use server";

import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
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
      "0"
    )}-${lastDay}T23:59:59.999`;

    const res = await tables.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.attendanceCollectionId,
      queries: [
        Query.between("checkInAt", startDate, endDate),
        Query.orderAsc("checkInAt"),
        Query.limit(5000),
      ],
    });

    const daysInMonth = lastDay;

    // Updated Type: Added workLocation
    const userMap: Record<
      string,
      {
        userName: string;
        workLocation: string; // New Field
        days: Record<string, { count: number; working: boolean }>;
      }
    > = {};

    res.rows.forEach((row: any) => {
      if (!userMap[row.userName]) {
        userMap[row.userName] = {
          userName: row.userName,
          // Capture location (default to 'N/A' if missing)
          workLocation: row.workLocation || "N/A",
          days: {},
        };
      }

      const dateOnly = row.checkInAt?.split("T")[0];

      if (dateOnly) {
        const dayData = userMap[row.userName].days[dateOnly] || {
          count: 0,
          working: false,
        };

        if (row.checkOutAt) {
          dayData.count += 1;
        } else {
          dayData.working = true;
        }

        userMap[row.userName].days[dateOnly] = dayData;
      }
    });

    // Fill missing days
    Object.values(userMap).forEach((u) => {
      for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(
          d
        ).padStart(2, "0")}`;

        if (!u.days[dateKey]) {
          u.days[dateKey] = { count: 0, working: false };
        }
      }
    });

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

export async function getMonthlyExportData(month: number, year: number) {
  try {
    const { tables } = await createAdminClient();

    // Calculate correct start and end date for the selected month
    const lastDay = new Date(year, month, 0).getDate();
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    // Include the entire last day
    const endDate = `${year}-${String(month).padStart(
      2,
      "0"
    )}-${lastDay}T23:59:59.999`;

    const res = await tables.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.attendanceCollectionId,
      queries: [
        Query.between("checkInAt", startDate, endDate),
        Query.orderAsc("checkInAt"), // Ordered by date for the PDF
        Query.limit(5000), // High limit to fetch all records for the month
      ],
    });

    return { success: true, data: res.rows };
  } catch (error: any) {
    console.error("Export Fetch Error:", error);
    return { success: false, data: [] };
  }
}
