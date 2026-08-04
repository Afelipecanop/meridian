"use client";

import type { LandingSection } from "@/db/schema";
import { isSectionType, sectionRegistry } from "@/components/sections/registry";
import { sectionFields } from "./field-defs";
import { ItemsControl, ImagesControl, ScalarField } from "./field-controls";
import { Label } from "@/components/ui/label";

/** Panel derecho: ajustes de la sección seleccionada. */
export function SectionSettingsPanel({
  section,
  onSettingsChange,
}: {
  section: LandingSection;
  onSettingsChange: (settings: Record<string, unknown>) => void;
}) {
  if (!isSectionType(section.type)) return null;
  const entry = sectionRegistry[section.type];
  const fields = sectionFields[section.type];
  const settings = section.settings;

  function update(key: string, value: unknown) {
    onSettingsChange({ ...settings, [key]: value });
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h2 className="text-sm font-semibold">{entry.label}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {entry.description}
        </p>
      </div>
      {fields.map((def) => {
        if (def.kind === "items") {
          const value = Array.isArray(settings[def.key])
            ? (settings[def.key] as Record<string, unknown>[])
            : [];
          return (
            <ItemsControl
              key={def.key}
              label={def.label}
              addLabel={def.addLabel}
              itemLabelKey={def.itemLabelKey}
              fields={def.fields}
              makeItem={def.makeItem}
              value={value}
              onChange={(v) => update(def.key, v)}
              idPrefix={`section-${section.id}-${def.key}`}
            />
          );
        }
        if (def.kind === "images") {
          const value = Array.isArray(settings[def.key])
            ? (settings[def.key] as string[])
            : [];
          return (
            <div key={def.key} className="flex flex-col gap-1.5">
              <Label className="text-xs">{def.label}</Label>
              <ImagesControl value={value} onChange={(v) => update(def.key, v)} />
            </div>
          );
        }
        return (
          <ScalarField
            key={def.key}
            def={def}
            idPrefix={`section-${section.id}`}
            value={settings[def.key]}
            onChange={(v) => update(def.key, v)}
          />
        );
      })}
    </div>
  );
}
