"use server";

import { auth0 } from "@/lib/auth0";

export interface CreateUserPayload {
  email: string;
  username: string;
  timezone: string;
  native_language: string;
  learning_language: string;
}

export interface Language {
  id: number;
  name: string;
}

export interface UserData {
  id: string;
  native_language: Language;
  learning_language: Language;
  email: string;
  accumulated_points: number;
  last_login_at: string;
}

const AUTH_GRAPHQL_URL =
  (process.env.SERVER_AUTH_URL ??
    process.env.NEXT_PUBLIC_AUTH_URL ??
    "http://localhost:8080/api/auth") + "/graphql";

async function authGraphqlFetch(
  query: string,
  variables?: Record<string, unknown>,
) {
  const { token } = await auth0.getAccessToken();
  const res = await fetch(AUTH_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  return res.json();
}

export async function registerUserAction(data: CreateUserPayload) {
  try {
    const result = await authGraphqlFetch(
      `mutation RegisterUser($input: CreateUserInput!) {
        registerUser(input: $input) {
          id
          auth0Id
          email
          username
        }
      }`,
      {
        input: {
          email: data.email,
          username: data.username,
          timezone: data.timezone,
          nativeLanguage: data.native_language,
          learningLanguage: data.learning_language,
        },
      },
    );

    if (result.errors) {
      const msg: string = result.errors[0]?.message ?? "Unknown error";
      if (msg.toLowerCase().includes("already exists"))
        return { success: false, error: "User already exists" };
      return { success: false, error: msg };
    }

    return { success: true, data: result.data?.registerUser };
  } catch (error: any) {
    console.error("Error during registration:", error.message);
    return { success: false, error: "Server connection error" };
  }
}

export async function checkUserExistsAction() {
  try {
    const result = await authGraphqlFetch(
      `query UserExists {
        userExists {
          id
          auth0Id
          email
          username
          timezone
          nativeLanguage { id name }
          learningLanguage { id name }
          accumulatedPoints
          lastLoginAt
        }
      }`,
    );

    if (result.errors || !result.data?.userExists) {
      return { exists: false, user: null };
    }

    const u = result.data.userExists;
    return {
      exists: true,
      user: {
        id: u.id,
        email: u.email,
        username: u.username,
        native_language: u.nativeLanguage,
        learning_language: u.learningLanguage,
        accumulated_points: u.accumulatedPoints,
        last_login_at: u.lastLoginAt,
      } as UserData,
    };
  } catch (error: any) {
    console.error("Error checking user existence:", error.message);
    return { exists: false, user: null };
  }
}

export async function getClientToken() {
  try {
    const { token } = await auth0.getAccessToken();
    return token;
  } catch (error) {
    console.error("Error occurred while fetching session:", error);
    return null;
  }
}
