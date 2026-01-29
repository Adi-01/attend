"use server";

import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/appwrite"; // Adjust path to your client creator
import { redirect } from "next/navigation";

const SESSION_COOKIE_NAME = "appwrite-session";
const LABEL_COOKIE_NAME = "user-label";
const USERNAME_COOKIE_NAME = "username";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function signInAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const { account, users } = await createAdminClient();

    // 1️⃣ Create session
    const session = await account.createEmailPasswordSession(email, password);

    // 2️⃣ Fetch logged-in user (ADMIN SAFE)
    const user = await users.get(session.userId);

    const label = user.labels?.[0] ?? ""; // "admin" or ""
    const username = user.name ?? ""; // display-only

    const cookieStore = await cookies();

    // 3️⃣ Session cookie
    cookieStore.set(SESSION_COOKIE_NAME, session.secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    // 4️⃣ Label cookie (middleware)
    cookieStore.set(LABEL_COOKIE_NAME, label, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    // 5️⃣ Username cookie (display-only)
    cookieStore.set(USERNAME_COOKIE_NAME, username, {
      httpOnly: true, // safe: read in server layout
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function logoutAction() {
  const { account } = await createAdminClient();

  try {
    await account.deleteSession({ sessionId: "current" });
  } catch {
    // ignore if session is already invalid
  }

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);

  redirect("/employee-login");
}

export async function sendPasswordRecovery(email: string) {
  try {
    const { account } = await createAdminClient();
    await account.createRecovery({
      email,
      url: "https://attend-theta-three.vercel.app/reset-password",
    });
    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error.message };
  }
}

export async function completePasswordRecovery(
  userId: string,
  secret: string,
  password: string,
  passwordAgain: string,
) {
  try {
    // Basic validation
    if (password !== passwordAgain) {
      return { success: false, error: "Passwords do not match" };
    }
    if (password.length < 8) {
      return {
        success: false,
        error: "Password must be at least 8 characters",
      };
    }

    const { account } = await createAdminClient();

    // Appwrite verifies the token (secret) and updates the password here
    await account.updateRecovery(userId, secret, password);

    return { success: true };
  } catch (error: any) {
    console.error("Reset Password Error:", error);
    return { success: false, error: error.message };
  }
}
