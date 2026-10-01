import { useEffect, useState } from 'react';

interface PageLoaderProps {
  isLoading: boolean;
  onFinish?: () => void;
  customTitle?: string;
  customSubtitle?: string;
}

const EMOJIS = ['🪐', '🧠', '📜', '🔭', '🧬', '💫', '✨'];

const STEPS = [
  { threshold: 15, text: 'Connecting to scientific citation universe...', emoji: '🛰️' },
  { threshold: 35, text: 'Downloading topological & citation graph...', emoji: '🧠' },
  { threshold: 60, text: 'Clustering schools of thought & landmark papers...', emoji: '📜' },
  { threshold: 85, text: 'Calibrating 3D force-directed constellation...', emoji: '🪐' },
  { threshold: 96, text: 'Mapping consensus vectors & research frontiers...', emoji: '💫' },
  { threshold: 100, text: 'Atlas synthesized! Launching interactive view...', emoji: '✨' },
];

const TIPS = [
  'Tip: Click and drag in 3D space to rotate the constellation from any angle.',
  'Tip: Scroll to zoom into individual landmark papers and citation clusters.',
  'Tip: Use the search bar to synthesize any scientific field in real-time.',
  'Tip: Ingest your own BibTeX, CSV, or PDFs in the ingestion center below.',
];

export default function PageLoader({
  isLoading,
  onFinish,
  customTitle = 'Living Literature Map',
  customSubtitle = 'Synthesizing Scientific Constellation & Citation Network',
}: PageLoaderProps) {
  const [progress, setProgress] = useState(12);
  const [emojiIndex, setEmojiIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Cycle emojis
  useEffect(() => {
    const emojiTimer = setInterval(() => {
      setEmojiIndex((prev) => (prev + 1) % EMOJIS.length);
    }, 900);
    return () => clearInterval(emojiTimer);
  }, []);

  // Cycle tips
  useEffect(() => {
    const tipTimer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 3200);
    return () => clearInterval(tipTimer);
  }, []);

  // Progress counter simulation that accelerates to 100% when !isLoading
  useEffect(() => {
    if (isLoading) {
      const progressTimer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 92) return prev;
          const increment = Math.max(1, Math.floor((92 - prev) / 6));
          return Math.min(92, prev + increment);
        });
      }, 180);
      return () => clearInterval(progressTimer);
    } else {
      // Finished loading: quickly animate to 100% and fade out
      setProgress(100);
      const finishTimer = setTimeout(() => {
        setIsFadingOut(true);
        const removeTimer = setTimeout(() => {
          setIsComplete(true);
          onFinish?.();
        }, 700);
        return () => clearTimeout(removeTimer);
      }, 450);
      return () => clearTimeout(finishTimer);
    }
  }, [isLoading, onFinish]);

  if (isComplete) return null;

  const currentStep = STEPS.find((s) => progress <= s.threshold) || STEPS[STEPS.length - 1];

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#05060B] select-none transition-opacity duration-700 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 35%, rgba(212, 168, 83, 0.12) 0%, transparent 55%),
          radial-gradient(circle at 80% 80%, rgba(96, 165, 250, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)
        `,
      }}
    >
      {/* Decorative cosmic glow rings */}
      <div className="absolute w-[450px] h-[450px] rounded-full border border-accent-gold/10 animate-ping opacity-25 pointer-events-none" style={{ animationDuration: '4s' }} />
      <div className="absolute w-[320px] h-[320px] rounded-full border border-blue-500/10 pointer-events-none" />

      <div className="relative flex flex-col items-center max-w-md w-full px-6 text-center z-10">
        {/* Animated Emoji Badge */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-[#16192B] to-[#0A0D1A] border border-accent-gold/30 flex items-center justify-center shadow-[0_0_35px_rgba(212,168,83,0.25)] transition-all duration-300">
            <span
              className="text-4xl transform transition-transform duration-300 inline-block hover:scale-110 select-none animate-pulse"
              key={emojiIndex}
            >
              {EMOJIS[emojiIndex]}
            </span>
          </div>
          {/* Pulsing satellite dot */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-gold opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-accent-gold border-2 border-[#05060B]" />
          </span>
        </div>

        {/* Title & Subtitle */}
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide mb-1 drop-shadow-sm">
          {customTitle}
        </h2>
        <p className="text-xs sm:text-sm text-text-tertiary font-sans mb-7 max-w-xs">
          {customSubtitle}
        </p>

        {/* Percentage Counter Display */}
        <div className="flex items-baseline justify-center gap-1 mb-3">
          <span className="font-mono text-5xl sm:text-6xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">
            {progress}
          </span>
          <span className="font-mono text-2xl font-bold text-accent-gold">%</span>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner mb-4">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#D4A853] via-[#F3DE9C] to-[#60A5FA] transition-all duration-300 ease-out shadow-[0_0_15px_rgba(212,168,83,0.6)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Dynamic Stage Indicator with Emoji */}
        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-text-secondary font-mono tracking-wide mb-8 min-h-[24px]">
          <span className="text-base">{currentStep.emoji}</span>
          <span className="text-text-secondary">{currentStep.text}</span>
        </div>

        {/* Informative Tip Badge */}
        <div className="w-full py-2.5 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
          <p className="text-[11px] sm:text-xs text-text-tertiary font-sans italic transition-opacity duration-300">
            {TIPS[tipIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}
