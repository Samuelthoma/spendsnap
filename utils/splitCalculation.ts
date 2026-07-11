import { ScannedItem } from '../store/useReceiptStore';

export interface Participant {
    id: string;
    name: string;
}

export type Assignments = Record<string, Record<string, number>>;

export interface PersonSplitSummary {
    id: string;
    name: string;
    items: { name: string; qty: number; cost: number }[];
    subtotal: number;
    taxShare: number;
    grandTotal: number;
}

export const generateSplitSummary = (
    participants: Participant[],
    items: ScannedItem[],
    assignments: Assignments,
    totalTaxAndService: number
): PersonSplitSummary[] => {
    const personSubtotals: Record<string, number> = {};
    const personItems: Record<string, { name: string; qty: number; cost: number }[]> = {};

    let overallAssignedSubtotal = 0;

    participants.forEach(p => {
        personSubtotals[p.id] = 0;
        personItems[p.id] = [];

        items.forEach(item => {
            const qtyTaken = (assignments[item.id] || {})[p.id] || 0;
            if (qtyTaken > 0) {
                const cost = qtyTaken * item.price;
                personSubtotals[p.id] += cost;
                overallAssignedSubtotal += cost;
                personItems[p.id].push({ name: item.name, qty: qtyTaken, cost });
            }
        });
    });

    return participants.map(p => {
        const subtotal = personSubtotals[p.id];

        const taxShare = overallAssignedSubtotal > 0
            ? (subtotal / overallAssignedSubtotal) * totalTaxAndService
            : 0;

        return {
            id: p.id,
            name: p.name,
            items: personItems[p.id],
            subtotal,
            taxShare,
            grandTotal: subtotal + taxShare
        };
    }).filter(p => p.items.length > 0);
};