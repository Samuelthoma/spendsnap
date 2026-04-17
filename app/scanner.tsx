import { router } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";

export default function ScannerScreen() {
  return (
    <View>
      <Text style={styles.text}>Scanner View</Text>
      <Text style={styles.subtext}>(Expo Camera & ML Kit go here)</Text>

      <View>
        <Button
          title="Simulate Scan Success -> Go to Review"
          onPress={() => router.replace("/review")}
        />
        <View style={{ marginTop: 20 }}>
          <Button title="Cancel" onPress={() => router.back()} color="red" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  subtext: {
    fontSize: 14,
    color: "lightgray",
    marginTop: 8,
  },
});
