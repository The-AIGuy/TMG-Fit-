import React from 'react';
import { ActivityLogItem } from '../types';
import { CheckCircle2, Heart, ArrowRight } from 'lucide-react';

interface TodaySummaryStripProps {
  activityLogs: ActivityLogItem[];
  onLogRestDay: () => void;
  onOpenActivityTab: () => void;
}

export const TodaySummaryStrip: React.FC<TodaySummaryStripProps> = ({
  activityLogs,
  onLogRestDay,
  onOpenActivityTab,
}) => {
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayLogs = activityLogs.filter((l) => l.dateKey === todayKey);
  const recentLog = activityLogs[0];

  return (
    <section
      aria-label="Today's Activity Summary"
      className="pt-6 border-t border-[#E2EAE4] dark:border-[#252C28] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="flex items-start sm:items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-[#006B58] dark:text-[#58DBC2] shrink-0 mt-0.5 sm:mt-0" />
        <div>
          <p className="text-sm font-medium text-[#191D1A] dark:text-[#E1E3DF]">
            {todayLogs.length > 0
              ? `Today's activity: ${todayLogs.map((l) => l.title).join(', ')}`
              : recentLog
                ? `Last logged: ${recentLog.title} (${recentLog.actualDuration}m · ${recentLog.effort})`
                : 'No activity logged yet today — your pace, your choice.'}
          </p>
          <p className="text-xs text-[#525E57] dark:text-[#A4B0A8] mt-0.5">
            {activityLogs.length} sessions recorded this month · Rest days protect your consistency
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 self-start sm:self-auto">
        <button
          type="button"
          onClick={onLogRestDay}
          className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-medium bg-[#EEF4F0] dark:bg-[#1B211D] text-[#191D1A] dark:text-[#E1E3DF] hover:bg-[#DCE7DF] flex items-center gap-1.5 whitespace-nowrap transition-colors"
        >
          <Heart className="w-3.5 h-3.5 text-[#006B58]" />
          <span>Take a Rest Day</span>
        </button>

        <button
          type="button"
          onClick={onOpenActivityTab}
          className="min-h-[40px] px-3 py-2 text-xs font-semibold text-[#006B58] dark:text-[#58DBC2] hover:underline flex items-center gap-1 whitespace-nowrap"
        >
          <span>Activity History</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  );
};
