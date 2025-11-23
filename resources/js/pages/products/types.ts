export interface Category {
    id: number;
    name: string;
}

export interface AttributeValue {
    id: number;
    value: string;
}

export interface Attribute {
    id: number;
    name: string;
    values: AttributeValue[];
}

export interface VariantFront {
    id?: number | null;
    name: string;
    sku: string;
    price: number;
    stock: number;
    attributes: Record<number, number>; // attribute_id => attribute_value_id
    images?: File[];
    existingImages?: { id: number; url: string }[];
    _tmpId?: string;
    values?: any[]; // For incoming data from backend
}

export interface ProductFront {
    id?: number;
    name: string;
    description?: string;
    price?: number;
    stock?: number;
    category_id?: number | "";
    has_variant?: boolean;
    images?: { id: number; url: string }[];
    variants?: any[];
}