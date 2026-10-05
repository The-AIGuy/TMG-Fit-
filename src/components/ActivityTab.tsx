import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Plus, CheckCircle2, Sparkles } from 'lucide-react';
import { ActivityLogItem, AdaptivePlanOption } from '../types';

interface ActivityTabProps {
  activityLogs: ActivityLogItem[];
  activePlan: AdaptivePlanOption;
  onOpenCheckInLogger: (plan: AdaptivePlanOption) => void;
  onLogQuickMovement: (title: string, mins: number, category?: ActivityLogItem['category']) => void;
}

const EVERYDAY_MOVEMENTS = [
  { label: 'Walked to the shops', mins: 20 },
  { label: 'Gardening & yard work', mins: 30 },
  { label: 'Played with the kids', mins: 25 },
  { label: 'Walked the dog', mins: 20 },
  { label: 'Household reset & stairs', mins: 15 },
];

export const ActivityTab: React.FC<ActivityTabProps> = ({
  activityLogs,
  activePlan,
  onOpenCheckInLogger,
  onLogQuickMovement,
}) => {
  const [customTitle, setCustomTitle] = useState('');
  const [customMins, setCustomMins] = useState(20);
  const [justAddedNote, setJustAddedNote] = useState<string | null>(null);

  const recoveryCount = activityLogs.filter((l) => l.category === 'recovery').length;
  const outdoorCount = activityLogs.filter((l) => l.category === 'walk' || l.category === 'adventure').length;

  const handleQuickAdd = (
    label: string,
    mins: number,
    category: ActivityLogItem['category'] = 'everyday'
  ) => {
    onLogQuickMovement(label, mins, category);
    setJustAddedNote(`Logged "${label}"`);
    setTimeout(() => setJustAddedNote(null), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="space-y-10"
    >
      {/* Page Title & Consistency Overview */}
      <div className="space-y-4 border-b border-[#E2EAE4] dark:border-[#252C28] pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#006B58] dark:text-[#58DBC2]">
              Consistency Without Streaks
            </p>
            <h1 className="text-3xl md:text-4xl font-normal text-[#191D1A] dark:text-[#E1E3DF] mt-1">
              Your Activity & Recovery
            </h1>
          </div>

          <button
            type="button"
            onClick={() => onOpenCheckInLogger(activePlan)}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#006B58] text-white text-xs font-semibold hover:bg-[#005344] transition-colors whitespace-nowrap self-start md:self-auto"
          >
            Log Today's Plan ({activePlan.title})
          </button>
        </div>

        {/* Clean Unboxed Typographic Consistency Metrics */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 pt-2 text-sm text-[#4A554E] dark:text-[#B8C2BA]">
          <div>
            <span className="text-2xl font-semibold text-[#191D1A] dark:text-[#E1E3DF] tabular-nums mr-2">
              {activityLogs.length}
            </span>
            <span>Active & restorative sessions</span>
          </div>
          <span aria-hidden="true" className="hidden sm:inline text-[#DDE5DF]">
            ·
          </span>
          <div>
            <span className="text-2xl font-semibold text-[#191D1A] dark:text-[#E1E3DF] tabular-nums mr-2">
              {outdoorCount}
            </span>
            <span>Outdoor walks</span>
          </div>
          <span aria-hidden="true" className="hidden sm:inline text-[#DDE5DF]">
            ·
          </span>
          <div>
            <span className="text-2xl font-semibold text-[#006B58] dark:text-[#58DBC2] tabular-nums mr-2">
              {recoveryCount}
            </span>
            <span>Intentional rest days</span>
          </div>
        </div>
      </div>

      {justAddedNote && (
        <div className="p-3.5 rounded-2xl bg-[#BCECE0] text-[#00201A] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{justAddedNote}</span>
        </div>
      )}

      {/* First-Class Rest & Everyday Movement Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Everyday Movement Quick Taps */}
        <div className="lg:col-span-7 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
              Count Everyday Movement
            </h2>
            <p className="text-xs text-[#4A554E] dark:text-[#B8C2BA] mt-0.5">
              Real-life movement outside formal workouts counts toward your wellbeing.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {EVERYDAY_MOVEMENTS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleQuickAdd(item.label, item.mins, 'everyday')}
                className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#EEF4F0] dark:bg-[#1B211D] hover:bg-[#DCE7DF] dark:hover:bg-[#252D28] text-xs font-medium text-[#191D1A] dark:text-[#E1E3DF] transition-colors whitespace-nowrap"
              >
                + {item.label} ({item.mins}m)
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Other activity (e.g., Bike ride, swimming, carrying groceries)"
              className="flex-1 min-h-[44px] rounded-xl bg-white dark:bg-[#171C19] border border-[#DDE5DF] dark:border-[#262E29] px-4 text-xs text-[#191D1A] dark:text-[#E1E3DF]"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={5}
                max={240}
                value={customMins}
                onChange={(e) => setCustomMins(Number(e.target.value))}
                className="w-20 min-h-[44px] rounded-xl bg-white dark:bg-[#171C19] border border-[#DDE5DF] dark:border-[#262E29] px-3 text-xs tabular-nums text-[#191D1A] dark:text-[#E1E3DF]"
              />
              <button
                type="button"
                onClick={() => {
                  if (!customTitle.trim()) return;
                  handleQuickAdd(customTitle.trim(), customMins || 15, 'everyday');
                  setCustomTitle('');
                }}
                className="min-h-[44px] px-4 rounded-xl bg-[#006B58] text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recovery as First-Class Action */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-[#EEF4F0] dark:bg-[#1B211D] border border-[#DDE5DF] dark:border-[#262E29] flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#006B58] dark:text-[#58DBC2]">
              <Heart className="w-4 h-4" />
              <span>Rest is Part of Training</span>
            </div>
            <h2 className="text-lg font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
              Taking a recovery day?
            </h2>
            <p className="text-xs text-[#4A554E] dark:text-[#B8C2BA] leading-relaxed">
              Rest days are never treated as missed targets. Logging rest helps TMG-Fit pace your
              upcoming sessions sensibly.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              handleQuickAdd('Intentional Rest & Recovery Day', 0, 'recovery')
            }
            className="min-h-[44px] w-full rounded-xl bg-white dark:bg-[#131815] hover:bg-[#DCE7DF] text-xs font-semibold text-[#006B58] dark:text-[#58DBC2] border border-[#DDE5DF] dark:border-[#262E29] transition-colors whitespace-nowrap"
          >
            Log Today as a Recovery Day
          </button>
        </div>
      </div>

      {/* Activity Timeline (Planned vs Actual) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
            Recent History (What You Actually Did)
          </h2>
          <span className="text-xs text-[#525E57] dark:text-[#A4B0A8]">
            Honest logs train your adaptive recommendations
          </span>
        </div>

        {activityLogs.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#EEF4F0]/50 dark:bg-[#1B211D] text-center space-y-2">
            <Sparkles className="w-6 h-6 text-[#006B58] mx-auto" />
            <p className="text-sm font-medium text-[#191D1A] dark:text-[#E1E3DF]">
              Your activity journal is ready whenever you are.
            </p>
            <p className="text-xs text-[#4A554E] dark:text-[#B8C2BA]">
              Log a 5-minute walk, everyday movement, or a rest day above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2EAE4] dark:divide-[#252C28] border-t border-b border-[#E2EAE4] dark:border-[#252C28]">
            {activityLogs.map((log) => (
              <div
                key={log.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-[#525E57] dark:text-[#A4B0A8]">
                    <span className="font-semibold text-[#006B58] dark:text-[#58DBC2] capitalize">
                      {log.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{log.dateKey}</span>
                    <span aria-hidden="true">·</span>
                    <span>{log.outcome.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="text-base font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
                    {log.title}
                  </p>
                  {log.notes && (
                    <p className="text-xs text-[#4A554E] dark:text-[#B8C2BA]">
                      “{log.notes}”
                    </p>
                  )}
                </div>

                <div className="text-xs text-[#4A554E] dark:text-[#B8C2BA] tabular-nums shrink-0">
                  {log.category === 'recovery' ? (
                    <span className="font-medium text-[#006B58] dark:text-[#58DBC2]">
                      Restorative Day
                    </span>
                  ) : (
                    <span>
                      <strong className="text-sm text-[#191D1A] dark:text-[#E1E3DF]">
                        {log.actualDuration} min
                      </strong>{' '}
                      (Planned {log.plannedDuration}m · {log.effort})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
