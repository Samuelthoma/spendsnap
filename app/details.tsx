import { Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, useFonts } from '@expo-google-fonts/inter';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCategoryVisuals } from '../constants/categories';
import { deleteReceipt, getReceiptById, getReceiptDetails } from '../db/queries/receipts';

const formatIDR = (value: number) => value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export default function DetailsScreen() {
    const { id } = useLocalSearchParams();
    const [receipt, setReceipt] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    let [fontsLoaded] = useFonts({
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_700Bold,
        Inter_800ExtraBold
    });

    useEffect(() => {
        const fetchFullReceipt = async () => {
            if (!id || typeof id !== 'string') return;

            try {
                setIsLoading(true);
                const parentData = await getReceiptById(id);

                if (parentData) {
                    const childData = await getReceiptDetails(id);

                    setReceipt({
                        ...parentData,
                        items: childData
                    });
                }
            } catch (error) {
                console.error("Failed to load receipt details:", error);
                Alert.alert("Error", "Gagal memuat detail struk.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchFullReceipt();
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
                    onPress: async () => {
                        try {
                            if (typeof id === 'string') {
                                await deleteReceipt(id);
                                // Go back to the previous screen (Home)
                                router.back();
                            }
                        } catch (error) {
                            Alert.alert("Gagal", "Tidak dapat menghapus struk saat ini.");
                        }
                    }
                }
            ]
        );
    };

    if (!fontsLoaded) return null;

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#111827" />
            </SafeAreaView>
        );
    }

    if (!receipt) {
        return (
            <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontFamily: 'Inter_500Medium', color: '#6B7280' }}>Struk tidak ditemukan.</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
                    <Text style={{ color: '#007AFF', fontFamily: 'Inter_600SemiBold' }}>Kembali</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const visual = getCategoryVisuals(receipt.category);

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
                        <Text style={styles.totalAmount}>Rp {formatIDR(receipt.total_amount)}</Text>

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

                        {receipt.items && receipt.items.length > 0 ? (
                            receipt.items.map((item: any) => {
                                const itemTotal = item.quantity * item.price;
                                return (
                                    <View key={item.id} style={styles.itemRow}>
                                        <View style={styles.itemRowLeft}>
                                            <Text style={styles.itemName}>{item.item_name}</Text>
                                            <Text style={styles.itemQtyPrice}>
                                                {item.quantity} x Rp {formatIDR(item.price)}
                                            </Text>
                                        </View>
                                        <View style={styles.itemRowRight}>
                                            <Text style={styles.itemTotal}>Rp {formatIDR(itemTotal)}</Text>
                                        </View>
                                    </View>
                                );
                            })
                        ) : (
                            <Text style={{ fontFamily: 'Inter_500Medium', color: '#9CA3AF', fontStyle: 'italic' }}>
                                Tidak ada rincian item.
                            </Text>
                        )}

                        <View style={styles.metadataSection}>
                            <View style={styles.metadataRow}>
                                <Text style={styles.metadataLabel}>ID Transaksi</Text>
                                <Text style={styles.metadataValue}>{receipt.id.split('-')[0].toUpperCase()}</Text>
                            </View>
                            <View style={styles.metadataRow}>
                                <Text style={styles.metadataLabel}>Sumber</Text>
                                <Text style={styles.metadataValue}>AI Scanner</Text>
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