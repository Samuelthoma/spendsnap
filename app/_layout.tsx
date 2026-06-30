import { useTheme } from "@/constants/theme";
import { initDb } from "@/db";
import { useAppStore } from "@/store/useAppStore";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

export default function RootLayout() {
  const isDarkMode = useAppStore((s) => s.isDarkMode);
  const theme = useTheme();

  useEffect(() => {
    initDb().catch(console.error);
  }, []);

  return (
    <>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="review" options={{ headerShown: false }} />
        <Stack.Screen name="details" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
