import { Dish } from '../models/Dish';
import { Restaurant } from '../models/Restaurant';

export interface ParsedMenuResult {
  restaurant: Partial<Restaurant>;
  dishes: Partial<Dish>[];
}

class MenuIngestionService {
  async parseMenu(_input: any): Promise<ParsedMenuResult> {
    // MOCK – luego IA real
    return {
      restaurant: {
        name: 'Restaurante Demo',
        city: 'Medellín',
        category: 'Restaurante',
      },
      dishes: [
        {
          name: 'Hamburguesa artesanal',
          price: 28000,
          available: true,
        },
        {
          name: 'Papas rústicas',
          price: 12000,
          available: true,
        },
      ],
    };
  }
}

export const menuIngestionService = new MenuIngestionService();

export default menuIngestionService;
