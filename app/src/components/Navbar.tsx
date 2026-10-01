import { useEffect, useRef, useState } from 'react';
import { Sparkles, X, FileUp, Check, Layers, Share2, BookOpen, Crown, Bookmark, Bot, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLiteratureMap } from '@/context/LiteratureMapContext';
import TopicSearchBar from './TopicSearchBar';
import ProPricingModal from './ProPricingModal';
import MethodologyModal from './MethodologyModal';
import ShareModal from './ShareModal';
import SavedPapersModal from './SavedPapersModal';
import AiCopilotModal from './AiCopilotModal';

const NAV_LINKS = [
  { label: 'Atlas', href: '#network' },
  { label: 'Schools', href: '#schools' },
  { label: 'Debates', href: '#debates' },
  { label: 'Gaps', href: '#gap' },
  { label: 'Evidence', href: '#evidence' },
  { label: 'Ingest', href: '#upload' },
];

export default function Navbar() {
  const [isLight, setIsLight] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isMethodologyModalOpen, setIsMethodologyModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const updateCount = () => {
      try {
        const raw = localStorage.getItem('litmap_saved_papers');
        setSavedCount(raw ? JSON.parse(raw).length : 0);
      } catch {
        setSavedCount(0);
      }
    };
    updateCount();
    window.addEventListener('storage', updateCount);
    const interval = setInterval(updateCount, 1500);
    return () => {
      window.removeEventListener('storage', updateCount);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleOpenAi = () => setIsAiModalOpen(true);
    window.addEventListener('open-ai-copilot', handleOpenAi);
    return () => window.removeEventListener('open-ai-copilot', handleOpenAi);
  }, []);

  useEffect(() => {
    const handleOpenPricing = () => setIsPricingModalOpen(true);
    window.addEventListener('open-pricing-modal', handleOpenPricing);
    return () => window.removeEventListener('open-pricing-modal', handleOpenPricing);
  }, []);

  const {
    config,
    activePresetId,
    switchPreset,
    availablePresets,
    featuredPresets,
    importBundleJSON,
    topicHistory,
  } = useLiteratureMap();

  useEffect(() => {
    const handleScroll = () => {
      const threshold = window.innerHeight * 0.8;
      setIsLight(window.scrollY > threshold);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) {
      const navHeight = 52;
      const top = el.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const success = importBundleJSON(text);
        if (success) {
          setImportNotice(`Loaded ${file.name}`);
          setTimeout(() => setImportNotice(null), 3500);
          setIsDropdownOpen(false);
        } else {
          alert('Could not parse JSON bundle. Please ensure it contains networkData or config.');
        }
      } catch (err: any) {
        alert(`Import error: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <>
      <nav
      ref={navRef}
      className={cn(
        'fixed top-0 left-0 right-0 h-[52px] z-sticky-nav flex items-center justify-between px-4 md:px-6 transition-all duration-300',
        isLight
          ? 'bg-[rgba(250,249,246,0.94)] border-b border-[#E5E2DC] backdrop-blur-[16px]'
          : 'bg-[rgba(10,12,20,0.85)] border-b border-[rgba(255,255,255,0.08)] backdrop-blur-[16px]'
      )}
    >
      {/* Left: Brand & Map Selector */}
      <div className="flex items-center gap-2.5 shrink-0">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={cn(
            'font-serif text-[16px] font-bold tracking-tight shrink-0 transition-colors flex items-center gap-2',
            isLight ? 'text-[#1A1B3A]' : 'text-white'
          )}
        >
          <span className="w-2 h-2 rounded-full bg-star-gold animate-pulse" />
          <span>LitMap</span>
        </a>

        {/* Preset Selector Dropdown */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded-full border transition-all duration-200 cursor-pointer',
              isLight
                ? 'bg-white/80 border-[#D8D4CC] text-[#2D2E4E] hover:bg-[#F0ECE4]'
                : 'bg-white/5 border-white/10 text-[rgba(255,255,255,0.8)] hover:bg-white/10 hover:text-white'
            )}
            title="Switch literature map preset or active corpus"
          >
            <Layers size={11} className="text-[#D4A853]" />
            <span className="max-w-[110px] sm:max-w-[150px] truncate font-medium">
              {featuredPresets?.find((p) => p.id === activePresetId)?.shortName ||
                availablePresets.find((p) => p.id === activePresetId)?.name ||
                'Atlas'}
            </span>
            <svg
              className={cn(
                'w-3 h-3 transition-transform duration-200 opacity-60',
                isDropdownOpen && 'rotate-180'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div
              className={cn(
                'absolute left-0 top-[calc(100%+6px)] w-80 rounded-lg border shadow-2xl p-2 z-50 backdrop-blur-xl animate-in fade-in-50 zoom-in-95 duration-150',
                isLight
                  ? 'bg-[#FCFBF9]/98 border-[#E2DDD5] text-[#1A1B3A]'
                  : 'bg-[#12141F]/98 border-white/15 text-white'
              )}
            >
              {/* Header */}
              <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider opacity-60 border-b border-white/10 flex items-center justify-between">
                <span>Curated Research Atlases</span>
                <span className="text-[9px] bg-star-gold/20 text-star-gold px-1.5 py-0.5 rounded">1-Click</span>
              </div>

              {/* 4 Featured Presets */}
              <div className="space-y-1 my-1.5">
                {(featuredPresets || []).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      switchPreset(preset.id);
                      setIsDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-2.5 py-1.5 rounded-md transition-all text-xs flex items-center justify-between',
                      activePresetId === preset.id
                        ? isLight
                          ? 'bg-[#EAE6DE] font-semibold text-[#1A1B3A]'
                          : 'bg-white/15 font-semibold text-star-gold'
                        : isLight
                        ? 'hover:bg-[#F2EFE9] text-[#4A4C68]'
                        : 'hover:bg-white/5 text-[rgba(255,255,255,0.7)] hover:text-white'
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="font-mono text-[12px]">{preset.name}</span>
                      <span className="text-[10px] opacity-60 truncate max-w-[210px]">{preset.domain}</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 font-mono shrink-0 ml-2 opacity-80">
                      {preset.badge}
                    </span>
                  </button>
                ))}
              </div>

              {/* Recent Live Searches (if any) */}
              {topicHistory.length > 0 && (
                <>
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider opacity-50 border-t border-white/10 mt-2 pt-1.5">
                    Recent Live Inquiries
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1 my-1">
                    {topicHistory.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          switchPreset(item.id);
                          setIsDropdownOpen(false);
                        }}
                        className={cn(
                          'w-full text-left px-2.5 py-1 rounded text-xs flex items-center justify-between font-mono',
                          activePresetId === item.id
                            ? 'bg-amber-500/20 text-amber-300 font-semibold'
                            : 'hover:bg-white/5 opacity-75 hover:opacity-100'
                        )}
                      >
                        <span className="truncate text-[11px]">🔍 {item.title}</span>
                        <span className="text-[9px] opacity-60">{item.paperCount}p</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Quick Actions Footer */}
              <div className="pt-2 mt-1.5 border-t border-white/10 grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsSearchModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded font-mono text-[11px] font-medium bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 transition-colors cursor-pointer"
                >
                  <Sparkles size={11} />
                  <span>Search Topic</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded font-mono text-[11px] font-medium bg-white/10 border border-white/15 text-white/90 hover:bg-white/15 transition-colors cursor-pointer"
                  title="Import a custom literature_map_bundle.json or network_data.json"
                >
                  <FileUp size={11} />
                  <span>Import JSON</span>
                </button>
              </div>

              {/* Hidden file input for 1-click JSON import */}
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          )}
        </div>

        {/* Import notice toast */}
        {importNotice && (
          <span className="font-mono text-[11px] text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in">
            <Check size={10} />
            {importNotice}
          </span>
        )}
      </div>

      {/* Nav Links - Desktop (xl+) */}
      <div className="hidden xl:flex items-center gap-1">
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={(e) => handleNavClick(e, link.href)}
            className={cn(
              'px-2.5 py-1 rounded-md font-mono text-[11px] uppercase tracking-wider transition-colors duration-200',
              isLight
                ? 'text-[#2D2E4E] font-medium hover:text-[#1A1B3A] hover:bg-[#EAE6DE]'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            )}
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* AI Copilot Button */}
        <button
          onClick={() => setIsAiModalOpen(true)}
          className={cn(
            'inline-flex items-center gap-1.5 font-mono text-[11px] font-medium rounded-md px-2.5 py-1.5 border transition-all duration-200 cursor-pointer',
            isLight
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-800 hover:bg-amber-500/20'
              : 'border-star-gold/40 bg-star-gold/10 text-star-gold hover:bg-star-gold/20'
          )}
          title="Ask AI Copilot grounded in topological literature"
        >
          <Bot size={13} />
          <span>Ask AI</span>
        </button>

        {/* Saved Reading List Button */}
        <button
          onClick={() => setIsSavedModalOpen(true)}
          className={cn(
            'inline-flex items-center gap-1.5 font-mono text-[11px] font-medium rounded-md px-2.5 py-1.5 border transition-all duration-200 cursor-pointer',
            isLight
              ? 'border-[#D0CCC4] text-[#1A1B3A] hover:border-[#1A1B3A] hover:bg-[#F2EFE9]'
              : 'border-white/20 text-white/80 hover:text-white hover:border-white/40 bg-white/5'
          )}
          title="View Saved Lab Reading List"
        >
          <Bookmark size={13} className={savedCount > 0 ? 'text-amber-400 fill-amber-400' : ''} />
          <span className="hidden sm:inline">Saved</span>
          {savedCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
              {savedCount}
            </span>
          )}
        </button>

        {/* Share Button */}
        <button
          onClick={() => setIsShareModalOpen(true)}
          className={cn(
            'inline-flex items-center gap-1.5 font-mono text-[11px] font-medium rounded-md px-2.5 py-1.5 border transition-all duration-200 cursor-pointer',
            isLight
              ? 'border-[#D0CCC4] text-[#1A1B3A] hover:border-[#1A1B3A] hover:bg-[#F2EFE9]'
              : 'border-white/20 text-white/80 hover:text-white hover:border-white/40 bg-white/5'
          )}
          title="Share literature map"
        >
          <Share2 size={13} />
          <span className="hidden sm:inline">Share</span>
        </button>

        {/* Pro Plan Trigger */}
        <button
          onClick={() => setIsPricingModalOpen(true)}
          className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold rounded-md px-3 py-1.5 bg-gradient-to-r from-star-gold to-[#E5C16C] text-black hover:brightness-110 transition-all duration-200 shadow-[0_0_15px_rgba(212,168,83,0.35)] cursor-pointer shrink-0"
          title="View Pro Scientist Plan & Early Access"
        >
          <Crown size={13} className="text-black" />
          <span>Pro</span>
        </button>

        {/* Mobile/Tablet Menu Toggle (< xl) */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={cn(
            'xl:hidden inline-flex items-center justify-center w-8 h-8 rounded-md border transition-colors cursor-pointer shrink-0',
            isLight
              ? 'border-[#D0CCC4] text-[#1A1B3A] hover:bg-[#EAE6DE]'
              : 'border-white/20 text-white/90 hover:bg-white/10'
          )}
          aria-label="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div
          className={cn(
            'fixed top-[52px] left-0 right-0 z-40 border-b shadow-2xl p-4 backdrop-blur-xl xl:hidden animate-in slide-in-from-top-2 duration-200',
            isLight
              ? 'bg-[#FAF9F6]/98 border-[#E5E2DC] text-[#1A1B3A]'
              : 'bg-[#0E101A]/98 border-white/15 text-white'
          )}
        >
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  handleNavClick(e, link.href);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  'px-3 py-2 rounded-md font-mono text-[12px] uppercase tracking-wider flex items-center gap-2 transition-colors',
                  isLight
                    ? 'hover:bg-[#EAE6DE] text-[#2D2E4E]'
                    : 'hover:bg-white/10 text-white/80'
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-star-gold" />
                <span>{link.label}</span>
              </a>
            ))}
          </div>

          <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsMethodologyModalOpen(true);
              }}
              className="font-mono text-[11px] text-star-gold flex items-center gap-1.5 py-1 px-2 cursor-pointer"
            >
              <BookOpen size={12} />
              <span>Methodology</span>
            </button>

            <a
              href="#download"
              onClick={(e) => {
                handleNavClick(e, '#download');
                setIsMobileMenuOpen(false);
              }}
              className="font-mono text-[11px] text-star-gold flex items-center gap-1.5 py-1 px-2 cursor-pointer"
            >
              <FileUp size={12} />
              <span>Corpus Download</span>
            </a>
          </div>
        </div>
      )}

      {/* Quick Search Modal */}
      {isSearchModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
          onClick={() => setIsSearchModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-[#0E101A] border border-star-gold/30 rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsSearchModalOpen(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            <div className="mb-4">
              <span className="font-mono text-[10px] uppercase tracking-wider text-star-gold">
                Universal Research Navigator
              </span>
              <h3 className="font-serif text-xl text-white mt-1">
                Explore Any Scientific Field Live
              </h3>
              <p className="font-mono text-xs text-white/60 mt-1">
                Live search across OpenAlex&apos;s 250M+ research corpus with automated citation graphs and gap detection.
              </p>
            </div>
            <TopicSearchBar
              variant="hero"
              onSuccess={() => {
                setIsSearchModalOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        </div>
      )}

    </nav>

    {/* Stage 1 Modals */}
    <ProPricingModal
      isOpen={isPricingModalOpen}
      onClose={() => setIsPricingModalOpen(false)}
      topicTitle={config.domainName || config.domain || config.title}
    />
    <MethodologyModal
      isOpen={isMethodologyModalOpen}
      onClose={() => setIsMethodologyModalOpen(false)}
    />
    <ShareModal
      isOpen={isShareModalOpen}
      onClose={() => setIsShareModalOpen(false)}
      topicTitle={config.domainName || config.domain || config.title}
    />
    <SavedPapersModal
      isOpen={isSavedModalOpen}
      onClose={() => setIsSavedModalOpen(false)}
    />
    <AiCopilotModal
      isOpen={isAiModalOpen}
      onClose={() => setIsAiModalOpen(false)}
    />
  </>
);
}

