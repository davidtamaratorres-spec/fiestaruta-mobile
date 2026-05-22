import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { authService } from "./services/AuthService";

export default function PartnerAuthScreen() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit() {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      Alert.alert("Datos incompletos", "Ingresa correo y contraseña.");
      return;
    }

    try {
      if (mode === "register") {
        await authService.register(cleanEmail, cleanPassword);

        Alert.alert("Registro exitoso", "Tu cuenta de socio fue creada.", [
          {
            text: "Continuar",
            onPress: () => router.replace("/partner/home"),
          },
        ]);

        return;
      }

      const user = await authService.login(cleanEmail, cleanPassword);

      if (!user) {
        Alert.alert(
          "Acceso denegado",
          "Correo o contraseña incorrectos. Si no tienes cuenta, regístrate primero."
        );
        return;
      }

      router.replace("/partner/home");
    } catch (error: any) {
      Alert.alert("Error", error?.message ?? "No se pudo validar el acceso.");
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Acceso para socios</Text>

        <Text style={styles.subtitle}>
          {mode === "login"
            ? "Ingresa con tu correo y contraseña."
            : "Crea una cuenta para administrar tus restaurantes y platos."}
        </Text>

        <TextInput
          placeholder="Correo del restaurante"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
        />

        <Pressable style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>
            {mode === "login" ? "Ingresar" : "Registrarse"}
          </Text>
        </Pressable>

        <Pressable
          style={styles.linkButton}
          onPress={() => setMode(mode === "login" ? "register" : "login")}
        >
          <Text style={styles.linkText}>
            {mode === "login"
              ? "No tengo cuenta. Registrarme"
              : "Ya tengo cuenta. Ingresar"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#FAFAFA",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: "#eee",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#666",
    marginBottom: 18,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 13,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#FF6A00",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
  linkButton: {
    marginTop: 16,
    alignItems: "center",
  },
  linkText: {
    color: "#FF6A00",
    fontWeight: "600",
  },
});