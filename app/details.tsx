import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  useFonts,
} from "@expo-google-fonts/space-grotesk";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { alert } from 'react-native-alert-queue';
import { getCategoryVisuals } from "../constants/categories";
import {
  deleteReceipt,
  getReceiptById,
  getReceiptDetails,
} from "../db/queries/receipts";

const formatIDR = (value: number) =>
  value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export default function DetailsScreen() {
  const { id } = useLocalSearchParams();
  const [receipt, setReceipt] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  let [fontsLoaded] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    const fetchFullReceipt = async () => {
      if (!id || typeof id !== "string") return;

      try {
        setIsLoading(true);
        const parentData = await getReceiptById(id);

        if (parentData) {
          const childData = await getReceiptDetails(id);

          setReceipt({
            ...parentData,
            items: childData,
          });
        }
      } catch (error) {
        console.error("Failed to load receipt details:", error);
        alert.error(new Error('Gagal memuat detail struk.'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchFullReceipt();
  }, [id]);

  const handleDelete = async () => {
    const confirmed = await alert.confirm({
      title: "Hapus Transaksi",
      message: "Apakah Anda yakin ingin menghapus data struk ini secara permanen?",
    });

    if (!confirmed) return;

    try {
      if (typeof id === "string") {
        await deleteReceipt(id);

        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/");
        }
      }
    } catch (error) {
      alert.error(
        new Error("Tidak dapat menghapus struk saat ini.")
      );
    }
  };

  if (!fontsLoaded) return null;

  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#111827" />
      </SafeAreaView>
    );
  }

  if (!receipt) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ fontFamily: "Inter_500Medium", color: "#6B7280" }}>
          Struk tidak ditemukan.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 16 }}
        >
          <Text style={{ color: "#007AFF", fontFamily: "Inter_600SemiBold" }}>
            Kembali
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const visual = getCategoryVisuals(receipt.category);

  const formattedDate = new Date(receipt.scan_date).toLocaleDateString(
    "id-ID",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
            <Ionicons name="trash-outline" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.receiptCard}>
          <View style={styles.summarySection}>
            <View style={[styles.iconLarge, { backgroundColor: visual.bg }]}>
              <Ionicons
                name={visual.icon as any}
                size={32}
                color={visual.color}
              />
            </View>
            <Text style={styles.merchantName}>{receipt.merchant}</Text>
            <Text style={styles.totalAmount}>
              Rp {formatIDR(receipt.total_amount)}
            </Text>

            <View style={styles.badgeContainer}>
              <View
                style={[styles.categoryBadge, { backgroundColor: visual.bg }]}
              >
                <Text
                  style={[styles.categoryBadgeText, { color: visual.color }]}
                >
                  {visual.label}
                </Text>
              </View>
            </View>

            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>

          <View style={styles.separatorContainer}>
            <View style={styles.cutoutLeft} />
            <View style={styles.dashedLine} />
            <View style={styles.cutoutRight} />
          </View>

          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Rincian Pembelian</Text>

            {receipt.items && receipt.items.length > 0 ? (
              receipt.items.map((item: any) => {
                const itemTotal = item.quantity * item.price;
                return (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={styles.itemRowLeft}>
                      <Text style={styles.itemName}>{item.item_name}</Text>
                      <Text style={styles.itemQtyPrice}>
                        {item.quantity} x Rp {formatIDR(item.price)}
                      </Text>
                    </View>
                    <View style={styles.itemRowRight}>
                      <Text style={styles.itemTotal}>
                        Rp {formatIDR(itemTotal)}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <Text
                style={{
                  fontFamily: "Inter_500Medium",
                  color: "#9CA3AF",
                  fontStyle: "italic",
                }}
              >
                Tidak ada rincian item.
              </Text>
            )}

            <View style={styles.metadataSection}>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>ID Transaksi</Text>
                <Text style={styles.metadataValue}>
                  {receipt.id.split("-")[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Sumber</Text>
                <Text style={styles.metadataValue}>AI Scanner</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#F8FAFC",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  headerActions: {
    flexDirection: "row",
  },
  iconButton: {
    padding: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  receiptCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    overflow: "hidden",
  },
  summarySection: {
    alignItems: "center",
    padding: 32,
  },
  iconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  merchantName: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 18,
    color: "#0F172A",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  totalAmount: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 40,
    color: "#1E1B4B",
    marginBottom: 16,
    letterSpacing: -1.5,
  },
  badgeContainer: {
    marginBottom: 16,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontFamily: "SpaceGrotesk_600SemiBold",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateText: {
    fontFamily: "SpaceGrotesk_500Medium",
    fontSize: 14,
    color: "#64748B",
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 24,
    backgroundColor: "#FFFFFF",
    position: "relative",
  },
  cutoutLeft: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    position: "absolute",
    left: -12,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    marginHorizontal: 16,
  },
  cutoutRight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    position: "absolute",
    right: -12,
  },
  detailsSection: {
    padding: 24,
    paddingTop: 16,
  },
  sectionTitle: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 16,
    color: "#0F172A",
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  itemRowLeft: {
    flex: 1,
    paddingRight: 16,
  },
  itemName: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 15,
    color: "#0F172A",
    marginBottom: 4,
  },
  itemQtyPrice: {
    fontFamily: "SpaceGrotesk_500Medium",
    fontSize: 13,
    color: "#64748B",
  },
  itemRowRight: {
    justifyContent: "center",
  },
  itemTotal: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 15,
    color: "#0F172A",
  },
  metadataSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  metadataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  metadataLabel: {
    fontFamily: "SpaceGrotesk_500Medium",
    fontSize: 13,
    color: "#94A3B8",
  },
  metadataValue: {
    fontFamily: "SpaceGrotesk_600SemiBold",
    fontSize: 13,
    color: "#475569",
  },
});
