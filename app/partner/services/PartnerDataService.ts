import { Dish } from '../models/Dish';
import { Restaurant } from '../models/Restaurant';
import { loadPartnerData, savePartnerData } from '../storage/partnerStorage';
import { generateId } from './id';

class PartnerDataService {
  async createRestaurant(
    userId: string,
    input: Omit<Restaurant, 'id' | 'createdAt' | 'userId'>
  ): Promise<Restaurant> {
    const data = await loadPartnerData();

    const restaurant: Restaurant = {
      id: generateId(),
      userId,
      createdAt: new Date().toISOString(),
      ...input,
    };

    data.restaurants.push(restaurant);
    await savePartnerData(data);

    return restaurant;
  }

  async addDish(
    restaurantId: string,
    input: Omit<Dish, 'id' | 'restaurantId'>
  ): Promise<Dish> {
    const data = await loadPartnerData();

    const dish: Dish = {
      id: generateId(),
      restaurantId,
      ...input,
    };

    data.dishes.push(dish);
    await savePartnerData(data);

    return dish;
  }

  async getRestaurantByUser(userId: string) {
    const data = await loadPartnerData();
    return data.restaurants.find(r => r.userId === userId);
  }

  async getDishesByRestaurant(restaurantId: string) {
    const data = await loadPartnerData();
    return data.dishes.filter(d => d.restaurantId === restaurantId);
  }
}

export const partnerDataService = new PartnerDataService();

export default partnerDataService;
