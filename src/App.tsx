/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
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
import {
  Activity,
  Check,
  CloudRain,
  Compass,
  Heart,
  HelpCircle,
  Home,
  LogIn,
  LogOut,
  Moon,
  Music,
  RefreshCw,
  Sliders,
  Sparkles,
  Sun,
  User as UserIcon,
  Utensils,
  Volume2,
} from 'lucide-react';
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
  GENERATED_IMAGES,
  REAL_LIFE_BARRIERS,
} from './adaptiveEngine';
import { OnboardingModal } from './components/OnboardingModal';
import { ExploreAndResearchTab } from './components/ExploreAndResearchTab';
import { FoodAndMealPlannerTab } from './components/FoodAndMealPlannerTab';
import { AICoachTab } from './components/AICoachTab';
import { ProfilePrivacyAndScheduleTab } from './components/ProfilePrivacyAndScheduleTab';

type NavDestination = 'home' | 'activity' | 'explore' | 'food' | 'ai' | 'profile';

export default function App() {
  const [activeNav, setActiveNav] = useState<NavDestination>('home');
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
  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number>(0);
  const [showWhyExplainability, setShowWhyExplainability] =
    useState<boolean>(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  // Weather Context Simulation (with graceful fallback option)
  const [weather, setWeather] = useState<WeatherContext>({
    status: 'live_simulated_demo',
    condition: 'Clear & Mild',
    tempC: 17,
    airQualityNote: 'Good air quality · Low pollen',
    isOutdoorFriendly: true,
  });

  // Exercise Substitution State
  const [exerciseOverrides, setExerciseOverrides] = useState<
    Record<string, { name: string; cue: string; equipmentNeeded: string; durationOrReps: string }>
  >({});
  const [openReplaceForId, setOpenReplaceForId] = useState<string | null>(null);

  // "What did you actually do?" Modal / Sheet State
  const [loggingPlan, setLoggingPlan] = useState<AdaptivePlanOption | null>(
    null
  );
  const [actualOutcome, setActualOutcome] =
    useState<ActivityLogItem['outcome']>('completed_as_planned');
  const [actualMinutes, setActualMinutes] = useState<number>(20);
  const [actualEffort, setActualEffort] =
    useState<ActivityLogItem['effort']>('gentle');
  const [actualNotes, setActualNotes] = useState<string>('');
  const [everydayMovementTitle, setEverydayMovementTitle] = useState<string>('');
  const [everydayMovementMins, setEverydayMovementMins] = useState<number>(15);

  const [heroImgFallback, setHeroImgFallback] = useState(false);
  const [indoorImgFallback, setIndoorImgFallback] = useState(false);
  const [avatarFallback, setAvatarFallback] = useState(false);
  const [ttsPlaying, setTtsPlaying] = useState(false);

  // Sync Dark Mode class on documentElement
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

  const activePlan = adaptivePlans[selectedPlanIndex] || adaptivePlans[0];

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

    setActivityLogs((prev) => [entry, ...prev]);
    setLoggingPlan(null);
    setActualNotes('');

    if (firebaseUser) {
      const uid = firebaseUser.uid;
      const logRef = doc(db, `users/${uid}/activityLogs`, newId);
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
          `users/${uid}/activityLogs/${newId}`
        );
      }
    }
  };

  const handleQuickEverydayMovement = (title: string, mins: number) => {
    const newEntry: ActivityLogItem = {
      id: `ev_${Date.now()}`,
      uid: firebaseUser?.uid || profile.uid,
      title: title.slice(0, 150),
      category: 'everyday',
      plannedDuration: mins,
      actualDuration: mins,
      outcome: 'completed_as_planned',
      effort: 'gentle',
      notes: 'Everyday real-life movement counts towards sustainable wellbeing.',
      dateKey: new Date().toISOString().slice(0, 10),
    };
    setActivityLogs((prev) => [newEntry, ...prev]);
    setEverydayMovementTitle('');
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
    setOpenReplaceForId(null);

    // Also add to learned preferences if they disliked it
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
    <div
      className={`min-h-screen transition-colors ${
        darkMode
          ? 'bg-[#111512] text-[#E1E3DF]'
          : 'bg-[#F7FBF7] text-[#191D1A]'
      } ${highContrastText ? 'text-[17px]' : ''}`}
    >
      {/* Top Bar Contract: Strictly 1 row, 3 zones (Brand wordmark | 5 Nav Links | 2 Actions) */}
      <header className="sticky top-0 z-30 h-16 px-4 md:px-8 bg-[#F7FBF7]/90 dark:bg-[#111512]/90 backdrop-blur-md border-b border-[#DDE5DF] dark:border-[#2B322E] flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveNav('home');
          }}
          className="text-xl font-bold tracking-tight text-[#006B58] dark:text-[#58DBC2] whitespace-nowrap"
        >
          Google Fit Adapt
        </a>

        {/* Zone 2: 5 single-line text nav links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#3F4944] dark:text-[#C0C9C2]"
        >
          {(
            [
              { id: 'home', label: 'Today' },
              { id: 'activity', label: 'Activity' },
              { id: 'explore', label: 'Explore' },
              { id: 'food', label: 'Nourish' },
              { id: 'ai', label: 'AI Coach' },
              { id: 'profile', label: 'Privacy' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveNav(item.id)}
              className={`min-h-[40px] py-1 transition-colors whitespace-nowrap border-b-2 ${
                activeNav === item.id
                  ? 'border-[#006B58] dark:border-[#58DBC2] text-[#191D1A] dark:text-[#E1E3DF] font-semibold'
                  : 'border-transparent hover:text-[#191D1A] dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 2 Primary Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle colour theme"
            className="min-h-[40px] min-w-[40px] rounded-xl bg-[#EEF5EF] dark:bg-[#1B211D] flex items-center justify-center text-[#191D1A] dark:text-[#E1E3DF]"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-[#58DBC2]" />
            ) : (
              <Moon className="w-4 h-4 text-[#006B58]" />
            )}
          </button>

          {firebaseUser ? (
            <button
              type="button"
              onClick={() => signOut(auth)}
              className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold bg-[#EEF5EF] dark:bg-[#1B211D] text-[#191D1A] dark:text-[#E1E3DF] flex items-center gap-1.5 whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowOnboarding(true)}
              className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold bg-[#006B58] text-white hover:bg-[#005344] transition-colors whitespace-nowrap"
            >
              Personalise Plan
            </button>
          )}
        </div>
      </header>

      {/* Main Content Container (1440px desktop baseline, generous breathing room) */}
      <main className="max-w-[1280px] mx-auto px-4 md:px-8 pt-6 pb-28 md:pb-16 space-y-10">
        {/* Subtle Demo / Auth & Accessibility Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-2.5 px-4 rounded-2xl bg-[#EEF5EF] dark:bg-[#1B211D] text-xs text-[#3F4944] dark:text-[#C0C9C2]">
          <div className="flex items-center gap-3">
            {!avatarFallback ? (
              <img
                src={GENERATED_IMAGES.alexAvatar}
                alt={`${profile.name} profile avatar`}
                referrerPolicy="no-referrer"
                onError={() => setAvatarFallback(true)}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <UserIcon className="w-4 h-4 text-[#006B58]" />
            )}
            <span>
              {firebaseUser
                ? `Signed in as ${firebaseUser.email} · Private Cloud Sync Active`
                : `Exploring Interactive Demo Mode as ${profile.name} (${profile.locationArea}) · Prefers walking · Has resistance bands`}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setHighContrastText(!highContrastText)}
              className="hover:underline font-medium whitespace-nowrap"
            >
              {highContrastText ? 'Standard Text Size' : 'Large Accessible Text'}
            </button>
            {!firebaseUser && (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="inline-flex items-center gap-1.5 font-semibold text-[#006B58] dark:text-[#58DBC2] hover:underline whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign in with Google to save privately
              </button>
            )}
          </div>
        </div>

        {/* ===================== TAB 1: DAILY HOME SCREEN ===================== */}
        {activeNav === 'home' && (
          <div className="space-y-10">
            {/* Hero Daily Check-in + Weather Context */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[#006B58] dark:text-[#58DBC2]">
                    No perfect days required · Rest is part of training
                  </p>
                  <h1 className="text-3xl md:text-4xl font-normal text-[#191D1A] dark:text-[#E1E3DF]">
                    Hey {profile.name}! How are you feeling today?
                  </h1>
                  <p className="text-sm text-[#3F4944] dark:text-[#C0C9C2]">
                    {currentFeelingObj.supportMessage}
                  </p>
                </div>

                {/* Daily Capability Check-In Buttons */}
                <div
                  role="group"
                  aria-label="How are you feeling today?"
                  className="flex flex-wrap gap-2"
                >
                  {FEELING_OPTIONS.map((f) => {
                    const selected = feelingToday === f.label;
                    return (
                      <button
                        key={f.label}
                        type="button"
                        onClick={() => setFeelingToday(f.label)}
                        className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs font-medium transition-colors whitespace-nowrap ${
                          selected
                            ? 'bg-[#006B58] text-white font-semibold shadow-sm'
                            : 'bg-[#EEF5EF] dark:bg-[#1B211D] text-[#191D1A] dark:text-[#E1E3DF] hover:bg-[#BCECE0] hover:text-[#00201A]'
                        }`}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>

                {/* Duration Mode Selector + Weather Simulator */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-[#EEF5EF] dark:bg-[#1B211D]">
                    <span className="text-xs font-medium text-[#3F4944] dark:text-[#C0C9C2] block mb-2">
                      Time Available Right Now
                    </span>
                    <div className="grid grid-cols-6 gap-1.5">
                      {([5, 10, 20, 30, 45, 60] as DurationOption[]).map(
                        (mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setDurationMinutes(mins)}
                            className={`min-h-[40px] rounded-xl text-xs font-semibold tabular-nums transition-colors whitespace-nowrap ${
                              durationMinutes === mins
                                ? 'bg-[#006B58] text-white'
                                : 'bg-[#F7FBF7] dark:bg-[#111512] text-[#3F4944] dark:text-[#C0C9C2]'
                            }`}
                          >
                            {mins === 60 ? '60+' : `${mins}m`}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#EEF5EF] dark:bg-[#1B211D] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-[#3F4944] dark:text-[#C0C9C2]">
                      <span className="flex items-center gap-1.5 font-medium">
                        <CloudRain className="w-3.5 h-3.5 text-[#006B58]" />
                        Weather & Air Quality Adaptation
                      </span>
                      <span className="tabular-nums">{weather.tempC}°C</span>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      {(
                        [
                          {
                            label: 'Clear 17°C',
                            cond: 'Clear & Mild' as const,
                            outdoor: true,
                            temp: 17,
                          },
                          {
                            label: 'Heavy Rain',
                            cond: 'Heavy Rain' as const,
                            outdoor: false,
                            temp: 12,
                          },
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
                            setWeather({
                              status: 'live_simulated_demo',
                              condition: w.cond,
                              tempC: w.temp,
                              airQualityNote: w.outdoor
                                ? 'Good air quality'
                                : 'Indoor option prioritised for respiratory comfort',
                              isOutdoorFriendly: w.outdoor,
                            })
                          }
                          className={`min-h-[40px] px-2 rounded-xl text-[11px] font-medium transition-colors whitespace-nowrap ${
                            weather.condition === w.cond
                              ? 'bg-[#006B58] text-white font-semibold'
                              : 'bg-[#F7FBF7] dark:bg-[#111512] text-[#3F4944] dark:text-[#C0C9C2]'
                          }`}
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Anchor Card with Scrim & Voice Readout */}
              <div className="lg:col-span-5">
                <div className="relative rounded-3xl overflow-hidden aspect-16/9 lg:aspect-4/3 bg-[#EEF5EF] dark:bg-[#1B211D] border border-[#DDE5DF] dark:border-[#2B322E]">
                  {activePlan.environment === 'Indoor' ? (
                    !indoorImgFallback ? (
                      <img
                        src={GENERATED_IMAGES.indoorMobility}
                        alt="Calm sunlit living room with yoga mat and resistance bands"
                        referrerPolicy="no-referrer"
                        onError={() => setIndoorImgFallback(true)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Activity className="w-10 h-10 text-[#006B58]" />
                      </div>
                    )
                  ) : !heroImgFallback ? (
                    <img
                      src={GENERATED_IMAGES.heroWalk}
                      alt="Sunlit botanical park walking trail in gentle morning light"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgFallback(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Compass className="w-10 h-10 text-[#006B58]" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-6 flex flex-col justify-end text-white">
                    <p className="text-xs font-medium text-[#BCECE0]">
                      {activePlan.tier} · {activePlan.environment} ·{' '}
                      {activePlan.durationMinutes} mins · {activePlan.effort}{' '}
                      effort
                    </p>
                    <h2 className="text-2xl font-normal mt-1">
                      {activePlan.title}
                    </h2>
                    <p className="text-xs text-white/85 mt-1">
                      {activePlan.subtitle}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setLoggingPlan(activePlan);
                          setActualMinutes(activePlan.durationMinutes);
                          setActualEffort(activePlan.effort);
                          setActualOutcome(
                            activePlan.category === 'recovery'
                              ? 'rested_instead'
                              : 'completed_as_planned'
                          );
                        }}
                        className="min-h-[44px] px-5 py-2 rounded-xl bg-[#BCECE0] text-[#00201A] text-xs font-semibold hover:bg-white transition-colors whitespace-nowrap"
                      >
                        What Did You Actually Do?
                      </button>
                      <button
                        type="button"
                        onClick={speakDailySummary}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/15 backdrop-blur-md text-white text-xs font-medium flex items-center gap-1.5 hover:bg-white/25 transition-colors whitespace-nowrap"
                      >
                        <Volume2
                          className={`w-4 h-4 ${ttsPlaying ? 'animate-pulse' : ''}`}
                        />
                        Voice Readout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* REAL LIFE MODE BARRIERS */}
            <section className="rounded-3xl bg-[#EEF5EF] dark:bg-[#1B211D] p-6 border border-[#DDE5DF] dark:border-[#2B322E] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-normal text-[#191D1A] dark:text-[#E1E3DF] flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#006B58]" />
                    Real Life Mode — What's getting in the way today?
                  </h2>
                  <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2] mt-0.5">
                    Tap any real-life constraint. Your Plan A, Plan B, and Plan
                    C will immediately adapt without penalty.
                  </p>
                </div>
                {activeBarriers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveBarriers([])}
                    className="min-h-[36px] px-3 rounded-xl text-xs font-medium text-[#006B58] dark:text-[#58DBC2] hover:underline whitespace-nowrap"
                  >
                    Clear {activeBarriers.length} active constraint(s)
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {REAL_LIFE_BARRIERS.map((b) => {
                  const isSelected = activeBarriers.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => toggleBarrier(b.id)}
                      className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                        isSelected
                          ? 'bg-[#D3E4FF] text-[#001C38] font-semibold'
                          : 'bg-[#F7FBF7] dark:bg-[#111512] text-[#3F4944] dark:text-[#C0C9C2] hover:text-[#191D1A]'
                      }`}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>

              {activeBarriers.length > 0 && (
                <div className="pt-2 space-y-1 text-xs text-[#006B58] dark:text-[#58DBC2]">
                  {REAL_LIFE_BARRIERS.filter((b) =>
                    activeBarriers.includes(b.id)
                  ).map((b) => (
                    <p key={b.id}>
                      • <strong>{b.label}:</strong> {b.adaptationNote}
                    </p>
                  ))}
                </div>
              )}
            </section>

            {/* PLAN A, PLAN B, PLAN C SELECTOR + EXPLAINABILITY */}
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-normal text-[#191D1A] dark:text-[#E1E3DF]">
                    Your Adaptive Options Today (Plan A, Plan B & Plan C)
                  </h2>
                  <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2] mt-0.5">
                    Every day includes a primary recommendation, an indoor/backup
                    alternative, and a restorative low-energy option.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowWhyExplainability(!showWhyExplainability)
                  }
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#EEF5EF] dark:bg-[#1B211D] text-xs font-medium text-[#006B58] dark:text-[#58DBC2] flex items-center gap-1.5 whitespace-nowrap"
                >
                  <HelpCircle className="w-4 h-4" />
                  {showWhyExplainability
                    ? 'Hide “Why am I seeing this?”'
                    : 'Why am I seeing this?'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {adaptivePlans.map((plan, idx) => {
                  const selected = selectedPlanIndex === idx;
                  return (
                    <div
                      key={plan.tier}
                      onClick={() => setSelectedPlanIndex(idx)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setSelectedPlanIndex(idx);
                        }
                      }}
                      className={`p-6 rounded-3xl border text-left transition-colors cursor-pointer flex flex-col justify-between gap-4 ${
                        selected
                          ? 'bg-[#EEF5EF] dark:bg-[#1B211D] border-[#006B58] dark:border-[#58DBC2]'
                          : 'bg-[#F7FBF7] dark:bg-[#111512] border-[#DDE5DF] dark:border-[#2B322E] hover:border-[#006B58]/50'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs text-[#3F4944] dark:text-[#C0C9C2]">
                          <span className="font-semibold text-[#006B58] dark:text-[#58DBC2]">
                            {plan.tier} · {plan.badgeText}
                          </span>
                          <span className="tabular-nums">
                            {plan.durationMinutes} min
                          </span>
                        </div>

                        <h3 className="text-xl font-normal text-[#191D1A] dark:text-[#E1E3DF]">
                          {plan.title}
                        </h3>
                        <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2] leading-relaxed">
                          {plan.subtitle}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#DDE5DF] dark:border-[#2B322E] flex items-center justify-between text-xs text-[#3F4944] dark:text-[#C0C9C2]">
                        <span>
                          {plan.environment} · {plan.effort} effort
                        </span>
                        <span className="font-semibold text-[#006B58] dark:text-[#58DBC2]">
                          {selected ? 'Active Plan' : 'Select Plan'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Explainability Panel: "Why am I seeing this?" */}
              {showWhyExplainability && (
                <div className="rounded-3xl bg-[#F7FBF7] dark:bg-[#111512] p-6 border border-[#DDE5DF] dark:border-[#2B322E] grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 space-y-3">
                    <h3 className="text-sm font-semibold text-[#191D1A] dark:text-[#E1E3DF] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#006B58]" />
                      Why am I seeing {activePlan.tier} ({activePlan.title})?
                    </h3>
                    <ul className="space-y-1.5 text-xs text-[#3F4944] dark:text-[#C0C9C2]">
                      {activePlan.whyReasons.map((reason) => (
                        <li key={reason}>• {reason}</li>
                      ))}
                    </ul>
                    <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2] pt-1">
                      You can change any of these factors above or in your
                      learned preferences.
                    </p>
                  </div>

                  {/* Optional Spotify / Music Mood Pacing */}
                  <div className="lg:col-span-5 p-4 rounded-2xl bg-[#EEF5EF] dark:bg-[#1B211D] flex flex-col justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#006B58] dark:text-[#58DBC2]">
                      <Music className="w-4 h-4" />
                      <span>Optional Audio & Cadence Companion</span>
                    </div>
                    <p className="text-sm font-medium text-[#191D1A] dark:text-[#E1E3DF]">
                      {activePlan.playlistSuggestion.mood} ·{' '}
                      {activePlan.playlistSuggestion.genre}
                    </p>
                    <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2]">
                      {activePlan.playlistSuggestion.bpmNote} (Spotify optional
                      — never required)
                    </p>
                  </div>
                </div>
              )}

              {/* Equipment-Aware Exercises & Instant Substitution Engine */}
              <div className="rounded-3xl bg-[#EEF5EF] dark:bg-[#1B211D] p-6 md:p-8 border border-[#DDE5DF] dark:border-[#2B322E] space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-normal text-[#191D1A] dark:text-[#E1E3DF]">
                      Session Movements & Instant Exercise Substitution Engine
                    </h3>
                    <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2] mt-0.5">
                      Matched to your equipment ({profile.equipment.join(', ') || 'None'}).
                      Every movement has a “Replace” button if you don’t like it,
                      lack gear, or want a quieter option.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setLoggingPlan(activePlan);
                      setActualMinutes(activePlan.durationMinutes);
                      setActualEffort(activePlan.effort);
                      setActualOutcome('completed_as_planned');
                    }}
                    className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#006B58] text-white text-xs font-semibold hover:bg-[#005344] transition-colors whitespace-nowrap"
                  >
                    Log Session / What I Actually Did
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activePlan.exercises.map((ex) => {
                    const override = exerciseOverrides[ex.id];
                    const displayName = override ? override.name : ex.name;
                    const displayCue = override ? override.cue : ex.cue;
                    const displayEquip = override
                      ? override.equipmentNeeded
                      : ex.equipmentNeeded;
                    const displayReps = override
                      ? override.durationOrReps
                      : ex.durationOrReps;

                    return (
                      <div
                        key={ex.id}
                        className="p-5 rounded-2xl bg-[#F7FBF7] dark:bg-[#111512] border border-[#DDE5DF] dark:border-[#2B322E] flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="text-sm font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
                                {displayName}
                              </h4>
                              <p className="text-xs text-[#006B58] dark:text-[#58DBC2] mt-0.5 tabular-nums">
                                {displayReps} · Gear: {displayEquip}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setOpenReplaceForId(
                                  openReplaceForId === ex.id ? null : ex.id
                                )
                              }
                              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#EEF5EF] dark:bg-[#1B211D] text-xs font-medium text-[#191D1A] dark:text-[#E1E3DF] hover:bg-[#BCECE0] hover:text-[#00201A] flex items-center gap-1.5 whitespace-nowrap shrink-0"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Replace
                            </button>
                          </div>

                          <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2] leading-relaxed">
                            {displayCue}
                          </p>
                          <p className="text-[11px] text-[#3F4944]/80 dark:text-[#C0C9C2]/80">
                            Why it helps: {ex.musclesAndBenefit}
                          </p>
                        </div>

                        {openReplaceForId === ex.id && (
                          <div className="pt-3 border-t border-[#DDE5DF] dark:border-[#2B322E] space-y-2">
                            <p className="text-xs font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
                              Choose a safe, condition-aware alternative:
                            </p>
                            {ex.alternatives.map((alt) => (
                              <button
                                key={alt.name}
                                type="button"
                                onClick={() =>
                                  handleSubstituteExercise(ex, alt)
                                }
                                className="w-full p-3 rounded-xl bg-[#EEF5EF] dark:bg-[#1B211D] hover:bg-[#BCECE0] hover:text-[#00201A] text-left transition-colors"
                              >
                                <div className="flex items-center justify-between text-xs font-semibold">
                                  <span>{alt.name}</span>
                                  <span className="opacity-75">
                                    {alt.reasonLabel}
                                  </span>
                                </div>
                                <p className="text-[11px] opacity-80 mt-0.5">
                                  {alt.durationOrReps} · Gear:{' '}
                                  {alt.equipmentNeeded}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ===================== TAB 2: ACTIVITY, CONSISTENCY & RECOVERY ===================== */}
        {activeNav === 'activity' && (
          <div className="space-y-8">
            <div className="border-b border-[#DDE5DF] dark:border-[#2B322E] pb-6">
              <p className="text-xs font-medium text-[#006B58] dark:text-[#58DBC2]">
                Consistency Over Toxic Streaks · Rest Days Never Break Your Progress
              </p>
              <h1 className="text-3xl font-normal text-[#191D1A] dark:text-[#E1E3DF] mt-1">
                Sustainable Consistency, Everyday Movement & Recovery
              </h1>
            </div>

            {/* Non-Toxic Consistency Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-[#EEF5EF] dark:bg-[#1B211D] border border-[#DDE5DF] dark:border-[#2B322E]">
                <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2]">
                  Active & Restorative Days (This Month)
                </p>
                <p className="text-3xl font-normal text-[#006B58] dark:text-[#58DBC2] mt-2 tabular-nums">
                  18 days
                </p>
                <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2] mt-1">
                  Includes walks, band sessions, everyday chores & recovery
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-[#EEF5EF] dark:bg-[#1B211D] border border-[#DDE5DF] dark:border-[#2B322E]">
                <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2]">
                  Outdoor Fresh-Air Sessions
                </p>
                <p className="text-3xl font-normal text-[#191D1A] dark:text-[#E1E3DF] mt-2 tabular-nums">
                  9 walks
                </p>
                <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2] mt-1">
                  Aligned with your “Get outside more” goal
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-[#EEF5EF] dark:bg-[#1B211D] border border-[#DDE5DF] dark:border-[#2B322E]">
                <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2]">
                  Strength & Mobility Sessions
                </p>
                <p className="text-3xl font-normal text-[#191D1A] dark:text-[#E1E3DF] mt-2 tabular-nums">
                  6 sessions
                </p>
                <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2] mt-1">
                  Resistance bands & posture unwinding
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-[#EEF5EF] dark:bg-[#1B211D] border border-[#DDE5DF] dark:border-[#2B322E]">
                <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2]">
                  Guilt-Free Recovery Days
                </p>
                <p className="text-3xl font-normal text-[#191D1A] dark:text-[#E1E3DF] mt-2 tabular-nums">
                  {
                    activityLogs.filter((l) => l.category === 'recovery')
                      .length + 2
                  }{' '}
                  days
                </p>
                <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2] mt-1">
                  Protected consistency · Zero streak penalties
                </p>
              </div>
            </div>

            {/* Everyday Movement Recognition + Recovery System */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 rounded-3xl bg-[#F7FBF7] dark:bg-[#111512] p-6 border border-[#DDE5DF] dark:border-[#2B322E] space-y-4">
                <h2 className="text-xl font-normal text-[#191D1A] dark:text-[#E1E3DF]">
                  Count Everyday Movement
                </h2>
                <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2]">
                  Movement exists outside formal gym workouts. Log walking to
                  the shops, gardening, playing with children, or taking stairs.
                </p>

                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Walking to local shops', mins: 20 },
                    { label: 'Gardening & yard work', mins: 30 },
                    { label: 'Playing with children at park', mins: 25 },
                    { label: 'Walking the dog', mins: 20 },
                    { label: 'Active household reset & stairs', mins: 15 },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() =>
                        handleQuickEverydayMovement(item.label, item.mins)
                      }
                      className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-medium bg-[#EEF5EF] dark:bg-[#1B211D] text-[#191D1A] dark:text-[#E1E3DF] hover:bg-[#BCECE0] hover:text-[#00201A] transition-colors whitespace-nowrap"
                    >
                      + {item.label} ({item.mins}m)
                    </button>
                  ))}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    value={everydayMovementTitle}
                    onChange={(e) => setEverydayMovementTitle(e.target.value)}
                    placeholder="Other everyday movement (e.g. Carrying groceries uphill)"
                    className="flex-1 min-h-[44px] rounded-xl bg-[#EEF5EF] dark:bg-[#1B211D] px-4 text-xs text-[#191D1A] dark:text-[#E1E3DF]"
                  />
                  <input
                    type="number"
                    value={everydayMovementMins}
                    onChange={(e) =>
                      setEverydayMovementMins(Number(e.target.value))
                    }
                    className="w-24 min-h-[44px] rounded-xl bg-[#EEF5EF] dark:bg-[#1B211D] px-3 text-xs text-[#191D1A] dark:text-[#E1E3DF] tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!everydayMovementTitle.trim()) return;
                      handleQuickEverydayMovement(
                        everydayMovementTitle.trim(),
                        everydayMovementMins || 15
                      );
                    }}
                    className="min-h-[44px] px-4 rounded-xl bg-[#006B58] text-white text-xs font-semibold whitespace-nowrap"
                  >
                    Count Movement
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 rounded-3xl bg-[#EEF5EF] dark:bg-[#1B211D] p-6 border border-[#DDE5DF] dark:border-[#2B322E] space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#006B58] dark:text-[#58DBC2]">
                    <Heart className="w-4 h-4" />
                    <span>Honest Recovery Context (Estimates Only)</span>
                  </div>
                  <h2 className="text-xl font-normal text-[#191D1A] dark:text-[#E1E3DF]">
                    Need a Recovery Day Today?
                  </h2>
                  <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2] leading-relaxed">
                    We never invent a fake single-number medical “readiness
                    score”. Your self-reported energy ({feelingToday}) and
                    recent sessions guide your pace.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFeelingToday('Tired');
                    setSelectedPlanIndex(2);
                    handleQuickEverydayMovement(
                      'Today is an Intentional Recovery Day',
                      0
                    );
                  }}
                  className="min-h-[44px] w-full rounded-xl bg-[#006B58] text-white text-xs font-semibold hover:bg-[#005344] transition-colors whitespace-nowrap"
                >
                  Mark Today as a Guilt-Free Recovery Day
                </button>
              </div>
            </div>

            {/* Planned vs Actual Activity Journal */}
            <div className="rounded-3xl bg-[#F7FBF7] dark:bg-[#111512] p-6 border border-[#DDE5DF] dark:border-[#2B322E] space-y-4">
              <h2 className="text-xl font-normal text-[#191D1A] dark:text-[#E1E3DF]">
                Workout & Movement Journal (Planned vs. What Actually Happened)
              </h2>
              <div className="divide-y divide-[#DDE5DF] dark:divide-[#2B322E]">
                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs text-[#3F4944] dark:text-[#C0C9C2]">
                        <span className="font-semibold text-[#006B58] dark:text-[#58DBC2] capitalize">
                          {log.category}
                        </span>
                        <span>·</span>
                        <span className="tabular-nums">{log.dateKey}</span>
                        <span>·</span>
                        <span>{log.outcome.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-sm font-semibold text-[#191D1A] dark:text-[#E1E3DF] mt-1">
                        {log.title}
                      </p>
                      {log.notes && (
                        <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2] mt-0.5">
                          “{log.notes}”
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-[#3F4944] dark:text-[#C0C9C2] tabular-nums shrink-0">
                      Planned {log.plannedDuration}m · Actual{' '}
                      <strong className="text-[#191D1A] dark:text-[#E1E3DF]">
                        {log.actualDuration}m
                      </strong>{' '}
                      ({log.effort})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: EXPLORE (MAPS & RESEARCH) ===================== */}
        {activeNav === 'explore' && <ExploreAndResearchTab profile={profile} />}

        {/* ===================== TAB 4: NOURISH (FOOD & MEAL PLANNER) ===================== */}
        {activeNav === 'food' && (
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

        {/* ===================== TAB 5: GEMINI AI COACH ===================== */}
        {activeNav === 'ai' && (
          <AICoachTab
            profile={profile}
            currentFeeling={feelingToday}
            currentDuration={durationMinutes}
            onUpdateProfile={handleSaveProfile}
            onAdaptDuration={(m) => setDurationMinutes(m)}
            onAdaptFeeling={(f) => setFeelingToday(f)}
          />
        )}

        {/* ===================== TAB 6: PRIVACY, SCHEDULE & SUBSCRIPTIONS ===================== */}
        {activeNav === 'profile' && (
          <ProfilePrivacyAndScheduleTab
            profile={profile}
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

      {/* Mobile Fixed Bottom Navigation Bar (44x44px hitboxes, <15% viewport height) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#F7FBF7]/95 dark:bg-[#111512]/95 backdrop-blur-md border-t border-[#DDE5DF] dark:border-[#2B322E] grid grid-cols-6 items-center"
      >
        {(
          [
            { id: 'home', label: 'Today', icon: Home },
            { id: 'activity', label: 'Activity', icon: Activity },
            { id: 'explore', label: 'Explore', icon: Compass },
            { id: 'food', label: 'Nourish', icon: Utensils },
            { id: 'ai', label: 'AI Coach', icon: Sparkles },
            { id: 'profile', label: 'Privacy', icon: UserIcon },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const active = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveNav(item.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center ${
                active
                  ? 'text-[#006B58] dark:text-[#58DBC2] font-semibold'
                  : 'text-[#3F4944] dark:text-[#C0C9C2]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* "What Did You Actually Do?" Modal */}
      {loggingPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-3xl bg-[#F7FBF7] dark:bg-[#111512] p-6 border border-[#DDE5DF] dark:border-[#2B322E] space-y-5 shadow-xl">
            <div>
              <p className="text-xs font-medium text-[#006B58] dark:text-[#58DBC2]">
                Separating Planned Activity from Actual Behaviour
              </p>
              <h2 className="text-2xl font-normal text-[#191D1A] dark:text-[#E1E3DF] mt-1">
                What did you actually do today?
              </h2>
              <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2] mt-1">
                Planned: {loggingPlan.title} ({loggingPlan.durationMinutes}{' '}
                mins). Every honest answer helps the engine adapt better.
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
                  {
                    id: 'did_different',
                    label: 'Did something different',
                  },
                  { id: 'rested_instead', label: 'Rested instead' },
                  { id: 'couldnt_do_it', label: "Couldn't do it today" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setActualOutcome(opt.id)}
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                    actualOutcome === opt.id
                      ? 'bg-[#006B58] text-white font-semibold'
                      : 'bg-[#EEF5EF] dark:bg-[#1B211D] text-[#191D1A] dark:text-[#E1E3DF]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {actualOutcome !== 'rested_instead' &&
              actualOutcome !== 'couldnt_do_it' && (
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs font-medium text-[#3F4944] dark:text-[#C0C9C2]">
                      Actual Minutes
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={240}
                      value={actualMinutes}
                      onChange={(e) => setActualMinutes(Number(e.target.value))}
                      className="mt-1 w-full min-h-[44px] rounded-xl bg-[#EEF5EF] dark:bg-[#1B211D] px-3.5 text-sm tabular-nums"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-[#3F4944] dark:text-[#C0C9C2]">
                      How did the effort feel?
                    </span>
                    <select
                      value={actualEffort}
                      onChange={(e) =>
                        setActualEffort(
                          e.target.value as ActivityLogItem['effort']
                        )
                      }
                      className="mt-1 w-full min-h-[44px] rounded-xl bg-[#EEF5EF] dark:bg-[#1B211D] px-3.5 text-xs font-medium"
                    >
                      <option value="gentle">Gentle & easy</option>
                      <option value="moderate">Moderate & comfortable</option>
                      <option value="steady">Steady work</option>
                      <option value="restorative">Restorative</option>
                    </select>
                  </label>
                </div>
              )}

            <label className="block">
              <span className="text-xs font-medium text-[#3F4944] dark:text-[#C0C9C2]">
                Optional Note (How did your body or breathing feel?)
              </span>
              <input
                type="text"
                value={actualNotes}
                onChange={(e) => setActualNotes(e.target.value)}
                placeholder="e.g. Felt great after getting started, or needed extra rest."
                className="mt-1 w-full min-h-[44px] rounded-xl bg-[#EEF5EF] dark:bg-[#1B211D] px-3.5 text-xs"
              />
            </label>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setLoggingPlan(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-medium text-[#3F4944] dark:text-[#C0C9C2]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRecordActualActivity}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#006B58] text-white text-xs font-semibold flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Save to Activity Journal
              </button>
            </div>
          </div>
        </div>
      )}

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
  );
}
