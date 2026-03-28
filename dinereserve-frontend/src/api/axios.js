import axios from "axios";
 
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://13.48.45.32.nip.io/api",
  headers: { "Content-Type": "application/json" }
});
 
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);
 
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
 
export default API;
