import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect } from 'react';
import { useForm } from '@inertiajs/react';

interface Field {
  name: string;
  label: string;
  type?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  createRoute: string;
  updateRoute?: string; // ✅ optional update route
  editRow?: Record<string, any> | null;
  formFields: Field[];
}

export default function CrudModal({
  open,
  onClose,
  createRoute,
  updateRoute,
  editRow,
  formFields,
}: Props) {
  const isEdit = !!editRow;
  const { data, setData, post, put, processing, reset, errors } = useForm<Record<string, any>>({});

  // prefill data when editing
  useEffect(() => {
    if (editRow) {
      setData(editRow);
    } else {
      reset();
    }
  }, [editRow]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const options = {
      preserveScroll: true,
      onSuccess: () => {
        reset();
        onClose();
      },
    };

    if (isEdit && updateRoute) {
      put(updateRoute.replace(':id', editRow.id), options);
    } else {
      post(createRoute, options);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Record' : 'Add New Record'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formFields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium mb-1">{field.label}</label>
              <Input
                type={field.type || 'text'}
                value={data[field.name] || ''}
                onChange={(e) => setData(field.name, e.target.value)}
              />
              {errors[field.name] && (
                <p className="text-sm text-red-500 mt-1">{errors[field.name]}</p>
              )}
            </div>
          ))}

          {Object.keys(errors).length > 0 && (
            <div className="text-sm text-red-500 border-t pt-2">
              Please fix the highlighted errors above.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={processing}>
              {isEdit ? 'Update' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
