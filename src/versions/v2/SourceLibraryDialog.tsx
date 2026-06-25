import { useEffect, useLayoutEffect, useRef, useState, type Dispatch, type MouseEvent, type SetStateAction } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight, Info, Library, Power, Trash2, Upload, X } from "lucide-react";
import { OTHER_LIBRARIES, type LibraryGroup } from "./sourceLibraryData";

export type SourceType = "file" | "course-info" | "conversation-history";

export type DeactivationMode = "none" | "temporary" | "complete";
type SourceFollowingMode = "strict" | "balanced" | "creative";

export interface Source {
  id: number;
  originSourceId?: number;
  name: string;
  type: SourceType;
  active: boolean;
  dropdownLabel: string;
  note: string;
}

interface Props {
  onClose: () => void;
  currentCourseName: string;
  attachedIds: number[];
  onAttach: (id: number) => void;
  sources: Source[];
  setSources: Dispatch<SetStateAction<Source[]>>;
  justDuplicatedSourceIds?: number[];
  deactivationMode: DeactivationMode;
  onSetDeactivationMode: (mode: DeactivationMode) => void;
  multiLibrary: boolean;
  showSourceLibrariesBreadcrumb: boolean;
  showInstructions: boolean;
  showPromptButton: boolean;
  onOpenSourceLibrary: () => void;
  onOpenOtherCourseLibrary: () => void;
}

interface InstructionEditorPosition {
  left: number;
  top: number;
}

const INSTRUCTION_EDITOR_WIDTH = 360;
const INSTRUCTION_EDITOR_GAP = 8;
const VIEWPORT_PADDING = 16;
const SOURCE_TABLE_COLUMNS = "416px minmax(0,342px) 111px 126px 78px";
const SOURCE_TABLE_COLUMNS_WITH_PROMPT = "336px minmax(0,316px) 91px 126px 126px 78px";
const LIBRARY_TABLE_COLUMNS = "minmax(0,1fr) 220px";
const FOREIGN_LIBRARY_COLUMNS = "minmax(0,1fr) minmax(0,320px) 160px 160px";
const FOREIGN_LIBRARY_COLUMNS_NO_INSTRUCTIONS = "minmax(0,1fr) 160px 160px";
const TOGGLE_REORDER_DELAY = 210;
const SOURCE_FOLLOWING_OPTIONS: { mode: SourceFollowingMode; label: string; description: string }[] = [
  {
    mode: "strict",
    label: "Strict",
    description: "AI should stay very close to the source material and avoid adding unsupported details.",
  },
  {
    mode: "balanced",
    label: "Balanced",
    description: "AI should use sources as the main grounding while allowing useful synthesis and light interpretation.",
  },
  {
    mode: "creative",
    label: "Creative",
    description: "AI can take more inspiration from sources and adapt them more freely for the prompt.",
  },
];

function compareSourcesByName(a: Source, b: Source) {
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

function orderSourcesByContext(fileSources: Source[]) {
  return [
    ...fileSources.filter((source) => source.active),
    ...fileSources.filter((source) => !source.active).sort(compareSourcesByName),
  ];
}

function orderSourcesByIds(fileSources: Source[], sourceOrder: number[]) {
  if (sourceOrder.length === 0) {
    return orderSourcesByContext(fileSources);
  }

  const sourceById = new Map(fileSources.map((source) => [source.id, source]));
  const orderedIds = [
    ...sourceOrder.filter((id) => sourceById.has(id)),
    ...orderSourcesByContext(fileSources).map((source) => source.id).filter((id) => !sourceOrder.includes(id)),
  ];

  return orderedIds.map((id) => sourceById.get(id)).filter((source): source is Source => Boolean(source));
}

function buildContextOrder(fileSources: Source[], currentOrder: number[], toggledId: number, toggledActive: boolean) {
  const orderedSources = orderSourcesByIds(fileSources, currentOrder);
  const activeIds = orderedSources
    .filter((source) => source.active && source.id !== toggledId)
    .map((source) => source.id);
  const inactiveIds = fileSources
    .filter((source) => !source.active)
    .sort(compareSourcesByName)
    .map((source) => source.id);

  if (toggledActive) {
    return [
      ...activeIds,
      toggledId,
      ...inactiveIds,
    ];
  }

  return [
    ...activeIds,
    ...inactiveIds,
  ];
}

function getEffectiveFileSources(sourceList: Source[], temporarilyInactiveIds: number[]) {
  return sourceList
    .filter((source) => source.type === "file")
    .map((source) => (
      temporarilyInactiveIds.includes(source.id) ? { ...source, active: false } : source
    ));
}

function InstructionTextButton({
  children,
  onClick,
}: {
  children: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      className="border-none bg-transparent p-0 font-['Helvetica_Neue:Medium',sans-serif] text-[13px] leading-[1.4] text-[#01837a] transition-opacity hover:opacity-75"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function ContextToggle({
  active,
  label,
  onToggle,
}: {
  active: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className={`relative h-[26px] w-[59px] shrink-0 rounded-[18px] border-none p-0 transition-colors duration-200 ease-out ${
        active ? "bg-[#029c91]" : "bg-[#e0e0e0]"
      }`}
      onClick={onToggle}
      type="button"
    >
      <span
        className={`absolute left-[11px] top-1/2 -translate-y-1/2 font-['Helvetica_Neue:Medium',sans-serif] text-[9px] leading-none text-white transition-opacity duration-150 ${
          active ? "opacity-100" : "opacity-0"
        }`}
      >
        ON
      </span>
      <span
        className={`absolute right-[8px] top-1/2 -translate-y-1/2 font-['Helvetica_Neue:Medium',sans-serif] text-[9px] leading-none text-[#4f4f4f] transition-opacity duration-150 ${
          active ? "opacity-0" : "opacity-100"
        }`}
      >
        OFF
      </span>
      <span
        className={`absolute left-[3px] top-[3px] block size-[20px] rounded-full bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.16)] transition-transform duration-200 ease-out ${
          active ? "translate-x-[33px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function libraryTitle(library: LibraryGroup) {
  return `Source library for ${library.name}`;
}

function orderLibrarySourcesForDisplay(group: LibraryGroup) {
  return [
    ...group.sources.filter((source) => source.active),
    ...group.sources.filter((source) => !source.active),
  ];
}

function SourceLibrariesList({
  libraries,
  onSelectLibrary,
}: {
  libraries: LibraryGroup[];
  onSelectLibrary: (id: string) => void;
}) {
  return (
    <div className="w-full overflow-hidden">
      <div className="grid w-full" style={{ gridTemplateColumns: LIBRARY_TABLE_COLUMNS }}>
        <div className="flex h-[36px] items-center border-b border-[#f2f2f2] bg-[#f9f9f9] p-[8px]">
          <span className="font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.4] text-[#828282]">
            Course name
          </span>
        </div>
        <div className="flex h-[36px] items-center justify-end border-b border-[#f2f2f2] bg-[#f9f9f9] p-[8px]">
          <span className="font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.4] text-[#828282]">
            Sources
          </span>
        </div>
      </div>

      {libraries.map((library) => (
        <button
          key={library.id}
          className="grid w-full cursor-pointer text-left transition-colors hover:bg-[#fbfbfb]"
          onClick={() => onSelectLibrary(library.id)}
          style={{ gridTemplateColumns: LIBRARY_TABLE_COLUMNS }}
          type="button"
        >
          <div className="flex h-[56px] min-w-0 items-center gap-[12px] border-b border-[#f2f2f2] p-[8px]">
            <div className="flex size-[34px] shrink-0 items-center justify-center rounded-[7px] bg-[#eef0ff] text-[#4f5fb8]">
              <Library size={18} strokeWidth={1.9} />
            </div>
            <div className="flex min-w-0 items-center gap-[8px]">
              <span className="truncate font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.4] text-[#333]">
                {library.name}
              </span>
              {library.current && (
                <span className="shrink-0 rounded-full bg-[#f0faf4] px-[8px] py-[2px] font-['Helvetica_Neue:Medium',sans-serif] text-[11px] leading-none text-[#2d7a4d]">
                  This course
                </span>
              )}
            </div>
          </div>
          <div className="flex h-[56px] items-center justify-end gap-[8px] border-b border-[#f2f2f2] p-[8px]">
            <span className="font-['Helvetica_Neue:Regular',sans-serif] text-[13px] leading-none text-[#828282]">
              {library.sources.length}
            </span>
            <ChevronRight size={18} strokeWidth={1.8} className="text-[#bdbdbd]" />
          </div>
        </button>
      ))}
    </div>
  );
}

function ReadOnlyLibrarySources({
  library,
  showInstructions,
  attachedIds,
  sources,
  selectedPromptIds,
  onTogglePrompt,
  onAddAsContext,
}: {
  library: LibraryGroup;
  showInstructions: boolean;
  attachedIds: number[];
  sources: Source[];
  selectedPromptIds: number[];
  onTogglePrompt: (source: Source) => void;
  onAddAsContext: (source: Source) => void;
}) {
  const columns = showInstructions ? FOREIGN_LIBRARY_COLUMNS : FOREIGN_LIBRARY_COLUMNS_NO_INSTRUCTIONS;

  return (
    <div className="w-full overflow-hidden">
      <div className="grid w-full" style={{ gridTemplateColumns: columns }}>
        <div className="flex h-[36px] items-center border-b border-[#f2f2f2] bg-[#f9f9f9] p-[8px]">
          <span className="font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.4] text-[#828282]">
            File name
          </span>
        </div>
        {showInstructions && (
          <div className="flex h-[36px] items-center border-b border-[#f2f2f2] bg-[#f9f9f9] p-[8px]">
            <span className="font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.4] text-[#828282]">
              How to use this file
            </span>
          </div>
        )}
        <div className="flex h-[36px] items-center justify-end border-b border-[#f2f2f2] bg-[#f9f9f9] p-[8px]">
          <span className="font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.4] text-[#828282]">
            Prompt
          </span>
        </div>
        <div className="flex h-[36px] items-center justify-end border-b border-[#f2f2f2] bg-[#f9f9f9] p-[8px]">
          <span className="font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.4] text-[#828282]">
            Context
          </span>
        </div>
      </div>

      {orderLibrarySourcesForDisplay(library).map((source) => {
        const existingSource = sources.find((candidate) => candidate.id === source.id);
        const isAttached = attachedIds.includes(source.id);
        const selectedForPrompt = selectedPromptIds.includes(source.id);
        const addedAsContext = Boolean(existingSource?.active);
        const promptLabel = isAttached ? "Attached" : selectedForPrompt ? "Will attach" : "Attach to prompt";
        const contextLabel = addedAsContext ? "Added as context" : "Add as context";

        return (
          <div
            key={source.id}
            className="grid w-full text-left"
            style={{ gridTemplateColumns: columns }}
          >
            <div className="flex h-[56px] min-w-0 items-center border-b border-[#f2f2f2] p-[8px]">
              <span className="min-w-0 flex-1 break-words font-['Helvetica_Neue:Medium',sans-serif] text-[13px] font-semibold leading-[1.4] text-[#4f4f4f]">
                {source.name}
              </span>
            </div>
            {showInstructions && (
              <div className="flex h-[56px] min-w-0 items-center border-b border-[#f2f2f2] p-[8px]">
                {source.note.trim().length > 0 ? (
                  <span className="line-clamp-2 font-['Helvetica_Neue:Italic',sans-serif] text-[13px] italic leading-[1.4] text-[#6f6f6f]">
                    {source.note}
                  </span>
                ) : (
                  <span className="font-['Helvetica_Neue:Regular',sans-serif] text-[13px] leading-[1.4] text-[#bdbdbd]">—</span>
                )}
              </div>
            )}
            <div className="flex h-[56px] items-center justify-end border-b border-[#f2f2f2] p-[8px]">
              <button
                className={`flex h-[30px] items-center justify-center rounded-[4px] px-[10px] font-['Helvetica_Neue:Medium',sans-serif] text-[13px] leading-none transition-colors disabled:cursor-not-allowed ${
                  selectedForPrompt
                    ? "border-none bg-[#e0f2f1] text-[#00796b]"
                    : "border border-[#029c91] bg-[#f9f9f9] text-[#029c91] disabled:border-[#d6d6d6] disabled:bg-[#f2f2f2] disabled:text-[#9a9a9a]"
                }`}
                disabled={isAttached}
                onClick={() => onTogglePrompt(source)}
                type="button"
              >
                {promptLabel}
              </button>
            </div>
            <div className="flex h-[56px] items-center justify-end border-b border-[#f2f2f2] p-[8px]">
              <button
                className="flex h-[30px] items-center justify-center rounded-[4px] border border-[#029c91] bg-[#f9f9f9] px-[10px] font-['Helvetica_Neue:Medium',sans-serif] text-[13px] leading-none text-[#029c91] transition-colors hover:bg-[#eefaf9] disabled:cursor-not-allowed disabled:border-[#d6d6d6] disabled:bg-[#f2f2f2] disabled:text-[#9a9a9a]"
                disabled={addedAsContext}
                onClick={() => onAddAsContext(source)}
                type="button"
              >
                {contextLabel}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SourceLibraryDialog({ onClose, currentCourseName, attachedIds, onAttach, sources, setSources, justDuplicatedSourceIds = [], deactivationMode, onSetDeactivationMode, multiLibrary, showSourceLibrariesBreadcrumb, showInstructions, showPromptButton, onOpenSourceLibrary, onOpenOtherCourseLibrary }: Props) {
  const allDeactivated = deactivationMode !== "none";
  const [sourceOrder, setSourceOrder] = useState<number[]>([]);
  const [temporarilyInactiveIds, setTemporarilyInactiveIds] = useState<number[]>([]);
  const [pendingPromptSourceIds, setPendingPromptSourceIds] = useState<number[]>([]);
  const [deactivateMenuOpen, setDeactivateMenuOpen] = useState(false);
  const [sourceFollowingMenuOpen, setSourceFollowingMenuOpen] = useState(false);
  const [sourceFollowingMode, setSourceFollowingMode] = useState<SourceFollowingMode>("balanced");
  const [editingInstructionId, setEditingInstructionId] = useState<number | null>(null);
  const [instructionEditorPosition, setInstructionEditorPosition] = useState<InstructionEditorPosition | null>(null);
  const [instructionDraft, setInstructionDraft] = useState("");
  const instructionPopoverAnchorRefs = useRef<Record<number, HTMLSpanElement | null>>({});
  const rowRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const deactivateButtonRef = useRef<HTMLButtonElement | null>(null);
  const deactivateMenuRef = useRef<HTMLDivElement | null>(null);
  const sourceFollowingButtonRef = useRef<HTMLButtonElement | null>(null);
  const sourceFollowingMenuRef = useRef<HTMLDivElement | null>(null);
  const previousRowRectsRef = useRef<Map<number, DOMRect>>(new Map());
  const reorderTimeoutRef = useRef<number | null>(null);

  const fileSources = getEffectiveFileSources(sources, temporarilyInactiveIds);
  const activeSourceCount = fileSources.filter((source) => source.active).length;
  const permanentlyActiveSourceCount = sources.filter((source) => source.type === "file" && source.active).length;
  const orderedSources = orderSourcesByIds(fileSources, sourceOrder);
  const currentLibrary: LibraryGroup = {
    id: "current",
    name: currentCourseName,
    current: true,
    sources: sources.filter((source) => source.type === "file"),
  };
  const libraries = [currentLibrary, ...OTHER_LIBRARIES];
  const [activeLibraryId, setActiveLibraryId] = useState<string | null>("current");
  const activeLibrary = multiLibrary
    ? libraries.find((library) => library.id === activeLibraryId) ?? null
    : currentLibrary;
  const librarySourcesById = new Map(libraries.flatMap((library) => library.sources).map((source) => [source.id, source]));
  const pendingPromptCount = pendingPromptSourceIds.length;
  const currentLibraryUsesBrowseActions = Boolean(activeLibrary?.current && showSourceLibrariesBreadcrumb);
  const activeLibraryUsesBrowseActions = Boolean(activeLibrary && (!activeLibrary.current || currentLibraryUsesBrowseActions));
  const showCurrentPromptButtons = showPromptButton && Boolean(activeLibrary?.current) && !currentLibraryUsesBrowseActions;
  const sourceTableColumns = showCurrentPromptButtons ? SOURCE_TABLE_COLUMNS_WITH_PROMPT : SOURCE_TABLE_COLUMNS;
  const sourceFollowingLabel = SOURCE_FOLLOWING_OPTIONS.find((option) => option.mode === sourceFollowingMode)?.label ?? "Balanced";

  useEffect(() => {
    return () => {
      if (reorderTimeoutRef.current !== null) {
        window.clearTimeout(reorderTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!deactivateMenuOpen && !sourceFollowingMenuOpen) return;

    function handlePointerDown(event: MouseEvent | globalThis.MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (deactivateButtonRef.current?.contains(target)) return;
      if (deactivateMenuRef.current?.contains(target)) return;
      if (sourceFollowingButtonRef.current?.contains(target)) return;
      if (sourceFollowingMenuRef.current?.contains(target)) return;

      setDeactivateMenuOpen(false);
      setSourceFollowingMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [deactivateMenuOpen, sourceFollowingMenuOpen]);

  useLayoutEffect(() => {
    const previousRects = previousRowRectsRef.current;
    if (previousRects.size === 0) return;

    Object.entries(rowRefs.current).forEach(([id, element]) => {
      if (!element) return;

      const previousRect = previousRects.get(Number(id));
      if (!previousRect) return;

      const nextRect = element.getBoundingClientRect();
      const deltaY = previousRect.top - nextRect.top;
      if (Math.abs(deltaY) < 1) return;

      element.style.transition = "none";
      element.style.transform = `translateY(${deltaY}px)`;
      element.style.zIndex = "2";

      window.requestAnimationFrame(() => {
        element.style.transition = "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)";
        element.style.transform = "translateY(0)";
      });

      window.setTimeout(() => {
        element.style.transition = "";
        element.style.transform = "";
        element.style.zIndex = "";
      }, 300);
    });

    previousRects.clear();
  }, [sourceOrder]);

  function updateSource(id: number, updates: Partial<Source>) {
    setSources(sources.map((source) => (source.id === id ? { ...source, ...updates } : source)));
  }

  function toggleContext(source: Source) {
    const originalSource = sources.find((candidate) => candidate.id === source.id);
    const isTemporarilyInactive = temporarilyInactiveIds.includes(source.id);
    const nextActive = !source.active;
    const currentOrderIds = orderedSources.map((candidate) => candidate.id);
    const nextTemporarilyInactiveIds = isTemporarilyInactive
      ? temporarilyInactiveIds.filter((id) => id !== source.id)
      : temporarilyInactiveIds.filter((id) => id !== source.id);
    const nextSources = isTemporarilyInactive && originalSource?.active
      ? sources
      : sources.map((candidate) => (
        candidate.id === source.id ? { ...candidate, active: nextActive } : candidate
      ));
    const nextFileSources = getEffectiveFileSources(nextSources, nextTemporarilyInactiveIds);
    const nextOrder = buildContextOrder(
      nextFileSources,
      currentOrderIds,
      source.id,
      nextActive
    );

    setSourceOrder(currentOrderIds);
    setTemporarilyInactiveIds(nextTemporarilyInactiveIds);
    setSources(nextSources);

    if (reorderTimeoutRef.current !== null) {
      window.clearTimeout(reorderTimeoutRef.current);
    }

    reorderTimeoutRef.current = window.setTimeout(() => {
      previousRowRectsRef.current = new Map(
        Object.entries(rowRefs.current)
          .filter((entry): entry is [string, HTMLDivElement] => Boolean(entry[1]))
          .map(([id, element]) => [Number(id), element.getBoundingClientRect()])
      );
      setSourceOrder(nextOrder);
      reorderTimeoutRef.current = null;
    }, TOGGLE_REORDER_DELAY);
  }

  function removeSource(source: Source) {
    if (editingInstructionId === source.id) {
      cancelInstructionEdit();
    }

    if (attachedIds.includes(source.id)) {
      onAttach(source.id);
    }

    delete rowRefs.current[source.id];
    delete instructionPopoverAnchorRefs.current[source.id];
    setTemporarilyInactiveIds((ids) => ids.filter((id) => id !== source.id));
    setSourceOrder((order) => order.filter((id) => id !== source.id));
    setSources(sources.filter((candidate) => candidate.id !== source.id));
  }

  function copySourceToCurrentLibrary(source: Source, active: boolean) {
    setSources((currentSources) => {
      const existingIndex = currentSources.findIndex((candidate) => candidate.id === source.id);
      const nextSource = {
        ...source,
        active,
      };

      if (existingIndex < 0) {
        return [...currentSources, nextSource];
      }

      return currentSources.map((candidate) => (
        candidate.id === source.id
          ? {
            ...candidate,
            name: source.name,
            type: source.type,
            dropdownLabel: source.dropdownLabel,
            note: source.note,
            active: active || candidate.active,
          }
          : candidate
      ));
    });
  }

  function togglePendingPromptSource(source: Source) {
    if (attachedIds.includes(source.id)) return;

    setPendingPromptSourceIds((ids) => (
      ids.includes(source.id)
        ? ids.filter((id) => id !== source.id)
        : [...ids, source.id]
    ));
  }

  function addForeignSourceAsContext(source: Source) {
    copySourceToCurrentLibrary(source, true);
    setPendingPromptSourceIds((ids) => ids.filter((id) => id !== source.id));
  }

  function attachPendingPromptSources() {
    if (pendingPromptCount === 0) return;

    const selectedSources = pendingPromptSourceIds
      .map((id) => librarySourcesById.get(id))
      .filter((source): source is Source => Boolean(source));

    setSources((currentSources) => {
      const nextSources = [...currentSources];

      selectedSources.forEach((source) => {
        const existingIndex = nextSources.findIndex((candidate) => candidate.id === source.id);

        if (existingIndex >= 0) {
          nextSources[existingIndex] = {
            ...nextSources[existingIndex],
            name: source.name,
            type: source.type,
            dropdownLabel: source.dropdownLabel,
            note: source.note,
          };
        } else {
          nextSources.push({ ...source, active: false });
        }
      });

      return nextSources;
    });

    selectedSources.forEach((source) => {
      if (!attachedIds.includes(source.id)) {
        onAttach(source.id);
      }
    });
    setPendingPromptSourceIds([]);
  }

  function deactivateAllSources() {
    // Master "off" switch: keep every source's individual toggle state intact and
    // simply dim the whole library. Clicking Activate restores the prior state.
    setDeactivateMenuOpen(false);
    setTemporarilyInactiveIds([]);
    onSetDeactivationMode("complete");
  }

  function activateAllSources() {
    onSetDeactivationMode("none");
  }

  function temporarilyDeactivateAllSources() {
    if (activeSourceCount === 0) return;

    // Same dormant overlay as a complete deactivation, but scoped to a single
    // generation — toggle states are preserved and the library simply dims.
    setDeactivateMenuOpen(false);
    onSetDeactivationMode("temporary");
  }

  function beginInstructionEdit(source: Source, anchor: HTMLElement) {
    const rect = anchor.getBoundingClientRect();
    const maxLeft = window.innerWidth - INSTRUCTION_EDITOR_WIDTH - VIEWPORT_PADDING;
    const left = Math.min(Math.max(rect.left, VIEWPORT_PADDING), maxLeft);
    const top = Math.min(
      rect.bottom + INSTRUCTION_EDITOR_GAP,
      window.innerHeight - 190 - VIEWPORT_PADDING
    );

    setEditingInstructionId(source.id);
    setInstructionEditorPosition({ left, top: Math.max(VIEWPORT_PADDING, top) });
    setInstructionDraft(source.note);
  }

  function cancelInstructionEdit() {
    setEditingInstructionId(null);
    setInstructionEditorPosition(null);
    setInstructionDraft("");
  }

  function saveInstructionEdit() {
    if (editingInstructionId === null) return;

    updateSource(editingInstructionId, { note: instructionDraft.trim() });
    cancelInstructionEdit();
  }

  return (
    <>
      <div className="flex size-full flex-col overflow-hidden rounded-[10px] bg-white shadow-[0px_0px_40px_rgba(0,0,0,0.16)]">
        <div className="flex h-[54px] w-full shrink-0 items-center justify-between rounded-tl-[6px] rounded-tr-[6px] border-b border-[#e0e0e0] bg-white p-[16px]">
          <div className="flex min-w-0 items-center gap-[16px]">
            {multiLibrary ? (
              <div className="flex min-w-0 items-center gap-[8px]">
                {activeLibrary ? (
                  showSourceLibrariesBreadcrumb ? (
                    <>
                    <button
                      className="border-none bg-transparent p-0 font-['Helvetica_Neue:Medium',sans-serif] text-[18px] leading-[1.2] text-[#828282] transition-colors hover:text-[#4f4f4f]"
                      onClick={() => setActiveLibraryId(null)}
                      type="button"
                    >
                      Source libraries
                    </button>
                    <ChevronRight size={18} strokeWidth={1.9} className="shrink-0 text-[#bdbdbd]" />
                    <p className="min-w-0 truncate font-['Helvetica_Neue:Medium',sans-serif] text-[18px] leading-[1.2] text-[#333]">
                      {libraryTitle(activeLibrary)}
                    </p>
                    </>
                  ) : (
                    <p className="min-w-0 truncate font-['Helvetica_Neue:Medium',sans-serif] text-[18px] leading-[1.2] text-[#333]">
                      {libraryTitle(activeLibrary)}
                    </p>
                  )
                ) : (
                  <p className="font-['Helvetica_Neue:Medium',sans-serif] text-[18px] leading-[1.2] text-[#333]">
                    Source libraries
                  </p>
                )}
              </div>
            ) : (
              <p className="whitespace-nowrap font-['Helvetica_Neue:Medium',sans-serif] text-[18px] leading-[1.2] text-[#333]">
                Source library
              </p>
            )}
            {activeLibrary?.current && !currentLibraryUsesBrowseActions && (
              <div className="flex shrink-0 items-center gap-[8px]">
                <button
                  className="flex h-[32px] items-center justify-center gap-[6px] rounded-[3px] border-[1.4px] border-[#029c91] bg-[#f9f9f9] px-[16px] pb-[11px] pt-[10px] font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.2] text-[#029c91] transition-colors hover:bg-[#eefaf9]"
                  onClick={onOpenSourceLibrary}
                  type="button"
                >
                  <Upload size={16} strokeWidth={1.9} />
                  Upload a file
                </button>
                <button
                  className="flex h-[32px] items-center justify-center gap-[6px] rounded-[3px] border-[1.4px] border-[#029c91] bg-[#f9f9f9] px-[16px] pb-[11px] pt-[10px] font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.2] text-[#029c91] transition-colors hover:bg-[#eefaf9]"
                  onClick={onOpenOtherCourseLibrary}
                  type="button"
                >
                  <Library size={16} strokeWidth={1.9} />
                  Add file from another course
                </button>
              </div>
            )}
          </div>

          <button
            aria-label="Close source library"
            className="flex size-[20px] shrink-0 items-center justify-center border-none bg-transparent p-0 text-[#4f4f4f] transition-opacity hover:opacity-70"
            onClick={onClose}
            type="button"
          >
            <X size={20} strokeWidth={1.9} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-white p-[24px]">
          {multiLibrary && !activeLibrary ? (
            <SourceLibrariesList libraries={libraries} onSelectLibrary={setActiveLibraryId} />
          ) : activeLibraryUsesBrowseActions ? (
            <ReadOnlyLibrarySources
              library={activeLibrary}
              showInstructions={showInstructions}
              attachedIds={attachedIds}
              sources={sources}
              selectedPromptIds={pendingPromptSourceIds}
              onTogglePrompt={togglePendingPromptSource}
              onAddAsContext={addForeignSourceAsContext}
            />
          ) : (
          <>
          <div className="mb-[24px] flex min-h-[56px] w-full items-start gap-[4px] rounded-[4px] border border-[#e0e0e0] bg-[#f9f9f9] py-[8px] pl-[4px] pr-[8px]">
            <div className="flex size-[24px] shrink-0 items-center justify-center text-[#4f4f4f]">
              <Info size={16} strokeWidth={1.9} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.4] text-[#4f4f4f]">
                {deactivationMode === "complete"
                  ? "You have deactivated all sources"
                  : deactivationMode === "temporary"
                    ? "Sources are off for this generation"
                    : `You have ${activeSourceCount} active ${activeSourceCount === 1 ? "source" : "sources"}`}
              </p>
              <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[13px] leading-[1.4] text-[#4f4f4f]">
                Active sources will affect every prompt and provide a knowledge background for the AI generations.
              </p>
            </div>
            <div className="ml-[16px] flex shrink-0 flex-row-reverse items-start gap-[8px]">
              <div className="relative">
                {allDeactivated ? (
                <button
                  className="flex h-[32px] items-center justify-center gap-[6px] rounded-[3px] border-[1.4px] border-[#029c91] bg-[#f9f9f9] px-[16px] pb-[11px] pt-[10px] font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.2] text-[#029c91] transition-colors hover:bg-[#eefaf9]"
                  onClick={activateAllSources}
                  type="button"
                >
                  <Power size={16} strokeWidth={1.9} />
                  Activate
                </button>
                ) : (
                <>
                <button
                  ref={deactivateButtonRef}
                  aria-expanded={deactivateMenuOpen}
                  className="flex h-[32px] items-center justify-center gap-[4px] rounded-[3px] border-[1.4px] border-[#bdbdbd] bg-[#f9f9f9] pb-[11px] pl-[16px] pr-[10px] pt-[10px] font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.2] text-[#4f4f4f] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[#f9f9f9]"
                  disabled={permanentlyActiveSourceCount === 0}
                  onClick={() => {
                    setDeactivateMenuOpen((open) => !open);
                    setSourceFollowingMenuOpen(false);
                  }}
                  type="button"
                >
                  Deactivate all
                  <ChevronDown size={20} strokeWidth={1.8} />
                </button>

                {deactivateMenuOpen && (
                  <div
                    ref={deactivateMenuRef}
                    className="absolute right-0 top-[38px] z-[30] w-[232px] overflow-hidden rounded-[8px] border border-[#e0e0e0] bg-white shadow-[0px_4px_20px_rgba(0,0,0,0.14)]"
                  >
                    <button
                      className="flex w-full flex-col gap-[2px] border-none bg-transparent px-[14px] py-[10px] text-left transition-colors hover:bg-[#f9f9f9] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent"
                      disabled={activeSourceCount === 0}
                      onClick={temporarilyDeactivateAllSources}
                      type="button"
                    >
                      <span className="font-['Helvetica_Neue:Medium',sans-serif] text-[13px] leading-[18.2px] text-[#333]">
                        For this generation only
                      </span>
                      <span className="font-['Helvetica_Neue:Regular',sans-serif] text-[12px] leading-[16.8px] text-[#828282]">
                        Will reactivate after this prompt
                      </span>
                    </button>
                    <div className="mx-[14px] h-px bg-[#f0f0f0]" />
                    <button
                      className="flex w-full flex-col gap-[2px] border-none bg-transparent px-[14px] py-[10px] text-left transition-colors hover:bg-[#f9f9f9]"
                      onClick={deactivateAllSources}
                      type="button"
                    >
                      <span className="font-['Helvetica_Neue:Medium',sans-serif] text-[13px] leading-[18.2px] text-[#333]">
                        Deactivate completely
                      </span>
                      <span className="font-['Helvetica_Neue:Regular',sans-serif] text-[12px] leading-[16.8px] text-[#828282]">
                        Remove from all future prompts
                      </span>
                    </button>
                  </div>
                )}
                </>
                )}
              </div>

              <div className="relative">
                <button
                  ref={sourceFollowingButtonRef}
                  aria-expanded={sourceFollowingMenuOpen}
                  className="flex h-[32px] items-center justify-center gap-[4px] rounded-[3px] border-[1.4px] border-[#bdbdbd] bg-[#f9f9f9] pb-[11px] pl-[16px] pr-[10px] pt-[10px] font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.2] text-[#4f4f4f] transition-colors hover:bg-white"
                  onClick={() => {
                    setSourceFollowingMenuOpen((open) => !open);
                    setDeactivateMenuOpen(false);
                  }}
                  type="button"
                >
                  {sourceFollowingLabel}
                  <ChevronDown size={20} strokeWidth={1.8} />
                </button>

                {sourceFollowingMenuOpen && (
                  <div
                    ref={sourceFollowingMenuRef}
                    className="absolute right-0 top-[38px] z-[30] w-[292px] overflow-hidden rounded-[8px] border border-[#e0e0e0] bg-white shadow-[0px_4px_20px_rgba(0,0,0,0.14)]"
                  >
                    {SOURCE_FOLLOWING_OPTIONS.map((option, index) => (
                      <div key={option.mode}>
                        {index > 0 && <div className="mx-[14px] h-px bg-[#f0f0f0]" />}
                        <button
                          className={`flex w-full flex-col gap-[2px] border-none bg-transparent px-[14px] py-[10px] text-left transition-colors hover:bg-[#f9f9f9] ${
                            option.mode === sourceFollowingMode ? "bg-[#f6fbfa]" : ""
                          }`}
                          onClick={() => {
                            setSourceFollowingMode(option.mode);
                            setSourceFollowingMenuOpen(false);
                          }}
                          type="button"
                        >
                          <span className="font-['Helvetica_Neue:Medium',sans-serif] text-[13px] leading-[18.2px] text-[#333]">
                            {option.label}
                          </span>
                          <span className="font-['Helvetica_Neue:Regular',sans-serif] text-[12px] leading-[16.8px] text-[#828282]">
                            {option.description}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            className={`min-h-0 w-full overflow-hidden transition-opacity duration-200 ${
              allDeactivated ? "pointer-events-none select-none opacity-50" : ""
            }`}
            aria-disabled={allDeactivated}
          >
            <div
              className="grid w-full"
              style={{ gridTemplateColumns: sourceTableColumns }}
            >
              <div className="flex h-[36px] max-h-[52px] items-center border-b border-[#f2f2f2] bg-[#f9f9f9] p-[8px]">
                <span className="whitespace-nowrap font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.4] text-[#828282]">
                  File name
                </span>
              </div>
              <div className="flex h-[36px] max-h-[52px] items-end border-b border-[#f2f2f2] bg-[#f9f9f9] p-[8px]">
                <span className="whitespace-nowrap font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.4] text-[#828282]">
                  How to use this file
                </span>
              </div>
              <div className="h-[36px] max-h-[52px] border-b border-[#f2f2f2] bg-[#f9f9f9]" />
              {showCurrentPromptButtons && (
                <div className="flex h-[36px] max-h-[52px] items-end justify-center border-b border-[#f2f2f2] bg-[#f9f9f9] p-[8px]">
                  <span className="whitespace-nowrap font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.4] text-[#828282]">
                    Temporary context
                  </span>
                </div>
              )}
              <div className="flex h-[36px] max-h-[52px] items-end justify-center border-b border-[#f2f2f2] bg-[#f9f9f9] p-[8px]">
                <span className="whitespace-nowrap font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.4] text-[#828282]">
                  {showCurrentPromptButtons ? "Always on context" : "Use as context"}
                </span>
              </div>
              <div className="h-[36px] max-h-[52px] border-b border-[#f2f2f2] bg-[#f9f9f9]" />
            </div>

            <div className="relative w-full">
              {orderedSources.map((source) => {
                const hasInstructions = source.note.trim().length > 0;
                const justDuplicated = justDuplicatedSourceIds.includes(source.id);
                const attachedToPrompt = attachedIds.includes(source.id);
                // Active (used-as-context) rows get a very faint green wash.
                const rowBg = source.active ? "bg-[#f3faf5]" : "bg-white";

                return (
                  <div
                    key={source.id}
                    ref={(element) => { rowRefs.current[source.id] = element; }}
                    className="relative grid w-full"
                    style={{ gridTemplateColumns: sourceTableColumns }}
                  >
                    <div className={`flex h-[56px] min-w-0 items-center border-b border-[#f2f2f2] ${rowBg} p-[8px]`}>
                      <div className="flex min-w-0 flex-1 items-center gap-[8px]">
                        <span className="min-w-0 break-words font-['Helvetica_Neue:Medium',sans-serif] text-[13px] font-semibold leading-[1.4] text-[#4f4f4f]">
                          {source.name}
                        </span>
                        {justDuplicated && (
                          <span className="shrink-0 rounded-[2px] bg-[#e8f5e9] px-[5px] py-[2px] font-['Helvetica_Neue:Medium',sans-serif] text-[12px] leading-none text-[#2d7a4d]">
                            Just duplicated
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={`relative flex h-[56px] min-w-0 items-center border-b border-[#f2f2f2] ${rowBg} p-[8px]`}>
                      <span
                        ref={(element) => { instructionPopoverAnchorRefs.current[source.id] = element; }}
                        aria-hidden
                        className="pointer-events-none absolute left-[8px] top-[19px] h-[18px] w-px"
                      />
                      {hasInstructions ? (
                        <button
                          className="line-clamp-2 max-w-full border-none bg-transparent p-0 text-left font-['Helvetica_Neue:Italic',sans-serif] text-[13px] italic leading-[1.4] text-[#6f6f6f] transition-opacity hover:opacity-75"
                          onClick={(event) => beginInstructionEdit(source, instructionPopoverAnchorRefs.current[source.id] ?? event.currentTarget)}
                          type="button"
                        >
                          {source.note}
                        </button>
                      ) : (
                        <InstructionTextButton onClick={(event) => beginInstructionEdit(source, instructionPopoverAnchorRefs.current[source.id] ?? event.currentTarget)}>
                          Add instructions
                        </InstructionTextButton>
                      )}
                    </div>

                    <div className={`flex h-[56px] items-center justify-center border-b border-[#f2f2f2] ${rowBg} p-[8px]`}>
                      {hasInstructions && (
                        <InstructionTextButton onClick={(event) => beginInstructionEdit(source, instructionPopoverAnchorRefs.current[source.id] ?? event.currentTarget)}>
                          Edit
                        </InstructionTextButton>
                      )}
                    </div>

                    {showCurrentPromptButtons && (
                      <div className={`flex h-[56px] items-center justify-center border-b border-[#f2f2f2] ${rowBg} p-[8px]`}>
                        <button
                          className={`flex h-[30px] items-center justify-center rounded-[4px] px-[10px] font-['Helvetica_Neue:Medium',sans-serif] text-[13px] leading-none transition-colors disabled:cursor-not-allowed ${
                            attachedToPrompt
                              ? "border-none bg-[#e0f2f1] text-[#00796b] disabled:opacity-100"
                              : "border border-[#029c91] bg-[#f9f9f9] text-[#029c91] hover:bg-[#eefaf9] disabled:border-[#d6d6d6] disabled:bg-[#f2f2f2] disabled:text-[#9a9a9a]"
                          }`}
                          disabled={source.active || attachedToPrompt}
                          onClick={() => {
                            if (!attachedToPrompt) {
                              onAttach(source.id);
                            }
                          }}
                          type="button"
                        >
                          {attachedToPrompt ? "Added" : "Add to prompt"}
                        </button>
                      </div>
                    )}

                    <div className={`flex h-[56px] items-center justify-center border-b border-[#f2f2f2] ${rowBg} p-[8px]`}>
                      <ContextToggle
                        active={source.active}
                        label={`${source.active ? "Disable" : "Enable"} ${source.name} as context`}
                        onToggle={() => toggleContext(source)}
                      />
                    </div>

                    <div className={`flex h-[56px] items-center justify-end border-b border-[#f2f2f2] ${rowBg} p-[8px]`}>
                      <button
                        aria-label={`Remove ${source.name}`}
                        className="flex size-[20px] items-center justify-center border-none bg-transparent p-0 text-[#4f4f4f] transition-colors hover:text-[#c0392b] disabled:cursor-not-allowed disabled:text-[#bdbdbd] disabled:hover:text-[#bdbdbd]"
                        disabled={source.active}
                        onClick={() => removeSource(source)}
                        type="button"
                      >
                        <Trash2 size={18} strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {orderedSources.length === 0 && (
              <div className="flex h-[168px] items-center justify-center border-b border-[#f2f2f2] bg-white">
                <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[13px] leading-[1.4] text-[#828282]">
                  No sources available.
                </p>
              </div>
            )}
          </div>
          </>
          )}
        </div>

        <div className="flex w-full shrink-0 items-center justify-between gap-[16px] rounded-bl-[6px] rounded-br-[6px] bg-white p-[16px] shadow-[0px_-4px_0px_rgba(0,0,0,0.04)]">
          {activeLibraryUsesBrowseActions ? (
            <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[13px] leading-[1.4] text-[#828282]">
              {pendingPromptCount > 0
                ? `${pendingPromptCount} ${pendingPromptCount === 1 ? "source" : "sources"} will be attached to prompt`
                : "Attach sources to the prompt, or add them as context to this course."}
            </p>
          ) : (
            <div />
          )}
          <div className="flex items-center justify-end gap-[9px]">
          {activeLibraryUsesBrowseActions && (
            <button
              className="flex items-center justify-center rounded-[5px] border-none bg-[#029c91] px-[16px] pb-[11px] pt-[10px] font-['Helvetica_Neue:Medium',sans-serif] text-[16px] leading-[1.2] text-white disabled:cursor-not-allowed disabled:opacity-45"
              disabled={pendingPromptCount === 0}
              onClick={attachPendingPromptSources}
              type="button"
            >
              {currentLibraryUsesBrowseActions ? "Save" : "Attach to prompt"}
            </button>
          )}
          {activeLibrary?.current && !currentLibraryUsesBrowseActions && (
            <button
              className="flex items-center justify-center rounded-[5px] border-none bg-[#029c91] px-[16px] pb-[11px] pt-[10px] font-['Helvetica_Neue:Medium',sans-serif] text-[16px] leading-[1.2] text-white disabled:cursor-not-allowed disabled:opacity-45"
              disabled={orderedSources.length === 0}
              onClick={onClose}
              type="button"
            >
              Save
            </button>
          )}
          <button
            className="flex items-center justify-center rounded-[6px] border-[1.4px] border-[#029c91] bg-[#f9f9f9] px-[16px] pb-[11px] pt-[10px] font-['Helvetica_Neue:Medium',sans-serif] text-[16px] leading-[1.2] text-[#029c91]"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          </div>
        </div>
      </div>

      {editingInstructionId !== null && instructionEditorPosition && createPortal(
        <>
          <div className="fixed inset-0 z-[240]" onClick={cancelInstructionEdit} />
          <div
            className="fixed z-[250] flex w-[360px] flex-col gap-[10px] rounded-[8px] border border-[#e0e0e0] bg-white p-[12px] shadow-[0px_8px_28px_rgba(0,0,0,0.18)]"
            onClick={(event) => event.stopPropagation()}
            style={{ left: instructionEditorPosition.left, top: instructionEditorPosition.top }}
          >
            <textarea
              autoFocus
              className="h-[112px] w-full resize-none rounded-[2px] border border-[#d9d9d9] bg-white p-[10px] font-['Helvetica_Neue:Regular',sans-serif] text-[13px] leading-[1.4] text-[#333] outline-none placeholder:text-[#9a9a9a] focus:border-[#029c91]"
              onChange={(event) => setInstructionDraft(event.target.value)}
              placeholder="Describe what this file contains and how AI should use it..."
              value={instructionDraft}
            />
            <div className="flex items-center justify-end gap-[8px]">
              <button
                className="flex h-[28px] items-center justify-center rounded-[4px] border border-[#029c91] bg-[#f9f9f9] px-[12px] font-['Helvetica_Neue:Medium',sans-serif] text-[13px] leading-none text-[#029c91]"
                onClick={cancelInstructionEdit}
                type="button"
              >
                Cancel
              </button>
              <button
                className="flex h-[28px] items-center justify-center rounded-[4px] border-none bg-[#029c91] px-[12px] font-['Helvetica_Neue:Medium',sans-serif] text-[13px] leading-none text-white"
                onClick={saveInstructionEdit}
                type="button"
              >
                Save
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
