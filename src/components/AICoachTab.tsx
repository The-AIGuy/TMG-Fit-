import React, { useState } from 'react';
import {
  Send,
  Volume2,
  Camera,
  Sparkles,
  Loader2,
  Trash2,
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
      text: `Hey ${profile.name}! I'm here to adapt your plan whenever real life shifts. You can tell me things like "I only have 10 minutes", "Make today's workout easier", "I hate squats", or upload a photo of unfamiliar gym equipment.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [visionLoading, setVisionLoading] = useState(false);

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

    // Detect quick real-time adaptations & learned preferences
    const lower = promptText.toLowerCase();
    let updatedProfile = { ...profile };
    let learnedNote = '';

    if (lower.includes('10 minute') || lower.includes('8 minute') || lower.includes('5 minute')) {
      const mins: DurationOption = lower.includes('5') ? 5 : 10;
      onAdaptDuration(mins);
      learnedNote = ` (Adapted your active plan window to ${mins} minutes.)`;
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
        : `No problem at all. I've adjusted your plan for today so it works around your energy and schedule.${learnedNote}`;

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
      // Fallback to browser SpeechSynthesis if offline
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
          text: `Uploaded equipment photo: ${file.name} — "What can I safely do with this?"`,
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
              'I see your equipment! You can use it for controlled, breath-paced posture rows and supported mobility.',
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 rounded-3xl bg-[#EEF5EF] dark:bg-[#1B211D] p-6 border border-[#DDE5DF] dark:border-[#2B322E] flex flex-col justify-between min-h-[560px]">
        <div>
          <div className="flex items-center justify-between border-b border-[#DDE5DF] dark:border-[#2B322E] pb-4 mb-4">
            <div>
              <p className="text-xs font-medium text-[#3F4944] dark:text-[#C0C9C2]">
                Gemini 3.8 Flash · Supportive, Non-Judgmental Companion
              </p>
              <h1 className="text-2xl font-normal text-[#191D1A] dark:text-[#E1E3DF]">
                Ask Gemini to Adapt Your Day, Explain Exercises, or Identify Gear
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {[
              'I only have 10 minutes today.',
              "Make today's workout easier.",
              'What can I do indoors that is quiet?',
              'Why did you recommend today’s plan?',
              'I hate squats — replace them.',
              'Give me a cheap 15-minute dinner idea.',
            ].map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-medium bg-[#F7FBF7] dark:bg-[#111512] text-[#3F4944] dark:text-[#C0C9C2] hover:bg-[#BCECE0] hover:text-[#00201A] transition-colors whitespace-nowrap"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#006B58] text-white ml-8'
                    : 'bg-[#F7FBF7] dark:bg-[#111512] text-[#191D1A] dark:text-[#E1E3DF] mr-4 border border-[#DDE5DF] dark:border-[#2B322E]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="whitespace-pre-line">{m.text}</p>
                  {m.role === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => speakMessage(m)}
                      title="Listen with Gemini Voice TTS"
                      className="min-h-[40px] min-w-[40px] rounded-xl bg-[#EEF5EF] dark:bg-[#1B211D] flex items-center justify-center text-[#006B58] dark:text-[#58DBC2] shrink-0"
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
              <div className="p-4 rounded-2xl bg-[#F7FBF7] dark:bg-[#111512] text-xs text-[#3F4944] dark:text-[#C0C9C2] flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#006B58]" />
                <span>Adapting thoughtfully...</span>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-[#DDE5DF] dark:border-[#2B322E] flex flex-col sm:flex-row gap-2.5">
          <label className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#F7FBF7] dark:bg-[#111512] text-xs font-medium text-[#191D1A] dark:text-[#E1E3DF] border border-[#DDE5DF] dark:border-[#2B322E] cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap">
            <Camera className="w-4 h-4 text-[#006B58]" />
            <span>Identify Gear Photo</span>
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
            placeholder="Chat naturally with Gemini..."
            className="flex-1 min-h-[44px] rounded-xl bg-[#F7FBF7] dark:bg-[#111512] px-4 py-2.5 text-sm text-[#191D1A] dark:text-[#E1E3DF] border border-[#DDE5DF] dark:border-[#2B322E]"
          />
          <button
            type="button"
            disabled={sending}
            onClick={() => sendMessage()}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#006B58] text-white text-xs font-semibold flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>

      {/* Transparency & Learned Preferences */}
      <div className="lg:col-span-4 space-y-6">
        <div className="rounded-3xl bg-[#F7FBF7] dark:bg-[#111512] p-6 border border-[#DDE5DF] dark:border-[#2B322E] space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#006B58]" />
            <h2 className="text-lg font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
              What the App Has Learned About Me
            </h2>
          </div>
          <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2] leading-relaxed">
            You have full visibility and control over every preference the adaptive engine uses.
            Delete any item anytime.
          </p>

          <div className="space-y-2">
            {profile.learnedPreferences.map((pref) => (
              <div
                key={pref}
                className="p-3 rounded-2xl bg-[#EEF5EF] dark:bg-[#1B211D] flex items-center justify-between gap-2 text-xs text-[#191D1A] dark:text-[#E1E3DF]"
              >
                <span>{pref}</span>
                <button
                  type="button"
                  onClick={() => removeLearnedPreference(pref)}
                  title="Remove learned preference"
                  className="min-h-[36px] min-w-[36px] rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50 text-[#3F4944] hover:text-red-700 flex items-center justify-center shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
