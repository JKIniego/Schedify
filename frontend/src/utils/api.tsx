import { Platform } from "react-native";
import Constants from "expo-constants";
import { storage } from "./storage";

const getBaseUrl = () => {
  if (Platform.OS === "web") {
    return "http://localhost:8000/api";
  }
  
  if (Platform.OS === "android" && !Constants.isDevice) {
    return "http://${process.env.EXPO_PUBLIC_ANDROID_IP}:8000/api";
  }
  
  if (Platform.OS === "ios" && !Constants.isDevice) {
    return "http://localhost:8000/api";
  }
  
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ipAddress = hostUri.split(":")[0];
    return `http://${ipAddress}:8000/api`;
  }
  
  return "http://192.168.1.100:8000/api"; 
};

export const BASE_URL = getBaseUrl();

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

/**
 * Centralized fetch helper for standard API calls
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  const { requiresAuth = true, headers = {}, ...customConfig } = options;
  
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };
  
  if (requiresAuth) {
    const token = await storage.getItem("access_token");
    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    ...customConfig,
    headers: requestHeaders,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const contentType = response.headers.get("content-type");
    
    let data = null;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    }

    if (!response.ok) {
      let errorMessage = "An unexpected error occurred.";
      if (data) {
        if (data.detail) {
          errorMessage = data.detail;
        } else {
          const firstKey = Object.keys(data)[0];
          const val = data[firstKey];
          errorMessage = `${firstKey}: ${Array.isArray(val) ? val[0] : val}`;
        }
      }

      return { data: null, error: errorMessage, status: response.status };
    }

    return { data, error: null, status: response.status };
  } catch (err: any) {
    console.error("API Request Error:", err);
    return {
      data: null,
      error: "Network error. Please check your internet connection.",
      status: 0,
    };
  }
}