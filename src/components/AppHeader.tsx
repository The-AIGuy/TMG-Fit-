import React from 'react';
import { User } from 'firebase/auth';
import { Moon, Sun, User as UserIcon } from 'lucide-react';
import { GENERATED_IMAGES } from '../adaptiveEngine';

export type PrimaryTab = 'home' | 'activity' | 'explore' | 'food' | 'ai';
export type AppView = PrimaryTab | 'profile';

interface AppHeaderProps {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  userName: string;
  firebaseUser: User | null;
}

const NAV_ITEMS: { id: PrimaryTab; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'activity', label: 'Activity' },
  { id: 'explore', label: 'Explore' },
  { id: 'food', label: 'Food' },
  { id: 'ai', label: 'AI' },
];

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeView,
  onSelectView,
  darkMode,
  onToggleDarkMode,
  userName,
  firebaseUser,
}) => {
  const [imgError, setImgError] = React.useState(false);

  return (
    <header className="sticky top-0 z-30 h-14 md:h-16 px-4 md:px-8 bg-[#F7FBF7]/90 dark:bg-[#111512]/90 backdrop-blur-md border-b border-[#E2EAE4] dark:border-[#252C28] flex items-center justify-between">
      {/* Zone 1: Brand Wordmark */}
      <a
        href="#home"
        onClick={(e) => {
          e.preventDefault();
          onSelectView('home');
        }}
        className="text-lg md:text-xl font-bold tracking-tight text-[#006B58] dark:text-[#58DBC2] whitespace-nowrap"
      >
        TMG-Fit
      </a>

      {/* Zone 2: 5 Primary Navigation Links on Desktop */}
      <nav
        aria-label="Primary Navigation"
        className="hidden md:flex items-center gap-8 text-sm font-medium text-[#4A554E] dark:text-[#B8C2BA]"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              className={`min-h-[40px] py-1 transition-colors whitespace-nowrap border-b-2 ${
                isActive
                  ? 'border-[#006B58] dark:border-[#58DBC2] text-[#191D1A] dark:text-[#E1E3DF] font-semibold'
                  : 'border-transparent hover:text-[#191D1A] dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Theme Toggle & Profile Trigger */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleDarkMode}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className="min-h-[40px] min-w-[40px] rounded-full hover:bg-[#EAF1EC] dark:hover:bg-[#1D2420] flex items-center justify-center text-[#3F4944] dark:text-[#C0C9C2] transition-colors"
        >
          {darkMode ? (
            <Sun className="w-4 h-4 text-[#58DBC2]" />
          ) : (
            <Moon className="w-4 h-4 text-[#006B58]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelectView('profile')}
          aria-label="Open profile, schedule, and privacy settings"
          className={`min-h-[40px] pl-1.5 pr-3 py-1 rounded-full flex items-center gap-2 text-xs font-medium transition-colors whitespace-nowrap ${
            activeView === 'profile'
              ? 'bg-[#006B58] text-white'
              : 'bg-[#EAF1EC] dark:bg-[#1B211D] text-[#191D1A] dark:text-[#E1E3DF] hover:bg-[#DCE7DF] dark:hover:bg-[#252D28]'
          }`}
        >
          {!imgError ? (
            <img
              src={GENERATED_IMAGES.alexAvatar}
              alt={userName}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <span className="w-6 h-6 rounded-full bg-[#006B58]/20 flex items-center justify-center">
              <UserIcon className="w-3.5 h-3.5" />
            </span>
          )}
          <span className="truncate max-w-[96px]">
            {firebaseUser ? userName : `${userName}`}
          </span>
        </button>
      </div>
    </header>
  );
};
