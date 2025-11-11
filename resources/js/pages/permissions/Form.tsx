import React from 'react';
import { useForm, router } from '@inertiajs/react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

interface PermissionDialogProps {
  permission?: {
    id: number;
    name: string;
    group: string | null;
  };
  groups?: string[];
  trigger: React.ReactNode; 
  onSuccess?: () => void;
}

export default function PermissionDialog({ permission, groups = [], trigger, onSuccess }: PermissionDialogProps) {
  const isEdit = !!permission;
  const [open, setOpen] = React.useState(false);

  const { data, setData, processing, errors, setError, reset } = useForm({
    name: permission?.name || '',
    group: permission?.group || '',
    newGroup: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: data.name,
      group: data.newGroup.trim() !== '' ? data.newGroup.trim() : data.group,
    };

    const url = isEdit ? `/admin/permissions/${permission?.id}` : '/admin/permissions';
    const method = isEdit ? 'put' : 'post';

    router[method](url, payload, {
      preserveScroll: true,
      onSuccess: () => {
        reset();
        setOpen(false);
      },
      onError: (err) => {
        // Manually set each error
        Object.keys(err).forEach(key => {
          setError(key, err[key]);
        });
      },

    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={() => setOpen(true)}>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Permission' : 'Add Permission'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Edit permission details' : 'Create a new permission'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Permission Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Permission Name</Label>
            <Input
              id="name"
              placeholder="example: manage-users"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Select Group */}
          <div className="space-y-2">
            <Label htmlFor="group">Select Group</Label>
            <Select 
              value={data.group || ''} 
              onValueChange={(val) => setData('group', val)}
            >
              <SelectTrigger className={errors.group ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select group..." />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.group && <p className="text-sm text-red-500">{errors.group}</p>}
          </div>

          {/* New Group */}
          <div className="space-y-2">
            <Label htmlFor="newGroup">Or type a new group</Label>
            <Input
              id="newGroup"
              placeholder="example: Tender / Article / User"
              value={data.newGroup}
              onChange={(e) => setData('newGroup', e.target.value)}
              className={errors.group ? 'border-red-500' : ''}
            />
            {errors.group && <p className="text-sm text-red-500">{errors.group}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={processing} className='cursor-pointer'>
              <Save className="mr-2 h-4 w-4 cu" />
              {processing
                ? isEdit
                  ? 'Saving...'
                  : 'Adding...'
                : isEdit
                ? 'Save Changes'
                : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
