import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Dish } from "./models/Dish";
import { Restaurant } from "./models/Restaurant";
import { authService } from "./services/AuthService";
import { loadPartnerData, savePartnerData } from "./storage/partnerStorage";

export default function PartnerHomeScreen() {
  const router = useRouter();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [email, setEmail] = useState("");

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const currentUser = await authService.getCurrentUser();

        if (!currentUser) {
          router.replace("/partner/auth");
          return;
        }

        setEmail(currentUser.email);

        const data = await loadPartnerData();

        let myRestaurant =
          data.restaurants.find((r) => r.userId === currentUser.id) ?? null;

        // Migración temporal:
        // Si ya existía un restaurante viejo sin estar asociado al usuario actual,
        // lo asignamos a la sesión actual para no perder lo trabajado.
        if (!myRestaurant && data.restaurants.length > 0) {
          myRestaurant = data.restaurants[0];
          myRestaurant.userId = currentUser.id;
          await savePartnerData(data);
        }

        setRestaurant(myRestaurant);

        if (!myRestaurant) {
          setDishes([]);
          return;
        }

        const myDishes = data.dishes.filter(
          (dish) => dish.restaurantId === myRestaurant.id
        );

        setDishes(myDishes);
      }

      load();
    }, [router])
  );

  async function handleLogout() {
    await authService.logout();
    router.replace("/partner/auth");
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Panel del socio</Text>

      <Text style={styles.sessionText}>Sesión: {email || "Socio"}</Text>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>

      {!restaurant ? (
        <>
          <Text style={styles.subtitle}>
            Aún no has registrado tu restaurante.
          </Text>

          <Pressable
            style={styles.button}
            onPress={() => router.push("/partner/restaurant-form")}
          >
            <Text style={styles.buttonText}>Registrar restaurante</Text>
          </Pressable>
        </>
      ) : (
        <View style={styles.card}>
          <Text style={styles.label}>Restaurante</Text>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>

          <Text style={styles.info}>
            Ciudad: {restaurant.city || "Sin ciudad"}
          </Text>

          <Text style={styles.info}>
            Platos registrados: {dishes.length}
          </Text>

          <Pressable
            style={styles.button}
            onPress={() =>
              router.push({
                pathname: "/partner/add-dish",
                params: { restaurantId: restaurant.id },
              })
            }
          >
            <Text style={styles.buttonText}>Agregar plato</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryLight}
            onPress={() => router.push("/partner/dishes-list")}
          >
            <Text style={styles.secondaryText}>Ver / editar platos</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
  },
  sessionText: {
    color: "#666",
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: "#eee",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  logoutText: {
    fontWeight: "600",
    color: "#333",
  },
  subtitle: {
    color: "#666",
    marginBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 14,
    color: "#666",
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  info: {
    color: "#555",
    marginBottom: 6,
  },
  button: {
    backgroundColor: "#FF6A00",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  secondaryLight: {
    backgroundColor: "#eee",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  secondaryText: {
    fontWeight: "600",
    color: "#111",
  },
});