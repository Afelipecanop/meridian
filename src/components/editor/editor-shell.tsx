"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  CloudUpload,
  ExternalLink,
  Loader2,
  Monitor,
  Smartphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Landing, LandingSection, Product } from "@/db/schema";
import type { LandingDraft } from "@/lib/zod-schemas/landing";
import { sectionRegistry, type SectionType } from "@/components/sections/registry";
import {
  publishLanding,
  saveLandingDraft,
  unpublishLanding,
} from "@/app/admin/landings/actions";
import { SectionList, SETTINGS_PANEL_ID } from "./section-list";
import { SectionSettingsPanel } from "./settings-panel";
import { LandingSettingsPanel } from "./landing-settings";

export type PreviewMessage = {
  type: "meridian:preview";
  draft: LandingDraft;
  product: Product | null;
};

function draftFromLanding(landing: Landing): LandingDraft {
  return {
    name: landing.name,
    slug: landing.slug,
    productId: landing.productId,
    checkoutMode: landing.checkoutMode,
    theme: landing.theme,
    seo: landing.seo,
    pixels: landing.pixels,
    sections: landing.sections,
  };
}

type SaveState = "saved" | "pending" | "saving" | "error";

const saveLabels: Record<SaveState, string> = {
  saved: "Guardado",
  pending: "Cambios sin guardar…",
  saving: "Guardando…",
  error: "Error al guardar",
};

export function EditorShell({
  landing,
  products,
}: {
  landing: Landing;
  products: Product[];
}) {
  const [draft, setDraft] = useState<LandingDraft>(() =>
    draftFromLanding(landing),
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    landing.sections[0]?.id ?? SETTINGS_PANEL_ID,
  );
  const [status, setStatus] = useState(landing.status);
  const [publishedSnapshot, setPublishedSnapshot] = useState(() =>
    JSON.stringify(landing.publishedSections),
  );
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [publishing, startPublish] = useTransition();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const firstRender = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const product = useMemo(
    () => products.find((p) => p.id === draft.productId) ?? null,
    [products, draft.productId],
  );

  const hasUnpublished =
    status !== "published" ||
    JSON.stringify(draft.sections) !== publishedSnapshot;

  // ---------- Sincronización con el preview ----------

  const sendPreview = useCallback(() => {
    const message: PreviewMessage = { type: "meridian:preview", draft, product };
    iframeRef.current?.contentWindow?.postMessage(
      message,
      window.location.origin,
    );
  }, [draft, product]);

  useEffect(() => {
    sendPreview();
  }, [sendPreview]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (
        (event.data as { type?: string } | null)?.type ===
        "meridian:preview-ready"
      ) {
        sendPreview();
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [sendPreview]);

  // ---------- Autosave (debounce) ----------

  const persist = useCallback(
    async (toSave: LandingDraft) => {
      setSaveState("saving");
      const result = await saveLandingDraft(landing.id, toSave);
      if (result.success) {
        setSaveState("saved");
      } else {
        setSaveState("error");
        toast.error(result.error);
      }
      return result;
    },
    [landing.id],
  );

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSaveState("pending");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(draft), 1200);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [draft, persist]);

  // ---------- Operaciones sobre secciones ----------

  function patchDraft(patch: Partial<LandingDraft>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  function updateSections(sections: LandingSection[]) {
    patchDraft({ sections });
  }

  function addSection(type: SectionType) {
    const section: LandingSection = {
      id: crypto.randomUUID(),
      type,
      settings: structuredClone(
        sectionRegistry[type].defaults,
      ) as Record<string, unknown>,
      visible: true,
    };
    setDraft((d) => ({ ...d, sections: [...d.sections, section] }));
    setSelectedId(section.id);
  }

  function removeSection(id: string) {
    setDraft((d) => ({
      ...d,
      sections: d.sections.filter((s) => s.id !== id),
    }));
    setSelectedId((current) => (current === id ? null : current));
  }

  function toggleVisible(id: string) {
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s) =>
        s.id === id ? { ...s, visible: !s.visible } : s,
      ),
    }));
  }

  function updateSectionSettings(
    id: string,
    settings: Record<string, unknown>,
  ) {
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s) => (s.id === id ? { ...s, settings } : s)),
    }));
  }

  // ---------- Publicación ----------

  function handlePublish() {
    startPublish(async () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      const result = await publishLanding(landing.id, draft);
      if (result.success) {
        setStatus("published");
        setPublishedSnapshot(JSON.stringify(draft.sections));
        setSaveState("saved");
        toast.success(`Publicada en /${draft.slug}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleUnpublish() {
    startPublish(async () => {
      const result = await unpublishLanding(landing.id);
      if (result.success) {
        setStatus("draft");
        toast.success("Landing despublicada (vuelve a borrador)");
      } else {
        toast.error(result.error);
      }
    });
  }

  const selectedSection =
    selectedId && selectedId !== SETTINGS_PANEL_ID
      ? (draft.sections.find((s) => s.id === selectedId) ?? null)
      : null;

  return (
    <div className="flex h-dvh flex-col">
      {/* Barra superior */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Volver a landings"
          render={<Link href="/admin/landings" />}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </Button>
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="truncate text-sm font-semibold">{draft.name}</span>
          {status === "published" ? (
            <Badge className="bg-emerald-500/15 text-emerald-400">
              Publicada
            </Badge>
          ) : (
            <Badge className="bg-sky-500/15 text-sky-400">Borrador</Badge>
          )}
          {status === "published" && hasUnpublished && (
            <span
              className="text-xs text-amber-400"
              title="Hay cambios que aún no se publican"
            >
              ● cambios sin publicar
            </span>
          )}
        </div>

        <div className="flex-1" />

        <span
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
          role="status"
        >
          {saveState === "saving" && (
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          )}
          {saveState === "saved" && (
            <Check className="h-3 w-3 text-emerald-400" aria-hidden />
          )}
          {saveLabels[saveState]}
        </span>

        <div className="hidden items-center rounded-lg border border-border p-0.5 sm:flex">
          <Button
            variant={device === "desktop" ? "secondary" : "ghost"}
            size="icon"
            aria-label="Vista escritorio"
            aria-pressed={device === "desktop"}
            onClick={() => setDevice("desktop")}
            className="h-7 w-7"
          >
            <Monitor className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            variant={device === "mobile" ? "secondary" : "ghost"}
            size="icon"
            aria-label="Vista móvil"
            aria-pressed={device === "mobile"}
            onClick={() => setDevice("mobile")}
            className="h-7 w-7"
          >
            <Smartphone className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        {status === "published" && (
          <Button
            variant="outline"
            size="sm"
            render={
              <a href={`/${draft.slug}`} target="_blank" rel="noreferrer" />
            }
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            Ver página
          </Button>
        )}

        <div className="flex items-center">
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={publishing || (!hasUnpublished && status === "published")}
            className="rounded-r-none"
          >
            {publishing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <CloudUpload className="h-4 w-4" aria-hidden />
            )}
            Publicar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  size="sm"
                  aria-label="Más opciones de publicación"
                  className="rounded-l-none border-l border-black/20 px-1.5"
                />
              }
            >
              <ChevronDown className="h-4 w-4" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onSelect={handleUnpublish}
                disabled={publishing || status !== "published"}
                className="cursor-pointer"
              >
                Despublicar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Cuerpo: lista | preview | ajustes */}
      <div className="flex min-h-0 flex-1">
        <aside className="w-64 shrink-0 border-r border-border">
          <SectionList
            sections={draft.sections}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onReorder={updateSections}
            onAdd={addSection}
            onToggleVisible={toggleVisible}
            onRemove={removeSection}
          />
        </aside>

        <main className="min-w-0 flex-1 overflow-auto bg-black/50 p-4">
          <div
            className={`mx-auto h-full transition-[width] ${
              device === "mobile" ? "w-[375px]" : "w-full"
            }`}
          >
            <iframe
              ref={iframeRef}
              title="Vista previa de la landing"
              src={`/admin/landings/${landing.id}/preview`}
              onLoad={sendPreview}
              className="h-full w-full rounded-lg border border-border bg-white"
            />
          </div>
        </main>

        <aside className="w-80 shrink-0 overflow-y-auto border-l border-border">
          {selectedId === SETTINGS_PANEL_ID ? (
            <LandingSettingsPanel
              draft={draft}
              products={products.map((p) => ({ id: p.id, name: p.name }))}
              onChange={patchDraft}
            />
          ) : selectedSection ? (
            <SectionSettingsPanel
              key={selectedSection.id}
              section={selectedSection}
              onSettingsChange={(settings) =>
                updateSectionSettings(selectedSection.id, settings)
              }
            />
          ) : (
            <p className="p-6 text-center text-xs text-muted-foreground">
              Selecciona una sección para editar sus ajustes
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
