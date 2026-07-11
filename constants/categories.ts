export interface CategoryVisual {
    label: string;
    value: string;
    icon: string;
    color: string;
    bg: string;
}

export const CATEGORIES: CategoryVisual[] = [
    { label: 'Makanan & Minuman', value: 'Dining', icon: 'restaurant', color: '#F59E0B', bg: '#FEF3C7' },
    { label: 'Belanja', value: 'Shopping', icon: 'bag-handle', color: '#A855F7', bg: '#F3E8FF' },
    { label: 'Transportasi', value: 'Transport', icon: 'car', color: '#3B82F6', bg: '#DBEAFE' },
    { label: 'Bahan Makanan', value: 'Groceries', icon: 'cart', color: '#10B981', bg: '#E1F6EB' },
    { label: 'Hiburan', value: 'Entertainment', icon: 'film', color: '#6366F1', bg: '#E0E7FF' },
    { label: 'Kesehatan', value: 'Health', icon: 'medkit', color: '#EF4444', bg: '#FEE2E2' },
    { label: 'Tagihan & Utilitas', value: 'Utilities', icon: 'flash', color: '#06B6D4', bg: '#CFFAFE' },
    { label: 'Pendidikan', value: 'Education', icon: 'book', color: '#8B5CF6', bg: '#EDE9FE' },
    { label: 'Pribadi', value: 'Personal', icon: 'person', color: '#EC4899', bg: '#FCE7F3' },
    { label: 'Hadiah & Donasi', value: 'Gifts', icon: 'heart', color: '#F43F5E', bg: '#FFE4E6' },
    { label: 'Investasi', value: 'Investment', icon: 'trending-up', color: '#10B981', bg: '#D1FAE5' },
    { label: 'Lainnya', value: 'Lainnya', icon: 'receipt', color: '#6B7280', bg: '#F3F4F6' },
];

export const getCategoryVisuals = (categoryValue?: string): CategoryVisual => {
    if (!categoryValue) return CATEGORIES[CATEGORIES.length - 1];

    const found = CATEGORIES.find(
        (c) => c.value.toLowerCase() === categoryValue.toLowerCase()
    );

    return found || CATEGORIES[CATEGORIES.length - 1];
};