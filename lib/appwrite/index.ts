"use server";

import {
  Client,
  Account,
  Avatars,
  Databases,
  Storage,
  TablesDB,
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
const adminClient = new Client()
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId)
  .setKey(appwriteConfig.secretKey);

const admin = {
  get account() {
    return new Account(adminClient);
  },
  get databases() {
    return new Databases(adminClient);
  },
  get storage() {
    return new Storage(adminClient);
  },
  get avatars() {
    return new Avatars(adminClient);
  },
  get tables() {
    return new TablesDB(adminClient);
  },
};

/**
 * Reusable optimized admin client
 */
export const createAdminClient = async () => admin;
