"use server";
import { ID, Query } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { revalidatePath } from "next/cache";
// ... import your createAdminClient

export async function getUsersList() {
  try {
    const { users } = await createAdminClient();

    // You can add Query.limit(50) or Query.offset() inside list() for pagination later
    const userList = await users.list({
      queries: [Query.orderDesc("$createdAt"), Query.limit(30)],
    });

    return {
      total: userList.total,
      users: userList.users,
    };
  } catch (error) {
    console.error("Error fetching user list:", error);
    return { total: 0, users: [] };
  }
}

export async function updateUserPhoneAction(userId: string, newPhone: string) {
  try {
    const { users } = await createAdminClient();

    // Fetch the user to get existing prefs so we don't overwrite other things
    const user = await users.get(userId);

    await users.updatePrefs(userId, {
      ...user.prefs,
      phone: newPhone,
    });

    revalidatePath("/users"); // Tells Next.js to refresh the page data
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function editUserAction(
  userId: string,
  data: { name: string; email: string; role: "admin" | "user"; phone: string },
) {
  try {
    const { users } = await createAdminClient();
    const user = await users.get(userId);

    // 1. Update Name (Only if changed)
    if (data.name !== user.name) {
      await users.updateName(userId, data.name);
    }

    // 2. Update Email (Only if changed)
    if (data.email !== user.email) {
      // Note: Admin SDK allows direct email updates without requiring the user's password
      await users.updateEmail(userId, data.email);
    }

    // 3. Update Role via Labels
    // Based on your sign-in action, role is driven by labels[0].
    const currentRole = user.labels?.includes("admin") ? "admin" : "user";
    if (data.role !== currentRole) {
      const newLabels = data.role === "admin" ? ["admin"] : [];
      await users.updateLabels(userId, newLabels);
    }

    // 4. Update Phone via Preferences
    const currentPhone = user.prefs?.phone || "";
    if (data.phone !== currentPhone) {
      await users.updatePrefs(userId, {
        ...user.prefs,
        phone: data.phone,
      });
    }

    revalidatePath("/users"); // Refresh the table
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Keep your deleteUserAction here as well...
export async function deleteUserAction(userId: string) {
  try {
    const { users } = await createAdminClient();
    await users.delete(userId);

    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createUserAction(data: {
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";
  phone: string;
}) {
  try {
    const { users } = await createAdminClient();

    // 1. Create the base user
    // Signature: create(userId, email, phone, password, name)
    // We pass undefined for phone to bypass Appwrite's strict format validation,
    // because we store the phone number in preferences instead.
    const newUser = await users.create(
      ID.unique(),
      data.email,
      undefined,
      data.password,
      data.name,
    );

    // 2. Set the role via Labels if they are an admin
    if (data.role === "admin") {
      await users.updateLabels(newUser.$id, ["admin"]);
    }

    // 3. Save the phone number into preferences
    if (data.phone) {
      await users.updatePrefs(newUser.$id, { phone: data.phone });
    }

    revalidatePath("/users"); // Refresh the table
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
