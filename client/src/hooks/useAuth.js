import { create } from "zustand";
import { api } from "../api";

export const useAuth = create((set) => ({
  user: null,
  token: localStorage.getItem("token"),
  loading: false,
  error: null,
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      set({ token: data.token, user: data.user, loading: false });
    } catch (err) {
      set({ loading: false, error: err.response?.data?.message || "Login failed" });
      throw err;
    }
  },
  register: async (payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post("/auth/register", payload);
      localStorage.setItem("token", data.token);
      set({ token: data.token, user: data.user, loading: false });
    } catch (err) {
      set({ loading: false, error: err.response?.data?.message || "Registration failed" });
      throw err;
    }
  },
  googleLogin: async (credential) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post("/auth/google", { credential });
      localStorage.setItem("token", data.token);
      set({ token: data.token, user: data.user, loading: false });
    } catch (err) {
      set({ loading: false, error: err.response?.data?.message || "Google login failed" });
      throw err;
    }
  },
  fetchMe: async () => {
    const { data } = await api.get("/auth/me");
    set({ user: data });
  },
  logout: () => {
    localStorage.removeItem("token");
    set({ token: null, user: null });
  },
  clearError: () => set({ error: null })
}));