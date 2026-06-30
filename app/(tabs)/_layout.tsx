import {
  SpaceGrotesk_600SemiBold,
  useFonts
} from '@expo-google-fonts/space-grotesk';
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AlertContainer } from 'react-native-alert-queue';

export default function TabLayout() {
  let [fontsLoaded] = useFonts({
    SpaceGrotesk_600SemiBold,
  });

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#4F46E5",
          tabBarInactiveTintColor: "#94A3B8",
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "History",
            tabBarLabel: "Home",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="split"
          options={{
            title: "Split Bill",
            tabBarLabel: "Split",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "git-branch" : "git-branch-outline"} size={24} color={color} />
            )
          }}
        />

        <Tabs.Screen
          name="scanner"
          options={{
            title: "Scanner",
            tabBarLabel: "Scan",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "scan" : "scan-outline"} size={24} color={color} />
            )
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarLabel: "Settings",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "settings" : "settings-outline"} size={24} color={color} />
            ),
          }}
        />
      </Tabs>
      <AlertContainer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  tabBar: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    height: 100,
  },

  tabBarLabel: {
    fontFamily: "SpaceGrotesk_600SemiBold",
    fontSize: 11,
  },

  fabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});