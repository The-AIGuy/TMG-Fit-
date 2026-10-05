/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { Check, X } from 'lucide-react';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  ActivityLogItem,
  AdaptivePlanOption,
  CalendarEventItem,
  DurationOption,
  ExerciseItem,
  FeelingState,
  FoodLogItem,
  MedicationReminderItem,
  UserProfileData,
  WeatherContext,
} from './types';
import {
  buildAdaptivePlans,
  DEMO_ACTIVITY_LOGS,
  DEMO_ALEX_PROFILE,
  DEMO_CALENDAR_EVENTS,
  DEMO_FOOD_LOGS,
  DEMO_MEDICATIONS,
  FEELING_OPTIONS,
} from './adaptiveEngine';
import { AppHeader, AppView } from './components/AppHeader';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DailyCheckInBar } from './components/DailyCheckInBar';
import { AdaptivePlanHero } from './components/AdaptivePlanHero';
import { TodaySummaryStrip } from './components/TodaySummaryStrip';
import { ActivityTab } from './components/ActivityTab';
import { ExploreAndResearchTab } from './components/ExploreAndResearchTab';
import { FoodAndMealPlannerTab } from './components/FoodAndMealPlannerTab';
import { AICoachTab } from './components/AICoachTab';
import { ProfilePrivacyAndScheduleTab } from './components/ProfilePrivacyAndScheduleTab';
import { OnboardingModal } from './components/OnboardingModal';

const SHEET_SPRING = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 32,
  mass: 0.8,
};

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('home');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [highContrastText, setHighContrastText] = useState<boolean>(false);

  // Auth & Firestore Sync State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [profile, setProfile] = useState<UserProfileData>(DEMO_ALEX_PROFILE);
  const [activityLogs, setActivityLogs] =
    useState<ActivityLogItem[]>(DEMO_ACTIVITY_LOGS);
  const [foodLogs, setFoodLogs] = useState<FoodLogItem[]>(DEMO_FOOD_LOGS);
  const [medications, setMedications] =
    useState<MedicationReminderItem[]>(DEMO_MEDICATIONS);
  const [calendarEvents, setCalendarEvents] =
    useState<CalendarEventItem[]>(DEMO_CALENDAR_EVENTS);

  // Daily Check-in & Real Life Mode State
  const [feelingToday, setFeelingToday] = useState<FeelingState>('Tired');
  const [durationMinutes, setDurationMinutes] = useState<DurationOption>(20);
  const [activeBarriers, setActiveBarriers] = useState<string[]>([]);
  const [selectedPlanTier, setSelectedPlanTier] =
    useState<AdaptivePlanOption['tier']>('Plan A');
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  // Weather Context Simulation
  const [weather, setWeather] = useState<WeatherContext>({
    status: 'live_simulated_demo',
    condition: 'Clear & Mild',
    tempC: 17,
    airQualityNote: 'Good air quality · Low pollen',
    isOutdoorFriendly: true,
  });

  // Exercise Substitution State
  const [exerciseOverrides, setExerciseOverrides] = useState<
    Record<
      string,
      { name: string; cue: string; equipmentNeeded: string; durationOrReps: string }
    >
  >({});

  // "What did you actually do?" Sheet State
  const [loggingPlan, setLoggingPlan] = useState<AdaptivePlanOption | null>(
    null
  );
  const [actualOutcome, setActualOutcome] =
    useState<ActivityLogItem['outcome']>('completed_as_planned');
  const [actualMinutes, setActualMinutes] = useState<number>(20);
  const [actualEffort, setActualEffort] =
    useState<ActivityLogItem['effort']>('gentle');
  const [actualNotes, setActualNotes] = useState<string>('');
  const [ttsPlaying, setTtsPlaying] = useState(false);

  // Sync Dark Mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Attach Firestore listeners when authenticated
  useEffect(() => {
    if (!authReady || !firebaseUser) return;
    const uid = firebaseUser.uid;
    const userDocRef = doc(db, 'users', uid);

    const unsubUser = onSnapshot(
      userDocRef,
      (snap) => {
        if (snap.exists()) {
          const d = snap.data() as UserProfileData;
          setProfile({ ...DEMO_ALEX_PROFILE, ...d, uid });
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}`)
    );

    const logsQuery = query(
      collection(db, `users/${uid}/activityLogs`),
      where('uid', '==', uid)
    );
    const unsubLogs = onSnapshot(
      logsQuery,
      (snap) => {
        if (!snap.empty) {
          const items: ActivityLogItem[] = snap.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<ActivityLogItem, 'id'>),
          }));
          setActivityLogs(items);
        }
      },
      (err) =>
        handleFirestoreError(
          err,
          OperationType.LIST,
          `users/${uid}/activityLogs`
        )
    );

    return () => {
      unsubUser();
      unsubLogs();
    };
  }, [authReady, firebaseUser]);

  const adaptivePlans = useMemo(
    () =>
      buildAdaptivePlans(
        profile,
        feelingToday,
        durationMinutes,
        activeBarriers,
        weather
      ),
    [profile, feelingToday, durationMinutes, activeBarriers, weather]
  );

  const activePlan =
    adaptivePlans.find((p) => p.tier === selectedPlanTier) || adaptivePlans[0];
  const secondaryPlans = adaptivePlans.filter(
    (p) => p.tier !== activePlan.tier
  );

  const handleGoogleSignIn = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const u = cred.user;
      const userRef = doc(db, 'users', u.uid);
      const initialDoc = {
        uid: u.uid,
        name: (u.displayName || profile.name || 'Alex').slice(0, 100),
        age: profile.age || 34,
        preferredUnits: profile.preferredUnits,
        locationArea: profile.locationArea.slice(0, 150),
        timezone: profile.timezone.slice(0, 80),
        goals: profile.goals.slice(0, 10),
        healthConsiderations: profile.healthConsiderations.slice(0, 10),
        equipment: profile.equipment.slice(0, 15),
        favouriteActivities: profile.favouriteActivities.slice(0, 15),
        dislikedActivities: profile.dislikedActivities.slice(0, 15),
        indoorOutdoorPreference: profile.indoorOutdoorPreference,
        musicPreference: profile.musicPreference.slice(0, 80),
        preferredDuration: profile.preferredDuration,
        socialPreference: profile.socialPreference,
        learnedPreferences: profile.learnedPreferences.slice(0, 20),
        allergies: profile.allergies.slice(0, 15),
        foodBudget: profile.foodBudget,
        householdSize: profile.householdSize,
        subscriptionTier: profile.subscriptionTier,
        onboardingCompleted: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      try {
        await setDoc(userRef, initialDoc);
      } catch (writeErr) {
        handleFirestoreError(writeErr, OperationType.WRITE, `users/${u.uid}`);
      }
    } catch (err) {
      console.error('Sign-in cancelled or failed:', err);
    }
  };

  const handleSaveProfile = async (updated: UserProfileData) => {
    setProfile(updated);
    if (firebaseUser) {
      const uid = firebaseUser.uid;
      const userRef = doc(db, 'users', uid);
      try {
        await setDoc(
          userRef,
          {
            uid,
            name: updated.name.slice(0, 100),
            age: updated.age || 34,
            preferredUnits: updated.preferredUnits,
            locationArea: updated.locationArea.slice(0, 150),
            timezone: updated.timezone.slice(0, 80),
            goals: updated.goals.slice(0, 10),
            healthConsiderations: updated.healthConsiderations.slice(0, 10),
            equipment: updated.equipment.slice(0, 15),
            favouriteActivities: updated.favouriteActivities.slice(0, 15),
            dislikedActivities: updated.dislikedActivities.slice(0, 15),
            indoorOutdoorPreference: updated.indoorOutdoorPreference,
            musicPreference: updated.musicPreference.slice(0, 80),
            preferredDuration: updated.preferredDuration,
            socialPreference: updated.socialPreference,
            learnedPreferences: updated.learnedPreferences.slice(0, 20),
            allergies: updated.allergies.slice(0, 15),
            foodBudget: updated.foodBudget,
            householdSize: updated.householdSize,
            subscriptionTier: updated.subscriptionTier,
            onboardingCompleted: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      }
    }
  };

  const persistActivityEntry = async (entry: ActivityLogItem) => {
    setActivityLogs((prev) => [entry, ...prev]);
    if (firebaseUser) {
      const uid = firebaseUser.uid;
      const logRef = doc(db, `users/${uid}/activityLogs`, entry.id);
      try {
        await setDoc(logRef, {
          uid,
          title: entry.title,
          category: entry.category,
          plannedDuration: entry.plannedDuration,
          actualDuration: entry.actualDuration,
          outcome: entry.outcome,
          effort: entry.effort,
          notes: entry.notes,
          dateKey: entry.dateKey,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.CREATE,
          `users/${uid}/activityLogs/${entry.id}`
        );
      }
    }
  };

  const handleRecordActualActivity = async () => {
    if (!loggingPlan) return;
    const newId = `log_${Date.now()}`;
    const dateKey = new Date().toISOString().slice(0, 10);
    const entry: ActivityLogItem = {
      id: newId,
      uid: firebaseUser?.uid || profile.uid,
      title:
        actualOutcome === 'rested_instead'
          ? `Intentional Rest Day (Adapted from ${loggingPlan.title})`
          : loggingPlan.title.slice(0, 150),
      category:
        actualOutcome === 'rested_instead' ? 'recovery' : loggingPlan.category,
      plannedDuration: loggingPlan.durationMinutes,
      actualDuration:
        actualOutcome === 'rested_instead' ? 0 : Math.max(0, actualMinutes),
      outcome: actualOutcome,
      effort: actualOutcome === 'rested_instead' ? 'restorative' : actualEffort,
      notes: actualNotes.trim().slice(0, 500),
      dateKey,
    };

    await persistActivityEntry(entry);
    setLoggingPlan(null);
    setActualNotes('');
  };

  const handleLogQuickMovement = async (
    title: string,
    mins: number,
    category: ActivityLogItem['category'] = 'everyday'
  ) => {
    const newEntry: ActivityLogItem = {
      id: `ev_${Date.now()}`,
      uid: firebaseUser?.uid || profile.uid,
      title: title.slice(0, 150),
      category,
      plannedDuration: mins,
      actualDuration: mins,
      outcome:
        category === 'recovery' ? 'rested_instead' : 'completed_as_planned',
      effort: category === 'recovery' ? 'restorative' : 'gentle',
      notes:
        category === 'recovery'
          ? 'Rest is part of training.'
          : 'Everyday movement logged.',
      dateKey: new Date().toISOString().slice(0, 10),
    };
    await persistActivityEntry(newEntry);
  };

  const toggleBarrier = (barrierId: string) => {
    setActiveBarriers((prev) =>
      prev.includes(barrierId)
        ? prev.filter((b) => b !== barrierId)
        : [...prev, barrierId]
    );
  };

  const handleSubstituteExercise = (
    ex: ExerciseItem,
    alt: ExerciseItem['alternatives'][0]
  ) => {
    setExerciseOverrides((prev) => ({
      ...prev,
      [ex.id]: {
        name: alt.name,
        cue: alt.cue,
        equipmentNeeded: alt.equipmentNeeded,
        durationOrReps: alt.durationOrReps,
      },
    }));

    if (alt.reasonLabel.toLowerCase().includes("don't like")) {
      const note = `Replaced ${ex.name} with ${alt.name}`;
      if (!profile.learnedPreferences.includes(note)) {
        handleSaveProfile({
          ...profile,
          learnedPreferences: [note, ...profile.learnedPreferences].slice(
            0,
            20
          ),
        });
      }
    }
  };

  const speakDailySummary = async () => {
    setTtsPlaying(true);
    const summaryText = `Hey ${profile.name}. You noted you're feeling ${feelingToday.toLowerCase()} today. Your Plan A is a ${activePlan.durationMinutes}-minute ${activePlan.title}. Remember, Plan C is always a guilt-free 5-minute decompression or full rest day.`;
    try {
      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: summaryText }),
      });
      const data = await res.json();
      if (res.ok && data.audioWavBase64) {
        const audio = new Audio(
          `data:audio/wav;base64,${data.audioWavBase64}`
        );
        audio.onended = () => setTtsPlaying(false);
        await audio.play();
        return;
      }
    } catch {
      // Fallback
    }
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(summaryText);
      utter.onend = () => setTtsPlaying(false);
      window.speechSynthesis.speak(utter);
    } else {
      setTtsPlaying(false);
    }
  };

  const currentFeelingObj =
    FEELING_OPTIONS.find((f) => f.label === feelingToday) || FEELING_OPTIONS[3];

  return (
    <LayoutGroup>
      <div
        className={`min-h-screen transition-colors ${
          darkMode
            ? 'bg-[#111512] text-[#E1E3DF]'
            : 'bg-[#F7FBF7] text-[#191D1A]'
        } ${highContrastText ? 'text-[17px]' : ''}`}
      >
        {/* Top Bar Navigation */}
        <AppHeader
          activeView={activeView}
          onSelectView={setActiveView}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          userName={profile.name}
          firebaseUser={firebaseUser}
        />

        {/* Focused Consumer Container */}
        <main className="max-w-5xl mx-auto px-4 md:px-8 pt-6 md:pt-10 pb-28 md:pb-16">
          {/* ===================== HOME SCREEN ===================== */}
          {activeView === 'home' && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="space-y-8"
            >
              {/* 1. Greeting & Core Philosophy */}
              <header className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#006B58] dark:text-[#58DBC2]">
                  Fitness that adapts to you
                </p>
                <h1 className="text-3xl md:text-4xl font-normal text-[#191D1A] dark:text-[#E1E3DF]">
                  Hey {profile.name}.
                </h1>
                <p className="text-sm text-[#4A554E] dark:text-[#B8C2BA]">
                  {currentFeelingObj.supportMessage}
                </p>
              </header>

              {/* 2. Daily Check-In (Feeling + Available Time + Progressive Real Life Mode) */}
              <DailyCheckInBar
                feelingToday={feelingToday}
                onSelectFeeling={(f) => {
                  setFeelingToday(f);
                  setSelectedPlanTier('Plan A');
                }}
                durationMinutes={durationMinutes}
                onSelectDuration={(m) => {
                  setDurationMinutes(m);
                  setSelectedPlanTier('Plan A');
                }}
                activeBarriers={activeBarriers}
                onToggleBarrier={toggleBarrier}
                onClearBarriers={() => setActiveBarriers([])}
                weather={weather}
                onChangeWeather={setWeather}
              />

              {/* 3. Primary Plan A Hero + Secondary Plan B / Plan C */}
              <AdaptivePlanHero
                activePlan={activePlan}
                secondaryPlans={secondaryPlans}
                onSelectPlanTier={setSelectedPlanTier}
                onStartOrLogPlan={(plan) => {
                  setLoggingPlan(plan);
                  setActualMinutes(plan.durationMinutes);
                  setActualEffort(plan.effort);
                  setActualOutcome(
                    plan.category === 'recovery'
                      ? 'rested_instead'
                      : 'completed_as_planned'
                  );
                }}
                exerciseOverrides={exerciseOverrides}
                onSubstituteExercise={handleSubstituteExercise}
                onSpeakSummary={speakDailySummary}
                ttsPlaying={ttsPlaying}
              />

              {/* 4. Concise Today Summary Strip */}
              <TodaySummaryStrip
                activityLogs={activityLogs}
                onLogRestDay={() => {
                  setFeelingToday('Tired');
                  setSelectedPlanTier('Plan C');
                  handleLogQuickMovement(
                    'Intentional Rest & Recovery Day',
                    0,
                    'recovery'
                  );
                }}
                onOpenActivityTab={() => setActiveView('activity')}
              />
            </motion.div>
          )}

          {/* ===================== ACTIVITY SCREEN ===================== */}
          {activeView === 'activity' && (
            <ActivityTab
              activityLogs={activityLogs}
              activePlan={activePlan}
              onOpenCheckInLogger={(plan) => {
                setLoggingPlan(plan);
                setActualMinutes(plan.durationMinutes);
                setActualEffort(plan.effort);
                setActualOutcome('completed_as_planned');
              }}
              onLogQuickMovement={handleLogQuickMovement}
            />
          )}

          {/* ===================== EXPLORE SCREEN ===================== */}
          {activeView === 'explore' && (
            <ExploreAndResearchTab profile={profile} />
          )}

          {/* ===================== FOOD SCREEN ===================== */}
          {activeView === 'food' && (
            <FoodAndMealPlannerTab
              profile={profile}
              foodLogs={foodLogs}
              onAddFoodLog={(entry) =>
                setFoodLogs((prev) => [
                  {
                    ...entry,
                    id: `food_${Date.now()}`,
                    uid: firebaseUser?.uid || profile.uid,
                    dateKey: new Date().toISOString().slice(0, 10),
                  },
                  ...prev,
                ])
              }
            />
          )}

          {/* ===================== AI COACH SCREEN ===================== */}
          {activeView === 'ai' && (
            <AICoachTab
              profile={profile}
              currentFeeling={feelingToday}
              currentDuration={durationMinutes}
              onUpdateProfile={handleSaveProfile}
              onAdaptDuration={(m) => setDurationMinutes(m)}
              onAdaptFeeling={(f) => setFeelingToday(f)}
            />
          )}

          {/* ===================== PROFILE & SETTINGS SCREEN ===================== */}
          {activeView === 'profile' && (
            <ProfilePrivacyAndScheduleTab
              profile={profile}
              firebaseUser={firebaseUser}
              onGoogleSignIn={handleGoogleSignIn}
              onSignOut={() => signOut(auth)}
              onOpenOnboarding={() => setShowOnboarding(true)}
              highContrastText={highContrastText}
              onToggleHighContrast={() =>
                setHighContrastText(!highContrastText)
              }
              activityLogs={activityLogs}
              medications={medications}
              calendarEvents={calendarEvents}
              onUpdateProfile={handleSaveProfile}
              onToggleMedication={(id) =>
                setMedications((prev) =>
                  prev.map((m) =>
                    m.id === id ? { ...m, takenToday: !m.takenToday } : m
                  )
                )
              }
              onAddMedication={(med) =>
                setMedications((prev) => [
                  ...prev,
                  {
                    ...med,
                    id: `med_${Date.now()}`,
                    uid: firebaseUser?.uid || profile.uid,
                  },
                ])
              }
              onAddCalendarEvent={(ev) =>
                setCalendarEvents((prev) => [
                  ...prev,
                  {
                    ...ev,
                    id: `cal_${Date.now()}`,
                    uid: firebaseUser?.uid || profile.uid,
                  },
                ])
              }
              onClearAllData={async () => {
                setActivityLogs([]);
                setFoodLogs([]);
                setMedications([]);
                setCalendarEvents([]);
                if (firebaseUser) {
                  try {
                    await deleteDoc(doc(db, 'users', firebaseUser.uid));
                  } catch (err) {
                    handleFirestoreError(
                      err,
                      OperationType.DELETE,
                      `users/${firebaseUser.uid}`
                    );
                  }
                }
              }}
            />
          )}
        </main>

        {/* Mobile 5-Tab Bottom Navigation */}
        <MobileBottomNav
          activeView={activeView}
          onSelectView={(tab) => setActiveView(tab)}
        />

        {/* Shared-Element Morphing "What Did You Actually Do?" Sheet */}
        <AnimatePresence>
          {loggingPlan && (
            <motion.div
              key="logging-sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setLoggingPlan(null)}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="logging-sheet-title"
            >
              <motion.div
                layout
                layoutId={`plan-card-${loggingPlan.tier}`}
                transition={SHEET_SPRING}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[#F7FBF7] dark:bg-[#141916] p-6 md:p-7 border border-[#DDE5DF] dark:border-[#262E29] space-y-5 shadow-2xl overflow-hidden"
              >
                {/* Grab handle on mobile */}
                <div className="sm:hidden w-10 h-1.5 bg-[#CFD8D2] dark:bg-[#2F3833] rounded-full mx-auto -mt-2 mb-1" />

                {/* Shared Element Header Morphing from Plan Card */}
                <div className="flex items-start justify-between gap-4 border-b border-[#E2EAE4] dark:border-[#262E29] pb-4">
                  <div className="space-y-1">
                    <motion.div
                      layout="position"
                      layoutId={`plan-meta-${loggingPlan.tier}`}
                      className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#006B58] dark:text-[#58DBC2]"
                    >
                      <span>{loggingPlan.tier}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {loggingPlan.durationMinutes} MIN
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{loggingPlan.environment}</span>
                    </motion.div>

                    <motion.h2
                      id="logging-sheet-title"
                      layout="position"
                      layoutId={`plan-title-${loggingPlan.tier}`}
                      className="text-2xl font-normal text-[#191D1A] dark:text-[#E1E3DF]"
                    >
                      {loggingPlan.title}
                    </motion.h2>

                    <motion.p
                      layout="position"
                      layoutId={`plan-subtitle-${loggingPlan.tier}`}
                      className="text-xs text-[#4A554E] dark:text-[#B8C2BA]"
                    >
                      {loggingPlan.subtitle}
                    </motion.p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setLoggingPlan(null)}
                    aria-label="Close activity check-in sheet"
                    className="min-h-[38px] min-w-[38px] rounded-full bg-[#EEF4F0] dark:bg-[#1D2420] flex items-center justify-center text-[#4A554E] dark:text-[#B8C2BA] hover:text-[#191D1A] shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Staggered Form Controls Inside Morphing Container */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.16, delay: 0.04 }}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
                      What did you actually do?
                    </h3>
                    <p className="text-xs text-[#4A554E] dark:text-[#B8C2BA]">
                      No judgment—TMG-Fit adapts to what actually worked for you
                      today.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        {
                          id: 'completed_as_planned',
                          label: 'Completed as planned',
                        },
                        { id: 'did_less', label: 'Did a bit less' },
                        { id: 'did_more', label: 'Did a bit more' },
                        { id: 'did_different', label: 'Did something else' },
                        { id: 'rested_instead', label: 'Rested instead' },
                        { id: 'couldnt_do_it', label: "Couldn't do it today" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setActualOutcome(opt.id)}
                        className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                          actualOutcome === opt.id
                            ? 'bg-[#006B58] text-white font-semibold'
                            : 'bg-[#EEF4F0] dark:bg-[#1D2420] text-[#191D1A] dark:text-[#E1E3DF] hover:bg-[#DCE7DF]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence initial={false}>
                    {actualOutcome !== 'rested_instead' &&
                      actualOutcome !== 'couldnt_do_it' && (
                        <motion.div
                          layout
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="grid grid-cols-2 gap-4 overflow-hidden"
                        >
                          <label className="block">
                            <span className="text-xs font-medium text-[#4A554E] dark:text-[#B8C2BA]">
                              Duration (minutes)
                            </span>
                            <input
                              type="number"
                              min={1}
                              max={240}
                              value={actualMinutes}
                              onChange={(e) =>
                                setActualMinutes(Number(e.target.value))
                              }
                              className="mt-1 w-full min-h-[44px] rounded-xl bg-white dark:bg-[#1D2420] border border-[#DDE5DF] dark:border-[#262E29] px-3.5 text-sm tabular-nums"
                            />
                          </label>
                          <label className="block">
                            <span className="text-xs font-medium text-[#4A554E] dark:text-[#B8C2BA]">
                              How did it feel?
                            </span>
                            <select
                              value={actualEffort}
                              onChange={(e) =>
                                setActualEffort(
                                  e.target.value as ActivityLogItem['effort']
                                )
                              }
                              className="mt-1 w-full min-h-[44px] rounded-xl bg-white dark:bg-[#1D2420] border border-[#DDE5DF] dark:border-[#262E29] px-3.5 text-xs font-medium"
                            >
                              <option value="gentle">Gentle & easy</option>
                              <option value="moderate">
                                Moderate & comfortable
                              </option>
                              <option value="steady">Steady work</option>
                              <option value="restorative">Restorative</option>
                            </select>
                          </label>
                        </motion.div>
                      )}
                  </AnimatePresence>

                  <label className="block">
                    <span className="text-xs font-medium text-[#4A554E] dark:text-[#B8C2BA]">
                      Quick note (optional)
                    </span>
                    <input
                      type="text"
                      value={actualNotes}
                      onChange={(e) => setActualNotes(e.target.value)}
                      placeholder="How did your energy or breathing feel?"
                      className="mt-1 w-full min-h-[44px] rounded-xl bg-white dark:bg-[#1D2420] border border-[#DDE5DF] dark:border-[#262E29] px-3.5 text-xs"
                    />
                  </label>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setLoggingPlan(null)}
                      className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-medium text-[#4A554E] dark:text-[#B8C2BA]"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleRecordActualActivity}
                      className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#006B58] text-white text-xs font-semibold flex items-center gap-2 shadow-xs"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save Activity</span>
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Onboarding Modal */}
        {showOnboarding && (
          <OnboardingModal
            initialProfile={profile}
            onComplete={(updated, feeling, mins) => {
              handleSaveProfile(updated);
              setFeelingToday(feeling);
              setDurationMinutes(mins);
              setShowOnboarding(false);
            }}
            onClose={() => setShowOnboarding(false)}
          />
        )}
      </div>
    </LayoutGroup>
  );
}
