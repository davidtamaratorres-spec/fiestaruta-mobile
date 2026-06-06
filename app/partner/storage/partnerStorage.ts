import AsyncStorage from "@react-native-async-storage/async-storage";
import { Dish } from "../models/Dish";
import { Restaurant } from "../models/Restaurant";

const STORAGE_KEY = "partner_data";

type PartnerData = {
  restaurants: Restaurant[];
  dishes: Dish[];
};

export async function loadPartnerData(): Promise<PartnerData> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { restaurants: [], dishes: [] };
  }
  return JSON.parse(raw);
}

export async function savePartnerData(data: PartnerData) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function saveRestaurant(restaurant: Restaurant) {
  const data = await loadPartnerData();
  const existing = data.restaurants.find(r => r.id === restaurant.id);

  if (existing) {
    Object.assign(existing, restaurant);
  } else {
    data.restaurants.push(restaurant);
  }

  await savePartnerData(data);
}

export async function addDish(dish: Dish) {
  const data = await loadPartnerData();
  data.dishes.push(dish);
  await savePartnerData(data);
}

export async function getPublicDishes() {
  const data = await loadPartnerData();

  const restaurantMap = Object.fromEntries(
    data.restaurants.map(r => [r.id, r])
  );

  return data.dishes.map(d => {
    const r = restaurantMap[d.restaurantId];
    return {
      ...d,
      restaurantName: r?.name ?? "",
      city: r?.city ?? "",
      whatsapp: r?.whatsapp,
      promo: r?.promo,
    };
  });
}

export default { loadPartnerData, savePartnerData, saveRestaurant, addDish, getPublicDishes };

