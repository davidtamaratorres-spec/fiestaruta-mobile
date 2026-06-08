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

import { backendGet } from "../services/backendApi";

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

function guessImage(name: string): string | null {
  const n = norm(name);
  if (n.includes("churrasco")) return "churrasco-parrilla.jpg";
  if (n.includes("chorizo")) return "chorizo-artesanal.jpg";
  if (n.includes("bandeja")) return "bandeja-paisa.jpg";
  if (n.includes("ajiaco")) return "ajiaco.jpg";
  if (n.includes("mondongo")) return "mondongo.jpg";
  if (n.includes("mote")) return "mote-de-queso.jpg";
  if (n.includes("carbonara")) return "pasta-carbonara.jpg";
  if (n.includes("pizza")) return "pizza-margarita.jpg";
  if (n.includes("hamburguesa") && n.includes("doble")) return "hamburguesa-doble.jpg";
  if (n.includes("hamburguesa") && n.includes("vegana")) return "hamburguesa-vegana.jpg";
  if (n.includes("hamburguesa") && n.includes("artesanal")) return "hamburguesa-artesanal.jpg";
  if (n.includes("hamburguesa")) return "hamburguesa-clasica.jpg";
  if (n.includes("lasa")) return "lasana-vegana.jpg";
  if (n.includes("mojarra")) return "mojarra-frita.jpg";
  if (n.includes("pargo")) return "pargo-rojo-frito.jpg";
  if (n.includes("cazuela")) return "cazuela-mariscos.jpg";
  if (n.includes("desayuno")) return "desayuno-campesino.jpg";
  if (n.includes("smoothie")) return "smoothie-antioxidante.jpg";
  if (n.includes("wrap")) return "wrap-vegetal.jpg";
  if (n.includes("papas")) return "papas-artesanales.jpg";
  if (n.includes("tacos")) return "tacos-al-pastor.jpg";
  if (n.includes("burrito")) return "burrito-mixto.jpg";
  return null;
}

function pickImage(imageUrl: string | undefined, name: string) {
  if (imageUrl?.trim()) {
    if (imageUrl.startsWith("http")) return { uri: imageUrl };
    const filename = imageUrl.trim().split("/").pop() || imageUrl.trim();
    if (DISH_IMAGES[filename]) return DISH_IMAGES[filename];
  }
  const guessed = guessImage(name);
  return (guessed && DISH_IMAGES[guessed]) ? DISH_IMAGES[guessed] : PLACEHOLDER_IMG;
}

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

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        if (!id || Number.isNaN(idNum)) throw new Error("ID inválido");
        const data = await backendGet<DishDetail>(`/dishes/${idNum}`);
        if (active) setDish(data);
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

      <Image source={pickImage(dish.imagen_url, dish.nombre)} style={styles.hero} resizeMode="cover" />

      {/* Badge descuento */}
      {tieneDescuento && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountBadgeText}>
            {pct > 0 ? `${pct}% OFF` : "PROMO"}
          </Text>
        </View>
      )}

      <Text style={styles.name}>{dish.nombre}</Text>

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
      <Text style={styles.sectionTitle}>Restaurante</Text>
      <Text style={styles.restaurantName}>
        {dish.restaurante_nombre ?? `Restaurante #${dish.restaurante_id}`}
      </Text>
      {dish.ciudad ? <Text style={styles.info}>📍 {dish.ciudad}</Text> : null}
      {dish.direccion ? <Text style={styles.info}>{dish.direccion}</Text> : null}
      {dish.whatsapp ? <Text style={styles.info}>📱 {dish.whatsapp}</Text> : null}
      {dish.restaurante_email ? <Text style={styles.info}>✉️ {dish.restaurante_email}</Text> : null}

      {/* Botones de acción */}
      <View style={styles.actionsSection}>
        {dish.acepta_domicilio ? (
          <Pressable
            style={styles.actionBtn}
            onPress={() => dish.whatsapp
              ? openWhatsApp(dish.whatsapp, dish.nombre)
              : Alert.alert("Sin contacto", "Este restaurante no tiene WhatsApp registrado.")
            }
          >
            <Text style={styles.actionBtnText}>🛵 Pedir domicilio</Text>
          </Pressable>
        ) : null}

        {dish.acepta_reserva ? (
          <Pressable
            style={[styles.actionBtn, styles.reservaBtn]}
            onPress={() => dish.whatsapp
              ? openWhatsApp(dish.whatsapp, `Reserva: ${dish.nombre}`)
              : Alert.alert("Sin contacto", "Este restaurante no tiene WhatsApp registrado.")
            }
          >
            <Text style={styles.actionBtnText}>📅 Reservar</Text>
          </Pressable>
        ) : null}

        {(dish.latitud || dish.direccion || dish.ciudad) ? (
          <Pressable
            style={[styles.actionBtn, styles.mapsBtn]}
            onPress={() => openMaps(dish.latitud, dish.longitud, dish.direccion ?? "", dish.ciudad ?? "")}
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
  container: { flex: 1, backgroundColor: "#FFF8F0" },
  content: { paddingBottom: 50 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  muted: { color: "#666" },
  errorText: { color: "red", fontWeight: "600", textAlign: "center" },
  backRow: { padding: 20, paddingBottom: 8 },
  backText: { fontSize: 14, fontWeight: "600", color: "#333" },
  backBtn: { marginTop: 12, backgroundColor: "#E8521A", padding: 14, borderRadius: 10, alignItems: "center", minWidth: 120 },
  backBtnText: { color: "#fff", fontWeight: "700" },

  hero: { width: "100%", height: 240, backgroundColor: "#e6e6e6" },

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

  name: { fontSize: 24, fontWeight: "700", paddingHorizontal: 20, paddingTop: 16 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, marginTop: 6 },
  price: { fontSize: 20, fontWeight: "700", color: "#E8521A" },
  priceOld: { fontSize: 15, color: "#aaa", textDecorationLine: "line-through" },
  categoria: { paddingHorizontal: 20, marginTop: 4, fontSize: 13, color: "#888" },

  sectionTitle: { paddingHorizontal: 20, marginTop: 20, fontSize: 13, fontWeight: "700", color: "#999", textTransform: "uppercase", letterSpacing: 0.8 },
  desc: { paddingHorizontal: 20, marginTop: 6, fontSize: 15, color: "#333", lineHeight: 22 },

  restaurantName: { paddingHorizontal: 20, marginTop: 6, fontSize: 16, fontWeight: "700", color: "#111" },
  info: { paddingHorizontal: 20, marginTop: 4, fontSize: 14, color: "#444" },

  actionsSection: { paddingHorizontal: 20, marginTop: 24, gap: 12 },
  actionBtn: {
    minHeight: 56,
    backgroundColor: "#E8521A",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  reservaBtn: { backgroundColor: "#111" },
  mapsBtn: { backgroundColor: "#1a73e8" },

  unavailable: { paddingHorizontal: 20, marginTop: 16, fontSize: 13, color: "#c00", fontWeight: "600" },
});
