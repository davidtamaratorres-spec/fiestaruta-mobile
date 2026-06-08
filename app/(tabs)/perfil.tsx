import { useCallback, useState } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { authService } from "../partner/services/AuthService";
import { backendGet } from "../services/backendApi";

type PartnerInfo = { nombre: string; ciudad: string };

export default function PerfilScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null);

  const [showLoginForm, setShowLoginForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const loadState = useCallback(async () => {
    setLoading(true);
    try {
      const isLogged = await authService.isLoggedIn();
      setLoggedIn(isLogged);
      if (isLogged) {
        try {
          const info = await backendGet<PartnerInfo>("/partner/me");
          setPartnerInfo(info);
        } catch {
          setPartnerInfo(null);
        }
      } else {
        setPartnerInfo(null);
      }
    } catch {
      setLoggedIn(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setShowLoginForm(false);
      setEmail("");
      setPassword("");
      setLoginError("");
      loadState();
    }, [loadState])
  );

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setLoginError("Completá tu email y contraseña.");
      return;
    }
    setLoginLoading(true);
    setLoginError("");
    try {
      await authService.login(email.trim(), password.trim());
      setShowLoginForm(false);
      setEmail("");
      setPassword("");
      await loadState();
    } catch (e: any) {
      setLoginError(e?.message || "Credenciales inválidas.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    Alert.alert("Cerrar sesión", "¿Seguro que querés cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async () => {
          await authService.logout();
          await loadState();
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0c0c0c" />
        <ActivityIndicator size="large" color="#E8521A" />
      </View>
    );
  }

  if (loggedIn) {
    return (
      <ScrollView contentContainerStyle={s.loggedInContainer} keyboardShouldPersistTaps="handled">
        <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />
        <Text style={s.bigIcon}>🍽️</Text>
        <Text style={s.restaurantName}>{partnerInfo?.nombre ?? "Mi restaurante"}</Text>
        {partnerInfo?.ciudad ? <Text style={s.cityText}>📍 {partnerInfo.ciudad}</Text> : null}
        <Pressable style={s.primaryBtn} onPress={() => router.push("/partner-dashboard")}>
          <Text style={s.primaryBtnText}>Mi panel</Text>
        </Pressable>
        <Pressable style={s.dangerOutlineBtn} onPress={handleLogout}>
          <Text style={s.dangerOutlineBtnText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.guestContainer} keyboardShouldPersistTaps="handled">
        <StatusBar barStyle="light-content" backgroundColor="#0c0c0c" />
        <Text style={s.bigIcon}>🍽️</Text>
        <Text style={s.guestTitle}>¿Tenés un restaurante en Colombia?</Text>
        <Pressable style={s.primaryBtn} onPress={() => router.push("/partner/auth")}>
          <Text style={s.primaryBtnText}>Registrar mi restaurante</Text>
        </Pressable>
        <Pressable style={s.outlineBtn} onPress={() => { setShowLoginForm((v) => !v); setLoginError(""); }}>
          <Text style={s.outlineBtnText}>Ya soy socio — Entrar</Text>
        </Pressable>
        {showLoginForm && (
          <View style={s.loginForm}>
            <TextInput
              style={s.input}
              placeholder="Email"
              placeholderTextColor="#888"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={s.input}
              placeholder="Contraseña"
              placeholderTextColor="#888"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {loginError ? <Text style={s.errorText}>{loginError}</Text> : null}
            <Pressable style={[s.primaryBtn, loginLoading && s.btnDisabled]} onPress={handleLogin} disabled={loginLoading}>
              {loginLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.primaryBtnText}>Entrar</Text>}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: "#0c0c0c", alignItems: "center", justifyContent: "center" },

  guestContainer: { flexGrow: 1, backgroundColor: "#0c0c0c", alignItems: "center", justifyContent: "center", paddingHorizontal: 28, paddingVertical: 40, gap: 16 },
  guestTitle: { fontSize: 20, fontWeight: "700", color: "#fff", textAlign: "center", marginBottom: 8 },

  loggedInContainer: { flexGrow: 1, backgroundColor: "#FFF8F0", alignItems: "center", justifyContent: "center", paddingHorizontal: 28, paddingVertical: 40, gap: 16 },
  restaurantName: { fontSize: 22, fontWeight: "700", color: "#1a1a1a", textAlign: "center" },
  cityText: { fontSize: 15, color: "#555", marginBottom: 8 },

  bigIcon: { fontSize: 72, marginBottom: 8 },

  primaryBtn: { backgroundColor: "#E8521A", paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12, alignItems: "center", width: "100%" },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  btnDisabled: { opacity: 0.6 },

  outlineBtn: { borderWidth: 2, borderColor: "#fff", paddingVertical: 13, paddingHorizontal: 28, borderRadius: 12, alignItems: "center", width: "100%" },
  outlineBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  dangerOutlineBtn: { borderWidth: 2, borderColor: "#e53935", paddingVertical: 13, paddingHorizontal: 28, borderRadius: 12, alignItems: "center", width: "100%" },
  dangerOutlineBtnText: { color: "#e53935", fontSize: 16, fontWeight: "600" },

  loginForm: { width: "100%", gap: 12, marginTop: 4 },
  input: { backgroundColor: "#1a1a1a", color: "#fff", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, borderWidth: 1, borderColor: "#333" },
  errorText: { color: "#ff6b6b", fontSize: 13, textAlign: "center" },
});
