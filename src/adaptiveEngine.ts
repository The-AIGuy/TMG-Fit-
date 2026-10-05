import {
  AdaptivePlanOption,
  DurationOption,
  ExerciseItem,
  FeelingState,
  UserProfileData,
  WeatherContext,
  ActivityLogItem,
  FoodLogItem,
  MedicationReminderItem,
  CalendarEventItem,
} from './types';

export const GENERATED_IMAGES = {
  heroWalk: '/src/assets/images/hero_morning_park_walk_1791166459972.jpg',
  indoorMobility: '/src/assets/images/indoor_gentle_mobility_1791166470847.jpg',
  nourishingMeal: '/src/assets/images/balanced_nourishing_meal_1791166480798.jpg',
  alexAvatar: '/src/assets/images/avatar_alex_profile_1791166491012.jpg',
};

export const DEMO_ALEX_PROFILE: UserProfileData = {
  uid: 'demo_alex_uid',
  name: 'Alex',
  age: 34,
  preferredUnits: 'metric',
  locationArea: 'Wellington, New Zealand',
  timezone: 'Pacific/Auckland',
  goals: [
    'Move more',
    'Improve stamina',
    'Improve mobility',
    'Get outside more',
    'Establish a routine',
  ],
  healthConsiderations: ['Asthma', 'Sometimes low energy'],
  equipment: ['Resistance bands', 'Yoga mat', 'Chair'],
  favouriteActivities: ['Walking', 'Mobility & stretching', 'Swimming', 'Badminton'],
  dislikedActivities: ['Running', 'Burpees', 'High-impact jumping'],
  indoorOutdoorPreference: 'outdoor',
  musicPreference: 'Chill Indie & Acoustic',
  preferredDuration: 20,
  socialPreference: 'flexible',
  learnedPreferences: [
    'Prefers walking to running',
    'Usually active around 5:15 PM after work',
    'Dislikes high-impact jumping movements',
    'Has resistance bands and a yoga mat at home',
    'Appreciates breath-paced warmups for asthma comfort',
  ],
  allergies: ['Peanuts'],
  foodBudget: 'moderate',
  householdSize: 3,
  subscriptionTier: 'pro',
  onboardingCompleted: true,
};

export const DEMO_ACTIVITY_LOGS: ActivityLogItem[] = [
  {
    id: 'log_1',
    uid: 'demo_alex_uid',
    title: 'Botanic Garden Loop Walk',
    category: 'walk',
    plannedDuration: 20,
    actualDuration: 22,
    outcome: 'completed_as_planned',
    effort: 'gentle',
    notes: 'Felt good once I got outside. Fresh breeze, no breathlessness.',
    dateKey: '2026-10-03',
  },
  {
    id: 'log_2',
    uid: 'demo_alex_uid',
    title: 'Evening Shoulder & Spine Unwind',
    category: 'mobility',
    plannedDuration: 15,
    actualDuration: 10,
    outcome: 'did_less',
    effort: 'restorative',
    notes: 'Only had 10 minutes before cooking dinner, still loosened up my neck.',
    dateKey: '2026-10-02',
  },
  {
    id: 'log_3',
    uid: 'demo_alex_uid',
    title: 'Intentional Rest & Recovery Day',
    category: 'recovery',
    plannedDuration: 0,
    actualDuration: 0,
    outcome: 'rested_instead',
    effort: 'restorative',
    notes: 'Slept poorly the night before. Took a guilt-free rest evening.',
    dateKey: '2026-10-01',
  },
  {
    id: 'log_4',
    uid: 'demo_alex_uid',
    title: 'Walking to local grocer + gardening',
    category: 'everyday',
    plannedDuration: 25,
    actualDuration: 30,
    outcome: 'completed_as_planned',
    effort: 'gentle',
    notes: 'Repotted herbs and walked with shopping bags.',
    dateKey: '2026-09-30',
  },
  {
    id: 'log_5',
    uid: 'demo_alex_uid',
    title: 'Resistance Band Living Room Strength',
    category: 'workout',
    plannedDuration: 20,
    actualDuration: 20,
    outcome: 'completed_as_planned',
    effort: 'moderate',
    notes: 'Seated band rows felt great on posture.',
    dateKey: '2026-09-28',
  },
];

export const DEMO_FOOD_LOGS: FoodLogItem[] = [
  {
    id: 'food_1',
    uid: 'demo_alex_uid',
    mealType: 'breakfast',
    description: 'Two poached eggs on sourdough toast with sliced apple and black coffee',
    items: ['2 poached eggs', '2 slices sourdough toast', '1 crisp apple'],
    notes: 'Steady morning energy, quick 8-minute prep.',
    dateKey: '2026-10-04',
  },
  {
    id: 'food_2',
    uid: 'demo_alex_uid',
    mealType: 'lunch',
    description: 'Warm roast kumara, chickpea, and spinach grain bowl with tahini drizzle',
    items: ['Roast kumara', 'Chickpeas', 'Baby spinach', 'Brown rice', 'Lemon tahini'],
    notes: 'Leftovers from last night—budget-friendly and filling.',
    dateKey: '2026-10-04',
  },
];

export const DEMO_MEDICATIONS: MedicationReminderItem[] = [
  {
    id: 'med_1',
    uid: 'demo_alex_uid',
    medicationName: 'Preventer Inhaler (User-entered reminder)',
    reminderTime: '08:00',
    scheduleLabel: 'Morning routine',
    notes: 'Keep spacer in gym bag for outdoor walks',
    takenToday: true,
  },
  {
    id: 'med_2',
    uid: 'demo_alex_uid',
    medicationName: 'Evening Preventer Reminder',
    reminderTime: '20:30',
    scheduleLabel: 'Before bed',
    notes: 'Personal reminder only — consult pharmacist/GP for any clinical questions',
    takenToday: false,
  },
];

export const DEMO_CALENDAR_EVENTS: CalendarEventItem[] = [
  {
    id: 'cal_1',
    uid: 'demo_alex_uid',
    title: 'School Pick-up & Afternoon Errands',
    dateKey: '2026-10-04',
    startTime: '15:15',
    durationMinutes: 60,
    eventType: 'busy_block',
  },
  {
    id: 'cal_2',
    uid: 'demo_alex_uid',
    title: '20-min Gap Before Dinner Prep (Adaptive Window)',
    dateKey: '2026-10-04',
    startTime: '17:15',
    durationMinutes: 20,
    eventType: 'walk',
  },
  {
    id: 'cal_3',
    uid: 'demo_alex_uid',
    title: 'Weekend Family Park Walk & Playground',
    dateKey: '2026-10-05',
    startTime: '10:30',
    durationMinutes: 45,
    eventType: 'family',
  },
];

export const FEELING_OPTIONS: {
  label: FeelingState;
  tone: string;
  supportMessage: string;
}[] = [
  {
    label: 'Great',
    tone: 'Energised',
    supportMessage: "Lovely to hear. Let's channel that into something enjoyable without overdoing it.",
  },
  {
    label: 'Good',
    tone: 'Steady',
    supportMessage: "A solid baseline. We've lined up a balanced session that fits your window.",
  },
  {
    label: 'Okay',
    tone: 'Neutral',
    supportMessage: "Totally normal. Let's keep friction low and focus on feeling better afterwards.",
  },
  {
    label: 'Tired',
    tone: 'Low battery',
    supportMessage: "You said you're feeling tired. We've dialled back intensity to gentle movement or rest.",
  },
  {
    label: 'Low energy',
    tone: 'Gentle pace',
    supportMessage: 'Low energy days count just as much. Even 5–10 minutes of easy motion is a win.',
  },
  {
    label: 'Getting puffed easily',
    tone: 'Breath-aware',
    supportMessage: "We've prioritised nasal-breathing pace, longer rests, and indoor/flat options.",
  },
  {
    label: 'Not feeling well',
    tone: 'Rest first',
    supportMessage: 'Rest is part of training. Your primary recommendation today is recovery and hydration.',
  },
  {
    label: 'Mentally struggling',
    tone: 'Kind & zero-pressure',
    supportMessage: 'Zero pressure today. A quiet change of scenery or complete rest are both great choices.',
  },
  {
    label: 'Ready to do stuff',
    tone: 'Action-ready',
    supportMessage: "Great momentum! Here is a rewarding session tailored to your equipment and goals.",
  },
  {
    label: "I don't want to exercise today",
    tone: 'Permission to rest',
    supportMessage: "That's completely okay. You don't need to force a workout—let's log a guilt-free rest day or count everyday movement.",
  },
];

export const REAL_LIFE_BARRIERS: {
  id: string;
  label: string;
  adaptationNote: string;
}[] = [
  {
    id: 'no_time',
    label: 'I have no time',
    adaptationNote: 'Shrunk session to a 5-minute micro-snack you can do right where you are.',
  },
  {
    id: 'exhausted',
    label: "I'm exhausted",
    adaptationNote: 'Switched to restorative floor/chair decompression and permission to rest.',
  },
  {
    id: 'bad_weather',
    label: 'Bad weather',
    adaptationNote: 'Moved all outdoor routes to quiet, zero-clutter indoor options.',
  },
  {
    id: 'kids_home',
    label: 'Kids are home',
    adaptationNote: 'Switched to Family Mode activities that include children or pause easily.',
  },
  {
    id: 'cant_travel',
    label: "I can't travel",
    adaptationNote: 'Filtered strictly to at-home, zero-commute movement.',
  },
  {
    id: 'no_equipment',
    label: 'I have no equipment',
    adaptationNote: 'Substituted all band/dumbbell movements with bodyweight or chair alternatives.',
  },
  {
    id: 'low_budget',
    label: 'I have a low budget',
    adaptationNote: 'Prioritised 100% free public spaces, home movement, and low-cost pantry meals.',
  },
  {
    id: 'getting_puffed',
    label: "I'm getting puffed",
    adaptationNote: 'Removed brisk cardio intervals; added seated/supported pacing and extended rest.',
  },
  {
    id: 'something_hurts',
    label: 'Something hurts',
    adaptationNote: 'Switched to gentle pain-free range-of-motion and rest. Please stop if sharp pain occurs.',
  },
  {
    id: 'schedule_changed',
    label: 'My schedule changed',
    adaptationNote: 'Recalculated around your 15-minute gap before dinner with zero setup time.',
  },
];

export function buildAdaptivePlans(
  profile: UserProfileData,
  feeling: FeelingState,
  duration: DurationOption,
  activeBarriers: string[],
  weather: WeatherContext
): AdaptivePlanOption[] {
  const hasBands =
    profile.equipment.includes('Resistance bands') &&
    !activeBarriers.includes('no_equipment');
  const hasChair = profile.equipment.includes('Chair') || true;
  const isOutdoorBlocked =
    activeBarriers.includes('bad_weather') ||
    activeBarriers.includes('cant_travel') ||
    !weather.isOutdoorFriendly ||
    profile.indoorOutdoorPreference === 'indoor';
  const isLowEnergyOrUnwell =
    feeling === 'Tired' ||
    feeling === 'Low energy' ||
    feeling === 'Not feeling well' ||
    feeling === "I don't want to exercise today" ||
    activeBarriers.includes('exhausted');
  const isPuffedOrAsthma =
    feeling === 'Getting puffed easily' ||
    activeBarriers.includes('getting_puffed') ||
    profile.healthConsiderations.includes('Asthma') ||
    profile.healthConsiderations.includes('COPD');
  const kidsHome = activeBarriers.includes('kids_home');
  const effectiveDuration: DurationOption = activeBarriers.includes('no_time')
    ? 5
    : duration;

  // Build explainable reasons
  const whyPlanA: string[] = [
    `You selected "${feeling}" today`,
    `Tailored to your ${effectiveDuration}-minute window`,
  ];

  if (profile.dislikedActivities.includes('Running')) {
    whyPlanA.push('You prefer walking and steady movement over running');
  }
  if (isOutdoorBlocked) {
    whyPlanA.push(
      weather.isOutdoorFriendly
        ? 'Adapted for at-home indoor convenience'
        : `Weather is "${weather.condition}", so we shifted indoors`
    );
  } else {
    whyPlanA.push(`Weather (${weather.condition}, ${weather.tempC}°C) is suitable for going outside`);
  }
  if (isPuffedOrAsthma) {
    whyPlanA.push('Includes breath-friendly pacing with unhurried recovery between sets');
  }
  if (kidsHome) {
    whyPlanA.push('Designed so kids can join in or you can pause anytime');
  }

  // Exercises library with equipment awareness & safe substitutions
  const exercisesPlanA: ExerciseItem[] = [
    {
      id: 'ex_1',
      name: isPuffedOrAsthma
        ? 'Unhurried Nasal-Pace Warmup Walk or March'
        : 'Easy Rhythm Warmup Walk',
      durationOrReps: `${Math.max(3, Math.round(effectiveDuration * 0.25))} mins`,
      equipmentNeeded: 'Nothing',
      cue: 'Keep shoulders dropped away from your ears. You should be able to speak in full sentences comfortably.',
      musclesAndBenefit: 'Gently warms up ankles, hips, and cardiorespiratory rhythm without spiking heart rate.',
      quietOption: true,
      indoorFriendly: true,
      respiratoryFriendly: true,
      jointFriendly: true,
      alternatives: [
        {
          reasonLabel: 'Need an indoor option',
          name: 'Seated or Standing Gentle Weight Shifts',
          equipmentNeeded: 'Nothing',
          durationOrReps: '3 mins',
          cue: 'Sway softly side to side while taking slow breaths.',
        },
        {
          reasonLabel: 'Getting puffed',
          name: 'Seated Box Breathing & Ankle Circles',
          equipmentNeeded: 'Chair',
          durationOrReps: '3 mins',
          cue: 'Inhale 4s, exhale 4s while rotating ankles.',
        },
      ],
    },
    {
      id: 'ex_2',
      name: hasBands
        ? 'Resistance-Band Posture Row'
        : 'Supported Wall or Chair Scapular Retractions',
      durationOrReps: '2 sets of 10 smooth reps',
      equipmentNeeded: hasBands ? 'Resistance bands' : 'Nothing (Bodyweight)',
      cue: hasBands
        ? 'Loop band around a sturdy post or your feet while seated. Draw elbows back gently and pause for 1 second.'
        : 'Stand or sit tall, gently squeeze shoulder blades together as if holding a pencil between them.',
      musclesAndBenefit: 'Upper back, rear shoulders, and postural support for desk or family life.',
      quietOption: true,
      indoorFriendly: true,
      respiratoryFriendly: true,
      jointFriendly: true,
      alternatives: [
        {
          reasonLabel: 'No equipment',
          name: 'Prone or Standing W-Arm Lifts',
          equipmentNeeded: 'Nothing',
          durationOrReps: '2 sets of 10 reps',
          cue: 'Form a W shape with arms and gently draw elbows back.',
        },
        {
          reasonLabel: 'Too difficult',
          name: 'Seated Shoulder Rolls & Chest Opener',
          equipmentNeeded: 'Chair',
          durationOrReps: '8 slow breaths',
          cue: 'Roll shoulders back and open palms forward.',
        },
      ],
    },
    {
      id: 'ex_3',
      name: hasChair ? 'Supported Sit-to-Stand (Chair Squat)' : 'Controlled Bodyweight Box Squat',
      durationOrReps: '2 sets of 8–10 reps at your own pace',
      equipmentNeeded: hasChair ? 'Chair' : 'Nothing',
      cue: 'Press through your whole foot to stand tall, then lower back down to the chair with control.',
      musclesAndBenefit: 'Builds practical leg and hip strength for stairs, hills, and carrying groceries.',
      quietOption: true,
      indoorFriendly: true,
      respiratoryFriendly: true,
      jointFriendly: true,
      alternatives: [
        {
          reasonLabel: "Don't like squats / Knee comfort",
          name: 'Supported Glute Bridges on Mat or Bed',
          equipmentNeeded: 'Yoga mat',
          durationOrReps: '2 sets of 10 reps',
          cue: 'Lie on your back with knees bent, gently lift hips without arching your lower back.',
        },
        {
          reasonLabel: 'Too easy',
          name: '3-Second Slow Eccentric Chair Squat',
          equipmentNeeded: 'Chair',
          durationOrReps: '2 sets of 10 reps',
          cue: 'Take 3 full seconds to lower down, tapping the seat lightly before standing.',
        },
      ],
    },
    {
      id: 'ex_4',
      name: 'Thoracic Open-Book & Calf Decompression',
      durationOrReps: `${Math.max(2, Math.round(effectiveDuration * 0.25))} mins`,
      equipmentNeeded: 'Nothing',
      cue: 'Move slowly with your exhale. Never force a stretch into discomfort.',
      musclesAndBenefit: 'Releases chest tightness, eases lower back tension, and settles the nervous system.',
      quietOption: true,
      indoorFriendly: true,
      respiratoryFriendly: true,
      jointFriendly: true,
      alternatives: [
        {
          reasonLabel: 'Can’t get on floor',
          name: 'Seated Chair Twist & Neck Release',
          equipmentNeeded: 'Chair',
          durationOrReps: '3 mins',
          cue: 'Hold the side of your chair and rotate your ribcage gently.',
        },
      ],
    },
  ];

  const planA: AdaptivePlanOption = isLowEnergyOrUnwell
    ? {
        tier: 'Plan A',
        badgeText: 'Recommended for today',
        title:
          feeling === 'Not feeling well' || feeling === "I don't want to exercise today"
            ? 'Guilt-Free Rest & Gentle Breathing'
            : `${effectiveDuration}-Minute Easy Pace Walk & Unwind`,
        subtitle:
          feeling === 'Not feeling well' || feeling === "I don't want to exercise today"
            ? 'Rest is an active part of sustainable fitness. Zero targets to hit today.'
            : isOutdoorBlocked
              ? 'Calm indoor mobility & posture reset tailored to low energy'
              : 'Flat, unhurried fresh-air walk with zero pace pressure',
        durationMinutes:
          feeling === 'Not feeling well' || feeling === "I don't want to exercise today"
            ? 5
            : effectiveDuration,
        category:
          feeling === 'Not feeling well' || feeling === "I don't want to exercise today"
            ? 'recovery'
            : isOutdoorBlocked
              ? 'mobility'
              : 'walk',
        environment: isOutdoorBlocked ? 'Indoor' : 'Outdoor',
        effort: 'gentle',
        whyReasons: whyPlanA,
        exercises: exercisesPlanA.slice(0, 3),
        playlistSuggestion: {
          mood: 'Calm & Grounding',
          genre: profile.musicPreference || 'Acoustic Ambient',
          bpmNote: '75–90 BPM · No sudden tempo spikes',
        },
      }
    : {
        tier: 'Plan A',
        badgeText: 'Recommended for today',
        title: kidsHome
          ? `${effectiveDuration}-Minute Family Park Explorer & Play`
          : isOutdoorBlocked
            ? `${effectiveDuration}-Minute Band & Bodyweight Flow`
            : `${effectiveDuration}-Minute Outdoor Walk + Band Posture Reset`,
        subtitle: kidsHome
          ? 'Includes backyard/park games and stop-start flexibility with the kids'
          : isOutdoorBlocked
            ? 'Quiet, low-impact strength and mobility using your resistance bands'
            : 'Enjoyable outdoor loop paired with 2 quick upper-back band exercises',
        durationMinutes: effectiveDuration,
        category: kidsHome ? 'family' : isOutdoorBlocked ? 'workout' : 'walk',
        environment: isOutdoorBlocked ? 'Indoor' : 'Outdoor',
        effort: feeling === 'Great' || feeling === 'Ready to do stuff' ? 'moderate' : 'gentle',
        whyReasons: whyPlanA,
        exercises: exercisesPlanA,
        playlistSuggestion: {
          mood: feeling === 'Great' ? 'Upbeat & Warm' : 'Steady Flow',
          genre: profile.musicPreference || 'Chill Indie',
          bpmNote: '100–112 BPM · Comfortable walking cadence',
        },
      };

  const planB: AdaptivePlanOption = {
    tier: 'Plan B',
    badgeText: 'Alternative if plans shift',
    title: `${Math.max(5, Math.min(15, effectiveDuration))}-Minute Indoor Mobility & Chair Strength`,
    subtitle: 'Zero weather dependency, quiet footsteps, and easy to pause anytime',
    durationMinutes: Math.max(5, Math.min(15, effectiveDuration)),
    category: 'mobility',
    environment: 'Indoor',
    effort: 'gentle',
    whyReasons: [
      'Stays 100% indoors in case weather turns or you cannot leave the house',
      'Uses only a chair or yoga mat with zero jumping',
      'Keeps joints mobile when time or energy is tight',
    ],
    exercises: exercisesPlanA.slice(1, 4),
    playlistSuggestion: {
      mood: 'Lo-Fi Focus',
      genre: 'Soft Instrumental',
      bpmNote: '85 BPM · Relaxed indoor rhythm',
    },
  };

  const planC: AdaptivePlanOption = {
    tier: 'Plan C',
    badgeText: 'Low-energy & recovery option',
    title: '5-Minute Decompression or Full Rest Day',
    subtitle: 'Rest is part of training. Log a recovery day without losing consistency.',
    durationMinutes: 5,
    category: 'recovery',
    environment: 'Anywhere',
    effort: 'restorative',
    whyReasons: [
      'Always available when real life is overwhelming or your body needs rest',
      'Protects long-term consistency by treating recovery as valid progress',
      'Zero equipment or changing into workout clothes required',
    ],
    exercises: [
      exercisesPlanA[0],
      exercisesPlanA[3],
    ],
    playlistSuggestion: {
      mood: 'Restorative Stillness',
      genre: 'Ambient Nature & Piano',
      bpmNote: '60 BPM · Nervous system down-regulation',
    },
  };

  return [planA, planB, planC];
}
