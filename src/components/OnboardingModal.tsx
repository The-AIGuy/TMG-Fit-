import React, { useState } from 'react';
import {
  Sparkles,
  HeartHandshake,
  Sliders,
  ShieldCheck,
  ArrowRight,
  Check,
} from 'lucide-react';
import { DurationOption, FeelingState, UserProfileData } from '../types';
import { FEELING_OPTIONS } from '../adaptiveEngine';

interface OnboardingModalProps {
  initialProfile: UserProfileData;
  onComplete: (
    updated: UserProfileData,
    initialFeeling: FeelingState,
    initialDuration: DurationOption
  ) => void;
  onClose: () => void;
}

const GOAL_CHOICES = [
  'Move more',
  'Improve stamina',
  'Build strength',
  'Improve mobility',
  'Get outside more',
  'Establish a routine',
  'Prepare for an event',
  'Return to activity after a break',
  'Exercise with family',
  'Improve general fitness',
];

const HEALTH_CHOICES = [
  'Asthma',
  'COPD',
  'Diabetes',
  'Thyroid condition',
  'Mobility limitations',
  'Sometimes low energy',
  "I don't want to provide this",
];

const EQUIPMENT_CHOICES = [
  'Nothing',
  'Chair',
  'Yoga mat',
  'Resistance bands',
  'Dumbbells',
  'Treadmill',
  'Exercise bike',
  'Pool',
  'Gym access',
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  initialProfile,
  onComplete,
  onClose,
}) => {
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState(initialProfile.name || 'Alex');
  const [age, setAge] = useState<number>(initialProfile.age || 34);
  const [preferredUnits, setPreferredUnits] = useState<'metric' | 'imperial'>(
    initialProfile.preferredUnits || 'metric'
  );
  const [locationArea, setLocationArea] = useState(
    initialProfile.locationArea || 'Wellington, New Zealand'
  );
  const [goals, setGoals] = useState<string[]>(
    initialProfile.goals.length > 0
      ? initialProfile.goals
      : ['Move more', 'Improve mobility', 'Get outside more']
  );
  const [healthConsiderations, setHealthConsiderations] = useState<string[]>(
    initialProfile.healthConsiderations
  );
  const [equipment, setEquipment] = useState<string[]>(
    initialProfile.equipment.length > 0
      ? initialProfile.equipment
      : ['Resistance bands', 'Yoga mat']
  );
  const [indoorOutdoor, setIndoorOutdoor] = useState<
    'indoor' | 'outdoor' | 'both'
  >(initialProfile.indoorOutdoorPreference || 'outdoor');
  const [preferredDuration, setPreferredDuration] = useState<DurationOption>(
    initialProfile.preferredDuration || 20
  );
  const [feelingToday, setFeelingToday] = useState<FeelingState>('Tired');

  const toggleItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    item: string,
    max = 10
  ) => {
    if (item === "I don't want to provide this") {
      setList(["I don't want to provide this"]);
      return;
    }
    const filtered = list.filter((x) => x !== "I don't want to provide this");
    if (filtered.includes(item)) {
      setList(filtered.filter((x) => x !== item));
    } else if (filtered.length < max) {
      setList([...filtered, item]);
    }
  };

  const handleFinish = () => {
    const cleanedHealth = healthConsiderations.includes(
      "I don't want to provide this"
    )
      ? []
      : healthConsiderations;

    const updated: UserProfileData = {
      ...initialProfile,
      name: name.trim().slice(0, 100) || 'Alex',
      age: Math.min(120, Math.max(13, Number(age) || 34)),
      preferredUnits,
      locationArea: locationArea.trim().slice(0, 150) || 'Wellington, NZ',
      goals: goals.slice(0, 10),
      healthConsiderations: cleanedHealth.slice(0, 10),
      equipment: equipment.slice(0, 15),
      indoorOutdoorPreference: indoorOutdoor,
      preferredDuration,
      onboardingCompleted: true,
    };
    onComplete(updated, feelingToday, preferredDuration);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="w-full max-w-2xl rounded-3xl bg-[#F7FBF7] dark:bg-[#111512] border border-[#DDE5DF] dark:border-[#2B322E] p-6 md:p-8 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#DDE5DF] dark:border-[#2B322E] pb-4 mb-6">
          <div>
            <p className="text-xs font-medium text-[#3F4944] dark:text-[#C0C9C2]">
              Step {step} of 4 · Personalising Google Fit Adapt
            </p>
            <h2
              id="onboarding-title"
              className="text-2xl md:text-3xl font-normal text-[#191D1A] dark:text-[#E1E3DF] mt-1"
            >
              {step === 1 && 'Welcome. Fitness that adapts to you.'}
              {step === 2 && 'Meaningful goals & voluntary considerations'}
              {step === 3 && 'Equipment & environment'}
              {step === 4 && 'How are you feeling today?'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-3 text-xs font-medium text-[#3F4944] dark:text-[#C0C9C2] hover:underline whitespace-nowrap"
          >
            Skip to Demo
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-5">
            <p className="text-sm text-[#3F4944] dark:text-[#C0C9C2] leading-relaxed">
              Real life has busy schedules, changing energy levels, families, and
              health considerations. We never use guilt streaks or pressure—just
              adaptable options that fit your day.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-medium text-[#3F4944] dark:text-[#C0C9C2]">
                  Your First Name
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full min-h-[44px] rounded-xl bg-[#EEF5EF] dark:bg-[#1B211D] px-4 py-2.5 text-sm text-[#191D1A] dark:text-[#E1E3DF] border border-[#DDE5DF] dark:border-[#2B322E]"
                  placeholder="Alex"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-[#3F4944] dark:text-[#C0C9C2]">
                  Age (Optional)
                </span>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="mt-1.5 w-full min-h-[44px] rounded-xl bg-[#EEF5EF] dark:bg-[#1B211D] px-4 py-2.5 text-sm text-[#191D1A] dark:text-[#E1E3DF] border border-[#DDE5DF] dark:border-[#2B322E] tabular-nums"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-[#3F4944] dark:text-[#C0C9C2]">
                  General Area / City (For weather & local walks)
                </span>
                <input
                  type="text"
                  value={locationArea}
                  onChange={(e) => setLocationArea(e.target.value)}
                  className="mt-1.5 w-full min-h-[44px] rounded-xl bg-[#EEF5EF] dark:bg-[#1B211D] px-4 py-2.5 text-sm text-[#191D1A] dark:text-[#E1E3DF] border border-[#DDE5DF] dark:border-[#2B322E]"
                  placeholder="Wellington, New Zealand"
                />
              </label>
              <div>
                <span className="text-xs font-medium text-[#3F4944] dark:text-[#C0C9C2] block">
                  Preferred Units
                </span>
                <div className="mt-1.5 grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#EEF5EF] dark:bg-[#1B211D]">
                  {(['metric', 'imperial'] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setPreferredUnits(u)}
                      className={`min-h-[40px] rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                        preferredUnits === u
                          ? 'bg-[#006B58] text-white'
                          : 'text-[#3F4944] dark:text-[#C0C9C2]'
                      }`}
                    >
                      {u === 'metric' ? 'Metric (km, kg)' : 'Imperial (mi, lb)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-[#191D1A] dark:text-[#E1E3DF] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#006B58]" />
                What matters to you right now? (Weight loss is never assumed)
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {GOAL_CHOICES.map((g) => {
                  const selected = goals.includes(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleItem(goals, setGoals, g, 10)}
                      className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                        selected
                          ? 'bg-[#BCECE0] text-[#00201A] font-semibold'
                          : 'bg-[#EEF5EF] dark:bg-[#1B211D] text-[#3F4944] dark:text-[#C0C9C2]'
                      }`}
                    >
                      {selected && <Check className="w-3.5 h-3.5" />}
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-[#DDE5DF] dark:border-[#2B322E]">
              <h3 className="text-sm font-semibold text-[#191D1A] dark:text-[#E1E3DF] flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-[#006B58]" />
                Voluntary Health Considerations
              </h3>
              <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2] mt-1">
                Optional. Helps us adjust pacing, breathing rests, and weather
                alerts. We are an assistive fitness tool, not a doctor.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {HEALTH_CHOICES.map((h) => {
                  const selected = healthConsiderations.includes(h);
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() =>
                        toggleItem(
                          healthConsiderations,
                          setHealthConsiderations,
                          h,
                          10
                        )
                      }
                      className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                        selected
                          ? 'bg-[#D3E4FF] text-[#001C38] font-semibold'
                          : 'bg-[#EEF5EF] dark:bg-[#1B211D] text-[#3F4944] dark:text-[#C0C9C2]'
                      }`}
                    >
                      {selected && <Check className="w-3.5 h-3.5" />}
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-[#191D1A] dark:text-[#E1E3DF] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#006B58]" />
                Available Equipment (We automatically substitute exercises if you
                have none)
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {EQUIPMENT_CHOICES.map((eq) => {
                  const selected = equipment.includes(eq);
                  return (
                    <button
                      key={eq}
                      type="button"
                      onClick={() => toggleItem(equipment, setEquipment, eq, 15)}
                      className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                        selected
                          ? 'bg-[#BCECE0] text-[#00201A] font-semibold'
                          : 'bg-[#EEF5EF] dark:bg-[#1B211D] text-[#3F4944] dark:text-[#C0C9C2]'
                      }`}
                    >
                      {selected && <Check className="w-3.5 h-3.5" />}
                      {eq}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#DDE5DF] dark:border-[#2B322E]">
              <div>
                <span className="text-xs font-medium text-[#3F4944] dark:text-[#C0C9C2] block">
                  Indoor / Outdoor Preference
                </span>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(['outdoor', 'indoor', 'both'] as const).map((pref) => (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => setIndoorOutdoor(pref)}
                      className={`min-h-[40px] rounded-xl text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                        indoorOutdoor === pref
                          ? 'bg-[#006B58] text-white'
                          : 'bg-[#EEF5EF] dark:bg-[#1B211D] text-[#3F4944] dark:text-[#C0C9C2]'
                      }`}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-medium text-[#3F4944] dark:text-[#C0C9C2] block">
                  Typical Comfortable Duration
                </span>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {([10, 20, 30] as DurationOption[]).map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setPreferredDuration(mins)}
                      className={`min-h-[40px] rounded-xl text-xs font-medium tabular-nums transition-colors whitespace-nowrap ${
                        preferredDuration === mins
                          ? 'bg-[#006B58] text-white'
                          : 'bg-[#EEF5EF] dark:bg-[#1B211D] text-[#3F4944] dark:text-[#C0C9C2]'
                      }`}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-[#3F4944] dark:text-[#C0C9C2]">
              Select how you feel right now. Your Plan A, Plan B, and Plan C will
              adapt immediately.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {FEELING_OPTIONS.map((item) => {
                const active = feelingToday === item.label;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setFeelingToday(item.label)}
                    className={`min-h-[48px] p-3.5 rounded-2xl text-left transition-colors border ${
                      active
                        ? 'bg-[#BCECE0] text-[#00201A] border-[#006B58]'
                        : 'bg-[#EEF5EF] dark:bg-[#1B211D] text-[#191D1A] dark:text-[#E1E3DF] border-transparent hover:border-[#DDE5DF]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{item.label}</span>
                      <span className="text-xs opacity-75">{item.tone}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-[#DDE5DF] dark:border-[#2B322E] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#3F4944] dark:text-[#C0C9C2]">
            <ShieldCheck className="w-4 h-4 text-[#006B58]" />
            <span>Your health isn't our advertising inventory.</span>
          </div>
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-medium text-[#3F4944] dark:text-[#C0C9C2] bg-[#EEF5EF] dark:bg-[#1B211D] whitespace-nowrap"
              >
                Back
              </button>
            )}
            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#006B58] hover:bg-[#005344] flex items-center gap-2 whitespace-nowrap"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="min-h-[44px] px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#006B58] hover:bg-[#005344] flex items-center gap-2 whitespace-nowrap"
              >
                Generate Today's Adaptive Plan
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
