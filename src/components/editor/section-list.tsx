"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, Plus, Settings2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LandingSection } from "@/db/schema";
import {
  isSectionType,
  sectionRegistry,
  sectionTypes,
} from "@/components/sections/registry";

export const SETTINGS_PANEL_ID = "__settings__";

function SortableRow({
  section,
  selected,
  onSelect,
  onToggleVisible,
  onRemove,
}: {
  section: LandingSection;
  selected: boolean;
  onSelect: () => void;
  onToggleVisible: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });

  const entry = isSectionType(section.type)
    ? sectionRegistry[section.type]
    : null;
  if (!entry) return null;
  const Icon = entry.icon;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group flex items-center gap-1 rounded-lg border px-1.5 py-1.5 text-sm ${
        selected
          ? "border-primary/50 bg-primary/10"
          : "border-transparent hover:border-border hover:bg-white/5"
      } ${isDragging ? "z-10 opacity-80 shadow-lg" : ""}`}
    >
      <button
        type="button"
        aria-label="Arrastrar para reordenar"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onSelect}
        className={`flex min-w-0 flex-1 items-center gap-2 text-left ${
          section.visible ? "" : "opacity-50"
        }`}
      >
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="truncate">{entry.label}</span>
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={section.visible ? "Ocultar sección" : "Mostrar sección"}
        onClick={onToggleVisible}
        className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100"
      >
        {section.visible ? (
          <Eye className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <EyeOff className="h-3.5 w-3.5" aria-hidden />
        )}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Eliminar sección"
        onClick={onRemove}
        className="h-7 w-7 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
      </Button>
    </li>
  );
}

/** Panel izquierdo: lista reordenable de secciones + agregar + ajustes globales. */
export function SectionList({
  sections,
  selectedId,
  onSelect,
  onReorder,
  onAdd,
  onToggleVisible,
  onRemove,
}: {
  sections: LandingSection[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (sections: LandingSection[]) => void;
  onAdd: (type: (typeof sectionTypes)[number]) => void;
  onToggleVisible: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(sections, oldIndex, newIndex));
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Secciones</h2>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm" aria-label="Agregar sección" />
            }
          >
            <Plus className="h-4 w-4" aria-hidden />
            Agregar
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {sectionTypes.map((type) => {
              const entry = sectionRegistry[type];
              const Icon = entry.icon;
              return (
                <DropdownMenuItem
                  key={type}
                  onSelect={() => onAdd(type)}
                  className="cursor-pointer"
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {entry.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {sections.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            Agrega tu primera sección con el botón de arriba
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="flex flex-col gap-1">
                {sections.map((section) => (
                  <SortableRow
                    key={section.id}
                    section={section}
                    selected={selectedId === section.id}
                    onSelect={() => onSelect(section.id)}
                    onToggleVisible={() => onToggleVisible(section.id)}
                    onRemove={() => onRemove(section.id)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="border-t border-border p-2">
        <button
          type="button"
          onClick={() => onSelect(SETTINGS_PANEL_ID)}
          className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm ${
            selectedId === SETTINGS_PANEL_ID
              ? "bg-primary/10 text-foreground"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          }`}
        >
          <Settings2 className="h-4 w-4" aria-hidden />
          Ajustes de la landing
        </button>
      </div>
    </div>
  );
}
