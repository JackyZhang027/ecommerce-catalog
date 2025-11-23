// resources/js/Pages/products/partials/VariantDrawer.tsx
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Attribute, VariantFront } from "../types";
import MediaPreview from "./MediaPreview";

interface DrawerProps {
    open: boolean;
    onClose: () => void;
    title: string;
    variant: VariantFront | null;
    attributes: Attribute[];
    allVariants: VariantFront[];
    currentEditIndex: number | null;
    onSave: (variant: VariantFront) => void;
}

export default function VariantDrawer({
    open,
    onClose,
    title,
    variant: initialVariant,
    attributes,
    allVariants,
    currentEditIndex,
    onSave,
}: DrawerProps) {
    // Local state for form
    const [form, setForm] = useState<VariantFront | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // Preview state now holds type info for proper rendering
    const [previews, setPreviews] = useState<{ url: string; type: string }[]>([]);

    // Initialize form
    useEffect(() => {
        if (open && initialVariant) {
            setForm({ ...initialVariant });
            setErrors({});
            setPreviews([]);
        } else {
            setForm(null);
        }
    }, [open, initialVariant]);

    // Handle body overflow
    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "unset";
        return () => { document.body.style.overflow = "unset"; };
    }, [open]);

    // Cleanup object URLs
    useEffect(() => {
        return () => previews.forEach((p) => URL.revokeObjectURL(p.url));
    }, [previews]);

    if (!open || !form) return null;

    /* --- Handlers --- */

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files);

        // Append new files to existing array
        setForm({ ...form, images: [...(form.images || []), ...files] });
        
        // Append new previews
        const newPreviews = files.map((f) => ({
            url: URL.createObjectURL(f),
            type: f.type
        }));
        setPreviews([...previews, ...newPreviews]);
        
        // Reset input value to allow selecting same file again if needed
        e.target.value = '';
    };

    const removeNewImage = (index: number) => {
        if (!form.images) return;
        
        // Remove from File array
        const updatedImages = [...form.images];
        updatedImages.splice(index, 1);
        setForm({ ...form, images: updatedImages });

        // Remove from Previews array
        const updatedPreviews = [...previews];
        URL.revokeObjectURL(updatedPreviews[index].url); // Cleanup memory
        updatedPreviews.splice(index, 1);
        setPreviews(updatedPreviews);
    };

    const removeExistingImage = (id: number) => {
        setForm({
            ...form,
            existingImages: (form.existingImages || []).filter((i) => i.id !== id),
        });
    };

    const validate = (): boolean => {
        const err: Record<string, string> = {};

        if (!form.name?.trim()) err.name = "Name is required";
        
        // SKU Unique Check
        if (!form.sku?.trim()) {
            err.sku = "SKU is required";
        } else {
            const skuLower = form.sku.trim().toLowerCase();
            const isDuplicate = allVariants.some((v, idx) => {
                if (currentEditIndex !== null && idx === currentEditIndex) return false;
                return v.sku.trim().toLowerCase() === skuLower;
            });
            if (isDuplicate) err.sku = "SKU must be unique";
        }

        if (Number(form.price) < 0) err.price = "Positive number required";
        if (Number(form.stock) < 0) err.stock = "Positive number required";

        // Attributes Check
        const selectedAttrs = Object.keys(form.attributes || {}).filter(k => form.attributes[Number(k)]);
        if (selectedAttrs.length === 0) {
            err.attributes = "Select at least one attribute";
        } else {
            // Duplicate Combination Check
            const getCombo = (attrs: Record<any, any>) => 
                Object.values(attrs).map(Number).filter(n => !isNaN(n)).sort((a,b) => a-b).join("-");
            
            const currentCombo = getCombo(form.attributes);
            const isDuplicateCombo = allVariants.some((v, idx) => {
                if (currentEditIndex !== null && idx === currentEditIndex) return false;
                return getCombo(v.attributes) === currentCombo;
            });

            if (isDuplicateCombo) err.attributes = "Combination already exists";
        }

        setErrors(err);
        return Object.keys(err).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            onSave(form);
        }
    };

    return (
        <div className="fixed inset-0 z-50">
            <div onClick={onClose} className="absolute inset-0 bg-black/40 transition-opacity" />
            <div className="absolute right-0 top-0 h-full w-full md:w-[540px] bg-white dark:bg-gray-900 shadow-xl flex flex-col">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 overflow-auto flex-1 space-y-5">
                    {errors.attributes && (
                        <div className="p-3 bg-red-100 text-red-700 rounded text-sm mb-2">{errors.attributes}</div>
                    )}

                    <div>
                        <Label>Name</Label>
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>SKU</Label>
                            <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                            {errors.sku && <p className="text-xs text-red-500 mt-1">{errors.sku}</p>}
                        </div>
                        <div>
                            <Label>Price</Label>
                            <Input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                            {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
                        </div>
                    </div>

                    <div>
                        <Label>Stock</Label>
                        <Input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
                        {errors.stock && <p className="text-xs text-red-500 mt-1">{errors.stock}</p>}
                    </div>

                    {/* Attributes */}
                    <div className="border p-3 rounded space-y-3 bg-gray-50/50">
                        <h4 className="font-medium text-sm">Attributes</h4>
                        {attributes.map((attr) => (
                            <div key={attr.id} className="grid grid-cols-3 items-center gap-2">
                                <span className="text-sm text-gray-600">{attr.name}</span>
                                <select
                                    className="col-span-2 border rounded p-1.5 text-sm bg-background"
                                    value={form.attributes[attr.id] || ""}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        const newAttrs = { ...form.attributes };
                                        if (val) newAttrs[attr.id] = val;
                                        else delete newAttrs[attr.id];
                                        setForm({ ...form, attributes: newAttrs });
                                    }}
                                >
                                    <option value="">Select...</option>
                                    {attr.values.map((v) => (
                                        <option key={v.id} value={v.id}>{v.value}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>

                    {/* Variant Images */}
                    <div>
                        <Label>Variant Media</Label>
                        <Input 
                            type="file" 
                            multiple 
                            accept="image/png, image/jpeg, image/jpg, image/webp, video/mp4, video/quicktime, video/webm"
                            onChange={handleImageChange} 
                            className="mt-1" 
                        />
                        <p className="text-xs text-gray-500 mt-1 mb-2">Allowed: Images (JPG, PNG, WEBP) & Video (MP4, MOV)</p>
                        
                        <div className="flex gap-2 flex-wrap">
                            {/* Existing Images */}
                            {form.existingImages?.map((img) => (
                                <MediaPreview 
                                    key={img.id}
                                    url={img.url}
                                    onRemove={() => removeExistingImage(img.id)}
                                />
                            ))}

                            {/* New Previews */}
                            {previews.map((file, i) => (
                                <MediaPreview 
                                    key={i}
                                    url={file.url}
                                    type={file.type}
                                    onRemove={() => removeNewImage(i)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 dark:bg-gray-800 flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit}>Save Variant</Button>
                </div>
            </div>
        </div>
    );
}