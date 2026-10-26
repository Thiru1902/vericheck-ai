import React from "react";
import { ShieldAlert, Info } from "lucide-react";

export default function AdvisoryBanner() {
  return (
    <aside aria-label="Regulatory Notice" className="bg-amber-500 text-slate-950 px-4 py-2 border-b border-amber-600 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-xs font-bold text-center tracking-wide">
        <ShieldAlert className="w-4 h-4 flex-shrink-0 text-slate-950" />
        <span>
          AI findings are advisory. Final decision rests with the competent AICTE authority.
        </span>
      </div>
    </aside>
  );
}
