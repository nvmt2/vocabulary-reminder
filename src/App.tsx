/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { BookOpen, UtensilsCrossed } from 'lucide-react';
import VocabularyTab from './VocabularyTab';
import FoodTab from './FoodTab';

type Tab = 'vocabulary' | 'food';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('vocabulary');

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-md mx-auto flex items-center gap-2 px-4 py-2.5">
          <button
            id="tab-vocabulary"
            onClick={() => setActiveTab('vocabulary')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'vocabulary'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Vocabulary
          </button>
          <button
            id="tab-food"
            onClick={() => setActiveTab('food')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'food'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            Food
          </button>
        </div>
      </nav>

      {activeTab === 'vocabulary' ? <VocabularyTab /> : <FoodTab />}
    </>
  );
}
