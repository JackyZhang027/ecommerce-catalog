import React, { useState, useEffect } from "react";
import { router, useForm, Head } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";
import { BreadcrumbItem } from "@/types";

interface MediaItem {
    id: number;
    original_url: string;
}

interface Banner {
    id?: number;
    title?: string;
    subtitle?: string;
    button_text?: string;
    button_link?: string;
    order?: number;
    is_active?: boolean;
    media?: MediaItem[];
}

interface Props {
    banner?: Banner;
}

export default function BannersForm({ banner }: Props) {
    const isEdit = !!banner;
    const [existingImages, setExistingImages] = useState<MediaItem[]>(banner?.media || []);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data, setData, errors, reset } = useForm({
        title: banner?.title || "",
        subtitle: banner?.subtitle || "",
        button_text: banner?.button_text || "",
        button_link: banner?.button_link || "",
        order: banner?.order || 0,
        is_active: banner?.is_active ?? true,
        image: null as File | null,
    });

    useEffect(() => {
        setData({
            title: banner?.title || "",
            subtitle: banner?.subtitle || "",
            button_text: banner?.button_text || "",
            button_link: banner?.button_link || "",
            order: banner?.order || 0,
            is_active: banner?.is_active ?? true,
            image: null,
        });
        setExistingImages(banner?.media || []);
    }, [banner]);

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

        router.delete(`/admin/banners/${banner?.id}/media/${mediaId}`, {
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
        formData.append("title", data.title ?? "");
        formData.append("subtitle", data.subtitle ?? "");
        formData.append("button_text", data.button_text ?? "");
        formData.append("button_link", data.button_link ?? "");
        formData.append("order", String(data.order ?? 0));
        formData.append("is_active", data.is_active ? "1" : "0");
        if (data.image) formData.append("image", data.image);
        if (isEdit) formData.append("_method", "PUT");

        const targetUrl = isEdit
            ? route("banners.update", banner?.id)
            : route("banners.store");

        setIsSubmitting(true);

        router.post(targetUrl, formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewUrl("");
                reset("image");
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Banners", href: "/admin/banners" },
        { title: isEdit ? "Edit Banner" : "Create Banner", href: "#" },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? "Edit Banner" : "Create Banner"} />

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex-1 p-4 md:p-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold flex justify-between items-center">
                                <div>{isEdit ? "Edit Banner" : "Create New Banner"}</div>
                                <div className="flex gap-3">
                                    <Button asChild variant="secondary">
                                        <a href="/admin/banners">Back</a>
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting
                                            ? "Saving..."
                                            : isEdit
                                            ? "Save Changes"
                                            : "Create Banner"}
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>

                        <Separator />

                        <CardContent className="pt-5">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        value={data.title}
                                        onChange={(e) => setData("title", e.target.value)}
                                    />
                                    {errors.title && (
                                        <p className="text-sm text-red-500">{errors.title}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="subtitle">Subtitle</Label>
                                    <Input
                                        id="subtitle"
                                        value={data.subtitle}
                                        onChange={(e) => setData("subtitle", e.target.value)}
                                    />
                                    {errors.subtitle && (
                                        <p className="text-sm text-red-500">{errors.subtitle}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="button_text">Button Text</Label>
                                    <Input
                                        id="button_text"
                                        value={data.button_text}
                                        onChange={(e) => setData("button_text", e.target.value)}
                                    />
                                    {errors.button_text && (
                                        <p className="text-sm text-red-500">{errors.button_text}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="button_link">Button Link</Label>
                                    <Input
                                        id="button_link"
                                        value={data.button_link}
                                        onChange={(e) => setData("button_link", e.target.value)}
                                    />
                                    {errors.button_link && (
                                        <p className="text-sm text-red-500">{errors.button_link}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="order">Order</Label>
                                    <Input
                                        id="order"
                                        type="number"
                                        value={data.order}
                                        onChange={(e) => setData("order", Number(e.target.value))}
                                    />
                                    {errors.order && (
                                        <p className="text-sm text-red-500">{errors.order}</p>
                                    )}
                                </div>
                            </div>

                            {/* Image Upload Section */}
                            <div className="mt-6">
                                <Label htmlFor="image" className="mb-2 block font-medium">
                                    Upload Image
                                </Label>
                                <Input id="image" type="file" onChange={handleFileChange} />
                                {errors.image && (
                                    <p className="text-sm text-red-500">{errors.image as any}</p>
                                )}

                                {/* Preview New Image */}
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

                                {/* Existing Image */}
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
                                                    handleDeleteExistingImage(existingImages[0].id)
                                                }
                                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </AppLayout>
    );
}
