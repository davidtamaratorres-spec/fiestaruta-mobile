import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Dish } from "./models/Dish";
import { Restaurant } from "./models/Restaurant";
import { authService } from "./services/AuthService";
import {
  loadPartnerData,
  savePartnerData,
} from "./storage/partnerStorage";

export default function DishesListScreen() {
  const router = useRouter();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const currentUser = await authService.getCurrentUser();

        if (!currentUser) {
          router.replace("/partner/auth");
          return;
        }

        const data = await loadPartnerData();

        const myRestaurant =
          data.restaurants.find((r) => r.userId === currentUser.id) ?? null;

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

  async function handleDelete(dishId: string) {
    Alert.alert(
      "Eliminar plato",
      "¿Seguro que deseas eliminar este plato?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const data = await loadPartnerData();

            data.dishes = data.dishes.filter((dish) => dish.id !== dishId);

            await savePartnerData(data);

            setDishes((prev) => prev.filter((dish) => dish.id !== dishId));
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis platos</Text>

      {restaurant ? (
        <Text style={styles.subtitle}>
          Restaurante: {restaurant.name}
        </Text>
      ) : (
        <Text style={styles.empty}>
          Aún no tienes restaurante registrado.
        </Text>
      )}

      {restaurant && dishes.length === 0 ? (
        <Text style={styles.empty}>
          No has agregado platos aún.
        </Text>
      ) : null}

      {restaurant && dishes.length > 0 ? (
        <FlatList
          data={dishes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.price}>${item.price}</Text>
              </View>

              <Pressable onPress={() => handleDelete(item.id)}>
                <Text style={styles.delete}>Eliminar</Text>
              </Pressable>
            </View>
          )}
        />
      ) : null}

      {restaurant ? (
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
      ) : (
        <Pressable
          style={styles.button}
          onPress={() => router.push("/partner/restaurant-form")}
        >
          <Text style={styles.buttonText}>Registrar restaurante</Text>
        </Pressable>
      )}

      <Pressable
        style={styles.secondaryButton}
        onPress={() => router.back()}
      >
        <Text style={styles.secondaryButtonText}>
          Volver al panel
        </Text>
      </Pressable>
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
    marginBottom: 8,
  },
  subtitle: {
    color: "#666",
    marginBottom: 16,
  },
  empty: {
    color: "#666",
    marginBottom: 20,
  },
  card: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontWeight: "600",
  },
  price: {
    color: "#444",
  },
  delete: {
    color: "#c00",
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#FF6A00",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  secondaryButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#eee",
    marginTop: 10,
  },
  secondaryButtonText: {
    fontWeight: "600",
  },
});