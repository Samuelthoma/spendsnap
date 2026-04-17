import { router, Tabs } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function TabLayout() {
  return (
    <View style={styles.container}>
      <Tabs screenOptions={{ tabBarActiveTintColor: "#007AFF" }}>
        <Tabs.Screen
          name="index"
          options={{ title: "History", tabBarLabel: "Home" }}
        />
        <Tabs.Screen
          name="settings"
          options={{ title: "Settings", tabBarLabel: "Settings" }}
        />
      </Tabs>

      <Pressable
        style={styles.floatingButton}
        onPress={() => router.push("/scanner")}
      >
        <Text style={styles.buttonIcon}>📷</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingButton: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    backgroundColor: "#007AFF",
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonIcon: {
    fontSize: 24,
    color: "white",
  },
});
