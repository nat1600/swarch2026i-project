import axios from "axios";
import { auth0 } from "@/lib/auth0";



const authApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

authApi.interceptors.request.use(async (config) => {
  try {
    const { token } = await auth0.getAccessToken()

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error("Error occurred while fetching session:", error);
  }
  return config;
});

export default authApi;
