import { useReceiptStore } from '@/store/useReceiptStore';
import { useTheme } from '@/constants/theme';
import { Assignments, generateSplitSummary } from '@/utils/splitCalculation';
import { SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold, useFonts } from '@expo-google-fonts/space-grotesk';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { alert } from 'react-native-alert-queue';
import { SafeAreaView } from 'react-native-safe-area-context';

const formatIDR = (value: number) => Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export default function SplitBillScreen() {
    const theme = useTheme();
    let [fontsLoaded] = useFonts({ SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold });
    const { scannedItems, taxAndService, participants, setParticipants, clearSplitSession } = useReceiptStore();
    const [step, setStep] = useState(1);
    const [assignments, setAssignments] = useState<Assignments>({});

    useFocusEffect(
        useCallback(() => {
            if (scannedItems.length > 0 && step === 1) {
                setStep(2);
            }
            else if (scannedItems.length === 0) {
                setStep(1);
                setAssignments({});
            }
        }, [scannedItems.length])
    );

    const addPerson = () => setParticipants([...participants, { id: `p-${Date.now()}`, name: '' }]);
    const updatePersonName = (id: string, name: string) => setParticipants(participants.map(p => p.id === id ? { ...p, name } : p));
    const removePerson = (id: string) => {
        if (participants.length <= 1) return alert.error(new Error('Hold on! Please assign all remaining items before calculating the split.'));
        setParticipants(participants.filter(p => p.id !== id));

        setAssignments(prev => {
            const newAssignments = { ...prev };
            Object.keys(newAssignments).forEach(itemId => {
                if (newAssignments[itemId][id]) delete newAssignments[itemId][id];
            });
            return newAssignments;
        });
    };

    const updateAssignment = (itemId: string, personId: string, maxQty: number, delta: number) => {
        setAssignments(prev => {
            const currentItemAssigns = { ...(prev[itemId] || {}) };
            const currentQty = currentItemAssigns[personId] || 0;
            const newQty = currentQty + delta;

            const takenByOthers = Object.entries(currentItemAssigns)
                .filter(([pId]) => pId !== personId)
                .reduce((sum, [_, q]) => sum + q, 0);

            if (newQty < 0 || takenByOthers + newQty > maxQty) return prev;

            currentItemAssigns[personId] = newQty;
            return { ...prev, [itemId]: currentItemAssigns };
        });
    };

    const getAssignedTotal = (itemId: string) => Object.values(assignments[itemId] || {}).reduce((sum, qty) => sum + qty, 0);

    const handleGoToScanner = () => {
        if (participants.every(p => p.name.trim() !== '')) {
            router.push({ pathname: '/scanner', params: { fromSplit: 'true' } });
        } else {
            alert.error(new Error('Please enter names for everyone splitting the bill.'));
        }
    };

    const handleCalculate = () => {
        const totalItems = scannedItems.reduce((sum, item) => sum + item.qty, 0);
        let assignedItems = 0;
        scannedItems.forEach(item => { assignedItems += getAssignedTotal(item.id); });

        if (assignedItems < totalItems) {
            alert.error(new Error('Hold on! Please assign all remaining items before calculating the split.'));
            return;
        }
        setStep(3);
    };

    const handleDone = () => {
        clearSplitSession();
        router.push('/');
    };

    const splitResults = generateSplitSummary(participants, scannedItems, assignments, taxAndService);

    if (!fontsLoaded) return null;

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} style={[styles.backButton, { backgroundColor: theme.surface }]}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Split Bill</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

                {step === 1 && (
                    <View>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.stepBadge}>STEP 1</Text>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Who's splitting?</Text>
                        </View>
                        <View style={[styles.card, { backgroundColor: theme.surface }]}>
                            {participants.map((p, index) => (
                                <View key={p.id} style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: theme.textSecondary }]}>Person {index + 1}</Text>
                                    <View style={styles.inputRow}>
                                        <TextInput
                                            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border, flex: 1 }]}
                                            placeholder="Enter name"
                                            placeholderTextColor={theme.textMuted}
                                            value={p.name}
                                            onChangeText={(text) => updatePersonName(p.id, text)}
                                        />
                                        <TouchableOpacity style={[styles.deletePersonBtn, { backgroundColor: theme.dangerBg, borderColor: theme.danger }]} onPress={() => removePerson(p.id)}>
                                            <Ionicons name="trash-outline" size={20} color={theme.danger} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                            <TouchableOpacity style={[styles.addPersonBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.indigo }]} onPress={addPerson}>
                                <Ionicons name="person-add-outline" size={18} color={theme.indigo} />
                                <Text style={[styles.addPersonText, { color: theme.indigo }]}>Add Another Person</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {step === 2 && (
                    <View>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.stepBadge}>STEP 2</Text>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Assign Items</Text>
                        </View>
                        {scannedItems.map((item) => {
                            const totalAssigned = getAssignedTotal(item.id);
                            const isFullyAssigned = totalAssigned === item.qty;

                            return (
                                <View key={item.id} style={[styles.itemCard, { backgroundColor: theme.surface }, isFullyAssigned && { borderColor: '#10B981', backgroundColor: theme.surfaceAlt }]}>
                                    <View style={styles.itemCardTop}>
                                        <View style={styles.itemDetails}>
                                            <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
                                            <Text style={[styles.itemQtyPrice, { color: theme.textSecondary }]}>{item.qty}x @ Rp {formatIDR(item.price)}</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={[styles.itemTotal, { color: theme.deepNavy }]}>Rp {formatIDR(item.total)}</Text>
                                            <Text style={[styles.remainingText, isFullyAssigned && { color: '#10B981' }]}>
                                                {isFullyAssigned ? 'Fully Assigned ✓' : `${item.qty - totalAssigned} left`}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.assignLabel, { color: theme.textMuted }]}>Assign to:</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                                        {participants.map(p => {
                                            const qtyTaken = (assignments[item.id] || {})[p.id] || 0;
                                            const isActive = qtyTaken > 0;
                                            return (
                                                <View key={p.id} style={[styles.chipWrapper, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }, isActive && { backgroundColor: theme.indigo, borderColor: theme.indigo }]}>
                                                    {isActive && <TouchableOpacity style={styles.stepperBtn} onPress={() => updateAssignment(item.id, p.id, item.qty, -1)}><Ionicons name="remove" size={16} color="#FFFFFF" /></TouchableOpacity>}
                                                    <TouchableOpacity
                                                        style={styles.chipMain} activeOpacity={0.7}
                                                        onPress={() => {
                                                            if (!isActive && !isFullyAssigned) updateAssignment(item.id, p.id, item.qty, 1);
                                                            else if (isActive && item.qty === 1) updateAssignment(item.id, p.id, item.qty, -1);
                                                            else if (isActive) updateAssignment(item.id, p.id, item.qty, 1);
                                                        }}
                                                    >
                                                        <Text style={[styles.chipText, { color: theme.textSecondary }, isActive && { color: '#FFFFFF' }]}>{p.name} {isActive && item.qty > 1 ? `(${qtyTaken})` : ''}</Text>
                                                    </TouchableOpacity>
                                                    {isActive && item.qty > 1 && <TouchableOpacity style={styles.stepperBtn} onPress={() => updateAssignment(item.id, p.id, item.qty, 1)}><Ionicons name="add" size={16} color="#FFFFFF" /></TouchableOpacity>}
                                                </View>
                                            );
                                        })}
                                    </ScrollView>
                                </View>
                            );
                        })}
                    </View>
                )}

                {step === 3 && (
                    <View>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.stepBadge}>STEP 3</Text>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Split Results</Text>
                            {taxAndService > 0 && (
                                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Includes proportional distribution of Rp {formatIDR(taxAndService)} for Tax & Service.</Text>
                            )}
                        </View>

                        {splitResults.map((person) => (
                            <View key={person.id} style={[styles.resultCard, { backgroundColor: theme.surface }]}>
                                <Text style={[styles.resultName, { color: theme.text }]}>{person.name}</Text>
                                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                                {person.items.map((item, idx) => (
                                    <View key={idx} style={styles.resultItemRow}>
                                        <Text style={[styles.resultItemName, { color: theme.textSecondary }]}>{item.qty}x {item.name}</Text>
                                        <Text style={[styles.resultItemCost, { color: theme.text }]}>Rp {formatIDR(item.cost)}</Text>
                                    </View>
                                ))}

                                <View style={[styles.dividerSoft, { borderColor: theme.border }]} />

                                <View style={styles.resultItemRow}>
                                    <Text style={[styles.resultSubLabel, { color: theme.textMuted }]}>Subtotal</Text>
                                    <Text style={[styles.resultSubValue, { color: theme.textSecondary }]}>Rp {formatIDR(person.subtotal)}</Text>
                                </View>

                                {person.taxShare > 0 && (
                                    <View style={styles.resultItemRow}>
                                        <Text style={[styles.resultSubLabel, { color: theme.textMuted }]}>Tax & Service</Text>
                                        <Text style={[styles.resultSubValue, { color: theme.textSecondary }]}>Rp {formatIDR(person.taxShare)}</Text>
                                    </View>
                                )}

                                <View style={[styles.resultItemRow, { marginTop: 12 }]}>
                                    <Text style={[styles.resultGrandTotalLabel, { color: theme.deepNavy }]}>Grand Total</Text>
                                    <Text style={[styles.resultGrandTotalValue, { color: theme.indigo }]}>Rp {formatIDR(person.grandTotal)}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

            </ScrollView>

            <View style={[styles.footer, { backgroundColor: theme.footerBg }]}>
                {step === 1 && (
                    <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.deepNavy }]} onPress={handleGoToScanner}>
                        <Ionicons name="camera" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.primaryButtonText}>Scan Receipt</Text>
                    </TouchableOpacity>
                )}
                {step === 2 && (
                    <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.deepNavy }]} onPress={handleCalculate}>
                        <Text style={styles.primaryButtonText}>Calculate Split</Text>
                        <Ionicons name="calculator" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                )}
                {step === 3 && (
                    <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.deepNavy }]} onPress={handleDone}>
                        <Text style={styles.primaryButtonText}>Done & Return Home</Text>
                        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
        borderRadius: 20,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    sectionHeader: {
        marginBottom: 24,
    },
    stepBadge: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 12,
        color: '#6366F1',
        letterSpacing: 1,
        marginBottom: 8,
    },
    sectionTitle: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 24,
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontFamily: 'SpaceGrotesk_500Medium',
        fontSize: 14,
    },
    card: {
        borderRadius: 24,
        padding: 24,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 4,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontFamily: 'SpaceGrotesk_600SemiBold',
        fontSize: 13,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontFamily: 'SpaceGrotesk_600SemiBold',
        fontSize: 15,
    },
    addPersonBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        paddingVertical: 14,
        borderStyle: 'dashed',
        borderWidth: 1,
        marginTop: 8,
    },
    addPersonText: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 14,
        marginLeft: 8,
    },
    itemCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    itemCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    itemDetails: {
        flex: 1,
        paddingRight: 12,
    },
    itemName: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 16,
        marginBottom: 4,
    },
    itemQtyPrice: {
        fontFamily: 'SpaceGrotesk_500Medium',
        fontSize: 13,
    },
    itemTotal: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 16,
        textAlign: 'right',
    },
    remainingText: {
        fontFamily: 'SpaceGrotesk_600SemiBold',
        fontSize: 11,
        color: '#F59E0B',
        marginTop: 4,
        textAlign: 'right',
        textTransform: 'uppercase',
    },
    assignLabel: {
        fontFamily: 'SpaceGrotesk_600SemiBold',
        fontSize: 12,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    chipScroll: {
        flexDirection: 'row',
    },
    chipWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        overflow: 'hidden',
    },
    chipMain: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        justifyContent: 'center',
    },
    stepperBtn: {
        paddingHorizontal: 10,
        paddingVertical: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    chipText: {
        fontFamily: 'SpaceGrotesk_600SemiBold',
        fontSize: 13,
    },
    footer: {
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 32 : 20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 10,
    },
    primaryButton: {
        flexDirection: 'row',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 16,
        letterSpacing: 0.5,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deletePersonBtn: {
        marginLeft: 12,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },

    resultCard: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 16,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    resultName: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 20,
    },
    divider: {
        height: 1,
        marginVertical: 16,
    },
    dividerSoft: {
        height: 1,
        borderStyle: 'dashed',
        borderWidth: 1,
        marginVertical: 12,
    },
    resultItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    resultItemName: {
        fontFamily: 'SpaceGrotesk_500Medium',
        fontSize: 14,
        flex: 1,
        paddingRight: 16,
    },
    resultItemCost: {
        fontFamily: 'SpaceGrotesk_600SemiBold',
        fontSize: 14,
    },
    resultSubLabel: {
        fontFamily: 'SpaceGrotesk_500Medium',
        fontSize: 13,
    },
    resultSubValue: {
        fontFamily: 'SpaceGrotesk_600SemiBold',
        fontSize: 13,
    },
    resultGrandTotalLabel: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 18,
    },
    resultGrandTotalValue: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 22,
    },
});