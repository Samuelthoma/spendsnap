import { initDb } from "@/db";
import { Stack } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {

  useEffect(() => {
    initDb().catch(console.error);
  }, []);

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="review"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="details"
          options={{ headerShown: false }}
        />
      </Stack>
    </>
  );
}
