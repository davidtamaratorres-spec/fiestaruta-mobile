import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { backendGet } from "../services/backendApi";

type BackendDish = {
  id: number;
  restaurante_id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria?: string;
  imagen_url?: string;
  disponible: number;
  ciudad?: string;
};

type BackendRestaurant = {
  id: number;
  nombre: string;
  ciudad?: string;
  whatsapp?: string;
  direccion?: string;
};

const PLACEHOLDER_IMG = require("../../assets/images/dish-placeholder.png");

const DISH_IMAGES: Record<string, any> = {
  "ajiaco.jpg": require("../../assets/images/dishes/ajiaco.jpg"),
  "arroz-con-camarones.jpg": require("../../assets/images/dishes/arroz-con-camarones.jpg"),
  "bandeja-paisa.jpg": require("../../assets/images/dishes/bandeja-paisa.jpg"),
  "bowl-vegano-energetico.jpg": require("../../assets/images/dishes/bowl-vegano-energetico.jpg"),
  "burrito-mixto.jpg": require("../../assets/images/dishes/burrito-mixto.jpg"),
  "cafe-especial.jpg": require("../../assets/images/dishes/cafe-especial.jpg"),
  "cazuela-mariscos.jpg": require("../../assets/images/dishes/cazuela-mariscos.jpg"),
  "chorizo-artesanal.jpg": require("../../assets/images/dishes/chorizo-artesanal.jpg"),
  "churrasco-parrilla.jpg": require("../../assets/images/dishes/churrasco-parrilla.jpg"),
  "costillas-bbq.jpg": require("../../assets/images/dishes/costillas-bbq.jpg"),
  "desayuno-campesino.jpg": require("../../assets/images/dishes/desayuno-campesino.jpg"),
  "hamburguesa-artesanal.jpg": require("../../assets/images/dishes/hamburguesa-artesanal.jpg"),
  "hamburguesa-clasica.jpg": require("../../assets/images/dishes/hamburguesa-clasica.jpg"),
  "hamburguesa-doble.jpg": require("../../assets/images/dishes/hamburguesa-doble.jpg"),
  "hamburguesa-vegana.jpg": require("../../assets/images/dishes/hamburguesa-vegana.jpg"),
  "lasana-vegana.jpg": require("../../assets/images/dishes/lasana-vegana.jpg"),
  "mojarra-frita.jpg": require("../../assets/images/dishes/mojarra-frita.jpg"),
  "mondongo.jpg": require("../../assets/images/dishes/mondongo.jpg"),
  "mote-de-queso.jpg": require("../../assets/images/dishes/mote-de-queso.jpg"),
  "papas-artesanales.jpg": require("../../assets/images/dishes/papas-artesanales.jpg"),
  "pargo-rojo-frito.jpg": require("../../assets/images/dishes/pargo-rojo-frito.jpg"),
  "pasta-carbonara.jpg": require("../../assets/images/dishes/pasta-carbonara.jpg"),
  "perro-caliente-especial.jpg": require("../../assets/images/dishes/perro-caliente-especial.jpg"),
  "pizza-margarita.jpg": require("../../assets/images/dishes/pizza-margarita.jpg"),
  "punta-de-anca.jpg": require("../../assets/images/dishes/punta-de-anca.jpg"),
  "smoothie-antioxidante.jpg": require("../../assets/images/dishes/smoothie-antioxidante.jpg"),
  "tacos-al-pastor.jpg": require("../../assets/images/dishes/tacos-al-pastor.jpg"),
  "wrap-vegetal.jpg": require("../../assets/images/dishes/wrap-vegetal.jpg"),
};

function norm(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function guessFilenameFromDishName(dishName: string): string | null {
  const n = norm(dishName);

  // ✅ NUEVAS REGLAS (lo que te falló)
  if (n.includes("churrasco") || (n.includes("parrilla") && n.includes("carne")))
    return "churrasco-parrilla.jpg";
  if (n.includes("chorizo")) return "chorizo-artesanal.jpg";

  if (n.includes("bandeja")) return "bandeja-paisa.jpg";
  if (n.includes("ajiaco")) return "ajiaco.jpg";
  if (n.includes("mondongo")) return "mondongo.jpg";
  if (n.includes("mote")) return "mote-de-queso.jpg";

  if (n.includes("carbonara")) return "pasta-carbonara.jpg";
  if (n.includes("pizza") && n.includes("margarita")) return "pizza-margarita.jpg";

  if (n.includes("hamburguesa") && n.includes("doble")) return "hamburguesa-doble.jpg";
  if (n.includes("hamburguesa") && n.includes("vegana")) return "hamburguesa-vegana.jpg";
  if (n.includes("hamburguesa") && n.includes("artesanal")) return "hamburguesa-artesanal.jpg";
  if (n.includes("hamburguesa")) return "hamburguesa-clasica.jpg";

  if (n.includes("lasa") || n.includes("lasana") || n.includes("lasaña"))
    return "lasana-vegana.jpg";

  if (n.includes("mojarra")) return "mojarra-frita.jpg";
  if (n.includes("pargo")) return "pargo-rojo-frito.jpg";
  if (n.includes("cazuela")) return "cazuela-mariscos.jpg";

  if (n.includes("desayuno")) return "desayuno-campesino.jpg";
  if (n.includes("cafe")) return "cafe-especial.jpg";
  if (n.includes("smoothie")) return "smoothie-antioxidante.jpg";

  if (n.includes("wrap")) return "wrap-vegetal.jpg";
  if (n.includes("papas")) return "papas-artesanales.jpg";
  if (n.includes("tacos")) return "tacos-al-pastor.jpg";
  if (n.includes("burrito")) return "burrito-mixto.jpg";

  return null;
}

function pickLocalImage(imageUrl: string | undefined, dishName: string) {
  if (imageUrl && imageUrl.trim()) {
    const filename = imageUrl.trim().split("/").pop() || imageUrl.trim();
    return DISH_IMAGES[filename] ?? PLACEHOLDER_IMG;
  }

  const guessed = guessFilenameFromDishName(dishName);
  if (guessed && DISH_IMAGES[guessed]) return DISH_IMAGES[guessed];

  return PLACEHOLDER_IMG;
}

export default function DishDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [dish, setDish] = useState<BackendDish | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const idNum = useMemo(() => Number(id), [id]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        setRestaurantName("");

        if (!id || Number.isNaN(idNum)) {
          throw new Error("ID inválido");
        }

        const dishData = await backendGet<BackendDish>(`/dishes/${idNum}`);
        if (!active) return;

        setDish(dishData);

        try {
          const rid = Number(dishData.restaurante_id);
          if (!Number.isNaN(rid)) {
            const r = await backendGet<BackendRestaurant>(`/restaurants/${rid}`);
            if (!active) return;
            setRestaurantName(r?.nombre ?? "");
          }
        } catch {
          try {
            const rid = Number(dishData.restaurante_id);
            const list = await backendGet<BackendRestaurant[]>(`/restaurants`);
            if (!active) return;
            const found = list.find((r) => Number(r.id) === rid);
            setRestaurantName(found?.nombre ?? "");
          } catch {
            setRestaurantName("");
          }
        }
      } catch (e: any) {
        if (active) {
          setDish(null);
          setRestaurantName("");
          setError(e?.message || "Error cargando detalle");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [id, idNum]);

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} hitSlop={10}>
        <Text style={styles.back}>← Volver</Text>
      </Pressable>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.muted}>Cargando plato...</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
        </View>
      )}

      {!loading && !error && dish && (
        <View style={styles.card}>
          <Image
            source={pickLocalImage(dish.imagen_url, dish.nombre)}
            style={styles.hero}
            resizeMode="cover"
          />

          <Text style={styles.name}>{dish.nombre}</Text>
          <Text style={styles.price}>${dish.precio}</Text>

          <Text style={styles.meta}>
            📍 {dish.ciudad || "Sin ciudad"}
            {dish.categoria ? ` · ${dish.categoria}` : ""}
          </Text>

          <Text style={styles.sectionTitle}>Restaurante</Text>
          <Text style={styles.desc}>
            {restaurantName?.trim()
              ? restaurantName
              : `Restaurante #${dish.restaurante_id}`}
          </Text>

          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.desc}>
            {dish.descripcion?.trim()
              ? dish.descripcion
              : "Este plato no tiene descripción aún."}
          </Text>

          <Text style={styles.mutedSmall}>
            Disponible: {dish.disponible ? "Sí" : "No"}
          </Text>

          <Pressable style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Volver</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  back: { fontSize: 14, marginBottom: 12, fontWeight: "600" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },

  card: { padding: 14, borderRadius: 12, backgroundColor: "#f2f2f2" },

  hero: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    backgroundColor: "#e6e6e6",
    marginBottom: 12,
  },

  name: { fontSize: 22, fontWeight: "700" },
  price: { marginTop: 6, fontSize: 16, fontWeight: "700" },
  meta: { marginTop: 8, fontSize: 13, color: "#555" },

  sectionTitle: { marginTop: 14, fontSize: 14, fontWeight: "700" },
  desc: { marginTop: 6, fontSize: 14, color: "#333" },

  muted: { color: "#666" },
  mutedSmall: { marginTop: 12, fontSize: 12, color: "#666" },
  error: { color: "red", fontWeight: "600" },

  button: {
    marginTop: 24,
    backgroundColor: "#FF6A00",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
});