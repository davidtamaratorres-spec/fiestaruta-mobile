// app/services/backendDishes.ts
import { backendGet, backendPost } from "./backendApi";

export type BackendDish = {
  id: number;
  restaurante_id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria?: string;
  imagen_url?: string;
  disponible: number;
  tiene_descuento?: number;
  porcentaje_descuento?: number;
  acepta_domicilio?: number;
  acepta_reserva?: number;
  ciudad?: string;
  municipio?: string;
  departamento?: string;
  codigo_dane?: string;
  restaurante?: string;
  whatsapp?: string;
  maps_url?: string;
  distancia_km?: number;
};

export type CreateBackendDishInput = {
  restaurante_id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria?: string;
  imagen_url?: string;
  disponible?: number;
};

export async function fetchBackendDishes(sort?: string): Promise<BackendDish[]> {
  const params = new URLSearchParams();
  if (sort) params.set("sort", sort);
  const qs = params.toString();
  return backendGet<BackendDish[]>(qs ? `/dishes?${qs}` : "/dishes");
}

export async function searchBackendDishes(
  q: string,
  lat?: number,
  lng?: number,
  sort?: string
): Promise<BackendDish[]> {
  if (!q.trim()) return [];
  const params = new URLSearchParams({ q: q.trim() });
  if (lat !== undefined) params.append("lat", String(lat));
  if (lng !== undefined) params.append("lng", String(lng));
  if (sort) params.append("sort", sort);
  return backendGet<BackendDish[]>(`/dishes/search?${params.toString()}`);
}

export async function fetchBackendDishById(id: number): Promise<BackendDish> {
  return backendGet<BackendDish>(`/dishes/${id}`);
}

export async function createBackendDish(
  input: CreateBackendDishInput
): Promise<{ ok: boolean; id: number | null }> {
  return backendPost<{ ok: boolean; id: number | null }>(`/dishes`, {
    restaurante_id: input.restaurante_id,
    nombre: input.nombre,
    descripcion: input.descripcion ?? "",
    precio: input.precio,
    categoria: input.categoria ?? "Test",
    imagen_url: input.imagen_url ?? "",
    disponible: input.disponible ?? 1,
  });
}
