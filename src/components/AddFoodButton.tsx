import React from "react";
import { Plus } from "lucide-react";

interface AddFoodButtonProps {
  onClick: () => void;
}

export default function AddFoodButton({ onClick }: AddFoodButtonProps) {
  return (
    <button
      id="btn-action-add-food-floating"
      onClick={onClick}
      className="p-3.5 rounded-full shadow-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white border border-emerald-500 transition-all duration-300 flex items-center justify-center cursor-pointer active:scale-90 ring-4 ring-emerald-100 hover:shadow-emerald-200/50 group"
      title="Add New Food"
    >
      <Plus className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />

      {/* Tooltip badge on hover */}
      <span className="absolute bottom-full right-0 mb-2 px-2.5 py-1 bg-slate-900 text-white text-3xs font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
        Add Food
      </span>
    </button>
  );
}
