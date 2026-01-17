import React from "react";
import { Head, useForm, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Plus, Trash, AlertCircle } from "lucide-react";
import { ProductSelect } from "@/components/ecommerce/ProductSelect";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface Props {
  suppliers: any[];
  products: any[];
  purchase?: any;
  hasSales?: boolean;
}

export default function PurchaseForm({
  suppliers,
  products,
  purchase,
  hasSales = false,
}: Props) {
  const isEdit = !!purchase;

  const { data, setData, post, put, errors } = useForm({
    supplier_id: purchase?.supplier_id ?? "",
    reference: purchase?.reference ?? "",
    purchase_date:
      purchase?.purchase_date ?? new Date().toISOString().slice(0, 10),
    items:
      purchase?.items?.map((i: any) => ({
        product_id: i.product_id,
        product_variant_id: i.product_variant_id,
        label:
          i.product?.name +
          (i.variant ? ` - ${i.variant.name}` : ""),
        qty: i.qty,
        cost: i.cost,
      })) ?? [
        {
          product_id: null,
          product_variant_id: null,
          label: "",
          qty: 1,
          cost: 0,
        },
      ],
  });

  /* =====================
     HELPERS
  ===================== */

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    isEdit
      ? put(route("purchases.update", purchase.id))
      : post(route("purchases.store"));
  };

  const updateItem = (index: number, newData: any) => {
    const items = [...data.items];
    items[index] = { ...items[index], ...newData };
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
        cost: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (data.items.length === 1) return;
    setData(
      "items",
      data.items.filter((_, i) => i !== index)
    );
  };

  /* =====================
     RENDER
  ===================== */

  return (
    <AppLayout title={isEdit ? "Edit Purchase" : "Create Purchase"}>
      <Head title="Purchase Form" />

      <form onSubmit={submit} className="space-y-6">
        {hasSales && (
          <Alert className="border-yellow-500 bg-yellow-50 text-yellow-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Editing Locked</AlertTitle>
            <AlertDescription>
              This purchase cannot be edited because stock has already been
              consumed.
            </AlertDescription>
          </Alert>
        )}

        {/* =====================
            PURCHASE INFO
        ===================== */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Information</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Supplier</Label>
              <select
                disabled={hasSales}
                className="w-full border rounded-md h-10 px-3 dark:bg-gray-800 dark:border-gray-700"
                value={data.supplier_id}
                onChange={(e) => setData("supplier_id", e.target.value)}
                required
              >
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Reference</Label>
              <Input
                disabled={hasSales}
                value={data.reference}
                onChange={(e) => setData("reference", e.target.value)}
              />
            </div>

            <div>
              <Label>Date</Label>
              <Input
                disabled={hasSales}
                type="date"
                value={data.purchase_date}
                onChange={(e) => setData("purchase_date", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* =====================
            ITEMS
        ===================== */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Items</CardTitle>

                {!hasSales && (
                <Button type="button" size="sm" onClick={addItem}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Item
                </Button>
                )}
            </CardHeader>

            <CardContent className="space-y-3">
                {/* Table header (desktop only) */}
                <div className="hidden md:grid grid-cols-12 gap-3 px-4 text-sm text-muted-foreground">
                <div className="col-span-5">Product</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-3">Cost</div>
                <div className="col-span-1 text-right">Subtotal</div>
                <div className="col-span-1"></div>
                </div>

                {data.items.map((item, index) => {
                const subtotal = item.qty * item.cost;

                return (
                    <div
                    key={index}
                    className="grid grid-cols-12 gap-3 items-center rounded-xl border p-4 shadow-sm"
                    >
                    {/* Product */}
                    <div className="col-span-12 md:col-span-5">
                        <ProductSelect
                            disabled={hasSales}
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

                    {/* Qty */}
                    <div className="col-span-4 md:col-span-2">
                        <Input
                        disabled={hasSales}
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

                    {/* Cost */}
                    <div className="col-span-4 md:col-span-3">
                        <Input
                        disabled={hasSales}
                        type="number"
                        min={0}
                        value={item.cost}
                        onChange={(e) =>
                            updateItem(index, {
                            cost: Number(e.target.value),
                            })
                        }
                        />
                    </div>

                    {/* Subtotal */}
                    <div className="col-span-3 md:col-span-1 text-right font-semibold">
                        Rp {subtotal.toLocaleString("id-ID")}
                    </div>

                    {/* Remove */}
                    {!hasSales && (
                        <div className="col-span-1 flex justify-end">
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
                    )}
                    </div>
                );
                })}
            </CardContent>
            </Card>


        {/* =====================
            ACTIONS
        ===================== */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.visit(route("purchases.index"))}
          >
            Cancel
          </Button>

          {!hasSales && (
            <Button type="submit">
              {isEdit ? "Update Purchase" : "Save Purchase"}
            </Button>
          )}
        </div>
      </form>
    </AppLayout>
  );
}
