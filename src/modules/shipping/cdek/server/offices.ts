import { existsSync, readFileSync } from "fs";
import path from "path";
import * as XLSX from "xlsx";

export type CdekOffice = {
  code: string;
  city: string;
  address: string;
  name: string;
};

let officesCache: CdekOffice[] | null = null;

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/\s+/g, "").replace(/[^a-zа-я0-9]/gi, "");
}

function pickField(row: Record<string, unknown>, aliases: string[]) {
  const entries = Object.entries(row);

  for (const alias of aliases) {
    const normalizedAlias = normalizeKey(alias);
    const matched = entries.find(([key]) => normalizeKey(key).includes(normalizedAlias));

    if (matched) {
      return String(matched[1] ?? "").trim();
    }
  }

  return "";
}

function getWorkbookPath() {
  const candidates = [
    path.join(process.cwd(), "CDEK-offices_ru-RU.xlsx"),
    path.join(process.cwd(), "public", "CDEK-offices_ru-RU.xlsx"),
    path.join(process.cwd(), "data", "CDEK-offices_ru-RU.xlsx"),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

export function getAllCdekOffices() {
  if (officesCache) {
    return officesCache;
  }

  const workbookPath = getWorkbookPath();

  if (!workbookPath) {
    officesCache = [];
    return officesCache;
  }

  const buffer = readFileSync(workbookPath);
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const preferredSheetName =
    workbook.SheetNames.find((sheetName) => sheetName.toLowerCase() === "россия") ??
    workbook.SheetNames.find((sheetName) => sheetName.toLowerCase().includes("росс"));
  const sheetNames = preferredSheetName ? [preferredSheetName] : workbook.SheetNames;

  if (sheetNames.length === 0) {
    officesCache = [];
    return officesCache;
  }

  const offices: CdekOffice[] = [];

  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      continue;
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    for (const row of rows) {
      const code = pickField(row, ["кодпвз", "код", "officecode"]);
      const city = pickField(row, ["город", "населенныйпункт", "city"]);
      const address = pickField(row, ["адрес", "адреспвз", "locationaddressfull"]);
      const name = pickField(row, ["названиеофиса", "название", "наименование", "name"]);

      if (!code || !city || !address) {
        continue;
      }

      offices.push({
        code,
        city,
        address,
        name: name || `${city}, ${address}`.trim(),
      });
    }
  }

  officesCache = offices;

  return officesCache;
}

export function searchCdekOffices(query: string, limit = 20) {
  const normalizedQuery = query.trim().toLowerCase();
  const offices = getAllCdekOffices();

  if (!normalizedQuery) {
    return offices.slice(0, limit);
  }

  return offices
    .filter((office) =>
      [office.city, office.address, office.code, office.name]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    )
    .slice(0, limit);
}
