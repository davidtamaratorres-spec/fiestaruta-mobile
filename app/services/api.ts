// app/services/api.ts

export const API_URL = "https://dishquest-backend.onrender.com";

export async function apiFetch<T>(endpoint: string): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  console.log("📡 FETCH:", url);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  return response.json();
}

export default { API_URL, apiFetch };
