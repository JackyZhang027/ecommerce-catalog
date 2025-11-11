import React, { useState } from "react";
import { router } from "@inertiajs/react";
import { ColumnDef, flexRender } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Download } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import CrudModal from "./CrudModal";
import CrudDeleteDialog from "./CrudDeleteDialog";

interface CrudTableProps<T> {
  title: string;
  data: T[];
  meta: any;
  filters: Record<string, any>;
  columns: ColumnDef<T>[];
  createRoute?: string;
  updateRoute?: string;
  deleteRoute?: string;
  baseIndexRoute?: string;
  exportRoute?: string;
  createPage?: string; // ✅ New prop
  editPage?: string;   // ✅ Optional: For editing via page
  formFields?: { name: string; label: string; type?: string }[];
}

export default function CrudDataTable<T>({
  title,
  data,
  meta,
  filters,
  columns,
  createRoute,
  updateRoute,
  deleteRoute,
  baseIndexRoute,
  exportRoute,
  createPage,
  editPage,
  formFields,
}: CrudTableProps<T>) {
  const [search, setSearch] = useState(filters.search || "");
  const [openModal, setOpenModal] = useState(false);
  const [editRow, setEditRow] = useState<T | null>(null);
  const [deleteRow, setDeleteRow] = useState<T | null>(null);

  // handle server search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get(baseIndexRoute, { ...filters, search }, { preserveState: true });
  };

  // handle pagination
  const handlePageChange = (url: string) => {
    router.visit(url, { preserveState: true });
  };

  const handleSort = (key: string) => {
    const direction = filters.direction === "asc" ? "desc" : "asc";
    router.get(baseIndexRoute, { ...filters, sort: key, direction }, { preserveState: true });
  };

  const handleExport = () => {
    if (exportRoute) window.location.href = exportRoute;
  };

  // ✅ handle Add New
  const handleAddNew = () => {
    if (createPage) {
      router.visit(createPage);
    } else {
      setOpenModal(true);
    }
  };

  // ✅ handle Edit
  const handleEdit = (row: any) => {
    if (editPage) {
      // redirect to edit page with id param
      router.visit(`${editPage}/${row.id}/edit`);
    } else {
      setEditRow(row);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row justify-between md:items-center gap-3">
        <CardTitle>{title}</CardTitle>
        <div className="flex flex-wrap gap-2 items-center">
          <form onSubmit={handleSearch}>
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56"
            />
          </form>
          {exportRoute && (
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
          )}
          <Button onClick={handleAddNew} className="cursor-pointer">
            <Plus className="w-4 h-4 mr-1" /> Add New
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead
                    key={String(col.accessorKey)}
                    className="cursor-pointer select-none"
                    onClick={() => handleSort(String(col.accessorKey))}
                  >
                    {col.header as React.ReactNode}
                    {filters.sort === col.accessorKey
                      ? filters.direction === "asc"
                        ? " ▲"
                        : " ▼"
                      : null}
                  </TableHead>
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.length > 0 ? (
                data.map((row: any) => (
                  <TableRow key={row.id}>
                    {columns.map((col) => (
                      <TableCell key={String(col.accessorKey)}>
                        {col.cell
                          ? flexRender(col.cell, {
                              row,
                              getValue: () => row[col.accessorKey as keyof T],
                            })
                          : (row[col.accessorKey as keyof T] as React.ReactNode)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(row)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500"
                        onClick={() => setDeleteRow(row)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="text-center text-gray-500 py-4"
                  >
                    No data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 text-sm">
          <p>
            Showing {meta.from || 0} to {meta.to || 0} of {meta.total} entries
          </p>
          <div className="flex gap-1">
            {meta.links.map((link: any, i: number) => (
              <Button
                key={i}
                variant={link.active ? "default" : "outline"}
                size="sm"
                disabled={!link.url}
                onClick={() => link.url && handlePageChange(link.url)}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </div>
        </div>
      </CardContent>

      {/* Only show modal when no createPage/editPage provided */}
      {!createPage && (
        <CrudModal
          open={openModal || !!editRow}
          onClose={() => {
            setOpenModal(false);
            setEditRow(null);
          }}
          createRoute={createRoute}
          updateRoute={updateRoute}
          editRow={editRow}
          formFields={formFields}
        />
      )}

      <CrudDeleteDialog
        open={!!deleteRow}
        onClose={() => setDeleteRow(null)}
        deleteRoute={deleteRoute}
        record={deleteRow}
      />
    </Card>
  );
}
