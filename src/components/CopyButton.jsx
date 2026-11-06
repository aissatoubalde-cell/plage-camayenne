import { useState } from "react";

export default function CopyButton({ text, label = "Copier", className = "" }) {
  const [state, setState] = useState("idle");
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setState("done"); } catch { setState("fail"); }
    setTimeout(() => setState("idle"), 1800);
  };
  return (
    <button type="button" onClick={copy} className={className || "cursor-pointer rounded-[2px] border border-line px-2.5 py-[7px] text-xs leading-none font-semibold tracking-[0.06em] uppercase text-sand-soft"}>
      {state === "done" ? "Copié" : state === "fail" ? "Copie impossible" : label}
    </button>
  );
}
