import { getCategoryVisuals } from '@/constants/categories';
import { Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, useFonts } from '@expo-google-fonts/inter';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DUMMY_DB = {
    'f47ac10b-58cc-4372-a567-0e02b2c3d479': {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        merchant: 'Grand Lucky',
        category: 'Groceries',
        totalAmount: 155000,
        scan_date: '2026-04-26T10:30:00Z',
        items: [
            { id: 'b2d3e4f5-1a2b-4c3d-8e7f-9a0b1c2d3e4f', name: 'Susu UHT 1L', price: 22000, qty: 2 },
            { id: 'c9b8e7f1-2d3a-4e5c-9f6b-8a7c6d5e4f3a', name: 'Telur Ayam 1kg', price: 35000, qty: 1 },
            { id: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', name: 'Beras Premium 5kg', price: 76000, qty: 1 }
        ]
    }
};

const formatIDR = (value: number) => value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export default function DetailsScreen() {
    const { id } = useLocalSearchParams();
    const [receipt, setReceipt] = useState<any>(null);

    let [fontsLoaded] = useFonts({
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_700Bold,
        Inter_800ExtraBold
    });

    useEffect(() => {
        const targetId = typeof id === 'string' ? id : 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
        const data = (DUMMY_DB as any)[targetId] || (DUMMY_DB as any)['f47ac10b-58cc-4372-a567-0e02b2c3d479'];
        setReceipt(data);
    }, [id]);

    const handleDelete = () => {
        Alert.alert(
            "Hapus Transaksi",
            "Apakah Anda yakin ingin menghapus data struk ini secara permanen?",
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Hapus",
                    style: "destructive",
                    onPress: () => {
                        router.back();
                    }
                }
            ]
        );
    };

    if (!fontsLoaded || !receipt) return null;

    const visual = getCategoryVisuals(receipt.category)

    const formattedDate = new Date(receipt.scan_date).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
                            <Ionicons name={visual.icon as any} size={32} color={visual.color} />
                        </View>
                        <Text style={styles.merchantName}>{receipt.merchant}</Text>
                        <Text style={styles.totalAmount}>Rp {formatIDR(receipt.totalAmount)}</Text>

                        <View style={styles.badgeContainer}>
                            <View style={[styles.categoryBadge, { backgroundColor: visual.bg }]}>
                                <Text style={[styles.categoryBadgeText, { color: visual.color }]}>{visual.label}</Text>
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

                        {receipt.items.map((item: any, index: number) => {
                            const itemTotal = item.qty * item.price;
                            return (
                                <View key={item.id} style={styles.itemRow}>
                                    <View style={styles.itemRowLeft}>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <Text style={styles.itemQtyPrice}>
                                            {item.qty} x Rp {formatIDR(item.price)}
                                        </Text>
                                    </View>
                                    <View style={styles.itemRowRight}>
                                        <Text style={styles.itemTotal}>Rp {formatIDR(itemTotal)}</Text>
                                    </View>
                                </View>
                            );
                        })}

                        <View style={styles.metadataSection}>
                            <View style={styles.metadataRow}>
                                <Text style={styles.metadataLabel}>ID Transaksi</Text>
                                <Text style={styles.metadataValue}>{receipt.id.split('-')[0].toUpperCase()}</Text>
                            </View>
                            <View style={styles.metadataRow}>
                                <Text style={styles.metadataLabel}>Sumber</Text>
                                <Text style={styles.metadataValue}>Kamera Utama</Text>
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
        backgroundColor: '#F3F4F6'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#F3F4F6',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2
    },
    headerActions: {
        flexDirection: 'row'
    },
    iconButton: {
        padding: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2
    },
    scrollView: {
        flex: 1
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 40
    },
    receiptCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 4,
        overflow: 'hidden',
    },
    summarySection: {
        alignItems: 'center',
        padding: 32
    },
    iconLarge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
    },
    merchantName: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18, color: '#4B5563',
        marginBottom: 8
    },
    totalAmount: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: 36,
        color: '#111827',
        marginBottom: 16,
        letterSpacing: -1
    },
    badgeContainer: {
        marginBottom: 16
    },
    categoryBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12
    },
    categoryBadgeText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13
    },
    dateText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#9CA3AF'
    },
    separatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 24,
        backgroundColor: '#FFFFFF',
        position: 'relative'
    },
    cutoutLeft: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        position: 'absolute',
        left: -12
    },
    dashedLine: {
        flex: 1,
        height: 1,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        marginHorizontal: 16
    },
    cutoutRight: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        position: 'absolute',
        right: -12
    },
    detailsSection: {
        padding: 24,
        paddingTop: 16
    },
    sectionTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 16,
        color: '#111827',
        marginBottom: 20
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16
    },
    itemRowLeft: {
        flex: 1,
        paddingRight: 16
    },
    itemName: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 15,
        color: '#111827',
        marginBottom: 4
    },
    itemQtyPrice: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: '#6B7280'
    },
    itemRowRight: {
        justifyContent: 'center'
    },
    itemTotal: {
        fontFamily: 'Inter_700Bold',
        fontSize: 15,
        color: '#111827'
    },
    metadataSection: {
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6'
    },
    metadataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    metadataLabel: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: '#9CA3AF'
    },
    metadataValue: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13,
        color: '#4B5563'
    },
});