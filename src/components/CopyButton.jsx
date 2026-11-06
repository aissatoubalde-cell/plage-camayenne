import { useState } from "react";
import { Icon } from "./ui/icons";

export default function CopyButton({ text, label = "Copier", className = "" }) {
  const [state, setState] = useState("idle");
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setState("done"); } catch { setState("fail"); }
    setTimeout(() => setState("idle"), 1800);
  };
  return (
    <button type="button" onClick={copy} className={className || "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-3 py-[7px] text-xs leading-none font-semibold tracking-[0.06em] uppercase text-sand-soft transition-colors hover:border-gold hover:text-gold"}>
      <Icon name={state === "done" ? "check" : "copy"} className="h-3.5 w-3.5" />
      {state === "done" ? "Copié" : state === "fail" ? "Copie impossible" : label}
    </button>
  );
}
