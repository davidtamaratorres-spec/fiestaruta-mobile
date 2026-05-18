import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Dish } from "./models/Dish";
import { Restaurant } from "./models/Restaurant";
import { loadPartnerData } from "./storage/partnerStorage";

export default function PartnerHomeScreen() {
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const data = await loadPartnerData();

        const restaurants = data?.restaurants ?? [];
        const dishesData = data?.dishes ?? [];

        if (restaurants.length === 0) {
          setRestaurant(null);
          setDishes([]);
          return;
        }

        const r = restaurants[0];
        setRestaurant(r);

        const myDishes = dishesData.filter(
          (d) => d.restaurantId === r.id
        );

        setDishes(myDishes);
      }

      load();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panel del socio</Text>

      {!restaurant ? (
        <>
          <Text style={styles.subtitle}>
            Aún no has registrado tu restaurante
          </Text>

          <Pressable
            style={styles.button}
            onPress={() => router.push("/partner/restaurant-form")}
          >
            <Text style={styles.buttonText}>Registrar restaurante</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.label}>Restaurante</Text>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>

          <Text style={styles.subtitle}>
            Platos registrados: {dishes.length}
          </Text>

          <Pressable
            style={styles.button}
            onPress={() => router.push("/partner/add-dish")}
          >
            <Text style={styles.buttonText}>Agregar plato</Text>
          </Pressable>

          <Pressable
            style={styles.secondary}
            onPress={() => router.push("/partner/dishes-list")}
          >
            <Text style={styles.secondaryText}>Ver / editar platos</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#666",
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  subtitle: {
    color: "#666",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#FF6A00",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  secondary: {
    backgroundColor: "#eee",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  secondaryText: {
    fontWeight: "600",
  },
});
