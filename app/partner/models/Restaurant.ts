export default {};

export type Restaurant = {
  id: string;
  userId: string;          // ← CLAVE para el socio
  name: string;
  city: string;

  // captación
  whatsapp?: string;
  promo?: string;

  // control interno
  createdAt: number;
};
