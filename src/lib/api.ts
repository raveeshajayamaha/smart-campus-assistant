export type CampusRecord = { _id: string; [key: string]: string };
export type CampusUser = { id: string; name: string; email: string; role: string };
export function storedUser(): CampusUser | null {
  try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
}
export function clearAuth() { localStorage.removeItem("user"); localStorage.removeItem("token"); }
export async function api(path: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`/api${path}`, { ...options, signal: options.signal || controller.signal, headers: { "Content-Type": "application/json", ...(localStorage.getItem("token") ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : {}), ...options.headers } });
    const data = await response.json();
    if (response.status === 401) { clearAuth(); window.location.assign("/login"); }
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("Request timed out. Check the backend and try again.", { cause: error });
    throw error;
  } finally { window.clearTimeout(timer); }
}
export async function logout() {
  try { await api("/auth/logout", { method: "POST" }); }
  catch { /* Local session is always cleared, including when offline. */ }
  finally { clearAuth(); window.location.assign("/login"); }
}
