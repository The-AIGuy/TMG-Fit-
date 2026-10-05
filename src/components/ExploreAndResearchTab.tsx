import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  MapPin,
  Search,
  Compass,
  Users,
  ExternalLink,
  AlertCircle,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { UserProfileData } from '../types';

interface ExploreAndResearchTabProps {
  profile: UserProfileData;
}

interface MapsPlaceResult {
  title: string;
  uri: string;
  reviewSnippets?: unknown[];
}

interface WebSourceResult {
  title: string;
  uri: string;
}

export const ExploreAndResearchTab: React.FC<ExploreAndResearchTabProps> = ({
  profile,
}) => {
  const [subTab, setSubTab] = useState<'local' | 'adventure' | 'family' | 'research'>('local');
  const [mapsQuery, setMapsQuery] = useState('Find me an easy flat walking route or park nearby');
  const [mapsLoading, setMapsLoading] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);
  const [mapsResponse, setMapsResponse] = useState<{
    text: string;
    places: MapsPlaceResult[];
    lastChecked: string;
  } | null>({
    text: 'Based on your preference for outdoor walking and gentle pacing in Wellington, the Wellington Botanic Garden Lower Loop and Oriental Bay Waterfront Promenade offer flat, well-maintained pathways with frequent seating benches and public restrooms.',
    places: [
      {
        title: 'Wellington Botanic Garden — Accessible Lower Paths',
        uri: 'https://www.google.com/maps/search/?api=1&query=Wellington+Botanic+Garden',
      },
      {
        title: 'Oriental Bay Waterfront Walk',
        uri: 'https://www.google.com/maps/search/?api=1&query=Oriental+Bay+Wellington',
      },
      {
        title: 'Freyberg Pool & Fitness Centre',
        uri: 'https://www.google.com/maps/search/?api=1&query=Freyberg+Pool+Wellington',
      },
    ],
    lastChecked: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>(
    `Area: ${profile.locationArea}`
  );

  const [researchQuery, setResearchQuery] = useState(
    'Warm-up and pacing tips for walking and strength training with asthma'
  );
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchError, setResearchError] = useState<string | null>(null);
  const [researchResult, setResearchResult] = useState<{
    text: string;
    sources: WebSourceResult[];
    lastChecked: string;
  } | null>({
    text: 'Authoritative health guidance recommends a gradual 5-to-10-minute warm-up to allow airways to adjust to temperature changes, pacing activity so you can speak comfortably in full sentences, and breathing through the nose in cooler or dry air. Always keep prescribed reliever medication accessible and follow your personal asthma action plan.',
    sources: [
      {
        title: 'Asthma and Respiratory Foundation NZ — Exercise & Asthma',
        uri: 'https://www.asthmafoundation.org.nz',
      },
      {
        title: 'NHS — Exercising Safely with a Respiratory Condition',
        uri: 'https://www.nhs.uk/conditions/asthma/',
      },
    ],
    lastChecked: new Date().toLocaleDateString(),
  });

  const requestOptionalGps = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation unsupported — using saved city.');
      return;
    }
    setLocationStatus('Requesting location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: Number(pos.coords.latitude.toFixed(3)),
          lng: Number(pos.coords.longitude.toFixed(3)),
        });
        setLocationStatus('Coarse GPS active for this session');
      },
      () => {
        setLocationStatus(`Using saved area: ${profile.locationArea}`);
      }
    );
  };

  const runMapsDiscovery = async (customPrompt?: string) => {
    const q = customPrompt || mapsQuery;
    setMapsQuery(q);
    setMapsLoading(true);
    setMapsError(null);
    try {
      const res = await fetch('/api/ai/explore-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `${q} near ${profile.locationArea}`,
          lat: userCoords?.lat,
          lng: userCoords?.lng,
          userContext: {
            goals: profile.goals,
            equipment: profile.equipment,
            preferredDuration: profile.preferredDuration,
            healthConsiderations: profile.healthConsiderations,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Maps lookup failed.');
      }
      setMapsResponse({
        text: data.text,
        places: data.places || [],
        lastChecked: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } catch (err: unknown) {
      setMapsError(
        err instanceof Error
          ? `${err.message} — Showing saved local routes for ${profile.locationArea}.`
          : 'Live Maps lookup unavailable right now.'
      );
    } finally {
      setMapsLoading(false);
    }
  };

  const runSearchResearch = async (customQ?: string) => {
    const q = customQ || researchQuery;
    setResearchQuery(q);
    setResearchLoading(true);
    setResearchError(null);
    try {
      const res = await fetch('/api/ai/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          healthConsiderations: profile.healthConsiderations,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Search request failed.');
      }
      setResearchResult({
        text: data.text,
        sources: data.sources || [],
        lastChecked: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } catch (err: unknown) {
      setResearchError(
        err instanceof Error ? err.message : 'Live web research is temporarily unavailable.'
      );
    } finally {
      setResearchLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="space-y-8"
    >
      {/* Clean Header & Segmented Mode Selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E2EAE4] dark:border-[#252C28] pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#006B58] dark:text-[#58DBC2]">
            Local Discovery & Trusted Guidance
          </p>
          <h1 className="text-3xl md:text-4xl font-normal text-[#191D1A] dark:text-[#E1E3DF] mt-1">
            Explore Nearby
          </h1>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#EEF4F0] dark:bg-[#1B211D] overflow-x-auto">
          {(
            [
              { id: 'local', label: 'Local Walks & Pools', icon: MapPin },
              { id: 'adventure', label: 'Adventure Mode', icon: Compass },
              { id: 'family', label: 'Family Mode', icon: Users },
              { id: 'research', label: 'Health Guidance', icon: Search },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  subTab === tab.id
                    ? 'bg-[#006B58] text-white font-semibold'
                    : 'text-[#4A554E] dark:text-[#B8C2BA] hover:text-[#191D1A]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {subTab !== 'research' ? (
        <div className="space-y-6">
          {/* Search Bar & Quick Prompts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-[#525E57] dark:text-[#A4B0A8]">
              <span>{locationStatus}</span>
              <button
                type="button"
                onClick={requestOptionalGps}
                className="text-[#006B58] dark:text-[#58DBC2] font-medium hover:underline"
              >
                Use optional coarse GPS
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={mapsQuery}
                onChange={(e) => setMapsQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') runMapsDiscovery();
                }}
                className="flex-1 min-h-[48px] rounded-2xl bg-white dark:bg-[#171C19] px-4 py-2.5 text-sm text-[#191D1A] dark:text-[#E1E3DF] border border-[#DDE5DF] dark:border-[#262E29]"
                placeholder="Search parks, pools, flat routes, or family spots..."
              />
              <button
                type="button"
                disabled={mapsLoading}
                onClick={() => runMapsDiscovery()}
                className="min-h-[48px] px-6 py-2.5 rounded-2xl text-xs font-semibold text-white bg-[#006B58] hover:bg-[#005344] flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-60"
              >
                {mapsLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Searching Maps...</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    <span>Find Places</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {subTab === 'local' &&
                [
                  'Easy flat walking route nearby',
                  'Public swimming pools open today',
                  'Social badminton or community clubs',
                  'Quiet green spaces with benches',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => runMapsDiscovery(preset)}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-medium bg-[#EEF4F0] dark:bg-[#1B211D] text-[#3F4944] dark:text-[#C0C9C2] hover:bg-[#DCE7DF] transition-colors whitespace-nowrap"
                  >
                    {preset}
                  </button>
                ))}

              {subTab === 'adventure' &&
                [
                  'Interesting 30-minute scenic viewpoint walk',
                  '20-minute waterfront or botanical loop',
                  'Quiet twilight walk to a public landmark',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => runMapsDiscovery(preset)}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-medium bg-[#EEF4F0] dark:bg-[#1B211D] text-[#3F4944] dark:text-[#C0C9C2] hover:bg-[#DCE7DF] transition-colors whitespace-nowrap"
                  >
                    {preset}
                  </button>
                ))}

              {subTab === 'family' &&
                [
                  'Park with playground and flat walking loop',
                  'Family-friendly weekend bike path or duck pond',
                  'Indoor rainy-day community recreation with kids',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => runMapsDiscovery(preset)}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-medium bg-[#EEF4F0] dark:bg-[#1B211D] text-[#3F4944] dark:text-[#C0C9C2] hover:bg-[#DCE7DF] transition-colors whitespace-nowrap"
                  >
                    {preset}
                  </button>
                ))}
            </div>

            {mapsError && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{mapsError}</span>
              </div>
            )}
          </div>

          {/* Grounded Results */}
          {mapsResponse && (
            <div className="rounded-3xl bg-white dark:bg-[#171C19] p-6 md:p-8 border border-[#DDE5DF] dark:border-[#262E29] space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#525E57] dark:text-[#A4B0A8]">
                  <span>Recommended for your pace</span>
                  <span className="tabular-nums">Updated {mapsResponse.lastChecked}</span>
                </div>
                <p className="text-sm md:text-base leading-relaxed text-[#191D1A] dark:text-[#E1E3DF] whitespace-pre-line">
                  {mapsResponse.text}
                </p>
              </div>

              {mapsResponse.places.length > 0 && (
                <div className="pt-4 border-t border-[#E2EAE4] dark:border-[#262E29]">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#525E57] dark:text-[#A4B0A8] mb-3">
                    Open in Google Maps
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {mapsResponse.places.map((pl, idx) => (
                      <a
                        key={`${pl.title}-${idx}`}
                        href={pl.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 rounded-2xl bg-[#EEF4F0] dark:bg-[#1D2420] hover:bg-[#DCE7DF] transition-colors flex items-start justify-between gap-2"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
                            {pl.title}
                          </p>
                          <p className="text-xs text-[#4A554E] dark:text-[#B8C2BA] mt-1">
                            Directions & live hours
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-[#006B58] shrink-0 mt-0.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={researchQuery}
                onChange={(e) => setResearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') runSearchResearch();
                }}
                className="flex-1 min-h-[48px] rounded-2xl bg-white dark:bg-[#171C19] px-4 py-2.5 text-sm text-[#191D1A] dark:text-[#E1E3DF] border border-[#DDE5DF] dark:border-[#262E29]"
                placeholder="Ask a health-aware activity or pacing question..."
              />
              <button
                type="button"
                disabled={researchLoading}
                onClick={() => runSearchResearch()}
                className="min-h-[48px] px-6 py-2.5 rounded-2xl text-xs font-semibold text-white bg-[#006B58] hover:bg-[#005344] flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-60"
              >
                {researchLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Search Reliable Sources</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                'Warm-up and pacing tips for walking with asthma',
                'Gentle walking after meals and blood glucose',
                'Pacing physical activity with low energy or fatigue',
                'Benefits of 10-minute movement snacks on busy days',
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => runSearchResearch(q)}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-medium bg-[#EEF4F0] dark:bg-[#1B211D] text-[#3F4944] dark:text-[#C0C9C2] hover:bg-[#DCE7DF] transition-colors whitespace-nowrap"
                >
                  {q}
                </button>
              ))}
            </div>

            {researchError && (
              <p className="text-xs text-amber-800 dark:text-amber-300">{researchError}</p>
            )}
          </div>

          {researchResult && (
            <div className="rounded-3xl bg-white dark:bg-[#171C19] p-6 md:p-8 border border-[#DDE5DF] dark:border-[#262E29] space-y-5">
              <div className="flex items-center justify-between text-xs text-[#525E57] dark:text-[#A4B0A8]">
                <span>Informational guidance · Not a medical diagnosis</span>
                <span className="tabular-nums">Checked {researchResult.lastChecked}</span>
              </div>

              <p className="text-sm md:text-base leading-relaxed text-[#191D1A] dark:text-[#E1E3DF] whitespace-pre-line">
                {researchResult.text}
              </p>

              <div className="p-3.5 rounded-2xl bg-[#EEF4F0] dark:bg-[#1D2420] flex items-start gap-2.5 text-xs text-[#4A554E] dark:text-[#B8C2BA]">
                <ShieldAlert className="w-4 h-4 text-[#006B58] shrink-0 mt-0.5" />
                <span>
                  TMG-Fit is an assistive fitness companion, not a doctor. Always follow your
                  healthcare professional's advice.
                </span>
              </div>

              {researchResult.sources.length > 0 && (
                <div className="pt-3 border-t border-[#E2EAE4] dark:border-[#262E29]">
                  <p className="text-xs font-semibold text-[#525E57] dark:text-[#A4B0A8] mb-2">
                    Cited Sources
                  </p>
                  <div className="flex flex-wrap gap-4">
                    {researchResult.sources.map((s, i) => (
                      <a
                        key={`${s.uri}-${i}`}
                        href={s.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#006B58] dark:text-[#58DBC2] hover:underline"
                      >
                        <span>{s.title}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
