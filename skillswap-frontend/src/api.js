// src/api.js
import axios from "axios";

function normalizeBase(url) {
  const u = (url || "").trim();
  if (!u) throw new Error("REACT_APP_API_URL is missing");
  if (!/^https?:\/\//i.test(u)) throw new Error("REACT_APP_API_URL must start with http:// or https://");
  return u.endsWith("/") ? u.slice(0, -1) : u;
}

export const API_BASE = normalizeBase(process.env.REACT_APP_API_URL);

const api = axios.create({
  baseURL: API_BASE,          // e.g. https://your-backend.onrender.com
  withCredentials: true,      // keep if you use cookies
  headers: { "Content-Type": "application/json" }
});

export default api;
