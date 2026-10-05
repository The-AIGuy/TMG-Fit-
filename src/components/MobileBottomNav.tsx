import React from 'react';
import { Activity, Compass, Home, Sparkles, Utensils } from 'lucide-react';
import { AppView, PrimaryTab } from './AppHeader';

interface MobileBottomNavProps {
  activeView: AppView;
  onSelectView: (view: PrimaryTab) => void;
}

const MOBILE_TABS: {
  id: PrimaryTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'food', label: 'Food', icon: Utensils },
  { id: 'ai', label: 'AI', icon: Sparkles },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  onSelectView,
}) => {
  return (
    <nav
      aria-label="Mobile Primary Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#F7FBF7]/95 dark:bg-[#111512]/95 backdrop-blur-md border-t border-[#E2EAE4] dark:border-[#252C28] grid grid-cols-5 items-center px-2"
    >
      {MOBILE_TABS.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectView(item.id)}
            className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-colors ${
              isActive
                ? 'text-[#006B58] dark:text-[#58DBC2] font-semibold'
                : 'text-[#525E57] dark:text-[#A4B0A8]'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[11px] tracking-tight mt-0.5 whitespace-nowrap">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
