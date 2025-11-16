// resources/js/Pages/products/Form.tsx
import React, { useEffect, useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { X, Edit, Plus } from "lucide-react";

/* ---------- Types ---------- */
interface Category { id: number; name: string; }
interface AttributeValue { id: number; value: string; }
interface Attribute { id: number; name: string; values: AttributeValue[]; }
interface VariantFront {
  id?: number | null;
  name: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Record<number, number>; // attribute_id => attribute_value_id
  images?: File[]; // newly selected files for this variant
  existingImages?: { id: number; url: string }[]; // server-provided variant images
  _tmpId?: string;
}
interface ProductFront {
  id?: number;
  name: string;
  description?: string;
  price?: number;
  stock?: number;
  category_id?: number | "";
  has_variant?: boolean;
  images?: { id: number; url: string }[]; // product images from server
  variants?: any[]; // raw variants from server
}
interface Props {
  product?: ProductFront;
  categories: Category[];
  attributes: Attribute[];
}

/* ---------- Drawer (simple) ---------- */
function Drawer({ open, onClose, title, children }: any) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
      <div onClick={onClose} className={`absolute inset-0 bg-black/40 ${open ? "opacity-100" : "opacity-0"}`} />
      <div className={`absolute right-0 top-0 h-full w-full md:w-[540px] bg-white dark:bg-gray-900 shadow-xl transform transition-transform ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X /></button>
        </div>
        <div className="p-4 overflow-auto h-[calc(100%-64px)]">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Component ---------- */
export default function ProductForm({ product, categories, attributes }: Props) {
  const isEdit = !!product;

  const { data, setData, processing, errors, reset } = useForm({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price ?? 0,
    stock: product?.stock ?? 0,
    category_id: product?.category_id ?? "",
    has_variant: product?.has_variant ?? false,
    variants: (product?.variants || []).map((v: any) => {
      // convert server's v.values[] -> attributes map { attribute_id: attribute_value_id }
      const attributesMap: Record<number, number> = {};
      if (Array.isArray(v.values)) {
        v.values.forEach((val: any) => {
          const aid = Number(val.attribute_id);
          const vid = Number(val.attribute_value_id);
          if (!Number.isNaN(aid) && !Number.isNaN(vid)) attributesMap[aid] = vid;
        });
      }

      // server variant images are in v.images (id + url). map to existingImages
      const existingImages = Array.isArray(v.images) ? v.images : [];

      return {
        id: v.id ?? null,
        name: v.name ?? "",
        sku: v.sku ?? "",
        price: v.price ?? 0,
        stock: v.stock ?? 0,
        attributes: attributesMap,
        images: [] as File[],
        existingImages: existingImages as { id: number; url: string }[],
        _tmpId: String(Math.random()).slice(2),
      } as VariantFront;
    }),
    images: [] as File[], // new product images uploads
  });

  // local UI state
  const [existingImages, setExistingImages] = useState<{ id: number; url: string }[]>(product?.images || []);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]); // product-level new uploads
  const [isSubmitting, setIsSubmitting] = useState(false);

  // variant drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [variantForm, setVariantForm] = useState<VariantFront | null>(null);
  const [variantErrors, setVariantErrors] = useState<Record<string, string>>({});

  // preview URLs for the variantForm.images (blob URLs)
  const [variantImagePreviews, setVariantImagePreviews] = useState<string[]>([]);

  /* ---------- Helpers ---------- */

  // helper to find AttributeValue label by id (for displaying in table)
  const findAttrName = (attributeId: number) => attributes.find(a => a.id === attributeId)?.name ?? String(attributeId);
  const findValueLabel = (attributeId: number, valueId: number) =>
    attributes.find(a => a.id === attributeId)?.values.find(v => v.id === valueId)?.value ?? String(valueId);

  // Build FormData recursively (keeps files)
  function buildFormData(formData: FormData, obj: any, parentKey?: string) {
    if (obj === null || obj === undefined) return;
    if (obj instanceof File) {
      formData.append(parentKey!, obj, obj.name);
      return;
    }
    if (Array.isArray(obj)) {
      obj.forEach((value, index) => {
        const key = `${parentKey}[${index}]`;
        buildFormData(formData, value, key);
      });
      return;
    }
    if (typeof obj === "object") {
      Object.keys(obj).forEach(k => {
        const value = obj[k];
        const key = parentKey ? `${parentKey}[${k}]` : k;
        buildFormData(formData, value, key);
      });
      return;
    }
    formData.append(parentKey!, String(obj));
  }

  /* ---------- Images (product-level) ---------- */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setData("images", files);
    // create previews
    const urls = files.map(f => URL.createObjectURL(f));
    // revoke old previews
    imagePreviews.forEach(u => URL.revokeObjectURL(u));
    setImagePreviews(urls);
  };

  const removePreview = (index: number) => {
    const files = [...(data.images || [])];
    const previews = [...imagePreviews];
    if (files[index]) files.splice(index, 1);
    if (previews[index]) {
      URL.revokeObjectURL(previews[index]);
      previews.splice(index, 1);
    }
    setData("images", files);
    setImagePreviews(previews);
  };

  const deleteExistingImage = (mediaId: number) => {
    if (!product?.id) return;
    if (!confirm("Delete this image?")) return;
    router.delete(route("products.media.delete", { product: product.id, media: mediaId }), {
      preserveScroll: true,
      onSuccess: () => setExistingImages(prev => prev.filter(i => i.id !== mediaId)),
      onError: () => alert("Failed to delete image"),
    });
  };

  /* ---------- Variant Drawer (client-side validation) ---------- */

  // open add
  const openAddVariant = () => {
    setEditingIndex(null);
    setVariantForm({
      id: null,
      name: "",
      sku: "",
      price: 0,
      stock: 0,
      attributes: {},
      images: [],
      existingImages: [],
      _tmpId: String(Math.random()).slice(2),
    });
    setVariantErrors({});
    // reset previews
    variantImagePreviews.forEach(u => URL.revokeObjectURL(u));
    setVariantImagePreviews([]);
    setDrawerOpen(true);
  };

  // open edit
  const openEditVariant = (index: number) => {
    const v = data.variants[index];
    const attributesMap: Record<number, number> = {};
    // Convert server v.values (if present) OR v.attributes (defensive)
    if (Array.isArray(v.values)) {
      v.values.forEach((val: any) => {
        const aid = Number(val.attribute_id);
        const vid = Number(val.attribute_value_id);
        if (!Number.isNaN(aid) && !Number.isNaN(vid)) attributesMap[aid] = vid;
      });
    } else if (v.attributes) {
      Object.entries(v.attributes).forEach(([k, val]: any) => {
        const id = Number(k);
        attributesMap[id] = Number(val);
      });
    }

    setEditingIndex(index);
    setVariantForm({
      id: v.id ?? null,
      name: v.name ?? "",
      sku: v.sku ?? "",
      price: v.price ?? 0,
      stock: v.stock ?? 0,
      attributes: attributesMap,
      images: [], // new files (empty)
      existingImages: v.existingImages ?? [],
      _tmpId: v._tmpId ?? String(Math.random()).slice(2),
    });
    setVariantErrors({});
    // reset variant previews
    variantImagePreviews.forEach(u => URL.revokeObjectURL(u));
    setVariantImagePreviews([]);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setVariantForm(null);
    setEditingIndex(null);
    setVariantErrors({});
    // cleanup blob urls for this drawer
    variantImagePreviews.forEach(u => URL.revokeObjectURL(u));
    setVariantImagePreviews([]);
  };

  const handleVariantImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !variantForm) return;
    const files = Array.from(e.target.files);
    // set files on variantForm
    setVariantForm({ ...variantForm, images: files });
    // create and set previews
    // revoke old first
    variantImagePreviews.forEach(u => URL.revokeObjectURL(u));
    const urls = files.map(f => URL.createObjectURL(f));
    setVariantImagePreviews(urls);
  };

  const removeVariantExistingImageLocal = (mediaId: number) => {
    if (!variantForm) return;
    setVariantForm({ ...variantForm, existingImages: (variantForm.existingImages || []).filter(m => m.id !== mediaId) });
  };

  // validate variant (client-side)
  const validateVariant = (v: VariantFront) => {
    const err: Record<string, string> = {};
    if (!v.name || v.name.trim() === "") err.name = "Name is required";
    if (!v.sku || v.sku.trim() === "") err.sku = "SKU is required";
    if (v.price === null || v.price === undefined || v.price === "") err.price = "Price is required";
    if (v.stock === null || v.stock === undefined || v.stock === "") err.stock = "Stock is required";
    // require each attribute to have a selected value
    for (const attr of attributes) {
      const val = v.attributes?.[attr.id];
      if (!val) { err.attributes = "Please choose a value for all attributes"; break; }
    }
    return err;
  };

  const saveVariantFromDrawer = () => {
    if (!variantForm) return;
    const err = validateVariant(variantForm);
    if (Object.keys(err).length > 0) {
      setVariantErrors(err);
      return;
    }

    // duplicate prevention on client: compute normalized key from attribute_value_ids
    const comb = Object.entries(variantForm.attributes).map(([k, v]) => Number(v)).sort((a, b) => a - b).join("-");
    const existingCombs = (data.variants || [])
      .map((vv: any, i: number) => {
        if (editingIndex !== null && i === editingIndex) return null;
        const arr = Object.values(vv.attributes || {}).map((x: any) => Number(x)).sort((a: number, b: number) => a - b);
        return arr.join("-");
      })
      .filter(Boolean);
    if (existingCombs.includes(comb)) {
      setVariantErrors({ attributes: "Duplicate variant combination" });
      return;
    }

    // commit to data.variants
    const newVariants = [...(data.variants || [])];
    const toSave: any = {
      id: variantForm.id ?? null,
      name: variantForm.name,
      sku: variantForm.sku,
      price: variantForm.price,
      stock: variantForm.stock,
      attributes: variantForm.attributes, // attribute_id => attribute_value_id
      images: variantForm.images || [], // new file uploads
      existingImages: variantForm.existingImages || [], // existing media objects {id, url}
      _tmpId: variantForm._tmpId || String(Math.random()).slice(2),
    };

    if (editingIndex === null) newVariants.push(toSave);
    else newVariants[editingIndex] = toSave;
    setData("variants", newVariants);
    closeDrawer();
  };

  const removeVariant = (index: number) => {
    if (!confirm("Remove this variant?")) return;
    setData("variants", (data.variants || []).filter((_: any, i: number) => i !== index));
  };

  /* ---------- Submit (convert attributes to values[] shape expected by backend) ---------- */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (data.has_variant && (!data.variants || data.variants.length < 1)) {
      alert("Please add at least one variant.");
      setIsSubmitting(false);
      return;
    }

    // prepare payload: convert each variant.attributes (map attrId->valueId) into variants[*].values[] = { attribute_id, attribute_value_id }
    const payload: any = { ...data };
    payload.variants = (data.variants || []).map((v: any) => {
      const valuesArr: any[] = [];
      if (v.attributes) {
        for (const [attrIdStr, valId] of Object.entries(v.attributes)) {
          const attrId = Number(attrIdStr);
          valuesArr.push({
            attribute_id: attrId,
            attribute_value_id: Number(valId),
          });
        }
      }
      return {
        id: v.id ?? null,
        name: v.name,
        sku: v.sku,
        price: v.price,
        stock: v.stock,
        values: valuesArr,
        // images: File[] (we keep images property so buildFormData will include files)
        images: v.images || [],
        existingImages: v.existingImages || [],
        _tmpId: v._tmpId,
      };
    });

    // build formData (files + fields)
    const formData = new FormData();
    buildFormData(formData, payload);
    console.log("Submitting payload:", payload);
    if (isEdit) {
      formData.append("_method", "PUT");
      router.post(route("products.update", { product: product!.id }), formData, {
        forceFormData: true,
        preserveScroll: true,
        onFinish: () => setIsSubmitting(false),
      });
      return;
    }

    router.post(route("products.store"), formData, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => reset(),
      onFinish: () => setIsSubmitting(false),
    });
  };

  // cleanup product-level previews on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach(u => URL.revokeObjectURL(u));
      variantImagePreviews.forEach(u => URL.revokeObjectURL(u));
    };
  }, [imagePreviews, variantImagePreviews]);

  /* ---------- Render ---------- */
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
          <CardHeader><CardTitle>{isEdit ? "Edit Product" : "Create Product"}</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue="general" className="mt-3">
              <TabsList className={`mb-6 grid ${data.has_variant ? "grid-cols-3" : "grid-cols-2"} w-full`}>
                <TabsTrigger value="general">General Info</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
                {data.has_variant && <TabsTrigger value="variants">Variants</TabsTrigger>}
              </TabsList>

              {/* General */}
              <TabsContent value="general">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Product Name</Label>
                    <Input value={data.name} onChange={e => setData("name", e.target.value)} />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>

                  <div>
                    <Label>Category</Label>
                    <select value={data.category_id as any} onChange={e => setData("category_id", Number(e.target.value))} className="block w-full border rounded px-2 py-1">
                      <option value="">Select category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {errors.category_id && <p className="text-sm text-red-500">{errors.category_id}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <Label>Description</Label>
                    <Textarea rows={4} value={data.description} onChange={e => setData("description", e.target.value)} />
                  </div>

                  <div>
                    <Label>Price</Label>
                    <Input type="number" step="0.01" value={data.price as any} onChange={e => setData("price", parseFloat(e.target.value))} />
                    {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
                  </div>

                  <div>
                    <Label>Stock</Label>
                    <Input type="number" step="1" value={data.has_variant ? 0 : data.stock as any} onChange={e => setData("stock", parseInt(e.target.value))} disabled={data.has_variant} />
                    {errors.stock && <p className="text-sm text-red-500">{errors.stock}</p>}
                  </div>

                  <div className="flex items-center gap-3 mt-4">
                    <Label>Has Variants?</Label>
                    <Switch checked={data.has_variant} onCheckedChange={(v) => { setData("has_variant", v); if (!v) setData("variants", []); }} />
                  </div>
                </div>
              </TabsContent>

              {/* Images */}
              <TabsContent value="images">
                <div className="space-y-4">
                  <div>
                    <Label>Upload Product Images</Label>
                    <Input type="file" multiple accept="image/*" onChange={handleImageChange} />
                  </div>

                  {existingImages.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Existing Images</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {existingImages.map(img => (
                          <div key={img.id} className="relative rounded overflow-hidden border">
                            <img src={img.url} className="object-cover w-full h-32" />
                            <button type="button" onClick={() => deleteExistingImage(img.id)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"><X className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {imagePreviews.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">New Uploads</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {imagePreviews.map((url, i) => (
                          <div key={i} className="relative rounded overflow-hidden border">
                            <img src={url} className="object-cover w-full h-32" />
                            <button type="button" onClick={() => removePreview(i)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"><X className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Variants */}
              {data.has_variant && (
                <TabsContent value="variants">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Variants</h3>
                    <Button type="button" onClick={openAddVariant}><Plus className="w-4 h-4 mr-1" />Add Variant</Button>
                  </div>

                  <div className="overflow-auto border rounded">
                    <table className="min-w-full text-left">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-2">#</th>
                          <th className="p-2">Name</th>
                          <th className="p-2">SKU</th>
                          <th className="p-2">Price</th>
                          <th className="p-2">Stock</th>
                          <th className="p-2">Attributes</th>
                          <th className="p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data.variants || []).map((v: any, idx: number) => (
                          <tr key={v._tmpId || v.id || idx} className="border-t">
                            <td className="p-2 align-top">{idx + 1}</td>
                            <td className="p-2 align-top">{v.name}</td>
                            <td className="p-2 align-top">{v.sku}</td>
                            <td className="p-2 align-top">{v.price}</td>
                            <td className="p-2 align-top">{v.stock}</td>
                            <td className="p-2 align-top">
                              <div className="flex flex-wrap gap-1">
                                {/* prefer server-provided v.values (array), but fallback to attributes map */}
                                {Array.isArray(v.values) && v.values.length > 0
                                  ? v.values.map((val: any) => (
                                      <span key={val.attribute_id} className="px-2 py-1 text-xs bg-gray-100 rounded">
                                        {val.attribute_name}: {val.attribute_value}
                                      </span>
                                    ))
                                  : Object.entries(v.attributes || {}).map(([aid, vid]: any) => (
                                      <span key={aid} className="px-2 py-1 text-xs bg-gray-100 rounded">
                                        {findAttrName(Number(aid))}: {findValueLabel(Number(aid), Number(vid))}
                                      </span>
                                    ))
                                }
                              </div>
                            </td>
                            <td className="p-2 align-top">
                              <div className="flex gap-2">
                                <button type="button" onClick={() => openEditVariant(idx)} className="p-1 rounded hover:bg-gray-100"><Edit /></button>
                                <button type="button" onClick={() => removeVariant(idx)} className="px-2 py-1 text-sm text-red-600">Remove</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              )}
            </Tabs>

            <Separator className="my-6" />
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || processing}>{isSubmitting ? "Saving..." : isEdit ? "Update Product" : "Create Product"}</Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Variant Drawer */}
      <Drawer open={drawerOpen} onClose={closeDrawer} title={editingIndex === null ? "Add Variant" : "Edit Variant"}>
        {!variantForm ? null : (
          <div className="space-y-4">
            <div>
              <Label>Variant Name</Label>
              <Input value={variantForm.name} onChange={e => setVariantForm({ ...variantForm, name: e.target.value })} />
              {variantErrors.name && <p className="text-sm text-red-500">{variantErrors.name}</p>}
            </div>

            <div>
              <Label>SKU</Label>
              <Input value={variantForm.sku} onChange={e => setVariantForm({ ...variantForm, sku: e.target.value })} />
              {variantErrors.sku && <p className="text-sm text-red-500">{variantErrors.sku}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Price</Label>
                <Input type="number" value={variantForm.price as any} onChange={e => setVariantForm({ ...variantForm, price: Number(e.target.value) })} />
                {variantErrors.price && <p className="text-sm text-red-500">{variantErrors.price}</p>}
              </div>
              <div>
                <Label>Stock</Label>
                <Input type="number" value={variantForm.stock as any} onChange={e => setVariantForm({ ...variantForm, stock: Number(e.target.value) })} />
                {variantErrors.stock && <p className="text-sm text-red-500">{variantErrors.stock}</p>}
              </div>
            </div>

            <div>
              <Label className="mb-2">Attributes</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {attributes.map(attr => (
                  <div key={attr.id}>
                    <Label className="text-sm">{attr.name}</Label>
                    <select className="w-full border rounded px-2 py-1" value={variantForm.attributes?.[attr.id] ?? ""} onChange={e => setVariantForm({
                      ...variantForm,
                      attributes: { ...(variantForm.attributes || {}), [attr.id]: Number(e.target.value) }
                    })}>
                      <option value="">Select {attr.name}</option>
                      {attr.values.map(v => <option key={v.id} value={v.id}>{v.value}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              {variantErrors.attributes && <p className="text-sm text-red-500">{variantErrors.attributes}</p>}
            </div>

            <div>
              <Label>Variant Images</Label>
              <Input type="file" multiple accept="image/*" onChange={handleVariantImageChange} />
              <div className="flex gap-2 mt-2 flex-wrap">
                {/* previews for newly selected files */}
                {variantImagePreviews.map((url, i) => (
                  <div key={`preview-${i}`} className="relative">
                    <img src={url} className="h-20 w-20 object-cover rounded" />
                    {/* remove preview-only file */}
                    <button onClick={() => {
                      if (!variantForm) return;
                      const files = [...(variantForm.images || [])];
                      files.splice(i, 1);
                      // cleanup preview url
                      URL.revokeObjectURL(variantImagePreviews[i]);
                      const newPreviews = variantImagePreviews.filter((_, idx) => idx !== i);
                      setVariantImagePreviews(newPreviews);
                      setVariantForm({ ...variantForm, images: files });
                    }} className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-1"><X className="w-4 h-4" /></button>
                  </div>
                ))}
                {console.log(variantForm)}
                {/* existing images from server */}
                {variantForm.existingImages?.map(m => (
                  <div key={m.id} className="relative">
                    <img src={m.url} className="h-20 w-20 object-cover rounded" />
                    <button onClick={() => removeVariantExistingImageLocal(m.id)} className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-1"><X className="w-4 h-4" /></button>
                  </div>
                ))}

                {/* If neither previews nor existing images exist, show placeholder */}
                {variantImagePreviews.length === 0 && (variantForm.existingImages?.length ?? 0) === 0 && (
                  <div className="h-20 w-20 bg-gray-100 rounded flex items-center justify-center text-xs">No images</div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={closeDrawer}>Cancel</Button>
              <Button onClick={saveVariantFromDrawer}>Save Variant</Button>
            </div>
          </div>
        )}
      </Drawer>
    </AppLayout>
  );
}
