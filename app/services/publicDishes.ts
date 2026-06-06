import { loadPartnerData } from "../partner/storage/partnerStorage";

export type PublicDish = {
  id: string;
  name: string;
  price: number;
  available: boolean;
  imageUri?: string;

  restaurantName: string;
  city: string;
};

export default { getPublicDishes };

export async function getPublicDishes(): Promise<PublicDish[]> {
  const data = await loadPartnerData();

  return data.dishes.map((dish) => {
    const restaurant = data.restaurants.find(
      (r) => r.id === dish.restaurantId
    );

    return {
      id: dish.id,
      name: dish.name,
      price: dish.price,
      available: dish.available,
      imageUri: dish.imageUri, // ✅ EXPLÍCITO

      restaurantName: restaurant?.name ?? "Restaurante",
      city: restaurant?.city ?? "",
    };
  });
}

