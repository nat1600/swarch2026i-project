"use server";

import authApi from "./authApi";
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

export async function registerUserAction(data: CreateUserPayload) {
  try {
    const response = await authApi.post("users/register", data);

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error(
      "Error during registration: ",
      error.response?.data || error.message,
    );

    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data.detail;

      if (status === 409)
        return { success: false, error: "User already exists" };
      if (status === 422) return { success: false, error: "Validation error" };

      return { success: false, error: detail };
    }
    return { success: false, error: "Server connection error" };
  }
}

export async function checkUserExistsAction() {
  try {
    const response = await authApi.get("users/exists");

    const responseData = response.data;

    if (!responseData || responseData.data === null) {
      return { exists: false, user: null };
    }

    return { exists: true, user: responseData.data };
  } catch (error: any) {
    console.error(
      "Error checking user existence: ",
      error.response?.data || error.message,
    );

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
