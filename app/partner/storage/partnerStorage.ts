import AsyncStorage from "@react-native-async-storage/async-storage";
import { Dish } from "../models/Dish";
import { Restaurant } from "../models/Restaurant";
import { User } from "../models/User";

const STORAGE_KEY = "partner_data";

type PartnerData = {
  users: User[];
  restaurants: Restaurant[];
  dishes: Dish[];
};

export async function loadPartnerData(): Promise<PartnerData> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return {
      users: [],
      restaurants: [],
      dishes: [],
    };
  }

  const parsed = JSON.parse(raw);

  return {
    users: parsed.users ?? [],
    restaurants: parsed.restaurants ?? [],
    dishes: parsed.dishes ?? [],
  };
}

export async function savePartnerData(data: PartnerData) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function saveRestaurant(restaurant: Restaurant) {
  const data = await loadPartnerData();
  const existing = data.restaurants.find((r) => r.id === restaurant.id);

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
    data.restaurants.map((r) => [r.id, r])
  );

  return data.dishes.map((d) => {
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