import { CATEGORIES, getCategoryVisuals } from "@/constants/categories";
import {
  insertReceiptWithDetails,
  ReceiptPayload,
} from "@/db/queries/receipts";
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
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReviewScreen() {
  const params = useLocalSearchParams();

  const [receipt, setReceipt] = useState({ merchant: "", category: "" });
  const [items, setItems] = useState<any[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  let [fontsLoaded] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    let dataToLoad;
    if (params.extractedData) {
      try {
        dataToLoad = JSON.parse(params.extractedData as string);
      } catch (e) {
        console.log("Failed to parse AI data, using fallback");
      }
    }

    setReceipt({
      merchant: dataToLoad.merchant || "",
      category: dataToLoad.category || "Lainnya",
    });

    const formattedItems = (dataToLoad.items || []).map(
      (item: any, index: number) => ({
        ...item,
        id: item.id || Date.now().toString() + index,
        price: item.price?.toString() || "0",
        qty: item.qty?.toString() || "1",
      }),
    );

    setItems(formattedItems);
  }, [params.extractedData]);

  const calculatedTotal = items.reduce(
    (sum, item) =>
      sum + (parseInt(item.price) || 0) * (parseInt(item.qty) || 1),
    0,
  );

  const handleUpdateItem = (id: string, field: string, newValue: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: newValue } : item,
      ),
    );
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), name: "", price: "", qty: "1" },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveToDatabase = async () => {
    if (items.length === 0) {
      Alert.alert(
        "Validasi",
        "Minimal harus ada satu rincian item untuk disimpan.",
      );
      return;
    }
    if (!receipt.merchant.trim()) {
      Alert.alert("Validasi", "Nama merchant tidak boleh kosong.");
      return;
    }

    setIsSaving(true);

    try {
      const payload: ReceiptPayload = {
        merchant: receipt.merchant,
        category: receipt.category,
        totalAmount: calculatedTotal,
        scanDate: new Date().toISOString(),
        items: items.map((item) => ({
          name: item.name || "Item Tanpa Nama",
          price: parseInt(item.price) || 0,
          qty: parseInt(item.qty) || 1,
        })),
      };

      await insertReceiptWithDetails(payload);

      Alert.alert(
        "Tersimpan!",
        "Data struk berhasil ditambahkan ke riwayat Anda.",
        [{ text: "OK", onPress: () => router.dismissAll() }],
      );
    } catch (error) {
      console.error("Failed to save receipt:", error);
      Alert.alert(
        "Gagal Menyimpan",
        "Terjadi kesalahan saat menyimpan ke database lokal.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!fontsLoaded) return null;

  const selectedCat = getCategoryVisuals(receipt.category);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <Modal visible={showCategoryPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Kategori Struk</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={CATEGORIES}
              keyExtractor={(item) => item.value}
              numColumns={2}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoryOption}
                  onPress={() => {
                    setReceipt({ ...receipt, category: item.value });
                    setShowCategoryPicker(false);
                  }}
                >
                  <View
                    style={[styles.modalIconBox, { backgroundColor: item.bg }]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={item.color}
                    />
                  </View>
                  <Text style={styles.categoryOptionLabel} numberOfLines={1}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.modalList}
            />
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tinjau Struk</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        extraScrollHeight={40}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.masterCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt-outline" size={18} color="#9CA3AF" />
            <Text style={styles.cardTitle}>Data Utama</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Merchant</Text>
            <TextInput
              style={styles.input}
              value={receipt.merchant}
              onChangeText={(val) => setReceipt({ ...receipt, merchant: val })}
              placeholder="Nama Toko"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1.2, marginRight: 12 }]}>
              <Text style={styles.label}>Kategori Struk</Text>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => setShowCategoryPicker(true)}
              >
                <View
                  style={[
                    styles.tinyIconBox,
                    { backgroundColor: selectedCat.bg },
                  ]}
                >
                  <Ionicons
                    name={selectedCat.icon as any}
                    size={14}
                    color={selectedCat.color}
                  />
                </View>
                <Text style={styles.dropdownText} numberOfLines={1}>
                  {selectedCat.label}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Total (Rp)</Text>
              <View style={styles.readOnlyInput}>
                <Text
                  style={styles.readOnlyText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {calculatedTotal.toLocaleString("id-ID")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Rincian Item ({items.length})</Text>
        </View>

        {items.map((item, index) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemCardTop}>
              <View style={styles.itemNumberBox}>
                <Text style={styles.itemNumber}>{index + 1}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveItem(item.id)}
                style={styles.deleteBtn}
              >
                <Ionicons name="close" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <TextInput
                style={styles.itemInputLarge}
                value={item.name}
                onChangeText={(val) => handleUpdateItem(item.id, "name", val)}
                placeholder="Nama Barang"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 0.4, marginRight: 12 }]}>
                <Text style={styles.labelTiny}>Qty</Text>
                <TextInput
                  style={styles.itemInputSmall}
                  value={item.qty}
                  onChangeText={(val) =>
                    handleUpdateItem(item.id, "qty", val.replace(/[^0-9]/g, ""))
                  }
                  keyboardType="numeric"
                  textAlign="center"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.labelTiny}>Harga Satuan (Rp)</Text>
                <TextInput
                  style={styles.itemInputSmall}
                  value={item.price}
                  onChangeText={(val) =>
                    handleUpdateItem(
                      item.id,
                      "price",
                      val.replace(/[^0-9]/g, ""),
                    )
                  }
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addItemBtn} onPress={handleAddItem}>
          <Ionicons name="add" size={20} color="#007AFF" />
          <Text style={styles.addItemText}>Tambah Item Manual</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveToDatabase}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Simpan ke Database</Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingVertical: 16,
    backgroundColor: "#F8FAFC",
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#0F172A",
  },
  backButton: {
    padding: 8,
    marginLeft: -4,
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
    padding: 20,
    paddingBottom: 40,
  },
  masterCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 14,
    color: "#6366F1",
    marginLeft: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 20,
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  itemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  itemCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  itemNumberBox: {
    backgroundColor: "#F1F5F9",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  itemNumber: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 12,
    color: "#64748B",
  },
  deleteBtn: {
    padding: 4,
  },
  row: {
    flexDirection: "row",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: "SpaceGrotesk_600SemiBold",
    fontSize: 13,
    color: "#475569",
    marginBottom: 8,
  },
  labelTiny: {
    fontFamily: "SpaceGrotesk_600SemiBold",
    fontSize: 11,
    color: "#94A3B8",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "SpaceGrotesk_600SemiBold",
    fontSize: 15,
    color: "#0F172A",
  },
  readOnlyInput: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: "center",
    height: 52,
  },
  readOnlyText: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 16,
    color: "#1E1B4B",
  },
  itemInputLarge: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 16,
    color: "#0F172A",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 8,
  },
  itemInputSmall: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: "SpaceGrotesk_600SemiBold",
    fontSize: 14,
    color: "#0F172A",
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 52,
  },
  tinyIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  dropdownText: {
    flex: 1,
    fontFamily: "SpaceGrotesk_600SemiBold",
    fontSize: 14,
    color: "#0F172A",
  },
  addItemBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    paddingVertical: 16,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#A5B4FC",
    marginTop: 8,
  },
  addItemText: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 15,
    color: "#4F46E5",
    marginLeft: 8,
  },
  footer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    paddingBottom: 32,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 10,
  },
  saveButton: {
    backgroundColor: "#1E1B4B",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "75%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 22,
    color: "#0F172A",
  },
  modalList: {
    paddingBottom: 20,
  },
  categoryOption: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    margin: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  modalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryOptionLabel: {
    fontFamily: "SpaceGrotesk_600SemiBold",
    fontSize: 12,
    color: "#475569",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
