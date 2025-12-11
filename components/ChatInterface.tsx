import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Send, Sparkles, User, Bot, Download, StopCircle, Calculator, FileSearch, BookOpen, Atom, Microscope, Camera } from 'lucide-react';
import { generateMathResponse, chatWithFrame } from '../services/geminiService';
import MathRenderer from './MathRenderer';
import { ChatMessage, AnalysisResult } from '../types';

export interface ChatInterfaceProps {
  analysisContext?: AnalysisResult;
  className?: string;
}

export interface ChatInterfaceRef {
  sendMessage: (text: string) => void;
  analyzeFrame: (base64: string, timestamp: string) => void;
  getMessages: () => ChatMessage[];
}

const QUICK_ACTIONS = [
  { label: "Lecture Breakdown", icon: <BookOpen size={14} /> },
  { label: "Find Papers", icon: <FileSearch size={14} /> },
  { label: "Main Theorem", icon: <Calculator size={14} /> },
  { label: "Physics Connection", icon: <Atom size={14} /> },
  { label: "Deep Research", icon: <Microscope size={14} /> }
];

const ChatInterface = forwardRef<ChatInterfaceRef, ChatInterfaceProps>(({ analysisContext, className = '' }, ref) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello. I'm MathBridge Intelligence. I can help you explore theorems, proofs, and papers. How can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    sendMessage: (text: string) => {
      handleSend(text);
    },
    analyzeFrame: (base64: string, timestamp: string) => {
      handleFrameAnalysis(base64, timestamp);
    },
    getMessages: () => messages
  }));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare history text for context
      const historyText = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`);
      
      // Inject context if available
      let promptToSend = text;
      
      if (analysisContext) {
        if (messages.length === 1) {
          // First interaction: Full context injection including timeline
          const contextStr = `
          Context: Analysis of video.
          Summary: ${analysisContext.summary || 'N/A'}
          Timeline: ${analysisContext.timeline.map(t => t.timestamp + ': ' + t.description).join('; ')}
          `;
          promptToSend = `${contextStr}\n\nUser Question: ${text}`;
        } else {
          // Subsequent interactions: Brief context to maintain awareness without token bloat
          const contextStr = `[Video Context: ${analysisContext.summary || 'Analysis available'}]`;
          promptToSend = `${contextStr}\n\nUser Question: ${text}`;
        }
      }

      const responseText = await generateMathResponse(promptToSend, historyText);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I'm having trouble connecting to the intelligence engine right now. Please check your API key or try again later.",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFrameAnalysis = async (base64: string, timestamp: string) => {
    if (isLoading) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: `Captured frame at ${timestamp}`,
      attachment: base64,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const responseText = await chatWithFrame(
        base64, 
        messages, 
        "Analyze the mathematical content in this frame. Extract formulas (latex), identify theorems, and explain the concept visible on the board/slide.", 
        timestamp
      );

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
       const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I encountered an error analyzing the video frame. Please try again.",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const markdown = messages.map(m => `**${m.role.toUpperCase()}**: ${m.text}\n`).join('\n---\n');
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mathbridge-chat.md';
    a.click();
    // Cleanup blob URL after download starts
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h2 className="font-semibold text-gray-800">Research Assistant</h2>
          <span className="ml-2 text-[10px] font-medium px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full border border-blue-200">Gemini 3 Pro</span>
        </div>
        <button 
          onClick={handleExport}
          className="text-gray-400 hover:text-gray-700 transition-colors p-1.5 hover:bg-gray-100 rounded-md" 
          title="Export Chat"
        >
          <Download size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm
              ${msg.role === 'user' ? 'bg-gray-200 text-gray-600' : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'}
            `}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`
              max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm
              ${msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-sm' 
                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'}
              ${msg.isError ? 'bg-red-50 border-red-200 text-red-800' : ''}
            `}>
              {msg.attachment && (
                <div className="mb-3 rounded-lg overflow-hidden border border-white/20">
                  <img src={msg.attachment} alt="Frame Capture" className="max-w-full h-auto" />
                  <div className="bg-black/20 text-xs py-1 px-2 flex items-center gap-1 text-white/90 backdrop-blur-sm">
                    <Camera size={12} /> Video Frame
                  </div>
                </div>
              )}
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap">{msg.text}</p>
              ) : (
                <MathRenderer text={msg.text} />
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
               <Sparkles size={16} className="text-white animate-pulse" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl px-5 py-3.5 shadow-sm rounded-tl-sm">
              <div className="flex space-x-1.5 items-center h-5">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100 space-y-3">
        {/* Quick Actions */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {QUICK_ACTIONS.map((action, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(action.label)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 border border-gray-200 hover:border-blue-200 rounded-full text-xs font-medium transition-colors whitespace-nowrap"
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>

        {/* Input Field */}
        <div className="relative flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all shadow-inner">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about a theorem, proof, or paper..."
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-2.5 px-2 text-gray-800 placeholder-gray-400 font-sans"
            rows={1}
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-[1px] shadow-sm active:scale-95"
          >
            {isLoading ? <StopCircle size={18} /> : <Send size={18} />}
          </button>
        </div>
        
        <div className="text-center">
          <p className="text-[10px] text-gray-400">
            AI can make mistakes. Please verify important information.
          </p>
        </div>
      </div>
    </div>
  );
});

export default ChatInterface;