import { useState } from 'react';
import { X, Check, Sparkles, Zap, Shield, ArrowRight } from 'lucide-react';

interface ProPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicTitle?: string;
}

export default function ProPricingModal({ isOpen, onClose, topicTitle }: ProPricingModalProps) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;

    try {
      const existing = JSON.parse(localStorage.getItem('litmap_waitlist_emails') || '[]');
      if (!existing.includes(email)) {
        existing.push({ email, date: new Date().toISOString(), topic: topicTitle || 'General' });
        localStorage.setItem('litmap_waitlist_emails', JSON.stringify(existing));
      }
    } catch {
      // fallback
    }

    setIsSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-[#0B0D17] border border-star-gold/40 rounded-2xl p-6 md:p-8 shadow-[0_0_60px_rgba(212,168,83,0.18)] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/50 hover:text-white transition-colors cursor-pointer p-1"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-star-gold/15 border border-star-gold/40 font-mono text-[10px] uppercase tracking-wider text-star-gold mb-3">
            <Sparkles size={12} />
            <span>Stage 1 Early Access · 50% Off Lifetime</span>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl text-white font-bold tracking-tight">
            Accelerate Your Scientific Discovery
          </h2>
          <p className="font-mono text-xs text-white/70 mt-2 leading-relaxed">
            Turn months of manual literature searching into 10 seconds of structural clarity. Built for PhD researchers, principal investigators, and deep-tech labs.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center gap-2 mt-4 p-1 rounded-full bg-white/5 border border-white/10 font-mono text-xs">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1 rounded-full transition-all ${
                billingCycle === 'monthly' ? 'bg-white/15 text-white font-semibold' : 'text-white/60 hover:text-white'
              }`}
            >
              Monthly ($24/mo)
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
                billingCycle === 'yearly' ? 'bg-star-gold text-black font-semibold shadow-md' : 'text-white/60 hover:text-white'
              }`}
            >
              <span>Yearly ($12/mo)</span>
              <span className="text-[9px] bg-black/20 px-1.5 py-0.2 rounded-full">Save 50%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Free Tier */}
          <div className="rounded-xl p-5 bg-white/[0.03] border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-serif text-lg text-white font-semibold">Academic Free</h3>
                <span className="font-mono text-xs text-white/50">$0 / forever</span>
              </div>
              <p className="font-mono text-[11px] text-white/60 mb-4">
                Essential tools for exploring seminal knowledge maps and systematic review structures.
              </p>
              <ul className="space-y-2 font-mono text-xs text-white/80">
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>3 Live OpenAlex searches per day (up to 100 papers)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>Interactive 3D constellation &amp; Louvain cluster navigator</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>PRISMA 2020 systematic review flow diagram</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>Basic .DOCX &amp; BibTeX export</span>
                </li>
              </ul>
            </div>
            <button
              onClick={onClose}
              className="mt-6 w-full py-2 px-3 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 font-mono text-xs text-white/80 transition-colors"
            >
              Current Active Plan
            </button>
          </div>

          {/* Pro Scientist Tier */}
          <div className="rounded-xl p-5 bg-gradient-to-b from-star-gold/15 to-transparent border border-star-gold/50 relative shadow-[0_0_30px_rgba(212,168,83,0.12)] flex flex-col justify-between">
            <div className="absolute -top-2.5 right-4 bg-star-gold text-black font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow">
              Most Popular
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-serif text-lg text-star-gold font-semibold flex items-center gap-1.5">
                  <Zap size={16} />
                  <span>Pro Scientist</span>
                </h3>
                <div className="text-right">
                  <span className="font-mono text-xl text-white font-bold">
                    {billingCycle === 'yearly' ? '$12' : '$24'}
                  </span>
                  <span className="font-mono text-[10px] text-white/60"> / mo</span>
                </div>
              </div>
              <p className="font-mono text-[11px] text-white/70 mb-4">
                Supercharge literature reviews, grant proposals, and competitive landscape intelligence.
              </p>
              <ul className="space-y-2 font-mono text-xs text-white">
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-star-gold shrink-0 mt-0.5" />
                  <span className="font-semibold">Unlimited Deep Searches (up to 500+ papers)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-star-gold shrink-0 mt-0.5" />
                  <span>Automated 15-page Literature Review document (.docx &amp; LaTeX)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-star-gold shrink-0 mt-0.5" />
                  <span>Drag-and-Drop Private PDF Folder Ingestion</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-star-gold shrink-0 mt-0.5" />
                  <span>Real-time citation alerts for emerging bridge papers</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-star-gold shrink-0 mt-0.5" />
                  <span>High-res 300 DPI vector charts for journal publication</span>
                </li>
              </ul>
            </div>

            {/* Email Early Access Form */}
            <div className="mt-6">
              {isSubmitted ? (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-center font-mono text-xs text-emerald-300">
                  🎉 You&apos;re on the VIP waitlist! 50% early bird code reserved.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter academic or work email"
                    className="flex-1 bg-black/60 border border-white/20 rounded-lg px-3 py-2 font-mono text-xs text-white placeholder-white/40 focus:outline-none focus:border-star-gold"
                  />
                  <button
                    type="submit"
                    className="bg-star-gold hover:bg-star-gold-light text-black font-mono text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shrink-0 transition-colors shadow-md"
                  >
                    <span>Get Access</span>
                    <ArrowRight size={13} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10 font-mono text-[11px] text-white/50">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-star-gold" />
            <span>Institutional billing, grants &amp; university invoices supported</span>
          </div>
          <div>
            <span>Cancel anytime &bull; 14-day money-back guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
}
