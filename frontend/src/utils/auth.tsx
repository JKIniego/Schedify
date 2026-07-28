import { apiRequest } from "./api";

export const auth = {
  register: (payload: { username: string; email: string; password: string }) => {
    return apiRequest("/accounts/register/", {
      method: "POST",
      body: JSON.stringify(payload),
      requiresAuth: false,
    });
  },
  
  login: (email: string, password: string) => {
    return apiRequest("/accounts/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      requiresAuth: false,
    });
  },
  
  getCurrentUser: () => {
    return apiRequest("/accounts/me/", {
      method: "GET",
      requiresAuth: true,
    });
  },
};