import { router } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";

export default function ReviewScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Review Extracted Data</Text>
      <Text style={styles.subtext}>(Editable JSON inputs go here)</Text>

      <View style={{ marginTop: 20 }}>
        <Button
          title="Save to SQLite & Close"
          onPress={() => router.dismissAll()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
  },
  subtext: {
    fontSize: 14,
    color: "gray",
    marginTop: 8,
  },
});
