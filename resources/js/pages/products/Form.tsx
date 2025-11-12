import React, { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import { useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import { BreadcrumbItem } from "@/types";
import { X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface MediaItem {
    id: number;
    original_url: string;
}

interface Category {
    id: number;
    name: string;
}

interface Product {
    id?: number;
    name: string;
    description?: string;
    price?: number;
    stock?: number;
    category_id?: number;
    media?: MediaItem[];
}

interface Props {
    product?: Product;
    categories: Category[];
}

export default function ProductForm({ product, categories }: Props) {
    const isEdit = !!product;
    const [existingImages, setExistingImages] = useState<MediaItem[]>(product?.media || []);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    // local submitting flag (reliable when using router.post)
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize form state with values (important for edit)
    const { data, setData, errors, reset } = useForm({
        name: product?.name || "",
        description: product?.description || "",
        price: product?.price ?? 0,
        stock: product?.stock ?? 0,
        category_id: product?.category_id ?? "",
        images: [] as File[], // will store Array<File>
    });

    // If product props change (unlikely), sync form values
    useEffect(() => {
        setData("name", product?.name || "");
        setData("description", product?.description || "");
        setData("price", product?.price ?? 0);
        setData("stock", product?.stock ?? 0);
        setData("category_id", product?.category_id ?? "");
        setExistingImages(product?.media || []);
    }, [product]);

    // File input change handler — convert FileList to Array<File> and create previews
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const fl = e.target.files;
        if (!fl) return;

        const files = Array.from(fl).filter((f) => f.size <= 2 * 1024 * 1024); // optional size limit
        if (files.length < fl.length) {
            alert("Some files were skipped because they exceed 2MB.");
        }

        setData("images", files);

        // create preview URLs and revoke previous ones
        setPreviewUrls((prev) => {
            prev.forEach((u) => URL.revokeObjectURL(u));
            return files.map((f) => URL.createObjectURL(f));
        });
    };

    // remove single preview (before upload)
    const removePreview = (index: number) => {
        const newFiles = (data.images || []).slice();
        newFiles.splice(index, 1);
        setData("images", newFiles);

        setPreviewUrls((prev) => {
            // revoke the removed url
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    // Delete existing image (already uploaded)
    const handleDeleteExistingImage = (mediaId: number) => {
        if (!confirm("Are you sure you want to delete this image?")) return;

        // uses Inertia via window.Inertia or router.delete; using router.delete triggers client navigation behavior
        router.delete(`/admin/products/${product?.id}/media/${mediaId}`, {
            preserveScroll: true,
            onSuccess: () => {
                setExistingImages((prev) => prev.filter((m) => m.id !== mediaId));
            },
            onError: (err) => {
                console.error("Delete image failed", err);
                alert("Failed to delete image.");
            },
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // build FormData explicitly (most robust for files + method spoof)
        const formData = new FormData();
        formData.append("name", data.name ?? "");
        formData.append("description", data.description ?? "");
        formData.append("price", String(data.price ?? 0));
        formData.append("stock", String(data.stock ?? 0));
        formData.append("category_id", String(data.category_id ?? ""));

        // append images array correctly
        if (data.images && (data.images as File[]).length > 0) {
            (data.images as File[]).forEach((file) => {
                formData.append("images[]", file);
            });
        }

        // If editing, append _method=PUT so Laravel treats POST as PUT (multipart + method spoofing)
        if (isEdit) {
            formData.append("_method", "PUT");
        }

        setIsSubmitting(true);

        // Use router.post for both create and update (with _method for update)
        const targetUrl = isEdit ? route("products.update", product?.id) : route("products.store");

        router.post(targetUrl, formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: (page) => {
                setIsSubmitting(false);
                reset("images"); // clear the image file list in form state
                setPreviewUrls((prev) => {
                    prev.forEach((u) => URL.revokeObjectURL(u));
                    return [];
                });

                // optional: after create you might navigate or clear form - adjust as needed
                console.log("Success", page);
            },
            onError: (err) => {
                setIsSubmitting(false);
                console.error("Submit errors:", err);
                // Inertia will populate server-side validation errors and they appear in `errors`
            },
            onFinish: () => {
                // always called after request finishes
                setIsSubmitting(false);
            },
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Products", href: "/admin/products" },
        { title: isEdit ? "Edit Product" : "Create Product", href: "#" },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? "Edit Product" : "Create Product"} />
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex-1 p-4 md:p-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold">
                                <div className="flex justify-between items-center">
                                    <div>{isEdit ? "Edit Product" : "Create New Product"}</div>
                                    <div className="flex justify-end gap-3">
                                        <a href="/admin/products">
                                            <Button type="button" variant="secondary">
                                                Back
                                            </Button>
                                        </a>
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Product"}
                                        </Button>
                                    </div>
                                </div>
                            </CardTitle>
                        </CardHeader>

                        <Separator />

                        <CardContent className="pt-5 space-y-4">
                            <div>
                                <Label htmlFor="name">Product Name</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData("name", e.target.value)} />
                                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" value={data.description || ""} onChange={(e) => setData("description", e.target.value)} />
                                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                            </div>

                            <div>
                                <Label htmlFor="price">Price</Label>
                                <Input id="price" type="number" value={data.price as any} onChange={(e) => setData("price", Number(e.target.value))} />
                                {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
                            </div>

                            <div>
                                <Label htmlFor="stock">Stock</Label>
                                <Input id="stock" type="number" value={data.stock as any} onChange={(e) => setData("stock", Number(e.target.value))} />
                                {errors.stock && <p className="text-sm text-red-500">{errors.stock}</p>}
                            </div>

                            <div>
                                <Label htmlFor="category_id">Category</Label>
                                <select
                                    value={String(data.category_id ?? "")}
                                    onChange={(e) => setData("category_id", Number(e.target.value))}
                                    className="block w-full border rounded px-2 py-1 bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                                    >
                                    <option value="">Select category</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id} className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                                        {c.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.category_id && <p className="text-sm text-red-500">{errors.category_id}</p>}
                            </div>

                            <div>
                                <Label htmlFor="images" className="mb-2 block font-medium">
                                    Upload Images
                                </Label>
                                <Input id="images" type="file" multiple onChange={handleFileChange} />
                                {errors.images && <p className="text-sm text-red-500">{errors.images as any}</p>}

                                {/* previews */}
                                {previewUrls.length > 0 && (
                                    <div className="flex gap-3 mt-3">
                                        {previewUrls.map((url, idx) => (
                                            <div key={idx} className="relative w-28 h-28 rounded-md overflow-hidden border">
                                                <img src={url} className="object-cover w-full h-full" alt={`preview-${idx}`} />
                                                <button type="button" onClick={() => removePreview(idx)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* existing images (edit) */}
                            {isEdit && existingImages.length > 0 && (
                                <div>
                                    <Label>Existing Images</Label>
                                    <div className="flex gap-3 mt-2">
                                        {existingImages.map((img) => (
                                            <div key={img.id} className="relative w-28 h-28 rounded-md overflow-hidden border">
                                                <img src={img.original_url} className="object-cover w-full h-full" alt="existing" />
                                                <button type="button" onClick={() => handleDeleteExistingImage(img.id)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </form>
        </AppLayout>
    );
}
