import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const API_URL =
  import.meta.env?.VITE_API_URL || "https://astu-express-api.astu-express-api.workers.dev";

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    adminClient(),
  ],
  fetchOptions: {
    credentials: "include",
  },
});

export const { useSession, signIn, signOut, signUp, admin } = authClient;
