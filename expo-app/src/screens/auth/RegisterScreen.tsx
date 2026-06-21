import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/types";
import { register } from "../../api/auth";
import { useAuthStore } from "../../store/authStore";
import { Screen, Button, Input, Typography, Card, Icon } from "../../components";
import { useTheme } from "../../theme/themeStore";
import { space } from "../../theme/spacing";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState("");
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { setAuth } = useAuthStore();

  const handleRegister = async () => {
    setErrorMsg(null);
    if (!email || !password) {
      setErrorMsg("Please fill in all required fields");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await register(email, password, name || undefined);
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
      console.error("[RegisterScreen] register error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll padding="lg">
      <View style={{ flex: 1, justifyContent: "center" }}>
        {/* Header */}
        <View style={{ marginBottom: space.xl }}>
          <Typography variant="heading2" color={theme.textPrimary}>
            Create Account
          </Typography>
          <Typography variant="body" color={theme.textSecondary} style={{ marginTop: space.sm }}>
            Join Ryze and start tracking your progress
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
            label="Name (optional)"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            icon={<Icon name="User" size={20} color={theme.textMuted} />}
          />

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
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            variant="primary"
            size="lg"
            icon={<Icon name="UserPlus" size={20} color={theme.primaryText} />}
          />
        </View>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginTop: space.lg, alignItems: "center" }}
        >
          <Typography variant="body" color={theme.textSecondary}>
            Already have an account?{" "}
            <Typography variant="body" color={theme.primary} weight="600">
              Sign In
            </Typography>
          </Typography>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}
