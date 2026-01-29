"use server";

import {
  Client,
  Account,
  Databases,
  Storage,
  TablesDB,
  Users,
} from "node-appwrite";
import { cookies } from "next/headers";
import { appwriteConfig } from "@/lib/appwrite/config";

/**
 * Creates a server client using the user's session stored in cookies.
 * Used for authenticated user actions.
 */
export const createSessionClient = async () => {
  const cookieStore = await cookies();
  const session = cookieStore.get("appwrite-session");

  if (!session?.value) {
    throw new Error("No session found");
  }

  const client = new Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setSession(session.value);

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
  };
};

/**
 * Creates an admin client using API key.
 * Used for signup, login, email verification, file uploads, etc.
 */
export async function createAdminClient() {
  const client = new Client()
    .setEndpoint(appwriteConfig.endpoint!)
    .setProject(appwriteConfig.projectId!)
    .setKey(process.env.APPWRITE_KEY!);

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
    get users() {
      return new Users(client);
    },
    get tables() {
      return new TablesDB(client);
    },
    get storage() {
      return new Storage(client);
    },
  };
}
