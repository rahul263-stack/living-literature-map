import { useState } from 'react';
import { X, Check, Copy, Share2, Twitter, Linkedin, ExternalLink } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicTitle?: string;
}

export default function ShareModal({ isOpen, onClose, topicTitle }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'http://localhost:3000/';
  const title = topicTitle || 'Living Literature Map';
  const shareText = `Explore this interactive 3D literature map on "${title}" with automated schools of thought, structural holes, and research gaps:`;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleLinkedInShare = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#0B0D17] border border-white/20 rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/50 hover:text-white transition-colors cursor-pointer p-1"
        >
          <X size={18} />
        </button>

        <div className="mb-5">
          <div className="inline-flex items-center gap-1 text-star-gold font-mono text-[10px] uppercase tracking-wider mb-1">
            <Share2 size={12} />
            <span>Collaboration &amp; Sharing</span>
          </div>
          <h3 className="font-serif text-xl text-white font-bold">
            Share Scientific Constellation
          </h3>
          <p className="font-mono text-xs text-white/60 mt-1">
            Share this living literature map with co-authors, thesis advisors, or your research lab.
          </p>
        </div>

        {/* Copy Link Input */}
        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-black/60 border border-white/15 mb-5">
          <input
            type="text"
            readOnly
            value={currentUrl}
            className="flex-1 bg-transparent px-2.5 font-mono text-xs text-white/90 focus:outline-none"
          />
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs font-semibold transition-all ${
              copied
                ? 'bg-emerald-500 text-white'
                : 'bg-star-gold hover:bg-star-gold-light text-black cursor-pointer'
            }`}
          >
            {copied ? (
              <>
                <Check size={14} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Social Shares */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={handleTwitterShare}
            className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white font-mono text-xs transition-colors cursor-pointer"
          >
            <Twitter size={15} className="text-sky-400" />
            <span>Share on X</span>
          </button>
          <button
            onClick={handleLinkedInShare}
            className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white font-mono text-xs transition-colors cursor-pointer"
          >
            <Linkedin size={15} className="text-blue-400" />
            <span>Share on LinkedIn</span>
          </button>
        </div>

        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-white/40 font-mono text-[10px]">
          <span>Direct deep-link to current research domain</span>
          <span className="flex items-center gap-1">
            <span>Public Access</span>
            <ExternalLink size={10} />
          </span>
        </div>
      </div>
    </div>
  );
}
