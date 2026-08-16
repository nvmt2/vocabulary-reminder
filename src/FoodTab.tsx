import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

import { FoodCard, MEAL_TYPES, MealType } from './types';
import FoodCardComponent from './components/FoodCardComponent';
import FoodForm from './components/FoodForm';
import AddFoodButton from './components/AddFoodButton';
import { supabase } from './lib/supabase';

const LOCAL_STORAGE_KEY = 'food_reminder_cards_v1';

export default function FoodTab() {
  const [foods, setFoods] = useState<FoodCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Slider control state
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Filters & Options
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<'all' | MealType>(
    'all',
  );

  // Modal toggle
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Convert DB row to FoodCard
  const mapDbToFood = (row: any): FoodCard => ({
    id: row.id,
    name: row.name,
    mealType: (row.meal_type || 'lunch') as MealType,
    notes: row.notes || undefined,
    imageUrl: row.image_url,
    colorTheme: row.color_theme || 'amber',
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  });

  // 1. Initial Load from Supabase (with fallback to LocalStorage)
  const fetchFoodsFromSupabase = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('food_cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setFoods(data.map(mapDbToFood));
      } else {
        const storedJson = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedJson) {
          try {
            setFoods(JSON.parse(storedJson));
          } catch (e) {
            setFoods([]);
          }
        } else {
          setFoods([]);
        }
      }
    } catch (err) {
      console.warn(
        'Supabase fetch error, loading local cache if present:',
        err,
      );
      const storedJson = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedJson) {
        try {
          setFoods(JSON.parse(storedJson));
        } catch (e) {
          setFoods([]);
        }
      } else {
        setFoods([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFoodsFromSupabase();
  }, []);

  // Save to local cache as well for instant responsiveness
  useEffect(() => {
    if (foods.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(foods));
    }
  }, [foods]);

  // 2. Filter & Sort Logic
  const filteredFoods = useMemo(() => {
    return foods.filter((food) => {
      const matchesSearch =
        food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (food.notes &&
          food.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesMealType =
        selectedMealType === 'all' || food.mealType === selectedMealType;

      return matchesSearch && matchesMealType;
    });
  }, [foods, searchQuery, selectedMealType]);

  // Handle index boundaries when food pool changes
  useEffect(() => {
    if (activeIndex >= filteredFoods.length && filteredFoods.length > 0) {
      setActiveIndex(filteredFoods.length - 1);
    } else if (activeIndex < 0) {
      setActiveIndex(0);
    }
  }, [filteredFoods.length, activeIndex]);

  // 3. User actions
  const handleAddFood = async (
    newFoodData: Omit<FoodCard, 'id' | 'createdAt'>,
  ) => {
    // Optimistic local add
    const tempId = Date.now().toString();
    const tempFood: FoodCard = {
      ...newFoodData,
      id: tempId,
      createdAt: Date.now(),
    };

    setFoods((prev) => [tempFood, ...prev]);
    setShowAddModal(false);
    setActiveIndex(0);

    // Save to Supabase
    try {
      const { data, error } = await supabase
        .from('food_cards')
        .insert([
          {
            name: newFoodData.name,
            meal_type: newFoodData.mealType,
            notes: newFoodData.notes,
            image_url: newFoodData.imageUrl,
            color_theme: newFoodData.colorTheme,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const savedFood = mapDbToFood(data);
        setFoods((prev) => prev.map((f) => (f.id === tempId ? savedFood : f)));
      }
    } catch (err) {
      console.error('Failed to insert food', err);
    }
  };

  const handleDeleteFood = async (id: string) => {
    setFoods((prev) => prev.filter((f) => f.id !== id));

    try {
      await supabase.from('food_cards').delete().eq('id', id);
    } catch (err) {
      console.error('Failed to delete food', err);
    }
  };

  const handleUpdateNotes = async (id: string, newNotes: string) => {
    setFoods((prev) =>
      prev.map((f) => (f.id === id ? { ...f, notes: newNotes } : f)),
    );

    try {
      await supabase
        .from('food_cards')
        .update({ notes: newNotes })
        .eq('id', id);
    } catch (err) {
      console.error('Failed to update notes:', err);
    }
  };

  // Slider navigation helpers
  const handleNext = useCallback(() => {
    if (filteredFoods.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % filteredFoods.length);
  }, [filteredFoods.length]);

  const handlePrev = useCallback(() => {
    if (filteredFoods.length === 0) return;
    setActiveIndex(
      (prev) => (prev - 1 + filteredFoods.length) % filteredFoods.length,
    );
  }, [filteredFoods.length]);

  // The headline feature: pick a random food from the current meal-type
  // filter so the user gets a suggestion for that meal.
  const handleSurpriseMe = useCallback(() => {
    if (filteredFoods.length === 0) return;
    if (filteredFoods.length === 1) {
      setActiveIndex(0);
      return;
    }
    let randomIndex = Math.floor(Math.random() * filteredFoods.length);
    if (randomIndex === activeIndex) {
      randomIndex = (randomIndex + 1) % filteredFoods.length;
    }
    setActiveIndex(randomIndex);
  }, [filteredFoods.length, activeIndex]);

  const totalCount = foods.length;
  const activeFood = filteredFoods[activeIndex];

  return (
    <div className="bg-linear-to-b from-slate-50 to-slate-100 min-h-screen text-slate-800 pb-12 font-sans relative overflow-x-hidden">
      <main className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {/* Card Slider Stage */}
        <section className="relative min-h-[480px] flex flex-col justify-between">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center bg-white rounded-3xl border border-slate-100 shadow-xs space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-xs font-semibold text-slate-500">
                Syncing foods with Supabase...
              </p>
            </div>
          ) : filteredFoods.length > 0 && activeFood ? (
            <div className="space-y-5">
              <FoodCardComponent
                card={activeFood}
                onUpdateNotes={handleUpdateNotes}
                onDelete={handleDeleteFood}
                onNext={handleNext}
                onPrev={handlePrev}
              />

              {/* Slider Bottom Controller */}
              <div className="flex items-center justify-between px-2 pt-1">
                <button
                  id="btn-prev-food"
                  onClick={handlePrev}
                  className="p-3 bg-white hover:bg-slate-50 border border-slate-100 text-slate-600 hover:text-slate-800 rounded-2xl active:scale-95 transition-all shadow-xs cursor-pointer flex items-center justify-center"
                  title="Previous Food"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-slate-500">
                    {activeIndex + 1} of {filteredFoods.length} Foods
                  </span>
                  <div className="flex items-center gap-1.5">
                    {filteredFoods.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                          idx === activeIndex
                            ? 'bg-emerald-600 w-4.5'
                            : 'bg-slate-200 hover:bg-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  id="btn-next-food"
                  onClick={handleNext}
                  className="p-3 bg-white hover:bg-slate-50 border border-slate-100 text-slate-600 hover:text-slate-800 rounded-2xl active:scale-95 transition-all shadow-xs cursor-pointer flex items-center justify-center"
                  title="Next Food"
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
                  No foods matched your filter
                </h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Try clearing your search query, choosing a different meal
                  type, or add a brand new food.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedMealType('all');
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50/20 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Reset Filters
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Food
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Surprise Me — random pick for the selected meal */}
        <button
          id="btn-surprise-me"
          onClick={handleSurpriseMe}
          disabled={filteredFoods.length === 0}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-2xl text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Shuffle className="w-4.5 h-4.5" />
          Surprise Me{' '}
          {selectedMealType !== 'all' ? `for ${selectedMealType}` : ''}
        </button>

        {/* Filter Desk */}
        <section className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3.5">
          {/* Search bar */}
          <div className="relative">
            <input
              id="search-input-food"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search food names or notes..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all text-slate-700"
            />
            <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3" />
          </div>

          {/* Meal type filter pills */}
          <div className="flex flex-wrap gap-1.5">
            <button
              id="filter-meal-all"
              onClick={() => setSelectedMealType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors capitalize ${
                selectedMealType === 'all'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              All ({totalCount})
            </button>
            {MEAL_TYPES.map((mt) => {
              const count = foods.filter((f) => f.mealType === mt).length;
              return (
                <button
                  key={mt}
                  id={`filter-meal-${mt}`}
                  onClick={() => setSelectedMealType(mt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors capitalize ${
                    selectedMealType === mt
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {mt} ({count})
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* Fixed Floating Action Bar (Bottom-Right) */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        <AddFoodButton onClick={() => setShowAddModal(true)} />
      </div>

      {/* Add Food Modal Overlay */}
      {showAddModal && (
        <FoodForm
          onAddFood={handleAddFood}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
