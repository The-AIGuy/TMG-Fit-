import React, { useState } from 'react';
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
    text: 'Based on your preference for outdoor walking and gentle pacing in Wellington, the **Wellington Botanic Garden Lower Loop** and **Oriental Bay Waterfront Promenade** offer flat, well-maintained pathways with frequent seating benches and public restrooms.',
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
    `Using saved area (${profile.locationArea}). Exact GPS is off by default for privacy.`
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
      setLocationStatus('Browser geolocation is not supported; using your saved city.');
      return;
    }
    setLocationStatus('Requesting optional location permission...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: Number(pos.coords.latitude.toFixed(3)),
          lng: Number(pos.coords.longitude.toFixed(3)),
        });
        setLocationStatus('Coarse location enabled for this session only.');
      },
      () => {
        setLocationStatus(
          `Location permission declined — continuing safely with ${profile.locationArea}.`
        );
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
        throw new Error(data.error || 'Maps grounding request failed.');
      }
      setMapsResponse({
        text: data.text,
        places: data.places || [],
        lastChecked: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } catch (err: unknown) {
      setMapsError(
        err instanceof Error
          ? `${err.message} — Showing saved local presets for ${profile.locationArea}.`
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
        throw new Error(data.error || 'Search grounding request failed.');
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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#DDE5DF] dark:border-[#2B322E] pb-6">
        <div>
          <p className="text-xs font-medium text-[#3F4944] dark:text-[#C0C9C2]">
            Google Maps & Search Grounding · Local & Reliable Discovery
          </p>
          <h1 className="text-3xl font-normal text-[#191D1A] dark:text-[#E1E3DF] mt-1">
            Explore Local Movement, Adventure Walks & Health Research
          </h1>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#EEF5EF] dark:bg-[#1B211D]">
          {(
            [
              { id: 'local', label: 'Local Places', icon: MapPin },
              { id: 'adventure', label: 'Adventure Mode', icon: Compass },
              { id: 'family', label: 'Family Mode', icon: Users },
              { id: 'research', label: 'Health Research', icon: Search },
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
                    ? 'bg-[#006B58] text-white'
                    : 'text-[#3F4944] dark:text-[#C0C9C2] hover:text-[#191D1A]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {subTab !== 'research' ? (
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#EEF5EF] dark:bg-[#1B211D] p-6 border border-[#DDE5DF] dark:border-[#2B322E]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-normal text-[#191D1A] dark:text-[#E1E3DF]">
                  {subTab === 'local' && 'Find Accessible Local Parks, Pools & Clubs'}
                  {subTab === 'adventure' &&
                    'Adventure Mode — Turn an Ordinary Walk into Exploration'}
                  {subTab === 'family' &&
                    'Family Mode — Realistic Movement When the Kids Are Home'}
                </h2>
                <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2] mt-1">
                  {locationStatus}
                </p>
              </div>
              <button
                type="button"
                onClick={requestOptionalGps}
                className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-medium bg-[#F7FBF7] dark:bg-[#111512] text-[#006B58] dark:text-[#58DBC2] border border-[#DDE5DF] dark:border-[#2B322E] whitespace-nowrap"
              >
                Use Optional Coarse GPS
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {subTab === 'local' &&
                [
                  'Find me an easy flat walking route nearby',
                  'What public swimming pools are open today?',
                  'Find social badminton or community recreation clubs',
                  'Quiet green spaces with benches for rest stops',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => runMapsDiscovery(preset)}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-medium bg-[#F7FBF7] dark:bg-[#111512] text-[#3F4944] dark:text-[#C0C9C2] hover:bg-[#BCECE0] hover:text-[#00201A] transition-colors whitespace-nowrap"
                  >
                    {preset}
                  </button>
                ))}

              {subTab === 'adventure' &&
                [
                  'Find an interesting 30-minute scenic viewpoint or waterfront walk',
                  '20-minute heritage street or botanical loop walk (zero spending required)',
                  'Quiet twilight walk to a public lookout or landmark',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => runMapsDiscovery(preset)}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-medium bg-[#F7FBF7] dark:bg-[#111512] text-[#3F4944] dark:text-[#C0C9C2] hover:bg-[#BCECE0] hover:text-[#00201A] transition-colors whitespace-nowrap"
                  >
                    {preset}
                  </button>
                ))}

              {subTab === 'family' &&
                [
                  'The kids are home — find a park with a playground and flat walking loop',
                  'Family-friendly weekend bike path or duck pond walk',
                  'Indoor rainy-day community recreation with children',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => runMapsDiscovery(preset)}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-medium bg-[#F7FBF7] dark:bg-[#111512] text-[#3F4944] dark:text-[#C0C9C2] hover:bg-[#BCECE0] hover:text-[#00201A] transition-colors whitespace-nowrap"
                  >
                    {preset}
                  </button>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={mapsQuery}
                onChange={(e) => setMapsQuery(e.target.value)}
                className="flex-1 min-h-[44px] rounded-xl bg-[#F7FBF7] dark:bg-[#111512] px-4 py-2.5 text-sm text-[#191D1A] dark:text-[#E1E3DF] border border-[#DDE5DF] dark:border-[#2B322E]"
                placeholder="Ask for any activity, park, pool, or route..."
              />
              <button
                type="button"
                disabled={mapsLoading}
                onClick={() => runMapsDiscovery()}
                className="min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#006B58] hover:bg-[#005344] flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-60"
              >
                {mapsLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking Google Maps...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    Search with Maps Grounding
                  </>
                )}
              </button>
            </div>

            {mapsError && (
              <div className="mt-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{mapsError}</span>
              </div>
            )}
          </div>

          {mapsResponse && (
            <div className="rounded-3xl bg-[#F7FBF7] dark:bg-[#111512] p-6 border border-[#DDE5DF] dark:border-[#2B322E] space-y-5">
              <div className="flex items-center justify-between text-xs text-[#3F4944] dark:text-[#C0C9C2]">
                <span>Google Maps Grounded Activity Suggestion</span>
                <span className="tabular-nums">Last checked · {mapsResponse.lastChecked}</span>
              </div>
              <p className="text-sm leading-relaxed text-[#191D1A] dark:text-[#E1E3DF] whitespace-pre-line">
                {mapsResponse.text}
              </p>

              {mapsResponse.places.length > 0 && (
                <div className="pt-4 border-t border-[#DDE5DF] dark:border-[#2B322E]">
                  <h3 className="text-xs font-semibold text-[#3F4944] dark:text-[#C0C9C2] mb-3">
                    Verified Google Maps Places & Links
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {mapsResponse.places.map((pl, idx) => (
                      <a
                        key={`${pl.title}-${idx}`}
                        href={pl.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 rounded-2xl bg-[#EEF5EF] dark:bg-[#1B211D] hover:bg-[#BCECE0] dark:hover:bg-[#005142] transition-colors flex items-start justify-between gap-2"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#191D1A] dark:text-[#E1E3DF]">
                            {pl.title}
                          </p>
                          <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2] mt-1">
                            View live opening hours, directions & accessibility on Google Maps
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
          <div className="rounded-3xl bg-[#EEF5EF] dark:bg-[#1B211D] p-6 border border-[#DDE5DF] dark:border-[#2B322E]">
            <h2 className="text-xl font-normal text-[#191D1A] dark:text-[#E1E3DF]">
              Evidence-Based Health & Activity Research (Google Search Grounding)
            </h2>
            <p className="text-xs text-[#3F4944] dark:text-[#C0C9C2] mt-1">
              Prioritises government health bodies, recognised hospitals, and established medical
              organisations. Never replaces your GP or physiotherapist.
            </p>

            <div className="flex flex-wrap gap-2 my-4">
              {[
                'Warm-up and pacing tips for walking and strength training with asthma',
                'How gentle walking after meals supports blood glucose management',
                'Pacing physical activity with low energy or thyroid fatigue',
                'Benefits of short 10-minute movement snacks throughout a busy workday',
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => runSearchResearch(q)}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-medium bg-[#F7FBF7] dark:bg-[#111512] text-[#3F4944] dark:text-[#C0C9C2] hover:bg-[#D3E4FF] hover:text-[#001C38] transition-colors whitespace-nowrap"
                >
                  {q}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={researchQuery}
                onChange={(e) => setResearchQuery(e.target.value)}
                className="flex-1 min-h-[44px] rounded-xl bg-[#F7FBF7] dark:bg-[#111512] px-4 py-2.5 text-sm text-[#191D1A] dark:text-[#E1E3DF] border border-[#DDE5DF] dark:border-[#2B322E]"
                placeholder="Research a health condition, exercise safety question, or nutrition topic..."
              />
              <button
                type="button"
                disabled={researchLoading}
                onClick={() => runSearchResearch()}
                className="min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#006B58] hover:bg-[#005344] flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-60"
              >
                {researchLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching Reliable Sources...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Research with Google Search
                  </>
                )}
              </button>
            </div>

            {researchError && (
              <p className="mt-3 text-xs text-amber-800 dark:text-amber-300">{researchError}</p>
            )}
          </div>

          {researchResult && (
            <div className="rounded-3xl bg-[#F7FBF7] dark:bg-[#111512] p-6 border border-[#DDE5DF] dark:border-[#2B322E] space-y-4">
              <div className="flex items-center justify-between text-xs text-[#3F4944] dark:text-[#C0C9C2]">
                <span>Informational Summary · Not a medical diagnosis</span>
                <span className="tabular-nums">Last checked · {researchResult.lastChecked}</span>
              </div>
              <p className="text-sm leading-relaxed text-[#191D1A] dark:text-[#E1E3DF] whitespace-pre-line">
                {researchResult.text}
              </p>

              <div className="p-3.5 rounded-2xl bg-[#EEF5EF] dark:bg-[#1B211D] flex items-start gap-2.5 text-xs text-[#3F4944] dark:text-[#C0C9C2]">
                <ShieldAlert className="w-4 h-4 text-[#006B58] shrink-0 mt-0.5" />
                <span>
                  Always follow your clinician's guidance and never alter prescribed medication
                  based on general articles.
                </span>
              </div>

              {researchResult.sources.length > 0 && (
                <div className="pt-3 border-t border-[#DDE5DF] dark:border-[#2B322E]">
                  <p className="text-xs font-semibold text-[#3F4944] dark:text-[#C0C9C2] mb-2">
                    Sources
                  </p>
                  <div className="flex flex-wrap gap-3">
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
    </div>
  );
};
