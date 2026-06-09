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
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  FadeInDown,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";

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
import { BASE_URL } from "../services/backendApi";

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
  created_at?: string;
  distancia_km?: number;
};

type FilterChip = "popular" | "nearby" | "new";

const FILTERS: { key: FilterChip; label: string }[] = [
  { key: "popular", label: "Populares" },
  { key: "nearby", label: "Cerca de ti" },
  { key: "new", label: "Nuevos" },
];

const CITIES = [
  "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena",
  "Bucaramanga", "Pereira", "Manizales", "Santa Marta", "Cúcuta",
  "Ibagué", "Sincelejo", "Montería", "Valledupar", "Pasto",
  "Neiva", "Armenia", "Villavicencio", "Popayán", "Tunja",
];

function normCity(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

function pickImageSource(item: DishItem): { uri: string } | null {
  if (item.imageUri) return { uri: item.imageUri };
  if (item.imageUrl?.startsWith("/uploads")) return { uri: BASE_URL + item.imageUrl };
  if (item.imageUrl?.startsWith("http")) return { uri: item.imageUrl };
  return null;
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

function isNewDish(createdAt: string | undefined): boolean {
  if (!createdAt) return false;
  const diff = Date.now() - new Date(createdAt).getTime();
  return diff / (1000 * 60 * 60 * 24) < 7;
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
    created_at: (d as any).created_at,
    distancia_km: d.distancia_km,
  };
}

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<DishItem>);

export default function HomeScreen() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterChip>("popular");
  const [items, setItems] = useState<DishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchResults, setSearchResults] = useState<DishItem[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [cityInput, setCityInput] = useState("");
  const [citySelected, setCitySelected] = useState<string | null>(null);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rmapRef = useRef<Map<number, string>>(new Map());
  const discountSetRef = useRef<Set<number>>(new Set());
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => { scrollY.value = e.contentOffset.y; },
  });

  const headerStyle = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [0, 60], [100, 56], "clamp"),
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 40], [1, 0], "clamp"),
  }));

  const filteredCities = useMemo(() => {
    if (!cityInput.trim()) return CITIES;
    return CITIES.filter((c) => normCity(c).includes(normCity(cityInput)));
  }, [cityInput]);

  async function loadData(mode: "initial" | "refresh") {
    if (mode === "initial") setLoading(true);
    else setRefreshing(true);
    try {
      const [dishes, restaurants, promotions, localDishes] = await Promise.all([
        fetchBackendDishes("popular"),
        fetchBackendRestaurants(),
        fetchBackendPromotions(),
        getPublicDishes(),
      ]);
      const rmap = buildRestaurantMap(restaurants);
      const discountSet = buildDiscountRestaurantSet(promotions);
      rmapRef.current = rmap;
      discountSetRef.current = discountSet;

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
      else setRefreshing(false);
    }
  }

  useEffect(() => { loadData("initial"); }, []);

  // Fix 2 — geolocalización con log de debug
  useEffect(() => {
    async function getLocation() {
      console.log("pidiendo ubicacion...");
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        console.log("ubicacion obtenida:", loc.coords.latitude, loc.coords.longitude);
      } else {
        console.log("permiso de ubicacion denegado:", status);
      }
    }
    getLocation();
  }, []);

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
        const sort = activeFilter === "popular" ? "popular" : undefined;
        const results = await searchBackendDishes(q, userLocation?.lat, userLocation?.lng, sort);
        const mapped = results.map((d) =>
          dishToItem(d, rmapRef.current, discountSetRef.current)
        );
        setSearchResults(mapped);
        if (mapped.length === 0) logDemand(q, null);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, userLocation, activeFilter]);

  const filteredItems = useMemo(() => {
    let base = searchResults !== null ? searchResults : items;

    // Fix 3 — filtro por ciudad seleccionada
    if (citySelected) {
      const norm = normCity(citySelected);
      base = base.filter((i) => normCity(i.city).includes(norm));
    }

    // Fix 4 — chip "Populares" → servidor ya ordenó por views
    // chip "Cerca de ti" → ordenar por distancia
    if (activeFilter === "new") return base.filter((i) => isNewDish(i.created_at));
    if (activeFilter === "nearby") {
      return [...base].sort((a, b) => {
        if (a.distancia_km !== undefined && b.distancia_km !== undefined)
          return a.distancia_km - b.distancia_km;
        if (a.distancia_km !== undefined) return -1;
        if (b.distancia_km !== undefined) return 1;
        return 0;
      });
    }
    return base;
  }, [items, searchResults, activeFilter, citySelected]);

  function openDish(item: DishItem) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (item.source === "backend") {
      router.push(`/dish/${item.dishId}`);
      return;
    }
    alert("Este plato fue creado localmente. El detalle público se conectará pronto.");
  }

  function closeCityDropdown() {
    setCityDropdownOpen(false);
    Keyboard.dismiss();
  }

  if (loading) {
    return (
      <View style={s.loadingWrap}>
        <ActivityIndicator size="large" color="#E8521A" />
        <Text style={s.loadingText}>Cargando platos...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback
        onPress={closeCityDropdown}
        accessible={false}
      >
        <View style={s.root}>
          {/* Header oscuro animado */}
          <Animated.View style={[s.header, headerStyle]}>
            <Text style={s.headerTitle}>DishQuest</Text>
            <Animated.Text style={[s.headerSub, subtitleStyle]}>
              Encuentra el plato que tienes antojo
            </Animated.Text>
          </Animated.View>

          {/* Buscador */}
          <View style={s.searchWrap}>
            <View style={s.searchBox}>
              <Text style={s.searchIcon}>🔍</Text>
              <TextInput
                style={s.searchInput}
                placeholder="Buscar platos, restaurantes..."
                placeholderTextColor="rgba(255,255,255,0.30)"
                value={query}
                onChangeText={setQuery}
                onFocus={() => setCityDropdownOpen(false)}
              />
              {query.length > 0 && (
                <Pressable hitSlop={10} onPress={() => { setQuery(""); setSearchResults(null); }}>
                  <Text style={s.clearX}>✕</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Chips de filtro */}
          <View style={s.chips}>
            {FILTERS.map((f) => (
              <Pressable
                key={f.key}
                style={[s.chip, activeFilter === f.key && s.chipOn]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveFilter(f.key);
                  setCityDropdownOpen(false);
                }}
              >
                <Text style={[s.chipText, activeFilter === f.key && s.chipTextOn]}>
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Fix 3 — Filtro ciudad predictivo */}
          <View style={s.cityWrap}>
            <View style={s.cityBox}>
              <Text style={s.cityIcon}>🏙️</Text>
              <TextInput
                style={s.cityInput}
                placeholder="Ciudad..."
                placeholderTextColor="rgba(255,255,255,0.30)"
                value={citySelected ?? cityInput}
                onChangeText={(t) => {
                  setCitySelected(null);
                  setCityInput(t);
                  setCityDropdownOpen(t.length > 0);
                }}
                onFocus={() => {
                  if (!citySelected) setCityDropdownOpen(cityInput.length > 0 || true);
                }}
              />
              {(citySelected !== null || cityInput.length > 0) && (
                <Pressable
                  hitSlop={10}
                  onPress={() => {
                    setCitySelected(null);
                    setCityInput("");
                    setCityDropdownOpen(false);
                  }}
                >
                  <Text style={s.clearX}>✕</Text>
                </Pressable>
              )}
            </View>

            {cityDropdownOpen && filteredCities.length > 0 && (
              <View style={s.cityDropdown}>
                {filteredCities.slice(0, 8).map((city) => (
                  <Pressable
                    key={city}
                    style={s.cityOption}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCitySelected(city);
                      setCityInput("");
                      setCityDropdownOpen(false);
                      Keyboard.dismiss();
                    }}
                  >
                    <Text style={s.cityOptionText}>📍 {city}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Lista */}
          <AnimatedFlatList
            data={filteredItems}
            keyExtractor={(item) => item.dishId}
            refreshing={refreshing}
            onRefresh={() => loadData("refresh")}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.listPad}
            renderItem={({ item, index }) => {
              const src = pickImageSource(item);
              return (
                <Animated.View entering={FadeInDown.delay(Math.min(index, 12) * 65)}>
                  <Pressable
                    style={s.card}
                    onPress={() => openDish(item)}
                    onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  >
                    {src ? (
                      <Image source={src} style={s.thumb} resizeMode="cover" />
                    ) : (
                      <LinearGradient colors={["#E8521A", "#FF8C42"]} style={s.thumb}>
                        <Text style={s.thumbLetter}>
                          {item.name.charAt(0).toUpperCase()}
                        </Text>
                      </LinearGradient>
                    )}

                    <View style={s.cardBody}>
                      <View style={s.nameRow}>
                        <Text style={s.dishName} numberOfLines={1}>{item.name}</Text>
                        {item.hasDiscount && (
                          <View style={s.badgeHot}>
                            <Text style={s.badgeText}>Más pedido</Text>
                          </View>
                        )}
                        {isNewDish(item.created_at) && (
                          <View style={s.badgeNew}>
                            <Text style={s.badgeText}>Nuevo</Text>
                          </View>
                        )}
                      </View>
                      <Text style={s.restaurant} numberOfLines={1}>
                        {item.restaurantName}
                      </Text>
                      <View style={s.priceRow}>
                        <Text style={s.price}>
                          ${item.price.toLocaleString("es-CO")}
                        </Text>
                        {item.tieneDescuento && item.porcentajeDescuento > 0 && (
                          <Text style={s.priceStrike}>
                            ${Math.round(
                              item.price / (1 - item.porcentajeDescuento / 100)
                            ).toLocaleString("es-CO")}
                          </Text>
                        )}
                      </View>
                      {(item.city || item.distancia_km !== undefined) ? (
                        <Text style={s.location} numberOfLines={1}>
                          {item.distancia_km !== undefined
                            ? `📍 ${item.distancia_km.toFixed(1)} km${item.city ? ` · ${item.city}` : ""}`
                            : `📍 ${item.city}`}
                        </Text>
                      ) : null}
                    </View>

                    {item.aceptaDomicilio && (
                      <Pressable
                        style={s.waBtn}
                        hitSlop={8}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          openDish(item);
                        }}
                      >
                        <Text style={s.waIcon}>💬</Text>
                      </Pressable>
                    )}
                  </Pressable>
                </Animated.View>
              );
            }}
            ListEmptyComponent={
              <Text style={s.empty}>
                {isSearching ? "Buscando..." : "No hay platos disponibles."}
              </Text>
            }
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0D0D0D" },
  loadingWrap: {
    flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0D0D0D",
  },
  loadingText: { marginTop: 10, color: "#555" },

  header: {
    backgroundColor: "#0D0D0D",
    paddingHorizontal: 20,
    paddingTop: 14,
    justifyContent: "center",
    overflow: "hidden",
  },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 3 },

  searchWrap: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: "#FFFFFF" },
  clearX: { fontSize: 14, color: "#555", paddingHorizontal: 4 },

  chips: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#1A1A1A" },
  chipOn: { backgroundColor: "#E8521A" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#666" },
  chipTextOn: { color: "#FFFFFF" },

  cityWrap: { marginHorizontal: 16, marginBottom: 14, zIndex: 10 },
  cityBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  cityIcon: { fontSize: 14 },
  cityInput: { flex: 1, fontSize: 14, color: "#FFFFFF" },
  cityDropdown: {
    position: "absolute",
    top: 44,
    left: 0,
    right: 0,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    overflow: "hidden",
    zIndex: 20,
    elevation: 20,
  },
  cityOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  cityOptionText: { fontSize: 14, color: "#FFFFFF" },

  listPad: { paddingHorizontal: 16, paddingBottom: 24 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "#2A2A2A",
  },
  thumbLetter: { fontSize: 36, fontWeight: "800", color: "rgba(255,255,255,0.9)" },

  cardBody: { flex: 1, gap: 3 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "nowrap" },
  dishName: { fontSize: 15, fontWeight: "700", color: "#FFFFFF", flex: 1 },
  badgeHot: { backgroundColor: "#E8521A", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeNew: { backgroundColor: "#2D8C4E", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 9, fontWeight: "700", color: "#FFFFFF" },

  restaurant: { fontSize: 12, color: "#999" },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  price: { fontSize: 16, fontWeight: "700", color: "#E8521A" },
  priceStrike: { fontSize: 11, color: "#444", textDecorationLine: "line-through" },
  location: { fontSize: 11, color: "#555", marginTop: 1 },

  waBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#25D366",
    justifyContent: "center",
    alignItems: "center",
  },
  waIcon: { fontSize: 18 },

  empty: { textAlign: "center", marginTop: 50, color: "#444", fontSize: 15 },
});
