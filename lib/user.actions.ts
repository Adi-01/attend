"use server";

import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/appwrite";

export async function loginAction(email: string, password: string) {
  try {
    const { account } = await createAdminClient();

    // Create email session
    const session = await account.createEmailPasswordSession(email, password);

    // Set session cookie (HttpOnly)
    const cookieStore = await cookies();
    cookieStore.set("appwrite-session", session.secret, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Login error:", error);

    return {
      success: false,
      error: error?.message || "Login failed",
    };
  }
}
