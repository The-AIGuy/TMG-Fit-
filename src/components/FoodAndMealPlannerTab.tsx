import React, { useState } from 'react';
import {
  Utensils,
  ShoppingBag,
  Sparkles,
  Camera,
  Loader2,
  Check,
  Plus,
} from 'lucide-react';
import { FoodLogItem, UserProfileData } from '../types';
import { GENERATED_IMAGES } from '../adaptiveEngine';

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
  const [naturalEntry, setNaturalEntry] = useState(
    'I had two eggs, sourdough toast and an apple.'
  );
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [parsingFood, setParsingFood] = useState(false);
  const [aiFoodNote, setAiFoodNote] = useState<string | null>(null);

  const [budget, setBudget] = useState<'low' | 'moderate' | 'flexible'>(
    profile.foodBudget || 'moderate'
  );
  const [prepTime, setPrepTime] = useState<number>(20);
  const [householdSize, setHouseholdSize] = useState<number>(profile.householdSize || 3);
  const [allergiesText, setAllergiesText] = useState(profile.allergies.join(', ') || 'Peanuts');
  const [generatingPlan, setGeneratingPlan] = useState(false);

  const [mealPlanDays, setMealPlanDays] = useState<MealPlanDay[]>([
    {
      dayName: 'Day 1 · Quick & Steady Energy',
      breakfast: 'Rolled oats with banana, cinnamon, and pumpkin seeds',
      lunch: 'Warm roast kumara, chickpea & baby spinach grain bowl',
      dinner: 'One-pan baked lemon herb fish (or tofu), baby potatoes & green beans',
      snack: 'Sliced apple with sunflower seed butter (peanut-free)',
      prepNote: 'Roast extra kumara at dinner for tomorrow’s lunch in 15 mins.',
    },
    {
      dayName: 'Day 2 · Family-Friendly & Budget-Smart',
      breakfast: 'Two poached eggs on wholegrain toast with tomato',
      lunch: 'Hearty red lentil & carrot soup with crusty bread',
      dinner: 'Mild chicken or black bean fajita trays with capsicum and rice',
      snack: 'Greek yoghurt with frozen berries',
      prepNote: 'Red lentils cook in 15 minutes and cost less than NZ$2.50 per family pot.',
    },
    {
      dayName: 'Day 3 · Low-Effort Evening',
      breakfast: 'Smoothie with oats, berries, spinach, and milk of choice',
      lunch: 'Leftover fajita rice bowl with avocado and lime',
      dinner: 'Quick vegetable & egg fried rice with edamame and sesame',
      snack: 'Handful of roasted chickpeas & mandarin',
      prepNote: 'Uses frozen edamame and pre-chopped veggies when energy is low.',
    },
  ]);

  const [groceryList, setGroceryList] = useState<GroceryItem[]>([
    { item: 'Rolled oats & brown rice', category: 'Pantry', estimatedCostNote: 'Staple bulk value' },
    { item: 'Kumara (sweet potato), carrots & baby spinach', category: 'Produce', estimatedCostNote: 'Seasonal local pick' },
    { item: 'Free-range eggs (1 dozen) & Greek yoghurt', category: 'Chilled', estimatedCostNote: 'High versatility' },
    { item: 'Canned chickpeas, black beans & red lentils', category: 'Pantry', estimatedCostNote: 'Low budget protein' },
    { item: 'Frozen berries & frozen edamame', category: 'Freezer', estimatedCostNote: 'Zero waste' },
  ]);

  const [checkedGroceries, setCheckedGroceries] = useState<string[]>([]);
  const [imgFallback, setImgFallback] = useState(false);

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
      const note = res.ok
        ? data.analysis
        : 'Logged directly. Balanced everyday nourishment—you can edit any item below.';
      setAiFoodNote(note);
      onAddFoodLog({
        mealType,
        description: naturalEntry.trim(),
        items: naturalEntry
          .split(/,|and/i)
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 10),
        notes: 'Editable entry · Logged via supportive natural-language assistant',
      });
    } catch {
      onAddFoodLog({
        mealType,
        description: naturalEntry.trim(),
        items: [naturalEntry.trim()],
        notes: 'Logged offline · Editable anytime',
      });
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
      }
    } finally {
      setGeneratingPlan(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center border-b border-[#DDE5DF] dark:border-[#2B322E] pb-8">
        <div className="lg:col-span-7 space-y-3">
          <p className="text-xs font-medium text-[#3F4944] dark:text-[#C0C9C2]">
            Practical Nourishment · Budget & Allergy Aware · Zero Diet Culture
          </p>
          <h1 className="text-3xl font-normal text-[#191D1A] dark:text-[#E1E3DF]">
            Supportive Food Ideas, Natural Logging & Family Meal Planner
          </h1>
          <p className="text-sm text-[#3F4944] dark:text-[#C0C9C2] leading-relaxed">
            Food is here to fuel your day, not to be “burned off” on a treadmill. Log meals in
            plain language, upload an optional photo for quick recognition, or build a budget-aware
            weekly grocery list.
          </p>
        </div>

        <div className="lg:col-span-5">
          <div className="relative rounded-3xl overflow-hidden aspect-4/3 bg-[#EEF5EF] dark:bg-[#1B211D] border border-[#DDE5DF] dark:border-[#2B322E]">
            {!imgFallback ? (
              <img
                src={GENERATED_IMAGES.nourishingMeal}
                alt="Balanced homemade bowl with roasted vegetables, poached eggs, and toasted sourdough"
                referrerPolicy="no-referrer"
                onError={() => setImgFallback(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-6 text-center">
                <Utensils className="w-8 h-8 text-[#006B58]" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex items-end p-5">
              <p className="text-xs text-white font-medium">
                Everyday nourishment · Allergy-safe ({allergiesText || 'No restrictions'}) ·{' '}
                Household of {householdSize}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Natural Language & Photo Assisted Logging */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 rounded-3xl bg-[#EEF5EF] dark:bg-[#1B211D] p-6 border border-[#DDE5DF] dark:border-[#2B322E] space-y-4">
          <h2 className="text-xl font-normal text-[#191D1A] dark:text-[#E1E3DF]">
            Quick Natural-Language or Photo Food Log
          </h2>
          <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2]">
            Type what you had in plain words or attach a photo. AI estimates are always editable.
          </p>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F7FBF7] dark:bg-[#111512]">
            {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMealType(m)}
                className={`flex-1 min-h-[40px] rounded-lg text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                  mealType === m
                    ? 'bg-[#006B58] text-white'
                    : 'text-[#3F4944] dark:text-[#C0C9C2]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <textarea
            rows={2}
            value={naturalEntry}
            onChange={(e) => setNaturalEntry(e.target.value)}
            className="w-full rounded-2xl bg-[#F7FBF7] dark:bg-[#111512] p-3.5 text-sm text-[#191D1A] dark:text-[#E1E3DF] border border-[#DDE5DF] dark:border-[#2B322E]"
            placeholder="e.g., I had two eggs, toast and an apple."
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-medium bg-[#F7FBF7] dark:bg-[#111512] text-[#191D1A] dark:text-[#E1E3DF] border border-[#DDE5DF] dark:border-[#2B322E] cursor-pointer flex items-center gap-2 whitespace-nowrap">
              <Camera className="w-4 h-4 text-[#006B58]" />
              <span>Photo Recognition (Optional)</span>
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
              className="min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#006B58] hover:bg-[#005344] flex items-center gap-2 whitespace-nowrap disabled:opacity-60"
            >
              {parsingFood ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Logging...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add to Food Log
                </>
              )}
            </button>
          </div>

          {aiFoodNote && (
            <div className="p-4 rounded-2xl bg-[#F7FBF7] dark:bg-[#111512] border border-[#DDE5DF] dark:border-[#2B322E] text-xs text-[#3F4944] dark:text-[#C0C9C2] leading-relaxed whitespace-pre-line">
              {aiFoodNote}
            </div>
          )}
        </div>

        <div className="lg:col-span-6 rounded-3xl bg-[#F7FBF7] dark:bg-[#111512] p-6 border border-[#DDE5DF] dark:border-[#2B322E] space-y-4">
          <h2 className="text-xl font-normal text-[#191D1A] dark:text-[#E1E3DF]">
            Recent Food Journal
          </h2>
          <div className="divide-y divide-[#DDE5DF] dark:divide-[#2B322E]">
            {foodLogs.map((log) => (
              <div key={log.id} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between text-xs text-[#3F4944] dark:text-[#C0C9C2]">
                  <span className="capitalize font-semibold text-[#006B58] dark:text-[#58DBC2]">
                    {log.mealType}
                  </span>
                  <span className="tabular-nums">{log.dateKey}</span>
                </div>
                <p className="text-sm font-medium text-[#191D1A] dark:text-[#E1E3DF] mt-1">
                  {log.description}
                </p>
                <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2] mt-1">
                  {log.items.join(' · ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Budget & Allergy-Aware Meal Planner */}
      <div className="rounded-3xl bg-[#EEF5EF] dark:bg-[#1B211D] p-6 md:p-8 border border-[#DDE5DF] dark:border-[#2B322E] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-normal text-[#191D1A] dark:text-[#E1E3DF]">
              Adaptive Meal Planner & Consolidated Grocery List
            </h2>
            <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2] mt-1">
              Tailored to your household budget, prep time window, and allergy considerations.
            </p>
          </div>
          <button
            type="button"
            disabled={generatingPlan}
            onClick={generateCustomMealPlan}
            className="min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#006B58] hover:bg-[#005344] flex items-center gap-2 whitespace-nowrap disabled:opacity-60"
          >
            {generatingPlan ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating with Gemini...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Regenerate Meal Plan
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <label className="block">
            <span className="text-xs font-medium text-[#3F4944] dark:text-[#C0C9C2]">
              Grocery Budget
            </span>
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value as 'low' | 'moderate' | 'flexible')}
              className="mt-1.5 w-full min-h-[44px] rounded-xl bg-[#F7FBF7] dark:bg-[#111512] px-3.5 text-xs font-medium text-[#191D1A] dark:text-[#E1E3DF] border border-[#DDE5DF] dark:border-[#2B322E]"
            >
              <option value="low">Low Budget (Pantry & seasonal staples)</option>
              <option value="moderate">Moderate Everyday Budget</option>
              <option value="flexible">Flexible</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-[#3F4944] dark:text-[#C0C9C2]">
              Max Evening Prep Time
            </span>
            <select
              value={prepTime}
              onChange={(e) => setPrepTime(Number(e.target.value))}
              className="mt-1.5 w-full min-h-[44px] rounded-xl bg-[#F7FBF7] dark:bg-[#111512] px-3.5 text-xs font-medium text-[#191D1A] dark:text-[#E1E3DF] border border-[#DDE5DF] dark:border-[#2B322E] tabular-nums"
            >
              <option value={15}>15 minutes (Low energy / busy nights)</option>
              <option value={20}>20 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-[#3F4944] dark:text-[#C0C9C2]">
              Household Size
            </span>
            <input
              type="number"
              min={1}
              max={12}
              value={householdSize}
              onChange={(e) => setHouseholdSize(Number(e.target.value))}
              className="mt-1.5 w-full min-h-[44px] rounded-xl bg-[#F7FBF7] dark:bg-[#111512] px-3.5 text-xs font-medium text-[#191D1A] dark:text-[#E1E3DF] border border-[#DDE5DF] dark:border-[#2B322E] tabular-nums"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-[#3F4944] dark:text-[#C0C9C2]">
              Allergies / Dislikes
            </span>
            <input
              type="text"
              value={allergiesText}
              onChange={(e) => setAllergiesText(e.target.value)}
              className="mt-1.5 w-full min-h-[44px] rounded-xl bg-[#F7FBF7] dark:bg-[#111512] px-3.5 text-xs font-medium text-[#191D1A] dark:text-[#E1E3DF] border border-[#DDE5DF] dark:border-[#2B322E]"
              placeholder="Peanuts, shellfish..."
            />
          </label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          <div className="lg:col-span-8 space-y-3">
            {mealPlanDays.map((day) => (
              <div
                key={day.dayName}
                className="p-5 rounded-2xl bg-[#F7FBF7] dark:bg-[#111512] border border-[#DDE5DF] dark:border-[#2B322E] space-y-2"
              >
                <h3 className="text-sm font-semibold text-[#006B58] dark:text-[#58DBC2]">
                  {day.dayName}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-[#191D1A] dark:text-[#E1E3DF]">
                  <p>
                    <strong className="text-[#3F4944] dark:text-[#C0C9C2]">Breakfast:</strong>{' '}
                    {day.breakfast}
                  </p>
                  <p>
                    <strong className="text-[#3F4944] dark:text-[#C0C9C2]">Lunch:</strong>{' '}
                    {day.lunch}
                  </p>
                  <p>
                    <strong className="text-[#3F4944] dark:text-[#C0C9C2]">Dinner:</strong>{' '}
                    {day.dinner}
                  </p>
                  <p>
                    <strong className="text-[#3F4944] dark:text-[#C0C9C2]">Snack:</strong>{' '}
                    {day.snack}
                  </p>
                </div>
                <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2] pt-1 border-t border-[#DDE5DF] dark:border-[#2B322E]">
                  {day.prepNote}
                </p>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4 rounded-2xl bg-[#F7FBF7] dark:bg-[#111512] p-5 border border-[#DDE5DF] dark:border-[#2B322E]">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag className="w-4 h-4 text-[#006B58]" />
              <h3 className="text-sm font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
                Grocery Checklist
              </h3>
            </div>
            <div className="space-y-2">
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
                    className="w-full min-h-[44px] p-2.5 rounded-xl bg-[#EEF5EF] dark:bg-[#1B211D] text-left flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center ${
                          checked ? 'bg-[#006B58] text-white' : 'border border-[#3F4944]'
                        }`}
                      >
                        {checked && <Check className="w-3 h-3" />}
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          checked
                            ? 'line-through text-[#3F4944]'
                            : 'text-[#191D1A] dark:text-[#E1E3DF]'
                        }`}
                      >
                        {g.item}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#3F4944] dark:text-[#C0C9C2] shrink-0">
                      {g.category}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
