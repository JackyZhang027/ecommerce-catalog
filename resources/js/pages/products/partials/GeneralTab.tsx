import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Category } from "../types.ts";

interface Props {
    data: any;
    setData: (key: string, value: any) => void;
    errors: any;
    categories: Category[];
}

export default function GeneralTab({ data, setData, errors, categories }: Props) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData("name", e.target.value)}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
                <Label htmlFor="category">Category</Label>
                <select
                    id="category"
                    value={data.category_id}
                    onChange={(e) => setData("category_id", Number(e.target.value))}
                    className="block w-full border rounded px-3 py-2 bg-background"
                >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
                {errors.category_id && (
                    <p className="text-sm text-red-500 mt-1">{errors.category_id}</p>
                )}
            </div>

            <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    rows={4}
                    value={data.description}
                    onChange={(e) => setData("description", e.target.value)}
                />
                {errors.description && (
                    <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                )}
            </div>

            <div>
                <Label htmlFor="price">Price *</Label>
                <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={data.price}
                    onChange={(e) => setData("price", parseFloat(e.target.value) || 0)}
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
                    value={data.has_variant ? 0 : data.stock}
                    onChange={(e) => setData("stock", parseInt(e.target.value) || 0)}
                    disabled
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
    );
}