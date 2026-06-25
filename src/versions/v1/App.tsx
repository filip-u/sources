import { useState } from "react";
import WebsiteBuilder from "@/imports/WebsiteBuilder";
import SourceLibraryDialog, { INITIAL_SOURCES, type Source } from "./SourceLibraryDialog";
import SourceLibraryModal from "./SourceLibraryModal";
import LivePrompt from "./LivePrompt";

export default function App() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sourceLibraryOpen, setSourceLibraryOpen] = useState(false);
  const [sourceLibraryMode, setSourceLibraryMode] = useState<"select" | "manage">("manage");
  const [attachedIds, setAttachedIds] = useState<number[]>([]);
  const [sources, setSources] = useState<Source[]>(INITIAL_SOURCES);

  const activeCount = sources.filter((s) => s.active).length;

  function handleAttach(id: number) {
    setAttachedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div className="min-h-screen w-full overflow-auto bg-white flex items-start justify-center">
      <div className="min-w-[1440px] w-[1440px] relative">
        <WebsiteBuilder />

        {/* Live prompt overlay — anchored from the bottom */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[528px] h-[342px] w-[720px] z-10 flex items-end">
          <LivePrompt
            attachedIds={attachedIds}
            activeCount={activeCount}
            sources={sources}
            onOpenLibrary={() => setDialogOpen(true)}
            onOpenSourceLibrary={() => { setSourceLibraryMode("manage"); setSourceLibraryOpen(true); }}
            onRemoveAttachment={(id) => setAttachedIds((prev) => prev.filter((x) => x !== id))}
            onAddToPrompt={(id) => setAttachedIds((prev) => prev.includes(id) ? prev : [...prev, id])}
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
            className="w-[960px] h-[600px]"
            onClick={(e) => e.stopPropagation()}
          >
            <SourceLibraryDialog
              onClose={() => setDialogOpen(false)}
              attachedIds={attachedIds}
              onAttach={handleAttach}
              sources={sources}
              setSources={setSources}
              onOpenSourceLibrary={() => { setSourceLibraryMode("select"); setSourceLibraryOpen(true); }}
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
    </div>
  );
}
