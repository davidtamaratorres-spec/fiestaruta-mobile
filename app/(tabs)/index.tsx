import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { getPublicDishes } from "../services/publicDishes";
import {
  BackendDish,
  fetchBackendDishes,
  searchBackendDishes,
} from "../services/backendDishes";
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
  restaurantId: string;
  restaurantName: string;
  city: string;
  hasDiscount: boolean;
  tieneDescuento: boolean;
  porcentajeDescuento: number;
  aceptaDomicilio: boolean;
  aceptaReserva: boolean;
  imageUrl?: string;
  imageUri?: string;
  source: "backend" | "local";
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
  return s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

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
  if (n.includes("lasa")) return "lasana-vegana.jpg";
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

function pickImageSource(item: DishItem) {
  if (item.imageUri) return { uri: item.imageUri };
  if (item.imageUrl && item.imageUrl.startsWith("http")) return { uri: item.imageUrl };
  return pickLocalImage(item.imageUrl, item.name);
}

function buildRestaurantMap(restaurants: BackendRestaurant[]) {
  const map = new Map<number, string>();
  for (const r of restaurants) map.set(Number(r.id), r.nombre ?? `Restaurante #${r.id}`);
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

function dishToItem(
  d: BackendDish,
  rmap: Map<number, string>,
  discountSet: Set<number>
): DishItem {
  const rid = Number(d.restaurante_id);
  const tieneDescuento = Boolean(d.tiene_descuento);
  return {
    dishId: String(d.id),
    name: d.nombre,
    price: d.precio,
    restaurantId: String(rid),
    restaurantName: rmap.get(rid) ?? d.restaurante ?? `Restaurante #${d.restaurante_id}`,
    city: d.municipio || d.ciudad || "",
    hasDiscount: discountSet.has(rid) || tieneDescuento,
    tieneDescuento,
    porcentajeDescuento: Number(d.porcentaje_descuento) || 0,
    aceptaDomicilio: Boolean(d.acepta_domicilio),
    aceptaReserva: Boolean(d.acepta_reserva),
    imageUrl: d.imagen_url || "",
    source: "backend",
  };
}

export default function HomeScreen() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [city, setCity] = useState<string | null>(null);
  const [onlyDiscounts, setOnlyDiscounts] = useState(false);

  const [items, setItems] = useState<DishItem[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchResults, setSearchResults] = useState<DishItem[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rmapRef = useRef<Map<number, string>>(new Map());
  const discountSetRef = useRef<Set<number>>(new Set());

  async function loadData(mode: "initial" | "refresh") {
    if (mode === "initial") setLoading(true);
    if (mode === "refresh") setRefreshing(true);

    try {
      const [dishes, restaurants, promotions, localDishes] = await Promise.all([
        fetchBackendDishes(),
        fetchBackendRestaurants(),
        fetchBackendPromotions(),
        getPublicDishes(),
      ]);

      const rmap = buildRestaurantMap(restaurants);
      const discountSet = buildDiscountRestaurantSet(promotions);
      rmapRef.current = rmap;
      discountSetRef.current = discountSet;

      const uniqueCities = Array.from(
        new Set(restaurants.map((r) => r.ciudad ?? "").filter(Boolean))
      ).sort();
      setCities(uniqueCities);

      const backendItems = (dishes as BackendDish[]).map((d) =>
        dishToItem(d, rmap, discountSet)
      );

      const localItems: DishItem[] = localDishes
        .filter((d: any) => d.available !== false)
        .map((d: any) => ({
          dishId: `local-${d.id}`,
          name: d.name,
          price: Number(d.price) || 0,
          restaurantId: String(d.restaurantId),
          restaurantName: d.restaurantName || "Restaurante local",
          city: d.city || "",
          hasDiscount: Boolean(d.promo),
          tieneDescuento: false,
          porcentajeDescuento: 0,
          aceptaDomicilio: false,
          aceptaReserva: false,
          imageUri: d.imageUri,
          source: "local" as const,
        }));

      setItems([...localItems, ...backendItems]);
    } catch {
      if (mode === "initial") setItems([]);
    } finally {
      if (mode === "initial") setLoading(false);
      if (mode === "refresh") setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData("initial");
  }, []);

  // Búsqueda predictiva con debounce 300ms
  useEffect(() => {
    const q = query.trim();

    if (!q) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchBackendDishes(q);
        const mapped = results.map((d) =>
          dishToItem(d, rmapRef.current, discountSetRef.current)
        );
        setSearchResults(mapped);
        if (mapped.length === 0) logDemand(q, city);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, city]);

  const filteredItems = useMemo(() => {
    const base = searchResults !== null ? searchResults : items;
    const c = city ? norm(city) : null;
    return base
      .filter((i) => (c ? norm(i.city) === c : true))
      .filter((i) => (onlyDiscounts ? i.hasDiscount : true));
  }, [items, searchResults, city, onlyDiscounts]);

  const hasActiveFilters = query.length > 0 || !!city || onlyDiscounts;

  function clearFilters() {
    setQuery("");
    setCity(null);
    setOnlyDiscounts(false);
    setSearchResults(null);
    Keyboard.dismiss();
  }

  function openDish(item: DishItem) {
    if (item.source === "backend") {
      router.push({
        pathname: "/dish/[id]",
        params: {
          id: item.dishId,
          ciudad_usuario: city || item.city || "",
        },
      });
      return;
    }
    alert("Este plato fue creado localmente. El detalle público se conectará pronto.");
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6A00" />
        <Text style={{ marginTop: 10, color: "#666" }}>Cargando platos...</Text>
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
            isSearching={isSearching}
          />

          {hasActiveFilters && (
            <View style={styles.activeBar}>
              <Text style={styles.activeText}>
                {query ? `"${query}"` : ""}
                {city ? ` · ${city}` : ""}
                {onlyDiscounts ? " · Descuento" : ""}
                {searchResults !== null
                  ? ` · ${filteredItems.length} resultado${filteredItems.length !== 1 ? "s" : ""}`
                  : ""}
              </Text>
              <Pressable onPress={clearFilters}>
                <Text style={styles.clear}>Limpiar</Text>
              </Pressable>
            </View>
          )}

          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.dishId}
            refreshing={refreshing}
            onRefresh={() => loadData("refresh")}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 20, gap: 12 }}
            renderItem={({ item }) => (
              <Pressable style={styles.card} onPress={() => openDish(item)}>
                <Image source={pickImageSource(item)} style={styles.thumb} />
                <View style={styles.cardBody}>
                  <View style={styles.row}>
                    <Text style={styles.name}>{item.name}</Text>
                    {item.tieneDescuento && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {item.porcentajeDescuento > 0 ? `${item.porcentajeDescuento}% OFF` : "PROMO"}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.sub}>{item.restaurantName}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>${item.price.toLocaleString("es-CO")}</Text>
                    {item.tieneDescuento && item.porcentajeDescuento > 0 && (
                      <Text style={styles.priceOriginal}>
                        ${Math.round(item.price / (1 - item.porcentajeDescuento / 100)).toLocaleString("es-CO")}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.city}>{item.city}</Text>
                  {(item.aceptaDomicilio || item.aceptaReserva) && (
                    <View style={styles.actionsRow}>
                      {item.aceptaDomicilio && (
                        <Pressable
                          style={styles.actionBtn}
                          onPress={(e) => { e.stopPropagation(); openDish(item); }}
                          hitSlop={8}
                        >
                          <Text style={styles.actionBtnText}>🛵 Domicilio</Text>
                        </Pressable>
                      )}
                      {item.aceptaReserva && (
                        <Pressable
                          style={[styles.actionBtn, styles.reservaBtn]}
                          onPress={(e) => { e.stopPropagation(); openDish(item); }}
                          hitSlop={8}
                        >
                          <Text style={[styles.actionBtnText, styles.reservaBtnText]}>📅 Reservar</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                  {item.source === "local" && (
                    <Text style={styles.localTag}>Plato registrado por socio</Text>
                  )}
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {isSearching ? "Buscando..." : "No hay resultados."}
              </Text>
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
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  clear: { fontSize: 12, fontWeight: "600", color: "#FF6A00" },
  card: { flexDirection: "row", gap: 12, padding: 12, borderRadius: 12, backgroundColor: "#f2f2f2" },
  thumb: { width: 74, height: 74, borderRadius: 12, backgroundColor: "#e6e6e6" },
  cardBody: { flex: 1 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  badge: { backgroundColor: "#FF6A00", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText: { color: "#fff", fontWeight: "700", fontSize: 11 },
  name: { fontSize: 16, fontWeight: "700", flex: 1 },
  sub: { marginTop: 2, fontSize: 13, color: "#444" },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  price: { fontSize: 14, fontWeight: "700", color: "#FF6A00" },
  priceOriginal: { fontSize: 12, color: "#aaa", textDecorationLine: "line-through" },
  city: { marginTop: 4, fontSize: 13, color: "#555" },
  actionsRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  actionBtn: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#FF6A00",
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  reservaBtn: { backgroundColor: "#111" },
  reservaBtnText: { color: "#fff" },
  localTag: { marginTop: 6, fontSize: 12, fontWeight: "600", color: "#FF6A00" },
  empty: { textAlign: "center", marginTop: 30, color: "#666" },
});
