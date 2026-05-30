import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { backendGet } from "../services/backendApi";
import { authService } from "./services/AuthService";

type Metricas = {
  vistas: number;
  domicilios: number;
  reservas: number;
  mapas: number;
  descuentos: number;
};

type StatCard = {
  label: string;
  value: number;
  emoji: string;
  color: string;
};

export default function AnalyticsScreen() {
  const router = useRouter();
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        setLoading(true);
        setError(null);

        const isLogged = await authService.isLoggedIn();
        if (!isLogged) { router.replace("/partner/auth"); return; }

        try {
          const restauranteId = await AsyncStorage.getItem("partner_restaurante_id");
          if (!restauranteId) {
            setError("No se encontró el restaurante asociado.");
            return;
          }
          const data = await backendGet<Metricas>(`/eventos/restaurante/${restauranteId}`);
          setMetricas(data);
        } catch (e: any) {
          if (e?.message?.includes("401")) {
            await authService.logout();
            router.replace("/partner/auth");
            return;
          }
          setError(e?.message ?? "Error cargando métricas");
        } finally {
          setLoading(false);
        }
      }
      load();
    }, [router])
  );

  const stats: StatCard[] = metricas ? [
    { label: "Vistas de platos", value: metricas.vistas, emoji: "👁️", color: "#4A90E2" },
    { label: "Pedidos a domicilio", value: metricas.domicilios, emoji: "🛵", color: "#FF6A00" },
    { label: "Reservas", value: metricas.reservas, emoji: "📅", color: "#27AE60" },
    { label: "Ver en mapa", value: metricas.mapas, emoji: "📍", color: "#1a73e8" },
    { label: "Clics en descuento", value: metricas.descuentos, emoji: "💸", color: "#9B59B6" },
  ] : [];

  const total = metricas ? metricas.vistas + metricas.domicilios + metricas.reservas + metricas.mapas : 0;
  const conversionPct = metricas && metricas.vistas > 0
    ? Math.round(((metricas.domicilios + metricas.reservas) / metricas.vistas) * 100)
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Analíticas</Text>
      <Text style={styles.subtitle}>Actividad de tus platos en DishQuest</Text>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6A00" />
          <Text style={styles.muted}>Cargando métricas...</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && metricas && (
        <>
          {/* Resumen */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{total}</Text>
              <Text style={styles.summaryLabel}>Interacciones totales</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: "#FF6A00" }]}>{conversionPct}%</Text>
              <Text style={styles.summaryLabel}>Conversión (pedidos/vistas)</Text>
            </View>
          </View>

          {/* Stats individuales */}
          <View style={styles.grid}>
            {stats.map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <Text style={styles.statEmoji}>{stat.emoji}</Text>
                <Text style={[styles.statValue, { color: stat.color }]}>
                  {stat.value.toLocaleString("es-CO")}
                </Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {total === 0 && (
            <Text style={styles.empty}>
              Aún no hay actividad registrada. Los eventos se registran cuando los usuarios ven tus platos o interactúan con ellos.
            </Text>
          )}
        </>
      )}

      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>Volver al panel</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#888", marginBottom: 24 },
  center: { alignItems: "center", gap: 10, marginVertical: 30 },
  muted: { color: "#666" },
  errorText: { color: "red", fontWeight: "600", textAlign: "center" },

  summaryCard: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#eee",
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: { fontSize: 32, fontWeight: "800", color: "#111" },
  summaryLabel: { fontSize: 12, color: "#888", marginTop: 4, textAlign: "center" },
  summaryDivider: { width: 1, backgroundColor: "#eee", marginHorizontal: 16 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  statCard: {
    width: "47%",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
    gap: 4,
  },
  statEmoji: { fontSize: 28 },
  statValue: { fontSize: 26, fontWeight: "800" },
  statLabel: { fontSize: 12, color: "#666", textAlign: "center" },

  empty: { fontSize: 14, color: "#888", textAlign: "center", lineHeight: 20, marginVertical: 16 },

  backBtn: { backgroundColor: "#eee", padding: 14, borderRadius: 10, alignItems: "center", marginTop: 8 },
  backBtnText: { fontWeight: "600", color: "#333" },
});
