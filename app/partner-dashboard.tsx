import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { backendDelete, backendGet, backendPost } from "./services/backendApi";
import { authService } from "./partner/services/AuthService";

type Restaurante = {
  id: number;
  nombre: string;
  ciudad: string;
  direccion?: string;
  whatsapp?: string;
};

type Plato = {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria?: string;
  disponible: number;
  tiene_descuento?: number;
  porcentaje_descuento?: number;
};

type AiPlato = {
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
};

export default function PartnerDashboard() {
  const router = useRouter();

  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiPlatos, setAiPlatos] = useState<AiPlato[]>([]);
  const [aiSelected, setAiSelected] = useState<Set<number>>(new Set());
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiImporting, setAiImporting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        setLoading(true);
        const isLogged = await authService.isLoggedIn();
        if (!isLogged) {
          router.replace("/(tabs)/explore");
          return;
        }
        try {
          const [rest, dishes] = await Promise.all([
            backendGet<Restaurante>("/partner/me"),
            backendGet<Plato[]>("/partner/platos"),
          ]);
          setRestaurante(rest);
          setPlatos(dishes);
        } catch (e: any) {
          if (e?.message?.includes("401") || e?.message?.includes("Token")) {
            await authService.logout();
            router.replace("/(tabs)/explore");
          } else {
            Alert.alert("Error", e.message || "No se pudo cargar la información.");
          }
        } finally {
          setLoading(false);
        }
      }
      load();
    }, [router])
  );

  async function handleLogout() {
    await authService.logout();
    router.replace("/(tabs)/explore");
  }

  function confirmDelete(plato: Plato) {
    Alert.alert(
      "Eliminar plato",
      `¿Eliminar "${plato.nombre}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => deletePlato(plato.id),
        },
      ]
    );
  }

  async function handleAiMenu() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permiso requerido", "Se necesita acceso a la cámara.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled) return;

    setAiLoading(true);
    try {
      const imageFile = new FileSystem.File(result.assets[0].uri);
      const base64Image = await imageFile.base64();
      const token = await authService.getToken();
      const response = await fetch("https://dishquest-backend.onrender.com/ai/analyze-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ imageBase64: base64Image, mediaType: "image/jpeg" }),
      });
      if (!response.ok) throw new Error(`Error IA: ${response.status}`);
      const data = await response.json();
      const parsed: AiPlato[] = data.platos;
      setAiPlatos(parsed);
      setAiSelected(new Set(parsed.map((_, i) => i)));
      setAiModalVisible(true);
    } catch (e: any) {
      Alert.alert("Error", e.message || "No se pudo analizar el menú.");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleImportAi() {
    const toImport = aiPlatos.filter((_, i) => aiSelected.has(i));
    if (toImport.length === 0) {
      Alert.alert("Selecciona al menos un plato");
      return;
    }
    setAiImporting(true);
    let importados = 0;
    for (const plato of toImport) {
      try {
        await backendPost("/partner/platos", {
          nombre: plato.nombre,
          descripcion: plato.descripcion,
          precio: plato.precio,
          categoria: plato.categoria || "General",
          imagen_url: "",
          disponible: 1,
          tiene_descuento: 0,
          porcentaje_descuento: 0,
          acepta_domicilio: 0,
          acepta_reserva: 0,
        });
        importados++;
      } catch {}
    }
    setAiImporting(false);
    setAiModalVisible(false);
    setAiPlatos([]);
    setAiSelected(new Set());
    const dishes = await backendGet<Plato[]>("/partner/platos");
    setPlatos(dishes);
    Alert.alert("Importación completa", `Se importaron ${importados} plato${importados !== 1 ? "s" : ""} correctamente.`);
  }

  async function deletePlato(id: number) {
    setDeletingId(id);
    try {
      await backendDelete(`/partner/platos/${id}`);
      setPlatos((prev) => prev.filter((p) => p.id !== id));
    } catch (e: any) {
      Alert.alert("Error", e.message || "No se pudo eliminar el plato.");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E8521A" />
        <Text style={styles.loadingText}>Cargando tu restaurante...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.headerLabel}>Panel del socio</Text>
          <Text style={styles.headerName}>
            {restaurante?.nombre ?? "Mi restaurante"}
          </Text>
          {restaurante?.ciudad ? (
            <Text style={styles.headerCity}>📍 {restaurante.ciudad}</Text>
          ) : null}
        </View>
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Salir</Text>
        </Pressable>
      </View>

      {/* Acciones rápidas */}
      <View style={styles.actionsRow}>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => router.push("/partner/add-dish")}
        >
          <Text style={styles.primaryBtnText}>+ Agregar plato</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => router.push("/partner/restaurant-form")}
        >
          <Text style={styles.secondaryBtnText}>Editar restaurante</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => router.push("/partner/analytics")}
        >
          <Text style={styles.secondaryBtnText}>Ver analíticas</Text>
        </Pressable>
        <Pressable
          style={[styles.aiBtn, aiLoading && styles.btnDisabled]}
          onPress={() => router.push("/partner/menu-ia")}
          disabled={aiLoading}
        >
          {aiLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.aiBtnText}>📷 Subir menú con IA</Text>
          )}
        </Pressable>
      </View>

      {/* Lista de platos */}
      <Text style={styles.sectionTitle}>
        Mis platos ({platos.length})
      </Text>

      {platos.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>🍽️</Text>
          <Text style={styles.emptyText}>
            Aún no tienes platos registrados.
          </Text>
          <Pressable
            style={[styles.primaryBtn, { alignSelf: "center" }]}
            onPress={() => router.push("/partner/add-dish")}
          >
            <Text style={styles.primaryBtnText}>Agrega tu primer plato</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={platos}
          keyExtractor={(p) => String(p.id)}
          scrollEnabled={false}
          contentContainerStyle={{ gap: 10 }}
          renderItem={({ item }) => (
            <View style={styles.platoCard}>
              <View style={styles.platoTop}>
                <View style={styles.platoInfo}>
                  <Text style={styles.platoNombre}>{item.nombre}</Text>
                  {item.categoria ? (
                    <Text style={styles.platoCategoria}>{item.categoria}</Text>
                  ) : null}
                  <Text style={styles.platoPrecio}>
                    ${item.precio.toLocaleString("es-CO")}
                  </Text>
                  {item.descripcion ? (
                    <Text style={styles.platoDesc} numberOfLines={2}>
                      {item.descripcion}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.statusCol}>
                  {item.disponible === 0 ? (
                    <View style={styles.inactiveBadge}>
                      <Text style={styles.inactiveText}>Inactivo</Text>
                    </View>
                  ) : (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeText}>Activo</Text>
                    </View>
                  )}
                  {item.tiene_descuento ? (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>
                        {Number(item.porcentaje_descuento) > 0
                          ? `${item.porcentaje_descuento}% OFF`
                          : "PROMO"}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Botones Editar / Eliminar */}
              <View style={styles.platoActions}>
                <Pressable
                  style={styles.editBtn}
                  onPress={() => router.push(`/partner/edit-dish?id=${item.id}`)}
                >
                  <Text style={styles.editBtnText}>Editar</Text>
                </Pressable>
                <Pressable
                  style={[styles.deleteBtn, deletingId === item.id && styles.btnDisabled]}
                  onPress={() => confirmDelete(item)}
                  disabled={deletingId === item.id}
                >
                  {deletingId === item.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.deleteBtnText}>Eliminar</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
      {/* Modal IA */}
      <Modal visible={aiModalVisible} animationType="slide" transparent onRequestClose={() => setAiModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Platos detectados ({aiPlatos.length})</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {aiPlatos.map((plato, i) => (
                <Pressable
                  key={i}
                  style={styles.aiPlatoRow}
                  onPress={() => {
                    setAiSelected((prev) => {
                      const next = new Set(prev);
                      next.has(i) ? next.delete(i) : next.add(i);
                      return next;
                    });
                  }}
                >
                  <View style={[styles.checkbox, aiSelected.has(i) && styles.checkboxChecked]}>
                    {aiSelected.has(i) && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.aiPlatoName}>{plato.nombre}</Text>
                    <Text style={styles.aiPlatoMeta}>
                      {plato.categoria} · ${plato.precio > 0 ? plato.precio.toLocaleString("es-CO") : "—"}
                    </Text>
                    {plato.descripcion ? (
                      <Text style={styles.aiPlatoDesc} numberOfLines={2}>{plato.descripcion}</Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              style={[styles.importBtn, aiImporting && styles.btnDisabled]}
              onPress={handleImportAi}
              disabled={aiImporting}
            >
              {aiImporting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.importBtnText}>
                  Importar {aiSelected.size} plato{aiSelected.size !== 1 ? "s" : ""}
                </Text>
              )}
            </Pressable>
            <Pressable style={styles.cancelImportBtn} onPress={() => setAiModalVisible(false)} disabled={aiImporting}>
              <Text style={styles.cancelImportText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF8F0" },
  content: { paddingBottom: 50 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { color: "#666", fontSize: 14 },

  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "#E8521A",
    padding: 24,
    paddingTop: 32,
  },
  headerLabel: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8 },
  headerName: { fontSize: 20, fontWeight: "700", color: "#fff", marginTop: 2 },
  headerCity: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 2 },
  logoutBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 4,
  },
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  actionsRow: { padding: 20, gap: 10 },
  primaryBtn: {
    backgroundColor: "#E8521A",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryBtn: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E8521A",
  },
  secondaryBtnText: { color: "#E8521A", fontWeight: "700", fontSize: 15 },

  sectionTitle: {
    paddingHorizontal: 20,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: "700",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  emptyBox: { alignItems: "center", padding: 30, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 14, color: "#888", textAlign: "center" },

  platoCard: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EDE0D6",
    gap: 10,
  },
  platoTop: { flexDirection: "row", gap: 10 },
  platoInfo: { flex: 1, gap: 2 },
  platoNombre: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  platoCategoria: { fontSize: 12, color: "#888" },
  platoPrecio: { fontSize: 15, fontWeight: "700", color: "#E8521A", marginTop: 2 },
  platoDesc: { fontSize: 13, color: "#666", lineHeight: 18 },

  statusCol: { gap: 6, alignItems: "flex-end" },
  activeBadge: { backgroundColor: "#E8F5E9", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  activeText: { fontSize: 11, color: "#2E7D32", fontWeight: "600" },
  inactiveBadge: { backgroundColor: "#f0f0f0", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  inactiveText: { fontSize: 11, color: "#999", fontWeight: "600" },
  discountBadge: { backgroundColor: "#FFF0E8", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  discountText: { fontSize: 11, color: "#E8521A", fontWeight: "700" },

  platoActions: { flexDirection: "row", gap: 10 },
  editBtn: {
    flex: 1,
    backgroundColor: "#FFF0E8",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8521A",
  },
  editBtnText: { color: "#E8521A", fontWeight: "700", fontSize: 14 },
  deleteBtn: {
    flex: 1,
    backgroundColor: "#CC2200",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  deleteBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  btnDisabled: { opacity: 0.5 },

  aiBtn: {
    backgroundColor: "#5B4FCF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  aiBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16, color: "#1A1A1A" },
  aiPlatoRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: "#E8521A", alignItems: "center", justifyContent: "center", marginTop: 2 },
  checkboxChecked: { backgroundColor: "#E8521A" },
  checkmark: { color: "#fff", fontSize: 13, fontWeight: "700" },
  aiPlatoName: { fontSize: 14, fontWeight: "700", color: "#1A1A1A" },
  aiPlatoMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  aiPlatoDesc: { fontSize: 12, color: "#666", marginTop: 2 },
  importBtn: { backgroundColor: "#E8521A", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 16 },
  importBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  cancelImportBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center", borderWidth: 1.5, borderColor: "#CC2200", marginTop: 8 },
  cancelImportText: { color: "#CC2200", fontWeight: "700", fontSize: 15 },
});
