import { Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, useFonts } from '@expo-google-fonts/inter';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DUMMY_RECEIPTS = [
  { id: '1', merchant: 'Grand Lucky', category: 'Groceries', value: 1245000, scan_date: '2026-04-26T10:30:00Z' },
  { id: '2', merchant: 'Pertamina', category: 'Transport', value: 450000, scan_date: '2026-04-25T14:15:00Z' },
  { id: '3', merchant: 'Kopi Kenangan', category: 'Dining', value: 85000, scan_date: '2026-04-25T08:45:00Z' },
  { id: '4', merchant: 'Tokopedia', category: 'Shopping', value: 542000, scan_date: '2026-04-24T18:20:00Z' },
];

const formatIDR = (value: number) => {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const getCategoryStyle = (category: string) => {
  switch (category.toLowerCase()) {
    case 'groceries': return { bg: '#E1F6EB', icon: 'cart', color: '#10B981' };
    case 'dining': return { bg: '#FEF3C7', icon: 'restaurant', color: '#F59E0B' };
    case 'transport': return { bg: '#DBEAFE', icon: 'car', color: '#3B82F6' };
    case 'shopping': return { bg: '#F3E8FF', icon: 'bag-handle', color: '#A855F7' };
    case 'health': return { bg: '#FEE2E2', icon: 'medkit', color: '#EF4444' };
    case 'entertainment': return { bg: '#E0E7FF', icon: 'film', color: '#6366F1' };
    default: return { bg: '#F3F4F6', icon: 'receipt', color: '#6B7280' };
  }
};

const ReceiptItem = ({ item }: { item: typeof DUMMY_RECEIPTS[0] }) => {
  const formattedDate = new Date(item.scan_date).toLocaleDateString('id-ID', {
    month: 'short',
    day: 'numeric',
  });

  const visual = getCategoryStyle(item.category);

  return (
    <View style={styles.itemContainer}>
      <View style={styles.itemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: visual.bg }]}>
          <Ionicons name={visual.icon as any} size={22} color={visual.color} />
        </View>
        <View>
          <Text style={styles.merchantText}>{item.merchant}</Text>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.valueText}>Rp {formatIDR(item.value)}</Text>
        <Text style={styles.dateText}>{formattedDate}</Text>
      </View>
    </View>
  );
};

export default function HomeScreen() {
  let [fontsLoaded] = useFonts({
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const currentMonthTotal = DUMMY_RECEIPTS.reduce((sum, item) => sum + item.value, 0);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>

        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Total Pengeluaran</Text>
          <Text style={styles.overviewTotal} numberOfLines={1} adjustsFontSizeToFit>
            <Text style={styles.currencySymbol}>Rp </Text>
            {formatIDR(currentMonthTotal)}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardFooterText}>April 2026</Text>
          </View>
        </View>

        <View style={styles.listHeaderContainer}>
          <Text style={styles.listHeader}>Aktivitas Terakhir</Text>
        </View>

        <FlatList
          data={DUMMY_RECEIPTS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ReceiptItem item={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="scan-circle-outline" size={64} color="#D1D5DB" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>Belum ada struk.</Text>
              <Text style={styles.emptySubtext}>Ketuk kamera untuk mulai mencatat.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, paddingHorizontal: 20 },

  overviewCard: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 24,
    marginTop: 12,
    marginBottom: 32,
  },
  overviewTitle: {
    color: '#9CA3AF',
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    marginBottom: 8,
  },
  overviewTotal: {
    color: '#FFFFFF',
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 40,
    letterSpacing: -1,
  },
  currencySymbol: {
    fontSize: 28,
    color: '#6B7280',
    fontFamily: 'Inter_600SemiBold',
  },
  cardFooter: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 16,
  },
  cardFooterText: {
    color: '#6B7280',
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },

  listHeaderContainer: { marginBottom: 16 },
  listHeader: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#111827',
    letterSpacing: -0.5,
  },
  listContent: { paddingBottom: 120 },

  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  merchantText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#6B7280',
  },
  itemRight: { alignItems: 'flex-end' },
  valueText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#111827',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#9CA3AF',
  },

  emptyContainer: { paddingVertical: 60, alignItems: 'center' },
  emptyIcon: { marginBottom: 16 },
  emptyText: {
    color: '#111827',
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#6B7280',
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
});