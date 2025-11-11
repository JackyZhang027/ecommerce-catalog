import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import CrudDataTable from "@/components/crud/CrudDataTable";
import { ColumnDef } from "@tanstack/react-table";
import { FloatingContact } from "@/types/floating-contacts";
import { Switch } from "@/components/ui/switch";

interface Props {
    contacts: {
        data: FloatingContact[];
        links: any[];
        meta: any;
    };
    filters: Record<string, any>;
}

export default function Index({ contacts, filters }: Props) {
    const columns: ColumnDef<FloatingContact>[] = [
        { accessorKey: "name", header: "Label" },
        { accessorKey: "whatsapp_number", header: "WhatsApp Number" },
        { accessorKey: "whatsapp_message_template", header: "Message Template" },
        {
            accessorKey: "is_active",
            header: "Active",
            cell: ({ row }) => {
                const record = row;
                return (
                    <Switch
                        checked={record.is_active}
                        onCheckedChange={(checked) =>
                            router.put(
                                route("floating_contacts.toggle", record.id),
                                { is_active: checked },
                                { preserveScroll: true }
                            )
                        }
                    />
                );
            },
        },
    ];


    return (
        <AppLayout
            title="Floating Contacts"
            breadcrumbs={[
                { title: "Home", href: '/' },
                { title: "contacts", href: route("floating_contacts.index") },
            ]}
        >
            <Head title="Floating Contacts" />

            <CrudDataTable<FloatingContact>
                title="Floating Contacts"
                data={contacts.data}
                meta={contacts.meta}
                filters={filters}
                columns={columns}
                baseIndexRoute={route("floating_contacts.index")}
                createRoute={route('floating_contacts.store')}
                updateRoute={route('floating_contacts.update', ':id')}
                deleteRoute={route('floating_contacts.destroy', ':id')}
                formFields={[
                    { name: "name", label: "Label", type: "text" },
                    { name: "whatsapp_number", label: "WhatsApp Number", type: "text" },
                    { name: "whatsapp_message_template", label: "Default Message", type: "text" },
                ]}
            />
        </AppLayout>
    );
}
