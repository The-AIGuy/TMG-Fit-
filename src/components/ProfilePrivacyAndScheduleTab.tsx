import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User } from 'firebase/auth';
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
  LogIn,
  LogOut,
  Sliders,
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
  firebaseUser: User | null;
  onGoogleSignIn: () => void;
  onSignOut: () => void;
  onOpenOnboarding: () => void;
  highContrastText: boolean;
  onToggleHighContrast: () => void;
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
  firebaseUser,
  onGoogleSignIn,
  onSignOut,
  onOpenOnboarding,
  highContrastText,
  onToggleHighContrast,
  activityLogs,
  medications,
  calendarEvents,
  onUpdateProfile,
  onToggleMedication,
  onAddMedication,
  onAddCalendarEvent,
  onClearAllData,
}) => {
  const [subSection, setSubSection] = useState<
    'overview' | 'schedule' | 'devices' | 'privacy'
  >('overview');

  const [medName, setMedName] = useState('');
  const [medTime, setMedTime] = useState('08:30');
  const [medSchedule] = useState('Daily reminder');

  const [evTitle, setEvTitle] = useState('');
  const [evTime, setEvTime] = useState('17:30');
  const [evDuration, setEvDuration] = useState<number>(20);
  const [evType, setEvType] = useState<CalendarEventItem['eventType']>('walk');

  const [wearableProviders, setWearableProviders] = useState([
    {
      name: 'Garmin Connect',
      status: 'Connected (Demo)',
      stepsToday: '4,820',
      sleep: '7h 15m (Estimate)',
    },
    {
      name: 'Fitbit / Pixel Watch',
      status: 'Available',
      stepsToday: '—',
      sleep: '—',
    },
    {
      name: 'Samsung Health / Health Connect',
      status: 'Available',
      stepsToday: '—',
      sleep: '—',
    },
    {
      name: 'Apple Health / Watch',
      status: 'Available (Full Parity)',
      stepsToday: '—',
      sleep: '—',
    },
  ]);

  const [appleEasterEggMode, setAppleEasterEggMode] = useState<boolean>(
    typeof navigator !== 'undefined' &&
      /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );
  const [showProReport, setShowProReport] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleExportJson = () => {
    const payload = {
      app: 'TMG-Fit',
      exportedAt: new Date().toISOString(),
      privacyGuarantee: 'Your health is not our advertising inventory.',
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
    a.download = `tmg-fit-data-${profile.name.toLowerCase()}.json`;
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
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="space-y-8"
    >
      {/* Profile Header & Account Status */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E2EAE4] dark:border-[#252C28] pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#006B58] dark:text-[#58DBC2]">
            Account, Schedule & Privacy
          </p>
          <h1 className="text-3xl md:text-4xl font-normal text-[#191D1A] dark:text-[#E1E3DF] mt-1">
            {profile.name}'s TMG-Fit Settings
          </h1>
          <p className="text-xs text-[#4A554E] dark:text-[#B8C2BA] mt-1">
            {firebaseUser
              ? `Signed in as ${firebaseUser.email} · Private Firestore sync active`
              : `Interactive Demo Mode (${profile.locationArea}) · Sign in to save across devices`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenOnboarding}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#EEF4F0] dark:bg-[#1B211D] text-xs font-semibold text-[#191D1A] dark:text-[#E1E3DF] flex items-center gap-1.5 whitespace-nowrap"
          >
            <Sliders className="w-3.5 h-3.5 text-[#006B58]" />
            <span>Update Preferences & Gear</span>
          </button>

          {firebaseUser ? (
            <button
              type="button"
              onClick={onSignOut}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#EEF4F0] dark:bg-[#1B211D] text-xs font-semibold text-[#191D1A] dark:text-[#E1E3DF] flex items-center gap-1.5 whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onGoogleSignIn}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#006B58] text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In with Google</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Navigation Pills */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#EEF4F0] dark:bg-[#1B211D] overflow-x-auto w-fit">
        {(
          [
            { id: 'overview', label: 'Preferences & Accessibility' },
            { id: 'schedule', label: 'Schedule & Reminders' },
            { id: 'devices', label: 'Wearables & Membership' },
            { id: 'privacy', label: 'Privacy & Data Export' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSubSection(tab.id)}
            className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
              subSection === tab.id
                ? 'bg-[#006B58] text-white font-semibold'
                : 'text-[#4A554E] dark:text-[#B8C2BA] hover:text-[#191D1A]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. OVERVIEW: Goals, Equipment & Accessibility */}
      {subSection === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-white dark:bg-[#171C19] p-6 border border-[#DDE5DF] dark:border-[#262E29] space-y-4">
            <h2 className="text-lg font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
              Current Profile & Equipment
            </h2>
            <div className="space-y-3 text-xs text-[#4A554E] dark:text-[#B8C2BA]">
              <div>
                <p className="font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
                  Goals
                </p>
                <p className="mt-0.5">{profile.goals.join(' · ')}</p>
              </div>
              <div>
                <p className="font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
                  Available Equipment
                </p>
                <p className="mt-0.5">
                  {profile.equipment.join(' · ') || 'Bodyweight only'}
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
                  Voluntary Health Considerations
                </p>
                <p className="mt-0.5">
                  {profile.healthConsiderations.join(' · ') || 'None specified'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white dark:bg-[#171C19] p-6 border border-[#DDE5DF] dark:border-[#262E29] space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
                Accessibility & Display
              </h2>
              <p className="text-xs text-[#4A554E] dark:text-[#B8C2BA] leading-relaxed">
                Accessibility is a core right in TMG-Fit, never a premium add-on.
                Toggle larger typography and enhanced contrast below.
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleHighContrast}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#EEF4F0] dark:bg-[#1D2420] text-xs font-semibold text-[#191D1A] dark:text-[#E1E3DF] self-start"
            >
              {highContrastText
                ? 'Switch to Standard Text Scale'
                : 'Enable Large Accessible Text'}
            </button>
          </div>
        </div>
      )}

      {/* 2. SCHEDULE & MEDICATION REMINDERS */}
      {subSection === 'schedule' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-[#171C19] p-6 border border-[#DDE5DF] dark:border-[#262E29] space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#006B58]" />
              <h2 className="text-lg font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
                Schedule Windows
              </h2>
            </div>
            <p className="text-xs text-[#4A554E] dark:text-[#B8C2BA]">
              Add busy blocks or planned walks so TMG-Fit can suggest realistic
              15–20 minute windows.
            </p>

            <div className="divide-y divide-[#E2EAE4] dark:divide-[#262E29]">
              {calendarEvents.map((ev) => (
                <div key={ev.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-xs font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
                    {ev.title}
                  </p>
                  <p className="text-xs text-[#525E57] dark:text-[#A4B0A8] tabular-nums mt-0.5">
                    {ev.dateKey} · {ev.startTime} · {ev.durationMinutes} mins ·{' '}
                    {ev.eventType.replace('_', ' ')}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#E2EAE4] dark:border-[#262E29] grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={evTitle}
                onChange={(e) => setEvTitle(e.target.value)}
                placeholder="e.g., 15-min walk before dinner"
                className="sm:col-span-2 min-h-[40px] rounded-xl bg-[#EEF4F0] dark:bg-[#1D2420] px-3 text-xs"
              />
              <select
                value={evType}
                onChange={(e) =>
                  setEvType(e.target.value as CalendarEventItem['eventType'])
                }
                className="min-h-[40px] rounded-xl bg-[#EEF4F0] dark:bg-[#1D2420] px-3 text-xs"
              >
                <option value="walk">Walk</option>
                <option value="workout">Workout</option>
                <option value="recovery">Recovery</option>
                <option value="family">Family</option>
                <option value="busy_block">Busy Block</option>
              </select>
              <input
                type="time"
                value={evTime}
                onChange={(e) => setEvTime(e.target.value)}
                className="min-h-[40px] rounded-xl bg-[#EEF4F0] dark:bg-[#1D2420] px-3 text-xs tabular-nums"
              />
              <input
                type="number"
                value={evDuration}
                onChange={(e) => setEvDuration(Number(e.target.value))}
                className="min-h-[40px] rounded-xl bg-[#EEF4F0] dark:bg-[#1D2420] px-3 text-xs tabular-nums"
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
                <span>Add</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-[#171C19] p-6 border border-[#DDE5DF] dark:border-[#262E29] space-y-4">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-[#006B58]" />
              <h2 className="text-lg font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
                Personal Medication Reminders
              </h2>
            </div>
            <p className="text-xs text-[#4A554E] dark:text-[#B8C2BA]">
              A personal reminder checklist only. TMG-Fit never prescribes or
              alters medication schedules.
            </p>

            <div className="space-y-2">
              {medications.map((med) => (
                <button
                  key={med.id}
                  type="button"
                  onClick={() => onToggleMedication(med.id)}
                  className="w-full min-h-[48px] p-3.5 rounded-2xl bg-[#EEF4F0] dark:bg-[#1D2420] flex items-center justify-between gap-3 text-left"
                >
                  <div>
                    <p className="text-xs font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
                      {med.medicationName}
                    </p>
                    <p className="text-xs text-[#525E57] dark:text-[#A4B0A8] tabular-nums mt-0.5">
                      {med.reminderTime} · {med.scheduleLabel}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold flex items-center gap-1 ${
                      med.takenToday
                        ? 'text-[#006B58] dark:text-[#58DBC2]'
                        : 'text-[#525E57]'
                    }`}
                  >
                    {med.takenToday ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Done
                      </>
                    ) : (
                      'Mark done'
                    )}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-[#E2EAE4] dark:border-[#262E29] grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                placeholder="Reminder label"
                className="min-h-[40px] rounded-xl bg-[#EEF4F0] dark:bg-[#1D2420] px-3 text-xs"
              />
              <input
                type="time"
                value={medTime}
                onChange={(e) => setMedTime(e.target.value)}
                className="min-h-[40px] rounded-xl bg-[#EEF4F0] dark:bg-[#1D2420] px-3 text-xs tabular-nums"
              />
              <button
                type="button"
                onClick={() => {
                  if (!medName.trim()) return;
                  onAddMedication({
                    medicationName: medName.trim(),
                    reminderTime: medTime,
                    scheduleLabel: medSchedule,
                    notes: 'User reminder',
                    takenToday: false,
                  });
                  setMedName('');
                }}
                className="min-h-[40px] rounded-xl bg-[#006B58] text-white text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. WEARABLES & MEMBERSHIP */}
      {subSection === 'devices' && (
        <div className="space-y-8">
          <div className="rounded-3xl bg-white dark:bg-[#171C19] p-6 border border-[#DDE5DF] dark:border-[#262E29] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Watch className="w-4 h-4 text-[#006B58]" />
                <h2 className="text-lg font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
                  Platform-Neutral Wearables
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setAppleEasterEggMode(!appleEasterEggMode)}
                className="min-h-[36px] px-3 py-1 rounded-xl bg-[#EEF4F0] dark:bg-[#1D2420] text-xs font-medium text-[#4A554E] dark:text-[#B8C2BA] whitespace-nowrap"
              >
                {appleEasterEggMode
                  ? 'Apple Easter Eggs: On (“Fruit-based device detected”)'
                  : 'Preview Apple Edition Easter Eggs'}
              </button>
            </div>

            {appleEasterEggMode && (
              <div className="p-3.5 rounded-2xl bg-[#EEF4F0] dark:bg-[#1D2420] text-xs text-[#191D1A] dark:text-[#E1E3DF]">
                🍎 <strong>Fruit-based device detected:</strong> “Welcome to the
                walled garden.” · Watch: “The wrist fruit has arrived.” ·
                AirPods: “Two tiny white beans detected.” (All features remain
                100% equal across platforms.)
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {wearableProviders.map((w, idx) => (
                <div
                  key={w.name}
                  className="p-4 rounded-2xl bg-[#EEF4F0]/60 dark:bg-[#1D2420] flex flex-col justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
                      {w.name}
                    </p>
                    <p className="text-xs text-[#525E57] dark:text-[#A4B0A8] mt-0.5">
                      {w.status}
                    </p>
                    {w.stepsToday !== '—' && (
                      <p className="text-xs text-[#006B58] dark:text-[#58DBC2] mt-1.5 tabular-nums">
                        {w.stepsToday} steps · Sleep {w.sleep}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...wearableProviders];
                      const connected = next[idx].status.includes('Connected');
                      next[idx] = {
                        ...next[idx],
                        status: connected ? 'Disconnected' : 'Connected (Demo)',
                        stepsToday: connected ? '—' : '5,140',
                        sleep: connected ? '—' : '7h 30m (Estimate)',
                      };
                      setWearableProviders(next);
                    }}
                    className="min-h-[38px] px-3 rounded-xl text-xs font-medium bg-white dark:bg-[#131815] text-[#191D1A] dark:text-[#E1E3DF]"
                  >
                    {w.status.includes('Connected') ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                id: 'free' as SubscriptionTier,
                name: 'Free',
                price: 'NZ$0 / month',
                desc: 'Full core adaptive experience, never ad-supported.',
                features: [
                  'Daily check-in & Plan A / B / C',
                  'Exercise substitutions & equipment awareness',
                  'Everyday movement & recovery logging',
                ],
              },
              {
                id: 'pro' as SubscriptionTier,
                name: 'Pro',
                price: 'NZ$9.99 / month',
                desc: 'For busy schedules, families, and meal planning.',
                features: [
                  'Real Life Mode instant plan adaptation',
                  'Budget & allergy-aware Meal Planner',
                  'Adventure Mode & Family Mode discovery',
                ],
              },
              {
                id: 'pro_plus' as SubscriptionTier,
                name: 'Pro+',
                price: 'NZ$19.99 / month',
                desc: 'For households and long-term coaching.',
                features: [
                  'Up to 5 Family Household Profiles',
                  'Clinician-ready summary reports',
                  'Priority multimodal AI & voice companion',
                ],
              },
            ].map((plan) => {
              const current = profile.subscriptionTier === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`p-6 rounded-3xl border flex flex-col justify-between gap-5 ${
                    current
                      ? 'bg-[#EEF4F0] dark:bg-[#1B211D] border-[#006B58]'
                      : 'bg-white dark:bg-[#171C19] border-[#DDE5DF] dark:border-[#262E29]'
                  }`}
                >
                  <div className="space-y-2">
                    <span className="text-sm font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
                      {plan.name}
                    </span>
                    <p className="text-2xl font-normal text-[#006B58] dark:text-[#58DBC2] tabular-nums">
                      {plan.price}
                    </p>
                    <p className="text-xs text-[#4A554E] dark:text-[#B8C2BA]">
                      {plan.desc}
                    </p>
                    <ul className="space-y-1.5 pt-2 text-xs text-[#191D1A] dark:text-[#E1E3DF]">
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
                    className={`min-h-[42px] w-full rounded-xl text-xs font-semibold transition-colors ${
                      current
                        ? 'bg-[#006B58] text-white'
                        : 'bg-[#EEF4F0] dark:bg-[#212824] text-[#191D1A] dark:text-[#E1E3DF]'
                    }`}
                  >
                    {current ? 'Current Plan' : `Select ${plan.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. PRIVACY & DATA EXPORT */}
      {subSection === 'privacy' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-white dark:bg-[#171C19] p-6 md:p-8 border border-[#DDE5DF] dark:border-[#262E29] space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#006B58] dark:text-[#58DBC2]">
              <ShieldCheck className="w-4 h-4" />
              <span>Privacy Guarantee</span>
            </div>
            <h2 className="text-2xl font-normal text-[#191D1A] dark:text-[#E1E3DF]">
              “Your health isn't our advertising inventory.”
            </h2>
            <p className="text-sm text-[#4A554E] dark:text-[#B8C2BA] max-w-2xl leading-relaxed">
              TMG-Fit never sells sensitive health considerations or uses them
              for targeted advertising. You can export your full record in JSON
              format, generate a clinician-review summary, or permanently delete
              your data below.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#EEF4F0] dark:bg-[#1D2420] text-xs font-semibold text-[#191D1A] dark:text-[#E1E3DF] flex items-center gap-2 whitespace-nowrap"
              >
                <Download className="w-4 h-4 text-[#006B58]" />
                <span>Export Data (JSON)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowProReport(!showProReport)}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#006B58] text-white text-xs font-semibold flex items-center gap-2 whitespace-nowrap"
              >
                <FileText className="w-4 h-4" />
                <span>
                  {showProReport
                    ? 'Hide Professional Summary'
                    : 'Generate Professional-Review Report'}
                </span>
              </button>
            </div>
          </div>

          {showProReport && (
            <div className="rounded-3xl bg-[#EEF4F0] dark:bg-[#1B211D] p-6 border border-[#006B58] space-y-3">
              <p className="text-xs font-semibold text-[#006B58] dark:text-[#58DBC2]">
                Summary for Qualified Healthcare Professional Review
              </p>
              <p className="text-xs text-[#4A554E] dark:text-[#B8C2BA]">
                Distinguishes user-entered goals ({profile.goals.join(', ')})
                and voluntary considerations (
                {profile.healthConsiderations.join(', ') || 'None'}) from
                AI-generated workout suggestions. {activityLogs.length} sessions
                logged recently.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-[#E2EAE4] dark:border-[#252C28]">
            <span className="text-xs text-[#525E57] dark:text-[#A4B0A8]">
              Permanently delete all stored profile and activity logs
            </span>
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 flex items-center gap-1.5 whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete All Data</span>
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
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="min-h-[40px] px-3 py-2 text-xs font-medium text-[#525E57]"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};
