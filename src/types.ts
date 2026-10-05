export type FeelingState =
  | 'Great'
  | 'Good'
  | 'Okay'
  | 'Tired'
  | 'Low energy'
  | 'Getting puffed easily'
  | 'Not feeling well'
  | 'Mentally struggling'
  | 'Ready to do stuff'
  | "I don't want to exercise today";

export type DurationOption = 5 | 10 | 20 | 30 | 45 | 60;

export type SubscriptionTier = 'free' | 'pro' | 'pro_plus';

export interface UserProfileData {
  uid: string;
  name: string;
  age?: number;
  preferredUnits: 'metric' | 'imperial';
  locationArea: string;
  timezone: string;
  goals: string[];
  healthConsiderations: string[];
  equipment: string[];
  favouriteActivities: string[];
  dislikedActivities: string[];
  indoorOutdoorPreference: 'indoor' | 'outdoor' | 'both';
  musicPreference: string;
  preferredDuration: DurationOption;
  socialPreference: 'solo' | 'group' | 'family' | 'flexible';
  learnedPreferences: string[];
  allergies: string[];
  foodBudget: 'low' | 'moderate' | 'flexible';
  householdSize: number;
  subscriptionTier: SubscriptionTier;
  onboardingCompleted: boolean;
}

export interface ExerciseItem {
  id: string;
  name: string;
  durationOrReps: string;
  equipmentNeeded: string;
  cue: string;
  musclesAndBenefit: string;
  quietOption: boolean;
  indoorFriendly: boolean;
  respiratoryFriendly: boolean;
  jointFriendly: boolean;
  alternatives: {
    reasonLabel: string;
    name: string;
    equipmentNeeded: string;
    durationOrReps: string;
    cue: string;
  }[];
}

export interface AdaptivePlanOption {
  tier: 'Plan A' | 'Plan B' | 'Plan C';
  badgeText: string;
  title: string;
  subtitle: string;
  durationMinutes: number;
  category: 'workout' | 'walk' | 'mobility' | 'everyday' | 'recovery' | 'family' | 'adventure';
  environment: 'Outdoor' | 'Indoor' | 'Anywhere';
  effort: 'gentle' | 'moderate' | 'steady' | 'restorative';
  whyReasons: string[];
  exercises: ExerciseItem[];
  playlistSuggestion: {
    mood: string;
    genre: string;
    bpmNote: string;
  };
}

export interface ActivityLogItem {
  id: string;
  uid: string;
  title: string;
  category: 'workout' | 'walk' | 'mobility' | 'everyday' | 'recovery' | 'family' | 'adventure';
  plannedDuration: number;
  actualDuration: number;
  outcome:
    | 'completed_as_planned'
    | 'did_less'
    | 'did_more'
    | 'did_different'
    | 'rested_instead'
    | 'couldnt_do_it';
  effort: 'gentle' | 'moderate' | 'steady' | 'restorative';
  notes: string;
  dateKey: string;
}

export interface FoodLogItem {
  id: string;
  uid: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description: string;
  items: string[];
  notes: string;
  dateKey: string;
}

export interface MedicationReminderItem {
  id: string;
  uid: string;
  medicationName: string;
  reminderTime: string;
  scheduleLabel: string;
  notes: string;
  takenToday: boolean;
}

export interface CalendarEventItem {
  id: string;
  uid: string;
  title: string;
  dateKey: string;
  startTime: string;
  durationMinutes: number;
  eventType: 'workout' | 'walk' | 'recovery' | 'family' | 'busy_block';
}

export interface WeatherContext {
  status: 'live_simulated_demo' | 'unavailable';
  condition: 'Clear & Mild' | 'Heavy Rain' | 'Windy & Cool' | 'High Pollen / Humid';
  tempC: number;
  airQualityNote: string;
  isOutdoorFriendly: boolean;
}
