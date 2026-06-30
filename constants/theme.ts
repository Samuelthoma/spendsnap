import { useAppStore } from "@/store/useAppStore";

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  brutalBg: string;
  brutalCardBg: string;
  brutalBorder: string;
  brutalText: string;
  brutalShadow: string;
  tabBg: string;
  tabActive: string;
  tabInactive: string;
  fabBg: string;
  indigo: string;
  deepNavy: string;
  danger: string;
  dangerBg: string;
  inputBg: string;
  headerBg: string;
  footerBg: string;
  modalOverlay: string;
}

const light: ThemeColors = {
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceAlt: "#F1F5F9",
  text: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  border: "#E2E8F0",
  brutalBg: "#FDFDFA",
  brutalCardBg: "#FFFFFF",
  brutalBorder: "#000000",
  brutalText: "#000000",
  brutalShadow: "#000000",
  tabBg: "#FFFFFF",
  tabActive: "#111827",
  tabInactive: "#9CA3AF",
  fabBg: "#111827",
  indigo: "#6366F1",
  deepNavy: "#1E1B4B",
  danger: "#EF4444",
  dangerBg: "#FEE2E2",
  inputBg: "#F8FAFC",
  headerBg: "#F8FAFC",
  footerBg: "#FFFFFF",
  modalOverlay: "rgba(15, 23, 42, 0.6)",
};

const dark: ThemeColors = {
  background: "#0B1120",
  surface: "#1E293B",
  surfaceAlt: "#263548",
  text: "#F1F5F9",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  border: "#334155",
  brutalBg: "#0B1120",
  brutalCardBg: "#1E293B",
  brutalBorder: "#FFFFFF",
  brutalText: "#FFFFFF",
  brutalShadow: "rgba(255,255,255,0.15)",
  tabBg: "#1E293B",
  tabActive: "#FFFFFF",
  tabInactive: "#64748B",
  fabBg: "#818CF8",
  indigo: "#818CF8",
  deepNavy: "#4F46E5",
  danger: "#F87171",
  dangerBg: "#451A1A",
  inputBg: "#0B1120",
  headerBg: "#0B1120",
  footerBg: "#1E293B",
  modalOverlay: "rgba(0, 0, 0, 0.7)",
};

export function useTheme() {
  const isDarkMode = useAppStore((s) => s.isDarkMode);
  return isDarkMode ? dark : light;
}
