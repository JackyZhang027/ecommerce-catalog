import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MediaPreview from "./MediaPreview"; // Import the helper

interface Props {
    existingImages: { id: number; url: string }[];
    imagePreviews: { url: string; type: string }[]; // Changed to object to store type
    onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemovePreview: (index: number) => void;
    onDeleteExisting: (id: number) => void;
}

export default function ImagesTab({
    existingImages,
    imagePreviews,
    onImageChange,
    onRemovePreview,
    onDeleteExisting,
}: Props) {
    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="product-images">Upload Media (Images & Video)</Label>
                <Input
                    id="product-images"
                    type="file"
                    multiple
                    accept="image/png, image/jpeg, image/jpg, image/webp, video/mp4, video/quicktime, video/webm"
                    onChange={onImageChange}
                />
                <p className="text-xs text-gray-500 mt-1">
                    Allowed: PNG, JPG, WEBP, MP4, MOV, WEBM
                </p>
            </div>

            {/* Existing Media */}
            {existingImages.length > 0 && (
                <div>
                    <h4 className="font-medium mb-2">Existing Media</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {existingImages.map((img) => (
                            <MediaPreview
                                key={img.id}
                                url={img.url}
                                onRemove={() => onDeleteExisting(img.id)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* New Uploads */}
            {imagePreviews.length > 0 && (
                <div>
                    <h4 className="font-medium mb-2">New Uploads</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {imagePreviews.map((file, i) => (
                            <MediaPreview
                                key={i}
                                url={file.url}
                                type={file.type}
                                onRemove={() => onRemovePreview(i)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}