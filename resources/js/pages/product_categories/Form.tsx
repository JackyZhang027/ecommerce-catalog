import React, { useState, useEffect } from "react";
import { useForm, router, Head } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";

export default function ProductCategoryForm({ category, categories }) {
    const isEdit = !!category;

    const [existingImages, setExistingImages] = useState(category?.media || []);
    const [previewUrl, setPreviewUrl] = useState("");

    // -------------------------------
    // Inertia useForm (AUTO-HANDLES ERRORS)
    // -------------------------------
    const form = useForm({
        name: category?.name || "",
        description: category?.description || "",
        parent_id: category?.parent_id ?? null,
        is_active: category?.is_active ?? true,
        meta_title: category?.meta_title || "",
        meta_description: category?.meta_description || "",
        meta_keywords: category?.meta_keywords || "",
        image: null as File | null,
    });

    // Sync when switching category (edit)
    useEffect(() => {
        form.setData({
            name: category?.name || "",
            description: category?.description || "",
            parent_id: category?.parent_id ?? null,
            is_active: category?.is_active ?? true,
            meta_title: category?.meta_title || "",
            meta_description: category?.meta_description || "",
            meta_keywords: category?.meta_keywords || "",
            image: null,
        });

        setExistingImages(category?.media || []);
        setPreviewUrl("");
    }, [category]);

    // -------------------------------
    // Image Preview
    // -------------------------------
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert("Image must be under 2MB");
            return;
        }

        form.setData("image", file);

        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const removePreview = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl("");
        form.setData("image", null);
    };

    // -------------------------------
    // Delete existing image
    // -------------------------------
    const handleDeleteExistingImage = (mediaId: number) => {
        if (!confirm("Delete this image?")) return;

        router.delete(`/admin/categories/${category.id}/media/${mediaId}`, {
            preserveScroll: true,
            onSuccess: () => {
                setExistingImages((prev) => prev.filter((m) => m.id !== mediaId));
            },
        });
    };

    // -------------------------------
    // Submit Form using useForm (AUTO ERROR HANDLING)
    // -------------------------------
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const url = isEdit
            ? route("categories.update", category.id)
            : route("categories.store");

        form.post(url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setPreviewUrl("");
                form.reset("image");
            },
        });
    };

    return (
        <AppLayout>
            <Head title={isEdit ? "Edit Category" : "Create Category"} />

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="p-4 md:p-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold">
                                <div className="flex justify-between items-center">
                                    <div>{isEdit ? "Edit Category" : "Create New Category"}</div>
                                    <div className="flex gap-3">
                                        <a href="/admin/categories">
                                            <Button type="button" variant="secondary">
                                                Back
                                            </Button>
                                        </a>
                                        <Button type="submit" disabled={form.processing}>
                                            {form.processing
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
                            <Tabs defaultValue="general">
                                <TabsList>
                                    <TabsTrigger value="general">General</TabsTrigger>
                                    <TabsTrigger value="meta">Meta</TabsTrigger>
                                </TabsList>

                                {/* GENERAL */}
                                <TabsContent value="general" className="mt-5 space-y-4">
                                    {/* Name */}
                                    <div>
                                        <Label>Category Name</Label>
                                        <Input
                                            value={form.data.name}
                                            onChange={(e) =>
                                                form.setData("name", e.target.value)
                                            }
                                        />
                                        {form.errors.name && (
                                            <p className="text-sm text-red-500">
                                                {form.errors.name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Parent */}
                                    <div>
                                        <Label>Parent Category</Label>
                                        <select
                                            value={form.data.parent_id ?? ""}
                                            onChange={(e) =>
                                                form.setData(
                                                    "parent_id",
                                                    e.target.value
                                                        ? Number(e.target.value)
                                                        : null
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

                                        {form.errors.parent_id && (
                                            <p className="text-sm text-red-500">
                                                {form.errors.parent_id}
                                            </p>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <Label>Description</Label>
                                        <Textarea
                                            value={form.data.description || ""}
                                            onChange={(e) =>
                                                form.setData(
                                                    "description",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    {/* Image */}
                                    <div>
                                        <Label>Upload Image</Label>
                                        <Input type="file" onChange={handleFileChange} />

                                        {form.errors.image && (
                                            <p className="text-sm text-red-500">
                                                {Array.isArray(form.errors.image)
                                                    ? form.errors.image[0]
                                                    : form.errors.image}
                                            </p>
                                        )}

                                        {/* New preview */}
                                        {previewUrl && (
                                            <div className="mt-3 relative w-28 h-28 border rounded-md overflow-hidden">
                                                <img
                                                    src={previewUrl}
                                                    className="object-cover w-full h-full"
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

                                        {/* Existing image */}
                                        {isEdit &&
                                            existingImages.length > 0 &&
                                            !previewUrl && (
                                                <div className="mt-3">
                                                    <Label>Existing Image</Label>
                                                    <div className="mt-2 relative w-28 h-28 border rounded-md overflow-hidden">
                                                        <img
                                                            src={
                                                                existingImages[0]
                                                                    .original_url
                                                            }
                                                            className="object-cover w-full h-full"
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

                                {/* META */}
                                <TabsContent value="meta" className="mt-5 space-y-4">
                                    <div>
                                        <Label>Meta Title</Label>
                                        <Input
                                            value={form.data.meta_title || ""}
                                            onChange={(e) =>
                                                form.setData(
                                                    "meta_title",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div>
                                        <Label>Meta Description</Label>
                                        <Textarea
                                            value={form.data.meta_description || ""}
                                            onChange={(e) =>
                                                form.setData(
                                                    "meta_description",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div>
                                        <Label>Meta Keywords</Label>
                                        <Input
                                            value={form.data.meta_keywords || ""}
                                            onChange={(e) =>
                                                form.setData(
                                                    "meta_keywords",
                                                    e.target.value
                                                )
                                            }
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
