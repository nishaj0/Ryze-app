import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/types";
import { login } from "../../api/auth";
import { useAuthStore } from "../../store/authStore";
import { Screen, Button, Input, Typography, Card, Icon } from "../../components";
import { useTheme } from "../../theme/themeStore";
import { space } from "../../theme/spacing";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const theme = useTheme();
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
    <Screen scroll padding="lg">
      <View style={{ flex: 1, justifyContent: "center" }}>
        {/* Brand Header */}
        <View style={{ alignItems: "center", marginBottom: space.xl }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: theme.primary,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: space.md,
            }}
          >
            <Icon name="Dumbbell" size={32} color={theme.primaryText} />
          </View>
          <Typography variant="display" color={theme.textPrimary} align="center">
            Ryze
          </Typography>
          <Typography variant="body" color={theme.textSecondary} align="center" style={{ marginTop: space.sm }}>
            Track your gains. Rise above.
          </Typography>
        </View>

        {/* Error Card */}
        {errorMsg && (
          <Card
            padding="md"
            border
            shadow="none"
            style={{
              backgroundColor: theme.errorBg,
              borderColor: theme.error,
              marginBottom: space.md,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <Icon name="AlertCircle" size={20} color={theme.error} />
              <Typography variant="bodySmall" color={theme.errorText}>
                {errorMsg}
              </Typography>
            </View>
          </Card>
        )}

        {/* Form */}
        <View style={{ gap: space.md }}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            icon={<Icon name="Mail" size={20} color={theme.textMuted} />}
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Min 8 characters"
            secureTextEntry
            icon={<Icon name="Lock" size={20} color={theme.textMuted} />}
          />
        </View>

        <View style={{ marginTop: space.lg }}>
          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            variant="primary"
            size="lg"
            icon={<Icon name="LogIn" size={20} color={theme.primaryText} />}
          />
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate("Register")}
          style={{ marginTop: space.lg, alignItems: "center" }}
        >
          <Typography variant="body" color={theme.textSecondary}>
            Don't have an account?{" "}
            <Typography variant="body" color={theme.primary} weight="600">
              Sign Up
            </Typography>
          </Typography>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}
