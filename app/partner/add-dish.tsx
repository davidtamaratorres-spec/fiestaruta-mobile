import * as Crypto from "expo-crypto";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
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

import { createBackendDish } from "../services/backendDishes";
import { Dish } from "./models/Dish";
import { authService } from "./services/AuthService";
import { addDish, loadPartnerData } from "./storage/partnerStorage";

export default function AddDishScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [available, setAvailable] = useState(true);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
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

    setSaving(true);

    try {
      const currentUser = await authService.getCurrentUser();

      if (!currentUser) {
        Alert.alert("Sesión requerida", "Debes iniciar sesión para agregar platos.");
        router.replace("/partner/auth");
        return;
      }

      const data = await loadPartnerData();

      const restaurantIdFromParams =
        typeof params.restaurantId === "string" ? params.restaurantId : "";

      const restaurant =
        data.restaurants.find(
          (r) => r.id === restaurantIdFromParams && r.userId === currentUser.id
        ) ??
        data.restaurants.find((r) => r.userId === currentUser.id);

      if (!restaurant) {
        Alert.alert(
          "No hay restaurante",
          "Primero registra tu restaurante antes de agregar platos."
        );
        router.replace("/partner/home");
        return;
      }

      const newDish: Dish = {
        id: Crypto.randomUUID(),
        restaurantId: restaurant.id,
        name: name.trim(),
        price: precioNum,
        description: description.trim(),
        available,
        imageUri: imageUri || undefined,
      };

      await addDish(newDish);

      const idCandidate = Number((restaurant as any).id);

      if (Number.isFinite(idCandidate)) {
        await createBackendDish({
          restaurante_id: idCandidate,
          nombre: name.trim(),
          descripcion: description.trim(),
          precio: precioNum,
          categoria: "General",
          imagen_url: "",
          disponible: available ? 1 : 0,
        });
      }

      Alert.alert("Plato guardado", "El plato quedó asociado a tu restaurante.", [
        {
          text: "OK",
          onPress: () => router.replace("/partner/home"),
        },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Agregar plato</Text>

        <TextInput
          placeholder="Nombre del plato"
          style={styles.input}
          value={name}
          onChangeText={setName}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />

        <TextInput
          placeholder="Precio"
          style={styles.input}
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />

        <TextInput
          placeholder="Descripción"
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <View style={styles.switchRow}>
          <Text>Disponible</Text>
          <Switch value={available} onValueChange={setAvailable} />
        </View>

        <Pressable style={styles.imagePicker} onPress={pickImage}>
          <Text style={styles.imagePickerText}>
            {imageUri ? "Cambiar foto" : "Agregar foto del plato"}
          </Text>
        </Pressable>

        {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}

        <Pressable
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {saving ? "Guardando..." : "Guardar plato"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  textarea: {
    height: 80,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  imagePicker: {
    backgroundColor: "#eee",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  imagePickerText: {
    fontWeight: "600",
  },
  preview: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#FF6A00",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 30,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});