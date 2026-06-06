import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { FiltersBar } from "../../components/FiltersBar";
import { BackendDish, fetchBackendDishes } from "../services/backendDishes";
import {
  BackendPromotion,
  fetchBackendPromotions,
} from "../services/backendPromotions";
import {
  BackendRestaurant,
  fetchBackendRestaurants,
} from "../services/backendRestaurants";
import { logDemand } from "../services/demand";

type DishItem = {
  dishId: string;
  name: string;
  price: number;
  restaurantId: number;
  restaurantName: string;
  city: string;
  hasDiscount: boolean;
  imageUrl?: string; // viene del backend
};

const PLACEHOLDER_IMG = require("../../assets/images/dish-placeholder.png");

// ✅ filename -> require(local)
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

// ✅ fallback por nombre (para demo)
function guessFilenameFromDishName(dishName: string): string | null {
  const n = norm(dishName);

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

  if (n.includes("lasa") || n.includes("lasaña")) return "lasana-vegana.jpg";

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
  // 1) Si backend trae imagen_url, lo intentamos por filename
  if (imageUrl && imageUrl.trim()) {
    const filename = imageUrl.trim().split("/").pop() || imageUrl.trim();
    return DISH_IMAGES[filename] ?? PLACEHOLDER_IMG;
  }

  // 2) Si viene vacío, adivinamos por nombre (demo)
  const guessed = guessFilenameFromDishName(dishName);
  if (guessed && DISH_IMAGES[guessed]) return DISH_IMAGES[guessed];

  return PLACEHOLDER_IMG;
}

function buildRestaurantMap(restaurants: BackendRestaurant[]) {
  const map = new Map<number, string>();
  for (const r of restaurants) {
    map.set(Number(r.id), r.nombre ?? `Restaurante #${r.id}`);
  }
  return map;
}

function buildDiscountRestaurantSet(promotions: BackendPromotion[]) {
  const set = new Set<number>();
  for (const p of promotions) {
    const rid = Number(p.restaurante_id);
    if (Number.isNaN(rid)) continue;

    const active =
      p.activa === 1 ||
      p.disponible === 1 ||
      (p.activa === undefined && p.disponible === undefined);

    if (active) set.add(rid);
  }
  return set;
}

export default function HomeScreen() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [city, setCity] = useState<string | null>(null);
  const [onlyDiscounts, setOnlyDiscounts] = useState(false);

  const [items, setItems] = useState<DishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData(mode: "initial" | "refresh") {
    if (mode === "initial") setLoading(true);
    if (mode === "refresh") setRefreshing(true);

    try {
      const [dishes, restaurants, promotions] = await Promise.all([
        fetchBackendDishes(),
        fetchBackendRestaurants(),
        fetchBackendPromotions(),
      ]);

      const rmap = buildRestaurantMap(restaurants);
      const discountRestaurants = buildDiscountRestaurantSet(promotions);

      const adapted: DishItem[] = (dishes as BackendDish[]).map((d) => {
        const rid = Number(d.restaurante_id);
        return {
          dishId: String(d.id),
          name: d.nombre,
          price: d.precio,
          restaurantId: rid,
          restaurantName: rmap.get(rid) ?? `Restaurante #${d.restaurante_id}`,
          city: d.municipio || d.ciudad || "",
          hasDiscount: discountRestaurants.has(rid),
          imageUrl: d.imagen_url || "",
        };
      });

      setItems(adapted);
    } catch (e) {
      console.log("Error cargando data:", e);
      if (mode === "initial") setItems([]);
    } finally {
      if (mode === "initial") setLoading(false);
      if (mode === "refresh") setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData("initial");
  }, []);

  const filteredItems = useMemo(() => {
    if (items.length === 0 && query.trim()) {
      logDemand(query, city);
    }

    const q = norm(query);
    const c = city ? norm(city) : null;

    return items
      .filter((i) => (q ? norm(i.name).includes(q) : true))
      .filter((i) => (c ? norm(i.city) === c : true))
      .filter((i) => (onlyDiscounts ? i.hasDiscount : true));
  }, [items, query, city, onlyDiscounts]);

  const cities = useMemo(
    () => [...new Set(items.map((i) => i.city).filter(Boolean))].sort() as string[],
    [items]
  );

  const hasActiveFilters = query.length > 0 || !!city || onlyDiscounts;

  const clearFilters = () => {
    setQuery("");
    setCity(null);
    setOnlyDiscounts(false);
    Keyboard.dismiss();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Cargando platos...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <Text style={styles.title}>🍽️ DishQuest</Text>

          <FiltersBar
            query={query}
            onQueryChange={setQuery}
            city={city}
            onCityChange={setCity}
            onlyDiscounts={onlyDiscounts}
            onToggleDiscounts={() => setOnlyDiscounts((v) => !v)}
            cities={cities}
          />

          {hasActiveFilters && (
            <View style={styles.activeBar}>
              <Text style={styles.activeText}>
                Filtros:
                {city ? ` Ciudad: ${city}` : ""}
                {onlyDiscounts ? " · Descuento" : ""}
                {query ? ` · “${query}”` : ""}
              </Text>

              <Pressable onPress={clearFilters}>
                <Text style={styles.clear}>Limpiar</Text>
              </Pressable>
            </View>
          )}

          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.dishId}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "on-drag" : "none"}
            onScrollBeginDrag={Keyboard.dismiss}
            contentContainerStyle={{ gap: 12, paddingBottom: 40 }}
            refreshing={refreshing}
            onRefresh={() => loadData("refresh")}
            renderItem={({ item }) => (
              <Pressable
                style={styles.card}
                onPress={() =>
                  router.push({
                    pathname: "/dish/[id]",
                    params: { id: item.dishId },
                  })
                }
              >
                <Image
                  source={pickLocalImage(item.imageUrl, item.name)}
                  style={styles.thumb}
                  resizeMode="cover"
                />

                <View style={styles.cardBody}>
                  <View style={styles.row}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.name}
                    </Text>

                    {item.hasDiscount && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>PROMO</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.sub} numberOfLines={1}>
                    {item.restaurantName}
                  </Text>

                  <Text style={styles.price}>${item.price}</Text>
                  <Text style={styles.city} numberOfLines={1}>
                    📍 {item.city}
                  </Text>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>No hay resultados.</Text>
            }
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 12 },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  activeBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  activeText: { fontSize: 12, color: "#333", flex: 1 },
  clear: { fontSize: 12, fontWeight: "600", color: "#000" },

  card: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f2f2f2",
  },

  thumb: {
    width: 74,
    height: 74,
    borderRadius: 12,
    backgroundColor: "#e6e6e6",
  },

  cardBody: { flex: 1 },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },

  badge: {
    backgroundColor: "#FF6A00",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 11,
  },

  name: { fontSize: 16, fontWeight: "700", flex: 1 },
  sub: { marginTop: 2, fontSize: 13, color: "#444" },
  price: { marginTop: 6, fontSize: 14 },
  city: { marginTop: 4, fontSize: 13, color: "#555" },

  empty: { textAlign: "center", marginTop: 30, color: "#666" },
});








