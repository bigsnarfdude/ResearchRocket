import React, { useState } from 'react';
import { Bridge, TermMapping } from '../types';
import { PlayCircle, Info } from 'lucide-react';

interface BridgeDiagramProps {
  bridges: Bridge[];
  mappings: TermMapping[];
  isVisible?: boolean;
  videoUrl?: string;
}

const BridgeDiagram: React.FC<BridgeDiagramProps> = ({ 
  bridges, 
  mappings, 
  isVisible = true,
  videoUrl
}) => {
  const [hoveredMappingId, setHoveredMappingId] = useState<string | null>(null);

  if (!isVisible) return null;

  // Group terms for display (simplistic approach: just list pairs)
  // In a complex graph, we'd use D3 or ReactFlow. Here we use a custom SVG overlay.
  const ROW_HEIGHT = 64;

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          Concept Map
        </h3>
        {videoUrl && (
           <a 
             href={videoUrl} 
             target="_blank" 
             rel="noreferrer"
             className="text-xs flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium px-3 py-1 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
           >
             <PlayCircle size={14} />
             Watch Source
           </a>
        )}
      </div>

      <div className="relative p-6 min-h-[300px] flex justify-between select-none">
        
        {/* Connection Lines Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
           {mappings.map((mapping, idx) => {
             const isHovered = hoveredMappingId === mapping.id;
             const isDimmed = hoveredMappingId !== null && !isHovered;
             const y = 80 + (idx * ROW_HEIGHT); // 24px padding top + centered in row
             
             return (
               <path
                 key={mapping.id}
                 d={`M 180 ${y} C 250 ${y}, 350 ${y}, 420 ${y}`} // Simple cubic bezier for fixed width container assumption
                 fill="none"
                 stroke={isHovered ? '#3b82f6' : '#e5e7eb'}
                 strokeWidth={isHovered ? 3 : 1.5}
                 className="transition-all duration-300"
                 // Dynamic coords would require refs, assuming simpler fixed layout for demo
                 vectorEffect="non-scaling-stroke"
               />
             );
           })}
        </svg>

        {/* Left Column: Field A */}
        <div className="w-1/3 space-y-4 z-20">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
            {bridges[0]?.fieldA || 'Domain A'}
          </div>
          {mappings.map((mapping, idx) => (
             <div 
               key={`a-${mapping.id}`}
               onMouseEnter={() => setHoveredMappingId(mapping.id)}
               onMouseLeave={() => setHoveredMappingId(null)}
               className={`
                 h-12 flex items-center px-4 bg-white border rounded-lg shadow-sm transition-all duration-200 cursor-default
                 ${hoveredMappingId === mapping.id ? 'border-blue-500 text-blue-700 bg-blue-50 shadow-md scale-[1.02]' : 'border-gray-200 text-gray-700 hover:border-gray-300'}
                 ${hoveredMappingId !== null && hoveredMappingId !== mapping.id ? 'opacity-40' : 'opacity-100'}
               `}
               style={{ marginBottom: '16px' }} // Matches spacing for fixed height calc
             >
               <span className="text-sm font-medium truncate">{mapping.termA}</span>
             </div>
          ))}
        </div>

        {/* Right Column: Field B */}
        <div className="w-1/3 space-y-4 z-20 flex flex-col items-end">
           <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 w-full text-right">
            {bridges[0]?.fieldB || 'Domain B'}
          </div>
           {mappings.map((mapping, idx) => (
             <div 
               key={`b-${mapping.id}`}
               onMouseEnter={() => setHoveredMappingId(mapping.id)}
               onMouseLeave={() => setHoveredMappingId(null)}
               className={`
                 h-12 w-full flex items-center justify-end px-4 bg-white border rounded-lg shadow-sm transition-all duration-200 cursor-default
                 ${hoveredMappingId === mapping.id ? 'border-blue-500 text-blue-700 bg-blue-50 shadow-md scale-[1.02]' : 'border-gray-200 text-gray-700 hover:border-gray-300'}
                 ${hoveredMappingId !== null && hoveredMappingId !== mapping.id ? 'opacity-40' : 'opacity-100'}
               `}
               style={{ marginBottom: '16px' }}
             >
               <div className="flex items-center gap-2">
                 <span className="text-sm font-medium truncate">{mapping.termB}</span>
                 {hoveredMappingId === mapping.id && (
                    <Info size={14} className="text-blue-400 animate-pulse" />
                 )}
               </div>
             </div>
          ))}
        </div>

        {/* Tooltip Layer */}
        {hoveredMappingId && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-2 w-48 z-30 pointer-events-none">
            <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl opacity-90 backdrop-blur-sm">
               {mappings.find(m => m.id === hoveredMappingId)?.explanation}
            </div>
            <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1 opacity-90" />
          </div>
        )}

      </div>
    </div>
  );
};

export default BridgeDiagram;