// app/services/api.ts

export const API_URL = "http://192.168.1.5:3000/api";

export async function apiFetch<T>(endpoint: string): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  console.log("📡 FETCH:", url);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  return response.json();
}
