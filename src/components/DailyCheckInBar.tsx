import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Clock, Sliders, CloudRain } from 'lucide-react';
import { DurationOption, FeelingState, WeatherContext } from '../types';
import { FEELING_OPTIONS, REAL_LIFE_BARRIERS } from '../adaptiveEngine';

interface DailyCheckInBarProps {
  feelingToday: FeelingState;
  onSelectFeeling: (feeling: FeelingState) => void;
  durationMinutes: DurationOption;
  onSelectDuration: (mins: DurationOption) => void;
  activeBarriers: string[];
  onToggleBarrier: (id: string) => void;
  onClearBarriers: () => void;
  weather: WeatherContext;
  onChangeWeather: (w: WeatherContext) => void;
}

const PRIMARY_FEELINGS: FeelingState[] = [
  'Great',
  'Good',
  'Okay',
  'Tired',
  'Low energy',
  'Getting puffed easily',
];

export const DailyCheckInBar: React.FC<DailyCheckInBarProps> = ({
  feelingToday,
  onSelectFeeling,
  durationMinutes,
  onSelectDuration,
  activeBarriers,
  onToggleBarrier,
  onClearBarriers,
  weather,
  onChangeWeather,
}) => {
  const [showMoreFeelings, setShowMoreFeelings] = useState(false);
  const [showRealLifeDrawer, setShowRealLifeDrawer] = useState(false);

  const secondaryFeelings = FEELING_OPTIONS.filter(
    (f) => !PRIMARY_FEELINGS.includes(f.label)
  );

  return (
    <section aria-label="Daily Check-In" className="space-y-6">
      {/* 1. Feeling Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
            How are you feeling today?
          </h2>
          <button
            type="button"
            onClick={() => setShowMoreFeelings(!showMoreFeelings)}
            className="min-h-[36px] px-2 text-xs font-medium text-[#006B58] dark:text-[#58DBC2] hover:underline flex items-center gap-1 whitespace-nowrap"
          >
            <span>{showMoreFeelings ? 'Fewer options' : 'More states'}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                showMoreFeelings ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRIMARY_FEELINGS.map((label) => {
            const active = feelingToday === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => onSelectFeeling(label)}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#006B58] text-white font-semibold'
                    : 'bg-[#EEF4F0] dark:bg-[#1B211D] text-[#191D1A] dark:text-[#E1E3DF] hover:bg-[#DCE7DF] dark:hover:bg-[#252D28]'
                }`}
              >
                {label}
              </button>
            );
          })}

          {/* Show currently selected feeling if it came from secondary list */}
          {!PRIMARY_FEELINGS.includes(feelingToday) && !showMoreFeelings && (
            <button
              type="button"
              onClick={() => setShowMoreFeelings(true)}
              className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold bg-[#006B58] text-white whitespace-nowrap"
            >
              {feelingToday}
            </button>
          )}
        </div>

        <AnimatePresence>
          {showMoreFeelings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden pt-1"
            >
              <div className="flex flex-wrap gap-2">
                {secondaryFeelings.map((f) => {
                  const active = feelingToday === f.label;
                  return (
                    <button
                      key={f.label}
                      type="button"
                      onClick={() => onSelectFeeling(f.label)}
                      className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-[#006B58] text-white font-semibold'
                          : 'bg-[#EEF4F0] dark:bg-[#1B211D] text-[#3F4944] dark:text-[#C0C9C2] hover:text-[#191D1A]'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Available Time + Real Life Mode Trigger Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-[#E2EAE4] dark:border-[#252C28]">
        <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-medium text-[#4A554E] dark:text-[#B8C2BA] flex items-center gap-1.5 shrink-0">
            <Clock className="w-3.5 h-3.5 text-[#006B58]" />
            Available time:
          </span>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#EEF4F0] dark:bg-[#1B211D]">
            {([5, 10, 20, 30, 45, 60] as DurationOption[]).map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => onSelectDuration(mins)}
                className={`min-h-[36px] px-3 rounded-lg text-xs font-medium tabular-nums transition-colors whitespace-nowrap ${
                  durationMinutes === mins
                    ? 'bg-white dark:bg-[#2A332E] text-[#191D1A] dark:text-white font-semibold shadow-xs'
                    : 'text-[#4A554E] dark:text-[#B8C2BA] hover:text-[#191D1A]'
                }`}
              >
                {mins === 60 ? '60m+' : `${mins}m`}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowRealLifeDrawer(!showRealLifeDrawer)}
          className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors whitespace-nowrap self-start sm:self-auto ${
            activeBarriers.length > 0 || !weather.isOutdoorFriendly
              ? 'bg-[#D3E4FF] text-[#001C38] font-semibold'
              : 'bg-[#EEF4F0] dark:bg-[#1B211D] text-[#3F4944] dark:text-[#C0C9C2] hover:text-[#191D1A]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>
            Real Life Mode
            {activeBarriers.length > 0 ? ` (${activeBarriers.length})` : ''}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${
              showRealLifeDrawer ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* 3. Progressive Disclosure: Real Life Mode & Weather Context */}
      <AnimatePresence>
        {showRealLifeDrawer && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-5 rounded-2xl bg-[#EEF4F0] dark:bg-[#1B211D] border border-[#DDE5DF] dark:border-[#2B322E] space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
                  What's getting in the way today?
                </h3>
                <p className="text-xs text-[#4A554E] dark:text-[#B8C2BA]">
                  Select any real-life constraint and TMG-Fit will adjust your plan immediately.
                </p>
              </div>
              {activeBarriers.length > 0 && (
                <button
                  type="button"
                  onClick={onClearBarriers}
                  className="text-xs font-medium text-[#006B58] dark:text-[#58DBC2] hover:underline whitespace-nowrap"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {REAL_LIFE_BARRIERS.map((b) => {
                const selected = activeBarriers.includes(b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => onToggleBarrier(b.id)}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                      selected
                        ? 'bg-[#006B58] text-white font-semibold'
                        : 'bg-[#F7FBF7] dark:bg-[#111512] text-[#3F4944] dark:text-[#C0C9C2] hover:text-[#191D1A]'
                    }`}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>

            {/* Compact Weather Condition Selector */}
            <div className="pt-3 border-t border-[#DDE5DF] dark:border-[#2B322E] flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-[#4A554E] dark:text-[#B8C2BA] flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-[#006B58]" />
                Local conditions ({weather.condition}, {weather.tempC}°C):
              </span>
              <div className="flex items-center gap-1.5">
                {(
                  [
                    { label: 'Clear 17°C', cond: 'Clear & Mild' as const, outdoor: true, temp: 17 },
                    { label: 'Heavy Rain', cond: 'Heavy Rain' as const, outdoor: false, temp: 12 },
                    {
                      label: 'High Pollen',
                      cond: 'High Pollen / Humid' as const,
                      outdoor: false,
                      temp: 19,
                    },
                  ] as const
                ).map((w) => (
                  <button
                    key={w.label}
                    type="button"
                    onClick={() =>
                      onChangeWeather({
                        status: 'live_simulated_demo',
                        condition: w.cond,
                        tempC: w.temp,
                        airQualityNote: w.outdoor
                          ? 'Good air quality'
                          : 'Shifted indoors for respiratory comfort',
                        isOutdoorFriendly: w.outdoor,
                      })
                    }
                    className={`min-h-[34px] px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      weather.condition === w.cond
                        ? 'bg-[#006B58] text-white'
                        : 'bg-[#F7FBF7] dark:bg-[#111512] text-[#4A554E] dark:text-[#B8C2BA]'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
