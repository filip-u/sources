import { useState } from "react";
import V1App from "./versions/v1/App";
import V2App from "./versions/v2/App";
import V3App from "./versions/v3/App";

type VersionId = "v1" | "v2" | "v3";

const VERSIONS: { id: VersionId; label: string; Component: React.ComponentType }[] = [
  { id: "v1", label: "Version 1", Component: V1App },
  { id: "v2", label: "Version 2", Component: V2App },
  { id: "v3", label: "Version 3", Component: V3App },
];

export default function App() {
  const [version, setVersion] = useState<VersionId>("v1");

  const Active = VERSIONS.find((v) => v.id === version)!.Component;

  return (
    <div className="relative">
      {/* Version switcher — floats above whichever version is active */}
      <div
        className="fixed top-3 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 rounded-full border border-black/10 bg-white/90 px-3 py-1.5 shadow-lg backdrop-blur"
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        <label htmlFor="version-switcher" className="text-xs font-medium text-neutral-500">
          Version
        </label>
        <select
          id="version-switcher"
          value={version}
          onChange={(e) => setVersion(e.target.value as VersionId)}
          className="cursor-pointer rounded-md bg-transparent text-sm font-semibold text-neutral-900 outline-none"
        >
          {VERSIONS.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      {/* Remount the active version on switch so each starts from a clean state */}
      <Active key={version} />
    </div>
  );
}
