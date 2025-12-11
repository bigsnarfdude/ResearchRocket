import React from 'react';
import { TimelineEvent } from '../types';
import { Clock, MessageSquare } from 'lucide-react';
import MathRenderer from './MathRenderer';

interface TimelineProps {
  events: TimelineEvent[];
  isLoading?: boolean;
  onDiscuss?: (event: TimelineEvent) => void;
}

const Timeline: React.FC<TimelineProps> = ({ events, isLoading = false, onDiscuss }) => {
  if (isLoading) {
    return (
      <div className="space-y-8 pl-4 border-l-2 border-gray-100 ml-3 py-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="relative">
            <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-gray-200 ring-4 ring-white" />
            <div className="space-y-2">
              <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
              <div className="h-20 w-full bg-gray-50 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <Clock className="mx-auto h-8 w-8 text-gray-300 mb-2" />
        <p>No timeline data available for this content.</p>
      </div>
    );
  }

  return (
    <div className="relative border-l-2 border-gray-200 ml-3 space-y-8 py-2">
      {events.map((event, index) => (
        <div key={event.id || index} className="group relative pl-6">
          {/* Timeline Dot */}
          <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-gray-300 ring-4 ring-white group-hover:bg-blue-500 transition-colors" />

          {/* Content Container */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-green-50 text-green-700 border border-green-100">
                <Clock size={10} />
                {event.timestamp}
              </span>
              
              <button
                onClick={() => onDiscuss && onDiscuss(event)}
                className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded"
              >
                <MessageSquare size={12} />
                Discuss
              </button>
            </div>

            <div className="text-gray-800 text-sm leading-relaxed">
              <MathRenderer text={event.description} />
            </div>

            {event.math && (
              <div className="mt-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm overflow-x-auto">
                <MathRenderer text={event.math} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;