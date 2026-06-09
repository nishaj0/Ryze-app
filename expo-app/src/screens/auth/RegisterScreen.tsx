import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/types";
import { register } from "../../api/auth";
import { useAuthStore } from "../../store/authStore";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await register(email, password, name || undefined);
      await setAuth(res.token, res.user);
    } catch (err: any) {
      Alert.alert("Registration Failed", err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24, backgroundColor: "#0F172A" }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", color: "#fff", marginBottom: 32 }}>Create Account</Text>

      <Text style={{ color: "#CBD5E1", marginBottom: 8, fontSize: 14 }}>Name (optional)</Text>
      <TextInput
        style={{ backgroundColor: "#1E293B", borderRadius: 12, padding: 16, color: "#fff", marginBottom: 16, fontSize: 16 }}
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        placeholderTextColor="#475569"
      />

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
        style={{ backgroundColor: "#1E293B", borderRadius: 12, padding: 16, color: "#fff", marginBottom: 24, fontSize: 16 }}
        value={password}
        onChangeText={setPassword}
        placeholder="Min 8 characters"
        placeholderTextColor="#475569"
        secureTextEntry
      />

      <TouchableOpacity
        onPress={handleRegister}
        disabled={loading}
        style={{ backgroundColor: "#6366F1", borderRadius: 12, padding: 16, alignItems: "center" }}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Create Account</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20, alignItems: "center" }}>
        <Text style={{ color: "#94A3B8" }}>
          Already have an account? <Text style={{ color: "#6366F1", fontWeight: "600" }}>Sign In</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
