import React, { useEffect, useState } from "react";
import { router, useForm, Head } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BreadcrumbItem } from "@/types";

interface Supplier {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface Props {
  supplier?: Supplier;
}

export default function SupplierForm({ supplier }: Props) {
  const isEdit = !!supplier;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, setData, errors, reset, post, put } = useForm({
    name: supplier?.name || "",
    email: supplier?.email || "",
    phone: supplier?.phone || "",
    address: supplier?.address || "",
  });

  useEffect(() => {
    if (supplier) {
      setData({
        name: supplier.name || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
      });
    }
  }, [supplier]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (isEdit) {
      put(route("suppliers.update", supplier?.id), {
        preserveScroll: true,
        onFinish: () => setIsSubmitting(false),
      });
    } else {
      post(route("suppliers.store"), {
        preserveScroll: true,
        onSuccess: () => reset(),
        onFinish: () => setIsSubmitting(false),
      });
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Suppliers", href: route("suppliers.index") },
    { title: isEdit ? "Edit Supplier" : "Create Supplier", href: "#" },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? "Edit Supplier" : "Create Supplier"} />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex justify-between items-center">
                <span>{isEdit ? "Edit Supplier" : "Create Supplier"}</span>
                <div className="flex gap-3">
                  <a href={route("suppliers.index")}>
                    <Button type="button" variant="secondary">
                      Back
                    </Button>
                  </a>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? "Saving..."
                      : isEdit
                      ? "Save Changes"
                      : "Create Supplier"}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>

            <Separator />

            <CardContent className="pt-5 space-y-5">
              <div>
                <Label>Name</Label>
                <Input
                  value={data.name}
                  onChange={(e) => setData("name", e.target.value)}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  value={data.email}
                  onChange={(e) => setData("email", e.target.value)}
                />
              </div>

              <div>
                <Label>Phone</Label>
                <Input
                  value={data.phone}
                  onChange={(e) => setData("phone", e.target.value)}
                />
              </div>

              <div>
                <Label>Address</Label>
                <Input
                  value={data.address}
                  onChange={(e) => setData("address", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </AppLayout>
  );
}
