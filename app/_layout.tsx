import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="scanner"
        options={{ presentation: "fullScreenModal", headerShown: false }}
      />
      <Stack.Screen
        name="review"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="details"
        options={{ presentation: "modal", headerShown: false }}
      />
    </Stack>
  );
}
