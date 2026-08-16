import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { Edit3, Check, Trash2, Save, UtensilsCrossed } from 'lucide-react';
import { FoodCard, COLOR_THEMES, ColorThemeName } from '../types';

interface FoodCardProps {
  card: FoodCard;
  onUpdateNotes: (id: string, newNotes: string) => void;
  onDelete: (id: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function FoodCardComponent({
  card,
  onUpdateNotes,
  onDelete,
  onNext,
  onPrev,
}: FoodCardProps) {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState(card.notes || '');
  const [isFlipped, setIsFlipped] = useState(false);

  // Show the front (image) side whenever the active card changes
  useEffect(() => {
    setIsFlipped(false);
    setIsEditingNotes(false);
  }, [card.id]);

  // Drag and swipe mechanics
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-150, 150], [-8, 8]);
  const opacity = useTransform(
    x,
    [-200, -100, 0, 100, 200],
    [0.4, 0.9, 1, 0.9, 0.4],
  );

  const theme =
    COLOR_THEMES[card.colorTheme as ColorThemeName] || COLOR_THEMES.indigo;

  const handleDragEnd = (_event: any, info: any) => {
    const swipeThreshold = 80;
    if (info.offset.x < -swipeThreshold) {
      onNext();
    } else if (info.offset.x > swipeThreshold) {
      onPrev();
    }
  };

  const handleSaveNotes = () => {
    onUpdateNotes(card.id, editedNotes);
    setIsEditingNotes(false);
  };

  return (
    <div
      className="relative w-full max-w-sm mx-auto aspect-[3/4] sm:aspect-auto select-none"
      style={{ perspective: '1400px' }}
    >
      <motion.div
        id={`food-card-${card.id}`}
        style={{ x, rotate, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 0.98, cursor: 'grabbing' }}
        onTap={(event) => {
          const target = event.target as HTMLElement | null;
          if (target?.closest('[data-no-flip]')) return;
          setIsFlipped((f) => !f);
        }}
        className="w-full h-150 cursor-pointer"
      >
        <div
          className="relative w-full h-full transition-transform duration-500 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front Face — image only */}
          <div
            className={`absolute inset-0 bg-white rounded-3xl border-2 ${theme.border} shadow-xl hover:shadow-2xl transition-shadow duration-300 overflow-hidden group`}
            style={{
              backfaceVisibility: 'hidden',
              pointerEvents: isFlipped ? 'none' : 'auto',
            }}
          >
            <img
              src={card.imageUrl}
              alt={card.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Theme overlay tint */}
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

            {/* Quick action buttons on image */}
            <div
              className="absolute top-4 right-4 flex items-center gap-2"
              data-no-flip
              onPointerDownCapture={(e) => e.stopPropagation()}
            >
              <button
                id={`btn-delete-${card.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (
                    confirm(`Are you sure you want to delete "${card.name}"?`)
                  ) {
                    onDelete(card.id);
                  }
                }}
                className="p-2.5 rounded-full bg-black/40 border border-white/20 text-white/80 hover:bg-red-500/80 hover:border-red-400 backdrop-blur-md shadow-sm transition-all duration-300"
                title="Delete Food"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Badge & meal type on card image bottom */}
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
              <div className="space-y-0.5">
                <span className="text-xs uppercase font-semibold tracking-wider text-white/80">
                  {card.mealType}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-md">
                  {card.name}
                </h2>
              </div>
            </div>

            <span className="absolute bottom-4 right-4 text-3xs font-semibold uppercase tracking-wider text-white/70 bg-black/30 backdrop-blur-xs px-2 py-1 rounded-full border border-white/10">
              Tap for details
            </span>
          </div>

          {/* Back Face — remaining info */}
          <div
            className={`absolute inset-0 bg-white rounded-3xl border-2 ${theme.border} shadow-xl overflow-hidden flex flex-col`}
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              pointerEvents: isFlipped ? 'auto' : 'none',
            }}
          >
            <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4 flex-1">
                {/* Header */}
                <div className="space-y-0.5">
                  <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">
                    {card.mealType}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800">
                    {card.name}
                  </h2>
                </div>

                {/* User written Notes */}
                <div
                  className={`p-4 rounded-2xl border transition-colors duration-300 ${theme.bg} ${theme.border} space-y-2`}
                  data-no-flip
                  onClick={(e) => e.stopPropagation()}
                  onPointerDownCapture={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${theme.text}`}
                    >
                      <UtensilsCrossed className="w-3.5 h-3.5" />
                      Notes
                    </span>
                    {!isEditingNotes ? (
                      <button
                        id={`btn-edit-notes-${card.id}`}
                        onClick={() => {
                          setIsEditingNotes(true);
                          setEditedNotes(card.notes || '');
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                        title="Edit notes"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        id={`btn-save-notes-${card.id}`}
                        onClick={handleSaveNotes}
                        className={`p-1 rounded-md ${theme.text} hover:opacity-80 transition-opacity`}
                        title="Save notes"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {isEditingNotes ? (
                    <div className="space-y-2">
                      <textarea
                        id={`textarea-notes-${card.id}`}
                        value={editedNotes}
                        onChange={(e) => setEditedNotes(e.target.value)}
                        placeholder="Recipe idea, where to get it, how it tastes..."
                        className="w-full text-xs sm:text-sm bg-white/90 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden resize-none h-18 text-slate-700"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setIsEditingNotes(false)}
                          className="px-2.5 py-1 text-2xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveNotes}
                          className={`px-2.5 py-1 text-2xs font-medium text-white ${theme.accent} hover:opacity-90 rounded-md transition-opacity flex items-center gap-1`}
                        >
                          <Save className="w-3 h-3" /> Save
                        </button>
                      </div>
                    </div>
                  ) : card.notes ? (
                    <p className="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed">
                      {card.notes}
                    </p>
                  ) : (
                    <button
                      id={`btn-add-notes-${card.id}`}
                      onClick={() => setIsEditingNotes(true)}
                      className="w-full py-2.5 border border-dashed border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-500 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Edit3 className="w-3 h-3" />
                      Add a note about this food...
                    </button>
                  )}
                </div>
              </div>

              <span className="pt-4 text-3xs font-semibold uppercase tracking-wider text-slate-300 text-center">
                Tap card to flip back
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
