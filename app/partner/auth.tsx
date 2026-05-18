import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { authService } from "./services/AuthService";

export default function PartnerAuthScreen() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleContinue = async () => {
    if (!email.trim()) {
      Alert.alert("Ingresa el correo del restaurante");
      return;
    }

    try {
      const ok = await authService.login(email.trim().toLowerCase());

      if (!ok) {
        Alert.alert(
          "Acceso socios",
          "No existe un restaurante con ese correo. Regístralo primero."
        );
        return;
      }

      router.replace("/partner/home");
    } catch {
      Alert.alert("Error", "No se pudo validar el acceso");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Acceso para socios</Text>

      <TextInput
        placeholder="Correo del restaurante"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Pressable style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continuar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#FF6A00",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
});
