import { ArrowUpRight, BookOpen, Check, Clipboard, Paperclip, Plus, Send, Settings2, SlidersHorizontal, Upload, X } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import filePickerImg from "@/imports/image.png";
import promptSvg from "@/imports/BiglinePrompt/svg-zivflzfhju";
import menuSvg from "@/imports/Menu/svg-pth3l68o17";
import type { UploadedFile } from "./LivePrompt";

interface CourseEntryScreenProps {
  onBrowseLibrary: () => void;
  onAddUploadedFiles: (files: UploadedFile[]) => void;
}

const PROMPT_PLACEHOLDER = "|A course teaching the topic step-by-step with lessons, examples, and exercises";
const ENTRY_TABLE_COLUMNS = "minmax(0,322px) minmax(0,226px) 111px 135px 35px";
const INSTRUCTION_EDITOR_WIDTH = 360;
const INSTRUCTION_EDITOR_GAP = 8;
const VIEWPORT_PADDING = 16;
const INITIAL_UPLOADED_FILES: UploadedFile[] = [
  { id: 1, name: "Greek_Mythology_Overview.pdf", addToLibrary: true, instructions: "" },
  { id: 2, name: "The_Olympian_Gods_and_Goddesses.docx", addToLibrary: true, instructions: "" },
  { id: 3, name: "Mythical_Creatures_of_Greece.pptx", addToLibrary: true, instructions: "" },
];

interface EntrySourceFile extends UploadedFile {
  useAsContext: boolean;
}

interface InstructionEditorPosition {
  left: number;
  top: number;
}

function PromptGuideButton({
  icon,
  title,
  description,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
}) {
  return (
    <button
      className="flex h-[104px] w-[168px] flex-col items-start justify-start gap-[12px] rounded-[16px] border border-[#e0e0e0] bg-white p-[16px] text-left transition-colors hover:bg-[#fbfbfb]"
      onClick={onClick}
      type="button"
    >
      <span className="flex items-center gap-[4px] font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.2] text-[#4f4f4f]">
        <span className="flex size-[20px] items-center justify-center text-[#4f4f4f]">{icon}</span>
        {title}
      </span>
      <span className="font-['Helvetica_Neue:Regular',sans-serif] text-[14px] leading-[1.4] text-[#828282]">
        {description}
      </span>
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

function EntrySourceTable({
  files,
  onAttachFiles,
  onBeginInstructionEdit,
  onRemoveFile,
  onToggleContext,
}: {
  files: EntrySourceFile[];
  onAttachFiles: () => void;
  onBeginInstructionEdit: (file: EntrySourceFile, anchor: HTMLElement) => void;
  onRemoveFile: (id: number) => void;
  onToggleContext: (id: number) => void;
}) {
  return (
    <div className="w-full overflow-hidden rounded-[8px] border border-[#f2f2f2] bg-white">
      <div className="grid w-full" style={{ gridTemplateColumns: ENTRY_TABLE_COLUMNS }}>
        <div className="flex h-[36px] items-center border-b border-[#f2f2f2] bg-[#f9f9f9] p-[8px]">
          <span className="font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.4] text-[#828282]">
            File name
          </span>
        </div>
        <div className="flex h-[36px] items-end border-b border-[#f2f2f2] bg-[#f9f9f9] p-[8px]">
          <span className="font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.4] text-[#828282]">
            How to use this file
          </span>
        </div>
        <div className="h-[36px] border-b border-[#f2f2f2] bg-[#f9f9f9]" />
        <div className="flex h-[36px] items-end justify-center border-b border-[#f2f2f2] bg-[#f9f9f9] p-[8px]">
          <span className="whitespace-nowrap font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.4] text-[#828282]">
            Context
          </span>
        </div>
        <div className="h-[36px] border-b border-[#f2f2f2] bg-[#f9f9f9]" />
      </div>

      {files.length === 0 ? (
        <div className="flex h-[114px] flex-col items-center justify-center gap-[10px] bg-white">
          <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[13px] leading-[1.4] text-[#828282]">
            No files selected.
          </p>
          <button
            className="flex h-[30px] items-center justify-center gap-[6px] rounded-[4px] border border-[#029c91] bg-[#f9f9f9] px-[10px] font-['Helvetica_Neue:Medium',sans-serif] text-[13px] leading-none text-[#029c91] transition-colors hover:bg-[#eefaf9]"
            onClick={onAttachFiles}
            type="button"
          >
            <Upload size={15} strokeWidth={1.9} />
            Upload files
          </button>
        </div>
      ) : (
        <div className="grid w-full" style={{ gridTemplateColumns: ENTRY_TABLE_COLUMNS }}>
          {files.map((file) => {
            const hasInstructions = file.instructions.trim().length > 0;

            return (
              <div key={file.id} className="contents">
                <div className="flex h-[56px] min-w-0 items-center border-b border-[#f2f2f2] bg-white p-[8px]">
                  <span className="min-w-0 flex-1 break-words font-['Helvetica_Neue:Medium',sans-serif] text-[13px] font-semibold leading-[1.4] text-[#4f4f4f]">
                    {file.name}
                  </span>
                </div>
                <div className="flex h-[56px] min-w-0 items-center border-b border-[#f2f2f2] bg-white p-[8px]">
                  {hasInstructions ? (
                    <button
                      className="line-clamp-2 max-w-full border-none bg-transparent p-0 text-left font-['Helvetica_Neue:Italic',sans-serif] text-[13px] italic leading-[1.4] text-[#6f6f6f] transition-opacity hover:opacity-75"
                      onClick={(event) => onBeginInstructionEdit(file, event.currentTarget)}
                      type="button"
                    >
                      {file.instructions}
                    </button>
                  ) : (
                    <InstructionTextButton onClick={(event) => onBeginInstructionEdit(file, event.currentTarget)}>
                      Add instructions
                    </InstructionTextButton>
                  )}
                </div>
                <div className="flex h-[56px] items-center justify-center border-b border-[#f2f2f2] bg-white p-[8px]">
                  {hasInstructions && (
                    <InstructionTextButton onClick={(event) => onBeginInstructionEdit(file, event.currentTarget)}>
                      Edit
                    </InstructionTextButton>
                  )}
                </div>
                <div className="flex h-[56px] items-center justify-center border-b border-[#f2f2f2] bg-white p-[8px]">
                  <ContextToggle
                    active={file.useAsContext}
                    label={`${file.useAsContext ? "Disable" : "Enable"} ${file.name} as context`}
                    onToggle={() => onToggleContext(file.id)}
                  />
                </div>
                <div className="flex h-[56px] items-center justify-end border-b border-[#f2f2f2] bg-white p-[8px]">
                  <button
                    aria-label={`Remove ${file.name}`}
                    className="flex size-[20px] items-center justify-center border-none bg-transparent p-0 text-[#4f4f4f] transition-colors hover:text-[#c0392b]"
                    onClick={() => onRemoveFile(file.id)}
                    type="button"
                  >
                    <X size={20} strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CourseEntryScreen({ onBrowseLibrary, onAddUploadedFiles }: CourseEntryScreenProps) {
  const plusButtonRef = useRef<HTMLButtonElement>(null);
  const [filePickerOpen, setFilePickerOpen] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(INITIAL_UPLOADED_FILES);
  const [entryFiles, setEntryFiles] = useState<EntrySourceFile[]>([]);
  const [editingInstructionId, setEditingInstructionId] = useState<number | null>(null);
  const [instructionEditorPosition, setInstructionEditorPosition] = useState<InstructionEditorPosition | null>(null);
  const [instructionDraft, setInstructionDraft] = useState("");
  const [plusMenuPosition, setPlusMenuPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (plusMenuOpen && plusButtonRef.current) {
      const rect = plusButtonRef.current.getBoundingClientRect();
      setPlusMenuPosition({ x: rect.left, y: rect.top });
    }
  }, [plusMenuOpen]);

  function openAttachFlow() {
    setPlusMenuOpen(false);
    setUploadedFiles(INITIAL_UPLOADED_FILES);
    setFilePickerOpen(true);
  }

  function openUploadedFilesDialog() {
    setFilePickerOpen(false);
    setUploadModalOpen(true);
  }

  function closeUploadedFilesDialog() {
    setUploadModalOpen(false);
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
  }

  function addUploadedFiles() {
    if (uploadedFiles.length === 0) return;

    setEntryFiles((currentFiles) => {
      const existingIds = new Set(currentFiles.map((file) => file.id));
      const additions = uploadedFiles
        .filter((file) => !existingIds.has(file.id))
        .map((file) => ({
          ...file,
          useAsContext: true,
        }));

      return additions.length ? [...currentFiles, ...additions] : currentFiles;
    });
    onAddUploadedFiles(uploadedFiles);
    setFilePickerOpen(false);
    closeUploadedFilesDialog();
  }

  function beginInstructionEdit(file: EntrySourceFile, anchor: HTMLElement) {
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

    setEntryFiles((files) =>
      files.map((file) =>
        file.id === editingInstructionId ? { ...file, instructions: instructionDraft.trim() } : file
      )
    );
    cancelInstructionEdit();
  }

  function removeEntryFile(id: number) {
    setEntryFiles((files) => files.filter((file) => file.id !== id));
    if (editingInstructionId === id) {
      cancelInstructionEdit();
    }
  }

  function toggleEntryFileContext(id: number) {
    setEntryFiles((files) =>
      files.map((file) =>
        file.id === id ? { ...file, useAsContext: !file.useAsContext } : file
      )
    );
  }

  return (
    <>
    <div className="relative min-h-[900px] w-[1440px] overflow-hidden bg-[#f2f2f2]">
      <main className="flex min-h-[900px] w-full items-start justify-center pt-[220px]">
        <section className="flex w-[784px] flex-col items-center">
          <div className="flex w-[720px] flex-col items-center gap-[4px] text-center">
            <p className="m-0 font-['Helvetica_Neue:Regular',sans-serif] text-[18px] leading-[1.2] text-[#828282]">
              Create course with AI
            </p>
            <h2 className="m-0 font-['Helvetica_Neue:Bold',sans-serif] text-[28px] font-bold leading-[1.2] tracking-[0] text-[#4f4f4f]">
              Describe the <span className="text-[#9b51df]">course</span> you want to create
            </h2>
          </div>

          <div className="mt-[32px] flex w-[784px] flex-col items-center justify-center gap-[24px] rounded-[32px] border border-[#e0e0e0] bg-[#f9f9f9] p-[32px]">
            <div className="relative min-h-[150px] w-[720px] rounded-[16px] border border-[#e0e0e0] bg-white px-[16px] pb-[8px] pt-[16px] shadow-[0px_0px_32px_rgba(0,0,0,0.16)]">
              <div className="flex min-h-[70px] w-[688px] items-start gap-[8px] overflow-hidden">
                <p className="m-0 flex-1 font-['Helvetica_Neue:Regular',sans-serif] text-[16px] leading-[1.4] text-[#bdbdbd]">
                  {PROMPT_PLACEHOLDER}
                </p>
                <div className="size-[32px] shrink-0 bg-white" />
              </div>

              <div className="mt-[16px] flex w-full items-end justify-between">
                <div className="flex items-center gap-[8px]">
                  <button
                    ref={plusButtonRef}
                    aria-expanded={plusMenuOpen}
                    aria-label="Add source"
                    className={`flex size-[32px] items-center justify-center rounded-[8px] border-none p-[8px] transition-colors ${
                      plusMenuOpen ? "bg-[#e1f7f5] text-[#01837a]" : "bg-white text-[#4f4f4f] hover:bg-[#e1f7f5] hover:text-[#01837a]"
                    }`}
                    onClick={() => setPlusMenuOpen((open) => !open)}
                    type="button"
                  >
                    <Plus size={20} strokeWidth={2.1} />
                  </button>
                  <button
                    aria-label="Settings"
                    className="flex size-[32px] items-center justify-center rounded-[8px] border-none bg-white p-[8px] text-[#4f4f4f]"
                    type="button"
                  >
                    <Settings2 size={20} strokeWidth={1.9} />
                  </button>
                  <button
                    aria-label="Browse source library"
                    className="flex size-[32px] items-center justify-center rounded-[8px] border-none bg-white p-[8px] text-[#4f4f4f] transition-colors hover:bg-[#e1f7f5] hover:text-[#01837a]"
                    onClick={onBrowseLibrary}
                    type="button"
                  >
                    <BookOpen size={20} strokeWidth={1.9} />
                  </button>
                </div>
                <button
                  aria-label="Send"
                  className="flex size-[32px] items-center justify-center rounded-full border-none bg-[#029c91] text-white opacity-60"
                  type="button"
                >
                  <Send size={18} strokeWidth={1.8} />
                </button>
              </div>

              <button
                aria-label="Clear prompt"
                className="absolute right-[16px] top-[16px] flex size-[32px] items-center justify-center rounded-[8px] border-none bg-white p-[8px] text-[#4f4f4f]"
                type="button"
              >
                <X size={20} strokeWidth={1.9} />
              </button>
              <p className="mb-0 mt-[2px] font-['Helvetica_Neue:Regular',sans-serif] text-[10px] leading-[1.4] tracking-[0.4px] text-[#828282]">
                Currently in Beta
              </p>
            </div>

            <div className="flex w-full items-start justify-center gap-[16px]">
              <PromptGuideButton
                description="Add assets for creation"
                icon={<Paperclip size={20} strokeWidth={1.9} />}
                onClick={openAttachFlow}
                title="Attach files"
              />
              <PromptGuideButton
                description="Add pasted text as an additional source"
                icon={<Clipboard size={20} strokeWidth={1.9} />}
                title="Paste text"
              />
              <PromptGuideButton
                description="Set parameters for AI"
                icon={<SlidersHorizontal size={20} strokeWidth={1.9} />}
                title="Give guidance"
              />
              <PromptGuideButton
                description="Reference an existing product"
                icon={<ArrowUpRight size={20} strokeWidth={1.9} />}
                onClick={onBrowseLibrary}
                title="Add reference"
              />
            </div>

            <EntrySourceTable
              files={entryFiles}
              onAttachFiles={openAttachFlow}
              onBeginInstructionEdit={beginInstructionEdit}
              onRemoveFile={removeEntryFile}
              onToggleContext={toggleEntryFileContext}
            />
          </div>
        </section>
      </main>
    </div>

    {filePickerOpen && createPortal(
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={() => setFilePickerOpen(false)}
      >
        <img
          src={filePickerImg}
          alt="File picker"
          className="cursor-pointer rounded-[12px] shadow-[0px_8px_40px_rgba(0,0,0,0.4)]"
          onClick={(event) => {
            event.stopPropagation();
            addUploadedFiles();
          }}
        />
      </div>,
      document.body
    )}

    {plusMenuOpen && createPortal(
      <>
        <div className="fixed inset-0 z-[190]" onClick={() => setPlusMenuOpen(false)} />
        <div
          className="fixed z-[210] flex w-max flex-col items-start justify-center gap-[4px] rounded-[16px] bg-white p-[12px] shadow-[0px_0px_16px_rgba(0,0,0,0.16)]"
          style={{ left: plusMenuPosition.x, top: plusMenuPosition.y - 8, transform: "translateY(-100%)" }}
        >
          <div aria-hidden className="pointer-events-none absolute inset-[-1px] rounded-[17px] border border-[#e0e0e0]" />
          <button
            aria-label="Upload file from entry prompt"
            className="flex h-[20px] items-center gap-[4px] border-none bg-transparent p-0 text-[#4f4f4f] transition-opacity hover:opacity-70"
            onClick={openAttachFlow}
            type="button"
          >
            <span className="relative size-[20px] shrink-0 overflow-hidden">
              <span className="absolute inset-[7.74%_8.75%_7.23%_11.4%]">
                <svg className="absolute inset-0 block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.97 17.0055">
                  <path clipRule="evenodd" d={menuSvg.p1a8b9980} fill="#4F4F4F" fillRule="evenodd" />
                </svg>
              </span>
            </span>
            <span className="whitespace-nowrap font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.2]">
              Upload file
            </span>
          </button>
          <button
            aria-label="Browse libraries from entry prompt"
            className="flex h-[20px] items-center gap-[4px] border-none bg-transparent p-0 text-[#4f4f4f] transition-opacity hover:opacity-70"
            onClick={() => {
              setPlusMenuOpen(false);
              onBrowseLibrary();
            }}
            type="button"
          >
            <span className="relative size-[20px] shrink-0 overflow-hidden">
              <span className="absolute inset-[12.91%_8.76%_12.92%_17.08%]">
                <svg className="absolute inset-0 block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.8317 14.834">
                  <path d={promptSvg.p3e39c00} fill="#4F4F4F" />
                </svg>
              </span>
            </span>
            <span className="whitespace-nowrap font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.2]">
              Browse libraries
            </span>
          </button>
          <button
            aria-label="Paste text from entry prompt"
            className="flex h-[20px] items-center gap-[4px] border-none bg-transparent p-0 text-[#4f4f4f] transition-opacity hover:opacity-70"
            type="button"
          >
            <span className="relative size-[20px] shrink-0 overflow-hidden">
              <span className="absolute inset-[12.5%_20.83%_66.67%_58.33%]">
                <span className="absolute inset-[-14.4%]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.36667 5.36667">
                    <path d={menuSvg.p17b4b380} stroke="#4F4F4F" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
                  </svg>
                </span>
              </span>
              <span className="absolute inset-[12.5%_20.83%]">
                <span className="absolute inset-[-4%_-5.14%]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.8667 16.2">
                    <path d={menuSvg.p3677d700} stroke="#4F4F4F" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
                  </svg>
                </span>
              </span>
            </span>
            <span className="whitespace-nowrap font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.2]">
              Paste text
            </span>
          </button>
          <button
            aria-label="Add reference from entry prompt"
            className="flex h-[20px] items-center gap-[4px] border-none bg-transparent p-0 text-[#4f4f4f] transition-opacity hover:opacity-70"
            type="button"
          >
            <span className="relative size-[20px] shrink-0 overflow-hidden">
              <span className="absolute inset-[13.54%_9.38%]">
                <svg className="absolute inset-0 block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.25 14.5833">
                  <path clipRule="evenodd" d={menuSvg.pc1f5500} fill="#4F4F4F" fillRule="evenodd" />
                </svg>
              </span>
            </span>
            <span className="whitespace-nowrap font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.2]">
              Add reference
            </span>
            <span className="flex size-[20px] items-center justify-center rounded-[5px] bg-[#f2f2f2] font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.2] text-[#828282]">
              /
            </span>
          </button>
        </div>
      </>,
      document.body
    )}

    {uploadModalOpen && createPortal(
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.32)" }}
        onClick={closeUploadedFilesDialog}
      >
        <div
          className="flex h-[612px] max-h-[calc(100vh-48px)] w-[957px] max-w-[calc(100vw-48px)] flex-col items-start overflow-hidden rounded-[10px] bg-white shadow-[0px_0px_40px_0px_rgba(0,0,0,0.16)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex h-[54px] w-full shrink-0 items-center justify-between rounded-tl-[6px] rounded-tr-[6px] border-b border-[#e0e0e0] bg-white p-[16px]">
            <div className="flex min-w-0 items-center gap-[16px]">
              <p className="whitespace-nowrap font-['Helvetica_Neue:Medium',sans-serif] text-[18px] leading-[1.2] text-[#333]">
                Upload files
              </p>
              <button
                className="flex h-[32px] items-center justify-center rounded-[3px] border-[1.4px] border-[#029c91] bg-[#f9f9f9] px-[16px] pb-[11px] pt-[10px] font-['Helvetica_Neue:Medium',sans-serif] text-[14px] leading-[1.2] text-[#029c91]"
                onClick={() => {
                  setUploadModalOpen(false);
                  setFilePickerOpen(true);
                }}
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

          <div className="min-h-0 w-full flex-1 bg-white p-[24px]">
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
                      <div className="flex h-[56px] min-w-0 items-center border-b border-[#f2f2f2] bg-white p-[8px]">
                        {hasInstructions ? (
                          <span className="line-clamp-2 font-['Helvetica_Neue:Italic',sans-serif] text-[13px] italic leading-[1.4] text-[#6f6f6f]">
                            {file.instructions}
                          </span>
                        ) : (
                          <button
                            className="border-none bg-transparent p-0 font-['Helvetica_Neue:Medium',sans-serif] text-[13px] leading-[1.4] text-[#01837a]"
                            type="button"
                          >
                            Add instructions
                          </button>
                        )}
                      </div>
                      <div className="flex h-[56px] items-center justify-center border-b border-[#f2f2f2] bg-white p-[8px]" />
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
              onClick={addUploadedFiles}
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
