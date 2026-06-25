import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import svgPaths from "@/imports/BiglinePrompt/svg-zivflzfhju";
import menuSvg from "@/imports/Menu/svg-pth3l68o17";
import filePickerImg from "@/imports/image.png";
import svgPaths2 from "@/imports/DialogueBox-2/svg-ldr8c5u4x9";
import type { Source } from "./SourceLibraryDialog";

interface Props {
  attachedIds: number[];
  activeCount: number;
  sources: Source[];
  onOpenLibrary: () => void;
  onOpenSourceLibrary: () => void;
  onRemoveAttachment: (id: number) => void;
  onAddToPrompt: (id: number) => void;
}

function DocIcon() {
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

export default function LivePrompt({ attachedIds, activeCount, sources, onOpenLibrary, onOpenSourceLibrary, onRemoveAttachment, onAddToPrompt }: Props) {
  const hasAttachments = attachedIds.length > 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [addToPrompt, setAddToPrompt] = useState(true);
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const plusBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (menuOpen && plusBtnRef.current) {
      const r = plusBtnRef.current.getBoundingClientRect();
      setMenuPos({ x: r.left, y: r.top });
    }
  }, [menuOpen]);

  return (
    <>
    <div className="bg-white relative rounded-[16px] max-h-[342px] min-h-[150px]">
      <div className="flex flex-col gap-[2px] items-start max-h-[inherit] min-h-[inherit] overflow-clip pb-[8px] pt-[16px] px-[16px] relative rounded-[inherit]">

        {/* Attachments row — only shown when there are attached sources */}
        {hasAttachments && (
          <div className="flex gap-[8px] items-start overflow-clip w-full shrink-0 mb-[0px]">
            {attachedIds.map((id) => (
              <div
                key={id}
                className="group bg-[#f2f2f2] flex gap-[8px] items-center overflow-clip pl-[4px] pr-[8px] py-[4px] rounded-[8px] shrink-0 w-[128px] relative"
              >
                <DocIcon />
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
                    {/* Source library */}
                    <button onClick={() => { setMenuOpen(false); onOpenSourceLibrary(); }} className="flex gap-[4px] h-[20px] items-center bg-transparent border-none cursor-pointer hover:opacity-70 transition-opacity">
                      <div className="overflow-clip relative shrink-0 size-[20px]">
                        <div className="absolute inset-[12.91%_8.76%_12.92%_17.08%]">
                          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.8317 14.834">
                            <path d={svgPaths.p3e39c00} fill="#4F4F4F" />
                          </svg>
                        </div>
                      </div>
                      <span className="font-['Helvetica_Neue:Medium',sans-serif] text-[#4f4f4f] text-[14px] leading-[1.2] whitespace-nowrap">Source library</span>
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
          onClick={(e) => { e.stopPropagation(); setUploadOpen(false); setAddSourceOpen(true); }}
        />
      </div>,
      document.body
    )}

    {addSourceOpen && createPortal(
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.32)" }}
        onClick={() => setAddSourceOpen(false)}
      >
        <div
          className="w-[560px] bg-white rounded-[10px] drop-shadow-[0px_0px_20px_rgba(0,0,0,0.16)] flex flex-col items-start overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-white relative rounded-tl-[6px] rounded-tr-[6px] shrink-0 w-full">
            <div aria-hidden className="absolute border-[#e0e0e0] border-b border-solid inset-0 pointer-events-none rounded-tl-[6px] rounded-tr-[6px]" />
            <div className="flex items-center justify-between p-[16px]">
              <p className="font-['Helvetica_Neue:Medium',sans-serif] leading-[1.2] text-[#333] text-[18px] whitespace-nowrap">Add source</p>
              <button
                onClick={() => setAddSourceOpen(false)}
                className="relative shrink-0 size-[20px] cursor-pointer bg-transparent border-none p-0"
                aria-label="Close"
              >
                <div className="absolute bottom-[24.57%] left-1/4 right-[24.22%] top-1/4">
                  <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.1562 10.0869">
                    <path d={svgPaths2.p80fb800} fill="#4F4F4F" />
                  </svg>
                </div>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="bg-white w-full">
            <div className="flex flex-col gap-[16px] items-start p-[24px]">
              {/* File pill */}
              <div className="bg-[#f2f2f2] flex gap-[8px] items-center overflow-clip pl-[4px] pr-[8px] py-[4px] rounded-[8px] shrink-0 w-[178px]">
                <div className="bg-[#5c6bc0] flex items-center justify-center rounded-[4px] shrink-0 size-[40px]">
                  <div className="overflow-clip relative shrink-0 size-[24px]">
                    <div className="absolute inset-[8.75%_17.08%]">
                      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.8 19.8">
                        <path clipRule="evenodd" d={svgPaths2.p1ec74d80} fill="white" fillRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                <span className="font-['Helvetica_Neue:Regular',sans-serif] text-[#4f4f4f] text-[13px] leading-[1.4] overflow-hidden text-ellipsis whitespace-nowrap">Course outline.pdf</span>
              </div>

              {/* Description textarea */}
              <div className="bg-white h-[156px] relative rounded-[2px] w-full">
                <div aria-hidden className="absolute border border-[#e0e0e0] border-solid inset-0 pointer-events-none rounded-[2px]" />
                <div className="flex flex-col items-start p-[12px] size-full">
                  <p className="font-['Helvetica_Neue:Regular',sans-serif] leading-[1.4] text-[#828282] text-[17px]">Describe what it is and how AI should use it...</p>
                </div>
              </div>

              {/* Checkboxes */}
              <label className="flex gap-[8px] items-center cursor-pointer">
                <div className={`relative rounded-[2px] shrink-0 size-[16px] flex items-center justify-center transition-colors ${saveToLibrary ? "bg-[#029c91]" : "bg-white"}`}>
                  <div aria-hidden className={`absolute inset-0 border border-solid rounded-[2px] pointer-events-none ${saveToLibrary ? "border-[#029c91]" : "border-[#bdbdbd]"}`} />
                  {saveToLibrary && <svg width="10" height="7" viewBox="0 0 10 7" fill="none"><path d="M1 3.5L3.5 6L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <input type="checkbox" checked={saveToLibrary} onChange={() => setSaveToLibrary(v => !v)} className="sr-only" />
                <span className="font-['Helvetica_Neue:Regular',sans-serif] text-[#4f4f4f] text-[14px] leading-[1.2] whitespace-nowrap">Save to source library</span>
              </label>
              <label className="flex gap-[8px] items-center cursor-pointer">
                <div className={`relative rounded-[2px] shrink-0 size-[16px] flex items-center justify-center transition-colors ${addToPrompt ? "bg-[#029c91]" : "bg-white"}`}>
                  <div aria-hidden className={`absolute inset-0 border border-solid rounded-[2px] pointer-events-none ${addToPrompt ? "border-[#029c91]" : "border-[#bdbdbd]"}`} />
                  {addToPrompt && <svg width="10" height="7" viewBox="0 0 10 7" fill="none"><path d="M1 3.5L3.5 6L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <input type="checkbox" checked={addToPrompt} onChange={() => setAddToPrompt(v => !v)} className="sr-only" />
                <span className="font-['Helvetica_Neue:Regular',sans-serif] text-[#4f4f4f] text-[14px] leading-[1.2] whitespace-nowrap">Add to prompt</span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white drop-shadow-[0px_-4px_0px_rgba(0,0,0,0.04)] rounded-bl-[6px] rounded-br-[6px] w-full">
            <div className="flex justify-end gap-[9px] p-[16px]">
              <button
                onClick={() => {
                  if (addToPrompt) onAddToPrompt(1);
                  setAddSourceOpen(false);
                }}
                className="bg-[#029c91] flex gap-[4px] items-center justify-center pb-[11px] pt-[10px] px-[16px] rounded-[5px] cursor-pointer border-none"
              >
                <span className="font-['Helvetica_Neue:Medium',sans-serif] text-white text-[16px] leading-[1.2]">Add</span>
              </button>
              <button
                onClick={() => setAddSourceOpen(false)}
                className="bg-[#f9f9f9] relative flex gap-[4px] items-center justify-center pb-[11px] pt-[10px] px-[16px] rounded-[6px] cursor-pointer border-none"
              >
                <div aria-hidden className="absolute border-[#029c91] border-[1.4px] border-solid inset-0 pointer-events-none rounded-[6px]" />
                <span className="font-['Helvetica_Neue:Medium',sans-serif] text-[#029c91] text-[16px] leading-[1.2]">Cancel</span>
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
