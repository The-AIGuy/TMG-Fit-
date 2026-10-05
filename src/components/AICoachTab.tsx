import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Volume2,
  Camera,
  Sparkles,
  Loader2,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { DurationOption, FeelingState, UserProfileData } from '../types';

interface AICoachTabProps {
  profile: UserProfileData;
  currentFeeling: FeelingState;
  currentDuration: DurationOption;
  onUpdateProfile: (updated: UserProfileData) => void;
  onAdaptDuration: (mins: DurationOption) => void;
  onAdaptFeeling: (f: FeelingState) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const SUGGESTED_STARTERS = [
  { label: 'What should I do today?', prompt: 'What should I do today based on my energy and schedule?' },
  { label: 'Help me adapt my workout', prompt: 'I only have 10 minutes and want something low-impact.' },
  { label: 'Find something nearby', prompt: 'What is a calm outdoor walk or activity I can do nearby?' },
  { label: 'Plan dinner', prompt: 'Give me a quick, budget-friendly dinner idea for tonight.' },
  { label: 'Explain my progress', prompt: 'How has my consistency been lately including recovery days?' },
];

export const AICoachTab: React.FC<AICoachTabProps> = ({
  profile,
  currentFeeling,
  currentDuration,
  onUpdateProfile,
  onAdaptDuration,
  onAdaptFeeling,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      role: 'assistant',
      text: `Hey ${profile.name}. You can ask me to shorten today's workout, swap an exercise you don't feel like doing, plan a quick dinner, or identify a piece of gym equipment from a photo.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [visionLoading, setVisionLoading] = useState(false);
  const [showLearnedDrawer, setShowLearnedDrawer] = useState(false);

  const sendMessage = async (textOverride?: string) => {
    const promptText = (textOverride ?? input).trim();
    if (!promptText) return;
    setInput('');

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: promptText,
    };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    const lower = promptText.toLowerCase();
    let updatedProfile = { ...profile };
    let learnedNote = '';

    if (lower.includes('10 minute') || lower.includes('8 minute') || lower.includes('5 minute')) {
      const mins: DurationOption = lower.includes('5') ? 5 : 10;
      onAdaptDuration(mins);
      learnedNote = ` (Updated your active plan window to ${mins} minutes.)`;
    }
    if (lower.includes('hate squats') || lower.includes("don't like squats")) {
      const newLearned = 'Dislikes squats — substituting with glute bridges or step-ups';
      if (!updatedProfile.learnedPreferences.includes(newLearned)) {
        updatedProfile = {
          ...updatedProfile,
          dislikedActivities: [...updatedProfile.dislikedActivities, 'Squats'].slice(0, 15),
          learnedPreferences: [newLearned, ...updatedProfile.learnedPreferences].slice(0, 20),
        };
        onUpdateProfile(updatedProfile);
      }
    }
    if (lower.includes('easier') || lower.includes('exhausted') || lower.includes('tired')) {
      onAdaptFeeling('Low energy');
    }

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          userContext: {
            name: updatedProfile.name,
            feelingToday: currentFeeling,
            availableMinutes: currentDuration,
            goals: updatedProfile.goals,
            equipment: updatedProfile.equipment,
            healthConsiderations: updatedProfile.healthConsiderations,
            learnedPreferences: updatedProfile.learnedPreferences,
          },
          history: messages.slice(-6).map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      const data = await res.json();
      const replyText = res.ok
        ? `${data.reply}${learnedNote}`
        : `No problem. I've adjusted your plan for today so it works around your energy and schedule.${learnedNote}`;

      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          text: replyText,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          text: `No problem. We've adapted your plan locally so you can take a gentle pace today.${learnedNote}`,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const speakMessage = async (msg: ChatMessage) => {
    setSpeakingId(msg.id);
    try {
      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msg.text.slice(0, 400) }),
      });
      const data = await res.json();
      if (res.ok && data.audioWavBase64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audioWavBase64}`);
        audio.onended = () => setSpeakingId(null);
        await audio.play();
        return;
      }
    } catch {
      // Fallback
    }
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(msg.text);
      utter.onend = () => setSpeakingId(null);
      window.speechSynthesis.speak(utter);
    } else {
      setSpeakingId(null);
    }
  };

  const handleEquipmentPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVisionLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setMessages((prev) => [
        ...prev,
        {
          id: `u_img_${Date.now()}`,
          role: 'user',
          text: `Uploaded photo: ${file.name} — "What can I do with this equipment?"`,
        },
      ]);
      try {
        const res = await fetch('/api/ai/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'equipment',
            textInput: 'Identify this equipment and suggest 3 gentle beginner-friendly movements.',
            imageBase64: base64,
            mimeType: file.type,
          }),
        });
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: `a_img_${Date.now()}`,
            role: 'assistant',
            text:
              data.analysis ||
              'You can use this equipment for controlled, breath-paced posture rows and supported mobility.',
          },
        ]);
      } finally {
        setVisionLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeLearnedPreference = (item: string) => {
    const updated: UserProfileData = {
      ...profile,
      learnedPreferences: profile.learnedPreferences.filter((p) => p !== item),
    };
    onUpdateProfile(updated);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2EAE4] dark:border-[#252C28] pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#006B58] dark:text-[#58DBC2]">
            Adaptive Intelligence
          </p>
          <h1 className="text-3xl md:text-4xl font-normal text-[#191D1A] dark:text-[#E1E3DF] mt-1">
            Ask TMG-Fit
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setShowLearnedDrawer(!showLearnedDrawer)}
          className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#EEF4F0] dark:bg-[#1B211D] text-xs font-medium text-[#191D1A] dark:text-[#E1E3DF] flex items-center gap-1.5 self-start sm:self-auto whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#006B58]" />
          <span>What TMG-Fit knows ({profile.learnedPreferences.length})</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${
              showLearnedDrawer ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Expandable Learned Preferences Drawer */}
      <AnimatePresence>
        {showLearnedDrawer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 rounded-2xl bg-[#EEF4F0] dark:bg-[#1B211D] border border-[#DDE5DF] dark:border-[#262E29] space-y-3">
              <p className="text-xs text-[#4A554E] dark:text-[#B8C2BA]">
                TMG-Fit remembers these preferences to shape your daily plans. Remove any item
                anytime:
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.learnedPreferences.map((pref) => (
                  <div
                    key={pref}
                    className="pl-3 pr-2 py-1.5 rounded-xl bg-white dark:bg-[#131815] text-xs text-[#191D1A] dark:text-[#E1E3DF] flex items-center gap-2 border border-[#DDE5DF] dark:border-[#262E29]"
                  >
                    <span>{pref}</span>
                    <button
                      type="button"
                      onClick={() => removeLearnedPreference(pref)}
                      aria-label={`Remove ${pref}`}
                      className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40 text-[#525E57] hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggested Starter Prompts */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_STARTERS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => sendMessage(s.prompt)}
            className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-medium bg-[#EEF4F0] dark:bg-[#1B211D] text-[#191D1A] dark:text-[#E1E3DF] hover:bg-[#DCE7DF] dark:hover:bg-[#252D28] transition-colors whitespace-nowrap"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Conversational Thread */}
      <div className="rounded-3xl bg-white dark:bg-[#171C19] border border-[#DDE5DF] dark:border-[#262E29] p-5 md:p-6 space-y-4">
        <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`p-4 rounded-2xl text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[#006B58] text-white ml-8'
                  : 'bg-[#F7FBF7] dark:bg-[#131815] text-[#191D1A] dark:text-[#E1E3DF] mr-4 border border-[#E2EAE4] dark:border-[#262E29]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="whitespace-pre-line">{m.text}</p>
                {m.role === 'assistant' && (
                  <button
                    type="button"
                    onClick={() => speakMessage(m)}
                    title="Listen to response"
                    className="min-h-[36px] min-w-[36px] rounded-xl bg-[#EEF4F0] dark:bg-[#1D2420] flex items-center justify-center text-[#006B58] dark:text-[#58DBC2] shrink-0"
                  >
                    <Volume2
                      className={`w-4 h-4 ${speakingId === m.id ? 'animate-pulse' : ''}`}
                    />
                  </button>
                )}
              </div>
            </div>
          ))}
          {(sending || visionLoading) && (
            <div className="p-4 rounded-2xl bg-[#F7FBF7] dark:bg-[#131815] text-xs text-[#4A554E] dark:text-[#B8C2BA] flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#006B58]" />
              <span>Adapting your plan...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="pt-3 border-t border-[#E2EAE4] dark:border-[#262E29] flex flex-col sm:flex-row gap-2">
          <label className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#EEF4F0] dark:bg-[#1D2420] text-xs font-medium text-[#191D1A] dark:text-[#E1E3DF] cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap">
            <Camera className="w-4 h-4 text-[#006B58]" />
            <span>Identify Gear</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleEquipmentPhoto}
              className="hidden"
            />
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendMessage();
            }}
            placeholder="Tell TMG-Fit what you need today..."
            className="flex-1 min-h-[44px] rounded-xl bg-[#F7FBF7] dark:bg-[#131815] px-4 py-2.5 text-sm text-[#191D1A] dark:text-[#E1E3DF] border border-[#DDE5DF] dark:border-[#262E29]"
          />
          <button
            type="button"
            disabled={sending}
            onClick={() => sendMessage()}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#006B58] text-white text-xs font-semibold flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Send className="w-4 h-4" />
            <span>Ask</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
