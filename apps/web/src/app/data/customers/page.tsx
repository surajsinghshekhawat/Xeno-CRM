"use client";

import { Suspense, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { CustomerTable } from "@/components/data/customer-table";
import { CsvImportModal } from "@/components/data/csv-import-modal";
import { Button } from "@/components/ui/button";

function CustomersContent() {
  const [importOpen, setImportOpen] = useState(false);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setImportOpen(true)}>Import CSV</Button>
      </div>
      <CustomerTable />
      <CsvImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  );
}

export default function CustomersPage() {
  return (
    <AppShell
      title="Customers"
      description="Browse, search, filter, and import customer records."
    >
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading…</p>}>
        <CustomersContent />
      </Suspense>
    </AppShell>
  );
}
