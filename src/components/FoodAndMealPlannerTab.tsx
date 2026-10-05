import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag,
  Sparkles,
  Camera,
  Loader2,
  Check,
  Plus,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import { FoodLogItem, UserProfileData } from '../types';

interface FoodAndMealPlannerTabProps {
  profile: UserProfileData;
  foodLogs: FoodLogItem[];
  onAddFoodLog: (entry: Omit<FoodLogItem, 'id' | 'uid' | 'dateKey'>) => void;
}

interface MealPlanDay {
  dayName: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
  prepNote: string;
}

interface GroceryItem {
  item: string;
  category: string;
  estimatedCostNote: string;
}

export const FoodAndMealPlannerTab: React.FC<FoodAndMealPlannerTabProps> = ({
  profile,
  foodLogs,
  onAddFoodLog,
}) => {
  const [naturalEntry, setNaturalEntry] = useState('');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('dinner');
  const [parsingFood, setParsingFood] = useState(false);
  const [aiFoodNote, setAiFoodNote] = useState<string | null>(null);
  const [showPlannerSettings, setShowPlannerSettings] = useState(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  const [budget, setBudget] = useState<'low' | 'moderate' | 'flexible'>(
    profile.foodBudget || 'moderate'
  );
  const [prepTime, setPrepTime] = useState<number>(20);
  const [householdSize, setHouseholdSize] = useState<number>(profile.householdSize || 3);
  const [allergiesText, setAllergiesText] = useState(profile.allergies.join(', ') || 'Peanuts');
  const [generatingPlan, setGeneratingPlan] = useState(false);

  const [mealPlanDays, setMealPlanDays] = useState<MealPlanDay[]>([
    {
      dayName: 'Today',
      breakfast: 'Rolled oats with banana, cinnamon, and pumpkin seeds',
      lunch: 'Warm roast kumara, chickpea & baby spinach grain bowl',
      dinner: 'One-pan baked lemon herb fish (or tofu), baby potatoes & green beans',
      snack: 'Sliced apple with sunflower seed butter (peanut-free)',
      prepNote: 'Roast extra kumara at dinner for tomorrow’s lunch in 15 mins.',
    },
    {
      dayName: 'Tomorrow',
      breakfast: 'Two poached eggs on wholegrain toast with tomato',
      lunch: 'Hearty red lentil & carrot soup with crusty bread',
      dinner: 'Mild chicken or black bean fajita trays with capsicum and rice',
      snack: 'Greek yoghurt with frozen berries',
      prepNote: 'Red lentils cook in 15 minutes and cost less than NZ$2.50 per family pot.',
    },
    {
      dayName: 'Day 3',
      breakfast: 'Smoothie with oats, berries, spinach, and milk of choice',
      lunch: 'Leftover fajita rice bowl with avocado and lime',
      dinner: 'Quick vegetable & egg fried rice with edamame and sesame',
      snack: 'Handful of roasted chickpeas & mandarin',
      prepNote: 'Uses frozen edamame and pre-chopped veggies when energy is low.',
    },
  ]);

  const [groceryList, setGroceryList] = useState<GroceryItem[]>([
    { item: 'Rolled oats & brown rice', category: 'Pantry', estimatedCostNote: 'Bulk staple' },
    { item: 'Kumara, carrots & baby spinach', category: 'Produce', estimatedCostNote: 'Seasonal' },
    { item: 'Free-range eggs & Greek yoghurt', category: 'Chilled', estimatedCostNote: 'Versatile' },
    { item: 'Canned chickpeas, black beans & red lentils', category: 'Pantry', estimatedCostNote: 'Low budget' },
    { item: 'Frozen berries & frozen edamame', category: 'Freezer', estimatedCostNote: 'Zero waste' },
  ]);

  const [checkedGroceries, setCheckedGroceries] = useState<string[]>([]);

  const handleLogNaturalFood = async () => {
    if (!naturalEntry.trim()) return;
    setParsingFood(true);
    setAiFoodNote(null);
    try {
      const res = await fetch('/api/ai/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'food',
          textInput: naturalEntry,
        }),
      });
      const data = await res.json();
      if (res.ok && data.analysis) {
        setAiFoodNote(data.analysis);
      }
      onAddFoodLog({
        mealType,
        description: naturalEntry.trim(),
        items: naturalEntry
          .split(/,|and/i)
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 10),
        notes: 'Logged via natural language',
      });
      setNaturalEntry('');
    } catch {
      onAddFoodLog({
        mealType,
        description: naturalEntry.trim(),
        items: [naturalEntry.trim()],
        notes: 'Logged offline',
      });
      setNaturalEntry('');
    } finally {
      setParsingFood(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsingFood(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const res = await fetch('/api/ai/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'food',
            textInput: naturalEntry || 'Food photo check-in',
            imageBase64: base64,
            mimeType: file.type,
          }),
        });
        const data = await res.json();
        if (res.ok && data.analysis) {
          setAiFoodNote(data.analysis);
        }
      } finally {
        setParsingFood(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const generateCustomMealPlan = async () => {
    setGeneratingPlan(true);
    try {
      const res = await fetch('/api/ai/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget,
          allergies: allergiesText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          dislikedFoods: [],
          householdSize,
          prepTimeMinutes: prepTime,
        }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.days) && data.days.length > 0) {
        setMealPlanDays(data.days);
        setGroceryList(data.groceryList || []);
        setSelectedDayIdx(0);
        setShowPlannerSettings(false);
      }
    } finally {
      setGeneratingPlan(false);
    }
  };

  const activeDay = mealPlanDays[selectedDayIdx] || mealPlanDays[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="space-y-10"
    >
      {/* Header & Preferences Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E2EAE4] dark:border-[#252C28] pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#006B58] dark:text-[#58DBC2]">
            Practical Nourishment · {budget} budget · Household of {householdSize}
          </p>
          <h1 className="text-3xl md:text-4xl font-normal text-[#191D1A] dark:text-[#E1E3DF] mt-1">
            Food & Meal Planning
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowPlannerSettings(!showPlannerSettings)}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#EEF4F0] dark:bg-[#1B211D] text-xs font-medium text-[#191D1A] dark:text-[#E1E3DF] flex items-center gap-1.5 whitespace-nowrap"
          >
            <Sliders className="w-3.5 h-3.5 text-[#006B58]" />
            <span>Budget & Allergies ({allergiesText || 'None'})</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                showPlannerSettings ? 'rotate-180' : ''
              }`}
            />
          </button>

          <button
            type="button"
            disabled={generatingPlan}
            onClick={generateCustomMealPlan}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#006B58] text-white text-xs font-semibold hover:bg-[#005344] flex items-center gap-1.5 whitespace-nowrap disabled:opacity-60"
          >
            {generatingPlan ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Refresh Plan</span>
          </button>
        </div>
      </div>

      {/* Expandable Budget, Prep Time & Allergy Drawer */}
      <AnimatePresence>
        {showPlannerSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 rounded-2xl bg-[#EEF4F0] dark:bg-[#1B211D] border border-[#DDE5DF] dark:border-[#262E29] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <label className="block">
                <span className="text-xs font-medium text-[#4A554E] dark:text-[#B8C2BA]">
                  Budget
                </span>
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value as 'low' | 'moderate' | 'flexible')}
                  className="mt-1 w-full min-h-[40px] rounded-xl bg-white dark:bg-[#131815] px-3 text-xs font-medium"
                >
                  <option value="low">Low Budget (Staples)</option>
                  <option value="moderate">Moderate Everyday</option>
                  <option value="flexible">Flexible</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-[#4A554E] dark:text-[#B8C2BA]">
                  Max Prep Time
                </span>
                <select
                  value={prepTime}
                  onChange={(e) => setPrepTime(Number(e.target.value))}
                  className="mt-1 w-full min-h-[40px] rounded-xl bg-white dark:bg-[#131815] px-3 text-xs font-medium tabular-nums"
                >
                  <option value={15}>15 mins (Low energy)</option>
                  <option value={20}>20 mins</option>
                  <option value={30}>30 mins</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-[#4A554E] dark:text-[#B8C2BA]">
                  Household Size
                </span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={householdSize}
                  onChange={(e) => setHouseholdSize(Number(e.target.value))}
                  className="mt-1 w-full min-h-[40px] rounded-xl bg-white dark:bg-[#131815] px-3 text-xs font-medium tabular-nums"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-[#4A554E] dark:text-[#B8C2BA]">
                  Allergies / Avoid
                </span>
                <input
                  type="text"
                  value={allergiesText}
                  onChange={(e) => setAllergiesText(e.target.value)}
                  className="mt-1 w-full min-h-[40px] rounded-xl bg-white dark:bg-[#131815] px-3 text-xs font-medium"
                />
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Two-Column Layout: Today's Meals (Left) + Grocery List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
              Meal Ideas
            </h2>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#EEF4F0] dark:bg-[#1B211D]">
              {mealPlanDays.map((d, i) => (
                <button
                  key={d.dayName}
                  type="button"
                  onClick={() => setSelectedDayIdx(i)}
                  className={`min-h-[34px] px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    selectedDayIdx === i
                      ? 'bg-white dark:bg-[#2A332E] text-[#191D1A] dark:text-white font-semibold shadow-xs'
                      : 'text-[#4A554E] dark:text-[#B8C2BA]'
                  }`}
                >
                  {d.dayName}
                </button>
              ))}
            </div>
          </div>

          {activeDay && (
            <div className="rounded-3xl bg-white dark:bg-[#171C19] border border-[#DDE5DF] dark:border-[#262E29] divide-y divide-[#E2EAE4] dark:divide-[#262E29]">
              {(
                [
                  { label: 'Breakfast', value: activeDay.breakfast },
                  { label: 'Lunch', value: activeDay.lunch },
                  { label: 'Dinner', value: activeDay.dinner },
                  { label: 'Snack', value: activeDay.snack },
                ] as const
              ).map((slot) => (
                <div key={slot.label} className="p-5 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#006B58] dark:text-[#58DBC2]">
                      {slot.label}
                    </span>
                    <p className="text-sm md:text-base font-medium text-[#191D1A] dark:text-[#E1E3DF]">
                      {slot.value}
                    </p>
                  </div>
                </div>
              ))}
              <div className="p-4 bg-[#EEF4F0]/50 dark:bg-[#1B211D] text-xs text-[#4A554E] dark:text-[#B8C2BA]">
                <strong>Prep tip:</strong> {activeDay.prepNote}
              </div>
            </div>
          )}
        </div>

        {/* Grocery Checklist */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#191D1A] dark:text-[#E1E3DF] flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#006B58]" />
              <span>Grocery List</span>
            </h2>
            <span className="text-xs text-[#525E57] dark:text-[#A4B0A8] tabular-nums">
              {checkedGroceries.length}/{groceryList.length} checked
            </span>
          </div>

          <div className="rounded-3xl bg-white dark:bg-[#171C19] border border-[#DDE5DF] dark:border-[#262E29] p-4 space-y-2">
            {groceryList.map((g) => {
              const checked = checkedGroceries.includes(g.item);
              return (
                <button
                  key={g.item}
                  type="button"
                  onClick={() =>
                    setCheckedGroceries((prev) =>
                      prev.includes(g.item)
                        ? prev.filter((x) => x !== g.item)
                        : [...prev, g.item]
                    )
                  }
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl hover:bg-[#EEF4F0] dark:hover:bg-[#212824] text-left flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                        checked ? 'bg-[#006B58] text-white' : 'border border-[#525E57]'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3" />}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        checked
                          ? 'line-through text-[#525E57]'
                          : 'text-[#191D1A] dark:text-[#E1E3DF]'
                      }`}
                    >
                      {g.item}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#525E57] dark:text-[#A4B0A8] shrink-0">
                    {g.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Natural-Language Food Log */}
      <div className="pt-6 border-t border-[#E2EAE4] dark:border-[#252C28] space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
            Quick Meal Note
          </h2>
          <p className="text-xs text-[#4A554E] dark:text-[#B8C2BA]">
            Jot down what you ate in plain words or snap a photo. No calorie shaming.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <select
            value={mealType}
            onChange={(e) =>
              setMealType(e.target.value as 'breakfast' | 'lunch' | 'dinner' | 'snack')
            }
            className="min-h-[44px] rounded-xl bg-[#EEF4F0] dark:bg-[#1B211D] px-3.5 text-xs font-medium text-[#191D1A] dark:text-[#E1E3DF] capitalize"
          >
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>

          <input
            type="text"
            value={naturalEntry}
            onChange={(e) => setNaturalEntry(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLogNaturalFood();
            }}
            placeholder="e.g., Two poached eggs on sourdough toast and an apple"
            className="flex-1 min-h-[44px] rounded-xl bg-white dark:bg-[#171C19] border border-[#DDE5DF] dark:border-[#262E29] px-4 text-xs text-[#191D1A] dark:text-[#E1E3DF]"
          />

          <div className="flex items-center gap-2">
            <label className="min-h-[44px] px-3.5 rounded-xl bg-[#EEF4F0] dark:bg-[#1B211D] text-xs font-medium text-[#191D1A] dark:text-[#E1E3DF] cursor-pointer flex items-center gap-1.5 whitespace-nowrap">
              <Camera className="w-4 h-4 text-[#006B58]" />
              <span>Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              disabled={parsingFood}
              onClick={handleLogNaturalFood}
              className="min-h-[44px] px-5 rounded-xl bg-[#006B58] text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap disabled:opacity-60"
            >
              {parsingFood ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>Log Meal</span>
            </button>
          </div>
        </div>

        {aiFoodNote && (
          <div className="p-4 rounded-2xl bg-[#EEF4F0] dark:bg-[#1B211D] text-xs text-[#191D1A] dark:text-[#E1E3DF] leading-relaxed">
            {aiFoodNote}
          </div>
        )}

        {foodLogs.length > 0 && (
          <div className="divide-y divide-[#E2EAE4] dark:divide-[#252C28] pt-2">
            {foodLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-semibold capitalize text-[#006B58] dark:text-[#58DBC2]">
                    {log.mealType}
                  </span>
                  <span className="text-xs text-[#191D1A] dark:text-[#E1E3DF]">
                    {log.description}
                  </span>
                </div>
                <span className="text-xs text-[#525E57] dark:text-[#A4B0A8] tabular-nums">
                  {log.dateKey}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
