// resources/js/Pages/products/Form.tsx
import React, { useEffect, useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { X, Edit, Plus } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react"

/* ---------- Types ---------- */
interface Category {
    id: number;
    name: string;
}

interface AttributeValue {
    id: number;
    value: string;
}

interface Attribute {
    id: number;
    name: string;
    values: AttributeValue[];
}

interface VariantFront {
    id?: number | null;
    name: string;
    sku: string;
    price: number;
    stock: number;
    attributes: Record<number, number>; // attribute_id => attribute_value_id
    images?: File[];
    existingImages?: { id: number; url: string }[];
    _tmpId?: string;
}

interface ProductFront {
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

interface Props {
    product?: ProductFront;
    categories: Category[];
    attributes: Attribute[];
}

/* ---------- Drawer Component ---------- */
function Drawer({ open, onClose, title, children }: any) {
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            <div
                onClick={onClose}
                className="absolute inset-0 bg-black/40 transition-opacity"
            />
            <div className="absolute right-0 top-0 h-full w-full md:w-[540px] bg-white dark:bg-gray-900 shadow-xl transform transition-transform">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded hover:bg-gray-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-4 overflow-auto h-[calc(100%-64px)]">
                    {children}
                </div>
            </div>
        </div>
    );
}

/* ---------- Main Component ---------- */
export default function ProductForm({ product, categories, attributes }: Props) {
    const isEdit = !!product;

    const { data, setData, processing, post, errors, reset } = useForm({
        name: product?.name || "",
        description: product?.description || "",
        price: product?.price ?? 0,
        stock: product?.stock ?? 0,
        category_id: product?.category_id ?? "",
        has_variant: product?.has_variant ?? false,
        variants: (product?.variants || []).map((v: any) => {
            const attributesMap: Record<number, number> = {};
            if (Array.isArray(v.values)) {
                v.values.forEach((val: any) => {
                    const aid = Number(val.attribute_id);
                    const vid = Number(val.attribute_value_id);
                    if (!isNaN(aid) && !isNaN(vid)) {
                        attributesMap[aid] = vid;
                    }
                });
            }
            const existingImages = Array.isArray(v.images) ? v.images : [];
            return {
                id: v.id ?? null,
                name: v.name ?? "",
                sku: v.sku ?? "",
                price: v.price ?? 0,
                stock: v.stock ?? 0,
                attributes: attributesMap,
                images: [] as File[],
                existingImages: existingImages as { id: number; url: string }[],
                _tmpId: String(Math.random()).slice(2),
            } as VariantFront;
        }),
        images: [] as File[],
    });

    // Local UI state
    const [existingImages, setExistingImages] = useState<{ id: number; url: string }[]>(
        product?.images || []
    );
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Variant drawer state
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [variantForm, setVariantForm] = useState<VariantFront | null>(null);
    const [variantErrors, setVariantErrors] = useState<Record<string, string>>({});
    const [variantImagePreviews, setVariantImagePreviews] = useState<string[]>([]);

    /* ---------- Helper Functions ---------- */
    const findAttrName = (attributeId: number) =>
        attributes.find(a => a.id === attributeId)?.name ?? String(attributeId);

    const findValueLabel = (attributeId: number, valueId: number) =>
        attributes.find(a => a.id === attributeId)?.values.find(v => v.id === valueId)?.value ??
        String(valueId);

    // Build FormData recursively
    function buildFormData(formData: FormData, obj: any, parentKey?: string) {
        if (obj === null || obj === undefined) return;

        if (obj instanceof File) {
            formData.append(parentKey!, obj, obj.name);
            return;
        }

        if (Array.isArray(obj)) {
            obj.forEach((value, index) => {
                const key = `${parentKey}[${index}]`;
                buildFormData(formData, value, key);
            });
            return;
        }

        if (typeof obj === "object") {
            Object.keys(obj).forEach(k => {
                const value = obj[k];
                const key = parentKey ? `${parentKey}[${k}]` : k;
                buildFormData(formData, value, key);
            });
            return;
        }

        formData.append(parentKey!, String(obj));
    }

    /* ---------- Product Images ---------- */
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const files = Array.from(e.target.files);
        setData("images", files);

        // Revoke old previews
        imagePreviews.forEach(u => URL.revokeObjectURL(u));

        // Create new previews
        const urls = files.map(f => URL.createObjectURL(f));
        setImagePreviews(urls);
    };

    const removePreview = (index: number) => {
        const files = [...(data.images || [])];
        const previews = [...imagePreviews];

        if (files[index]) files.splice(index, 1);
        if (previews[index]) {
            URL.revokeObjectURL(previews[index]);
            previews.splice(index, 1);
        }

        setData("images", files);
        setImagePreviews(previews);
    };

    const deleteExistingImage = (mediaId: number) => {
        if (!product?.id) return;
        if (!confirm("Delete this image?")) return;

        router.delete(
            route("products.media.delete", { product: product.id, media: mediaId }),
            {
                preserveScroll: true,
                onSuccess: () => setExistingImages(prev => prev.filter(i => i.id !== mediaId)),
                onError: () => alert("Failed to delete image"),
            }
        );
    };

    /* ---------- Variant Management ---------- */
    const openAddVariant = () => {
        setEditingIndex(null);
        setVariantForm({
            id: null,
            name: "",
            sku: "",
            price: 0,
            stock: 0,
            attributes: {},
            images: [],
            existingImages: [],
            _tmpId: String(Math.random()).slice(2),
        });
        setVariantErrors({});
        variantImagePreviews.forEach(u => URL.revokeObjectURL(u));
        setVariantImagePreviews([]);
        setDrawerOpen(true);
    };

    const openEditVariant = (index: number) => {
        const v = data.variants[index];
        const attributesMap: Record<number, number> = {};

        if (Array.isArray(v.values)) {
            v.values.forEach((val: any) => {
                const aid = Number(val.attribute_id);
                const vid = Number(val.attribute_value_id);
                if (!isNaN(aid) && !isNaN(vid)) {
                    attributesMap[aid] = vid;
                }
            });
        } else if (v.attributes) {
            Object.entries(v.attributes).forEach(([k, val]: any) => {
                const id = Number(k);
                if (!isNaN(id) && !isNaN(Number(val))) {
                    attributesMap[id] = Number(val);
                }
            });
        }

        setEditingIndex(index);
        setVariantForm({
            id: v.id ?? null,
            name: v.name ?? "",
            sku: v.sku ?? "",
            price: v.price ?? 0,
            stock: v.stock ?? 0,
            attributes: attributesMap,
            images: [],
            existingImages: v.existingImages ?? [],
            _tmpId: v._tmpId ?? String(Math.random()).slice(2),
        });
        setVariantErrors({});
        variantImagePreviews.forEach(u => URL.revokeObjectURL(u));
        setVariantImagePreviews([]);
        setDrawerOpen(true);
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
        setVariantForm(null);
        setEditingIndex(null);
        setVariantErrors({});
        variantImagePreviews.forEach(u => URL.revokeObjectURL(u));
        setVariantImagePreviews([]);
    };

    const handleVariantImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !variantForm) return;

        const files = Array.from(e.target.files);
        setVariantForm({ ...variantForm, images: files });

        // Revoke old previews
        variantImagePreviews.forEach(u => URL.revokeObjectURL(u));

        // Create new previews
        const urls = files.map(f => URL.createObjectURL(f));
        setVariantImagePreviews(urls);
    };

    const removeVariantPreview = (index: number) => {
        if (!variantForm) return;

        const files = [...(variantForm.images || [])];
        files.splice(index, 1);

        // Cleanup preview URL
        URL.revokeObjectURL(variantImagePreviews[index]);
        const newPreviews = variantImagePreviews.filter((_, idx) => idx !== index);

        setVariantImagePreviews(newPreviews);
        setVariantForm({ ...variantForm, images: files });
    };

    const removeVariantExistingImageLocal = (mediaId: number) => {
        if (!variantForm) return;
        setVariantForm({
            ...variantForm,
            existingImages: (variantForm.existingImages || []).filter(m => m.id !== mediaId)
        });
    };

    // Validate variant
    const validateVariant = (v: VariantFront): Record<string, string> => {
        const err: Record<string, string> = {};

        // Name validation
        if (!v.name || v.name.trim() === "") {
            err.name = "Name is required";
        }

        // SKU validation
        if (!v.sku || v.sku.trim() === "") {
            err.sku = "SKU is required";
        } else {
            // Check SKU uniqueness
            const skuLower = v.sku.trim().toLowerCase();
            const isDuplicate = (data.variants || []).some((variant: any, idx: number) => {
                // Skip current variant when editing
                if (editingIndex !== null && idx === editingIndex) return false;
                return variant.sku.trim().toLowerCase() === skuLower;
            });

            if (isDuplicate) {
                err.sku = "SKU must be unique";
            }
        }

        // Price validation
        if (v.price === null || v.price === undefined || v.price < 0) {
            err.price = "Price must be a positive number";
        }

        // Stock validation
        if (v.stock === null || v.stock === undefined || v.stock < 0) {
            err.stock = "Stock must be a positive number";
        }

        // Attribute validation - require at least 1 attribute
        const selectedAttrs = Object.keys(v.attributes || {}).filter(
            key => v.attributes[Number(key)]
        );

        if (selectedAttrs.length === 0) {
            err.attributes = "Please select at least one attribute";
        } else {
            // Check for duplicate combination
            const selectedValues = selectedAttrs
                .map(key => Number(v.attributes[Number(key)]))
                .filter(val => !isNaN(val))
                .sort((a, b) => a - b);

            const combination = selectedValues.join("-");

            const isDuplicateCombination = (data.variants || []).some((variant: any, idx: number) => {
                // Skip current variant when editing
                if (editingIndex !== null && idx === editingIndex) return false;

                const variantAttrs = variant.attributes || {};
                const variantValues = Object.values(variantAttrs)
                    .map((val: any) => Number(val))
                    .filter((val: any) => !isNaN(val))
                    .sort((a: any, b: any) => a - b);

                return variantValues.join("-") === combination;
            });

            if (isDuplicateCombination) {
                err.attributes = "This attribute combination already exists";
            }
        }

        return err;
    };

    const saveVariantFromDrawer = () => {
        if (!variantForm) return;

        const err = validateVariant(variantForm);
        if (Object.keys(err).length > 0) {
            setVariantErrors(err);
            return;
        }

        const newVariants = [...(data.variants || [])];
        const toSave: any = {
            id: variantForm.id ?? null,
            name: variantForm.name.trim(),
            sku: variantForm.sku.trim(),
            price: Number(variantForm.price),
            stock: Number(variantForm.stock),
            attributes: variantForm.attributes,
            images: variantForm.images || [],
            existingImages: variantForm.existingImages || [],
            _tmpId: variantForm._tmpId || String(Math.random()).slice(2),
        };

        if (editingIndex === null) {
            newVariants.push(toSave);
        } else {
            newVariants[editingIndex] = toSave;
        }

        setData("variants", newVariants);
        closeDrawer();
    };

    const removeVariant = (index: number) => {
        if (!confirm("Remove this variant?")) return;
        setData("variants", (data.variants || []).filter((_: any, i: number) => i !== index));
    };

    /* ---------- Form Submit ---------- */
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Validate variants if enabled
        if (data.has_variant) {
            if (!data.variants || data.variants.length < 1) {
                alert("Please add at least one variant.");
                setIsSubmitting(false);
                return;
            }
        }

        // Prepare payload
        const payload: any = { ...data };
        payload.variants = (data.variants || []).map((v: any) => {
            const valuesArr: any[] = [];
            if (v.attributes) {
                for (const [attrIdStr, valId] of Object.entries(v.attributes)) {
                    const attrId = Number(attrIdStr);
                    const valueId = Number(valId);
                    if (!isNaN(attrId) && !isNaN(valueId) && valueId) {
                        valuesArr.push({
                            attribute_id: attrId,
                            attribute_value_id: valueId,
                        });
                    }
                }
            }

            return {
                id: v.id ?? null,
                name: v.name,
                sku: v.sku,
                price: Number(v.price),
                stock: Number(v.stock),
                values: valuesArr,
                images: v.images || [],
                existingImages: v.existingImages || [],
                _tmpId: v._tmpId,
            };
        });

        // Build FormData
        const formData = new FormData();
        buildFormData(formData, payload);

        const url = isEdit
            ? route("products.update", product.id)
            : route("products.store");
        post(url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {reset();},
            onFinish: () => setIsSubmitting(false),
        });

    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            imagePreviews.forEach(u => URL.revokeObjectURL(u));
            variantImagePreviews.forEach(u => URL.revokeObjectURL(u));
        };
    }, []);

    /* ---------- Render ---------- */
    return (
        <AppLayout
            title={isEdit ? "Edit Product" : "Create Product"}
            breadcrumbs={[
                { title: "Dashboard", href: route("admin.home") },
                { title: "Products", href: route("products.index") },
                { title: isEdit ? "Edit" : "Create", href: "#" },
            ]}
        >
            <Head title={isEdit ? "Edit Product" : "Create Product"} />

            <form onSubmit={handleSubmit} className="space-y-6 pb-28">
                <Card>
                    <CardHeader>
                        <CardTitle>{isEdit ? "Edit Product" : "Create Product"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {Object.keys(errors).length > 0 && (
                            <Alert variant="destructive" className="mb-4 border-l-4 border-red-500 dark:border-red-400">
                                <AlertCircle className="h-4 w-4" />

                                <AlertTitle className="font-semibold">Errors</AlertTitle>

                                <AlertDescription className="space-y-1 mt-2">
                                    {Object.entries(errors).map(([key, messages]) => (
                                        <p key={key} className="text-sm leading-relaxed">
                                            • {Array.isArray(messages) ? messages[0] : messages}
                                        </p>
                                    ))}
                                </AlertDescription>
                            </Alert>
                        )}
                        <Tabs defaultValue="general" className="mt-3">
                            <TabsList className={`mb-6 grid ${data.has_variant ? "grid-cols-3" : "grid-cols-2"} w-full`}>
                                <TabsTrigger value="general">General Info</TabsTrigger>
                                <TabsTrigger value="images">Images</TabsTrigger>
                                {data.has_variant && <TabsTrigger value="variants">Variants</TabsTrigger>}
                            </TabsList>

                            {/* General Tab */}
                            <TabsContent value="general">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <Label htmlFor="name">Product Name *</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={e => setData("name", e.target.value)}
                                        />
                                        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="category">Category</Label>
                                        <select
                                            id="category"
                                            value={data.category_id as any}
                                            onChange={e => setData("category_id", Number(e.target.value))}
                                            className="block w-full border rounded px-3 py-2"
                                        >
                                            <option value="">Select category</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        {errors.category_id && <p className="text-sm text-red-500 mt-1">{errors.category_id}</p>}
                                    </div>

                                    <div className="md:col-span-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            rows={4}
                                            value={data.description}
                                            onChange={e => setData("description", e.target.value)}
                                        />
                                        {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="price">Price *</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.price as any}
                                            onChange={e => setData("price", parseFloat(e.target.value) || 0)}
                                            disabled={data.has_variant}
                                        />
                                        {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="stock">Stock *</Label>
                                        <Input
                                            id="stock"
                                            type="number"
                                            step="1"
                                            min="0"
                                            value={data.has_variant ? 0 : data.stock as any}
                                            onChange={e => setData("stock", parseInt(e.target.value) || 0)}
                                            disabled={data.has_variant}
                                        />
                                        {errors.stock && <p className="text-sm text-red-500 mt-1">{errors.stock}</p>}
                                    </div>

                                    <div className="flex items-center gap-3 mt-4">
                                        <Switch
                                            id="has-variant"
                                            checked={data.has_variant}
                                            onCheckedChange={(v) => {
                                                setData("has_variant", v);
                                                if (!v) setData("variants", []);
                                            }}
                                        />
                                        <Label htmlFor="has-variant" className="cursor-pointer">
                                            Has Variants?
                                        </Label>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Images Tab */}
                            <TabsContent value="images">
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="product-images">Upload Product Images</Label>
                                        <Input
                                            id="product-images"
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleImageChange}
                                        />
                                    </div>

                                    {existingImages.length > 0 && (
                                        <div>
                                            <h4 className="font-medium mb-2">Existing Images</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {existingImages.map(img => (
                                                    <div key={img.id} className="relative rounded overflow-hidden border">
                                                        <img
                                                            src={img.url}
                                                            alt="Product"
                                                            className="object-cover w-full h-32"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteExistingImage(img.id)}
                                                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {imagePreviews.length > 0 && (
                                        <div>
                                            <h4 className="font-medium mb-2">New Uploads</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {imagePreviews.map((url, i) => (
                                                    <div key={i} className="relative rounded overflow-hidden border">
                                                        <img
                                                            src={url}
                                                            alt="Preview"
                                                            className="object-cover w-full h-32"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removePreview(i)}
                                                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Variants Tab */}
                            {data.has_variant && (
                                <TabsContent value="variants">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold">
                                            Variants ({(data.variants || []).length})
                                        </h3>
                                        <Button type="button" onClick={openAddVariant}>
                                            <Plus className="w-4 h-4 mr-1" />
                                            Add Variant
                                        </Button>
                                    </div>

                                    {(data.variants || []).length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            No variants added yet. Click "Add Variant" to create one.
                                        </div>
                                    ) : (
                                        <div className="overflow-auto border rounded">
                                            <table className="min-w-full text-left text-sm">
                                                <thead className="bg-gray-50 dark:bg-gray-800">
                                                    <tr>
                                                        <th className="p-3">#</th>
                                                        <th className="p-3">Name</th>
                                                        <th className="p-3">SKU</th>
                                                        <th className="p-3">Price</th>
                                                        <th className="p-3">Stock</th>
                                                        <th className="p-3">Attributes</th>
                                                        <th className="p-3">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(data.variants || []).map((v: any, idx: number) => (
                                                        <tr key={v._tmpId || v.id || idx} className="border-t">
                                                            <td className="p-3 align-top">{idx + 1}</td>
                                                            <td className="p-3 align-top">{v.name}</td>
                                                            <td className="p-3 align-top font-mono text-xs">{v.sku}</td>
                                                            <td className="p-3 align-top">Rp. {Number(v.price).toFixed(0)}</td>
                                                            <td className="p-3 align-top">{v.stock}</td>
                                                            <td className="p-3 align-top">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {Array.isArray(v.values) && v.values.length > 0
                                                                        ? v.values.map((val: any) => (
                                                                            <span
                                                                                key={val.attribute_id}
                                                                                className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                                                                            >
                                                                                {val.attribute_name}: {val.attribute_value}
                                                                            </span>
                                                                        ))
                                                                        : Object.entries(v.attributes || {})
                                                                            .filter(([_, vid]) => vid) // Only show selected attributes
                                                                            .map(([aid, vid]: any) => (
                                                                                <span
                                                                                    key={aid}
                                                                                    className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                                                                                >
                                                                                    {findAttrName(Number(aid))}: {findValueLabel(Number(aid), Number(vid))}
                                                                                </span>
                                                                            ))
                                                                    }
                                                                </div>
                                                            </td>
                                                            <td className="p-3 align-top">
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openEditVariant(idx)}
                                                                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                                                        title="Edit variant"
                                                                    >
                                                                        <Edit className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeVariant(idx)}
                                                                        className="px-2 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </TabsContent>
                            )}
                        </Tabs>

                        <Separator className="my-6" />

                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.visit(route("products.index"))}
                                disabled={isSubmitting || processing}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || processing}
                            >
                                {isSubmitting ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>

            {/* Variant Drawer */}
            <Drawer
                open={drawerOpen}
                onClose={closeDrawer}
                title={editingIndex === null ? "Add Variant" : "Edit Variant"}
            >
                {variantForm && (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="variant-name">Variant Name *</Label>
                            <Input
                                id="variant-name"
                                value={variantForm.name}
                                onChange={e => setVariantForm({ ...variantForm, name: e.target.value })}
                                placeholder="e.g., Red - Large"
                            />
                            {variantErrors.name && (
                                <p className="text-sm text-red-500 mt-1">{variantErrors.name}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="variant-sku">SKU (Stock Keeping Unit) *</Label>
                            <Input
                                id="variant-sku"
                                value={variantForm.sku}
                                onChange={e => setVariantForm({ ...variantForm, sku: e.target.value })}
                                placeholder="e.g., PROD-RED-L"
                            />
                            {variantErrors.sku && (
                                <p className="text-sm text-red-500 mt-1">{variantErrors.sku}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">SKU must be unique across all variants</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="variant-price">Price *</Label>
                                <Input
                                    id="variant-price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={variantForm.price as any}
                                    onChange={e => setVariantForm({
                                        ...variantForm,
                                        price: parseFloat(e.target.value) || 0
                                    })}
                                />
                                {variantErrors.price && (
                                    <p className="text-sm text-red-500 mt-1">{variantErrors.price}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="variant-stock">Stock *</Label>
                                <Input
                                    id="variant-stock"
                                    type="number"
                                    step="1"
                                    min="0"
                                    value={variantForm.stock as any}
                                    onChange={e => setVariantForm({
                                        ...variantForm,
                                        stock: parseInt(e.target.value) || 0
                                    })}
                                />
                                {variantErrors.stock && (
                                    <p className="text-sm text-red-500 mt-1">{variantErrors.stock}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <Label className="mb-2 block">
                                Attributes * <span className="text-xs text-gray-500">(Select at least 1)</span>
                            </Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {attributes.map(attr => (
                                    <div key={attr.id}>
                                        <Label className="text-sm font-normal">{attr.name}</Label>
                                        <select
                                            className="w-full border rounded px-3 py-2 text-sm"
                                            value={variantForm.attributes?.[attr.id] ?? ""}
                                            onChange={e => {
                                                const newValue = e.target.value ? Number(e.target.value) : undefined;
                                                const newAttributes = { ...(variantForm.attributes || {}) };

                                                if (newValue) {
                                                    newAttributes[attr.id] = newValue;
                                                } else {
                                                    delete newAttributes[attr.id];
                                                }

                                                setVariantForm({
                                                    ...variantForm,
                                                    attributes: newAttributes
                                                });
                                            }}
                                        >
                                            <option value="">-- None --</option>
                                            {attr.values.map(v => (
                                                <option key={v.id} value={v.id}>{v.value}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                            {variantErrors.attributes && (
                                <p className="text-sm text-red-500 mt-1">{variantErrors.attributes}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="variant-images">Variant Images</Label>
                            <Input
                                id="variant-images"
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleVariantImageChange}
                            />

                            <div className="flex gap-2 mt-3 flex-wrap">
                                {/* New file previews */}
                                {variantImagePreviews.map((url, i) => (
                                    <div key={`preview-${i}`} className="relative">
                                        <img
                                            src={url}
                                            alt={`Preview ${i + 1}`}
                                            className="h-20 w-20 object-cover rounded border"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeVariantPreview(i)}
                                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}

                                {/* Existing images from server */}
                                {variantForm.existingImages?.map(m => (
                                    <div key={m.id} className="relative">
                                        <img
                                            src={m.url}
                                            alt="Existing"
                                            className="h-20 w-20 object-cover rounded border"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeVariantExistingImageLocal(m.id)}
                                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}

                                {/* Placeholder when no images */}
                                {variantImagePreviews.length === 0 &&
                                    (variantForm.existingImages?.length ?? 0) === 0 && (
                                        <div className="h-20 w-20 bg-gray-100 dark:bg-gray-800 rounded border-2 border-dashed flex items-center justify-center text-xs text-gray-400">
                                            No images
                                        </div>
                                    )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeDrawer}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={saveVariantFromDrawer}
                            >
                                {editingIndex === null ? "Add Variant" : "Update Variant"}
                            </Button>
                        </div>
                    </div>
                )}
            </Drawer>
        </AppLayout>
    );
}