import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "./navigation/RootNavigator";
import { useTheme } from "./theme/themeStore";
import { initMMKV } from "./utils/mmkv";

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
    },
  },
});

export default function App() {
  const theme = useTheme();
  const [mmkvLoaded, setMmkvLoaded] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    initMMKV()
      .then(() => setMmkvLoaded(true))
      .catch((err) => {
        console.error("MMKV init failed:", err);
        setMmkvLoaded(true); // fall through so app doesn't hang forever
      });
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && mmkvLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, mmkvLoaded]);

  if ((!fontsLoaded && !fontError) || !mmkvLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.bg }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={theme.bg === "#161513" ? "light" : "dark"} />
        <RootNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
