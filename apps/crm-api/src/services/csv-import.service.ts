import { csvRowSchema, type CsvRow } from "@xeno/shared";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/error-handler.js";
import { refreshCustomerTags } from "./tag-refresh.service.js";

const PREVIEW_ROW_LIMIT = 5;
const MAX_IMPORT_ROWS = 1000;
export type CsvRowResult = {
  row: number;
  data?: CsvRow;
  errors?: string[];
};

export type CsvImportPreview = {
  mode: "preview";
  preview: CsvRowResult[];
  validCount: number;
  errorCount: number;
  totalRows: number;
};

export type CsvImportResult = {
  mode: "import";
  imported: number;
  updated: number;
  errors: CsvRowResult[];
};

function parseCsvLine(line: string): string[] {
  return line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, "");
}

const HEADER_MAP: Record<string, keyof CsvRow> = {
  name: "name",
  email: "email",
  phone: "phone",
  city: "city",
  agegroup: "ageGroup",
  gender: "gender",
};

export function parseCsvContent(csv: string): CsvRowResult[] {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [{ row: 0, errors: ["CSV is empty"] }];
  }

  const headerCells = parseCsvLine(lines[0]!);
  const columnIndex = new Map<keyof CsvRow, number>();

  for (const [index, header] of headerCells.entries()) {
    const key = HEADER_MAP[normalizeHeader(header)];
    if (key) columnIndex.set(key, index);
  }

  if (!columnIndex.has("name") || !columnIndex.has("email")) {
    return [{ row: 0, errors: ["CSV must include name and email columns"] }];
  }

  const results: CsvRowResult[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1;
    const cells = parseCsvLine(lines[i]!);
    const raw: Record<string, string | undefined> = {};

    for (const [field, index] of columnIndex.entries()) {
      raw[field] = cells[index]?.trim() || undefined;
    }

    const parsed = csvRowSchema.safeParse(raw);
    if (parsed.success) {
      results.push({ row: rowNumber, data: parsed.data });
    } else {
      results.push({
        row: rowNumber,
        errors: parsed.error.errors.map((e) => e.message),
      });
    }
  }

  return results;
}

export async function previewCsvImport(csv: string): Promise<CsvImportPreview> {
  const parsed = parseCsvContent(csv);
  const validRows = parsed.filter((row) => row.data);
  const errorRows = parsed.filter((row) => row.errors?.length);

  return {
    mode: "preview",
    preview: parsed.slice(0, PREVIEW_ROW_LIMIT),
    validCount: validRows.length,
    errorCount: errorRows.length,
    totalRows: parsed.length,
  };
}

export async function importCsvCustomers(csv: string): Promise<CsvImportResult> {
  const parsed = parseCsvContent(csv);

  if (parsed.length > MAX_IMPORT_ROWS) {
    throw new AppError(
      400,
      `CSV exceeds maximum of ${MAX_IMPORT_ROWS} rows`,
      "CSV_TOO_LARGE",
    );
  }

  const validRows = parsed.filter((row) => row.data);
  const errorRows = parsed.filter((row) => row.errors?.length);

  let imported = 0;
  let updated = 0;
  const affectedIds: string[] = [];

  await prisma.$transaction(async (tx) => {
    for (const row of validRows) {
      const data = row.data!;
      const existing = await tx.customer.findUnique({
        where: { email: data.email },
        select: { id: true },
      });

      const customer = await tx.customer.upsert({
        where: { email: data.email },
        create: {
          name: data.name,
          email: data.email,
          phone: data.phone ?? null,
          city: data.city ?? null,
          ageGroup: data.ageGroup ?? null,
          gender: data.gender ?? null,
        },
        update: {
          name: data.name,
          phone: data.phone ?? null,
          city: data.city ?? null,
          ageGroup: data.ageGroup ?? null,
          gender: data.gender ?? null,
        },
      });

      affectedIds.push(customer.id);

      if (existing) updated++;
      else imported++;
    }
  });

  await refreshCustomerTags(affectedIds);

  return {
    mode: "import",
    imported,
    updated,
    errors: errorRows,
  };
}