
import React, { useState, useRef, useEffect } from 'react';
import { AppMode, ViewMode, AnalysisResult, Bridge, TermMapping, TimelineEvent } from './types';
import { MOCK_CATALOG } from './data/mockCatalog';
import DiscoveryInterface from './components/DiscoveryInterface';
import BridgeList from './components/BridgeList';
import BridgeDiagram from './components/BridgeDiagram';
import Timeline from './components/Timeline';
import ChatInterface, { ChatInterfaceRef } from './components/ChatInterface';
import TermMappingTable from './components/TermMappingTable';
import VideoPlayer from './components/VideoPlayer';
import { analyzeLecture, generateMathResponse, analyzeVideoFile, generateTranscript } from './services/geminiService';
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Layout, 
  MessageSquare, 
  Share2, 
  Sparkles, 
  Video, 
  Maximize2,
  ChevronRight,
  X,
  Loader2,
  MapPin,
  Calendar,
  BookOpen,
  Upload,
  PanelRightOpen,
  PanelRightClose,
  Lightbulb,
  Clock,
  FolderOpen,
  Camera
} from 'lucide-react';

declare global {
  interface Window {
    html2pdf: any;
  }
}

const LOADING_MESSAGES = [
  "Transcribing audio stream...",
  "Extracting mathematical definitions...",
  "Identifying cross-domain bridges...",
  "Synthesizing timeline events...",
  "Generating knowledge graph..."
];

type SidePanelTab = 'CHAT' | 'INSIGHTS' | 'ARTIFACTS';

export const App: React.FC = () => {
  // State
  const [appMode, setAppMode] = useState<AppMode>(AppMode.DISCOVERY);
  const [activeUrl, setActiveUrl] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showConceptMap, setShowConceptMap] = useState(false);
  
  // Sidebar State
  const [sidePanelOpen, setSidePanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<SidePanelTab>('CHAT');
  
  // Resizable Panel State
  const [sidePanelWidth, setSidePanelWidth] = useState(400);
  const [leftPanelWidth, setLeftPanelWidth] = useState(288);
  const isResizingRef = useRef(false);
  const isLeftResizingRef = useRef(false);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1280 : false);

  // Transcript State
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isGeneratingTranscript, setIsGeneratingTranscript] = useState(false);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);

  // Video File State (for local upload override)
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // Artifacts State
  const [capturedFrames, setCapturedFrames] = useState<Array<{id: string; base64: string; timestamp: string; note?: string}>>([]);

  // Refs
  const chatInterfaceRef = useRef<ChatInterfaceRef>(null);

  // Loading Animation Loop
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setLoadingMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Window Resize Listener for Responsive Logic
  useEffect(() => {
    const handleWindowResize = () => {
      setIsDesktop(window.innerWidth >= 1280);
    };
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  // Panel Resize Handlers (Right Panel)
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizingRef.current) return;
    const newWidth = window.innerWidth - e.clientX;
    // Clamp between 300px and 700px
    setSidePanelWidth(Math.min(700, Math.max(300, newWidth)));
  };

  const handleResizeEnd = () => {
    isResizingRef.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  // Panel Resize Handlers (Left Panel)
  const handleLeftResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isLeftResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleLeftResizeMove);
    document.addEventListener('mouseup', handleLeftResizeEnd);
  };

  const handleLeftResizeMove = (e: MouseEvent) => {
    if (!isLeftResizingRef.current) return;
    const newWidth = e.clientX;
    // Clamp between 200px and 600px
    setLeftPanelWidth(Math.min(600, Math.max(200, newWidth)));
  };

  const handleLeftResizeEnd = () => {
    isLeftResizingRef.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', handleLeftResizeMove);
    document.removeEventListener('mouseup', handleLeftResizeEnd);
  };

  // Cleanup resize listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.removeEventListener('mousemove', handleLeftResizeMove);
      document.removeEventListener('mouseup', handleLeftResizeEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  // Handlers
  const handleAnalyze = (url: string) => {
    setActiveUrl(url);
    setVideoFile(null);
    setAppMode(AppMode.ANALYSIS);
    setAnalysisResult(null);
    setTranscript('');
    setTranscriptFile(null);
    setCapturedFrames([]);
    setIsAnalyzing(false);
    setSidePanelOpen(true); // Default to open on start
    setActiveTab('CHAT');
    // Don't call analyzeLecture - wait for user to upload video
  };

  const handleDemoAnalyze = async (url: string) => {
    setActiveUrl(url);
    setAppMode(AppMode.ANALYSIS);
    setAnalysisResult(null);
    setTranscript('');
    setTranscriptFile(null);
    setCapturedFrames([]);
    setSidePanelOpen(true);
    setActiveTab('CHAT');
    setIsAnalyzing(true);

    try {
      // Fetch local video file and convert to File object
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], url.split('/').pop() || 'demo.mp4', { type: 'video/mp4' });
      setVideoFile(file);

      // Send to Gemini for real analysis
      const result = await analyzeVideoFile(file);
      setAnalysisResult(result);
      if (result.transcript) {
        setTranscript(result.transcript);
      }
    } catch (err) {
      console.error('Demo analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBack = () => {
    setAppMode(AppMode.DISCOVERY);
    setActiveUrl('');
    setAnalysisResult(null);
    setTranscript('');
    setTranscriptFile(null);
    setVideoFile(null);
    setCapturedFrames([]);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setIsAnalyzing(true);
      // Clear current results and transcript while analyzing new video
      setAnalysisResult(null);
      setTranscript('');
      setTranscriptFile(null);
      setCapturedFrames([]);

      try {
        // Send video to Gemini for real analysis
        const result = await analyzeVideoFile(file);
        setAnalysisResult(result);
        setActiveTab('INSIGHTS'); // Show results when done
      } catch (error: any) {
        console.error('Video analysis failed:', error);
        alert(`Video analysis failed: ${error.message || "Unknown error"}. Please try again.`);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleTimelineDiscuss = (event: TimelineEvent) => {
    setSidePanelOpen(true);
    setActiveTab('CHAT');
    // Small timeout to ensure panel render
    setTimeout(() => {
      chatInterfaceRef.current?.sendMessage(
        `Can you explain the event at ${event.timestamp}: "${event.description}"? \n\nSpecifically the math: ${event.math || 'context'}`
      );
    }, 100);
  };

  const handleTermClick = (mapping: TermMapping) => {
    setActiveTab('CHAT');
    setTimeout(() => {
      chatInterfaceRef.current?.sendMessage(
        `I'm interested in the connection between "${mapping.termA}" and "${mapping.termB}". \n\n${mapping.explanation}`
      );
    }, 100);
  };

  const handleFrameCapture = (data: { timestamp: number; base64: string; formattedTime: string }) => {
    // Save to artifacts
    setCapturedFrames(prev => [...prev, {
      id: Date.now().toString(),
      base64: data.base64,
      timestamp: data.formattedTime
    }]);

    setSidePanelOpen(true);
    setActiveTab('CHAT');
    // Small timeout to ensure panel render
    setTimeout(() => {
      chatInterfaceRef.current?.analyzeFrame(data.base64, data.formattedTime);
    }, 100);
  };

  const handleTranscript = async () => {
    setShowTranscript(true);
    if (transcript) return;

    setIsGeneratingTranscript(true);
    
    try {
      if (transcriptFile) {
        // Option 1: Use uploaded transcript file if available
        const text = await transcriptFile.text();
        setTranscript(text);
      } else if (videoFile) {
        // Option 2: Use Gemini to transcribe the uploaded file directly
        const segments = await generateTranscript(videoFile);
        const formatted = segments.map(s => 
          `[${new Date(s.start_time * 1000).toISOString().substr(14, 5)}] ${s.text}`
        ).join('\n\n');
        setTranscript(formatted);
      } else {
        setTranscript("No video file uploaded. Please upload a video to generate a real transcript from the audio, or load a .txt transcript file.");
      }
    } catch (error) {
      console.error("Transcript generation error:", error);
      setTranscript("Failed to generate transcript. Try uploading a .txt transcript file instead.");
    } finally {
      setIsGeneratingTranscript(false);
    }
  };

  const handleExport = async () => {
    const element = document.getElementById('pdf-export-content');
    if (!element) return;
    
    // Show element for capture
    element.classList.remove('hidden');
    element.classList.add('block');
    
    const activeLecture = MOCK_CATALOG.find(c => c.url === activeUrl);
    const filename = `MathBridge-${activeLecture?.title?.replace(/[^a-zA-Z0-9]/g, '_') || (videoFile ? videoFile.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Analysis')}.pdf`;
    
    const opt = {
      margin: 10,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await window.html2pdf().set(opt).from(element).save();
    } catch (e) {
      console.error('PDF generation failed', e);
    } finally {
      // Hide element again
      element.classList.remove('block');
      element.classList.add('hidden');
    }
  };

  // Render Loading Screen
  if (appMode === AppMode.ANALYSIS && isAnalyzing) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="text-blue-600 animate-pulse" size={32} />
          </div>
        </div>
        <h2 className="mt-8 text-xl font-serif font-semibold text-gray-900">Analyzing Lecture Content</h2>
        <p className="mt-2 text-gray-500 w-64 text-center h-6 transition-all duration-500">
          {LOADING_MESSAGES[loadingMsgIndex]}
        </p>
      </div>
    );
  }

  // Render Upload Prompt (Analysis mode but no result yet and no video file)
  if (appMode === AppMode.ANALYSIS && !analysisResult && !isAnalyzing && !videoFile) {
    const activeLecture = MOCK_CATALOG.find(c => c.url === activeUrl);

    return (
      <div className="h-screen w-full flex flex-col bg-gray-50">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4">
          <button onClick={handleBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft size={16} />
            Back to Discovery
          </button>
        </header>

        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-xl text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <Upload size={32} className="text-blue-600" />
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
                {activeLecture?.title || "Upload Video for Analysis"}
              </h2>
              <p className="text-gray-500">
                Upload the lecture video file to get real AI-powered analysis with bridges, timeline, and term mappings.
              </p>
            </div>

            <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl cursor-pointer hover:bg-blue-700 transition-colors shadow-lg text-lg font-semibold">
              <Upload size={20} />
              Select Video File
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
              />
            </label>

            <p className="text-sm text-gray-400">
              Supports MP4, MOV, WebM (recommended under 20MB for best results)
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Render Analysis Mode
  if (appMode === AppMode.ANALYSIS && analysisResult) {
    const activeLecture = MOCK_CATALOG.find(c => c.url === activeUrl);
    
    return (
      <div className="h-screen w-full flex flex-col bg-gray-50 overflow-hidden print:h-auto print:overflow-visible print:bg-white print:block">
        
        {/* GLOBAL PRINT STYLES - Fixes clipping issues */}
        <style>{`
          @media print {
            @page { margin: 1cm; size: auto; }
            body, html, #root { 
              height: auto !important; 
              overflow: visible !important; 
              width: 100% !important;
            }
            /* Hide scrollbars in print */
            ::-webkit-scrollbar { display: none; }
          }
        `}</style>

        {/* =================================================================================
            SCREEN VIEW (Interactive)
           ================================================================================= */}
        
        {/* Top Navigation Bar with Breadcrumb */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0 z-20 shadow-sm print:hidden">
          <div className="flex items-center gap-2 md:gap-4">
            <nav className="flex items-center text-sm">
              <button onClick={handleBack} className="flex items-center gap-1 font-medium text-gray-500 hover:text-gray-900">
                <ArrowLeft size={16} className="md:hidden" />
                <span className="hidden md:inline">Discovery</span>
              </button>
              <ChevronRight size={14} className="text-gray-300 mx-2 hidden md:block" />
              <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-semibold">
                <Sparkles size={14} />Analysis
              </div>
            </nav>
            <div className="h-4 w-px bg-gray-200 mx-2 hidden md:block"></div>
            <div className="hidden lg:flex items-center gap-3 text-sm overflow-hidden">
              <span className="font-serif font-semibold text-gray-900 truncate max-w-md">{activeLecture?.title || (videoFile ? videoFile.name : 'Unknown Video')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSidePanelOpen(!sidePanelOpen)} 
              className={`p-2 rounded-lg transition-colors md:hidden ${sidePanelOpen ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
               {sidePanelOpen ? <X size={18} /> : <MessageSquare size={18} />}
            </button>
            <div className="h-4 w-px bg-gray-200 mx-1 hidden md:block"></div>
            <button onClick={handleTranscript} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Transcript">
              <FileText size={18} />
            </button>
            <button onClick={handleExport} className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm ml-2">
              <Download size={16} />PDF
            </button>
          </div>
        </header>

        {/* 3-Panel Layout */}
        <main className="flex-1 flex min-h-0 overflow-hidden print:hidden relative">
          
          {/* Left Panel: Bridges (Fixed Width -> Resizable) */}
          <aside 
            className="hidden lg:flex bg-white border-r border-gray-200 flex-col flex-shrink-0 z-10 relative"
            style={{ width: `${leftPanelWidth}px` }}
          >
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-serif font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles size={16} className="text-purple-600" />
                Cross-Domain Bridges
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              <BridgeList
                bridges={analysisResult.bridges || []}
                onSendToChat={(content) => {
                  chatInterfaceRef.current?.sendMessage(content);
                  setActiveTab('CHAT');
                  setSidePanelOpen(true);
                }}
              />
            </div>
            {/* Left Panel Resize Handle */}
            <div
                onMouseDown={handleLeftResizeStart}
                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 hover:w-1.5 transition-all z-50 group"
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-12 -mr-1.5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-1 h-8 bg-blue-500 rounded-full"></div>
                </div>
            </div>
          </aside>

          {/* Center Panel: Visualization / Video (Flexible) */}
          <section className="flex-1 flex flex-col min-w-0 bg-gray-100/50 relative overflow-y-auto">
            <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6 animate-fade-in">
              
              {/* Video Upload Control (Context-aware) */}
              <div className="flex items-center gap-4 justify-between">
                <div className="flex items-center gap-2">
                   {videoFile ? (
                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                         <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{videoFile.name}</span>
                         <button onClick={() => setVideoFile(null)} className="text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 p-1">
                           <X size={14}/>
                         </button>
                      </div>
                   ) : (
                      <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium">
                        <Upload size={16} />
                        Upload Video
                        <input 
                          type="file" 
                          accept="video/*" 
                          onChange={handleVideoUpload}
                          className="hidden" 
                        />
                      </label>
                   )}
                </div>
                
                {/* Desktop Sidebar Toggle */}
                <button 
                  onClick={() => setSidePanelOpen(!sidePanelOpen)}
                  className="hidden xl:flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
                >
                  {sidePanelOpen ? <PanelRightClose size={18}/> : <PanelRightOpen size={18}/>}
                  {sidePanelOpen ? 'Close Sidebar' : 'Open Sidebar'}
                </button>
              </div>

              {/* Video Player */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden ring-4 ring-gray-200/50">
                 <VideoPlayer 
                    videoUrl={activeUrl} 
                    videoFile={videoFile || undefined} 
                    onCaptureFrame={handleFrameCapture}
                 />
              </div>

              {/* Concept Map (Collapsed by Default) */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <button 
                  onClick={() => setShowConceptMap(!showConceptMap)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Share2 className="text-purple-500" size={16} />
                    Concept Map
                  </h3>
                  <ChevronRight 
                    size={18} 
                    className={`text-gray-400 transition-transform ${showConceptMap ? 'rotate-90' : ''}`} 
                  />
                </button>
                {showConceptMap && (
                  <div className="p-1 border-t border-gray-100">
                    <BridgeDiagram 
                      bridges={analysisResult.bridges || []}
                      mappings={analysisResult.mappings || []}
                      videoUrl={activeUrl}
                    />
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                 <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                   <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                     <Clock className="text-blue-500" size={16}/> Lecture Timeline
                   </h3>
                 </div>
                 <div className="p-4">
                   <Timeline 
                     events={analysisResult.timeline || []} 
                     onDiscuss={handleTimelineDiscuss} 
                   />
                 </div>
              </div>

            </div>
          </section>

          {/* Right Panel: Assistant & Insights (Collapsible/Overlay on Mobile, Resizable on Desktop) */}
          <aside 
            className={`
              fixed inset-y-0 right-0 z-30 w-full sm:w-[400px] bg-white border-l border-gray-200 shadow-2xl transform transition-transform duration-300 ease-in-out
              xl:relative xl:shadow-none xl:transform-none
              ${sidePanelOpen ? 'translate-x-0' : 'translate-x-full xl:hidden'}
            `}
            style={{ width: isDesktop ? `${sidePanelWidth}px` : undefined }}
          >
             {/* Resize Handle (Desktop Only) */}
             <div
                onMouseDown={handleResizeStart}
                className="hidden xl:block absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 hover:w-1.5 transition-all z-50 group"
              >
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-12 -ml-1.5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-1 h-8 bg-blue-500 rounded-full"></div>
                </div>
              </div>

             {/* Mobile/Tablet Overlay Backdrop */}
             <div 
               className={`fixed inset-0 bg-black/20 z-[-1] xl:hidden ${sidePanelOpen ? 'block' : 'hidden'}`} 
               onClick={() => setSidePanelOpen(false)}
             />

             <div className="h-full flex flex-col bg-white">
                {/* Panel Header */}
                <div className="h-14 border-b border-gray-200 flex items-center justify-between px-2 bg-gray-50/50">
                  <div className="flex bg-gray-200/50 p-1 rounded-lg">
                    <button 
                      onClick={() => setActiveTab('CHAT')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'CHAT' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      <MessageSquare size={14} /> Assistant
                    </button>
                    <button 
                      onClick={() => setActiveTab('INSIGHTS')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'INSIGHTS' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      <Lightbulb size={14} /> Insights
                    </button>
                    <button 
                      onClick={() => setActiveTab('ARTIFACTS')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'ARTIFACTS' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      <FolderOpen size={14} /> Artifacts
                    </button>
                  </div>
                  <button onClick={() => setSidePanelOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 xl:hidden">
                    <X size={20} />
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-hidden relative">
                  
                  {/* Chat Tab */}
                  <div className={`absolute inset-0 flex flex-col transition-opacity duration-200 ${activeTab === 'CHAT' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                     <ChatInterface 
                        ref={chatInterfaceRef}
                        analysisContext={analysisResult} 
                        className="h-full border-none rounded-none shadow-none"
                     />
                  </div>

                  {/* Insights Tab */}
                  <div className={`absolute inset-0 overflow-y-auto p-4 space-y-6 bg-gray-50/30 transition-opacity duration-200 ${activeTab === 'INSIGHTS' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                      <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                        <h4 className="text-blue-900 font-semibold mb-2 flex items-center gap-2">
                          <Sparkles size={14} />
                          AI Summary
                        </h4>
                        <p className="text-sm text-blue-800 leading-relaxed">
                          {analysisResult.summary}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Term Mappings</h4>
                        <TermMappingTable
                          mappings={analysisResult.mappings || []}
                          onTermClick={handleTermClick}
                        />
                      </div>
                  </div>

                  {/* Artifacts Tab */}
                  <div className={`absolute inset-0 overflow-y-auto p-4 space-y-4 bg-gray-50/30 transition-opacity duration-200 ${activeTab === 'ARTIFACTS' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                    
                    {/* Captured Frames Section */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
                        <Camera size={12} /> Captured Frames ({capturedFrames.length})
                      </h4>
                      {capturedFrames.length === 0 ? (
                        <p className="text-sm text-gray-400 italic px-1">No frames captured yet. Use "Capture Frame" while watching the video.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {capturedFrames.map((frame) => (
                            <div key={frame.id} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-white">
                              <img src={frame.base64} alt={`Frame at ${frame.timestamp}`} className="w-full h-auto" />
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1">
                                {frame.timestamp}
                              </div>
                              <button 
                                onClick={() => setCapturedFrames(prev => prev.filter(f => f.id !== frame.id))}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Transcript Section */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
                        <FileText size={12} /> Transcript
                      </h4>
                      {transcript ? (
                        <div className="bg-white rounded-lg border border-gray-200 p-3">
                          <p className="text-xs text-gray-600 line-clamp-4">{transcript.slice(0, 300)}...</p>
                          <button 
                            onClick={() => setShowTranscript(true)}
                            className="text-xs text-blue-600 hover:underline mt-2"
                          >
                            View full transcript
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic px-1">No transcript generated yet.</p>
                      )}
                    </div>

                    {/* Export Section */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
                        <Download size={12} /> Exports
                      </h4>
                      <div className="space-y-2">
                        <button 
                          onClick={handleExport}
                          className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Download size={14} /> Download PDF Report
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
             </div>
          </aside>
        </main>

        {/* Transcript Modal */}
        {showTranscript && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowTranscript(false)}>
            <div 
              className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden" 
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-xl font-serif font-bold text-gray-900 flex items-center gap-2">
                  <FileText size={20} className="text-blue-600"/>
                  Academic Transcript
                </h3>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg cursor-pointer text-sm font-medium transition-colors">
                    <Upload size={14} />
                    Load .txt
                    <input
                      type="file"
                      accept=".txt"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setTranscriptFile(file);
                          file.text().then(text => {
                            setTranscript(text);
                            setIsGeneratingTranscript(false);
                          });
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  <button 
                    onClick={() => setShowTranscript(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {isGeneratingTranscript ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-gray-500 animate-pulse">Generating transcript from audio analysis...</p>
                  </div>
                ) : (
                  <div className="prose prose-blue max-w-none whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-700">
                    {transcript}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between">
                {transcript && !isGeneratingTranscript ? (
                  <button
                    onClick={() => {
                      chatInterfaceRef.current?.sendMessage(`Discuss this transcript:\n\n${transcript.slice(0, 2000)}${transcript.length > 2000 ? '...' : ''}`);
                      setActiveTab('CHAT');
                      setSidePanelOpen(true);
                      setShowTranscript(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <MessageSquare size={16} />
                    Send to Chat
                  </button>
                ) : <div />}
                <button
                  onClick={() => setShowTranscript(false)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================================
            PRINT VIEW (Report Mode) - Only visible when printing or exporting
           ================================================================================= */}
        <div id="pdf-export-content" className="hidden print:block p-8 bg-white text-black h-auto">
           {/* Report Header */}
           <div className="mb-8 border-b-2 border-black pb-4">
              <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
                {activeLecture?.title || (videoFile ? videoFile.name : "Lecture Analysis Report")}
              </h1>
              <div className="flex justify-between items-end">
                <div className="text-gray-600">
                  <p className="font-medium">{activeLecture?.speaker || "Unknown Speaker"}</p>
                  <p className="text-sm">{activeLecture?.year ? `Recorded ${activeLecture.year}` : ""}</p>
                </div>
                <div className="text-right text-sm text-gray-400">
                  Generated by MathBridge
                </div>
              </div>
           </div>

           {/* Executive Summary */}
           <section className="mb-10 break-inside-avoid">
             <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-1 uppercase tracking-wider text-sm">AI Executive Summary</h2>
             <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-gray-900 leading-relaxed text-justify">
               {analysisResult.summary || "No summary available."}
             </div>
           </section>

           {/* Bridges */}
           <section className="mb-10 break-inside-avoid">
             <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-1 uppercase tracking-wider text-sm">Cross-Domain Bridges</h2>
             <BridgeList bridges={analysisResult.bridges || []} shouldAnimate={false} />
           </section>

           {/* Concept Map */}
           <section className="mb-10 break-inside-avoid">
             <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-1 uppercase tracking-wider text-sm">Concept Map Visualization</h2>
             <div className="h-64 border rounded-lg p-2">
                <BridgeDiagram 
                  bridges={analysisResult.bridges || []} 
                  mappings={analysisResult.mappings || []} 
                  videoUrl={activeUrl}
                />
             </div>
           </section>

           {/* Timeline */}
           <section className="mb-10 break-inside-avoid">
             <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-1 uppercase tracking-wider text-sm">Lecture Timeline</h2>
             <Timeline events={analysisResult.timeline || []} />
           </section>

           {/* Term Mappings */}
           <section className="mb-10 break-inside-avoid">
             <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-1 uppercase tracking-wider text-sm">Key Terminology Mappings</h2>
             <TermMappingTable mappings={analysisResult.mappings || []} />
           </section>

           {/* Chat History */}
           {chatInterfaceRef.current?.getMessages && chatInterfaceRef.current.getMessages().length > 1 && (
             <section className="break-inside-avoid">
               <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-1 uppercase tracking-wider text-sm">Chat Conversation</h2>
               <div className="space-y-4">
                 {chatInterfaceRef.current.getMessages().slice(1).map((msg, idx) => (
                   <div key={idx} className={`p-4 rounded-lg ${msg.role === 'user' ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50 border-l-4 border-gray-300'}`}>
                     <p className="text-xs font-bold text-gray-500 uppercase mb-2">{msg.role === 'user' ? 'You' : 'MathBridge AI'}</p>
                     <p className="text-gray-800 whitespace-pre-wrap">{msg.text}</p>
                   </div>
                 ))}
               </div>
             </section>
           )}
        </div>

      </div>
    );
  }

  // Render Discovery Mode
  return (
    <div className="h-screen w-full bg-white">
      <DiscoveryInterface
        catalog={MOCK_CATALOG}
        onAnalyze={(lecture) => {
          if ((lecture as any).isLocalDemo) {
            handleDemoAnalyze(lecture.url);
          } else {
            handleAnalyze(lecture.url);
          }
        }}
      />
    </div>
  );
};

export default App;
