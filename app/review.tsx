import { CATEGORIES, getCategoryVisuals } from "@/constants/categories";
import { useTheme } from "@/constants/theme";
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
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { alert, AlertContainer } from 'react-native-alert-queue';
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReviewScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams();

  const [receipt, setReceipt] = useState({ merchant: "", category: "" });
  const [items, setItems] = useState<any[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

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
      alert.error(
        new Error("Minimal harus ada satu rincian item untuk disimpan.")
      );
      return;
    }
    if (!receipt.merchant.trim()) {
      alert.error(
        new Error("Nama merchant tidak boleh kosong.")
      );
      return;
    }

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

      await alert.show({
        title: "Tersimpan!",
        message: "Data struk berhasil ditambahkan ke riwayat Anda.",
      });

      router.replace("/");

    } catch (error) {
      console.error("Failed to save receipt:", error);
      alert.error(
        new Error("Terjadi kesalahan saat menyimpan ke database lokal.")
      );
    }
  };

  if (!fontsLoaded) return null;

  const selectedCat = getCategoryVisuals(receipt.category);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
      <Modal visible={showCategoryPicker} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Pilih Kategori Struk</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={CATEGORIES}
              keyExtractor={(item) => item.value}
              numColumns={2}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.categoryOption, { backgroundColor: theme.surface }]}
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
                  <Text style={[styles.categoryOptionLabel, { color: theme.textSecondary }]} numberOfLines={1}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.modalList}
            />
          </View>
        </View>
      </Modal>

      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <TouchableOpacity
          onPress={() => router.replace("/")}
          style={[styles.backButton, { backgroundColor: theme.surface }]}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Tinjau Struk</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        extraScrollHeight={40}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.masterCard, { backgroundColor: theme.surface }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt-outline" size={18} color={theme.textMuted} />
            <Text style={styles.cardTitle}>Data Utama</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Merchant</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              value={receipt.merchant}
              onChangeText={(val) => setReceipt({ ...receipt, merchant: val })}
              placeholder="Nama Toko"
              placeholderTextColor={theme.textMuted}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1.2, marginRight: 12 }]}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Kategori Struk</Text>
              <TouchableOpacity
                style={[styles.dropdownTrigger, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
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
                <Text style={[styles.dropdownText, { color: theme.text }]} numberOfLines={1}>
                  {selectedCat.label}
                </Text>
                <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Total (Rp)</Text>
              <View style={[styles.readOnlyInput, { backgroundColor: theme.inputBg, borderColor: theme.indigo }]}>
                <Text
                  style={[styles.readOnlyText, { color: theme.deepNavy }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {calculatedTotal.toLocaleString("id-ID")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Rincian Item ({items.length})</Text>
        </View>

        {items.map((item, index) => (
          <View key={item.id} style={[styles.itemCard, { backgroundColor: theme.surface }]}>
            <View style={styles.itemCardTop}>
              <View style={[styles.itemNumberBox, { backgroundColor: theme.surfaceAlt }]}>
                <Text style={[styles.itemNumber, { color: theme.textSecondary }]}>{index + 1}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveItem(item.id)}
                style={styles.deleteBtn}
              >
                <Ionicons name="close" size={20} color={theme.danger} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.itemInputLarge, { color: theme.text, borderBottomColor: theme.border }]}
                value={item.name}
                onChangeText={(val) => handleUpdateItem(item.id, "name", val)}
                placeholder="Nama Barang"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 0.4, marginRight: 12 }]}>
                <Text style={[styles.labelTiny, { color: theme.textMuted }]}>Qty</Text>
                <TextInput
                  style={[styles.itemInputSmall, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                  value={item.qty}
                  onChangeText={(val) =>
                    handleUpdateItem(item.id, "qty", val.replace(/[^0-9]/g, ""))
                  }
                  keyboardType="numeric"
                  textAlign="center"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.labelTiny, { color: theme.textMuted }]}>Harga Satuan (Rp)</Text>
                <TextInput
                  style={[styles.itemInputSmall, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
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

        <TouchableOpacity style={[styles.addItemBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.indigo }]} onPress={handleAddItem}>
          <Ionicons name="add" size={20} color={theme.indigo} />
          <Text style={[styles.addItemText, { color: theme.indigo }]}>Tambah Item Manual</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      <View style={[styles.footer, { backgroundColor: theme.footerBg }]}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.deepNavy }]}
          onPress={handleSaveToDatabase}
        >
          <Text style={styles.saveButtonText}>Simpan ke Database</Text>
        </TouchableOpacity>
      </View>
      <AlertContainer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  backButton: {
    padding: 8,
    marginLeft: -4,
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
    marginVertical: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 20,
    letterSpacing: -0.5,
  },
  itemCard: {
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
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  itemNumber: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 12,
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
    marginBottom: 8,
  },
  labelTiny: {
    fontFamily: "SpaceGrotesk_600SemiBold",
    fontSize: 11,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "SpaceGrotesk_600SemiBold",
    fontSize: 15,
  },
  readOnlyInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: "center",
    height: 52,
  },
  readOnlyText: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 16,
  },
  itemInputLarge: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 16,
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  itemInputSmall: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: "SpaceGrotesk_600SemiBold",
    fontSize: 14,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
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
  },
  addItemBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 16,
    borderStyle: "dashed",
    borderWidth: 1,
    marginTop: 8,
  },
  addItemText: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 15,
    marginLeft: 8,
  },
  footer: {
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
    justifyContent: "flex-end",
  },
  modalContent: {
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
  },
  modalList: {
    paddingBottom: 20,
  },
  categoryOption: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    margin: 6,
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
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
