import {
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Share2,
  Lock,
} from "lucide-react";

interface GuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const Guide = ({ isOpen, onClose }: GuideProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl h-[85vh] bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all z-10"
        >
          <X size={20} />
        </button>

        {/* Content Container */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Intro */}
          <div className="w-1/3 p-10 bg-gradient-to-br from-indigo-950/50 to-zinc-950 flex flex-col justify-center border-r border-zinc-900">
            <div className="mb-6 p-3 bg-gradient-to-br from-amber-500 to-amber-600 w-fit rounded-xl shadow-lg shadow-amber-500/20">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-mistral-bg"
              >
                <circle cx="4" cy="18" r="2" />
                <circle cx="12" cy="6" r="2" />
                <circle cx="20" cy="18" r="2" />
                <path d="M4 18L12 6L20 18" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Master Your Arguments
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-8">
              TraceGraph uses AI to decompose complex texts into logical
              dependency graphs, verifying each claim against the prompt's
              context.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-400">
                  1
                </div>
                <span>Paste your text or argument</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-400">
                  2
                </div>
                <span>AI maps the logical structure</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-400">
                  3
                </div>
                <span>claims are verified in real-time</span>
              </div>
            </div>
          </div>

          {/* Right Panel: Legend & Details */}
          <div className="flex-1 p-10 overflow-y-auto bg-zinc-950/50">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
              Graph Legend
            </h3>

            <div className="grid grid-cols-2 gap-8 mb-10">
              {/* Nodes */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">
                  Node Types
                </h4>

                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full bg-indigo-500 mt-1 shadow shadow-indigo-500/50"></div>
                  <div>
                    <h5 className="text-sm font-bold text-white">Claim</h5>
                    <p className="text-xs text-zinc-400 mt-1">
                      A central assertion or argument point.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 mt-1 shadow shadow-emerald-500/50"></div>
                  <div>
                    <h5 className="text-sm font-bold text-white">Evidence</h5>
                    <p className="text-xs text-zinc-400 mt-1">
                      Facts or data supporting a claim.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full bg-amber-500 mt-1 shadow shadow-amber-500/50"></div>
                  <div>
                    <h5 className="text-sm font-bold text-white">Axiom</h5>
                    <p className="text-xs text-zinc-400 mt-1">
                      Unquestioned assumption or premise.
                    </p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">
                  Verification Status
                </h4>

                <div className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-emerald-500" />
                  <div>
                    <h5 className="text-sm font-bold text-white">Verified</h5>
                    <p className="text-xs text-zinc-400 mt-1">
                      AI confirmed this claim is supported by the text.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <XCircle size={20} className="text-rose-500" />
                  <div>
                    <h5 className="text-sm font-bold text-white">Refuted</h5>
                    <p className="text-xs text-zinc-400 mt-1">
                      AI found this claim contradicts the text.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-amber-500" />
                  <div>
                    <h5 className="text-sm font-bold text-white">Uncertain</h5>
                    <p className="text-xs text-zinc-400 mt-1">
                      Logic is unclear or ambiguous.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-zinc-800">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                Interaction Tips
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-zinc-400">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <strong className="text-white block mb-1">Hover Node</strong>
                  View detailed reasoning and confidence score.
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <strong className="text-white block mb-1">Lock View</strong>
                  Toggle the <Lock size={12} className="inline mx-1" /> button
                  to freeze panning.
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <strong className="text-white block mb-1">Share</strong>
                  Click <Share2 size={12} className="inline mx-1" /> to copy the
                  graph link (soon).
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <strong className="text-white block mb-1">Zoom/Fit</strong>
                  Use floating controls to navigate large graphs.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Guide;
