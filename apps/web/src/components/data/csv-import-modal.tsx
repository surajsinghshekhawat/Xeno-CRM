"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/api-client";

type CsvRowResult = {
  row: number;
  data?: {
    name: string;
    email: string;
    phone?: string;
    city?: string;
  };
  errors?: string[];
};

type PreviewResponse = {
  mode: "preview";
  preview: CsvRowResult[];
  validCount: number;
  errorCount: number;
  totalRows: number;
};

type ImportResponse = {
  mode: "import";
  imported: number;
  updated: number;
  errors: CsvRowResult[];
};

export function CsvImportModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const previewMutation = useMutation({
    mutationFn: () =>
      apiPost<PreviewResponse>("/api/customers/import", {
        csv,
        mode: "preview",
      }),
    onSuccess: (data) => {
      setPreview(data);
      setMessage(null);
    },
    onError: () => setMessage("Preview failed. Ensure the CSV has name and email columns."),
  });

  const importMutation = useMutation({
    mutationFn: () =>
      apiPost<ImportResponse>("/api/customers/import", {
        csv,
        mode: "import",
      }),
    onSuccess: (data) => {
      setMessage(
        `Imported ${data.imported} new and updated ${data.updated} customers.`,
      );
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      setPreview(null);
    },
    onError: () => setMessage("Import failed. Check your CSV format and API connection."),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Import customers</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Upload CSV with columns: name, email, phone, city, ageGroup,
              gender.
            </p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <textarea
          className="mt-4 h-40 w-full rounded-md border border-neutral-200 p-3 text-sm"
          placeholder="Paste CSV content here…"
          value={csv}
          onChange={(event) => setCsv(event.target.value)}
        />

        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            disabled={!csv.trim() || previewMutation.isPending}
            onClick={() => previewMutation.mutate()}
          >
            Preview
          </Button>
          <Button
            disabled={!preview || preview.validCount === 0 || importMutation.isPending}
            onClick={() => importMutation.mutate()}
          >
            Confirm import
          </Button>
        </div>

        {message ? (
          <p className="mt-4 rounded-md bg-neutral-100 px-3 py-2 text-sm">
            {message}
          </p>
        ) : null}

        {preview ? (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-neutral-600">
              {preview.validCount} valid · {preview.errorCount} errors ·{" "}
              {preview.totalRows} total rows
            </p>
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.preview.map((row) => (
                  <tr key={row.row} className="border-t border-neutral-100">
                    <td className="px-3 py-2">{row.row}</td>
                    <td className="px-3 py-2">{row.data?.name ?? "—"}</td>
                    <td className="px-3 py-2">{row.data?.email ?? "—"}</td>
                    <td className="px-3 py-2 text-rose-600">
                      {row.errors?.join(", ") ?? "Valid"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
