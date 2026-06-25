import { useEffect, useRef, useState } from "react";
import WebsiteBuilder from "@/imports/WebsiteBuilder";
import SourceLibraryDialog, { type DeactivationMode, type Source } from "./SourceLibraryDialog";
import SourceLibraryModal from "./SourceLibraryModal";
import AddFromLibraryModal from "./AddFromLibraryModal";
import MultiLibraryModal from "./MultiLibraryModal";
import LivePrompt, { type UploadedFile } from "./LivePrompt";
import { INITIAL_SOURCES } from "./sourceLibraryData";

export default function App() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sourceLibraryOpen, setSourceLibraryOpen] = useState(false);
  const [addFromLibraryOpen, setAddFromLibraryOpen] = useState(false);
  const [addFromOtherCourseOpen, setAddFromOtherCourseOpen] = useState(false);
  // === Multi-library feature (experimental) — remove this line + the toggle + the
  // MultiLibraryModal branch below to drop the feature entirely. ===
  const [multiLibrary, setMultiLibrary] = useState(() => {
    try { return localStorage.getItem("ff_multi_library") === "1"; } catch { return false; }
  });
  // === Source libraries breadcrumb feature (experimental) — remove this line +
  // the toggle + showSourceLibrariesBreadcrumb prop to hide this control. ===
  const [sourceLibraries, setSourceLibraries] = useState(() => {
    try { return localStorage.getItem("ff_source_libraries") === "1"; } catch { return false; }
  });
  // === Priority-source feature (experimental) — remove this line + the toggle + the
  // allowPriority props below to drop the feature. ===
  const [prioritySource, setPrioritySource] = useState(() => {
    try { return localStorage.getItem("ff_priority_source") === "1"; } catch { return false; }
  });
  // === Instructions feature (experimental) — remove this line + the toggle + the
  // showInstructions prop to drop the feature. ===
  const [instructions, setInstructions] = useState(() => {
    try { return localStorage.getItem("ff_instructions") === "1"; } catch { return false; }
  });
  // === Prompt button feature (experimental) — remove this line + the toggle +
  // showPromptButton prop to drop the per-file prompt action. ===
  const [promptButton, setPromptButton] = useState(() => {
    try { return localStorage.getItem("ff_prompt_button") === "1"; } catch { return false; }
  });
  const [sourceLibraryMode, setSourceLibraryMode] = useState<"select" | "manage">("manage");
  const [attachedIds, setAttachedIds] = useState<number[]>([]);
  // Attachments that were added as a priority source (golden star chip in the prompt).
  const [priorityIds, setPriorityIds] = useState<number[]>([]);
  const [sources, setSources] = useState<Source[]>(INITIAL_SOURCES);
  const [promptOnlySources, setPromptOnlySources] = useState<Source[]>([]);
  const [deactivationMode, setDeactivationMode] = useState<DeactivationMode>("none");
  const [justDuplicatedSourceIds, setJustDuplicatedSourceIds] = useState<number[]>([]);
  const duplicateNoticeTimeoutRef = useRef<number | null>(null);

  const activeCount = deactivationMode !== "none" ? 0 : sources.filter((s) => s.active).length;
  const promptSources = [...sources, ...promptOnlySources.filter((source) => !sources.some((candidate) => candidate.id === source.id))];

  useEffect(() => {
    return () => {
      if (duplicateNoticeTimeoutRef.current !== null) {
        window.clearTimeout(duplicateNoticeTimeoutRef.current);
      }
    };
  }, []);

  function toggleMultiLibrary() {
    setMultiLibrary((value) => {
      const next = !value;
      try { localStorage.setItem("ff_multi_library", next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });
  }

  function toggleSourceLibraries() {
    setSourceLibraries((value) => {
      const next = !value;
      try { localStorage.setItem("ff_source_libraries", next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });
  }

  function togglePrioritySource() {
    setPrioritySource((value) => {
      const next = !value;
      try { localStorage.setItem("ff_priority_source", next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });
  }

  function toggleInstructions() {
    setInstructions((value) => {
      const next = !value;
      try { localStorage.setItem("ff_instructions", next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });
  }

  function togglePromptButton() {
    setPromptButton((value) => {
      const next = !value;
      try { localStorage.setItem("ff_prompt_button", next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });
  }

  // Adds selected sources to the prompt. Foreign sources stay prompt-only unless
  // the user explicitly duplicates them into this course from the source library.
  function handleAddSources(selected: Source[]) {
    setPromptOnlySources((prev) => {
      const known = new Set([...sources.map((source) => source.id), ...prev.map((source) => source.id)]);
      const additions = selected
        .filter((source) => !known.has(source.id))
        .map((source) => ({ ...source, active: false }));

      return additions.length ? [...prev, ...additions] : prev;
    });

    // A selected source that is still active is one picked as a priority source.
    const priority = selected.filter((source) => source.active).map((source) => source.id);
    setPriorityIds((prev) => [...new Set([...prev, ...priority])]);
    setAttachedIds((prev) => [...new Set([...prev, ...selected.map((source) => source.id)])]);
    setAddFromLibraryOpen(false);
    setAddFromOtherCourseOpen(false);
  }

  function handleDuplicateSourcesToCurrentCourse(selected: Source[]) {
    const alreadyDuplicated = new Set(sources.map((source) => source.originSourceId ?? source.id));
    const usedIds = new Set([
      ...sources.map((source) => source.id),
      ...promptOnlySources.map((source) => source.id),
    ]);
    let nextId = -1;
    const additions = selected
      .filter((source) => !alreadyDuplicated.has(source.id))
      .map((source) => {
        while (usedIds.has(nextId)) {
          nextId -= 1;
        }

        const duplicatedSource = {
          ...source,
          id: nextId,
          originSourceId: source.originSourceId ?? source.id,
          active: false,
        };
        usedIds.add(nextId);
        nextId -= 1;

        return duplicatedSource;
      });

    setSources((prev) => {
      return additions.length ? [...prev, ...additions] : prev;
    });

    if (additions.length > 0) {
      setJustDuplicatedSourceIds(additions.map((source) => source.id));

      if (duplicateNoticeTimeoutRef.current !== null) {
        window.clearTimeout(duplicateNoticeTimeoutRef.current);
      }

      duplicateNoticeTimeoutRef.current = window.setTimeout(() => {
        setJustDuplicatedSourceIds([]);
        duplicateNoticeTimeoutRef.current = null;
      }, 8000);
    }

    setAddFromOtherCourseOpen(false);
  }

  function handleAttach(id: number) {
    setAttachedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleAddUploadedFiles(files: UploadedFile[]) {
    const uploadedIds = files.map((file) => file.id);

    setSources((prevSources) => {
      const nextSources = [...prevSources];

      files.forEach((file) => {
        const existingIndex = nextSources.findIndex((source) => source.id === file.id);
        const uploadedSource: Source = {
          id: file.id,
          name: file.name,
          type: "file",
          active: file.addToLibrary,
          dropdownLabel: "Balanced",
          note: file.instructions,
        };

        if (existingIndex >= 0) {
          nextSources[existingIndex] = {
            ...nextSources[existingIndex],
            ...uploadedSource,
          };
        } else {
          nextSources.push(uploadedSource);
        }
      });

      return nextSources;
    });

    setAttachedIds((prev) => [...new Set([...prev, ...uploadedIds])]);
  }

  return (
    <div className="min-h-screen w-full overflow-auto bg-white flex items-start justify-center">
      {/* === Experimental feature toggles — remove this block to drop the toggles === */}
      <div className="fixed right-[12px] top-[12px] z-[200] flex flex-col items-end gap-[6px]">
        <FeatureToggle label="Multi-library" on={multiLibrary} onToggle={toggleMultiLibrary} />
        <FeatureToggle label="Source libraries" on={sourceLibraries} onToggle={toggleSourceLibraries} />
        <FeatureToggle label="Priority source" on={prioritySource} onToggle={togglePrioritySource} />
        <FeatureToggle label="Instructions" on={instructions} onToggle={toggleInstructions} />
        <FeatureToggle label="Prompt button" on={promptButton} onToggle={togglePromptButton} />
      </div>

      <div className="min-w-[1440px] w-[1440px] relative">
        <WebsiteBuilder />

        {/* Live prompt overlay — anchored from the bottom */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[528px] h-[342px] w-[720px] z-10 flex items-end">
          <LivePrompt
            attachedIds={attachedIds}
            priorityIds={priorityIds}
            activeCount={activeCount}
            sources={promptSources}
            onOpenLibrary={() => setDialogOpen(true)}
            onOpenSourceLibrary={() => setAddFromLibraryOpen(true)}
            onRemoveAttachment={(id) => {
              setAttachedIds((prev) => prev.filter((x) => x !== id));
              setPriorityIds((prev) => prev.filter((x) => x !== id));
            }}
            onAddUploadedFiles={handleAddUploadedFiles}
          />
        </div>

        {/* Transparent click target over the library badge */}
        <button
          onClick={() => setDialogOpen(true)}
          className="absolute left-[468px] top-[812px] w-[56px] h-[48px] cursor-pointer z-20"
          aria-label="Open source library"
          style={{ background: "transparent", border: "none" }}
        />
      </div>

      {/* Knowledge Center dialog */}
      {dialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.32)" }}
          onClick={() => setDialogOpen(false)}
        >
          <div
            className="h-[761px] max-h-[calc(100vh-48px)] w-[1121px] max-w-[calc(100vw-48px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <SourceLibraryDialog
              onClose={() => setDialogOpen(false)}
              currentCourseName="Greek Mythology 101"
              attachedIds={attachedIds}
              onAttach={handleAttach}
              sources={sources}
              setSources={setSources}
              justDuplicatedSourceIds={justDuplicatedSourceIds}
              deactivationMode={deactivationMode}
              onSetDeactivationMode={setDeactivationMode}
              multiLibrary={multiLibrary}
              showSourceLibrariesBreadcrumb={sourceLibraries}
              showInstructions={instructions}
              showPromptButton={promptButton}
              onOpenSourceLibrary={() => { setSourceLibraryMode("select"); setSourceLibraryOpen(true); }}
              onOpenOtherCourseLibrary={() => setAddFromOtherCourseOpen(true)}
            />
          </div>
        </div>
      )}

      {/* Source Library modal */}
      {sourceLibraryOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.32)" }}
          onClick={() => setSourceLibraryOpen(false)}
        >
          <div
            className="w-[960px] h-[600px]"
            onClick={(e) => e.stopPropagation()}
          >
            <SourceLibraryModal
              mode={sourceLibraryMode}
              onClose={() => setSourceLibraryOpen(false)}
              attachedIds={attachedIds}
              onAttach={handleAttach}
              sources={sources}
              setSources={setSources}
              onAdd={(ids) => {
                if (sourceLibraryMode === "manage") {
                  setAttachedIds((prev) => [...new Set([...prev, ...ids])]);
                } else {
                  setSources(sources.map((s) => ids.includes(s.id) ? { ...s, active: true } : s));
                }
                setSourceLibraryOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Add from source library modal (from the prompt's + menu) */}
      {addFromLibraryOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.32)" }}
          onClick={() => setAddFromLibraryOpen(false)}
        >
          <div
            className={`${instructions ? "w-[1040px]" : "w-[760px]"} max-h-[calc(100vh-48px)] max-w-[calc(100vw-48px)]`}
            onClick={(e) => e.stopPropagation()}
          >
            {multiLibrary ? (
              <MultiLibraryModal
                onClose={() => setAddFromLibraryOpen(false)}
                currentCourseName="Greek Mythology 101"
                sources={sources}
                attachedIds={attachedIds}
                priorityIds={priorityIds}
                onAddSources={handleAddSources}
                allowPriority={prioritySource}
                showInstructions={instructions}
              />
            ) : (
              <AddFromLibraryModal
                onClose={() => setAddFromLibraryOpen(false)}
                sources={sources}
                attachedIds={attachedIds}
                priorityIds={priorityIds}
                onAdd={(ids) => {
                  // A selected source that is already active was picked as a priority source.
                  const priority = ids.filter((id) => sources.find((s) => s.id === id)?.active);
                  setPriorityIds((prev) => [...new Set([...prev, ...priority])]);
                  setAttachedIds((prev) => [...new Set([...prev, ...ids])]);
                  setAddFromLibraryOpen(false);
                }}
                onOpenLibrary={() => { setAddFromLibraryOpen(false); setDialogOpen(true); }}
                allowPriority={prioritySource}
                showInstructions={instructions}
              />
            )}
          </div>
        </div>
      )}

      {/* Add file from another course (from the Source Library dialog header) */}
      {addFromOtherCourseOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.32)" }}
          onClick={() => setAddFromOtherCourseOpen(false)}
        >
          <div
            className="h-[761px] max-h-[calc(100vh-48px)] w-[1121px] max-w-[calc(100vw-48px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <MultiLibraryModal
              onClose={() => setAddFromOtherCourseOpen(false)}
              currentCourseName="Greek Mythology 101"
              sources={sources}
              attachedIds={attachedIds}
              priorityIds={priorityIds}
              onAddSources={handleDuplicateSourcesToCurrentCourse}
              mode="duplicate"
              allowPriority={prioritySource}
              showInstructions={instructions}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Tiny corner toggle for experimental feature flags. Single button (no <label>
// wrapper) so a click never double-fires.
function FeatureToggle({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button
      aria-label={`Toggle ${label}`}
      aria-pressed={on}
      className="flex cursor-pointer items-center gap-[6px] rounded-full border border-[#e0e0e0] bg-white/90 px-[8px] py-[4px] text-[11px] text-[#828282] opacity-60 shadow-sm backdrop-blur transition-opacity hover:opacity-100"
      onClick={onToggle}
      type="button"
    >
      <span className="font-['Helvetica_Neue:Medium',sans-serif]">{label}</span>
      <span className={`relative h-[16px] w-[28px] shrink-0 rounded-full transition-colors ${on ? "bg-[#029c91]" : "bg-[#d0d0d0]"}`}>
        <span className={`absolute top-[2px] block size-[12px] rounded-full bg-white transition-transform ${on ? "translate-x-[14px]" : "translate-x-[2px]"}`} />
      </span>
    </button>
  );
}
