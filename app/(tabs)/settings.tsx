import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  useFonts,
} from "@expo-google-fonts/space-grotesk";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/constants/theme";
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
  theme,
}: any) => (
  <TouchableOpacity
    style={[styles.settingRow, { borderBottomColor: theme.border }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.rowLeft}>
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={[styles.rowLabel, { color: isDestructive ? theme.danger : theme.text }, isDestructive && { color: theme.danger }]}>
        {label}
      </Text>
    </View>
    <View style={styles.rowRight}>
      {value ? <Text style={[styles.rowValue, { color: theme.textMuted }]}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color={theme.border} />
    </View>
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const theme = useTheme();
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={["top"]}>
      <View style={[styles.stickyHeader, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Pengaturan</Text>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Konfigurasi AI</Text>
          <View style={[styles.apiCard, { backgroundColor: theme.surface }]}>
            <View style={styles.apiHeader}>
              <Ionicons name="key" size={18} color={theme.textMuted} />
              <Text style={[styles.apiTitle, { color: theme.text }]}>Google AI Studio Key</Text>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              placeholder="Masukkan API Key Anda..."
              placeholderTextColor={theme.textMuted}
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry
              autoCapitalize="none"
            />
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.deepNavy }]} onPress={handleSaveKey}>
              <Text style={styles.saveButtonText}>Simpan Key</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.helperText, { color: theme.textSecondary }]}>
            Key ini digunakan untuk memproses struk menggunakan Gemini AI secara
            lokal di perangkat Anda.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Preferensi</Text>
          <View style={styles.listContainer}>
            <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
              <View style={styles.rowLeft}>
                <View
                  style={[styles.iconContainer, { backgroundColor: "#E0E7FF" }]}
                >
                  <Ionicons name="moon" size={20} color="#6366F1" />
                </View>
                <Text style={[styles.rowLabel, { color: theme.text }]}>Mode Gelap</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: theme.border, true: theme.indigo }}
              />
            </View>
            <SettingRow
              icon="notifications"
              iconBg="#FEE2E2"
              iconColor="#EF4444"
              label="Notifikasi"
              value="Aktif"
              theme={theme}
            />
            <SettingRow
              icon="wallet"
              iconBg="#DBEAFE"
              iconColor="#3B82F6"
              label="Mata Uang"
              value="IDR (Rp)"
              theme={theme}
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
              theme={theme}
            />
            <SettingRow
              icon="trash"
              iconBg="#FFF1F0"
              iconColor="#EF4444"
              label="Hapus Semua Preferensi"
              isDestructive={true}
              onPress={handleClearData}
              theme={theme}
            />
          </View>
        </View>

        <Text style={[styles.versionText, { color: theme.textMuted }]}>Versi 1.0.0 (Personal Build)</Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  stickyHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -0.5,
  },
  container: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingTop: 24 },

  section: { marginBottom: 32 },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "SpaceGrotesk_600SemiBold",
    color: "#6366F1",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },

  apiCard: {
    borderRadius: 20,
    padding: 16,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  apiHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  apiTitle: {
    fontSize: 15,
    fontFamily: "SpaceGrotesk_700Bold",
    marginLeft: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    fontFamily: "SpaceGrotesk_600SemiBold",
    borderWidth: 1,
    marginBottom: 12,
  },
  saveButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 15,
    letterSpacing: 0.5,
  },
  helperText: {
    fontSize: 13,
    fontFamily: "SpaceGrotesk_500Medium",
    marginTop: 8,
    paddingHorizontal: 4,
    lineHeight: 18,
  },

  listContainer: {
    backgroundColor: "transparent",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowLeft: { flexDirection: "row", alignItems: "center" },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontFamily: "SpaceGrotesk_600SemiBold",
  },
  rowRight: { flexDirection: "row", alignItems: "center" },
  rowValue: {
    fontSize: 14,
    fontFamily: "SpaceGrotesk_500Medium",
    marginRight: 8,
  },

  versionText: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "SpaceGrotesk_600SemiBold",
    marginTop: -8,
    letterSpacing: 1,
  },
});
