import AsyncStorage from "@react-native-async-storage/async-storage";

import { User } from "../models/User";
import { loadPartnerData, savePartnerData } from "../storage/partnerStorage";
import { generateId } from "./id";

const CURRENT_USER_KEY = "partner_current_user";

class AuthService {
  async register(email: string, password: string): Promise<User> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      throw new Error("Correo y contraseña son obligatorios");
    }

    if (cleanPassword.length < 4) {
      throw new Error("La contraseña debe tener mínimo 4 caracteres");
    }

    const data = await loadPartnerData();

    const existingUser = data.users.find((u) => u.email === cleanEmail);

    if (existingUser) {
      throw new Error("Ya existe un usuario registrado con ese correo");
    }

    const user: User = {
      id: generateId(),
      email: cleanEmail,
      password: cleanPassword,
      role: "partner",
      createdAt: new Date().toISOString(),
    };

    data.users.push(user);
    await savePartnerData(data);
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

    return user;
  }

  async login(email: string, password: string): Promise<User | null> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    const data = await loadPartnerData();

    const user = data.users.find(
      (u) => u.email === cleanEmail && u.password === cleanPassword
    );

    if (!user) {
      return null;
    }

    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

    return user;
  }

  async getCurrentUser(): Promise<User | null> {
    const raw = await AsyncStorage.getItem(CURRENT_USER_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
  }
}

export const authService = new AuthService();