import React from "react";
import { Eye, EyeOff } from "lucide-react";

interface ActiveRecallToggleProps {
  isFlashcardMode: boolean;
  onToggle: () => void;
}

export default function ActiveRecallToggle({
  isFlashcardMode,
  onToggle,
}: ActiveRecallToggleProps) {
  return (
    <button
      id="btn-toggle-flashcard-floating"
      onClick={onToggle}
      className={`p-3.5 rounded-full shadow-lg border transition-all duration-300 flex items-center justify-center cursor-pointer active:scale-90 group ${
        isFlashcardMode
          ? "bg-indigo-600 border-indigo-500 text-white ring-4 ring-indigo-100"
          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
      }`}
      title={
        isFlashcardMode
          ? "Active Recall Mode ON (Definitions Hidden)"
          : "Active Recall Mode OFF (Definitions Visible)"
      }
    >
      {isFlashcardMode ? (
        <EyeOff className="w-5 h-5 animate-in fade-in zoom-in" />
      ) : (
        <Eye className="w-5 h-5 text-indigo-600 animate-in fade-in zoom-in" />
      )}

      {/* Tooltip badge on hover */}
      <span className="absolute bottom-full right-0 mb-2 px-2.5 py-1 bg-slate-900 text-white text-3xs font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
        {isFlashcardMode ? "Definitions Hidden (Active Recall)" : "Active Recall Mode"}
      </span>
    </button>
  );
}
