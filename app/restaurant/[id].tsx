import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { backendGet } from "../services/backendApi";
import { BackendDish } from "../services/backendDishes";
import { BackendRestaurant } from "../services/backendRestaurants";

type RestaurantDetail = BackendRestaurant & {
  descripcion?: string;
  whatsapp?: string;
  direccion?: string;
};

type Promotion = {
  id: number;
  restaurante_id: number;
  titulo?: string;
  descripcion?: string;
  porcentaje_descuento?: number;
  activa?: number;
};

function openWhatsApp(whatsapp: string) {
  const clean = whatsapp.replace(/\D/g, "");
  Linking.openURL(`https://wa.me/${clean}`).catch(() =>
    Alert.alert("Error", "No se pudo abrir WhatsApp.")
  );
}

export default function RestaurantProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [dishes, setDishes] = useState<BackendDish[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const ridNum = Number(id);
        if (!id || Number.isNaN(ridNum)) throw new Error("ID inválido");

        const [rest, allDishes, promos] = await Promise.allSettled([
          backendGet<RestaurantDetail>(`/restaurants/${ridNum}`),
          backendGet<BackendDish[]>(`/dishes`),
          backendGet<Promotion[]>(`/promotions?restaurante_id=${ridNum}`),
        ]);

        if (!active) return;

        if (rest.status === "fulfilled") {
          setRestaurant(rest.value);
        } else {
          // Si no hay endpoint de detalle, construir desde los platos
          const firstDish =
            allDishes.status === "fulfilled"
              ? allDishes.value.find((d) => Number(d.restaurante_id) === ridNum)
              : null;
          if (firstDish) {
            setRestaurant({
              id: ridNum,
              nombre: firstDish.restaurante ?? `Restaurante #${ridNum}`,
              ciudad: firstDish.ciudad ?? firstDish.municipio,
              whatsapp: firstDish.whatsapp,
            });
          } else {
            throw new Error("Restaurante no encontrado.");
          }
        }

        if (allDishes.status === "fulfilled") {
          setDishes(
            allDishes.value.filter((d) => Number(d.restaurante_id) === ridNum)
          );
        }
        if (promos.status === "fulfilled") {
          setPromotions(promos.value.filter((p) => p.activa === 1));
        }
      } catch (e: any) {
        if (active) setError(e.message || "Error cargando el restaurante.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E8521A" />
        <Text style={styles.muted}>Cargando restaurante...</Text>
      </View>
    );
  }

  if (error || !restaurant) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || "Restaurante no encontrado"}</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backRow}>
        <Text style={styles.backText}>← Volver</Text>
      </Pressable>

      {/* Cabecera del restaurante */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {restaurant.nombre.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{restaurant.nombre}</Text>
        {restaurant.ciudad ? (
          <Text style={styles.city}>📍 {restaurant.ciudad}</Text>
        ) : null}
        {restaurant.direccion ? (
          <Text style={styles.infoLine}>{restaurant.direccion}</Text>
        ) : null}
        {restaurant.descripcion ? (
          <Text style={styles.desc}>{restaurant.descripcion}</Text>
        ) : null}
        {restaurant.whatsapp ? (
          <Pressable
            style={styles.waBtn}
            onPress={() => openWhatsApp(restaurant.whatsapp!)}
          >
            <Text style={styles.waBtnText}>💬 Contactar por WhatsApp</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Promociones activas */}
      {promotions.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Promociones activas</Text>
          {promotions.map((p) => (
            <View key={p.id} style={styles.promoCard}>
              <Text style={styles.promoTitle}>
                {p.titulo ?? "Promoción especial"}
              </Text>
              {p.porcentaje_descuento ? (
                <Text style={styles.promoPct}>{p.porcentaje_descuento}% OFF</Text>
              ) : null}
              {p.descripcion ? (
                <Text style={styles.promoDesc}>{p.descripcion}</Text>
              ) : null}
            </View>
          ))}
        </>
      )}

      {/* Lista de platos */}
      <Text style={styles.sectionTitle}>
        Platos ({dishes.length})
      </Text>

      {dishes.length === 0 ? (
        <Text style={styles.empty}>Este restaurante aún no tiene platos registrados.</Text>
      ) : (
        <FlatList
          data={dishes}
          keyExtractor={(d) => String(d.id)}
          scrollEnabled={false}
          contentContainerStyle={{ gap: 10 }}
          renderItem={({ item }) => (
            <Pressable
              style={styles.dishCard}
              onPress={() => router.push(`/dish/${item.id}`)}
            >
              <View style={styles.dishRow}>
                <Text style={styles.dishName}>{item.nombre}</Text>
                {item.tiene_descuento ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {Number(item.porcentaje_descuento) > 0
                        ? `${item.porcentaje_descuento}% OFF`
                        : "PROMO"}
                    </Text>
                  </View>
                ) : null}
              </View>
              {item.categoria ? (
                <Text style={styles.dishCat}>{item.categoria}</Text>
              ) : null}
              <Text style={styles.dishPrice}>
                ${item.precio.toLocaleString("es-CO")}
              </Text>
              {item.descripcion ? (
                <Text style={styles.dishDesc} numberOfLines={2}>
                  {item.descripcion}
                </Text>
              ) : null}
            </Pressable>
          )}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF8F0" },
  content: { paddingBottom: 50 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  muted: { color: "#666" },
  errorText: { color: "#CC2200", fontWeight: "600", textAlign: "center" },
  backRow: { padding: 20, paddingBottom: 8 },
  backText: { fontSize: 14, fontWeight: "600", color: "#E8521A" },
  backBtn: { marginTop: 12, backgroundColor: "#E8521A", padding: 14, borderRadius: 10, alignItems: "center", minWidth: 120 },
  backBtnText: { color: "#fff", fontWeight: "700" },

  header: { alignItems: "center", paddingHorizontal: 24, paddingBottom: 20, gap: 6 },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E8521A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  avatarText: { fontSize: 36, color: "#fff", fontWeight: "700" },
  name: { fontSize: 22, fontWeight: "700", color: "#1A1A1A", textAlign: "center" },
  city: { fontSize: 14, color: "#666" },
  infoLine: { fontSize: 13, color: "#888" },
  desc: { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 20, marginTop: 4 },
  waBtn: {
    marginTop: 10,
    backgroundColor: "#25D366",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  waBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  sectionTitle: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: "700",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  promoCard: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: "#FFF0E8",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#E8521A",
  },
  promoTitle: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  promoPct: { fontSize: 20, fontWeight: "800", color: "#E8521A", marginTop: 2 },
  promoDesc: { fontSize: 13, color: "#555", marginTop: 4 },

  empty: { paddingHorizontal: 20, color: "#888", fontSize: 14, textAlign: "center", marginTop: 10 },

  dishCard: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EDE0D6",
  },
  dishRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  dishName: { fontSize: 15, fontWeight: "600", color: "#1A1A1A", flex: 1 },
  badge: { backgroundColor: "#E8521A", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  dishCat: { fontSize: 12, color: "#888", marginBottom: 4 },
  dishPrice: { fontSize: 15, fontWeight: "700", color: "#E8521A" },
  dishDesc: { fontSize: 13, color: "#666", lineHeight: 18, marginTop: 4 },
});
