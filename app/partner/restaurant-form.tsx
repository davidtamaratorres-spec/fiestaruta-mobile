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
import { saveRestaurant } from "./storage/partnerStorage";

export default function RestaurantFormScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [promo, setPromo] = useState("");

  async function handleSave() {
    if (!name.trim() || !city.trim()) {
      Alert.alert(
        "Datos obligatorios",
        "El nombre del restaurante y la ciudad son obligatorios"
      );
      return;
    }

    const restaurant: Restaurant = {
      id: Crypto.randomUUID(),          // ✅ Expo compatible
      userId: "local-partner",          // ✅ como cuando funcionaba
      name: name.trim(),
      city: city.trim(),
      whatsapp: whatsapp.trim() || undefined,
      promo: promo.trim() || undefined,
      createdAt: Date.now(),            // ✅ requerido por el modelo
    };

    try {
      await saveRestaurant(restaurant);
      Alert.alert("Éxito", "Restaurante registrado correctamente");
      router.replace("/partner/home");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo guardar el restaurante");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Mi restaurante</Text>

      <TextInput
        placeholder="Nombre del restaurante *"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <TextInput
        placeholder="Ciudad *"
        value={city}
        onChangeText={setCity}
        style={styles.input}
      />

      <TextInput
        placeholder="WhatsApp (opcional)"
        value={whatsapp}
        onChangeText={setWhatsapp}
        style={styles.input}
        keyboardType="phone-pad"
      />

      <TextInput
        placeholder="Promoción (opcional)"
        value={promo}
        onChangeText={setPromo}
        style={styles.input}
      />

      <Pressable style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Guardar restaurante</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  button: {
    backgroundColor: "#FF6A00",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});


