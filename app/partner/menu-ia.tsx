import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { backendPost } from "../services/backendApi";
import { authService } from "./services/AuthService";

type ExtractedDish = {
  nombre: string;
  precio: number;
  ingredientes: string[];
  descripcion: string;
  categoria: string;
  selected: boolean;
};

type MenuIaResponse = {
  platos: Omit<ExtractedDish, "selected">[];
};

export default function MenuIaScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [platos, setPlatos] = useState<ExtractedDish[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permiso requerido", "Se necesita acceso a la camara para tomar la foto del menu.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.75,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert("Error", "No se pudo leer la imagen tomada.");
      return;
    }

    setImageUri(asset.uri);
    setExtracting(true);
    try {
      const data = await backendPost<MenuIaResponse>("/partner/menu-ia", {
        image_base64: asset.base64,
        media_type: asset.mimeType || "image/jpeg",
      });
      setPlatos(
        (data.platos || []).map((plato) => ({
          nombre: plato.nombre || "",
          precio: Number(plato.precio) || 0,
          ingredientes: plato.ingredientes || [],
          descripcion: plato.descripcion || "",
          categoria: plato.categoria || "Menu",
          selected: true,
        }))
      );
    } catch (e: any) {
      Alert.alert("Error IA", e?.message ?? "No se pudo extraer el menu.");
    } finally {
      setExtracting(false);
    }
  }

  function updateDish(index: number, patch: Partial<ExtractedDish>) {
    setPlatos((prev) =>
      prev.map((plato, i) => (i === index ? { ...plato, ...patch } : plato))
    );
  }

  async function saveSelected() {
    if (saving) return;
    const selected = platos.filter((plato) => plato.selected);
    if (selected.length === 0) {
      Alert.alert("Sin seleccion", "Selecciona al menos un plato para guardar.");
      return;
    }

    const isLogged = await authService.isLoggedIn();
    if (!isLogged) {
      router.replace("/partner/auth");
      return;
    }

    setSaving(true);
    try {
      for (const plato of selected) {
        if (!plato.nombre.trim()) continue;
        const ingredientsText = plato.ingredientes.length
          ? `Ingredientes: ${plato.ingredientes.join(", ")}`
          : "";
        const descripcion = [plato.descripcion.trim(), ingredientsText].filter(Boolean).join("\n");
        await backendPost("/partner/platos", {
          nombre: plato.nombre.trim(),
          descripcion,
          precio: Number(plato.precio) || 0,
          categoria: plato.categoria.trim() || "Menu",
          imagen_url: "",
          disponible: 1,
          tiene_descuento: 0,
          porcentaje_descuento: 0,
          acepta_domicilio: 0,
          acepta_reserva: 0,
        });
      }
      Alert.alert("Platos guardados", "Los platos seleccionados fueron creados.", [
        { text: "OK", onPress: () => router.replace("/partner/home") },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudieron guardar los platos.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Subir menu con IA</Text>

      <Pressable style={styles.button} onPress={takePhoto} disabled={extracting || saving}>
        <Text style={styles.buttonText}>
          {extracting ? "Analizando..." : "📷 Tomar foto del menu"}
        </Text>
      </Pressable>

      {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} /> : null}

      {extracting ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6A00" />
          <Text style={styles.muted}>Extrayendo platos, precios e ingredientes...</Text>
        </View>
      ) : null}

      {platos.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Confirma antes de guardar</Text>
          {platos.map((plato, index) => (
            <View key={`${plato.nombre}-${index}`} style={styles.card}>
              <View style={styles.switchRow}>
                <Text style={styles.cardTitle}>Guardar plato</Text>
                <Switch
                  value={plato.selected}
                  onValueChange={(selected) => updateDish(index, { selected })}
                  trackColor={{ true: "#FF6A00" }}
                />
              </View>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={plato.nombre}
                onChangeText={(nombre) => updateDish(index, { nombre })}
              />
              <Text style={styles.label}>Precio</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(plato.precio || "")}
                onChangeText={(precio) => updateDish(index, { precio: Number(precio) || 0 })}
              />
              <Text style={styles.label}>Categoria</Text>
              <TextInput
                style={styles.input}
                value={plato.categoria}
                onChangeText={(categoria) => updateDish(index, { categoria })}
              />
              <Text style={styles.label}>Descripcion</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                multiline
                value={plato.descripcion}
                onChangeText={(descripcion) => updateDish(index, { descripcion })}
              />
              {plato.ingredientes.length ? (
                <Text style={styles.ingredients}>
                  Ingredientes: {plato.ingredientes.join(", ")}
                </Text>
              ) : null}
            </View>
          ))}

          <Pressable style={[styles.saveButton, saving && styles.disabled]} onPress={saveSelected} disabled={saving}>
            <Text style={styles.saveButtonText}>
              {saving ? "Guardando..." : "Guardar seleccionados"}
            </Text>
          </Pressable>
        </>
      ) : null}

      <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
        <Text style={styles.secondaryText}>Volver</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "800", color: "#111", marginBottom: 16 },
  button: { backgroundColor: "#FF6A00", borderRadius: 10, padding: 15, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "800" },
  preview: { width: "100%", height: 220, borderRadius: 10, marginTop: 16, backgroundColor: "#eee" },
  center: { alignItems: "center", gap: 10, marginVertical: 24 },
  muted: { color: "#666", textAlign: "center" },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#111", marginTop: 22, marginBottom: 12 },
  card: { borderWidth: 1, borderColor: "#eee", borderRadius: 10, padding: 14, marginBottom: 12, backgroundColor: "#fafafa" },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#111" },
  label: { fontSize: 12, fontWeight: "700", color: "#777", marginBottom: 4 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 11, marginBottom: 10, backgroundColor: "#fff" },
  textarea: { height: 78, textAlignVertical: "top" },
  ingredients: { fontSize: 12, color: "#555", lineHeight: 18 },
  saveButton: { backgroundColor: "#111", borderRadius: 10, padding: 15, alignItems: "center", marginTop: 8 },
  saveButtonText: { color: "#fff", fontWeight: "800" },
  disabled: { opacity: 0.55 },
  secondaryButton: { backgroundColor: "#eee", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 10 },
  secondaryText: { color: "#333", fontWeight: "700" },
});
