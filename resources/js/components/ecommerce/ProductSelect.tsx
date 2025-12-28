import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";

interface ProductOption {
  product_id: number;
  variant_id: number | null;
  label: string;
}

interface Props {
  products: ProductOption[];
  value: {
    product_id: number | null;
    variant_id: number | null;
  };
  onSelect: (p: ProductOption) => void;
  disabled?: boolean;
}

export function ProductSelect({
  products,
  value,
  onSelect,
  disabled = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => {
    if (!value.product_id) return null;

    return products.find(
      (p) =>
        p.product_id === value.product_id &&
        p.variant_id === value.variant_id
    );
  }, [value, products]);

  const filtered = useMemo(() => {
    return products.filter((p) =>
      p.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, products]);

  return (
    <div className="relative">
      <Input
        disabled={disabled}
        value={open ? search : selected?.label ?? ""}
        placeholder="Search product..."
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full max-h-64 overflow-auto rounded-md border bg-white shadow">
          {filtered.length === 0 && (
            <div className="p-2 text-sm text-muted-foreground">
              No products found
            </div>
          )}

          {filtered.map((p, idx) => (
            <div
              key={idx}
              className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-muted"
              onMouseDown={() => {
                onSelect(p);
                setSearch("");
                setOpen(false);
              }}
            >
              <span>{p.label}</span>

              {selected &&
                selected.product_id === p.product_id &&
                selected.variant_id === p.variant_id && (
                  <Check className="h-4 w-4 text-green-600" />
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
