// resources/js/Pages/products/Form.tsx
import React, { useEffect, useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Imports from Partial Files
import { ProductFront, Category, Attribute, VariantFront } from "./types";
import GeneralTab from "./partials/GeneralTab";
import ImagesTab from "./partials/ImagesTab";
import VariantsList from "./partials/VariantsList";
import VariantDrawer from "./partials/VariantDrawer";

interface Props {
    product?: ProductFront;
    categories: Category[];
    attributes: Attribute[];
}

// Helper: Moved outside to be stable for useEffect
const mapVariants = (variants: any[]): VariantFront[] => {
    return variants.map((v) => {
        const attributesMap: Record<number, number> = {};
        if (Array.isArray(v.values)) {
            v.values.forEach((val: any) => {
                attributesMap[Number(val.attribute_id)] = Number(val.attribute_value_id);
            });
        } else if (v.attributes) {
            Object.entries(v.attributes).forEach(([key, val]) => {
                attributesMap[Number(key)] = Number(val);
            });
        }
        
        return {
            id: v.id ?? null,
            name: v.name ?? "",
            sku: v.sku ?? "",
            price: v.price ?? 0,
            stock: v.stock ?? 0,
            attributes: attributesMap,
            images: [],
            existingImages: Array.isArray(v.images) ? v.images : (v.existingImages || []),
            _tmpId: v._tmpId || String(Math.random()).slice(2),
        };
    });
};

export default function ProductForm({ product, categories, attributes }: Props) {
    const isEdit = !!product;

    // --- Main Form State ---
    const { data, setData, post, errors, clearErrors, processing, progress } = useForm({
        name: product?.name || "",
        description: product?.description || "",
        price: product?.price ?? 0,
        stock: product?.stock ?? 0,
        category_id: product?.category_id ?? "",
        has_variant: product?.has_variant ?? false,
        variants: mapVariants(product?.variants || []),
        images: [] as File[],
    });

    // --- Local State ---
    const [existingImages, setExistingImages] = useState(product?.images || []);
    // CHANGED: Previews now store type to distinguish video/image
    const [imagePreviews, setImagePreviews] = useState<{ url: string; type: string }[]>([]);
    
    // Variant Drawer State
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [drawerData, setDrawerData] = useState<VariantFront | null>(null);

    // --- Sync State with Server Data on Update ---
    useEffect(() => {
        if (!product) return;

        setExistingImages(product.images || []);

        // Reset previews safely
        setImagePreviews(prev => {
            prev.forEach(u => URL.revokeObjectURL(u.url));
            return [];
        });

        // Reset form fields based on the new product
        setData({
            name: product.name || "",
            description: product.description || "",
            price: product.price ?? 0,
            stock: product.stock ?? 0,
            category_id: product.category_id ?? "",
            has_variant: !!product.has_variant,
            variants: mapVariants(product.variants || []),
            images: [],
        });

    }, [product?.id]);


    // --- Image Handlers ---
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files);
        setData("images", files);
        
        // Cleanup old previews
        imagePreviews.forEach((u) => URL.revokeObjectURL(u.url));
        
        // Set new previews with MIME types
        setImagePreviews(files.map((f) => ({
            url: URL.createObjectURL(f),
            type: f.type
        })));
    };

    const removePreview = (index: number) => {
        const files = [...(data.images || [])];
        files.splice(index, 1);
        setData("images", files);

        const newPreviews = [...imagePreviews];
        if (newPreviews[index]) URL.revokeObjectURL(newPreviews[index].url);
        newPreviews.splice(index, 1);
        setImagePreviews(newPreviews);
    };

    const deleteExistingImage = (mediaId: number) => {
        if (!product?.id || !confirm("Delete this media?")) return;
        router.delete(route("products.media.delete", { product: product.id, media: mediaId }), {
            preserveScroll: true,
            onSuccess: () => setExistingImages((prev) => prev.filter((i) => i.id !== mediaId)),
        });
    };

    // --- Variant Logic ---
    const openAddVariant = () => {
        setEditingIndex(null);
        setDrawerData({
            name: "", sku: "", price: 0, stock: 0, attributes: {},
            images: [], existingImages: [],
            _tmpId: String(Math.random()).slice(2),
        });
        setDrawerOpen(true);
    };

    const openEditVariant = (index: number) => {
        setEditingIndex(index);
        setDrawerData({ ...data.variants[index] });
        setDrawerOpen(true);
    };

    const saveVariant = (variant: VariantFront) => {
        const newVariants = [...data.variants];
        if (editingIndex !== null) {
            newVariants[editingIndex] = variant;
        } else {
            newVariants.push(variant);
        }
        setData("variants", newVariants);
        setDrawerOpen(false);
    };

    const deleteVariant = (index: number) => {
        if (confirm("Remove this variant?")) {
            setData("variants", data.variants.filter((_, i) => i !== index));
        }
    };

    // --- Submission Helper ---
    function buildFormData(formData: FormData, obj: any, parentKey?: string) {
        if (obj === null || obj === undefined) return;
        if (obj instanceof File) {
            formData.append(parentKey!, obj, obj.name);
            return;
        }
        if (Array.isArray(obj)) {
            obj.forEach((value, index) => buildFormData(formData, value, `${parentKey}[${index}]`));
            return;
        }
        if (typeof obj === "object") {
            Object.keys(obj).forEach((k) => {
                const key = parentKey ? `${parentKey}[${k}]` : k;
                buildFormData(formData, obj[k], key);
            });
            return;
        }
        formData.append(parentKey!, String(obj));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const payload: any = { ...data };
        payload.variants = (data.variants || []).map((v: VariantFront) => ({
            ...v,
            attributes: v.attributes 
        }));

        const formData = new FormData();
        buildFormData(formData, payload);

        const url = isEdit ? route("products.update", product.id) : route("products.store");
        
        post(url, {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    // Cleanup Previews on Unmount
    useEffect(() => () => imagePreviews.forEach((u) => URL.revokeObjectURL(u.url)), []);

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
                            <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Errors</AlertTitle>
                                <AlertDescription>
                                    Please check the form for errors.
                                    <ul className="list-disc pl-4 mt-2 text-sm">
                                        {Object.values(errors).map((e: any, i) => (
                                            <li key={i}>{e}</li>
                                        ))}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        )}

                        <Tabs defaultValue="general" className="mt-3">
                            <TabsList className={`mb-6 grid ${data.has_variant ? "grid-cols-3" : "grid-cols-2"} w-full`}>
                                <TabsTrigger value="general">General Info</TabsTrigger>
                                <TabsTrigger value="images">Images</TabsTrigger>
                                {data.has_variant && <TabsTrigger value="variants">Variants</TabsTrigger>}
                            </TabsList>

                            <TabsContent value="general">
                                <GeneralTab data={data} setData={setData} errors={errors} categories={categories} />
                            </TabsContent>

                            <TabsContent value="images">
                                <ImagesTab
                                    existingImages={existingImages}
                                    imagePreviews={imagePreviews}
                                    onImageChange={handleImageChange}
                                    onRemovePreview={removePreview}
                                    onDeleteExisting={deleteExistingImage}
                                />
                            </TabsContent>

                            {data.has_variant && (
                                <TabsContent value="variants">
                                    <VariantsList
                                        variants={data.variants}
                                        attributes={attributes}
                                        onAdd={openAddVariant}
                                        onEdit={openEditVariant}
                                        onDelete={deleteVariant}
                                    />
                                </TabsContent>
                            )}
                        </Tabs>
                        {/* Submit Section */}
                        <div className="mt-6 flex flex-col items-end gap-3">
                            
                            {/* Progress Bar - Only shows when uploading */}
                            {progress && (
                                <div className="w-full max-w-xs space-y-1">
                                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                        <span>Uploading files...</span>
                                        <span className="font-medium">{progress.percentage}%</span>
                                    </div>
                                    
                                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                                        <div 
                                            className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                            style={{ width: `${progress.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex justify-end">
                                <Button 
                                    type="submit" 
                                    disabled={processing} 
                                    className="min-w-[140px]"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {progress ? "Uploading..." : "Saving..."}
                                        </>
                                    ) : (
                                        isEdit ? "Update Product" : "Create Product"
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* ... end of <CardContent> ... */}
                    </CardContent>
                </Card>
            </form>

            <VariantDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                title={editingIndex !== null ? "Edit Variant" : "Add Variant"}
                variant={drawerData}
                attributes={attributes}
                allVariants={data.variants}
                currentEditIndex={editingIndex}
                onSave={saveVariant}
            />
        </AppLayout>
    );
}