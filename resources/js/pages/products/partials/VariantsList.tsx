import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { VariantFront, Attribute } from "../types.ts";

interface Props {
    variants: VariantFront[];
    attributes: Attribute[];
    onAdd: () => void;
    onEdit: (index: number) => void;
    onDelete: (index: number) => void;
}

export default function VariantsList({ variants, attributes, onAdd, onEdit, onDelete }: Props) {
    
    const findAttrName = (id: number) => attributes.find(a => a.id === id)?.name || id;
    const findAttrValue = (aid: number, vid: number) => 
        attributes.find(a => a.id === aid)?.values.find(v => v.id === vid)?.value || vid;

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Variants ({variants.length})</h3>
                <Button type="button" onClick={onAdd}>
                    <Plus className="w-4 h-4 mr-1" /> Add Variant
                </Button>
            </div>

            {variants.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border rounded border-dashed">
                    No variants added yet. Click "Add Variant" to create one.
                </div>
            ) : (
                <div className="overflow-auto border rounded">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                            <tr>
                                <th className="p-3">#</th>
                                <th className="p-3">Name</th>
                                <th className="p-3">SKU</th>
                                <th className="p-3">Price</th>
                                <th className="p-3">Stock</th>
                                <th className="p-3">Attributes</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {variants.map((v, idx) => (
                                <tr key={v._tmpId || v.id || idx} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="p-3">{idx + 1}</td>
                                    <td className="p-3 font-medium">{v.name}</td>
                                    <td className="p-3 font-mono text-xs">{v.sku}</td>
                                    <td className="p-3">Rp. {Number(v.price).toLocaleString()}</td>
                                    <td className="p-3">{v.stock}</td>
                                    <td className="p-3">
                                        <div className="flex flex-wrap gap-1">
                                            {Object.entries(v.attributes).map(([aid, vid]) => (
                                                <span key={aid} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                                    {findAttrName(Number(aid))}: {findAttrValue(Number(aid), Number(vid))}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => onEdit(idx)} className="text-blue-600 hover:text-blue-800">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button type="button" onClick={() => onDelete(idx)} className="text-red-600 hover:text-red-800">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}