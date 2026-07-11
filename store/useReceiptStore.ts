import { create } from 'zustand';

export interface ScannedItem {
    id: string;
    name: string;
    qty: number;
    price: number;
    total: number;
}

export interface Participant {
    id: string;
    name: string;
}

interface ReceiptState {
    scannedItems: ScannedItem[];
    taxAndService: number;
    participants: Participant[];
    setReceiptData: (items: ScannedItem[], taxAndService: number) => void;
    setParticipants: (participants: Participant[]) => void;
    clearSplitSession: () => void;
}

export const useReceiptStore = create<ReceiptState>((set) => ({
    scannedItems: [],
    taxAndService: 0,
    participants: [
        { id: `p-1`, name: 'Me' },
        { id: `p-2`, name: '' }
    ],

    setReceiptData: (items, taxAndService) => set({ scannedItems: items, taxAndService }),
    setParticipants: (participants) => set({ participants }),

    clearSplitSession: () => set({
        scannedItems: [],
        taxAndService: 0,
        participants: [
            { id: `p-1`, name: 'Me' },
            { id: `p-2`, name: '' }
        ]
    }),
}));