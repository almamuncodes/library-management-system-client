import dns from "node:dns";
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (e) {}

import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/library_management";
const client = new MongoClient(uri);
const db = client.db("library_management");

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      phoneNumber: {
        type: "string",
        required: true,
        input: true,
      },
      role: {
        type: "string",
        defaultValue: "student",
        input: true,
      },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET || "grantabhaban-super-secret-key-32-chars-long-2026-auth",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: ["http://localhost:3000", "http://127.0.0.1:3000"],
});
