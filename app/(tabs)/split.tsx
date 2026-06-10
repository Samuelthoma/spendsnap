import { useReceiptStore } from '@/store/useReceiptStore';
import { Assignments, generateSplitSummary } from '@/utils/splitCalculation';
import { SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold, useFonts } from '@expo-google-fonts/space-grotesk';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const formatIDR = (value: number) => Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export default function SplitBillScreen() {
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
        if (participants.length <= 1) return alert("You must have at least one person.");
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
            alert("Please enter names for everyone splitting the bill.");
        }
    };

    const handleCalculate = () => {
        const totalItems = scannedItems.reduce((sum, item) => sum + item.qty, 0);
        let assignedItems = 0;
        scannedItems.forEach(item => { assignedItems += getAssignedTotal(item.id); });

        if (assignedItems < totalItems) {
            alert("Hold on! Please assign all remaining items before calculating the split.");
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
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Split Bill</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

                {step === 1 && (
                    <View>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.stepBadge}>STEP 1</Text>
                            <Text style={styles.sectionTitle}>Who's splitting?</Text>
                        </View>
                        <View style={styles.card}>
                            {participants.map((p, index) => (
                                <View key={p.id} style={styles.inputGroup}>
                                    <Text style={styles.label}>Person {index + 1}</Text>
                                    <View style={styles.inputRow}>
                                        <TextInput
                                            style={[styles.input, { flex: 1 }]}
                                            placeholder="Enter name"
                                            placeholderTextColor="#94A3B8"
                                            value={p.name}
                                            onChangeText={(text) => updatePersonName(p.id, text)}
                                        />
                                        <TouchableOpacity style={styles.deletePersonBtn} onPress={() => removePerson(p.id)}>
                                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                            <TouchableOpacity style={styles.addPersonBtn} onPress={addPerson}>
                                <Ionicons name="person-add-outline" size={18} color="#4F46E5" />
                                <Text style={styles.addPersonText}>Add Another Person</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {step === 2 && (
                    <View>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.stepBadge}>STEP 2</Text>
                            <Text style={styles.sectionTitle}>Assign Items</Text>
                        </View>
                        {scannedItems.map((item) => {
                            const totalAssigned = getAssignedTotal(item.id);
                            const isFullyAssigned = totalAssigned === item.qty;

                            return (
                                <View key={item.id} style={[styles.itemCard, isFullyAssigned && styles.itemCardComplete]}>
                                    <View style={styles.itemCardTop}>
                                        <View style={styles.itemDetails}>
                                            <Text style={styles.itemName}>{item.name}</Text>
                                            <Text style={styles.itemQtyPrice}>{item.qty}x @ Rp {formatIDR(item.price)}</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={styles.itemTotal}>Rp {formatIDR(item.total)}</Text>
                                            <Text style={[styles.remainingText, isFullyAssigned && { color: '#10B981' }]}>
                                                {isFullyAssigned ? 'Fully Assigned ✓' : `${item.qty - totalAssigned} left`}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.assignLabel}>Assign to:</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                                        {participants.map(p => {
                                            const qtyTaken = (assignments[item.id] || {})[p.id] || 0;
                                            const isActive = qtyTaken > 0;
                                            return (
                                                <View key={p.id} style={[styles.chipWrapper, isActive && styles.chipWrapperActive]}>
                                                    {isActive && <TouchableOpacity style={styles.stepperBtn} onPress={() => updateAssignment(item.id, p.id, item.qty, -1)}><Ionicons name="remove" size={16} color="#FFFFFF" /></TouchableOpacity>}
                                                    <TouchableOpacity
                                                        style={styles.chipMain} activeOpacity={0.7}
                                                        onPress={() => {
                                                            if (!isActive && !isFullyAssigned) updateAssignment(item.id, p.id, item.qty, 1);
                                                            else if (isActive && item.qty === 1) updateAssignment(item.id, p.id, item.qty, -1);
                                                            else if (isActive) updateAssignment(item.id, p.id, item.qty, 1);
                                                        }}
                                                    >
                                                        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{p.name} {isActive && item.qty > 1 ? `(${qtyTaken})` : ''}</Text>
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
                            <Text style={styles.sectionTitle}>Split Results</Text>
                            {taxAndService > 0 && (
                                <Text style={styles.sectionSubtitle}>Includes proportional distribution of Rp {formatIDR(taxAndService)} for Tax & Service.</Text>
                            )}
                        </View>

                        {splitResults.map((person) => (
                            <View key={person.id} style={styles.resultCard}>
                                <Text style={styles.resultName}>{person.name}</Text>
                                <View style={styles.divider} />

                                {person.items.map((item, idx) => (
                                    <View key={idx} style={styles.resultItemRow}>
                                        <Text style={styles.resultItemName}>{item.qty}x {item.name}</Text>
                                        <Text style={styles.resultItemCost}>Rp {formatIDR(item.cost)}</Text>
                                    </View>
                                ))}

                                <View style={styles.dividerSoft} />

                                <View style={styles.resultItemRow}>
                                    <Text style={styles.resultSubLabel}>Subtotal</Text>
                                    <Text style={styles.resultSubValue}>Rp {formatIDR(person.subtotal)}</Text>
                                </View>

                                {person.taxShare > 0 && (
                                    <View style={styles.resultItemRow}>
                                        <Text style={styles.resultSubLabel}>Tax & Service</Text>
                                        <Text style={styles.resultSubValue}>Rp {formatIDR(person.taxShare)}</Text>
                                    </View>
                                )}

                                <View style={[styles.resultItemRow, { marginTop: 12 }]}>
                                    <Text style={styles.resultGrandTotalLabel}>Grand Total</Text>
                                    <Text style={styles.resultGrandTotalValue}>Rp {formatIDR(person.grandTotal)}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

            </ScrollView>

            <View style={styles.footer}>
                {step === 1 && (
                    <TouchableOpacity style={styles.primaryButton} onPress={handleGoToScanner}>
                        <Ionicons name="camera" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.primaryButtonText}>Scan Receipt</Text>
                    </TouchableOpacity>
                )}
                {step === 2 && (
                    <TouchableOpacity style={styles.primaryButton} onPress={handleCalculate}>
                        <Text style={styles.primaryButtonText}>Calculate Split</Text>
                        <Ionicons name="calculator" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                )}
                {step === 3 && (
                    <TouchableOpacity style={styles.primaryButton} onPress={handleDone}>
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
        backgroundColor: '#F8FAFC'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9'
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        shadowColor: '#6366F1',
        shadowOffset: {
            width: 0,
            height: 4
        },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'SpaceGrotesk_700Bold',
        color: '#0F172A'
    },
    scrollView: {
        flex: 1
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40
    },
    sectionHeader: {
        marginBottom: 24
    },
    stepBadge: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 12,
        color: '#6366F1',
        letterSpacing: 1,
        marginBottom: 8
    },
    sectionTitle: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 24,
        color: '#0F172A',
        marginBottom: 8
    },
    sectionSubtitle: {
        fontFamily: 'SpaceGrotesk_500Medium',
        fontSize: 14,
        color: '#64748B'
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24, shadowColor: '#6366F1',
        shadowOffset: {
            width: 0,
            height: 8
        },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 4
    },
    inputGroup: {
        marginBottom: 16
    },
    label: {
        fontFamily: 'SpaceGrotesk_600SemiBold',
        fontSize: 13,
        color: '#475569',
        marginBottom: 8
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontFamily: 'SpaceGrotesk_600SemiBold',
        fontSize: 15,
        color: '#0F172A'
    },
    addPersonBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EEF2FF',
        borderRadius: 12,
        paddingVertical: 14,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#A5B4FC',
        marginTop: 8
    },
    addPersonText: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 14,
        color: '#4F46E5',
        marginLeft: 8
    },
    itemCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#6366F1',
        shadowOffset: {
            width: 0,
            height: 4
        },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'transparent'
    },
    itemCardComplete: {
        borderColor: '#D1FAE5',
        backgroundColor: '#F8FAFC'
    },
    itemCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    itemDetails: {
        flex: 1,
        paddingRight: 12
    },
    itemName: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 16,
        color: '#0F172A',
        marginBottom: 4
    },
    itemQtyPrice: {
        fontFamily: 'SpaceGrotesk_500Medium',
        fontSize: 13,
        color: '#64748B'
    },
    itemTotal: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 16,
        color: '#1E1B4B',
        textAlign: 'right'
    },
    remainingText: {
        fontFamily: 'SpaceGrotesk_600SemiBold',
        fontSize: 11, color: '#F59E0B',
        marginTop: 4,
        textAlign: 'right',
        textTransform: 'uppercase'
    },
    assignLabel: {
        fontFamily: 'SpaceGrotesk_600SemiBold',
        fontSize: 12,
        color: '#94A3B8',
        textTransform: 'uppercase',
        marginBottom: 8
    },
    chipScroll: {
        flexDirection: 'row'
    },
    chipWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden'
    },
    chipWrapperActive: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5'
    },
    chipMain: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        justifyContent: 'center'
    },
    stepperBtn: {
        paddingHorizontal: 10,
        paddingVertical: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)'
    },
    chipText: {
        fontFamily: 'SpaceGrotesk_600SemiBold',
        fontSize: 13,
        color: '#475569'
    },
    chipTextActive: {
        color: '#FFFFFF'
    },
    footer: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 32 : 20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -4
        },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 10
    },
    primaryButton: {
        flexDirection: 'row',
        backgroundColor: '#1E1B4B',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center'
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 16,
        letterSpacing: 0.5
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    deletePersonBtn: {
        marginLeft: 12,
        padding: 12,
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FECACA'
    },

    resultCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        marginBottom: 16,
        shadowColor: '#6366F1',
        shadowOffset: {
            width: 0,
            height: 4
        },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2
    },
    resultName: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 20,
        color: '#0F172A'
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 16
    },
    dividerSoft: {
        height: 1,
        backgroundColor: '#F1F5F9',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginVertical: 12
    },
    resultItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    resultItemName: {
        fontFamily: 'SpaceGrotesk_500Medium',
        fontSize: 14,
        color: '#475569',
        flex: 1,
        paddingRight: 16
    },
    resultItemCost: {
        fontFamily: 'SpaceGrotesk_600SemiBold',
        fontSize: 14,
        color: '#0F172A'
    },
    resultSubLabel: {
        fontFamily: 'SpaceGrotesk_500Medium',
        fontSize: 13,
        color: '#64748B'
    },
    resultSubValue: {
        fontFamily: 'SpaceGrotesk_600SemiBold',
        fontSize: 13,
        color: '#475569'
    },
    resultGrandTotalLabel: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 18,
        color: '#1E1B4B'
    },
    resultGrandTotalValue: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 22,
        color: '#4F46E5'
    },
});