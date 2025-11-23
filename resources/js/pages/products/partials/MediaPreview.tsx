import React from "react";
import { X } from "lucide-react";

interface Props {
    url: string; // The blob URL or remote URL
    type?: string; // Optional: "video/mp4" etc. (useful for new uploads)
    onRemove?: () => void;
}

export default function MediaPreview({ url, type, onRemove }: Props) {
    // Helper to detect video by extension (for existing files) or MIME type (for new files)
    const isVideo = () => {
        if (type) return type.startsWith("video/");
        const extension = url.split(".").pop()?.toLowerCase();
        return ["mp4", "webm", "ogg", "mov", "avi"].includes(extension || "");
    };

    return (
        <div className="relative rounded overflow-hidden border bg-gray-100 dark:bg-gray-800 h-32 group">
            {isVideo() ? (
                <video
                    src={url}
                    controls
                    className="w-full h-full object-contain"
                />
            ) : (
                <img
                    src={url}
                    alt="Media"
                    className="object-cover w-full h-full"
                />
            )}

            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 z-10"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}