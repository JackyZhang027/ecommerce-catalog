import React, { useState, useEffect } from "react";
import { router, useForm, Head } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";
import { BreadcrumbItem } from "@/types";

interface MediaItem {
    id: number;
    original_url: string;
}

interface Category {
    id: number;
    name: string;
}

interface ProductCategory {
    id?: number;
    name: string;
    slug?: string;
    description?: string;
    parent_id?: number | null;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    is_active?: boolean;
    media?: MediaItem[];
}

interface Props {
    category?: ProductCategory;
    categories: Category[];
}

export default function ProductCategoryForm({ category, categories }: Props) {
    const isEdit = !!category;
    const [existingImages, setExistingImages] = useState<MediaItem[]>(category?.media || []);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data, setData, errors, reset } = useForm({
        name: category?.name || "",
        description: category?.description || "",
        parent_id: category?.parent_id ?? "",
        is_active: category?.is_active ?? true,
        meta_title: category?.meta_title || "",
        meta_description: category?.meta_description || "",
        meta_keywords: category?.meta_keywords || "",
        image: null as File | null,
    });

    // Sync form data on prop change (e.g., when editing)
    useEffect(() => {
        setData({
            name: category?.name || "",
            description: category?.description || "",
            parent_id: category?.parent_id ?? "",
            is_active: category?.is_active ?? true,
            meta_title: category?.meta_title || "",
            meta_description: category?.meta_description || "",
            meta_keywords: category?.meta_keywords || "",
            image: null,
        });
        setExistingImages(category?.media || []);
    }, [category]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) return alert("Image must be under 2MB");

        setData("image", file);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const removePreview = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl("");
        setData("image", null);
    };

    const handleDeleteExistingImage = (mediaId: number) => {
        if (!confirm("Delete this image?")) return;

        router.delete(`/admin/categories/${category?.id}/media/${mediaId}`, {
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

        const formData = new FormData();
        formData.append("name", data.name ?? "");
        formData.append("description", data.description ?? "");
        formData.append("parent_id", String(data.parent_id ?? ""));
        formData.append("is_active", data.is_active ? "1" : "0");
        formData.append("meta_title", data.meta_title ?? "");
        formData.append("meta_description", data.meta_description ?? "");
        formData.append("meta_keywords", data.meta_keywords ?? "");
        if (data.image) formData.append("image", data.image);
        if (isEdit) formData.append("_method", "PUT");

        const targetUrl = isEdit
            ? route("categories.update", category?.id)
            : route("categories.store");

        setIsSubmitting(true);

        router.post(targetUrl, formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewUrl("");
                reset("image");
                setIsSubmitting(false);
            },
            onError: () => setIsSubmitting(false),
            onFinish: () => setIsSubmitting(false),
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Product Categories", href: "/admin/categories" },
        { title: isEdit ? "Edit Category" : "Create Category", href: "#" },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? "Edit Category" : "Create Category"} />

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex-1 p-4 md:p-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold">
                                <div className="flex justify-between items-center">
                                    <div>{isEdit ? "Edit Category" : "Create New Category"}</div>
                                    <div className="flex justify-end gap-3">
                                        <a href="/admin/categories">
                                            <Button type="button" variant="secondary">
                                                Back
                                            </Button>
                                        </a>
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting
                                                ? "Saving..."
                                                : isEdit
                                                ? "Save Changes"
                                                : "Create Category"}
                                        </Button>
                                    </div>
                                </div>
                            </CardTitle>
                        </CardHeader>

                        <Separator />

                        <CardContent className="pt-5">
                            <Tabs defaultValue="general" className="w-full">
                                <TabsList>
                                    <TabsTrigger value="general">General Information</TabsTrigger>
                                    <TabsTrigger value="meta">Meta Information</TabsTrigger>
                                </TabsList>

                                {/* General Information Tab */}
                                <TabsContent value="general" className="mt-5 space-y-4">
                                    <div>
                                        <Label htmlFor="name">Category Name</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData("name", e.target.value)}
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-red-500">{errors.name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="parent_id">Parent Category</Label>
                                        <select
                                            id="parent_id"
                                            value={String(data.parent_id ?? "")}
                                            onChange={(e) =>
                                                setData(
                                                    "parent_id",
                                                    e.target.value ? Number(e.target.value) : ""
                                                )
                                            }
                                            className="block w-full border rounded px-2 py-1"
                                        >
                                            <option value="">None</option>
                                            {categories.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.parent_id && (
                                            <p className="text-sm text-red-500">{errors.parent_id}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={data.description || ""}
                                            onChange={(e) => setData("description", e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="image" className="mb-2 block font-medium">
                                            Upload Image
                                        </Label>
                                        <Input id="image" type="file" onChange={handleFileChange} />
                                        {errors.image && (
                                            <p className="text-sm text-red-500">
                                                {errors.image as any}
                                            </p>
                                        )}

                                        {/* New preview */}
                                        {previewUrl && (
                                            <div className="mt-3 relative w-28 h-28 border rounded-md overflow-hidden">
                                                <img
                                                    src={previewUrl}
                                                    className="object-cover w-full h-full"
                                                    alt="preview"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={removePreview}
                                                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}

                                        {/* Existing image (edit mode) */}
                                        {isEdit && existingImages.length > 0 && !previewUrl && (
                                            <div className="mt-3">
                                                <Label>Existing Image</Label>
                                                <div className="mt-2 relative w-28 h-28 border rounded-md overflow-hidden">
                                                    <img
                                                        src={existingImages[0].original_url}
                                                        className="object-cover w-full h-full"
                                                        alt="existing"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDeleteExistingImage(
                                                                existingImages[0].id
                                                            )
                                                        }
                                                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                {/* Meta Information Tab */}
                                <TabsContent value="meta" className="mt-5 space-y-4">
                                    <div>
                                        <Label htmlFor="meta_title">Meta Title</Label>
                                        <Input
                                            id="meta_title"
                                            value={data.meta_title || ""}
                                            onChange={(e) => setData("meta_title", e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="meta_description">Meta Description</Label>
                                        <Textarea
                                            id="meta_description"
                                            value={data.meta_description || ""}
                                            onChange={(e) =>
                                                setData("meta_description", e.target.value)
                                            }
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="meta_keywords">Meta Keywords</Label>
                                        <Input
                                            id="meta_keywords"
                                            value={data.meta_keywords || ""}
                                            onChange={(e) =>
                                                setData("meta_keywords", e.target.value)
                                            }
                                            placeholder="e.g. electronics, phone, laptop"
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </AppLayout>
    );
}
