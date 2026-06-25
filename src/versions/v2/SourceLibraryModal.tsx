import { useState } from "react";
import { Check, ChevronDown, FileText, Upload, X } from "lucide-react";
import { type Source } from "./SourceLibraryDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";

interface Props {
  mode: "select" | "manage";
  onClose: () => void;
  sources: Source[];
  setSources: (sources: Source[]) => void;
  attachedIds: number[];
  onAttach: (id: number) => void;
  onAdd?: (ids: number[]) => void;
}

function SourceIcon() {
  return (
    <div className="flex size-[34px] shrink-0 items-center justify-center rounded-[7px] bg-[#eef0ff] text-[#4f5fb8]">
      <FileText size={18} strokeWidth={1.9} />
    </div>
  );
}

function SelectionBox({ checked, disabled }: { checked: boolean; disabled: boolean }) {
  return (
    <div
      className={`flex size-[18px] items-center justify-center rounded-[4px] border transition-colors ${
        checked
          ? "border-[#029c91] bg-[#029c91]"
          : disabled
            ? "border-[#d6d6d6] bg-[#f2f2f2]"
            : "border-[#bdbdbd] bg-white"
      }`}
    >
      {checked && <Check size={13} color="white" strokeWidth={2.2} />}
    </div>
  );
}

function StatusPill({ source, isAttached, mode }: { source: Source; isAttached: boolean; mode: Props["mode"] }) {
  const label = mode === "manage" && isAttached ? "Attached" : source.active ? "Active" : "In library";
  const active = label === "Active";
  const attached = label === "Attached";

  return (
    <span
      className={`inline-flex h-[24px] items-center rounded-full border px-[9px] font-['Helvetica_Neue:Medium',sans-serif] text-[12px] leading-none ${
        attached
          ? "border-[#029c91] bg-[#e6f7f6] text-[#027b72]"
          : active
            ? "border-[#d7eadf] bg-[#f0faf4] text-[#2d7a4d]"
            : "border-[#e0e0e0] bg-[#f9f9f9] text-[#6f6f6f]"
      }`}
    >
      {label}
    </span>
  );
}

function ContextControl({ label }: { label: string }) {
  return (
    <div className="inline-flex h-[30px] w-[124px] items-center justify-between rounded-[7px] border border-[#e0e0e0] bg-white pl-[12px] pr-[8px]">
      <span className="truncate font-['Helvetica_Neue:Medium',sans-serif] text-[13px] leading-none text-[#4f4f4f]">
        {label}
      </span>
      <ChevronDown size={16} color="#6f6f6f" strokeWidth={1.8} />
    </div>
  );
}

function SourceTableRow({
  source,
  checked,
  disabled,
  isAttached,
  mode,
  onToggle,
}: {
  source: Source;
  checked: boolean;
  disabled: boolean;
  isAttached: boolean;
  mode: Props["mode"];
  onToggle: () => void;
}) {
  return (
    <TableRow
      aria-selected={checked}
      onClick={disabled ? undefined : onToggle}
      className={`group h-[58px] border-[#eeeeee] ${
        disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer hover:bg-[#fbfbfb]"
      } ${checked ? "bg-[#eefaf9] hover:bg-[#eefaf9]" : ""}`}
    >
      <TableCell className="w-[48px] px-[16px] py-[10px]">
        <input
          aria-label={`Select ${source.name}`}
          checked={checked}
          className="sr-only"
          disabled={disabled}
          onChange={onToggle}
          onClick={(event) => event.stopPropagation()}
          type="checkbox"
        />
        <SelectionBox checked={checked} disabled={disabled} />
      </TableCell>
      <TableCell className="min-w-[260px] py-[10px] pr-[16px]">
        <div className="flex min-w-0 items-center gap-[10px]">
          <SourceIcon />
          <div className="min-w-0">
            <p className="truncate font-['Helvetica_Neue:Medium',sans-serif] text-[14px] font-semibold leading-[1.25] text-[#333]">
              {source.name}
            </p>
            <p className="mt-[3px] font-['Helvetica_Neue:Regular',sans-serif] text-[12px] leading-none text-[#8a8a8a]">
              PDF source
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="w-[130px] px-[12px] py-[10px]">
        <StatusPill source={source} isAttached={isAttached} mode={mode} />
      </TableCell>
      <TableCell className="max-w-[270px] whitespace-normal px-[12px] py-[10px]">
        <span className={`block truncate font-['Helvetica_Neue:Regular',sans-serif] text-[13px] leading-[1.4] ${source.note ? "text-[#5f5f5f]" : "text-[#9a9a9a]"}`}>
          {source.note || "No note added"}
        </span>
      </TableCell>
      <TableCell className="w-[148px] px-[12px] py-[10px]">
        <ContextControl label={source.dropdownLabel || "Balanced"} />
      </TableCell>
    </TableRow>
  );
}

export default function SourceLibraryModal({
  mode,
  onClose,
  sources,
  setSources,
  attachedIds,
  onAdd,
}: Props) {
  const fileSources = sources.filter((source) => source.type === "file");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const selectedCount = selectedIds.length;
  const addLabel = mode === "select" ? "Add to Knowledge Center" : "Add to prompt";

  function isSelectionDisabled(id: number) {
    return mode === "manage" && attachedIds.includes(id);
  }

  function toggleSelected(id: number) {
    if (isSelectionDisabled(id)) return;
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]);
  }

  function handleAdd() {
    if (selectedCount === 0) return;

    if (onAdd) {
      onAdd(selectedIds);
      return;
    }

    setSources(sources.map((source) => selectedIds.includes(source.id) ? { ...source, active: true } : source));
    onClose();
  }

  return (
    <div className="flex size-full flex-col items-start overflow-clip rounded-[10px] bg-white shadow-[0px_0px_40px_0px_rgba(0,0,0,0.16)]">
      <div className="shrink-0 rounded-tl-[6px] rounded-tr-[6px] border-b border-[#e0e0e0] bg-white w-full">
        <div className="flex items-center justify-between p-[16px]">
          <div className="flex items-center gap-[16px]">
            <div>
              <p className="whitespace-nowrap font-['Roboto:Medium',sans-serif] text-[18px] font-medium leading-[1.2] text-[#333]">
                Source Library
              </p>
              <p className="mt-[3px] font-['Helvetica_Neue:Regular',sans-serif] text-[12px] leading-none text-[#828282]">
                {fileSources.length} available file {fileSources.length === 1 ? "source" : "sources"}
              </p>
            </div>
            <button
              className="inline-flex h-[30px] items-center gap-[6px] rounded-[6px] border border-[#029c91] bg-[#f7fcfb] px-[10px] font-['Helvetica_Neue:Medium',sans-serif] text-[13px] leading-none text-[#029c91]"
              type="button"
            >
              <Upload size={15} strokeWidth={1.9} />
              Upload a source
            </button>
          </div>
          <button
            aria-label="Close"
            className="flex size-[32px] shrink-0 items-center justify-center rounded-[6px] border-none bg-transparent text-[#4f4f4f] transition-colors hover:bg-[#f5f5f5]"
            onClick={onClose}
            type="button"
          >
            <X size={18} strokeWidth={1.9} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-white w-full">
        <div className="p-[24px]">
          {fileSources.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center rounded-[8px] border border-dashed border-[#d9d9d9] bg-[#fbfbfb]">
              <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[14px] leading-[1.4] text-[#828282]">
                No sources available.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[8px] border border-[#e6e6e6]">
              <Table>
                <TableHeader className="bg-[#f7f7f7]">
                  <TableRow className="border-[#e6e6e6] hover:bg-[#f7f7f7]">
                    <TableHead className="h-[38px] w-[48px] px-[16px]" />
                    <TableHead className="h-[38px] px-[12px] font-['Helvetica_Neue:Medium',sans-serif] text-[12px] uppercase tracking-[0.04em] text-[#707070]">
                      Source
                    </TableHead>
                    <TableHead className="h-[38px] w-[130px] px-[12px] font-['Helvetica_Neue:Medium',sans-serif] text-[12px] uppercase tracking-[0.04em] text-[#707070]">
                      Status
                    </TableHead>
                    <TableHead className="h-[38px] px-[12px] font-['Helvetica_Neue:Medium',sans-serif] text-[12px] uppercase tracking-[0.04em] text-[#707070]">
                      Note
                    </TableHead>
                    <TableHead className="h-[38px] w-[148px] px-[12px] font-['Helvetica_Neue:Medium',sans-serif] text-[12px] uppercase tracking-[0.04em] text-[#707070]">
                      Context
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fileSources.map((source) => {
                    const isAttached = attachedIds.includes(source.id);
                    const disabled = isSelectionDisabled(source.id);

                    return (
                      <SourceTableRow
                        key={source.id}
                        source={source}
                        checked={selectedIds.includes(source.id)}
                        disabled={disabled}
                        isAttached={isAttached}
                        mode={mode}
                        onToggle={() => toggleSelected(source.id)}
                      />
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 rounded-bl-[6px] rounded-br-[6px] bg-white shadow-[0px_-4px_12px_rgba(0,0,0,0.04)] w-full">
        <div className="flex items-center justify-between gap-[16px] p-[16px]">
          <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[13px] leading-[1.4] text-[#828282]">
            {selectedCount > 0
              ? `${selectedCount} ${selectedCount === 1 ? "source" : "sources"} selected`
              : "Select one or more sources from the table."}
          </p>
          <div className="flex items-center gap-[9px]">
            <button
              className="relative flex items-center justify-center rounded-[6px] border border-[#029c91] bg-[#f9f9f9] px-[16px] py-[10px] font-['Helvetica_Neue:Medium',sans-serif] text-[15px] leading-[1.2] text-[#029c91]"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="flex items-center justify-center rounded-[6px] border-none bg-[#029c91] px-[16px] py-[10px] font-['Helvetica_Neue:Medium',sans-serif] text-[15px] leading-[1.2] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
              disabled={selectedCount === 0}
              onClick={handleAdd}
              type="button"
            >
              {addLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
