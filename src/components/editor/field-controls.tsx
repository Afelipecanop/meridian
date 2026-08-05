"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ScalarFieldDef } from "./field-defs";

export const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Convierte ISO ↔ valor de <input type="datetime-local"> (hora local). */
function isoToLocal(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localToIso(local: string): string {
  if (!local) return "";
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

/** Campo de imagen por URL (sin carga de archivo): pega el enlace y ya. */
export function ImageControl({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {value ? (
        <div className="relative w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className="h-20 w-20 rounded-lg border border-border object-cover"
          />
          <button
            type="button"
            aria-label="Quitar imagen"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white"
          >
            <X className="h-3 w-3" aria-hidden />
          </button>
        </div>
      ) : null}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://…"
      />
    </div>
  );
}

/** Lista de imágenes por URL: agrega, pega el enlace, quita. */
export function ImagesControl({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [pending, setPending] = useState("");

  function addPending() {
    const url = pending.trim();
    if (!url) return;
    onChange([...value, url]);
    setPending("");
  }

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((src, i) => (
            <div key={`${src}-${i}`} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className="h-16 w-16 rounded-lg border border-border object-cover"
              />
              <button
                type="button"
                aria-label="Quitar imagen"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={pending}
          onChange={(e) => setPending(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            addPending();
          }}
          placeholder="https://…"
        />
        <Button type="button" variant="outline" size="sm" onClick={addPending}>
          <Plus className="h-4 w-4" aria-hidden />
          Agregar
        </Button>
      </div>
    </div>
  );
}

/** Control genérico para un campo escalar. */
export function ScalarControl({
  def,
  id,
  value,
  onChange,
}: {
  def: ScalarFieldDef;
  id: string;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (def.kind) {
    case "text":
      return (
        <Input
          id={id}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={def.placeholder}
        />
      );
    case "textarea":
      return (
        <Textarea
          id={id}
          rows={def.rows ?? 3}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={def.placeholder}
        />
      );
    case "code":
      return (
        <Textarea
          id={id}
          rows={def.rows ?? 10}
          spellCheck={false}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-xs leading-relaxed"
        />
      );
    case "boolean":
      return (
        <Switch
          id={id}
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange(checked)}
        />
      );
    case "number":
      return (
        <Input
          id={id}
          type="number"
          min={def.min}
          max={def.max}
          value={Number(value ?? def.min ?? 0)}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isNaN(n)) return;
            const clamped = Math.min(
              def.max ?? Infinity,
              Math.max(def.min ?? -Infinity, Math.round(n)),
            );
            onChange(clamped);
          }}
        />
      );
    case "select":
      return (
        <select
          id={id}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className={selectClass}
        >
          {def.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    case "image":
      return (
        <ImageControl value={String(value ?? "")} onChange={onChange} />
      );
    case "datetime":
      return (
        <Input
          id={id}
          type="datetime-local"
          value={isoToLocal(String(value ?? ""))}
          onChange={(e) => onChange(localToIso(e.target.value))}
        />
      );
  }
}

/** Campo escalar con su etiqueta (layout estándar del panel). */
export function ScalarField({
  def,
  idPrefix,
  value,
  onChange,
}: {
  def: ScalarFieldDef;
  idPrefix: string;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const id = `${idPrefix}-${def.key}`;
  if (def.kind === "boolean") {
    return (
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id} className="text-xs">
          {def.label}
        </Label>
        <ScalarControl def={def} id={id} value={value} onChange={onChange} />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs">
        {def.label}
      </Label>
      <ScalarControl def={def} id={id} value={value} onChange={onChange} />
    </div>
  );
}

/** Lista editable de items (beneficios, testimonios, FAQ...). */
export function ItemsControl({
  label,
  addLabel,
  itemLabelKey,
  fields,
  makeItem,
  value,
  onChange,
  idPrefix,
}: {
  label: string;
  addLabel: string;
  itemLabelKey: string;
  fields: ScalarFieldDef[];
  makeItem: () => Record<string, unknown>;
  value: Record<string, unknown>[];
  onChange: (value: Record<string, unknown>[]) => void;
  idPrefix: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function updateItem(index: number, key: string, fieldValue: unknown) {
    onChange(
      value.map((item, i) =>
        i === index ? { ...item, [key]: fieldValue } : item,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {value.map((item, i) => (
        <div key={i} className="rounded-lg border border-border">
          <div className="flex items-center gap-1 px-2 py-1.5">
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="flex-1 truncate text-left text-sm hover:text-primary"
            >
              {String(item[itemLabelKey] ?? "") || `Item ${i + 1}`}
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Eliminar item"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => {
                onChange(value.filter((_, j) => j !== i));
                setOpenIndex(null);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </div>
          {openIndex === i && (
            <div className="flex flex-col gap-3 border-t border-border p-3">
              {fields.map((def) => (
                <ScalarField
                  key={def.key}
                  def={def}
                  idPrefix={`${idPrefix}-${i}`}
                  value={item[def.key]}
                  onChange={(v) => updateItem(i, def.key, v)}
                />
              ))}
            </div>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => {
          onChange([...value, makeItem()]);
          setOpenIndex(value.length);
        }}
      >
        <Plus className="h-4 w-4" aria-hidden />
        {addLabel}
      </Button>
    </div>
  );
}
