/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  RotateCcw,
  Sparkles,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Flame,
  CheckCircle2,
  ListFilter,
  BrainCircuit,
  Lightbulb,
} from 'lucide-react';

import { VocabularyCard } from './types';
import { DEFAULT_VOCABULARY_CARDS } from './data';
import VocabularyCardComponent from './components/VocabularyCardComponent';
import CardForm from './components/CardForm';

const LOCAL_STORAGE_KEY = 'vocabulary_reminder_cards_v1';
const MEMORIZED_STORAGE_KEY = 'vocabulary_reminder_memorized_v1';
const STREAK_STORAGE_KEY = 'vocabulary_reminder_streak_v1';
const LAST_ACTIVE_STORAGE_KEY = 'vocabulary_reminder_last_active_v1';

export default function App() {
  const [cards, setCards] = useState<VocabularyCard[]>([]);
  const [memorizedIds, setMemorizedIds] = useState<string[]>([]);
  const [streak, setStreak] = useState<number>(1);

  // Slider control state
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Filters & Options
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartofSpeech, setSelectedPartofSpeech] =
    useState<string>('all');
  const [filterMode, setFilterMode] = useState<
    'all' | 'learning' | 'memorized'
  >('all');
  const [isFlashcardMode, setIsFlashcardMode] = useState<boolean>(false);

  // Modal toggle
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    // Load cards
    const storedCardsJson = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedCardsJson) {
      try {
        setCards(JSON.parse(storedCardsJson));
      } catch (e) {
        setCards(DEFAULT_VOCABULARY_CARDS);
      }
    } else {
      setCards(DEFAULT_VOCABULARY_CARDS);
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(DEFAULT_VOCABULARY_CARDS),
      );
    }

    // Load memorized states
    const storedMemorizedJson = localStorage.getItem(MEMORIZED_STORAGE_KEY);
    if (storedMemorizedJson) {
      try {
        setMemorizedIds(JSON.parse(storedMemorizedJson));
      } catch (e) {
        setMemorizedIds(['1', '5']); // Defaults: Serendipity, Solitude
      }
    } else {
      setMemorizedIds(['1', '5']);
    }

    // Load Streak
    const storedStreak = localStorage.getItem(STREAK_STORAGE_KEY);
    const lastActiveDate = localStorage.getItem(LAST_ACTIVE_STORAGE_KEY);
    const todayStr = new Date().toDateString();

    if (storedStreak) {
      const streakNum = parseInt(storedStreak, 10);
      if (lastActiveDate) {
        const lastDate = new Date(lastActiveDate);
        const today = new Date(todayStr);
        const diffTime = Math.abs(today.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Consecutive day, increment streak!
          const newStreak = streakNum + 1;
          setStreak(newStreak);
          localStorage.setItem(STREAK_STORAGE_KEY, newStreak.toString());
        } else if (diffDays > 1) {
          // Streak broken
          setStreak(1);
          localStorage.setItem(STREAK_STORAGE_KEY, '1');
        } else {
          setStreak(streakNum);
        }
      } else {
        setStreak(streakNum);
      }
    } else {
      setStreak(3); // A friendly starter streak to make them feel accomplished!
      localStorage.setItem(STREAK_STORAGE_KEY, '3');
    }

    // Save current active date
    localStorage.setItem(LAST_ACTIVE_STORAGE_KEY, todayStr);
  }, []);

  // Sync utilities
  const saveCardsToStorage = (updatedCards: VocabularyCard[]) => {
    setCards(updatedCards);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedCards));
  };

  const saveMemorizedToStorage = (updatedIds: string[]) => {
    setMemorizedIds(updatedIds);
    localStorage.setItem(MEMORIZED_STORAGE_KEY, JSON.stringify(updatedIds));
  };

  // 2. Filter & Sort Logic
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      // Search matching word or definition or context
      const matchesSearch =
        card.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (card.customContext &&
          card.customContext.toLowerCase().includes(searchQuery.toLowerCase()));

      // Part of speech matching
      const matchesPOS =
        selectedPartofSpeech === 'all' ||
        card.partOfSpeech === selectedPartofSpeech;

      // Memorized pile filtering
      const isCardMemorized = memorizedIds.includes(card.id);
      const matchesPile =
        filterMode === 'all' ||
        (filterMode === 'memorized' && isCardMemorized) ||
        (filterMode === 'learning' && !isCardMemorized);

      return matchesSearch && matchesPOS && matchesPile;
    });
  }, [cards, memorizedIds, searchQuery, selectedPartofSpeech, filterMode]);

  // Handle index boundaries when card pool changes
  useEffect(() => {
    if (activeIndex >= filteredCards.length && filteredCards.length > 0) {
      setActiveIndex(filteredCards.length - 1);
    } else if (activeIndex < 0) {
      setActiveIndex(0);
    }
  }, [filteredCards.length, activeIndex]);

  // 3. User actions
  const handleAddCard = (
    newCardData: Omit<VocabularyCard, 'id' | 'createdAt'>,
  ) => {
    const newCard: VocabularyCard = {
      ...newCardData,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };

    const updated = [newCard, ...cards];
    saveCardsToStorage(updated);
    setShowAddModal(false);
    setActiveIndex(0); // Focus on the newly added card!
  };

  const handleDeleteCard = (id: string) => {
    const updated = cards.filter((c) => c.id !== id);
    saveCardsToStorage(updated);

    const updatedMemorized = memorizedIds.filter((mId) => mId !== id);
    saveMemorizedToStorage(updatedMemorized);
  };

  const handleToggleMemorized = (id: string) => {
    let updated: string[];
    if (memorizedIds.includes(id)) {
      updated = memorizedIds.filter((mId) => mId !== id);
    } else {
      updated = [...memorizedIds, id];
    }
    saveMemorizedToStorage(updated);
  };

  const handleUpdateContext = (id: string, newContext: string) => {
    const updated = cards.map((card) => {
      if (card.id === id) {
        return { ...card, customContext: newContext };
      }
      return card;
    });
    saveCardsToStorage(updated);
  };

  const handleShuffle = () => {
    if (filteredCards.length <= 1) return;

    // Shuffle the current sub-deck
    const shuffled = [...filteredCards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Rearrange our main cards array to put the shuffled items at the start
    const remaining = cards.filter(
      (c) => !filteredCards.find((fc) => fc.id === c.id),
    );
    saveCardsToStorage([...shuffled, ...remaining]);
    setActiveIndex(0);
  };

  const handleResetDefaults = () => {
    if (
      confirm(
        'Reset application data to default cards? Your custom cards will be cleared.',
      )
    ) {
      setCards(DEFAULT_VOCABULARY_CARDS);
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(DEFAULT_VOCABULARY_CARDS),
      );
      setMemorizedIds(['1', '5']);
      localStorage.setItem(MEMORIZED_STORAGE_KEY, JSON.stringify(['1', '5']));
      setActiveIndex(0);
      setSearchQuery('');
      setSelectedPartofSpeech('all');
      setFilterMode('all');
    }
  };

  // Slider navigation helpers
  const handleNext = useCallback(() => {
    if (filteredCards.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % filteredCards.length);
  }, [filteredCards.length]);

  const handlePrev = useCallback(() => {
    if (filteredCards.length === 0) return;
    setActiveIndex(
      (prev) => (prev - 1 + filteredCards.length) % filteredCards.length,
    );
  }, [filteredCards.length]);

  // Calculate master rate stats
  const totalCount = cards.length;
  const masteredCount = memorizedIds.filter((id) =>
    cards.some((c) => c.id === id),
  ).length;
  const masteredPercentage =
    totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

  // Active word details
  const activeCard = filteredCards[activeIndex];

  return (
    <div className="bg-linear-to-b from-slate-50 to-slate-100 min-h-screen text-slate-800 pb-12 font-sans relative overflow-x-hidden">
      {/* Top Floating App Banner */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 py-3.5 px-4 sm:px-6 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/50">
              <BookOpen className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1
                id="app-title"
                className="text-lg font-extrabold tracking-tight text-slate-800"
              >
                Vocabulary Reminder
              </h1>
              <p className="text-3xs text-slate-400 font-medium tracking-wide uppercase">
                Interactive Visual Reminders
              </p>
            </div>
          </div>

          {/* Quick Stats Banner */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>
                {masteredCount}/{totalCount} mastered
              </span>
              <span className="text-slate-200">|</span>
              <span className="text-indigo-600">{masteredPercentage}%</span>
            </div>

            <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full text-xs font-bold text-amber-700">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>{streak} Day Streak</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {/* Progress bar visualizer for mobile */}
        <div className="sm:hidden bg-white border border-slate-100 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-500">
              My Mastered Vocabulary
            </span>
            <span className="font-extrabold text-indigo-600">
              {masteredCount} of {totalCount} words ({masteredPercentage}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${masteredPercentage}%` }}
            />
          </div>
        </div>

        {/* Filter Desk */}
        <section className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3.5">
          {/* Search bar */}
          <div className="relative">
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search words, definitions, or trigger stories..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all text-slate-700"
            />
            <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3" />
          </div>

          {/* Pill options for study states & categories */}
          <div className="flex flex-wrap gap-1.5">
            {/* Learning filters */}
            <button
              id="filter-all"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                filterMode === 'all'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              id="filter-learning"
              onClick={() => setFilterMode('learning')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                filterMode === 'learning'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              Learning ({totalCount - masteredCount})
            </button>
            <button
              id="filter-memorized"
              onClick={() => setFilterMode('memorized')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                filterMode === 'memorized'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              Mastered ({masteredCount})
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-slate-100 mx-1 self-center" />

            {/* Part of Speech select pill */}
            <div className="relative">
              <select
                id="pos-select"
                value={selectedPartofSpeech}
                onChange={(e) => setSelectedPartofSpeech(e.target.value)}
                className="bg-slate-50 hover:bg-slate-100 border border-transparent hover:border-slate-100 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 cursor-pointer focus:outline-hidden appearance-none pr-6 capitalize"
              >
                <option value="all">All POS</option>
                <option value="noun">Nouns</option>
                <option value="verb">Verbs</option>
                <option value="adjective">Adjectives</option>
                <option value="adverb">Adverbs</option>
              </select>
              <ListFilter className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>
          </div>
        </section>

        {/* Action Toggle Center */}
        <section className="flex items-center justify-between bg-indigo-50/50 border border-indigo-100/30 rounded-2xl p-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500 text-white rounded-xl">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-950">
                Active Recall Mode
              </p>
              <p className="text-3xs text-indigo-700/75">
                Hide definitions to test memory
              </p>
            </div>
          </div>
          <button
            id="btn-toggle-flashcard"
            onClick={() => setIsFlashcardMode(!isFlashcardMode)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              isFlashcardMode ? 'bg-indigo-600' : 'bg-slate-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                isFlashcardMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </section>

        {/* Card Slider Stage */}
        <section className="relative min-h-[480px] flex flex-col justify-between">
          {filteredCards.length > 0 && activeCard ? (
            <div className="space-y-5">
              {/* Card Slider Component with Drag support */}
              <VocabularyCardComponent
                card={activeCard}
                isFlashcardMode={isFlashcardMode}
                isMemorized={memorizedIds.includes(activeCard.id)}
                onToggleMemorized={handleToggleMemorized}
                onUpdateContext={handleUpdateContext}
                onDelete={handleDeleteCard}
                onNext={handleNext}
                onPrev={handlePrev}
              />

              {/* Slider Bottom Controller */}
              <div className="flex items-center justify-between px-2 pt-1">
                <button
                  id="btn-prev-card"
                  onClick={handlePrev}
                  className="p-3 bg-white hover:bg-slate-50 border border-slate-100 text-slate-600 hover:text-slate-800 rounded-2xl active:scale-95 transition-all shadow-xs cursor-pointer flex items-center justify-center"
                  title="Previous Card"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Progress Indicators / Page tracker */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-slate-500">
                    {activeIndex + 1} of {filteredCards.length} Cards
                  </span>
                  {/* Miniature Dots */}
                  <div className="flex items-center gap-1.5">
                    {filteredCards.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                          idx === activeIndex
                            ? 'bg-indigo-600 w-4.5'
                            : 'bg-slate-200 hover:bg-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  id="btn-next-card"
                  onClick={handleNext}
                  className="p-3 bg-white hover:bg-slate-50 border border-slate-100 text-slate-600 hover:text-slate-800 rounded-2xl active:scale-95 transition-all shadow-xs cursor-pointer flex items-center justify-center"
                  title="Next Card"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center bg-white rounded-3xl border border-slate-100 shadow-xs space-y-4">
              <div className="p-4 bg-slate-50 text-slate-400 rounded-full border border-dashed border-slate-200">
                <Search className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-700">
                  No cards matched your filter
                </h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Try clearing your search query, choosing a different category,
                  or create a brand new card.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedPartofSpeech('all');
                    setFilterMode('all');
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/20 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Reset Filters
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Word
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Global Action Grid / Quick Settings */}
        <section className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs grid grid-cols-2 gap-3">
          <button
            id="btn-action-add"
            onClick={() => setShowAddModal(true)}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all text-center"
          >
            <div className="p-1.5 bg-white/10 rounded-lg">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Add Word Card</span>
          </button>

          <button
            id="btn-action-shuffle"
            onClick={handleShuffle}
            disabled={filteredCards.length <= 1}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-700 rounded-2xl flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all text-center disabled:opacity-50 disabled:pointer-events-none"
          >
            <div className="p-1.5 bg-slate-200/50 text-slate-600 rounded-lg">
              <Shuffle className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Shuffle Pile</span>
          </button>

          <div className="col-span-2 flex items-center justify-between border-t border-slate-100 pt-4 mt-1 text-3xs font-medium text-slate-400">
            <span className="flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 fill-amber-100" />
              Tip: Use Drag-Swipe gestures on cards
            </span>
            <button
              id="btn-action-reset"
              onClick={handleResetDefaults}
              className="text-red-500 hover:text-red-700 flex items-center gap-1 hover:underline transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset App Data
            </button>
          </div>
        </section>
      </main>

      {/* Add Card Modal Overlay */}
      {showAddModal && (
        <CardForm
          onAddCard={handleAddCard}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
