import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import {
  Volume2,
  Edit3,
  Check,
  Trash2,
  HelpCircle,
  Save,
  BookOpen,
  Star,
} from 'lucide-react';
import { VocabularyCard, COLOR_THEMES, ColorThemeName } from '../types';

interface VocabularyCardProps {
  card: VocabularyCard;
  isFlashcardMode: boolean;
  isMemorized: boolean;
  onToggleMemorized: (id: string) => void;
  onUpdateContext: (id: string, newContext: string) => void;
  onDelete: (id: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function VocabularyCardComponent({
  card,
  isFlashcardMode,
  isMemorized,
  onToggleMemorized,
  onUpdateContext,
  onDelete,
  onNext,
  onPrev,
}: VocabularyCardProps) {
  const [isEditingContext, setIsEditingContext] = useState(false);
  const [editedContext, setEditedContext] = useState(card.customContext || '');
  const [isRevealed, setIsRevealed] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

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
      setIsRevealed(false);
    } else if (info.offset.x > swipeThreshold) {
      onPrev();
      setIsRevealed(false);
    }
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.speechSynthesis) return;

    // If currently speaking, cancel it
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(card.word);
    utterance.lang = 'en-US';
    utterance.rate = 0.85; // Slightly slower for clear educational articulation

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleSaveContext = () => {
    onUpdateContext(card.id, editedContext);
    setIsEditingContext(false);
  };

  return (
    <div className="relative w-full max-w-sm mx-auto aspect-[3/4] sm:aspect-auto select-none">
      <motion.div
        id={`vocab-card-${card.id}`}
        style={{ x, rotate, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 0.98, cursor: 'grabbing' }}
        className={`w-full bg-white rounded-3xl border-2 ${theme.border} shadow-xl hover:shadow-2xl transition-shadow duration-300 overflow-hidden flex flex-col h-150`}
      >
        {/* Card Image Block */}
        <div className="relative h-70 sm:h-52 w-full bg-slate-100 overflow-hidden group">
          <img
            src={card.imageUrl}
            alt={card.word}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Theme overlay tint */}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

          {/* Quick action buttons on image */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              id={`btn-memorized-${card.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleMemorized(card.id);
              }}
              className={`p-2.5 rounded-full backdrop-blur-md shadow-sm border transition-all duration-300 ${
                isMemorized
                  ? 'bg-emerald-500 border-emerald-400 text-white'
                  : 'bg-black/40 border-white/20 text-white/80 hover:bg-black/60'
              }`}
              title={isMemorized ? 'Marked as Memorized' : 'Mark as Memorized'}
            >
              <Star
                className={`w-4.5 h-4.5 ${isMemorized ? 'fill-white' : ''}`}
              />
            </button>
            <button
              id={`btn-delete-${card.id}`}
              onClick={(e) => {
                e.stopPropagation();
                if (
                  confirm(`Are you sure you want to delete "${card.word}"?`)
                ) {
                  onDelete(card.id);
                }
              }}
              className="p-2.5 rounded-full bg-black/40 border border-white/20 text-white/80 hover:bg-red-500/80 hover:border-red-400 backdrop-blur-md shadow-sm transition-all duration-300"
              title="Delete Word"
            >
              <Trash2 className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Badge & POS on card image bottom */}
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
            <div className="space-y-0.5">
              <span className="text-xs uppercase font-semibold tracking-wider text-white/80">
                {card.partOfSpeech || 'noun'}
              </span>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-md">
                  {card.word}
                </h2>
                <button
                  id={`btn-speak-${card.id}`}
                  onClick={handleSpeak}
                  className={`p-1.5 rounded-full bg-white/20 border border-white/10 hover:bg-white/35 text-white transition-all cursor-pointer ${
                    isSpeaking ? 'scale-110 bg-white/40' : ''
                  }`}
                  title="Listen Pronunciation"
                >
                  <Volume2
                    className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`}
                  />
                </button>
              </div>
            </div>
            {card.pronunciation && (
              <span className="text-sm font-medium font-mono text-white/90 bg-black/30 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-white/10">
                {card.pronunciation}
              </span>
            )}
          </div>
        </div>

        {/* Card Content Block */}
        <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between overflow-y-auto">
          {isFlashcardMode && !isRevealed ? (
            /* Flashcard active recall state */
            <div
              id={`flashcard-mask-${card.id}`}
              onClick={() => setIsRevealed(true)}
              className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 cursor-pointer group hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 p-4"
            >
              <HelpCircle className="w-10 h-10 text-slate-400 group-hover:scale-110 transition-transform duration-300 mb-2" />
              <p className="text-sm font-medium text-slate-500 group-hover:text-slate-600 text-center">
                Tap card to reveal definition
              </p>
            </div>
          ) : (
            /* Standard vocabulary presentation */
            <div className="space-y-4 flex-1">
              {/* Definition */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Definition
                </span>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                  {card.definition}
                </p>
              </div>

              {/* Example sentence */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  In Context
                </span>
                <p className="text-sm sm:text-base italic text-slate-600 font-serif border-l-2 border-slate-200 pl-3 py-0.5">
                  "{card.example}"
                </p>
              </div>

              {/* User written Context Reminder - Core Feature */}
              <div
                className={`p-4 rounded-2xl border transition-colors duration-300 ${theme.bg} ${theme.border} space-y-2`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${theme.text}`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    My Memory Trigger
                  </span>
                  {!isEditingContext ? (
                    <button
                      id={`btn-edit-context-${card.id}`}
                      onClick={() => {
                        setIsEditingContext(true);
                        setEditedContext(card.customContext || '');
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                      title="Edit memory context"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      id={`btn-save-context-${card.id}`}
                      onClick={handleSaveContext}
                      className={`p-1 rounded-md ${theme.text} hover:opacity-80 transition-opacity`}
                      title="Save context"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isEditingContext ? (
                  <div className="space-y-2">
                    <textarea
                      id={`textarea-context-${card.id}`}
                      value={editedContext}
                      onChange={(e) => setEditedContext(e.target.value)}
                      placeholder="Write your personal context, trigger story, or visual reference to remember this word..."
                      className="w-full text-xs sm:text-sm bg-white/90 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden resize-none h-18 text-slate-700"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setIsEditingContext(false)}
                        className="px-2.5 py-1 text-2xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveContext}
                        className={`px-2.5 py-1 text-2xs font-medium text-white ${theme.accent} hover:opacity-90 rounded-md transition-opacity flex items-center gap-1`}
                      >
                        <Save className="w-3 h-3" /> Save
                      </button>
                    </div>
                  </div>
                ) : card.customContext ? (
                  <p className="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed">
                    {card.customContext}
                  </p>
                ) : (
                  <button
                    id={`btn-add-trigger-${card.id}`}
                    onClick={() => setIsEditingContext(true)}
                    className="w-full py-2.5 border border-dashed border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-500 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Edit3 className="w-3 h-3" />
                    Add a personal memory trigger...
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Bottom Swipe hint for user context */}
          {/* <div className="pt-4 flex items-center justify-between border-t border-slate-100 text-3xs uppercase font-medium text-slate-400 tracking-wider">
            {isFlashcardMode && isRevealed && (
              <button
                onClick={() => setIsRevealed(false)}
                className="text-indigo-600 hover:text-indigo-800 font-bold transition-colors"
              >
                Hide
              </button>
            )}
          </div> */}
        </div>
      </motion.div>
    </div>
  );
}
