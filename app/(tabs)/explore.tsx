import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useState } from "react";

import { authService } from "../partner/services/AuthService";

export default function SoyScioScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Ingresa tu email y contraseña.");
      return;
    }
    setLoading(true);
    try {
      await authService.login(email.trim(), password);
      router.replace("/partner-dashboard");
    } catch (e: any) {
      setError(e.message || "No se pudo iniciar sesión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.logo}>🍽️</Text>
        <Text style={styles.title}>Soy Socio</Text>
        <Text style={styles.subtitle}>Accede al panel de tu restaurante</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor="#999"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Entrar</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.push("/partner/auth")}>
          <Text style={styles.link}>¿No tienes cuenta? Regístrate aquí</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF8F0" },
  container: {
    flex: 1,
    padding: 28,
    justifyContent: "center",
    gap: 14,
  },
  logo: { fontSize: 48, textAlign: "center" },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  errorText: {
    color: "#CC2200",
    fontSize: 13,
    textAlign: "center",
    backgroundColor: "#FFE8E3",
    borderRadius: 8,
    padding: 10,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0D4C8",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1A1A1A",
  },
  btn: {
    backgroundColor: "#E8521A",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: {
    color: "#E8521A",
    textAlign: "center",
    fontSize: 14,
    marginTop: 4,
  },
});
