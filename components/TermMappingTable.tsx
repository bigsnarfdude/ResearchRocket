import React from 'react';
import { TermMapping } from '../types';
import { MessageSquarePlus, ChevronRight } from 'lucide-react';
import MathRenderer from './MathRenderer';

interface TermMappingTableProps {
  mappings: TermMapping[];
  isLoading?: boolean;
  onTermClick?: (mapping: TermMapping) => void;
}

const TermMappingTable: React.FC<TermMappingTableProps> = ({ 
  mappings, 
  isLoading = false,
  onTermClick 
}) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <div className="col-span-4">Term A</div>
        <div className="col-span-1 flex justify-center">↔</div>
        <div className="col-span-4">Term B</div>
        <div className="col-span-3 text-right">Action</div>
      </div>

      <div className="divide-y divide-gray-100">
        {mappings.map((mapping) => (
          <div 
            key={mapping.id} 
            className="group hover:bg-blue-50/50 transition-colors"
          >
            <div className="grid grid-cols-12 gap-4 p-4 items-start">
              <div className="col-span-4">
                <div className="font-medium text-gray-900 font-serif">
                    <MathRenderer text={mapping.termA} />
                </div>
              </div>
              
              <div className="col-span-1 flex justify-center text-gray-300 group-hover:text-blue-400 transition-colors pt-1">
                <ChevronRight size={16} />
              </div>
              
              <div className="col-span-4">
                <div className="font-medium text-gray-900 font-serif">
                    <MathRenderer text={mapping.termB} />
                </div>
              </div>

              <div className="col-span-3 flex justify-end">
                <button
                  onClick={() => onTermClick && onTermClick(mapping)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  title="Discuss this term"
                >
                  <MessageSquarePlus size={18} />
                </button>
              </div>
            </div>
            
            <div className="px-4 pb-4 pl-4 col-span-12">
               <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100 group-hover:border-blue-100 group-hover:bg-white transition-colors">
                  <span className="font-medium text-gray-700 text-xs uppercase mb-1 block">Explanation</span>
                  <MathRenderer text={mapping.explanation} />
               </p>
            </div>
          </div>
        ))}
        
        {mappings.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No specific term mappings identified for this bridge.
          </div>
        )}
      </div>
    </div>
  );
};

export default TermMappingTable;