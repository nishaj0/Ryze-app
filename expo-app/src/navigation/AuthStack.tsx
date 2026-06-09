import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthStackParamList } from "./types";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: "#0F172A" }, headerTintColor: "#fff" }}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Sign In" }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Create Account" }} />
    </Stack.Navigator>
  );
}
