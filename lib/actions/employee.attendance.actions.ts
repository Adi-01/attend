"use server";
import { appwriteConfig } from "@/lib/appwrite/config";
import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";

const ATTENDANCE_DB = appwriteConfig.databaseId!;
const ATTENDANCE_TABLE = appwriteConfig.attendanceCollectionId!;

// 🔹 Get logged-in user's ID
export async function currentUser() {
  const { account } = await createSessionClient();
  const stored = await account.get();
  const prefs = await account.getPrefs();
  if (!stored) throw new Error("User not logged in");
  return { id: stored.$id, name: stored.name, phone: prefs.phone };
}

/* ----------------------------------------------------
    1️⃣  Get Latest Attendance (last 1–2 records)
---------------------------------------------------- */
export async function getLatestAttendanceRecords() {
  try {
    const userId = await currentUser();
    const { tables } = await createAdminClient();

    const res = await tables.listRows({
      databaseId: ATTENDANCE_DB,
      tableId: ATTENDANCE_TABLE,
      queries: [
        Query.equal("userId", userId.id),
        Query.orderDesc("checkInAt"),
        Query.limit(2),
      ],
    });

    return res.rows.map((doc) => ({
      id: doc.$id,
      date: doc.date,
      checkInAt: doc.checkInAt, // <--- Add this
      checkOutAt: doc.checkOutAt, // <--- Add this
      location: doc.workLocation,
      checkedOut: !!doc.checkOutAt,
    }));
  } catch (err) {
    console.log("GET LATEST ATTENDANCE ERROR:", err);
    return [];
  }
}

/* ----------------------------------------------------
    2️⃣  Get today’s ACTIVE shift (if not checked out)
---------------------------------------------------- */
export async function getCurrentShift() {
  try {
    const userId = await currentUser();
    const { tables } = await createAdminClient();

    const res = await tables.listRows({
      databaseId: ATTENDANCE_DB,
      tableId: ATTENDANCE_TABLE,
      queries: [
        Query.equal("userId", userId.id),
        Query.isNull("checkOutAt"),
        Query.orderDesc("$createdAt"),
        Query.limit(1),
      ],
    });

    return res.total > 0 ? res.rows[0] : null;
  } catch (err) {
    console.log("GET CURRENT SHIFT ERROR:", err);
    return null;
  }
}

/* ----------------------------------------------------
    3️⃣  Mark CHECK-IN
---------------------------------------------------- */
export async function markCheckIn(
  latitude: number,
  longitude: number,
  workLocation: "GHCL" | "kajli",
) {
  try {
    const userId = await currentUser();
    const { tables } = await createAdminClient();

    // Prevent double check-in
    const activeShift = await getCurrentShift();
    if (activeShift) {
      return { ok: false, error: "Already checked in" };
    }

    const nowISO = new Date().toISOString();
    const today = nowISO.substring(0, 10);

    const newShift = await tables.createRow({
      databaseId: ATTENDANCE_DB,
      tableId: ATTENDANCE_TABLE,
      rowId: ID.unique(),
      data: {
        userId: userId.id,
        userName: userId.name,
        phoneNumber: userId.phone,

        date: today,
        checkInAt: nowISO,

        latitudeIn: latitude,
        longitudeIn: longitude,

        workLocation,
      },
    });

    return { ok: true, data: newShift };
  } catch (err) {
    console.log("CHECK IN ERROR:", err);
    return { ok: false, error: "Failed to check in" };
  }
}

/* ----------------------------------------------------
    4️⃣  Mark CHECK-OUT
---------------------------------------------------- */
export async function markCheckOut(latitude: number, longitude: number) {
  try {
    const activeShift = await getCurrentShift();

    if (!activeShift) {
      return { ok: false, error: "No active check-in found" };
    }

    const nowISO = new Date().toISOString();
    const { tables } = await createAdminClient();

    const updated = await tables.updateRow({
      databaseId: ATTENDANCE_DB,
      tableId: ATTENDANCE_TABLE,
      rowId: activeShift.$id,
      data: {
        checkOutAt: nowISO,
        latitudeOut: latitude,
        longitudeOut: longitude,
      },
    });

    return { ok: true, data: updated };
  } catch (err) {
    console.log("CHECK OUT ERROR:", err);
    return { ok: false, error: "Failed to check out" };
  }
}

export async function getMonthlyAttendanceSheet(month: number, year: number) {
  try {
    const { databases, account } = await createSessionClient();
    const user = await account.get();

    // Calculate First and Last ms of the month
    const startDate = new Date(year, month - 1, 1, 0, 0, 0).toISOString();
    // Day 0 of next month = last day of current month
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    const res = await databases.listDocuments(
      appwriteConfig.databaseId!,
      appwriteConfig.attendanceCollectionId!,
      [
        Query.equal("userId", user.$id),
        Query.greaterThanEqual("checkInAt", startDate),
        Query.lessThanEqual("checkInAt", endDate),
        Query.limit(100),
      ],
    );

    // Transform to a Map: { [day: number]: count }
    // Example: { 1: 1, 5: 2, 12: 1 } (Day 1 has 1 shift, Day 5 has 2 shifts...)
    const attendanceMap: Record<number, number> = {};

    res.documents.forEach((doc: any) => {
      // Parse the day from checkInAt string (YYYY-MM-DD...)
      const dateObj = new Date(doc.checkInAt);
      const day = dateObj.getDate();

      attendanceMap[day] = (attendanceMap[day] || 0) + 1;
    });

    return { success: true, data: attendanceMap };
  } catch (error: any) {
    console.error("Attendance Sheet Error:", error);
    return { success: false, data: {} };
  }
}
