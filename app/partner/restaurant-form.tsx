import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";

import { Restaurant } from "./models/Restaurant";
import { authService } from "./services/AuthService";
import { saveRestaurant } from "./storage/partnerStorage";

export default function RestaurantFormScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [promo, setPromo] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (saving) return;

    if (!name.trim() || !city.trim()) {
      Alert.alert("Datos incompletos", "Nombre y ciudad son obligatorios.");
      return;
    }

    setSaving(true);

    try {
      const currentUser = await authService.getCurrentUser();

      if (!currentUser) {
        Alert.alert(
          "Sesión requerida",
          "Debes iniciar sesión antes de registrar un restaurante."
        );
        router.replace("/partner/auth");
        return;
      }

      const restaurant: Restaurant = {
        id: Crypto.randomUUID(),
        userId: currentUser.id,
        name: name.trim(),
        city: city.trim(),
        whatsapp: whatsapp.trim(),
        promo: promo.trim(),
        createdAt: new Date().toISOString(),
      };

      await saveRestaurant(restaurant);

      Alert.alert("Restaurante guardado", "El restaurante quedó asociado a tu cuenta.", [
        {
          text: "OK",
          onPress: () => router.replace("/partner/home"),
        },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error?.message ?? "No se pudo guardar el restaurante.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Registrar restaurante</Text>

      <TextInput
        placeholder="Nombre del restaurante"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <TextInput
        placeholder="Ciudad"
        style={styles.input}
        value={city}
        onChangeText={setCity}
      />

      <TextInput
        placeholder="WhatsApp"
        style={styles.input}
        value={whatsapp}
        onChangeText={setWhatsapp}
        keyboardType="phone-pad"
      />

      <TextInput
        placeholder="Promoción o beneficio"
        style={[styles.input, styles.textarea]}
        value={promo}
        onChangeText={setPromo}
        multiline
      />

      <Pressable
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.buttonText}>
          {saving ? "Guardando..." : "Guardar restaurante"}
        </Text>
      </Pressable>
    </ScrollView>
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
    height: 90,
  },
  button: {
    backgroundColor: "#FF6A00",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});