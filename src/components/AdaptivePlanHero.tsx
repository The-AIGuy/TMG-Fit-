import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  HelpCircle,
  RefreshCw,
  Volume2,
  ChevronDown,
  Music,
} from 'lucide-react';
import { AdaptivePlanOption, ExerciseItem } from '../types';
import { GENERATED_IMAGES } from '../adaptiveEngine';

interface AdaptivePlanHeroProps {
  activePlan: AdaptivePlanOption;
  secondaryPlans: AdaptivePlanOption[];
  onSelectPlanTier: (tier: AdaptivePlanOption['tier']) => void;
  onStartOrLogPlan: (plan: AdaptivePlanOption) => void;
  exerciseOverrides: Record<
    string,
    { name: string; cue: string; equipmentNeeded: string; durationOrReps: string }
  >;
  onSubstituteExercise: (
    ex: ExerciseItem,
    alt: ExerciseItem['alternatives'][0]
  ) => void;
  onSpeakSummary: () => void;
  ttsPlaying: boolean;
}

const SPRING_TRANSITION = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 32,
  mass: 0.8,
};

export const AdaptivePlanHero: React.FC<AdaptivePlanHeroProps> = ({
  activePlan,
  secondaryPlans,
  onSelectPlanTier,
  onStartOrLogPlan,
  exerciseOverrides,
  onSubstituteExercise,
  onSpeakSummary,
  ttsPlaying,
}) => {
  const [showWhy, setShowWhy] = useState(false);
  const [showMovements, setShowMovements] = useState(false);
  const [openReplaceForId, setOpenReplaceForId] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const imageUrl =
    activePlan.environment === 'Indoor'
      ? GENERATED_IMAGES.indoorMobility
      : GENERATED_IMAGES.heroWalk;

  return (
    <div className="space-y-6">
      {/* Primary Hero Card: TODAY'S PLAN (Shared Layout Transition Ready) */}
      <motion.div
        layout
        layoutId={`plan-card-${activePlan.tier}`}
        transition={SPRING_TRANSITION}
        className="rounded-3xl bg-white dark:bg-[#171C19] border border-[#DDE5DF] dark:border-[#262E29] overflow-hidden shadow-xs"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: Core Plan Message & Primary Action */}
          <div className="lg:col-span-7 p-6 md:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <motion.div
                layout="position"
                layoutId={`plan-meta-${activePlan.tier}`}
                className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[#006B58] dark:text-[#58DBC2]"
              >
                <span>TODAY'S PLAN · {activePlan.tier.toUpperCase()}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {activePlan.durationMinutes} MINUTES
                </span>
                <span aria-hidden="true">·</span>
                <span>{activePlan.environment.toUpperCase()}</span>
              </motion.div>

              <motion.h2
                layout="position"
                layoutId={`plan-title-${activePlan.tier}`}
                className="text-2xl md:text-4xl font-normal text-[#191D1A] dark:text-[#E1E3DF] leading-tight"
              >
                {activePlan.title}
              </motion.h2>

              <motion.p
                layout="position"
                layoutId={`plan-subtitle-${activePlan.tier}`}
                className="text-sm md:text-base text-[#4A554E] dark:text-[#B8C2BA] leading-relaxed max-w-xl"
              >
                {activePlan.subtitle}. Built around your energy, available time,
                equipment, and today's conditions.
              </motion.p>
            </div>

            {/* Primary CTA + Progressive Disclosure Triggers */}
            <motion.div layout="position" className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <motion.button
                  layout="position"
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => onStartOrLogPlan(activePlan)}
                  className="min-h-[48px] px-6 py-3 rounded-xl bg-[#006B58] hover:bg-[#005344] text-white text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shadow-xs"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Plan</span>
                </motion.button>

                <button
                  type="button"
                  onClick={() => setShowMovements(!showMovements)}
                  className="min-h-[48px] px-4 py-3 rounded-xl bg-[#EEF4F0] dark:bg-[#212824] hover:bg-[#DCE7DF] dark:hover:bg-[#2B342F] text-xs font-semibold text-[#191D1A] dark:text-[#E1E3DF] flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <span>
                    {showMovements
                      ? 'Hide Movements'
                      : `View ${activePlan.exercises.length} Movements`}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      showMovements ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={onSpeakSummary}
                  aria-label="Listen to plan summary"
                  className="min-h-[48px] px-3.5 py-3 rounded-xl bg-[#EEF4F0] dark:bg-[#212824] text-[#3F4944] dark:text-[#C0C9C2] hover:text-[#191D1A] flex items-center gap-1.5 text-xs font-medium transition-colors whitespace-nowrap"
                >
                  <Volume2
                    className={`w-4 h-4 text-[#006B58] ${
                      ttsPlaying ? 'animate-pulse' : ''
                    }`}
                  />
                  <span className="hidden sm:inline">Listen</span>
                </button>
              </div>

              {/* Quiet "Why this plan?" toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowWhy(!showWhy)}
                  className="min-h-[36px] inline-flex items-center gap-1.5 text-xs font-medium text-[#006B58] dark:text-[#58DBC2] hover:underline"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{showWhy ? 'Hide why this plan' : 'Why this plan?'}</span>
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Calm Visual Context */}
          <div className="lg:col-span-5 relative min-h-[220px] lg:min-h-full bg-[#EEF4F0] dark:bg-[#1B211D]">
            {!imgError ? (
              <img
                src={imageUrl}
                alt={activePlan.title}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-6 flex flex-col justify-end text-white">
              <div className="flex items-center gap-2 text-xs text-white/90">
                <Music className="w-3.5 h-3.5 text-[#BCECE0]" />
                <span>
                  Pacing audio: {activePlan.playlistSuggestion.mood} ·{' '}
                  {activePlan.playlistSuggestion.genre}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Expandable "Why this plan?" Explanation */}
        <AnimatePresence>
          {showWhy && (
            <motion.div
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-[#E2EAE4] dark:border-[#262E29] bg-[#F7FBF7] dark:bg-[#131815]"
            >
              <div className="p-6 space-y-2">
                <p className="text-xs font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
                  Why TMG-Fit selected this for you today:
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#4A554E] dark:text-[#B8C2BA]">
                  {activePlan.whyReasons.map((reason) => (
                    <li key={reason} className="flex items-start gap-2">
                      <span className="text-[#006B58] dark:text-[#58DBC2] font-bold">
                        •
                      </span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expandable Movements & Substitution Drawer */}
        <AnimatePresence>
          {showMovements && (
            <motion.div
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-[#E2EAE4] dark:border-[#262E29] bg-[#F7FBF7] dark:bg-[#131815]"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
                    Movements in this plan (Tap Replace on any exercise to swap)
                  </p>
                </div>

                <div className="divide-y divide-[#E2EAE4] dark:divide-[#262E29]">
                  {activePlan.exercises.map((ex) => {
                    const override = exerciseOverrides[ex.id];
                    const name = override ? override.name : ex.name;
                    const cue = override ? override.cue : ex.cue;
                    const equip = override
                      ? override.equipmentNeeded
                      : ex.equipmentNeeded;
                    const reps = override
                      ? override.durationOrReps
                      : ex.durationOrReps;

                    return (
                      <div key={ex.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
                              {name}
                            </h3>
                            <p className="text-xs text-[#006B58] dark:text-[#58DBC2] tabular-nums">
                              {reps} · {equip}
                            </p>
                            <p className="text-xs text-[#4A554E] dark:text-[#B8C2BA] leading-relaxed max-w-2xl">
                              {cue}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setOpenReplaceForId(
                                openReplaceForId === ex.id ? null : ex.id
                              )
                            }
                            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#EEF4F0] dark:bg-[#1D2420] text-xs font-medium text-[#191D1A] dark:text-[#E1E3DF] hover:bg-[#DCE7DF] flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Replace</span>
                          </button>
                        </div>

                        {openReplaceForId === ex.id && (
                          <div className="mt-3 p-3 rounded-2xl bg-[#EEF4F0] dark:bg-[#1D2420] space-y-2">
                            <p className="text-xs font-medium text-[#4A554E] dark:text-[#B8C2BA]">
                              Swap for a gentler or equipment-free option:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {ex.alternatives.map((alt) => (
                                <button
                                  key={alt.name}
                                  type="button"
                                  onClick={() => {
                                    onSubstituteExercise(ex, alt);
                                    setOpenReplaceForId(null);
                                  }}
                                  className="p-3 rounded-xl bg-white dark:bg-[#131815] text-left hover:border-[#006B58] border border-transparent transition-colors"
                                >
                                  <p className="text-xs font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
                                    {alt.name}
                                  </p>
                                  <p className="text-[11px] text-[#4A554E] dark:text-[#B8C2BA] mt-0.5">
                                    {alt.reasonLabel} · {alt.durationOrReps}
                                  </p>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Secondary Alternatives: Plan B & Plan C (Shared Layout Morphing Cards) */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#525E57] dark:text-[#A4B0A8]">
          Need a different pace today?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {secondaryPlans.map((plan) => (
            <motion.button
              layout
              layoutId={`plan-card-${plan.tier}`}
              transition={SPRING_TRANSITION}
              whileTap={{ scale: 0.99 }}
              key={plan.tier}
              type="button"
              onClick={() => onSelectPlanTier(plan.tier)}
              className="p-5 rounded-2xl bg-[#EEF4F0]/75 dark:bg-[#181E1A] hover:bg-[#E4EFE8] dark:hover:bg-[#1F2722] border border-[#DDE5DF] dark:border-[#262E29] text-left transition-colors flex items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <motion.p
                  layout="position"
                  layoutId={`plan-meta-${plan.tier}`}
                  className="text-xs font-semibold text-[#006B58] dark:text-[#58DBC2]"
                >
                  {plan.tier} · {plan.badgeText} · {plan.durationMinutes} min
                </motion.p>
                <motion.p
                  layout="position"
                  layoutId={`plan-title-${plan.tier}`}
                  className="text-base font-semibold text-[#191D1A] dark:text-[#E1E3DF]"
                >
                  {plan.title}
                </motion.p>
                <motion.p
                  layout="position"
                  layoutId={`plan-subtitle-${plan.tier}`}
                  className="text-xs text-[#4A554E] dark:text-[#B8C2BA] line-clamp-1"
                >
                  {plan.subtitle}
                </motion.p>
              </div>
              <span className="text-xs font-semibold text-[#006B58] dark:text-[#58DBC2] shrink-0 whitespace-nowrap">
                Switch →
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};
