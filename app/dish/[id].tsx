import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  SlideInUp,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { BASE_URL, backendGet } from "../services/backendApi";

type DishDetail = {
  id: number;
  restaurante_id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria?: string;
  imagen_url?: string;
  disponible: number;
  tiene_descuento?: number;
  porcentaje_descuento?: number;
  acepta_domicilio?: number;
  acepta_reserva?: number;
  restaurante_nombre?: string;
  ciudad?: string;
  direccion?: string;
  whatsapp?: string;
  latitud?: number;
  longitud?: number;
  restaurante_email?: string;
};


function openWhatsApp(whatsapp: string, dishName: string) {
  const clean = whatsapp.replace(/\D/g, "");
  const msg = encodeURIComponent(`Hola, me interesa el plato: ${dishName}`);
  Linking.openURL(`https://wa.me/${clean}?text=${msg}`).catch(() =>
    Alert.alert("Error", "No se pudo abrir WhatsApp.")
  );
}

function openMaps(lat: number | undefined, lon: number | undefined, address: string, city: string) {
  let url: string;
  if (lat && lon) {
    url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
  } else {
    const q = encodeURIComponent(`${address || ""} ${city || ""}`.trim());
    url = `https://www.google.com/maps/search/?api=1&query=${q}`;
  }
  Linking.openURL(url).catch(() => Alert.alert("Error", "No se pudo abrir Google Maps."));
}

export default function DishDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [dish, setDish] = useState<DishDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const idNum = useMemo(() => Number(id), [id]);

  const priceAnimated = useSharedValue(0);
  const whatsappScale = useSharedValue(1);

  useEffect(() => {
    if (dish) {
      priceAnimated.value = withTiming(dish.precio, { duration: 800 });
      whatsappScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1
      );
    }
  }, [dish]);

  const whatsappAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: whatsappScale.value }],
  }));

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        if (!id || Number.isNaN(idNum)) throw new Error("ID inválido");
        const data = await backendGet<DishDetail>(`/dishes/${idNum}`);
        if (active) {
          setDish(data);
          fetch(BASE_URL + "/partner/track-view", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plato_id: idNum }),
          }).catch(() => {});
        }
      } catch (e: any) {
        if (active) { setDish(null); setError(e?.message || "Error cargando detalle"); }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [id, idNum]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E8521A" />
        <Text style={styles.muted}>Cargando plato...</Text>
      </View>
    );
  }

  if (error || !dish) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || "Plato no encontrado"}</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const tieneDescuento = Boolean(dish.tiene_descuento);
  const pct = Number(dish.porcentaje_descuento) || 0;
  const precioOriginal = tieneDescuento && pct > 0
    ? Math.round(dish.precio / (1 - pct / 100))
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backRow}>
        <Text style={styles.backText}>← Volver</Text>
      </Pressable>

      {dish.imagen_url?.trim() ? (
        <Image
          source={{ uri: BASE_URL + dish.imagen_url }}
          style={styles.hero}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient colors={["#E8521A", "#FF8C42"]} style={[styles.hero, styles.heroGradient]}>
          <Text style={styles.heroLetter}>{dish.nombre.charAt(0).toUpperCase()}</Text>
        </LinearGradient>
      )}

      {/* Badge descuento */}
      {tieneDescuento && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountBadgeText}>
            {pct > 0 ? `${pct}% OFF` : "PROMO"}
          </Text>
        </View>
      )}

      <Animated.Text entering={SlideInUp.duration(400)} style={styles.name}>
        {dish.nombre}
      </Animated.Text>

      {/* Precio */}
      <View style={styles.priceRow}>
        <Text style={styles.price}>${dish.precio.toLocaleString("es-CO")}</Text>
        {precioOriginal && (
          <Text style={styles.priceOld}>${precioOriginal.toLocaleString("es-CO")}</Text>
        )}
      </View>

      {dish.categoria ? <Text style={styles.categoria}>{dish.categoria}</Text> : null}

      {/* Descripción */}
      {dish.descripcion?.trim() ? (
        <>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.desc}>{dish.descripcion}</Text>
        </>
      ) : null}

      {/* Restaurante */}
      <Animated.View entering={FadeIn.delay(300)} style={styles.restaurantCard}>
        <Text style={styles.sectionTitle}>Restaurante</Text>
        <Text style={styles.restaurantName}>
          {dish.restaurante_nombre ?? `Restaurante #${dish.restaurante_id}`}
        </Text>
        {dish.ciudad ? <Text style={styles.info}>📍 {dish.ciudad}</Text> : null}
        {dish.direccion ? <Text style={styles.info}>🏠 {dish.direccion}</Text> : null}
        {dish.whatsapp ? <Text style={styles.info}>📱 {dish.whatsapp}</Text> : null}
        {dish.restaurante_email ? <Text style={styles.info}>✉️ {dish.restaurante_email}</Text> : null}
      </Animated.View>

      {/* Botones de acción */}
      <View style={styles.actionsSection}>
        {dish.acepta_domicilio ? (
          <Animated.View style={whatsappAnimatedStyle}>
            <Pressable
              style={styles.actionBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                dish.whatsapp
                  ? openWhatsApp(dish.whatsapp, dish.nombre)
                  : Alert.alert("Sin contacto", "Este restaurante no tiene WhatsApp registrado.");
              }}
            >
              <Text style={styles.actionBtnText}>🛵 Pedir domicilio</Text>
            </Pressable>
          </Animated.View>
        ) : null}

        {dish.acepta_reserva ? (
          <Animated.View style={whatsappAnimatedStyle}>
            <Pressable
              style={[styles.actionBtn, styles.reservaBtn]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                dish.whatsapp
                  ? openWhatsApp(dish.whatsapp, `Reserva: ${dish.nombre}`)
                  : Alert.alert("Sin contacto", "Este restaurante no tiene WhatsApp registrado.");
              }}
            >
              <Text style={styles.actionBtnText}>📅 Reservar</Text>
            </Pressable>
          </Animated.View>
        ) : null}

        {(dish.latitud || dish.direccion || dish.ciudad) ? (
          <Pressable
            style={[styles.actionBtn, styles.mapsBtn]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              openMaps(dish.latitud, dish.longitud, dish.direccion ?? "", dish.ciudad ?? "");
            }}
          >
            <Text style={styles.actionBtnText}>📍 Ver en mapa</Text>
          </Pressable>
        ) : null}
      </View>

      {!dish.disponible ? (
        <Text style={styles.unavailable}>⚠️ Este plato no está disponible actualmente</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  content: { paddingBottom: 50 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24, backgroundColor: "#0D0D0D" },
  muted: { color: "#666" },
  errorText: { color: "#ff6b6b", fontWeight: "600", textAlign: "center" },
  backRow: { padding: 20, paddingBottom: 8 },
  backText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  backBtn: { marginTop: 12, backgroundColor: "#E8521A", padding: 14, borderRadius: 10, alignItems: "center", minWidth: 120 },
  backBtnText: { color: "#fff", fontWeight: "700" },

  hero: { width: "100%", height: 240, backgroundColor: "#1A1A1A" },
  heroGradient: { justifyContent: "center", alignItems: "center" },
  heroLetter: { fontSize: 96, fontWeight: "800", color: "rgba(255,255,255,0.9)" },

  discountBadge: {
    position: "absolute",
    top: 72,
    right: 20,
    backgroundColor: "#E8521A",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  discountBadgeText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  name: { fontSize: 24, fontWeight: "700", paddingHorizontal: 20, paddingTop: 16, color: "#FFFFFF" },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, marginTop: 6 },
  price: { fontSize: 20, fontWeight: "700", color: "#E8521A" },
  priceOld: { fontSize: 15, color: "#555", textDecorationLine: "line-through" },
  categoria: { paddingHorizontal: 20, marginTop: 4, fontSize: 13, color: "#666" },

  sectionTitle: { paddingHorizontal: 20, marginTop: 20, fontSize: 12, fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: 1 },
  desc: { paddingHorizontal: 20, marginTop: 6, fontSize: 15, color: "#999999", lineHeight: 22 },

  restaurantName: { paddingHorizontal: 20, marginTop: 6, fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  info: { paddingHorizontal: 20, marginTop: 4, fontSize: 14, color: "#999" },

  actionsSection: { paddingHorizontal: 20, marginTop: 24, gap: 12 },
  actionBtn: {
    minHeight: 56,
    backgroundColor: "#25D366",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  reservaBtn: { backgroundColor: "#1A1A1A", borderWidth: 1, borderColor: "#2A2A2A" },
  mapsBtn: { backgroundColor: "#E8521A" },

  restaurantCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    paddingVertical: 12,
  },

  unavailable: { paddingHorizontal: 20, marginTop: 16, fontSize: 13, color: "#ff6b6b", fontWeight: "600" },
});
