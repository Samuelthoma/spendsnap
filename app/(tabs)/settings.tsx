import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  useFonts,
} from "@expo-google-fonts/space-grotesk";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { alert } from 'react-native-alert-queue';
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../../store/useAppStore";

const SettingRow = ({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  isDestructive = false,
  onPress,
}: any) => (
  <TouchableOpacity
    style={styles.settingRow}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.rowLeft}>
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={[styles.rowLabel, isDestructive && { color: "#EF4444" }]}>
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
  const { apiKey, setApiKey, isDarkMode, toggleDarkMode, clearData } =
    useAppStore();

  let [fontsLoaded] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  if (!fontsLoaded) return null;

  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      await alert.show({
        title: "Gagal",
        message: "API Key tidak boleh kosong.",
      });
      return;
    }

    await alert.show({
      title: "Tersimpan",
      message: "API Key Google AI Studio telah diperbarui.",
    });
  };

  const handleClearData = async () => {
    const confirmed = await alert.confirm({
      title: "Hapus Data",
      message: "Yakin ingin menghapus API Key dan preferensi Anda?",
    });

    if (!confirmed) return;

    clearData();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
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
            Key ini digunakan untuk memproses struk menggunakan Gemini AI secara
            lokal di perangkat Anda.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Preferensi</Text>
          <View style={styles.listContainer}>
            <View style={styles.settingRow}>
              <View style={styles.rowLeft}>
                <View
                  style={[styles.iconContainer, { backgroundColor: "#E0E7FF" }]}
                >
                  <Ionicons name="moon" size={20} color="#6366F1" />
                </View>
                <Text style={styles.rowLabel}>Mode Gelap</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: "#E5E7EB", true: "#111827" }}
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

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC", // Soft cool gray
  },
  stickyHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "#F8FAFC", // Match background
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9", // Very soft divider
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "SpaceGrotesk_700Bold", // Updated
    color: "#0F172A", // Deep navy
    letterSpacing: -0.5,
  },
  container: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingTop: 24 },

  section: { marginBottom: 32 },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "SpaceGrotesk_600SemiBold", // Updated
    color: "#6366F1", // Indigo accent
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },

  apiCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    // Applied the soft indigo shadow
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  apiHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  apiTitle: {
    fontSize: 15,
    fontFamily: "SpaceGrotesk_700Bold", // Updated
    color: "#0F172A",
    marginLeft: 8,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16, // Slightly taller for premium feel
    fontSize: 15,
    fontFamily: "SpaceGrotesk_600SemiBold", // Updated
    color: "#0F172A",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: "#1E1B4B", // Deep navy
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontFamily: "SpaceGrotesk_700Bold", // Updated
    fontSize: 15,
    letterSpacing: 0.5,
  },
  helperText: {
    fontSize: 13,
    color: "#64748B",
    fontFamily: "SpaceGrotesk_500Medium", // Updated
    marginTop: 8,
    paddingHorizontal: 4,
    lineHeight: 18,
  },

  listContainer: {
    backgroundColor: "transparent", // Let the safeArea color show through
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  rowLeft: { flexDirection: "row", alignItems: "center" },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    backgroundColor: "#FFFFFF", // White icon boxes pop against the gray
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontFamily: "SpaceGrotesk_600SemiBold", // Updated
    color: "#0F172A",
  },
  rowRight: { flexDirection: "row", alignItems: "center" },
  rowValue: {
    fontSize: 14,
    color: "#94A3B8",
    fontFamily: "SpaceGrotesk_500Medium", // Updated
    marginRight: 8,
  },

  versionText: {
    textAlign: "center",
    color: "#CBD5E1",
    fontSize: 12,
    fontFamily: "SpaceGrotesk_600SemiBold", // Updated
    marginTop: -8,
    letterSpacing: 1,
  },
});
