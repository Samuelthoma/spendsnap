import { getRecentReceipts } from "@/db/queries/receipts";
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  useFonts,
} from "@expo-google-fonts/space-grotesk";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCategoryVisuals } from "../../constants/categories";

const formatIDR = (value: number) => {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const ReceiptItem = ({ item }: { item: any }) => {
  const formattedDate = new Date(item.scan_date).toLocaleDateString("id-ID", {
    month: "short",
    day: "numeric",
  });

  const visual = getCategoryVisuals(item.category);

  return (
    <TouchableOpacity
      style={styles.itemContainer}
      activeOpacity={0.7}
      onPress={() =>
        router.push({
          pathname: "/details",
          params: { id: item.id },
        })
      }
    >
      <View style={styles.itemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: visual.bg }]}>
          <Ionicons name={visual.icon as any} size={22} color={visual.color} />
        </View>

        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text
            style={styles.merchantText}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.merchant}
          </Text>
          <Text style={styles.categoryText}>{visual.label}</Text>
        </View>
      </View>

      <View style={styles.itemRight}>
        <Text style={styles.valueText}>Rp {formatIDR(item.total_amount)}</Text>
        <Text style={styles.dateText}>{formattedDate}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  let [fontsLoaded] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchReceipts = async () => {
        try {
          setIsLoading(true);
          const data = await getRecentReceipts(20);
          if (isActive) {
            setReceipts(data);
          }
        } catch (error) {
          console.error("Failed to load receipts from SQLite", error);
        } finally {
          if (isActive) setIsLoading(false);
        }
      };

      fetchReceipts();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const currentMonthTotal = receipts.reduce(
    (sum, item) => sum + (item.total_amount || 0),
    0,
  );

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Total Pengeluaran</Text>
          <Text
            style={styles.overviewTotal}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            <Text style={styles.currencySymbol}>Rp </Text>
            {formatIDR(currentMonthTotal)}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardFooterText}>Riwayat Terbaru</Text>
          </View>
        </View>

        <View style={styles.listHeaderContainer}>
          <Text style={styles.listHeader}>Aktivitas Terakhir</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#111827" />
          </View>
        ) : (
          <FlatList
            data={receipts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ReceiptItem item={item} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="scan-circle-outline"
                  size={64}
                  color="#D1D5DB"
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyText}>Belum ada struk.</Text>
                <Text style={styles.emptySubtext}>
                  Ketuk kamera untuk mulai mencatat.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FDFDFA",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  overviewCard: {
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    borderWidth: 4,
    borderColor: "#000000",
    padding: 24,
    marginTop: 12,
    marginBottom: 32,
    shadowColor: "#000000",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  overviewTitle: {
    color: "#000000",
    fontFamily: "SpaceGrotesk_600SemiBold",
    fontSize: 14,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  overviewTotal: {
    color: "#000000",
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 40,
    letterSpacing: -2,
  },
  currencySymbol: {
    fontSize: 28,
    color: "#000000",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  cardFooter: {
    marginTop: 24,
    borderTopWidth: 4,
    borderTopColor: "#000000",
    paddingTop: 16,
  },
  cardFooterText: {
    color: "#000000",
    fontFamily: "SpaceGrotesk_500Medium",
    fontSize: 14,
    textTransform: "uppercase",
  },

  listHeaderContainer: { marginBottom: 16 },
  listHeader: {
    fontSize: 22,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#000000",
    textTransform: "uppercase",
    letterSpacing: -0.5,
  },
  listContent: { paddingBottom: 120 },

  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#000000",
    borderRadius: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  itemLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  merchantText: {
    fontSize: 16,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#000000",
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: "SpaceGrotesk_500Medium",
    color: "#000000",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  itemRight: { alignItems: "flex-end" },
  valueText: {
    fontSize: 16,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#000000",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    fontFamily: "SpaceGrotesk_500Medium",
    color: "#000000",
  },

  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    backgroundColor: "#E5E7EB",
    borderWidth: 3,
    borderColor: "#000000",
    borderRadius: 12,
    marginTop: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  emptyIcon: { marginBottom: 16, color: "#000000" },
  emptyText: {
    color: "#000000",
    fontSize: 20,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  emptySubtext: {
    color: "#000000",
    fontFamily: "SpaceGrotesk_500Medium",
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
});
