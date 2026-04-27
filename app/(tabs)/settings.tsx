// app/(tabs)/settings.tsx
import {
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts
} from '@expo-google-fonts/inter';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore'; // Adjust path if needed

const SettingRow = ({ icon, iconBg, iconColor, label, value, isDestructive = false, onPress }: any) => (
  <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.rowLeft}>
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={[styles.rowLabel, isDestructive && { color: '#EF4444' }]}>
        {label}
      </Text>
    </View>
    <View style={styles.rowRight}>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
    </View>
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const { apiKey, setApiKey, isDarkMode, toggleDarkMode, clearData } = useAppStore();

  let [fontsLoaded] = useFonts({
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) return null;

  const handleSaveKey = () => {
    if (!apiKey.trim()) {
      Alert.alert("Gagal", "API Key tidak boleh kosong.");
      return;
    }
    Alert.alert("Tersimpan", "API Key Google AI Studio telah diperbarui.");
  };

  const handleClearData = () => {
    Alert.alert(
      "Hapus Data",
      "Yakin ingin menghapus API Key dan preferensi Anda?",
      [
        { text: "Batal", style: "cancel" },
        { text: "Hapus", style: "destructive", onPress: clearData }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.stickyHeader}>
        <Text style={styles.headerTitle}>Pengaturan</Text>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Konfigurasi AI</Text>
          <View style={styles.apiCard}>
            <View style={styles.apiHeader}>
              <Ionicons name="key" size={18} color="#9CA3AF" />
              <Text style={styles.apiTitle}>Google AI Studio Key</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Masukkan API Key Anda..."
              placeholderTextColor="#9CA3AF"
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveKey}>
              <Text style={styles.saveButtonText}>Simpan Key</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>
            Key ini digunakan untuk memproses struk menggunakan Gemini AI secara lokal di perangkat Anda.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Preferensi</Text>
          <View style={styles.listContainer}>
            <View style={styles.settingRow}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#E0E7FF' }]}>
                  <Ionicons name="moon" size={20} color="#6366F1" />
                </View>
                <Text style={styles.rowLabel}>Mode Gelap</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: '#E5E7EB', true: '#111827' }}
              />
            </View>
            <SettingRow
              icon="notifications"
              iconBg="#FEE2E2"
              iconColor="#EF4444"
              label="Notifikasi"
              value="Aktif"
            />
            <SettingRow
              icon="wallet"
              iconBg="#DBEAFE"
              iconColor="#3B82F6"
              label="Mata Uang"
              value="IDR (Rp)"
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Lainnya</Text>
          <View style={styles.listContainer}>
            <SettingRow
              icon="information-circle"
              iconBg="#F3F4F6"
              iconColor="#6B7280"
              label="Tentang SpendSnap"
            />
            <SettingRow
              icon="trash"
              iconBg="#FFF1F0"
              iconColor="#EF4444"
              label="Hapus Semua Preferensi"
              isDestructive={true}
              onPress={handleClearData}
            />
          </View>
        </View>

        <Text style={styles.versionText}>Versi 1.0.0 (Personal Build)</Text>

        {/* Extra padding for bottom tab spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },

  stickyHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: '#111827',
    letterSpacing: -0.5,
  },

  container: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingTop: 24 },

  section: { marginBottom: 32 },
  sectionLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },

  apiCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  apiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  apiTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#4B5563',
    marginLeft: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  helperText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'Inter_500Medium',
    marginTop: 8,
    paddingHorizontal: 4,
    lineHeight: 18,
  },

  listContainer: { backgroundColor: '#FFFFFF' },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rowLabel: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#111827',
  },
  rowRight: { flexDirection: 'row', alignItems: 'center' },
  rowValue: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Inter_500Medium',
    marginRight: 8,
  },

  versionText: {
    textAlign: 'center',
    color: '#D1D5DB',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginTop: -8,
  }
});