import { useState } from "react";
import { Check, X } from "lucide-react";
import { type Source } from "./SourceLibraryDialog";

interface Props {
  onClose: () => void;
  sources: Source[];
  attachedIds: number[];
  priorityIds: number[];
  onAdd: (ids: number[]) => void;
  onOpenLibrary: () => void;
  // When on, already-context sources can be selected to mark them as a priority source.
  allowPriority: boolean;
  // When on, show a read-only "File instructions" column.
  showInstructions: boolean;
}

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

export default function AddFromLibraryModal({ onClose, sources, attachedIds, priorityIds, onAdd, onOpenLibrary, allowPriority, showInstructions }: Props) {
  const columns = showInstructions ? "minmax(0,1fr) minmax(0,320px) 220px" : "minmax(0,1fr) 220px";
  const fileSources = sources.filter((source) => source.type === "file");
  // Bunch sources already added as context together at the top.
  const orderedSources = [
    ...fileSources.filter((source) => source.active),
    ...fileSources.filter((source) => !source.active),
  ];
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const selectedCount = selectedIds.length;

  function toggleSelected(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]));
  }

  function handleAdd() {
    if (selectedCount === 0) return;
    onAdd(selectedIds);
  }

  return (
    <div className="flex max-h-[inherit] w-full flex-col overflow-hidden rounded-[10px] bg-white shadow-[0px_0px_40px_rgba(0,0,0,0.16)]">
      <div className="flex h-[54px] w-full shrink-0 items-center justify-between rounded-tl-[6px] rounded-tr-[6px] border-b border-[#e0e0e0] bg-white p-[16px]">
        <p className="whitespace-nowrap font-['Helvetica_Neue:Medium',sans-serif] text-[18px] leading-[1.2] text-[#333]">
          Add from source library
        </p>
        <div className="flex items-center gap-[16px]">
          <button
            className="border-none bg-transparent p-0 font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.2] text-[#029c91] transition-opacity hover:opacity-75"
            onClick={onOpenLibrary}
            type="button"
          >
            Open source library
          </button>
          <button
            aria-label="Close"
            className="flex size-[20px] shrink-0 items-center justify-center border-none bg-transparent p-0 text-[#4f4f4f] transition-opacity hover:opacity-70"
            onClick={onClose}
            type="button"
          >
            <X size={20} strokeWidth={1.9} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-white p-[24px]">
        <div className="w-full overflow-hidden">
          <div className="grid w-full" style={{ gridTemplateColumns: columns }}>
            <div className="flex h-[36px] items-center border-b border-[#f2f2f2] bg-[#f9f9f9] p-[8px]">
              <span className="whitespace-nowrap font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.4] text-[#828282]">
                File name
              </span>
            </div>
            {showInstructions && (
              <div className="flex h-[36px] items-center border-b border-[#f2f2f2] bg-[#f9f9f9] p-[8px]">
                <span className="whitespace-nowrap font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.4] text-[#828282]">
                  How to use this file
                </span>
              </div>
            )}
            <div className="flex h-[36px] items-center justify-end border-b border-[#f2f2f2] bg-[#f9f9f9] p-[8px]">
              <span className="whitespace-nowrap font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.4] text-[#828282]">
                Global context
              </span>
            </div>
          </div>

          {orderedSources.map((source) => {
            const addedAsContext = source.active;
            const alreadyPriority = allowPriority && addedAsContext && priorityIds.includes(source.id);
            const addedToPrompt = !source.active && attachedIds.includes(source.id);
            const isSelected = selectedIds.includes(source.id);
            // Priority mode unlocks already-context sources for selection.
            const disabled = addedToPrompt || alreadyPriority || (addedAsContext && !allowPriority);
            const checked = (addedAsContext && !allowPriority) || addedToPrompt || alreadyPriority || isSelected;
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
                style={{ gridTemplateColumns: columns }}
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
                  {(alreadyPriority || isPriority) && <ContextPill label="Priority" variant="priority" />}
                  {addedAsContext && <ContextPill label="Added as context" variant="context" />}
                  {addedToPrompt && <ContextPill label="Added to prompt" variant="prompt" />}
                </div>
              </button>
            );
          })}

          {orderedSources.length === 0 && (
            <div className="flex h-[120px] items-center justify-center border-b border-[#f2f2f2]">
              <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[13px] leading-[1.4] text-[#828282]">
                No sources available.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex w-full shrink-0 items-center justify-end gap-[9px] rounded-bl-[6px] rounded-br-[6px] bg-white p-[16px] shadow-[0px_-4px_0px_rgba(0,0,0,0.04)]">
        <button
          className="flex items-center justify-center rounded-[6px] border-none bg-[#029c91] px-[16px] pb-[11px] pt-[10px] font-['Helvetica_Neue:Medium',sans-serif] text-[16px] leading-[1.2] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
          disabled={selectedCount === 0}
          onClick={handleAdd}
          type="button"
        >
          Add to prompt
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
  );
}
