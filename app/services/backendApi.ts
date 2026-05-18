// app/services/backendApi.ts
const BASE_URL = "http://192.168.1.5:3000/api";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${path} ${text.slice(0, 200)}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    // por si alguna vez el backend responde texto
    return text as unknown as T;
  }
}

export function backendGet<T>(path: string): Promise<T> {
  return request<T>(path);
}

export function backendPost<T>(path: string, body: any): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
