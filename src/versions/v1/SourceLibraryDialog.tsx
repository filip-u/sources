import { type ReactNode, type RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  FileText,
  GraduationCap,
  History,
  Library,
  Link2,
  MessageSquare,
  PauseCircle,
  Plus,
  Power,
  RefreshCcw,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

export type SourceType = "file" | "course-info" | "conversation-history";

export interface Source {
  id: number;
  name: string;
  type: SourceType;
  active: boolean;
  dropdownLabel: string;
  note: string;
}

interface Props {
  onClose: () => void;
  attachedIds: number[];
  onAttach: (id: number) => void;
  sources: Source[];
  setSources: (sources: Source[]) => void;
  onOpenSourceLibrary: () => void;
}

const MENU_WIDTH = 244;
const MENU_HEIGHT = 122;
const MENU_OFFSET = 6;
const VIEWPORT_PADDING = 8;

interface FloatingMenuPosition {
  left: number;
  top: number;
}

export const INITIAL_SOURCES: Source[] = [
  { id: 1,  name: "Course outline.pdf",      type: "file",                 active: true,  dropdownLabel: "Balanced",  note: "" },
  { id: 2,  name: "Brand guidelines.pdf",    type: "file",                 active: true,  dropdownLabel: "Creative",  note: "Use those brand guidelines as an example for tone of voice....e, imag" },
  { id: 3,  name: "Lesson plan draft.pdf",   type: "file",                 active: true,  dropdownLabel: "Balanced",  note: "" },
  { id: 8,  name: "",                        type: "course-info",          active: true,  dropdownLabel: "Balanced",  note: "Intro to UX Design — 8-week online course targeting career switchers with no prior design experience." },
  { id: 9,  name: "",                        type: "conversation-history", active: true,  dropdownLabel: "Balanced",  note: "Last 14 days of prompts and AI responses across this course." },
  { id: 4,  name: "Research notes.pdf",      type: "file",                 active: false, dropdownLabel: "Balanced",  note: "" },
  { id: 5,  name: "Assessment rubric.pdf",   type: "file",                 active: false, dropdownLabel: "Balanced",  note: "" },
  { id: 6,  name: "Lecture slides deck.pdf", type: "file",                 active: false, dropdownLabel: "Balanced",  note: "" },
  { id: 7,  name: "Reading list Q3.pdf",     type: "file",                 active: false, dropdownLabel: "Balanced",  note: "" },
];

function sourceLabel(source: Source) {
  if (source.type === "course-info") return "Course profile";
  if (source.type === "conversation-history") return "Conversation memory";
  return source.name;
}

function sourceDescription(source: Source) {
  if (source.type === "course-info") return "Learning goals, audience, structure, and tone for the course.";
  if (source.type === "conversation-history") return "Recent prompts and decisions made while building this course.";
  return source.note || "Global file context used across course prompts.";
}

function SourceIcon({ source }: { source: Source }) {
  if (source.type === "course-info") {
    return (
      <div className="flex size-[38px] shrink-0 items-center justify-center rounded-[8px] bg-[#ecf7f4] text-[#027b72]">
        <GraduationCap size={20} strokeWidth={1.9} />
      </div>
    );
  }

  if (source.type === "conversation-history") {
    return (
      <div className="flex size-[38px] shrink-0 items-center justify-center rounded-[8px] bg-[#f0f4ff] text-[#4d5fae]">
        <History size={19} strokeWidth={1.9} />
      </div>
    );
  }

  return (
    <div className="flex size-[34px] shrink-0 items-center justify-center rounded-[7px] bg-[#f3f1ff] text-[#6354b9]">
      <FileText size={17} strokeWidth={1.9} />
    </div>
  );
}

function StatePill({ state }: { state: "active" | "skipped" | "off" }) {
  const styles = {
    active: "border-[#bfe4db] bg-[#eefaf7] text-[#027b72]",
    skipped: "border-[#ffd89c] bg-[#fff7e8] text-[#9a5a00]",
    off: "border-[#e2e2e2] bg-[#f8f8f8] text-[#737373]",
  }[state];
  const label = state === "active" ? "Included" : state === "skipped" ? "Skipping next" : "Off";

  return (
    <span className={`inline-flex h-[24px] items-center rounded-full border px-[9px] font-['Helvetica_Neue:Medium',sans-serif] text-[12px] leading-none ${styles}`}>
      {label}
    </span>
  );
}

function MenuButton({
  children,
  onClick,
  tone = "neutral",
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: "neutral" | "teal" | "orange";
}) {
  const styles = {
    neutral: "border-[#d7d7d7] bg-white text-[#4f4f4f]",
    teal: "border-[#029c91] bg-[#f7fcfb] text-[#027b72]",
    orange: "border-[#fb8c00] bg-[#fff8ef] text-[#9a5a00]",
  }[tone];

  return (
    <button
      className={`inline-flex h-[30px] items-center justify-center gap-[6px] rounded-[7px] border px-[10px] font-['Helvetica_Neue:Medium',sans-serif] text-[13px] leading-none transition-colors hover:bg-[#f6f6f6] ${styles}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function DeactivateMenu({
  anchorRef,
  onDeactivateCompletely,
  onDeactivateForGeneration,
  onClose,
}: {
  anchorRef: RefObject<HTMLDivElement | null>;
  onDeactivateCompletely: () => void;
  onDeactivateForGeneration: () => void;
  onClose: () => void;
}) {
  const [position, setPosition] = useState<FloatingMenuPosition | null>(null);

  useLayoutEffect(() => {
    function updatePosition() {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const maxLeft = window.innerWidth - MENU_WIDTH - VIEWPORT_PADDING;
      const left = Math.min(Math.max(rect.right - MENU_WIDTH, VIEWPORT_PADDING), maxLeft);
      const opensBelow = rect.bottom + MENU_OFFSET + MENU_HEIGHT <= window.innerHeight - VIEWPORT_PADDING;
      const top = opensBelow
        ? rect.bottom + MENU_OFFSET
        : Math.max(VIEWPORT_PADDING, rect.top - MENU_HEIGHT - MENU_OFFSET);

      setPosition({ left, top });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef]);

  if (!position) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[990]" onClick={onClose} />
      <div
        className="fixed z-[1000] overflow-hidden rounded-[8px] border border-[#e0e0e0] bg-white shadow-[0px_8px_26px_rgba(0,0,0,0.14)]"
        style={{ left: position.left, top: position.top, width: MENU_WIDTH }}
      >
        <button
          className="flex w-full flex-col gap-[2px] border-none bg-transparent px-[14px] py-[11px] text-left transition-colors hover:bg-[#f8f8f8]"
          onClick={() => { onDeactivateForGeneration(); onClose(); }}
          type="button"
        >
          <span className="font-['Helvetica_Neue:Medium',sans-serif] text-[13px] leading-[1.35] text-[#333]">Skip for next generation</span>
          <span className="font-['Helvetica_Neue:Regular',sans-serif] text-[12px] leading-[1.35] text-[#828282]">Automatically comes back after this prompt.</span>
        </button>
        <div className="mx-[14px] h-px bg-[#eeeeee]" />
        <button
          className="flex w-full flex-col gap-[2px] border-none bg-transparent px-[14px] py-[11px] text-left transition-colors hover:bg-[#f8f8f8]"
          onClick={() => { onDeactivateCompletely(); onClose(); }}
          type="button"
        >
          <span className="font-['Helvetica_Neue:Medium',sans-serif] text-[13px] leading-[1.35] text-[#333]">Turn off completely</span>
          <span className="font-['Helvetica_Neue:Regular',sans-serif] text-[12px] leading-[1.35] text-[#828282]">Remove from the course context until re-enabled.</span>
        </button>
      </div>
    </>,
    document.body
  );
}

function ContextLayerRow({
  source,
  isTempInactive,
  isPermanentlyDisabled,
  onDeactivate,
  onDeactivateForGeneration,
  onReactivate,
}: {
  source: Source;
  isTempInactive: boolean;
  isPermanentlyDisabled: boolean;
  onDeactivate: () => void;
  onDeactivateForGeneration: () => void;
  onReactivate: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnchorRef = useRef<HTMLDivElement>(null);
  const state = isPermanentlyDisabled ? "off" : isTempInactive ? "skipped" : "active";

  return (
    <div className={`relative flex items-center gap-[12px] rounded-[8px] border border-[#ececec] bg-white p-[12px] transition-opacity ${state === "active" ? "" : "opacity-70"}`}>
      <SourceIcon source={source} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-[8px]">
          <p className="truncate font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.25] text-[#333]">
            {sourceLabel(source)}
          </p>
          <StatePill state={state} />
        </div>
        <p className="mt-[4px] line-clamp-2 font-['Helvetica_Neue:Regular',sans-serif] text-[12px] leading-[1.35] text-[#737373]">
          {sourceDescription(source)}
        </p>
      </div>
      <div ref={menuAnchorRef} className="relative shrink-0">
        {isPermanentlyDisabled ? (
          <MenuButton onClick={onReactivate} tone="teal">
            <RefreshCcw size={14} strokeWidth={1.9} />
            Enable
          </MenuButton>
        ) : isTempInactive ? (
          <MenuButton onClick={onReactivate} tone="orange">
            <RefreshCcw size={14} strokeWidth={1.9} />
            Include
          </MenuButton>
        ) : (
          <>
            <MenuButton onClick={() => setMenuOpen((open) => !open)}>
              Manage
              <ChevronDown size={14} strokeWidth={1.9} />
            </MenuButton>
            {menuOpen && (
              <DeactivateMenu
                anchorRef={menuAnchorRef}
                onDeactivateCompletely={onDeactivate}
                onDeactivateForGeneration={onDeactivateForGeneration}
                onClose={() => setMenuOpen(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FileSourceRow({
  source,
  isTempInactive,
  onDeactivate,
  onDeactivateForGeneration,
  onReactivate,
}: {
  source: Source;
  isTempInactive: boolean;
  onDeactivate: () => void;
  onDeactivateForGeneration: () => void;
  onReactivate: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnchorRef = useRef<HTMLDivElement>(null);

  return (
    <div className={`relative grid min-h-[56px] grid-cols-[minmax(0,1fr)_118px_126px] items-center gap-[12px] border-b border-[#eeeeee] px-[14px] py-[10px] last:border-b-0 ${isTempInactive ? "opacity-65" : ""}`}>
      <div className="flex min-w-0 items-center gap-[10px]">
        <SourceIcon source={source} />
        <div className="min-w-0">
          <p className="truncate font-['Helvetica_Neue:Medium',sans-serif] text-[13px] leading-[1.25] text-[#333]">
            {source.name}
          </p>
          <p className="mt-[3px] truncate font-['Helvetica_Neue:Regular',sans-serif] text-[12px] leading-none text-[#8a8a8a]">
            {source.note || "Global course file"}
          </p>
        </div>
      </div>
      <div className="flex justify-start">
        <StatePill state={isTempInactive ? "skipped" : "active"} />
      </div>
      <div ref={menuAnchorRef} className="relative flex justify-end">
        {isTempInactive ? (
          <MenuButton onClick={onReactivate} tone="orange">
            Include
          </MenuButton>
        ) : (
          <>
            <MenuButton onClick={() => setMenuOpen((open) => !open)}>
              Manage
              <ChevronDown size={14} strokeWidth={1.9} />
            </MenuButton>
            {menuOpen && (
              <DeactivateMenu
                anchorRef={menuAnchorRef}
                onDeactivateCompletely={onDeactivate}
                onDeactivateForGeneration={onDeactivateForGeneration}
                onClose={() => setMenuOpen(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="font-['Helvetica_Neue:Medium',sans-serif] text-[18px] leading-none text-[#333]">{value}</p>
      <p className="mt-[5px] font-['Helvetica_Neue:Regular',sans-serif] text-[12px] leading-none text-[#777]">{label}</p>
    </div>
  );
}

function HeaderIcon({ children, tone = "teal" }: { children: ReactNode; tone?: "teal" | "blue" | "purple" | "amber" }) {
  const styles = {
    teal: "bg-[#ecf7f4] text-[#027b72]",
    blue: "bg-[#f0f4ff] text-[#4d5fae]",
    purple: "bg-[#f3f1ff] text-[#6354b9]",
    amber: "bg-[#fff5e5] text-[#9a5a00]",
  }[tone];

  return (
    <div className={`flex size-[30px] shrink-0 items-center justify-center rounded-[8px] ${styles}`}>
      {children}
    </div>
  );
}

export default function SourceLibraryDialog({ onClose, sources, setSources, onOpenSourceLibrary }: Props) {
  const [draft, setDraft] = useState<Source[]>(sources);
  const [tempInactiveIds, setTempInactiveIds] = useState<number[]>([]);
  const [disabledContextIds, setDisabledContextIds] = useState<number[]>([]);
  const [kcTempInactive, setKcTempInactive] = useState(false);
  const [kcDisabled, setKcDisabled] = useState(false);
  const [kcMenuOpen, setKcMenuOpen] = useState(false);
  const kcMenuAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft((prev) => prev.map((source) => {
      const updated = sources.find((candidate) => candidate.id === source.id);
      if (updated && updated.active && !source.active) return { ...source, active: true };
      return source;
    }));
  }, [sources]);

  const fileSources = draft.filter((source) => source.type === "file");
  const activeFileSources = fileSources.filter((source) => source.active);
  const contextSources = draft.filter((source) => source.type !== "file");
  const enabledContextSources = contextSources.filter((source) => source.active && !disabledContextIds.includes(source.id));
  const temporarilySkippedSources = [...activeFileSources, ...enabledContextSources].filter((source) => tempInactiveIds.includes(source.id));
  const skippedCount = kcTempInactive ? activeFileSources.length + enabledContextSources.length : temporarilySkippedSources.length;
  const includedNowCount = kcDisabled || kcTempInactive
    ? 0
    : [...activeFileSources, ...enabledContextSources].filter((source) => !tempInactiveIds.includes(source.id)).length;
  const statusCopy = kcDisabled
    ? "Knowledge Center is off. The AI will answer without course context."
    : kcTempInactive
      ? "Context is paused for the next generation only."
      : "Every prompt starts with this course context.";

  function activate(id: number) {
    setDraft(draft.map((source) => (source.id === id ? { ...source, active: true } : source)));
    setTempInactiveIds((prev) => prev.filter((sourceId) => sourceId !== id));
  }

  function deactivate(id: number, type: SourceType) {
    if (type === "file") {
      setDraft(draft.map((source) => (source.id === id ? { ...source, active: false } : source)));
      return;
    }

    setDraft(draft.map((source) => (source.id === id ? { ...source, active: false } : source)));
    setDisabledContextIds((prev) => prev.includes(id) ? prev : [...prev, id]);
  }

  function reactivateContext(id: number) {
    setDraft(draft.map((source) => (source.id === id ? { ...source, active: true } : source)));
    setDisabledContextIds((prev) => prev.filter((sourceId) => sourceId !== id));
    setTempInactiveIds((prev) => prev.filter((sourceId) => sourceId !== id));
  }

  function deactivateForGeneration(id: number) {
    setTempInactiveIds((prev) => prev.includes(id) ? prev : [...prev, id]);
  }

  function handleSave() {
    setSources(kcDisabled ? draft.map((source) => ({ ...source, active: false })) : draft);
    onClose();
  }

  return (
    <div className="flex size-full flex-col overflow-clip rounded-[10px] bg-white shadow-[0px_0px_40px_0px_rgba(0,0,0,0.16)]">
      <div className="shrink-0 border-b border-[#e0e0e0] bg-white">
        <div className="flex items-center justify-between px-[18px] py-[16px]">
          <div className="flex min-w-0 items-center gap-[16px]">
            <div className="flex min-w-0 items-center">
              <p className="whitespace-nowrap font-['Roboto:Medium',sans-serif] text-[20px] font-medium leading-[1.15] text-[#242424]">
                Knowledge Center
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-[8px]">
              <button
                className="inline-flex h-[32px] items-center gap-[7px] rounded-[7px] border border-[#029c91] bg-[#f7fcfb] px-[10px] font-['Helvetica_Neue:Medium',sans-serif] text-[13px] leading-none text-[#027b72]"
                type="button"
              >
                <Upload size={15} strokeWidth={1.9} />
                Upload
              </button>
              <button
                className="inline-flex h-[32px] items-center gap-[7px] rounded-[7px] border border-[#d6d6d6] bg-white px-[10px] font-['Helvetica_Neue:Medium',sans-serif] text-[13px] leading-none text-[#4f4f4f]"
                onClick={onOpenSourceLibrary}
                type="button"
              >
                <Plus size={15} strokeWidth={1.9} />
                Source library
              </button>
            </div>
          </div>
          <div className="flex shrink-0 items-center">
            <button
              aria-label="Close"
              className="flex size-[32px] items-center justify-center rounded-[7px] border-none bg-transparent text-[#4f4f4f] transition-colors hover:bg-[#f5f5f5]"
              onClick={onClose}
              type="button"
            >
              <X size={18} strokeWidth={1.9} />
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#fbfbfa]">
        <div className="grid grid-cols-[minmax(0,1fr)_294px] gap-[16px] p-[18px]">
          <div className="min-w-0 space-y-[14px]">
            <section className="rounded-[9px] border border-[#dfe9e6] bg-white p-[16px]">
              <div className="flex items-start justify-between gap-[16px]">
                <div className="min-w-0">
                  <div className="flex items-center gap-[10px]">
                    <HeaderIcon>
                      <Sparkles size={17} strokeWidth={2.1} />
                    </HeaderIcon>
                    <p className="font-['Roboto:Medium',sans-serif] text-[16px] font-medium leading-[1.2] text-[#242424]">
                      Course-aware AI is {kcDisabled ? "off" : kcTempInactive ? "paused" : "ready"}
                    </p>
                  </div>
                  <p className="mt-[7px] max-w-[560px] font-['Helvetica_Neue:Regular',sans-serif] text-[13px] leading-[1.45] text-[#666]">
                    {statusCopy}
                  </p>
                </div>
                <div ref={kcMenuAnchorRef} className="relative shrink-0">
                  {kcDisabled ? (
                    <MenuButton onClick={() => setKcDisabled(false)} tone="teal">
                      <Power size={14} strokeWidth={1.9} />
                      Enable all
                    </MenuButton>
                  ) : kcTempInactive ? (
                    <MenuButton onClick={() => setKcTempInactive(false)} tone="orange">
                      <RefreshCcw size={14} strokeWidth={1.9} />
                      Resume
                    </MenuButton>
                  ) : (
                    <>
                      <MenuButton onClick={() => setKcMenuOpen((open) => !open)}>
                        Deactivate all
                        <ChevronDown size={14} strokeWidth={1.9} />
                      </MenuButton>
                      {kcMenuOpen && (
                        <DeactivateMenu
                          anchorRef={kcMenuAnchorRef}
                          onDeactivateCompletely={() => setKcDisabled(true)}
                          onDeactivateForGeneration={() => setKcTempInactive(true)}
                          onClose={() => setKcMenuOpen(false)}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="mt-[16px] grid grid-cols-3 gap-[10px]">
                <SummaryMetric label="Included now" value={String(includedNowCount)} />
                <SummaryMetric label="Local layers" value={`${enabledContextSources.length}/${contextSources.length}`} />
                <SummaryMetric label="Global files" value={String(activeFileSources.length)} />
              </div>
            </section>

            <section className={`space-y-[10px] transition-opacity ${kcDisabled || kcTempInactive ? "opacity-45 pointer-events-none" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[10px]">
                  <HeaderIcon>
                    <GraduationCap size={17} strokeWidth={2} />
                  </HeaderIcon>
                  <div>
                    <p className="font-['Roboto:Medium',sans-serif] text-[15px] font-medium leading-[1.2] text-[#242424]">Local course context</p>
                    <p className="mt-[4px] font-['Helvetica_Neue:Regular',sans-serif] text-[12px] leading-none text-[#828282]">
                      The durable course lens applied before uploaded files.
                    </p>
                  </div>
                </div>
                <span className="font-['Helvetica_Neue:Medium',sans-serif] text-[12px] leading-none text-[#027b72]">
                  Always available
                </span>
              </div>
              <div className="space-y-[8px]">
                {contextSources.map((source) => (
                  <ContextLayerRow
                    key={source.id}
                    source={source}
                    isTempInactive={tempInactiveIds.includes(source.id)}
                    isPermanentlyDisabled={!source.active || disabledContextIds.includes(source.id)}
                    onDeactivate={() => deactivate(source.id, source.type)}
                    onDeactivateForGeneration={() => deactivateForGeneration(source.id)}
                    onReactivate={() => reactivateContext(source.id)}
                  />
                ))}
              </div>
            </section>

            <section className={`transition-opacity ${kcDisabled || kcTempInactive ? "opacity-45 pointer-events-none" : ""}`}>
              <div className="mb-[10px] flex items-center justify-between">
                <div className="flex items-center gap-[10px]">
                  <HeaderIcon tone="purple">
                    <FileText size={16} strokeWidth={2} />
                  </HeaderIcon>
                  <div>
                    <p className="font-['Roboto:Medium',sans-serif] text-[15px] font-medium leading-[1.2] text-[#242424]">Uploaded global files</p>
                    <p className="mt-[4px] font-['Helvetica_Neue:Regular',sans-serif] text-[12px] leading-none text-[#828282]">
                      Reference material that follows the whole course.
                    </p>
                  </div>
                </div>
                <button
                  className="inline-flex h-[30px] items-center gap-[6px] rounded-[7px] border border-[#d6d6d6] bg-white px-[10px] font-['Helvetica_Neue:Medium',sans-serif] text-[13px] leading-none text-[#4f4f4f]"
                  onClick={onOpenSourceLibrary}
                  type="button"
                >
                  <Plus size={14} strokeWidth={1.9} />
                  Add file
                </button>
              </div>
              <div className="overflow-hidden rounded-[8px] border border-[#e5e5e5] bg-white">
                {activeFileSources.length > 0 ? (
                  activeFileSources.map((source) => (
                    <FileSourceRow
                      key={source.id}
                      source={source}
                      isTempInactive={tempInactiveIds.includes(source.id)}
                      onDeactivate={() => deactivate(source.id, source.type)}
                      onDeactivateForGeneration={() => deactivateForGeneration(source.id)}
                      onReactivate={() => activate(source.id)}
                    />
                  ))
                ) : (
                  <div className="flex min-h-[118px] flex-col items-center justify-center gap-[8px] px-[18px] text-center">
                    <FileText size={22} color="#9a9a9a" strokeWidth={1.7} />
                    <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[13px] leading-[1.4] text-[#777]">
                      No global files are active yet. Add source files to make the AI more grounded in this course.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-[12px]">
            <section className="rounded-[9px] border border-[#e6e6e6] bg-white p-[14px]">
              <div className="flex items-center gap-[9px]">
                <HeaderIcon tone="blue">
                  <BookOpen size={16} strokeWidth={2} />
                </HeaderIcon>
                <p className="font-['Roboto:Medium',sans-serif] text-[15px] font-medium leading-[1.2] text-[#242424]">Context map</p>
              </div>
              <div className="mt-[14px] space-y-[11px]">
                <div className="flex items-center gap-[9px]">
                  <div className="flex size-[26px] items-center justify-center rounded-full bg-[#ecf7f4] text-[#027b72]">
                    <CheckCircle2 size={15} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="font-['Roboto:Medium',sans-serif] text-[12.5px] font-medium leading-[1.25] text-[#333]">Course profile</p>
                    <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[11px] leading-[1.3] text-[#828282]">Goals, audience, pacing</p>
                  </div>
                </div>
                <div className="ml-[13px] h-[18px] w-px bg-[#e4e4e4]" />
                <div className="flex items-center gap-[9px]">
                  <div className="flex size-[26px] items-center justify-center rounded-full bg-[#f0f4ff] text-[#4d5fae]">
                    <MessageSquare size={14} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="font-['Roboto:Medium',sans-serif] text-[12.5px] font-medium leading-[1.25] text-[#333]">Conversation memory</p>
                    <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[11px] leading-[1.3] text-[#828282]">Recent decisions and prompts</p>
                  </div>
                </div>
                <div className="ml-[13px] h-[18px] w-px bg-[#e4e4e4]" />
                <div className="flex items-center gap-[9px]">
                  <div className="flex size-[26px] items-center justify-center rounded-full bg-[#f3f1ff] text-[#6354b9]">
                    <FileText size={14} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="font-['Roboto:Medium',sans-serif] text-[12.5px] font-medium leading-[1.25] text-[#333]">Global files</p>
                    <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[11px] leading-[1.3] text-[#828282]">Outlines, rubrics, decks</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[9px] border border-[#e6e6e6] bg-white p-[14px]">
              <div className="flex items-center gap-[9px]">
                <HeaderIcon tone="amber">
                  <PauseCircle size={16} strokeWidth={2} />
                </HeaderIcon>
                <p className="font-['Roboto:Medium',sans-serif] text-[15px] font-medium leading-[1.2] text-[#242424]">Next generation</p>
              </div>
              <p className="mt-[9px] font-['Helvetica_Neue:Regular',sans-serif] text-[12px] leading-[1.45] text-[#737373]">
                {skippedCount > 0
                  ? `${skippedCount} source ${skippedCount === 1 ? "is" : "are"} set to skip the next response.`
                  : "No temporary exclusions. Your next AI response will use the full active context."}
              </p>
            </section>

            <section className="rounded-[9px] border border-[#e6e6e6] bg-white p-[14px]">
              <div className="flex items-center gap-[9px]">
                <HeaderIcon>
                  <Link2 size={16} strokeWidth={2} />
                </HeaderIcon>
                <p className="font-['Roboto:Medium',sans-serif] text-[15px] font-medium leading-[1.2] text-[#242424]">What this changes</p>
              </div>
              <p className="mt-[9px] font-['Helvetica_Neue:Regular',sans-serif] text-[12px] leading-[1.45] text-[#737373]">
                Course-level context is used globally. Prompt attachments still work separately for one-off tasks.
              </p>
            </section>
          </aside>
        </div>
      </div>

      <div className="shrink-0 border-t border-[#e5e5e5] bg-white">
        <div className="flex items-center justify-end gap-[9px] px-[18px] py-[14px]">
          <button
            className="rounded-[6px] border-none bg-[#029c91] px-[16px] py-[10px] font-['Helvetica_Neue:Medium',sans-serif] text-[15px] leading-[1.2] text-white"
            onClick={handleSave}
            type="button"
          >
            Save context
          </button>
          <div className="flex items-center gap-[9px]">
            <button
              className="rounded-[6px] border border-[#029c91] bg-[#f9f9f9] px-[16px] py-[10px] font-['Helvetica_Neue:Medium',sans-serif] text-[15px] leading-[1.2] text-[#029c91]"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
