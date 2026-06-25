import { useState, useRef, useEffect, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { Check, Star, X } from "lucide-react";
import svgPaths from "@/imports/BiglinePrompt/svg-zivflzfhju";
import menuSvg from "@/imports/Menu/svg-pth3l68o17";
import filePickerImg from "@/imports/image.png";
import type { Source } from "./SourceLibraryDialog";

interface Props {
  attachedIds: number[];
  priorityIds: number[];
  activeCount: number;
  sources: Source[];
  onOpenLibrary: () => void;
  onOpenSourceLibrary: () => void;
  onRemoveAttachment: (id: number) => void;
  onAddUploadedFiles: (files: UploadedFile[]) => void;
}

export interface UploadedFile {
  id: number;
  name: string;
  addToLibrary: boolean;
  instructions: string;
}

interface InstructionEditorPosition {
  left: number;
  top: number;
}

const INSTRUCTION_EDITOR_WIDTH = 360;
const INSTRUCTION_EDITOR_GAP = 8;
const VIEWPORT_PADDING = 16;

const INITIAL_UPLOADED_FILES: UploadedFile[] = [
  { id: 1, name: "Greek_Mythology_Overview.pdf", addToLibrary: true, instructions: "" },
  { id: 2, name: "The_Olympian_Gods_and_Goddesses.docx", addToLibrary: true, instructions: "" },
  { id: 3, name: "Mythical_Creatures_of_Greece.pptx", addToLibrary: true, instructions: "" },
];

function DocIcon({ priority = false }: { priority?: boolean }) {
  if (priority) {
    return (
      <div className="bg-[#fff3d6] flex items-center justify-center rounded-[4px] shrink-0 size-[40px]">
        <Star size={22} strokeWidth={2} fill="#9a6c00" color="#9a6c00" />
      </div>
    );
  }

  return (
    <div className="bg-[#5c6bc0] flex items-center justify-center rounded-[4px] shrink-0 size-[40px]">
      <div className="overflow-clip relative shrink-0 size-[24px]">
        <div className="absolute inset-[8.75%_17.08%]">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.8 19.8">
            <path clipRule="evenodd" d={svgPaths.p1ec74d80} fill="white" fillRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );
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
      className="border-none bg-transparent p-0 font-['Helvetica_Neue:Medium',sans-serif] text-[13px] leading-[1.4] text-[#01837a]"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function UploadTableCheckbox({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={checked}
      className={`flex size-[16px] items-center justify-center rounded-[2px] border transition-colors ${
        checked ? "border-[#029c91] bg-[#029c91]" : "border-[#bdbdbd] bg-white"
      }`}
      onClick={onToggle}
      type="button"
    >
      {checked && <Check size={12} color="white" strokeWidth={2.1} />}
    </button>
  );
}

export default function LivePrompt({ attachedIds, priorityIds, activeCount, sources, onOpenLibrary, onOpenSourceLibrary, onRemoveAttachment, onAddUploadedFiles }: Props) {
  const hasAttachments = attachedIds.length > 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(INITIAL_UPLOADED_FILES);
  const [editingInstructionId, setEditingInstructionId] = useState<number | null>(null);
  const [instructionEditorPosition, setInstructionEditorPosition] = useState<InstructionEditorPosition | null>(null);
  const [instructionDraft, setInstructionDraft] = useState("");
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const plusBtnRef = useRef<HTMLButtonElement>(null);
  const instructionPopoverAnchorRefs = useRef<Record<number, HTMLSpanElement | null>>({});

  useEffect(() => {
    if (menuOpen && plusBtnRef.current) {
      const r = plusBtnRef.current.getBoundingClientRect();
      setMenuPos({ x: r.left, y: r.top });
    }
  }, [menuOpen]);

  function openUploadedFilesDialog() {
    setUploadedFiles(INITIAL_UPLOADED_FILES);
    setEditingInstructionId(null);
    setInstructionEditorPosition(null);
    setInstructionDraft("");
    setUploadOpen(false);
    setAddSourceOpen(true);
  }

  function closeUploadedFilesDialog() {
    setAddSourceOpen(false);
    setEditingInstructionId(null);
    setInstructionEditorPosition(null);
    setInstructionDraft("");
  }

  function addUploadedFilesToPrompt() {
    if (uploadedFiles.length === 0) return;

    onAddUploadedFiles(uploadedFiles);
    closeUploadedFilesDialog();
  }

  function toggleAddToLibrary(id: number) {
    setUploadedFiles((files) =>
      files.map((file) =>
        file.id === id ? { ...file, addToLibrary: !file.addToLibrary } : file
      )
    );
  }

  function removeUploadedFile(id: number) {
    setUploadedFiles((files) => files.filter((file) => file.id !== id));
    if (editingInstructionId === id) {
      setEditingInstructionId(null);
      setInstructionEditorPosition(null);
      setInstructionDraft("");
    }
  }

  function beginInstructionEdit(file: UploadedFile, anchor: HTMLElement) {
    const rect = anchor.getBoundingClientRect();
    const maxLeft = window.innerWidth - INSTRUCTION_EDITOR_WIDTH - VIEWPORT_PADDING;
    const left = Math.min(Math.max(rect.left, VIEWPORT_PADDING), maxLeft);
    const top = Math.min(
      rect.bottom + INSTRUCTION_EDITOR_GAP,
      window.innerHeight - 190 - VIEWPORT_PADDING
    );

    setEditingInstructionId(file.id);
    setInstructionEditorPosition({ left, top: Math.max(VIEWPORT_PADDING, top) });
    setInstructionDraft(file.instructions);
  }

  function cancelInstructionEdit() {
    setEditingInstructionId(null);
    setInstructionEditorPosition(null);
    setInstructionDraft("");
  }

  function saveInstructionEdit() {
    if (editingInstructionId === null) return;

    setUploadedFiles((files) =>
      files.map((file) =>
        file.id === editingInstructionId
          ? { ...file, instructions: instructionDraft.trim() }
          : file
      )
    );
    setEditingInstructionId(null);
    setInstructionEditorPosition(null);
    setInstructionDraft("");
  }

  return (
    <>
    <div className="bg-white relative rounded-[16px] max-h-[342px] min-h-[150px]">
      <div className="flex flex-col gap-[2px] items-start justify-end max-h-[inherit] min-h-[inherit] overflow-clip pb-[8px] pt-[16px] px-[16px] relative rounded-[inherit]">

        {/* Attachments row — only shown when there are attached sources */}
        {hasAttachments && (
          <div className="flex gap-[8px] items-start overflow-clip w-full shrink-0 mb-[0px]">
            {attachedIds.map((id) => (
              <div
                key={id}
                className="group bg-[#f2f2f2] flex gap-[8px] items-center overflow-clip pl-[4px] pr-[8px] py-[4px] rounded-[8px] shrink-0 w-[128px] relative"
              >
                <DocIcon priority={priorityIds.includes(id)} />
                <div className="overflow-hidden text-[#4f4f4f] text-[13px] font-['Helvetica_Neue:Regular',sans-serif] leading-[1.4] whitespace-nowrap text-ellipsis w-[66px]">
                  {sources.find((s) => s.id === id)?.name ?? "Document"}
                </div>
                <button
                  onClick={() => onRemoveAttachment(id)}
                  className="absolute top-[4px] right-[4px] size-[16px] rounded-full bg-[#4f4f4f] items-center justify-center cursor-pointer border-none p-0 hidden group-hover:flex"
                  aria-label="Remove"
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1 1L7 7M7 1L1 7" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Prompt text area */}
        <div className="flex gap-[8px] items-start max-h-[262px] min-h-[70px] overflow-clip w-[688px] shrink-0">
          <div className="flex flex-1 min-w-px items-start relative">
            <p className="flex-[1_0_0] font-['Helvetica_Neue:Regular',sans-serif] leading-[1.4] text-[#bdbdbd] text-[16px]">
              |A course teaching the topic step-by-step with lessons, examples, and exercises
            </p>
          </div>
          <div className="bg-white relative shrink-0 size-[32px]" />
        </div>

        {/* Actions bar */}
        <div className="flex items-end justify-between w-full shrink-0">
          {/* Left icons: +, settings, library */}
          <div className="flex gap-[8px] items-center">
            {/* + with contextual menu */}
            <div className="relative">
              {menuOpen && createPortal(
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setMenuOpen(false)} />
                  <div
                    className="fixed z-[101] bg-white rounded-[16px] drop-shadow-[0px_0px_16px_rgba(0,0,0,0.16)] flex flex-col gap-[4px] items-start justify-center p-[12px] w-max"
                    style={{ left: menuPos.x, top: menuPos.y - 8, transform: "translateY(-100%)" }}
                  >
                    <div aria-hidden className="absolute border border-[#e0e0e0] border-solid inset-[-1px] pointer-events-none rounded-[17px]" />
                    {/* Upload file */}
                    <button onClick={() => { setMenuOpen(false); setUploadOpen(true); }} className="flex gap-[4px] h-[20px] items-center bg-transparent border-none cursor-pointer hover:opacity-70 transition-opacity">
                      <div className="overflow-clip relative shrink-0 size-[20px]">
                        <div className="absolute inset-[7.74%_8.75%_7.23%_11.4%]">
                          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.97 17.0055">
                            <path clipRule="evenodd" d={menuSvg.p1a8b9980} fill="#4F4F4F" fillRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <span className="font-['Helvetica_Neue:Medium',sans-serif] text-[#4f4f4f] text-[14px] leading-[1.2] whitespace-nowrap">Upload file</span>
                    </button>
                    {/* Add from library */}
                    <button onClick={() => { setMenuOpen(false); onOpenSourceLibrary(); }} className="flex gap-[4px] h-[20px] items-center bg-transparent border-none cursor-pointer hover:opacity-70 transition-opacity">
                      <div className="overflow-clip relative shrink-0 size-[20px]">
                        <div className="absolute inset-[12.91%_8.76%_12.92%_17.08%]">
                          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.8317 14.834">
                            <path d={svgPaths.p3e39c00} fill="#4F4F4F" />
                          </svg>
                        </div>
                      </div>
                      <span className="font-['Helvetica_Neue:Medium',sans-serif] text-[#4f4f4f] text-[14px] leading-[1.2] whitespace-nowrap">Add from library</span>
                    </button>
                    {/* Paste text */}
                    <button className="flex gap-[4px] h-[20px] items-center bg-transparent border-none cursor-pointer hover:opacity-70 transition-opacity">
                      <div className="overflow-clip relative shrink-0 size-[20px]">
                        <div className="absolute inset-[12.5%_20.83%_66.67%_58.33%]">
                          <div className="absolute inset-[-14.4%]">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.36667 5.36667">
                              <path d={menuSvg.p17b4b380} stroke="#4F4F4F" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
                            </svg>
                          </div>
                        </div>
                        <div className="absolute inset-[12.5%_20.83%]">
                          <div className="absolute inset-[-4%_-5.14%]">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.8667 16.2">
                              <path d={menuSvg.p3677d700} stroke="#4F4F4F" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <span className="font-['Helvetica_Neue:Medium',sans-serif] text-[#4f4f4f] text-[14px] leading-[1.2] whitespace-nowrap">Paste text</span>
                    </button>
                    {/* Add reference */}
                    <button className="flex gap-[4px] h-[20px] items-center bg-transparent border-none cursor-pointer hover:opacity-70 transition-opacity">
                      <div className="overflow-clip relative shrink-0 size-[20px]">
                        <div className="absolute inset-[13.54%_9.38%]">
                          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.25 14.5833">
                            <path clipRule="evenodd" d={menuSvg.pc1f5500} fill="#4F4F4F" fillRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <span className="font-['Helvetica_Neue:Medium',sans-serif] text-[#4f4f4f] text-[14px] leading-[1.2] whitespace-nowrap">Add reference</span>
                      <div className="bg-[#f2f2f2] flex items-center justify-center rounded-[5px] size-[20px]">
                        <span className="font-['Helvetica_Neue:Medium',sans-serif] text-[#828282] text-[14px] leading-[1.2]">/</span>
                      </div>
                    </button>
                  </div>
                </>,
                document.body
              )}
              <button
                ref={plusBtnRef}
                onClick={() => setMenuOpen((v) => !v)}
                className={`flex items-center justify-center p-[8px] rounded-[8px] shrink-0 size-[32px] border-none cursor-pointer transition-colors ${menuOpen ? "bg-[#e1f7f5]" : "bg-white hover:bg-[#e1f7f5]"}`}
              >
                <div className="overflow-clip relative shrink-0 size-[20px]">
                  <div className="absolute inset-[17.08%]">
                    <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.1667 13.1667">
                      <path clipRule="evenodd" d={svgPaths.p19150200} fill={menuOpen ? "#01837A" : "#4F4F4F"} fillRule="evenodd" className="transition-colors" />
                    </svg>
                  </div>
                </div>
              </button>
            </div>
            {/* Settings */}
            <div className="bg-white flex items-center justify-center p-[8px] relative rounded-[8px] shrink-0 size-[32px]">
              <div className="overflow-clip relative shrink-0 size-[20px]">
                <div className="absolute inset-[12.92%]">
                  <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.8333 14.8333">
                    <path clipRule="evenodd" d={svgPaths.p27bd7000} fill="#4F4F4F" fillRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            {/* Library icon — clickable, shows badge if attachments */}
            <button
              onClick={onOpenLibrary}
              className="bg-white flex items-center justify-center p-[8px] relative rounded-[8px] shrink-0 size-[32px] cursor-pointer border-none"
            >
              <div className="overflow-clip relative shrink-0 size-[20px]">
                <div className="absolute inset-[12.91%_8.76%_12.92%_17.08%]">
                  <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.8317 14.834">
                    <path d={svgPaths.p3e39c00} fill="#4F4F4F" />
                  </svg>
                </div>
              </div>
              {/* Badge showing count of active sources */}
              {activeCount > 0 && (
                <div className="absolute -top-[4px] -right-[4px] bg-[#4f4f4f] rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-[3px]">
                  <span className="text-white text-[10px] font-['Helvetica_Neue:Medium',sans-serif] leading-none">
                    {activeCount}
                  </span>
                </div>
              )}
            </button>
          </div>

          {/* Send button */}
          <div className="flex gap-[8px] items-center">
            <div className="flex items-center opacity-60">
              <div className="bg-[#029c91] overflow-clip relative rounded-[16px] shrink-0 size-[32px]">
                <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[20px] top-1/2">
                  <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                    <g clipPath="url(#clip0_live)">
                      <path d={svgPaths.p50d4d00} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                      <path d="M5.41406 10H17.4974" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                    </g>
                    <defs>
                      <clipPath id="clip0_live"><rect fill="white" height="20" width="20" /></clipPath>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Close button */}
        <div className="absolute bg-white flex items-center justify-center p-[8px] right-[16px] rounded-[8px] size-[32px] top-[16px]">
          <div className="overflow-clip relative shrink-0 size-[20px]">
            <div className="absolute inset-[21.25%]">
              <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.5 11.5">
                <path clipRule="evenodd" d={svgPaths.p1467e300} fill="#4F4F4F" fillRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <p className="font-['Helvetica_Neue:Regular',sans-serif] leading-[1.4] text-[#828282] text-[10px] tracking-[0.4px] whitespace-nowrap shrink-0">
          Currently in Beta
        </p>
      </div>
      <div aria-hidden className="absolute border border-[#e0e0e0] border-solid inset-[-1px] pointer-events-none rounded-[17px] shadow-[0px_0px_32px_0px_rgba(0,0,0,0.16)]" />
    </div>

    {uploadOpen && createPortal(
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={() => setUploadOpen(false)}
      >
        <img
          src={filePickerImg}
          alt="File picker"
          className="rounded-[12px] shadow-[0px_8px_40px_rgba(0,0,0,0.4)] cursor-pointer"
          onClick={(e) => { e.stopPropagation(); openUploadedFilesDialog(); }}
        />
      </div>,
      document.body
    )}

    {addSourceOpen && createPortal(
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.32)" }}
        onClick={closeUploadedFilesDialog}
      >
        <div
          className="flex h-[612px] max-h-[calc(100vh-48px)] w-[957px] max-w-[calc(100vw-48px)] flex-col items-start overflow-hidden rounded-[10px] bg-white shadow-[0px_0px_40px_0px_rgba(0,0,0,0.16)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-[54px] w-full shrink-0 items-center justify-between rounded-tl-[6px] rounded-tr-[6px] border-b border-[#e0e0e0] bg-white p-[16px]">
            <div className="flex min-w-0 items-center gap-[16px]">
              <p className="whitespace-nowrap font-['Helvetica_Neue:Medium',sans-serif] text-[18px] leading-[1.2] text-[#333]">
                Upload files
              </p>
              <button
                className="flex h-[32px] items-center justify-center rounded-[3px] border-[1.4px] border-[#029c91] bg-[#f9f9f9] px-[16px] pb-[11px] pt-[10px] font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.2] text-[#029c91]"
                onClick={() => { setAddSourceOpen(false); setUploadOpen(true); }}
                type="button"
              >
                Upload more
              </button>
            </div>
            <button
              aria-label="Close"
              className="flex size-[20px] shrink-0 items-center justify-center border-none bg-transparent p-0 text-[#4f4f4f]"
              onClick={closeUploadedFilesDialog}
              type="button"
            >
              <X size={20} strokeWidth={1.9} />
            </button>
          </div>

          <div className="min-h-0 flex-1 bg-white p-[24px] w-full">
            <div className="min-h-0 w-full overflow-hidden">
              <div
                className="grid w-full"
                style={{ gridTemplateColumns: "335px minmax(0,1fr) 111px 184px 40px" }}
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
                <div className="flex h-[36px] max-h-[52px] items-end justify-center border-b border-[#f2f2f2] bg-[#f9f9f9] p-[8px]">
                  <span className="whitespace-nowrap font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.4] text-[#828282]">
                    Add to Source Library
                  </span>
                </div>
                <div className="h-[36px] max-h-[52px] border-b border-[#f2f2f2] bg-[#f9f9f9]" />

                {uploadedFiles.map((file) => {
                  const hasInstructions = file.instructions.trim().length > 0;

                  return (
                    <div key={file.id} className="contents">
                      <div className="flex h-[56px] items-center border-b border-[#f2f2f2] bg-white p-[8px]">
                        <span className="min-w-0 flex-1 break-words font-['Helvetica_Neue:Medium',sans-serif] text-[13px] font-semibold leading-[1.4] text-[#4f4f4f]">
                          {file.name}
                        </span>
                      </div>

                      <div className="relative flex h-[56px] min-w-0 items-center border-b border-[#f2f2f2] bg-white p-[8px]">
                        <span
                          ref={(element) => { instructionPopoverAnchorRefs.current[file.id] = element; }}
                          aria-hidden
                          className="pointer-events-none absolute left-[8px] top-[19px] h-[18px] w-px"
                        />
                        {hasInstructions ? (
                          <button
                            className="line-clamp-2 max-w-full border-none bg-transparent p-0 text-left font-['Helvetica_Neue:Italic',sans-serif] text-[13px] italic leading-[1.4] text-[#6f6f6f]"
                            onClick={(event) => beginInstructionEdit(file, instructionPopoverAnchorRefs.current[file.id] ?? event.currentTarget)}
                            type="button"
                          >
                            {file.instructions}
                          </button>
                        ) : (
                          <button
                            className="border-none bg-transparent p-0 font-['Helvetica_Neue:Medium',sans-serif] text-[13px] leading-[1.4] text-[#01837a]"
                            onClick={(event) => beginInstructionEdit(file, instructionPopoverAnchorRefs.current[file.id] ?? event.currentTarget)}
                            type="button"
                          >
                            Add instructions
                          </button>
                        )}
                      </div>

                      <div className="flex h-[56px] items-center justify-center border-b border-[#f2f2f2] bg-white p-[8px]">
                        {hasInstructions && (
                          <InstructionTextButton onClick={(event) => beginInstructionEdit(file, instructionPopoverAnchorRefs.current[file.id] ?? event.currentTarget)}>
                            Edit
                          </InstructionTextButton>
                        )}
                      </div>

                      <div className="flex h-[56px] items-center justify-center border-b border-[#f2f2f2] bg-white p-[8px]">
                        <UploadTableCheckbox
                          checked={file.addToLibrary}
                          label={`${file.addToLibrary ? "Remove" : "Add"} ${file.name} from source library upload`}
                          onToggle={() => toggleAddToLibrary(file.id)}
                        />
                      </div>

                      <div className="flex h-[56px] items-center justify-end border-b border-[#f2f2f2] bg-white p-[8px]">
                        <button
                          aria-label={`Remove ${file.name}`}
                          className="flex size-[20px] items-center justify-center border-none bg-transparent p-0 text-[#4f4f4f]"
                          onClick={() => removeUploadedFile(file.id)}
                          type="button"
                        >
                          <X size={20} strokeWidth={1.8} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {uploadedFiles.length === 0 && (
                <div className="flex h-[168px] items-center justify-center border-b border-[#f2f2f2] bg-white">
                  <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[13px] leading-[1.4] text-[#828282]">
                    No files selected.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex w-full shrink-0 items-start justify-end gap-[9px] rounded-bl-[6px] rounded-br-[6px] bg-white p-[16px] shadow-[0px_-4px_0px_rgba(0,0,0,0.04)]">
            <button
              className="flex items-center justify-center rounded-[5px] border-none bg-[#029c91] px-[16px] pb-[11px] pt-[10px] font-['Helvetica_Neue:Medium',sans-serif] text-[16px] leading-[1.2] text-white disabled:cursor-not-allowed disabled:opacity-45"
              disabled={uploadedFiles.length === 0}
              onClick={addUploadedFilesToPrompt}
              type="button"
            >
              Add
            </button>
            <button
              className="flex items-center justify-center rounded-[6px] border-[1.4px] border-[#029c91] bg-[#f9f9f9] px-[16px] pb-[11px] pt-[10px] font-['Helvetica_Neue:Medium',sans-serif] text-[16px] leading-[1.2] text-[#029c91]"
              onClick={closeUploadedFilesDialog}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}

    {addSourceOpen && editingInstructionId !== null && instructionEditorPosition && createPortal(
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
