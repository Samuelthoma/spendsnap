import { initDb } from "@/db";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { AlertContainer } from 'react-native-alert-queue';

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
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="details"
          options={{ presentation: "modal", headerShown: false }}
        />
      </Stack>
      <AlertContainer />
    </>
  );
}
