import { useState } from "react";
import { Check, ChevronRight, Library, X } from "lucide-react";
import { type Source } from "./SourceLibraryDialog";
import { OTHER_LIBRARIES, type LibraryGroup } from "./sourceLibraryData";

/**
 * EXPERIMENTAL — multi-library "Add from source library".
 *
 * This whole feature is gated behind a toggle in App.tsx. To remove it, delete
 * this file, the toggle block in App.tsx, and the conditional that renders it.
 */

interface Props {
  onClose: () => void;
  currentCourseName: string;
  sources: Source[];
  attachedIds: number[];
  priorityIds: number[];
  onAddSources: (sources: Source[]) => void;
  mode?: "prompt" | "duplicate";
  // When on, already-context sources can be selected to mark them as a priority source.
  allowPriority: boolean;
  // When on, show a read-only "File instructions" column in a library's source view.
  showInstructions: boolean;
}

const SOURCE_COLUMNS = "minmax(0,1fr) 220px";

function SelectionBox({ checked, disabled }: { checked: boolean; disabled: boolean }) {
  return (
    <div
      className={`flex size-[18px] shrink-0 items-center justify-center rounded-[4px] border transition-colors ${
        checked
          ? disabled
            ? "border-[#d6d6d6] bg-[#f2f2f2]"
            : "border-[#029c91] bg-[#029c91]"
          : "border-[#bdbdbd] bg-white"
      }`}
    >
      {checked && <Check size={13} color={disabled ? "#bdbdbd" : "white"} strokeWidth={2.2} />}
    </div>
  );
}

// Flat design-system label (see Figma "Labels / Layouts").
function ContextPill({ label, variant }: { label: string; variant: "context" | "prompt" | "priority" }) {
  const tone =
    variant === "prompt"
      ? "bg-[#e0f2f1] text-[#00796b]"
      : variant === "priority"
        ? "bg-[#fff3d6] text-[#9a6c00]"
        : "bg-[#e8f5e9] text-[#388e3c]";
  return (
    <span className={`inline-flex items-center justify-center rounded-[2px] px-[4px] py-px font-['Helvetica_Neue:Regular',sans-serif] text-[13px] font-normal leading-[1.4] ${tone}`}>
      {label}
    </span>
  );
}

export default function MultiLibraryModal({ onClose, currentCourseName, sources, attachedIds, priorityIds, onAddSources, mode = "prompt", allowPriority, showInstructions }: Props) {
  const sourceColumns = showInstructions ? "minmax(0,1fr) minmax(0,320px) 220px" : SOURCE_COLUMNS;
  const duplicateMode = mode === "duplicate";
  const currentLibrary: LibraryGroup = {
    id: "current",
    name: currentCourseName,
    current: true,
    sources: sources.filter((source) => source.type === "file"),
  };
  const libraries = duplicateMode ? OTHER_LIBRARIES : [currentLibrary, ...OTHER_LIBRARIES];

  // Land on the library list so users can choose across courses first.
  const [activeLibraryId, setActiveLibraryId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const activeLibrary = libraries.find((library) => library.id === activeLibraryId) ?? null;
  const allSources = libraries.flatMap((library) => library.sources);
  const selectedCount = selectedIds.length;

  function toggleSelected(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]));
  }

  function handleAdd() {
    if (selectedCount === 0) return;
    const selected = allSources.filter((source) => selectedIds.includes(source.id));
    onAddSources(selected);
  }

  function orderForDisplay(group: LibraryGroup) {
    // Context sources bunched at the top (only meaningful for the current course).
    return [
      ...group.sources.filter((source) => source.active),
      ...group.sources.filter((source) => !source.active),
    ];
  }

  return (
    <div className={`flex ${duplicateMode ? "size-full" : "h-[620px] max-h-[inherit] w-full"} flex-col overflow-hidden rounded-[10px] bg-white shadow-[0px_0px_40px_rgba(0,0,0,0.16)]`}>
      <div className="flex h-[54px] w-full shrink-0 items-center justify-between rounded-tl-[6px] rounded-tr-[6px] border-b border-[#e0e0e0] bg-white p-[16px]">
        <div className="flex min-w-0 items-center gap-[8px]">
          {activeLibrary ? (
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
                {activeLibrary.name}
              </p>
            </>
          ) : (
            <p className="font-['Helvetica_Neue:Medium',sans-serif] text-[18px] leading-[1.2] text-[#333]">
              Source libraries
            </p>
          )}
        </div>
        <button
          aria-label="Close"
          className="flex size-[20px] shrink-0 items-center justify-center border-none bg-transparent p-0 text-[#4f4f4f] transition-opacity hover:opacity-70"
          onClick={onClose}
          type="button"
        >
          <X size={20} strokeWidth={1.9} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-white p-[24px]">
        {!activeLibrary ? (
          <div className="w-full overflow-hidden">
            <div className="grid w-full" style={{ gridTemplateColumns: SOURCE_COLUMNS }}>
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

            {libraries.map((library) => {
              const selectedHere = library.sources.filter((source) => selectedIds.includes(source.id)).length;

              return (
                <button
                  key={library.id}
                  className="grid w-full cursor-pointer text-left transition-colors hover:bg-[#fbfbfb]"
                  onClick={() => setActiveLibraryId(library.id)}
                  style={{ gridTemplateColumns: SOURCE_COLUMNS }}
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
                    {selectedHere > 0 && (
                      <span className="font-['Helvetica_Neue:Medium',sans-serif] text-[12px] leading-none text-[#029c91]">
                        {selectedHere} selected
                      </span>
                    )}
                    <span className="font-['Helvetica_Neue:Regular',sans-serif] text-[13px] leading-none text-[#828282]">
                      {library.sources.length}
                    </span>
                    <ChevronRight size={18} strokeWidth={1.8} className="text-[#bdbdbd]" />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="w-full overflow-hidden">
            <div className="grid w-full" style={{ gridTemplateColumns: sourceColumns }}>
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
                  {activeLibrary.current ? "Global context" : "Source"}
                </span>
              </div>
            </div>

            {orderForDisplay(activeLibrary).map((source) => {
              // "Added as context" only applies inside the current course's library.
              const duplicatedToCurrentCourse = duplicateMode && sources.some((candidate) => (candidate.originSourceId ?? candidate.id) === source.id);
              const addedAsContext = !duplicateMode && activeLibrary.current && source.active;
              const alreadyPriority = allowPriority && addedAsContext && priorityIds.includes(source.id);
              const addedToPrompt = !addedAsContext && attachedIds.includes(source.id);
              const isSelected = selectedIds.includes(source.id);
              // Priority mode unlocks already-context sources for selection.
              const disabled = duplicateMode
                ? duplicatedToCurrentCourse
                : addedToPrompt || alreadyPriority || (addedAsContext && !allowPriority);
              const checked = duplicatedToCurrentCourse || (addedAsContext && !allowPriority) || addedToPrompt || alreadyPriority || isSelected;
              const isPriority = addedAsContext && allowPriority && isSelected;

              return (
                <button
                  key={source.id}
                  aria-pressed={selectedIds.includes(source.id)}
                  className={`grid w-full text-left transition-colors ${
                    disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-[#fbfbfb]"
                  }`}
                  disabled={disabled}
                  onClick={() => toggleSelected(source.id)}
                  style={{ gridTemplateColumns: sourceColumns }}
                  type="button"
                >
                  <div className="flex h-[56px] min-w-0 items-center gap-[12px] border-b border-[#f2f2f2] p-[8px]">
                    <SelectionBox checked={checked} disabled={disabled} />
                    <span
                      className={`min-w-0 flex-1 break-words font-['Helvetica_Neue:Medium',sans-serif] text-[13px] font-semibold leading-[1.4] ${
                        disabled ? "text-[#9a9a9a]" : "text-[#4f4f4f]"
                      }`}
                    >
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
                  <div className="flex h-[56px] items-center justify-end gap-[6px] border-b border-[#f2f2f2] p-[8px]">
                    {duplicatedToCurrentCourse && <ContextPill label="Duplicated" variant="context" />}
                    {(alreadyPriority || isPriority) && <ContextPill label="Priority" variant="priority" />}
                    {addedAsContext && <ContextPill label="Added as context" variant="context" />}
                    {addedToPrompt && <ContextPill label="Added to prompt" variant="prompt" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex w-full shrink-0 items-center justify-between gap-[16px] rounded-bl-[6px] rounded-br-[6px] bg-white p-[16px] shadow-[0px_-4px_0px_rgba(0,0,0,0.04)]">
        <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[13px] leading-[1.4] text-[#828282]">
          {selectedCount > 0
            ? `${selectedCount} ${selectedCount === 1 ? "source" : "sources"} selected across libraries`
            : duplicateMode
              ? "Select files from another course to duplicate them into this course."
              : "Select sources from any library to add them to the prompt."}
        </p>
        <div className="flex items-center gap-[9px]">
          <button
            className="flex items-center justify-center rounded-[6px] border-none bg-[#029c91] px-[16px] pb-[11px] pt-[10px] font-['Helvetica_Neue:Medium',sans-serif] text-[16px] leading-[1.2] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
            disabled={selectedCount === 0}
            onClick={handleAdd}
            type="button"
          >
            {duplicateMode ? "Duplicate to current course" : "Add to prompt"}
          </button>
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
  );
}
