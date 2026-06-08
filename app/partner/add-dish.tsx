import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import type { ScrollView as ScrollViewType } from "react-native";

import { backendPost } from "../services/backendApi";
import { authService } from "./services/AuthService";

export default function AddDishScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollViewType>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [categoria, setCategoria] = useState("");
  const [available, setAvailable] = useState(true);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [editingUri, setEditingUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingUri) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    }
  }, [editingUri]);

  const [tieneDescuento, setTieneDescuento] = useState(false);
  const [porcentajeDescuento, setPorcentajeDescuento] = useState("");
  const [aceptaDomicilio, setAceptaDomicilio] = useState(false);
  const [aceptaReserva, setAceptaReserva] = useState(false);

  async function pickImage() {
    Keyboard.dismiss();
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permiso requerido", "Se necesita permiso para acceder a tus fotos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) setEditingUri(result.assets[0].uri);
  }

  async function handleRotate() {
    if (!editingUri) return;
    const result = await ImageManipulator.manipulateAsync(
      editingUri,
      [{ rotate: 90 }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    setEditingUri(result.uri);
  }

  async function handleCrop() {
    if (!editingUri) return;
    try {
      const probe = await ImageManipulator.manipulateAsync(editingUri, [], { format: ImageManipulator.SaveFormat.JPEG });
      const w = probe.width;
      const h = probe.height;
      const side = Math.min(w, h) * 0.8;
      const originX = (w - side) / 2;
      const originY = (h - side) / 2;
      const cropped = await ImageManipulator.manipulateAsync(
        editingUri,
        [{ crop: { originX, originY, width: side, height: side } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      setEditingUri(cropped.uri);
    } catch {
      Alert.alert("Error", "No se pudo recortar la imagen.");
    }
  }

  function handleConfirmPhoto() {
    setImageUri(editingUri);
    setEditingUri(null);
  }

  function handleCancelPhoto() {
    setEditingUri(null);
  }

  async function handleSave() {
    Keyboard.dismiss();
    if (saving) return;

    if (!name.trim() || !price.trim()) {
      Alert.alert("Datos incompletos", "Nombre y precio son obligatorios.");
      return;
    }
    const precioNum = Number(price);
    if (Number.isNaN(precioNum) || precioNum < 0) {
      Alert.alert("Precio inválido", "Ingresa un precio numérico válido.");
      return;
    }
    if (tieneDescuento) {
      const pct = Number(porcentajeDescuento);
      if (Number.isNaN(pct) || pct < 1 || pct > 100) {
        Alert.alert("Descuento inválido", "El porcentaje debe estar entre 1 y 100.");
        return;
      }
    }

    const isLogged = await authService.isLoggedIn();
    if (!isLogged) { router.replace("/partner/auth"); return; }

    setSaving(true);
    try {
      await backendPost("/partner/platos", {
        nombre: name.trim(),
        descripcion: description.trim(),
        precio: precioNum,
        categoria: categoria.trim() || "General",
        imagen_url: imageUri || "",
        disponible: available ? 1 : 0,
        tiene_descuento: tieneDescuento ? 1 : 0,
        porcentaje_descuento: tieneDescuento ? Number(porcentajeDescuento) : 0,
        acepta_domicilio: aceptaDomicilio ? 1 : 0,
        acepta_reserva: aceptaReserva ? 1 : 0,
      });

      Alert.alert("Plato guardado", "El plato fue agregado a tu restaurante.", [
        { text: "OK", onPress: () => router.replace("/partner/home") },
      ]);
    } catch (e: any) {
      if (e?.message?.includes("401")) { await authService.logout(); router.replace("/partner/auth"); return; }
      Alert.alert("Error", e?.message ?? "No se pudo guardar el plato.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Agregar plato</Text>

        <TextInput placeholder="Nombre del plato" style={styles.input} value={name} onChangeText={setName} returnKeyType="done" onSubmitEditing={Keyboard.dismiss} />
        <TextInput placeholder="Precio (ej: 25000)" style={styles.input} keyboardType="numeric" value={price} onChangeText={setPrice} returnKeyType="done" onSubmitEditing={Keyboard.dismiss} />
        <TextInput placeholder="Descripción" style={[styles.input, styles.textarea]} value={description} onChangeText={setDescription} multiline />
        <TextInput placeholder="Categoría (ej: Sopas, Carnes, Típico)" style={styles.input} value={categoria} onChangeText={setCategoria} returnKeyType="done" onSubmitEditing={Keyboard.dismiss} />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Disponible</Text>
          <Switch value={available} onValueChange={setAvailable} trackColor={{ true: "#FF6A00" }} />
        </View>

        <View style={styles.divider} />

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>💸 Tiene descuento</Text>
            <Text style={styles.switchSub}>Muestra badge PROMO en la app</Text>
          </View>
          <Switch value={tieneDescuento} onValueChange={setTieneDescuento} trackColor={{ true: "#FF6A00" }} />
        </View>
        {tieneDescuento && (
          <TextInput
            placeholder="Porcentaje de descuento (ej: 20)"
            style={styles.input}
            keyboardType="numeric"
            value={porcentajeDescuento}
            onChangeText={setPorcentajeDescuento}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />
        )}

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>🛵 Acepta domicilio</Text>
            <Text style={styles.switchSub}>Muestra botón Domicilio en la app</Text>
          </View>
          <Switch value={aceptaDomicilio} onValueChange={setAceptaDomicilio} trackColor={{ true: "#FF6A00" }} />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>📅 Acepta reserva</Text>
            <Text style={styles.switchSub}>Muestra botón Reservar en la app</Text>
          </View>
          <Switch value={aceptaReserva} onValueChange={setAceptaReserva} trackColor={{ true: "#FF6A00" }} />
        </View>

        <View style={styles.divider} />

        {editingUri ? (
          <View style={styles.photoEditor}>
            <Image source={{ uri: editingUri }} style={styles.editorPreview} resizeMode="contain" />
            <View style={styles.editorBtns}>
              <Pressable style={styles.editorBtn} onPress={handleRotate}>
                <Text style={styles.editorBtnText}>↺ Rotar</Text>
              </Pressable>
              <Pressable style={styles.editorBtn} onPress={handleCrop}>
                <Text style={styles.editorBtnText}>✂ Recortar</Text>
              </Pressable>
            </View>
            <View style={styles.editorBtns}>
              <Pressable style={[styles.editorBtn, styles.editorBtnConfirm]} onPress={handleConfirmPhoto}>
                <Text style={[styles.editorBtnText, { color: "#fff" }]}>✓ Usar foto</Text>
              </Pressable>
              <Pressable style={[styles.editorBtn, styles.editorBtnCancel]} onPress={handleCancelPhoto}>
                <Text style={[styles.editorBtnText, { color: "#CC2200" }]}>✕ Cancelar</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <Pressable style={styles.imagePicker} onPress={pickImage}>
              <Text style={styles.imagePickerText}>{imageUri ? "Cambiar foto" : "Agregar foto del plato"}</Text>
            </Pressable>
            {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}
          </>
        )}

        <Pressable style={[styles.button, saving && styles.buttonDisabled]} onPress={handleSave} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? "Guardando..." : "Guardar plato"}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 18 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 13, marginBottom: 12, backgroundColor: "#fafafa" },
  textarea: { height: 90, textAlignVertical: "top" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  switchInfo: { flex: 1, marginRight: 12 },
  switchLabel: { fontSize: 15, color: "#111", fontWeight: "500" },
  switchSub: { fontSize: 12, color: "#888", marginTop: 2 },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 12 },
  imagePicker: { backgroundColor: "#eee", padding: 14, borderRadius: 10, alignItems: "center", marginBottom: 12 },
  imagePickerText: { fontWeight: "600", color: "#333" },
  preview: { width: "100%", height: 180, borderRadius: 10, marginBottom: 16 },
  button: { backgroundColor: "#FF6A00", padding: 16, borderRadius: 10, alignItems: "center", marginTop: 8, marginBottom: 30 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  photoEditor: { marginBottom: 16, backgroundColor: "#f5f5f5", borderRadius: 12, zIndex: 10, elevation: 2 },
  editorPreview: { width: "100%", height: 240, backgroundColor: "#000", borderRadius: 12 },
  editorBtns: { flexDirection: "row", gap: 8, padding: 8, minHeight: 52 },
  editorBtn: { flex: 1, backgroundColor: "#eee", borderRadius: 8, minHeight: 44, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#ddd" },
  editorBtnText: { fontWeight: "600", color: "#333", fontSize: 14 },
  editorBtnConfirm: { backgroundColor: "#E8521A", borderColor: "#E8521A" },
  editorBtnCancel: { backgroundColor: "#fff", borderColor: "#CC2200" },
});
