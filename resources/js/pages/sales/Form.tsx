import React from "react";
import { Head, useForm, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Trash } from "lucide-react";
import { ProductSelect } from "@/components/ecommerce/ProductSelect";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

/* =====================
   TYPES
===================== */

interface ProductOption {
  product_id: number;
  variant_id: number | null;
  label: string;
}

interface Props {
  products: ProductOption[];
  sale?: any;
}

/* =====================
   COMPONENT
===================== */

export default function SalesForm({ products, sale }: Props) {
  const isEdit = !!sale;

  const { data, setData, post, put, errors } = useForm({
    sale_date: sale?.sale_date ?? new Date().toISOString().slice(0, 10),
    discount: sale?.discount ?? 0,
    note: sale?.note ?? "",
    items:
      sale?.items?.map((i: any) => ({
        product_id: i.product_id,
        product_variant_id: i.product_variant_id ?? null,
        label:
          i.product?.name +
          (i.variant ? ` — ${i.variant.name}` : ""),
        qty: i.qty,
        price: i.price,
        discount: i.discount ?? 0,
      })) ?? [
        {
          product_id: null,
          product_variant_id: null,
          label: "",
          qty: 1,
          price: 0,
          discount: 0,
        },
      ],
  });

  /* =====================
     HELPERS
  ===================== */

  const updateItem = (index: number, payload: any) => {
    const items = [...data.items];
    items[index] = { ...items[index], ...payload };
    setData("items", items);
  };

  const addItem = () => {
    setData("items", [
      ...data.items,
      {
        product_id: null,
        product_variant_id: null,
        label: "",
        qty: 1,
        price: 0,
        discount: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setData(
      "items",
      data.items.filter((_, i) => i !== index)
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    isEdit
      ? put(route("sales.update", sale.id))
      : post(route("sales.store"));
  };

  /* =====================
     TOTALS
  ===================== */

  const subtotal = data.items.reduce(
    (sum, i) => sum + i.qty * i.price - i.discount,
    0
  );

  const total = Math.max(0, subtotal - data.discount);

  /* =====================
     RENDER
  ===================== */

  return (
    <AppLayout title={isEdit ? "Edit Sale" : "Create Sale"}>
      <Head title={isEdit ? "Edit Sale" : "Create Sale"} />

      <form
        onSubmit={submit}
        className="space-y-6 mb-32"
      >
        {/* ================= SALE INFO ================= */}
        <Card>
          <CardHeader>
            <CardTitle>Sale Information</CardTitle>
            
            {Object.keys(errors).length > 0 && (
                <Alert variant="destructive" className="mb-4 w-100">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Errors</AlertTitle>
                    <AlertDescription>
                        Please check the form for errors.
                        <ul className="list-disc pl-4 mt-2 text-sm">
                            {Object.values(errors).map((e: any, i) => (
                                <li key={i}>{e}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={data.sale_date}
                onChange={(e) =>
                  setData("sale_date", e.target.value)
                }
              />
            </div>

            <div>
              <Label>Global Discount</Label>
              <Input
                type="number"
                min={0}
                value={data.discount}
                onChange={(e) =>
                  setData("discount", Number(e.target.value))
                }
              />
            </div>

            <div className="md:col-span-3">
              <Label>Note</Label>
              <Textarea
                value={data.note}
                onChange={(e) =>
                  setData("note", e.target.value)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* ================= ITEMS ================= */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Items</CardTitle>
            <Button type="button" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-12 gap-3 px-4 text-sm text-muted-foreground">
              <div className="col-span-4">Product</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-2">Price</div>
              <div className="col-span-2">Discount</div>
              <div className="col-span-1 text-right">Subtotal</div>
              <div className="col-span-1"></div>
            </div>

            {data.items.map((item, index) => {
              const lineTotal = item.qty * item.price - item.discount;

              return (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-3 items-center rounded-xl border p-4 shadow-sm"
                >
                  <div className="col-span-12 md:col-span-4">
                    <ProductSelect
                      products={products}
                      value={{
                        product_id: item.product_id,
                        variant_id: item.product_variant_id,
                      }}
                      onSelect={(p) =>
                        updateItem(index, {
                          product_id: p.product_id,
                          product_variant_id: p.variant_id,
                          label: p.label,
                        })
                      }
                    />
                  </div>

                  <div className="col-span-4 md:col-span-2">
                    <Input
                      type="number"
                      min={1}
                      value={item.qty}
                      onChange={(e) =>
                        updateItem(index, {
                          qty: Number(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="col-span-4 md:col-span-2">
                    <Input
                      type="number"
                      min={0}
                      value={item.price}
                      onChange={(e) =>
                        updateItem(index, {
                          price: Number(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="col-span-4 md:col-span-2">
                    <Input
                      type="number"
                      min={0}
                      value={item.discount}
                      onChange={(e) =>
                        updateItem(index, {
                          discount: Number(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="col-span-10 md:col-span-1 text-right font-semibold">
                    Rp {lineTotal.toLocaleString("id-ID")}
                  </div>

                  <div className="col-span-2 md:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={data.items.length === 1}
                      onClick={() => removeItem(index)}
                    >
                      <Trash className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* ================= ACTIONS ================= */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.visit(route("sales.index"))}
          >
            Cancel
          </Button>
          <Button type="submit">
            {isEdit ? "Update Sale" : "Create Sale"}
          </Button>
        </div>
      </form>

      {/* ================= STICKY TOTAL ================= */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>Rp {total.toLocaleString("id-ID")}</span>
        </div>
      </div>
    </AppLayout>
  );
}
