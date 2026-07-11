import { useTheme } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { useReceiptStore } from '@/store/useReceiptStore';
import { Ionicons } from '@expo/vector-icons';
import { GoogleGenAI, Schema, Type } from "@google/genai";
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { alert } from 'react-native-alert-queue';


export default function ScannerScreen() {
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<any>(null);
  const { setReceiptData } = useReceiptStore();
  const { fromSplit } = useLocalSearchParams();
  const { apiKey } = useAppStore();

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Ionicons name="camera-outline" size={64} color={theme.textMuted} />
        <Text style={[styles.permissionText, { color: theme.textSecondary }]}>Kami membutuhkan akses kamera untuk memindai struk.</Text>
        <TouchableOpacity style={[styles.permissionButton, { backgroundColor: theme.text }]} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Izinkan Kamera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={[styles.cancelButtonText, { color: theme.textMuted }]}>Batal</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    if (!apiKey) {
      await alert.show({
        title: "API Key Hilang",
        message: "Harap masukkan Google AI Studio Key di menu Pengaturan.",
      });

      router.back();
      return;
    }

    setIsProcessing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      const result = await TextRecognition.recognize(photo.uri);
      const rawText = result.text;

      if (!rawText || rawText.trim() === '') {
        throw new Error("Tidak ada teks yang terdeteksi pada gambar.");
      }

      const aiResponse = await processWithGemini(rawText, apiKey);

      const formattedItems = (aiResponse.items || []).map((item: any, index: number) => ({
        ...item,
        id: `item-${Date.now()}-${index}`,
        total: item.price * item.qty
      }));


      if (fromSplit === 'true') {
        router.setParams({ fromSplit: '' });
        setReceiptData(formattedItems, aiResponse.tax || 0);
        router.replace('/split');
        console.log(aiResponse)
      } else {
        router.replace({
          pathname: '/review',
          params: { extractedData: JSON.stringify(aiResponse) }
        });
      }

    } catch (error: any) {
      await alert.show({
        title: "Pemindaian Gagal",
        message: error?.message || "Terjadi kesalahan saat memproses struk.",
      });
      setIsProcessing(false);
    } finally {
      setIsProcessing(false)
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      >
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.closeIcon} onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.guideContainer}>
          <View style={styles.guideBox} />
          <Text style={styles.guideText}>Posisikan struk di dalam bingkai</Text>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.captureOuter, isProcessing && styles.captureDisabled]}
            onPress={handleCapture}
            disabled={isProcessing}
          >
            <View style={styles.captureInner} />
          </TouchableOpacity>
        </View>

        {isProcessing && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Menganalisis Struk...</Text>
          </View>
        )}
      </CameraView>
    </View>
  );
}

const processWithGemini = async (ocrText: string, key: string) => {
  const ai = new GoogleGenAI({ apiKey: key });

  const receiptSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      merchant: {
        type: Type.STRING,
        description: "The name of the store or restaurant."
      },
      category: {
        type: Type.STRING,
        enum: ["Groceries", "Transport", "Dining", "Shopping", "Health", "Entertainment", "Utilities", "Education", "Personal", "Gifts", "Invesment", "Others"],
        description: "Category the purchase"
      },
      totalAmmount: {
        type: Type.INTEGER,
        description: "The final parsed total of the receipt"
      },
      tax: {
        type: Type.INTEGER,
        description: "Total tax and service charge combined (PPN, PB1, Service Charge). Return 0 if none"
      },
      date: {
        type: Type.STRING,
        description: "ISO 8601 formatted date string"
      },
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            price: { type: Type.INTEGER, description: "Price per single unit" },
            qty: { type: Type.INTEGER }
          },
          required: ["name", "price", "qty"]
        }
      },
    },
    required: ["merchant", "category", "totalAmmount", "tax", "date", "items"]
  }

  const prompt = `Extract receipt data from this OCR text: \n\n ${ocrText}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: receiptSchema
      }
    });

    const rawContent = response.text;

    if (!rawContent) {
      throw new Error("AI tidak mengembalikan teks.");
    }

    return JSON.parse(rawContent);
  } catch (error: any) {
    console.error("Gemini SDK Error:", error);
    throw new Error(error.message || "Gagal menghubungi AI.");
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 20 },
  camera: { flex: 1 },

  permissionText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  permissionButtonText: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  cancelButton: { paddingVertical: 14, width: '100%', alignItems: 'center' },
  cancelButtonText: { color: '#9CA3AF', fontFamily: 'Inter_600SemiBold', fontSize: 16 },

  topBar: {
    paddingTop: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  closeIcon: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  guideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideBox: {
    width: '80%',
    height: '60%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    borderStyle: 'dashed',
  },
  guideText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    marginTop: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },

  bottomBar: {
    paddingBottom: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  captureDisabled: {
    opacity: 0.5,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  loadingText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    marginTop: 16,
  },
});