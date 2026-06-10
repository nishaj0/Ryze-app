import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/types";
import { login } from "../../api/auth";
import { useAuthStore } from "../../store/authStore";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { setAuth } = useAuthStore();

  const handleLogin = async () => {
    setErrorMsg(null);
    if (!email || !password) {
      setErrorMsg("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const res = await login(email, password);
      await setAuth(res.token, res.user);
    } catch (err: any) {
      let message = "Something went wrong";
      if (!err.response) {
        message = "Cannot connect to server. Make sure the backend is running and your device is on the same network.";
      } else if (err.response?.data?.error) {
        message = err.response.data.error;
      } else if (err.response?.status) {
        message = `Server error (${err.response.status}). Please try again.`;
      }
      setErrorMsg(message);
      console.error("[LoginScreen] login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24, backgroundColor: "#0F172A" }}>
      <Text style={{ fontSize: 36, fontWeight: "bold", color: "#fff", marginBottom: 8 }}>Ryze</Text>
      <Text style={{ fontSize: 16, color: "#94A3B8", marginBottom: 40 }}>Track your gains. Rise above.</Text>

      <Text style={{ color: "#CBD5E1", marginBottom: 8, fontSize: 14 }}>Email</Text>
      <TextInput
        style={{ backgroundColor: "#1E293B", borderRadius: 12, padding: 16, color: "#fff", marginBottom: 16, fontSize: 16 }}
        value={email}
        onChangeText={setEmail}
        placeholder="your@email.com"
        placeholderTextColor="#475569"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={{ color: "#CBD5E1", marginBottom: 8, fontSize: 14 }}>Password</Text>
      <TextInput
        style={{ backgroundColor: "#1E293B", borderRadius: 12, padding: 16, color: "#fff", marginBottom: errorMsg ? 12 : 24, fontSize: 16 }}
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        placeholderTextColor="#475569"
        secureTextEntry
      />

      {errorMsg ? (
        <View style={{ backgroundColor: "#7F1D1D", padding: 12, borderRadius: 8, marginBottom: 24 }}>
          <Text style={{ color: "#FECACA", fontSize: 14 }}>{errorMsg}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        style={{ backgroundColor: "#6366F1", borderRadius: 12, padding: 16, alignItems: "center", opacity: loading ? 0.7 : 1 }}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Sign In</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Register")} style={{ marginTop: 20, alignItems: "center" }}>
        <Text style={{ color: "#94A3B8" }}>
          Don't have an account? <Text style={{ color: "#6366F1", fontWeight: "600" }}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
