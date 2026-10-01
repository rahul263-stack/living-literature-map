import { useState, type FormEvent } from 'react';
import { Search, Sparkles, Loader2, ArrowRight, BookOpen, AlertCircle } from 'lucide-react';
import { useLiteratureMap } from '@/context/LiteratureMapContext';
import { cn } from '@/lib/utils';

interface TopicSearchBarProps {
  variant?: 'hero' | 'compact' | 'upload';
  className?: string;
  showPopular?: boolean;
  onSuccess?: () => void;
}

const POPULAR_TOPICS = [
  { label: 'CRISPR Cas9', icon: '🧬', query: 'CRISPR Cas9 gene editing' },
  { label: 'Quantum Error Correction', icon: '⚛️', query: 'Quantum error correction fault tolerance' },
  { label: 'LLM Alignment & RLHF', icon: '🤖', query: 'Large language model alignment reinforcement learning' },
  { label: 'Perovskite Solar Cells', icon: '☀️', query: 'Perovskite solar cells efficiency stability' },
  { label: 'CAR-T Cell Therapy', icon: '🔬', query: 'CAR-T cell immunotherapy oncology' },
  { label: 'Topological Quantum Matter', icon: '🪐', query: 'Topological insulators quantum computing' },
];

export default function TopicSearchBar({
  variant = 'hero',
  className,
  showPopular = true,
  onSuccess,
}: TopicSearchBarProps) {
  const [query, setQuery] = useState('');
  const {
    generateLiveTopicMap,
    isGeneratingTopic,
    generationProgress,
    generationError,
  } = useLiteratureMap();

  const handleSubmit = async (e?: FormEvent, selectedTopic?: string) => {
    if (e) e.preventDefault();
    const searchTarget = selectedTopic || query;
    if (!searchTarget.trim() || isGeneratingTopic) return;

    await generateLiveTopicMap(searchTarget);
    // Only close/callback on success — generationError will be set on failure
    if (onSuccess && !generationError) {
      setQuery('');
      onSuccess();
    }
  };

  const isHero = variant === 'hero';

  return (
    <div
      className={cn(
        'w-full transition-all duration-300',
        isHero ? 'max-w-2xl mx-auto' : 'max-w-full',
        className
      )}
    >
      {/* Search Input Bar */}
      <form
        onSubmit={handleSubmit}
        className={cn(
          'relative flex items-center transition-all duration-200 rounded-full border',
          isHero
            ? 'bg-[#0E101A]/80 border-star-gold/30 hover:border-star-gold/60 focus-within:border-star-gold focus-within:shadow-[0_0_24px_rgba(212,168,83,0.25)] backdrop-blur-xl p-1.5'
            : 'bg-white/90 border-[#D8D4CC] hover:border-[#B89A4A] focus-within:border-[#B89A4A] focus-within:shadow-md p-1 text-[#1A1B3A]'
        )}
      >
        <div className="pl-3.5 pr-2 shrink-0 flex items-center justify-center">
          {isGeneratingTopic ? (
            <Loader2
              className={cn(
                'w-5 h-5 animate-spin',
                isHero ? 'text-star-gold' : 'text-[#B8860B]'
              )}
            />
          ) : (
            <Search
              className={cn(
                'w-5 h-5',
                isHero ? 'text-star-gold/80' : 'text-[#5A5C7A]'
              )}
            />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            isHero
              ? 'Explore any field: enter a research topic (e.g. CRISPR, Quantum Codes, LLM Alignment)...'
              : 'Search OpenAlex 250M+ papers on any research topic...'
          }
          disabled={isGeneratingTopic}
          className={cn(
            'w-full bg-transparent px-2 py-2 font-mono text-[13px] md:text-[14px] outline-none placeholder:text-opacity-40 disabled:opacity-50 transition-colors',
            isHero
              ? 'text-white placeholder:text-white/40'
              : 'text-[#1A1B3A] placeholder:text-[#8B8DA3]'
          )}
        />

        <button
          type="submit"
          disabled={!query.trim() || isGeneratingTopic}
          className={cn(
            'shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full font-mono text-[12px] font-medium tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
            isHero
              ? 'bg-gradient-to-r from-[#D4A853] to-[#B88A36] text-[#0A0C14] hover:shadow-[0_0_16px_rgba(212,168,83,0.4)] active:scale-95'
              : 'bg-[#1A1B3A] text-white hover:bg-[#2A2B4A] active:scale-95'
          )}
        >
          {isGeneratingTopic ? (
            <span>Synthesizing...</span>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Synthesize Map</span>
              <span className="sm:hidden">Search</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Progress / Status banner */}
      {isGeneratingTopic && (
        <div className="mt-3 px-4 py-2.5 rounded-lg bg-black/60 border border-star-gold/20 backdrop-blur-md flex items-center gap-3 animate-pulse">
          <div className="w-2.5 h-2.5 rounded-full bg-star-gold animate-ping shrink-0" />
          <p className="font-mono text-[12px] text-star-gold/90 truncate">
            {generationProgress || 'Synthesizing global research literature map...'}
          </p>
        </div>
      )}

      {/* Error Notice */}
      {generationError && (
        <div className="mt-3 px-4 py-2.5 rounded-lg bg-red-950/40 border border-red-500/30 flex items-center gap-2.5 text-red-200 font-mono text-[12px]">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="flex-1">{generationError}</span>
        </div>
      )}

      {/* Quick Topic Suggestions */}
      {(isHero || variant === 'upload') && showPopular && !isGeneratingTopic && (
        <div className={cn('mt-3.5 flex flex-wrap items-center gap-1.5', isHero ? 'justify-center' : 'justify-start')}>
          <span className={cn('font-mono text-[11px] uppercase tracking-wider mr-1 flex items-center gap-1', isHero ? 'text-white/40' : 'text-[#8B8DA3]')}>
            <BookOpen className="w-3 h-3" /> Popular:
          </span>
          {POPULAR_TOPICS.map((topic) => (
            <button
              key={topic.label}
              type="button"
              onClick={() => {
                setQuery(topic.query);
                handleSubmit(undefined, topic.query);
              }}
              className={cn(
                'px-2.5 py-1 rounded-full font-mono text-[11px] transition-all duration-150 flex items-center gap-1 cursor-pointer border',
                isHero
                  ? 'bg-white/[0.04] hover:bg-white/[0.12] border-white/[0.08] hover:border-star-gold/40 text-white/70 hover:text-white'
                  : 'bg-white hover:bg-[#F4F1EA] border-[#DCD7CE] hover:border-[#B89A4A] text-[#1A1B3A] shadow-xs'
              )}
            >
              <span>{topic.icon}</span>
              <span>{topic.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
