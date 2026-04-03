"use client";

import { useEffect, useState } from "react";

type Office = {
  code: string;
  city: string;
  address: string;
  name: string;
};

type Props = {
  initialOffice?: {
    code: string;
    city: string;
    address: string;
  };
  fieldPrefix?: string;
};

export function CdekOfficeSelect({
  initialOffice,
  fieldPrefix = "cdek",
}: Props) {
  const [query, setQuery] = useState(
    initialOffice
      ? `${initialOffice.city}, ${initialOffice.address} (${initialOffice.code})`
      : "",
  );
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(
    initialOffice
      ? {
          code: initialOffice.code,
          city: initialOffice.city,
          address: initialOffice.address,
          name: `${initialOffice.city}, ${initialOffice.address}`,
        }
      : null,
  );
  const [results, setResults] = useState<Office[]>([]);
  const [loading, setLoading] = useState(false);
  const [sourceMissing, setSourceMissing] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadOffices() {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/cdek/offices?query=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        const data = (await response.json()) as {
          offices: Office[];
          sourceAvailable: boolean;
        };
        setResults(data.offices);
        setSourceMissing(!data.sourceAvailable);
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    const timeoutId = window.setTimeout(loadOffices, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  const handleSelect = (office: Office) => {
    setSelectedOffice(office);
    setQuery(`${office.city}, ${office.address} (${office.code})`);
    setResults([]);
  };

  const codeField = `${fieldPrefix}PvzCode`;
  const cityField = `${fieldPrefix}PvzCity`;
  const addressField = `${fieldPrefix}PvzAddress`;

  return (
    <div className="grid gap-3">
      <label className="text-sm font-medium">ПВЗ СДЭК</label>

      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          if (selectedOffice) {
            setSelectedOffice(null);
          }
        }}
        placeholder="Начни вводить город, адрес или код ПВЗ"
        className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
      />

      <input type="hidden" name={codeField} value={selectedOffice?.code ?? ""} />
      <input type="hidden" name={cityField} value={selectedOffice?.city ?? ""} />
      <input
        type="hidden"
        name={addressField}
        value={selectedOffice?.address ?? ""}
      />

      {selectedOffice ? (
        <div className="border border-[var(--border)] bg-[var(--muted)] p-3 text-sm">
          <div className="font-medium">{selectedOffice.city}</div>
          <div className="text-[var(--muted-foreground)]">
            {selectedOffice.address}
          </div>
          <div className="mt-1 text-xs text-[var(--muted-foreground)]">
            Код ПВЗ: {selectedOffice.code}
          </div>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--muted-foreground)]">Ищу ПВЗ...</p>
      ) : null}

      {!loading && results.length > 0 ? (
        <div className="max-h-72 overflow-y-auto border border-[var(--border)] bg-[var(--card)]">
          {results.map((office) => (
            <button
              key={office.code}
              type="button"
              onClick={() => handleSelect(office)}
              className="flex w-full flex-col gap-1 border-b border-[var(--border)] px-4 py-3 text-left transition hover:bg-[var(--muted)]"
            >
              <span className="font-medium">{office.city}</span>
              <span className="text-sm text-[var(--muted-foreground)]">
                {office.address}
              </span>
              <span className="text-xs text-[var(--muted-foreground)]">
                Код: {office.code}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {!loading && sourceMissing ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          Справочник ПВЗ пока не найден. Положи файл `CDEK-offices_ru-RU.xlsx` в
          корень проекта, и поиск начнёт работать.
        </p>
      ) : null}

      {!loading && !sourceMissing && query.trim() && results.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          По этому запросу ПВЗ не найден.
        </p>
      ) : null}
    </div>
  );
}
