import { Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';

const DUMMY_RECEIPT = {
  merchant: 'Grand Lucky',
  category: 'Groceries',
  date: new Date().toISOString(),
  items: [
    { id: '1', name: 'Susu UHT 1L', price: '22000', qty: '2' },
    { id: '2', name: 'Telur Ayam 1kg', price: '35000', qty: '1' },
    { id: '3', name: 'Beras Premium 5kg', price: '76000', qty: '1' }
  ]
};

const CATEGORIES = [
  { label: 'Makanan & Minuman', value: 'Dining', icon: 'restaurant', color: '#F59E0B', bg: '#FEF3C7' },
  { label: 'Belanja', value: 'Shopping', icon: 'bag-handle', color: '#A855F7', bg: '#F3E8FF' },
  { label: 'Transportasi', value: 'Transport', icon: 'car', color: '#3B82F6', bg: '#DBEAFE' },
  { label: 'Bahan Makanan', value: 'Groceries', icon: 'cart', color: '#10B981', bg: '#E1F6EB' },
  { label: 'Hiburan', value: 'Entertainment', icon: 'film', color: '#6366F1', bg: '#E0E7FF' },
  { label: 'Kesehatan', value: 'Health', icon: 'medkit', color: '#EF4444', bg: '#FEE2E2' },
  { label: 'Lainnya', value: 'Lainnya', icon: 'receipt', color: '#6B7280', bg: '#F3F4F6' },
];

export default function ReviewScreen() {
  const params = useLocalSearchParams();

  const [receipt, setReceipt] = useState({ merchant: '', category: '' });
  const [items, setItems] = useState<any[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  let [fontsLoaded] = useFonts({
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    let dataToLoad = DUMMY_RECEIPT;
    if (params.extractedData) {
      try {
        dataToLoad = JSON.parse(params.extractedData as string);
      } catch (e) {
        console.log("Failed to parse AI data, using fallback");
      }
    }

    setReceipt({
      merchant: dataToLoad.merchant || '',
      category: dataToLoad.category || 'Lainnya',
    });

    const formattedItems = (dataToLoad.items || []).map((item: any, index: number) => ({
      ...item,
      id: item.id || Date.now().toString() + index,
      price: item.price?.toString() || '0',
      qty: item.qty?.toString() || '1'
    }));

    setItems(formattedItems);
  }, [params.extractedData]);

  const calculatedTotal = items.reduce((sum, item) => sum + ((parseInt(item.price) || 0) * (parseInt(item.qty) || 1)), 0);

  const handleUpdateItem = (id: string, field: string, newValue: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: newValue } : item));
  };

  const handleAddItem = () => {
    setItems([...items, { id: Date.now().toString(), name: '', price: '', qty: '1' }]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  if (!fontsLoaded) return null;

  const selectedCat = CATEGORIES.find(c => c.value === receipt.category) || CATEGORIES[CATEGORIES.length - 1];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
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
                  onPress={() => { setReceipt({ ...receipt, category: item.value }); setShowCategoryPicker(false); }}
                >
                  <View style={[styles.modalIconBox, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <Text style={styles.categoryOptionLabel} numberOfLines={1}>{item.label}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.modalList}
            />
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
              <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setShowCategoryPicker(true)}>
                <View style={[styles.tinyIconBox, { backgroundColor: selectedCat.bg }]}>
                  <Ionicons name={selectedCat.icon as any} size={14} color={selectedCat.color} />
                </View>
                <Text style={styles.dropdownText} numberOfLines={1}>{selectedCat.label}</Text>
                <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Total (Rp)</Text>
              <View style={styles.readOnlyInput}>
                <Text style={styles.readOnlyText} numberOfLines={1} adjustsFontSizeToFit>
                  {calculatedTotal.toLocaleString('id-ID')}
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
              <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={styles.deleteBtn}>
                <Ionicons name="close" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <TextInput
                style={styles.itemInputLarge}
                value={item.name}
                onChangeText={(val) => handleUpdateItem(item.id, 'name', val)}
                placeholder="Nama Barang"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 0.4, marginRight: 12 }]}>
                <Text style={styles.labelTiny}>Qty</Text>
                <TextInput
                  style={styles.itemInputSmall}
                  value={item.qty}
                  onChangeText={(val) => handleUpdateItem(item.id, 'qty', val.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  textAlign="center"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.labelTiny}>Harga Satuan (Rp)</Text>
                <TextInput
                  style={styles.itemInputSmall}
                  value={item.price}
                  onChangeText={(val) => handleUpdateItem(item.id, 'price', val.replace(/[^0-9]/g, ''))}
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
        <TouchableOpacity style={styles.saveButton} onPress={() => router.dismissAll()}>
          <Text style={styles.saveButtonText}>Simpan</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 10
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#111827'
  },
  backButton: {
    padding: 4,
    marginLeft: -4
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40
  },
  masterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  cardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 24
  },
  sectionHeader: {
    marginBottom: 16
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#111827'
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  itemCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  itemNumberBox: {
    backgroundColor: '#F3F4F6',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  itemNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#9CA3AF'
  },
  deleteBtn: {
    padding: 4
  },
  row: {
    flexDirection: 'row'
  },
  inputGroup: {
    marginBottom: 16
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 8
  },
  labelTiny: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 6,
    textTransform: 'uppercase'
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#111827'
  },
  readOnlyInput: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
    height: 48
  },
  readOnlyText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#4B5563'
  },
  itemInputLarge: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8
  },
  itemInputSmall: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#111827'
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    height: 48
  },
  tinyIconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  dropdownText: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#111827'
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    paddingVertical: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 8
  },
  addItemText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#007AFF',
    marginLeft: 8
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  saveButton: {
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center'
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#111827'
  },
  modalList: {
    paddingBottom: 40
  },
  categoryOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    margin: 4,
    backgroundColor: '#F9FAFB',
    borderRadius: 16
  },
  modalIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  categoryOptionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center'
  },
});