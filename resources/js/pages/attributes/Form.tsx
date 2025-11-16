import React, { useState, useEffect } from "react";
import { router, useForm, Head } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X, Plus } from "lucide-react";
import { BreadcrumbItem } from "@/types";

interface AttributeValue {
  id?: number;
  value: string;
}

interface Attribute {
  id?: number;
  name: string;
  slug?: string;
  values?: AttributeValue[];
}

interface Props {
  attribute?: Attribute;
}

export default function AttributeForm({ attribute }: Props) {
  const isEdit = !!attribute;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, setData, errors, reset, post, put } = useForm({
    name: attribute?.name || "",
    slug: attribute?.slug || "",
    values: attribute?.values || [{ value: "" }],
  });

  useEffect(() => {
    if (attribute) {
      setData({
        name: attribute.name || "",
        slug: attribute.slug || "",
        values: attribute.values || [{ value: "" }],
      });
    }
  }, [attribute]);

  const handleAddValue = () => {
    setData("values", [...data.values, { value: "" }]);
  };

  const handleRemoveValue = (index: number) => {
    const newValues = [...data.values];
    newValues.splice(index, 1);
    setData("values", newValues.length ? newValues : [{ value: "" }]);
  };

  const handleChangeValue = (index: number, newValue: string) => {
    const newValues = [...data.values];
    newValues[index].value = newValue;
    setData("values", newValues);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const request = isEdit
        ? put(`/admin/attributes/${attribute?.id}`, {
            preserveScroll: true,
            onSuccess: () => {
            // optional reset logic for edit
            },
            onError: () => {
            // handle error if needed
            },
            onFinish: () => setIsSubmitting(false), // ✅ always runs at end
        })
        : post('/admin/attributes', {
            preserveScroll: true,
            onSuccess: () => {
            reset();
            },
            onError: () => {
            // optional: show error toast
            },
            onFinish: () => setIsSubmitting(false), // ✅ always runs at end
        });
    };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Attributes", href: "/admin/attributes" },
    { title: isEdit ? "Edit Attribute" : "Create Attribute", href: "#" },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? "Edit Attribute" : "Create Attribute"} />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex-1 p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                <div className="flex justify-between items-center">
                  <div>{isEdit ? "Edit Attribute" : "Create New Attribute"}</div>
                  <div className="flex justify-end gap-3">
                    <a href="/admin/attributes">
                      <Button type="button" variant="secondary">
                        Back
                      </Button>
                    </a>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting
                        ? "Saving..."
                        : isEdit
                        ? "Save Changes"
                        : "Create Attribute"}
                    </Button>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>

            <Separator />

            <CardContent className="pt-5 space-y-6">
              {/* Attribute Name */}
              <div>
                <Label htmlFor="name">Attribute Name</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => setData("name", e.target.value)}
                  placeholder="e.g. Color, Size, Material"
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              {/* Slug */}
              <div>
                <Label htmlFor="slug">Slug (optional)</Label>
                <Input
                  id="slug"
                  value={data.slug}
                  onChange={(e) => setData("slug", e.target.value)}
                  placeholder="e.g. color"
                />
                {errors.slug && <p className="text-sm text-red-500">{errors.slug}</p>}
              </div>

              <Separator />

              {/* Attribute Values */}
              <div>
                <Label>Attribute Values</Label>
                <div className="mt-3 space-y-3">
                  {data.values.map((val, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={val.value}
                        onChange={(e) =>
                          handleChangeValue(index, e.target.value)
                        }
                        placeholder={`Value ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => handleRemoveValue(index)}
                        className="shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  onClick={handleAddValue}
                  variant="secondary"
                  className="mt-3 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Value
                </Button>

                {errors["values"] && (
                  <p className="text-sm text-red-500 mt-2">{errors["values"]}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </AppLayout>
  );
}
