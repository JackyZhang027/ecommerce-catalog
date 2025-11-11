import { useState } from "react"
import { X } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default function ImageUploader({ errors, onFilesChange }) {
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    handleFiles(files)
  }

  const handleFiles = (files: File[]) => {
    if (files.length === 0) return

    const validFiles = files.filter((file) => file.type.startsWith("image/"))

    const previews = validFiles.map((file) => URL.createObjectURL(file))
    setPreviewImages((prev) => [...prev, ...previews])

    if (onFilesChange) onFilesChange(validFiles)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const removePreviewImage = (index: number) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div>
      <Label htmlFor="images" className="mb-2 block font-medium">
        Upload Images
      </Label>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-xl transition cursor-pointer
          ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50"}`}
      >
        <Input
          id="images"
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
        <Label htmlFor="images" className="text-center cursor-pointer">
          <p className="text-gray-600">
            Drag & drop or{" "}
            <span className="text-blue-600 font-semibold">browse</span> to upload
          </p>
          <p className="text-sm text-gray-400">Max size: 2 MB per image</p>
        </Label>
      </div>

      {errors?.images && <p className="text-sm text-red-500 mt-2">{errors.images}</p>}

      {previewImages.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-3">
          {previewImages.map((src, i) => (
            <div
              key={i}
              className="relative w-28 h-28 rounded-md overflow-hidden border border-gray-200 shadow-sm"
            >
              <img src={src} alt={`Preview ${i}`} className="object-cover w-full h-full" />
              <button
                type="button"
                onClick={() => removePreviewImage(i)}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
