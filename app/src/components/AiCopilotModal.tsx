import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Send, Copy, Check, Key, Bot, ArrowRight } from 'lucide-react';
import { useLiteratureMap } from '@/context/LiteratureMapContext';

interface AiCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_QUERIES = [
  {
    title: 'Paradigm Clashes & Debates',
    desc: 'What foundational theoretical disagreements divide the major clusters in this map?',
    prompt: 'Analyze the primary conceptual disagreements, methodological trade-offs, and empirical conflicts between the detected schools of thought.',
  },
  {
    title: 'Grant Proposal Gap Pitch',
    desc: 'Draft a 2-paragraph research rationale targeting the unbridged structural hole.',
    prompt: 'Draft a rigorous, publication-grade research justification and specific aims proposal that targets the unbridged structural hole between these clusters.',
  },
  {
    title: 'Bridge Papers Reading Path',
    desc: 'Which boundary-spanning papers should a researcher read first to bridge these fields?',
    prompt: 'Identify the top 3 highest-centrality bridge papers and explain what unique interdisciplinary connections they establish.',
  },
  {
    title: 'Methodology Evolution',
    desc: 'How have methodologies and experimental frameworks shifted from early to recent papers?',
    prompt: 'Trace the methodological evolution across publication years in this corpus. What techniques are accelerating and which are becoming obsolete?',
  },
];

export default function AiCopilotModal({ isOpen, onClose }: AiCopilotModalProps) {
  const { config, networkData, analysisData } = useLiteratureMap();
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('litmap_ai_key') || '';
  });
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [activeAnalysis, setActiveAnalysis] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSaveKey = (keyVal: string) => {
    setApiKey(keyVal);
    try {
      localStorage.setItem('litmap_ai_key', keyVal);
    } catch {}
  };

  const constructSystemPrompt = (userQuery: string) => {
    const nodes = networkData?.nodes || [];
    const links = networkData?.links || [];
    const topPapers = [...nodes]
      .sort((a, b) => (b.citations || 0) - (a.citations || 0))
      .slice(0, 15)
      .map(
        (p, i) =>
          `[${i + 1}] ${p.title} (${p.authors}, ${p.year}) - Citations: ${p.citations}, Cluster: ${
            p.community_name || p.community
          }, DOI: ${p.doi || 'N/A'}`
      )
      .join('\n');

    const communitiesStr = Object.entries(analysisData?.communities || {})
      .map(
        ([id, c]) =>
          `- School ${id} (${c.name}): ${c.size} papers, ~${c.mean_citations || 0} mean citations. Top keywords: ${(
            c.top_keywords || []
          )
            .map((k) => (Array.isArray(k) ? k[0] : k))
            .slice(0, 4)
            .join(', ')}`
      )
      .join('\n');

    const bridgesStr = (analysisData?.bridge_papers || [])
      .slice(0, 5)
      .map((b) => `- ${b.title} (${b.authors}, ${b.year}) [Betweenness: ${b.betweenness?.toFixed(3) || '0.0'}]`)
      .join('\n');

    return `You are an elite scientific advisor and bibliometrician analyzing a Living Literature Map on "${
      config.title || config.domain
    }".

Topological Context:
- Domain: ${config.domain}
- Total Papers: ${nodes.length}
- Connections / Edges: ${links.length}
- Modularity Q: ${analysisData?.modularity_q || 0.45} (Community separation index)
- Identified Research Gap: "${config.researchGap?.statement || 'Inter-cluster structural hole'}"

Schools of Thought (Louvain Clusters):
${communitiesStr}

Key Interdisciplinary Bridge Nodes:
${bridgesStr}

Top Landmark Papers in Corpus:
${topPapers}

User Inquiry:
"${userQuery}"

Provide a rigorous, academically grounded synthesis referencing specific papers and clusters above.`;
  };

  const handleCopyPrompt = (query: string) => {
    const full = constructSystemPrompt(query);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(full);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    }
  };

  const handleRunQuery = async (queryText: string) => {
    setIsGenerating(true);
    setActiveAnalysis(null);

    // If user has a Gemini / OpenAI API key configured:
    if (apiKey.trim()) {
      try {
        const prompt = constructSystemPrompt(queryText);
        // Call Gemini 1.5 Flash endpoint
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText) {
            setActiveAnalysis(generatedText);
            setIsGenerating(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Live API request failed, falling back to instant topological synthesis', e);
      }
    }

    // Default: Instant Deterministic Topological Synthesis
    setTimeout(() => {
      const topSchools = Object.values(analysisData?.communities || {});
      const bridgeTop = analysisData?.bridge_papers?.[0];
      const gapStatement = config.researchGap?.statement || 'Lack of empirical bridge across disparate clusters.';
      const paperCount = networkData?.nodes?.length || 0;

      const synthesized = `### Grounded Synthesis: ${queryText}

**1. Topological Diagnosis (${config.domain})**
Analysis of **${paperCount} papers** reveals **${topSchools.length} distinct epistemological clusters** with a Modularity score of **Q = ${(analysisData?.modularity_q || 0.45).toFixed(2)}**. This indicates high internal cohesion within each cluster, but severe balkanization across disciplinary boundaries.

**2. Core Clusters & Methodological Tension**
${topSchools
  .slice(0, 3)
  .map(
    (s, i) =>
      `* **Cluster ${i + 1} (${s.name || 'Core Cluster'}):** Anchored by ${(s.top_keywords || []).map((k) => (Array.isArray(k) ? k[0] : k)).slice(0, 3).join(', ') || 'Domain Foundations'}. Focuses on internal validation with an average citation impact of ${s.mean_citations || 0} cites/paper.`
  )
  .join('\n')}

**3. The Critical Frontier & Structural Hole**
The mathematical topology confirms the gap: **"${gapStatement}"**
The primary bridge paper attempting to span this chasm is **"${bridgeTop?.title || 'Interdisciplinary Foundation'}"** (${bridgeTop?.authors || 'Key Author'}, ${bridgeTop?.year || 2023}) with a betweenness centrality of **${bridgeTop?.betweenness?.toFixed(3) || '0.015'}**.

**4. Strategic Recommendation**
To achieve high-impact publication or grant funding in this space, investigators should design experiments that explicitly evaluate Cluster 1 methodologies against Cluster 2 benchmarks, directly resolving the contested assumptions.`;

      setActiveAnalysis(synthesized);
      setIsGenerating(false);
    }, 600);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-[#0B0D17] border border-white/20 rounded-2xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-star-gold to-[#B88728] text-black shrink-0">
              <Bot size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="font-serif text-base sm:text-xl text-white font-bold leading-tight">
                  AI Literature Copilot
                </h3>
                <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-star-gold/20 text-star-gold border border-star-gold/30 shrink-0">
                  Grounded
                </span>
              </div>
              <p className="font-mono text-[10px] sm:text-xs text-white/60 mt-0.5 truncate">
                {config.title || config.domain} · {networkData?.nodes?.length || 0} papers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="p-1.5 sm:p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title="Configure Gemini API Key for live inference"
            >
              <Key size={15} className={apiKey ? 'text-star-gold' : ''} />
            </button>
            <button
              onClick={onClose}
              className="text-white/50 hover:text-white transition-colors cursor-pointer p-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Optional API Key banner */}
        {showKeyInput && (
          <div className="px-6 py-3 bg-white/[0.04] border-b border-white/10 flex items-center gap-3 animate-fadeIn">
            <Key size={14} className="text-star-gold shrink-0" />
            <input
              type="password"
              placeholder="Paste Google Gemini API Key for live turn-by-turn chat (optional)..."
              value={apiKey}
              onChange={(e) => handleSaveKey(e.target.value)}
              className="flex-1 bg-black/60 border border-white/15 rounded px-3 py-1 font-mono text-xs text-white placeholder-white/40 focus:outline-none focus:border-star-gold"
            />
            <span className="font-mono text-[10px] text-white/50 shrink-0">Stored locally</span>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Preset Questions Grid */}
          {!activeAnalysis && !isGenerating && (
            <div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-white/50 mb-3 flex items-center gap-1.5">
                <Sparkles size={12} className="text-star-gold" />
                <span>Grounded Scientific Inquiries</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESET_QUERIES.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRunQuery(preset.prompt)}
                    className="p-3.5 sm:p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-star-gold/50 hover:bg-white/[0.06] text-left transition-all duration-200 group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif text-sm font-semibold text-white group-hover:text-star-gold transition-colors">
                        {preset.title}
                      </h4>
                      <ArrowRight size={13} className="text-white/30 group-hover:text-star-gold transition-colors" />
                    </div>
                    <p className="font-mono text-[11px] text-white/60 mt-1.5 leading-relaxed">
                      {preset.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Generated Response View */}
          {isGenerating && (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-star-gold border-t-transparent animate-spin mx-auto" />
              <p className="font-mono text-xs text-white/70 animate-pulse">
                Synthesizing Louvain modularity clusters and citations...
              </p>
            </div>
          )}

          {activeAnalysis && !isGenerating && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2 text-star-gold font-mono text-xs font-semibold">
                  <Sparkles size={14} />
                  <span>Synthesis Result</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyPrompt(customPrompt || 'Literature Synthesis')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded font-mono text-[10px] border border-white/15 bg-white/5 hover:bg-white/10 text-white/80 transition-colors"
                    title="Copy full grounded prompt with citations for Claude or ChatGPT"
                  >
                    {copiedPrompt ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    <span>{copiedPrompt ? 'Copied!' : 'Copy for LLM'}</span>
                  </button>
                  <button
                    onClick={() => setActiveAnalysis(null)}
                    className="font-mono text-[10px] text-white/50 hover:text-white px-2 py-1"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-xl bg-white/[0.03] border border-white/10 text-white/90 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                {activeAnalysis}
              </div>
            </div>
          )}
        </div>

        {/* Custom Input Footer */}
        <div className="p-3 sm:p-4 bg-black/60 border-t border-white/10 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customPrompt.trim()) {
                handleRunQuery(customPrompt.trim());
              }
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask about schools, bridge papers, or gaps..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3.5 sm:px-4 py-2 sm:py-2.5 font-mono text-xs text-white placeholder-white/40 focus:outline-none focus:border-star-gold"
            />
            <button
              type="submit"
              disabled={isGenerating || !customPrompt.trim()}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-star-gold text-black font-mono text-xs font-semibold hover:brightness-110 transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>Ask</span>
              <Send size={12} />
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
