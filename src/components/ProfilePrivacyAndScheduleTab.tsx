import React, { useState } from 'react';
import {
  ShieldCheck,
  Calendar,
  Pill,
  Watch,
  Download,
  Trash2,
  FileText,
  Sparkles,
  Check,
  Plus,
} from 'lucide-react';
import {
  ActivityLogItem,
  CalendarEventItem,
  MedicationReminderItem,
  SubscriptionTier,
  UserProfileData,
} from '../types';

interface ProfilePrivacyAndScheduleTabProps {
  profile: UserProfileData;
  activityLogs: ActivityLogItem[];
  medications: MedicationReminderItem[];
  calendarEvents: CalendarEventItem[];
  onUpdateProfile: (updated: UserProfileData) => void;
  onToggleMedication: (id: string) => void;
  onAddMedication: (med: Omit<MedicationReminderItem, 'id' | 'uid'>) => void;
  onAddCalendarEvent: (ev: Omit<CalendarEventItem, 'id' | 'uid'>) => void;
  onClearAllData: () => void;
}

export const ProfilePrivacyAndScheduleTab: React.FC<
  ProfilePrivacyAndScheduleTabProps
> = ({
  profile,
  activityLogs,
  medications,
  calendarEvents,
  onUpdateProfile,
  onToggleMedication,
  onAddMedication,
  onAddCalendarEvent,
  onClearAllData,
}) => {
  const [medName, setMedName] = useState('');
  const [medTime, setMedTime] = useState('08:30');
  const [medSchedule, setMedSchedule] = useState('Daily with breakfast');

  const [evTitle, setEvTitle] = useState('');
  const [evTime, setEvTime] = useState('17:30');
  const [evDuration, setEvDuration] = useState<number>(20);
  const [evType, setEvType] = useState<CalendarEventItem['eventType']>('walk');

  const [wearableProviders, setWearableProviders] = useState([
    { name: 'Garmin Connect', status: 'Simulated Demo Connected', stepsToday: '4,820', sleep: '7h 15m (Estimate)' },
    { name: 'Fitbit / Pixel Watch', status: 'Available (Platform-Neutral)', stepsToday: '—', sleep: '—' },
    { name: 'Samsung Health / Health Connect', status: 'Available', stepsToday: '—', sleep: '—' },
    { name: 'Apple Health / Watch', status: 'Available (Equal Citizen)', stepsToday: '—', sleep: '—' },
  ]);

  const [appleEasterEggMode, setAppleEasterEggMode] = useState<boolean>(
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );
  const [showProReport, setShowProReport] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleExportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      privacyGuarantee: 'Your health is not advertising inventory.',
      profile,
      activityLogs,
      medications,
      calendarEvents,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google-fit-adapt-data-${profile.name.toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTierSelect = (tier: SubscriptionTier) => {
    onUpdateProfile({
      ...profile,
      subscriptionTier: tier,
    });
  };

  return (
    <div className="space-y-10">
      {/* Privacy Guarantee Header */}
      <div className="rounded-3xl bg-[#EEF5EF] dark:bg-[#1B211D] p-6 md:p-8 border border-[#DDE5DF] dark:border-[#2B322E] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#006B58] dark:text-[#58DBC2]">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero Targeted Health Ads · Strict Firestore Isolation</span>
          </div>
          <h1 className="text-3xl font-normal text-[#191D1A] dark:text-[#E1E3DF]">
            “Your health isn't our advertising inventory.”
          </h1>
          <p className="text-sm text-[#3F4944] dark:text-[#C0C9C2] leading-relaxed">
            You own your profile, health considerations, activity logs, and learned preferences.
            Export everything in one click or wipe it permanently at any time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportJson}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F7FBF7] dark:bg-[#111512] text-xs font-semibold text-[#191D1A] dark:text-[#E1E3DF] border border-[#DDE5DF] dark:border-[#2B322E] flex items-center gap-2 whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-[#006B58]" />
            Export My Data (JSON)
          </button>
          <button
            type="button"
            onClick={() => setShowProReport(!showProReport)}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#006B58] text-white text-xs font-semibold flex items-center gap-2 whitespace-nowrap"
          >
            <FileText className="w-4 h-4" />
            {showProReport ? 'Hide Clinician Summary' : 'Professional-Review Report'}
          </button>
        </div>
      </div>

      {/* Optional Clinician / Physiotherapist Review Summary */}
      {showProReport && (
        <div className="rounded-3xl bg-[#F7FBF7] dark:bg-[#111512] p-6 border-2 border-[#006B58] space-y-4">
          <div className="flex items-center justify-between border-b border-[#DDE5DF] dark:border-[#2B322E] pb-3">
            <div>
              <p className="text-xs font-semibold text-[#006B58] dark:text-[#58DBC2]">
                User-Initiated Summary for Qualified Health Professional Review
              </p>
              <h2 className="text-xl font-normal text-[#191D1A] dark:text-[#E1E3DF]">
                Activity & Check-In Summary — {profile.name}
              </h2>
            </div>
            <span className="text-xs text-[#3F4944] dark:text-[#C0C9C2] tabular-nums">
              Generated {new Date().toLocaleDateString()}
            </span>
          </div>
          <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2]">
            Note: This summary compiles user-reported check-ins, goals, and logged activities.
            AI-generated workout suggestions are assistive fitness tools and have not been
            clinically endorsed unless reviewed by your healthcare provider.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#EEF5EF] dark:bg-[#1B211D]">
              <p className="font-semibold text-[#191D1A] dark:text-[#E1E3DF]">User-Stated Goals</p>
              <p className="mt-1 text-[#3F4944] dark:text-[#C0C9C2]">
                {profile.goals.join(' · ') || 'General wellbeing'}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#EEF5EF] dark:bg-[#1B211D]">
              <p className="font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
                Voluntary Considerations
              </p>
              <p className="mt-1 text-[#3F4944] dark:text-[#C0C9C2]">
                {profile.healthConsiderations.join(' · ') || 'None specified'}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#EEF5EF] dark:bg-[#1B211D]">
              <p className="font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
                Recent Activity Volume
              </p>
              <p className="mt-1 text-[#3F4944] dark:text-[#C0C9C2] tabular-nums">
                {activityLogs.length} logged sessions ({activityLogs.filter((l) => l.category === 'recovery').length} intentional recovery days)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Schedule & Non-Medical Medication Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 rounded-3xl bg-[#F7FBF7] dark:bg-[#111512] p-6 border border-[#DDE5DF] dark:border-[#2B322E] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#006B58]" />
              <h2 className="text-xl font-normal text-[#191D1A] dark:text-[#E1E3DF]">
                Schedule & Adaptive Windows
              </h2>
            </div>
            <span className="text-xs text-[#3F4944] dark:text-[#C0C9C2]">
              Explicit permission required
            </span>
          </div>
          <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2]">
            Add busy blocks, walks, or recovery days so the engine can spot realistic 15–20 minute
            windows between work, school pick-up, and dinner.
          </p>

          <div className="space-y-2">
            {calendarEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-3.5 rounded-2xl bg-[#EEF5EF] dark:bg-[#1B211D] flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-xs font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
                    {ev.title}
                  </p>
                  <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2] tabular-nums mt-0.5">
                    {ev.dateKey} · {ev.startTime} · {ev.durationMinutes} mins · {ev.eventType.replace('_', ' ')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#DDE5DF] dark:border-[#2B322E] grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={evTitle}
              onChange={(e) => setEvTitle(e.target.value)}
              placeholder="e.g. 15-min walk before dinner"
              className="sm:col-span-2 min-h-[40px] rounded-xl bg-[#EEF5EF] dark:bg-[#1B211D] px-3 text-xs text-[#191D1A] dark:text-[#E1E3DF]"
            />
            <select
              value={evType}
              onChange={(e) => setEvType(e.target.value as CalendarEventItem['eventType'])}
              className="min-h-[40px] rounded-xl bg-[#EEF5EF] dark:bg-[#1B211D] px-3 text-xs text-[#191D1A] dark:text-[#E1E3DF]"
            >
              <option value="walk">Walk</option>
              <option value="workout">Workout</option>
              <option value="recovery">Recovery Day</option>
              <option value="family">Family Activity</option>
              <option value="busy_block">Busy Life Block</option>
            </select>
            <input
              type="time"
              value={evTime}
              onChange={(e) => setEvTime(e.target.value)}
              className="min-h-[40px] rounded-xl bg-[#EEF5EF] dark:bg-[#1B211D] px-3 text-xs text-[#191D1A] dark:text-[#E1E3DF] tabular-nums"
            />
            <input
              type="number"
              value={evDuration}
              onChange={(e) => setEvDuration(Number(e.target.value))}
              className="min-h-[40px] rounded-xl bg-[#EEF5EF] dark:bg-[#1B211D] px-3 text-xs text-[#191D1A] dark:text-[#E1E3DF] tabular-nums"
            />
            <button
              type="button"
              onClick={() => {
                if (!evTitle.trim()) return;
                onAddCalendarEvent({
                  title: evTitle.trim(),
                  dateKey: new Date().toISOString().slice(0, 10),
                  startTime: evTime,
                  durationMinutes: evDuration || 20,
                  eventType: evType,
                });
                setEvTitle('');
              }}
              className="min-h-[40px] rounded-xl bg-[#006B58] text-white text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Event
            </button>
          </div>
        </div>

        {/* User-Entered Medication Reminders (Reminder tool only) */}
        <div className="lg:col-span-6 rounded-3xl bg-[#F7FBF7] dark:bg-[#111512] p-6 border border-[#DDE5DF] dark:border-[#2B322E] space-y-4">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-[#006B58]" />
            <h2 className="text-xl font-normal text-[#191D1A] dark:text-[#E1E3DF]">
              Personal Medication Reminders
            </h2>
          </div>
          <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2]">
            Strictly a personal reminder checklist. Google Fit Adapt never invents dosages,
            alters prescriptions, or provides clinical medication advice.
          </p>

          <div className="space-y-2">
            {medications.map((med) => (
              <button
                key={med.id}
                type="button"
                onClick={() => onToggleMedication(med.id)}
                className="w-full min-h-[48px] p-3.5 rounded-2xl bg-[#EEF5EF] dark:bg-[#1B211D] flex items-center justify-between gap-3 text-left"
              >
                <div>
                  <p className="text-xs font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
                    {med.medicationName}
                  </p>
                  <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2] tabular-nums mt-0.5">
                    {med.reminderTime} · {med.scheduleLabel}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold flex items-center gap-1 ${
                    med.takenToday ? 'text-[#006B58] dark:text-[#58DBC2]' : 'text-[#3F4944]'
                  }`}
                >
                  {med.takenToday ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Checked today
                    </>
                  ) : (
                    'Mark done'
                  )}
                </span>
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-[#DDE5DF] dark:border-[#2B322E] grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={medName}
              onChange={(e) => setMedName(e.target.value)}
              placeholder="Reminder label (e.g. Morning inhaler)"
              className="min-h-[40px] rounded-xl bg-[#EEF5EF] dark:bg-[#1B211D] px-3 text-xs text-[#191D1A] dark:text-[#E1E3DF]"
            />
            <input
              type="time"
              value={medTime}
              onChange={(e) => setMedTime(e.target.value)}
              className="min-h-[40px] rounded-xl bg-[#EEF5EF] dark:bg-[#1B211D] px-3 text-xs text-[#191D1A] dark:text-[#E1E3DF] tabular-nums"
            />
            <button
              type="button"
              onClick={() => {
                if (!medName.trim()) return;
                onAddMedication({
                  medicationName: medName.trim(),
                  reminderTime: medTime,
                  scheduleLabel: medSchedule,
                  notes: 'User-entered reminder',
                  takenToday: false,
                });
                setMedName('');
              }}
              className="min-h-[40px] rounded-xl bg-[#006B58] text-white text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Reminder
            </button>
          </div>
        </div>
      </div>

      {/* Platform-Neutral Wearables + Optional Apple Edition Comedic Easter Eggs */}
      <div className="rounded-3xl bg-[#EEF5EF] dark:bg-[#1B211D] p-6 border border-[#DDE5DF] dark:border-[#2B322E] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Watch className="w-4 h-4 text-[#006B58]" />
            <h2 className="text-xl font-normal text-[#191D1A] dark:text-[#E1E3DF]">
              Platform-Neutral Wearables & Device Parity
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setAppleEasterEggMode(!appleEasterEggMode)}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#F7FBF7] dark:bg-[#111512] text-xs font-medium text-[#3F4944] dark:text-[#C0C9C2] border border-[#DDE5DF] dark:border-[#2B322E] whitespace-nowrap"
          >
            {appleEasterEggMode
              ? 'Apple Edition Easter Eggs: Active (“Fruit-based device detected”)'
              : 'Preview Apple Edition Easter Eggs'}
          </button>
        </div>

        {appleEasterEggMode && (
          <div className="p-4 rounded-2xl bg-[#D3E4FF] text-[#001C38] text-xs space-y-1">
            <p className="font-semibold">
              🍎 Fruit-based device detected · Welcome to the walled garden (Core functionality
              100% identical across all platforms!)
            </p>
            <p>
              • Apple Watch status: <em>“The wrist fruit has arrived.”</em> · AirPods status:{' '}
              <em>“Two tiny white beans detected.”</em> · Low battery alert:{' '}
              <em>“Your rectangle is dying.”</em>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {wearableProviders.map((w, idx) => (
            <div
              key={w.name}
              className="p-4 rounded-2xl bg-[#F7FBF7] dark:bg-[#111512] border border-[#DDE5DF] dark:border-[#2B322E] flex flex-col justify-between gap-3"
            >
              <div>
                <p className="text-sm font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
                  {w.name}
                </p>
                <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2] mt-1">{w.status}</p>
                {w.stepsToday !== '—' && (
                  <p className="text-xs text-[#006B58] dark:text-[#58DBC2] mt-2 tabular-nums">
                    Steps: {w.stepsToday} · Sleep: {w.sleep}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = [...wearableProviders];
                  const isConnected = next[idx].status.includes('Connected');
                  next[idx] = {
                    ...next[idx],
                    status: isConnected ? 'Disconnected' : 'Simulated Demo Connected',
                    stepsToday: isConnected ? '—' : '5,140',
                    sleep: isConnected ? '—' : '7h 30m (Estimate)',
                  };
                  setWearableProviders(next);
                }}
                className="min-h-[40px] px-3 rounded-xl text-xs font-medium bg-[#EEF5EF] dark:bg-[#1B211D] text-[#191D1A] dark:text-[#E1E3DF] whitespace-nowrap"
              >
                {w.status.includes('Connected') ? 'Disconnect' : 'Connect Demo'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Transparent 3-Tier Subscription Architecture */}
      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium text-[#3F4944] dark:text-[#C0C9C2]">
            Transparent Membership · Safety & Accessibility Are Never Locked Behind a Paywall
          </p>
          <h2 className="text-2xl font-normal text-[#191D1A] dark:text-[#E1E3DF] mt-1">
            Choose the Plan That Fits Your Household
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              id: 'free' as SubscriptionTier,
              name: 'Free — For Everyday Consistency',
              price: 'NZ$0 / month',
              desc: 'Genuinely useful forever. Never crippled or ad-supported.',
              features: [
                'Daily feeling check-in & Plan A / B / C engine',
                'Condition & equipment-aware exercise substitutions',
                'Everyday movement & guilt-free recovery logging',
                'Full accessibility & privacy controls',
              ],
            },
            {
              id: 'pro' as SubscriptionTier,
              name: 'Pro — For Deeper Adaptive Planning',
              price: 'NZ$9.99 / month',
              desc: 'Full lifestyle adaptation for busy schedules and budgets.',
              features: [
                'Everything in Free + Real Life Mode instant adaptation',
                'Budget & allergy-aware weekly Meal Planner + Grocery Lists',
                'Adventure Mode & Family Mode local Maps discovery',
                'Full workout journal & multi-wearable sync',
              ],
            },
            {
              id: 'pro_plus' as SubscriptionTier,
              name: 'Pro+ — For Families & Long-Term Coaching',
              price: 'NZ$19.99 / month',
              desc: 'Household profiles and clinician-ready summary exports.',
              features: [
                'Everything in Pro + up to 5 Family Household Profiles',
                'Long-term adaptive seasonal programmes',
                'Professional-review-ready PDF/JSON summary reports',
                'Priority multimodal Gemini coaching & voice companion',
              ],
            },
          ].map((plan) => {
            const current = profile.subscriptionTier === plan.id;
            return (
              <div
                key={plan.id}
                className={`p-6 rounded-3xl border flex flex-col justify-between gap-6 ${
                  current
                    ? 'bg-[#EEF5EF] dark:bg-[#1B211D] border-[#006B58]'
                    : 'bg-[#F7FBF7] dark:bg-[#111512] border-[#DDE5DF] dark:border-[#2B322E]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
                      {plan.name}
                    </span>
                  </div>
                  <p className="text-2xl font-normal text-[#006B58] dark:text-[#58DBC2] tabular-nums">
                    {plan.price}
                  </p>
                  <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2]">{plan.desc}</p>
                  <ul className="space-y-2 pt-2 text-xs text-[#191D1A] dark:text-[#E1E3DF]">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#006B58] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleTierSelect(plan.id)}
                  className={`min-h-[44px] w-full rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                    current
                      ? 'bg-[#006B58] text-white'
                      : 'bg-[#EEF5EF] dark:bg-[#1B211D] text-[#191D1A] dark:text-[#E1E3DF]'
                  }`}
                >
                  {current ? 'Current Active Plan (Demo)' : `Switch to ${plan.id.toUpperCase()}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Data Control */}
      <div className="pt-4 border-t border-[#DDE5DF] dark:border-[#2B322E] flex items-center justify-between">
        <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2]">
          Want to reset your demo or delete all stored profile and activity logs?
        </p>
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 flex items-center gap-1.5 whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete All My Data
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClearAllData();
                setConfirmDelete(false);
              }}
              className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 whitespace-nowrap"
            >
              Confirm Permanent Reset
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium text-[#3F4944] whitespace-nowrap"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
