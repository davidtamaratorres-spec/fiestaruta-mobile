import { User } from '../models/User';
import { loadPartnerData, savePartnerData } from '../storage/partnerStorage';
import { generateId } from './id';

class AuthService {
  async login(email: string): Promise<User> {
    const data = await loadPartnerData();

    let user = data.users.find(u => u.email === email);

    if (!user) {
      user = {
        id: generateId(),
        email,
        role: 'partner',
        createdAt: new Date().toISOString(),
      };

      data.users.push(user);
      await savePartnerData(data);
    }

    return user;
  }
}

export const authService = new AuthService();
