import React, { useState } from 'react';
import { Bridge } from '../types';
import { ArrowRightLeft, Sparkles, X, Loader2, MessageSquare } from 'lucide-react';
import { getDeepDiveAnalysis } from '../services/geminiService';
import MathRenderer from './MathRenderer';

interface BridgeListProps {
  bridges: Bridge[];
  isLoading?: boolean;
  shouldAnimate?: boolean;
  onSendToChat?: (content: string) => void;
}

const BridgeList: React.FC<BridgeListProps> = ({ bridges, isLoading = false, shouldAnimate = true, onSendToChat }) => {
  const [selectedBridge, setSelectedBridge] = useState<Bridge | null>(null);
  const [analysisContent, setAnalysisContent] = useState<string>("");
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const handleDeepDive = async (bridge: Bridge) => {
    setSelectedBridge(bridge);
    setLoadingAnalysis(true);
    setAnalysisContent("");
    
    try {
      const result = await getDeepDiveAnalysis(bridge);
      setAnalysisContent(result);
    } catch (e) {
      setAnalysisContent("Failed to load analysis. Please try again.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const closeModal = () => {
    setSelectedBridge(null);
    setAnalysisContent("");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!bridges || bridges.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <ArrowRightLeft className="mx-auto h-8 w-8 text-gray-300 mb-2" />
        <p>No cross-domain bridges identified for this lecture.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bridges.map((bridge, idx) => (
        <div 
          key={bridge.id}
          className={`
            bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all
            ${shouldAnimate ? 'animate-fade-in-up' : ''}
          `}
          style={{ animationDelay: `${idx * 100}ms` }}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">
              <span>{bridge.fieldA}</span>
              <ArrowRightLeft size={14} className="text-blue-500" />
              <span>{bridge.fieldB}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {Math.round(bridge.relevanceScore * 100)}% Match
            </div>
          </div>

          <p className="text-gray-800 text-base leading-relaxed mb-4">
            <MathRenderer text={bridge.description} />
          </p>

          <button
            onClick={() => handleDeepDive(bridge)}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors -ml-1"
          >
            <Sparkles size={16} />
            Deep Dive Analysis
          </button>
        </div>
      ))}

      {/* Deep Dive Modal */}
      {selectedBridge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={closeModal}>
          <div 
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden" 
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-serif font-bold text-gray-900">Deep Dive Analysis</h3>
                <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                  {selectedBridge.fieldA} <ArrowRightLeft size={12} /> {selectedBridge.fieldB}
                </p>
              </div>
              <button 
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              {loadingAnalysis ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                  <p className="text-gray-500 animate-pulse">Consulting the intelligence engine...</p>
                </div>
              ) : (
                <div className="prose prose-blue max-w-none">
                  <MathRenderer text={analysisContent} />
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between">
              {onSendToChat && analysisContent && !loadingAnalysis ? (
                <button
                  onClick={() => {
                    onSendToChat(`Continue discussing this deep dive analysis:\n\n${analysisContent}`);
                    closeModal();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <MessageSquare size={16} />
                  Send to Chat
                </button>
              ) : <div />}
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BridgeList;
