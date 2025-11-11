import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { router } from "@inertiajs/react";

interface Props {
  open: boolean;
  onClose: () => void;
  deleteRoute: string;
  record: any | null;
}

export default function CrudDeleteDialog({ open, onClose, deleteRoute, record }: Props) {
  const handleDelete = () => {
    if (!record) return;
    deleteRoute = deleteRoute.replace(':id', record.id)
    router.delete(`${deleteRoute}`, {
      onSuccess: onClose,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirm Delete</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600">
          Are you sure you want to delete this record? This action cannot be undone.
        </p>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
