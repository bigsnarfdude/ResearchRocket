import React, { useState, useMemo } from 'react';
import { Search, Sparkles, PlayCircle, ArrowRight, Star, Download, Filter, X, Calendar, Upload } from 'lucide-react';
import { CatalogEntry } from '../types';

type LectureMetadata = CatalogEntry;

interface DiscoveryInterfaceProps {
  catalog: LectureMetadata[];
  onAnalyze: (lecture: LectureMetadata) => void;
}

const SUGGESTED_QUERIES = [
  "Higgs bundles",
  "Hitchin system",
  "Mirror symmetry",
  "Quantum curves",
  "Spectral curves",
  "Moduli spaces"
];

const DiscoveryInterface: React.FC<DiscoveryInterfaceProps> = ({ catalog, onAnalyze }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Extract unique values
  const uniqueFields = useMemo(() => {
    const fields = new Set<string>();
    catalog.forEach(c => c.fields.forEach(f => fields.add(f)));
    return Array.from(fields).sort();
  }, [catalog]);

  const uniqueYears = useMemo(() => {
    const years = new Set<number>();
    catalog.forEach(c => {
      if (c.year) years.add(c.year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [catalog]);

  // Filter Logic
  const filteredLectures = catalog.filter(lecture => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || (
      lecture.title.toLowerCase().includes(q) ||
      lecture.speaker.toLowerCase().includes(q) ||
      lecture.fields.some(f => f.toLowerCase().includes(q)) ||
      lecture.one_line_summary.toLowerCase().includes(q)
    );
    
    const matchesField = !selectedField || lecture.fields.includes(selectedField);
    const matchesYear = !selectedYear || lecture.year?.toString() === selectedYear;

    return matchesSearch && matchesField && matchesYear;
  });

  const isFiltering = !!(searchQuery || selectedField || selectedYear);

  // Pick top 3 for Featured Section (Mocking "Curated" list by picking specific ones or first 3)
  const demoId = "201004131030-Hitchin"; 
  const featuredIds = ["201004131030-Hitchin", "202408261420-Hoskins", "201203140904-Boalch"];
  const featuredLectures = catalog.filter(c => featuredIds.includes(c.filename));
  const displayFeatured = featuredLectures.length === 3 ? featuredLectures : catalog.slice(0, 3);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedField('');
    setSelectedYear('');
  };

  const handleDownload = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = url;
    link.download = url.split('/').pop() || 'video.mp4';
    link.click();
  };

  const handleGlobalUpload = () => {
    // Trigger analysis with empty lecture to go to upload screen
    onAnalyze({ url: '' } as LectureMetadata);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200 pt-16 pb-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold tracking-wide uppercase">
            <Sparkles size={12} />
            BIRS Video Archive
          </div>
          
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 tracking-tight">
            Explore 17,000+ Mathematical Lectures
          </h1>
          
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
             Discover, watch, and analyze advanced mathematics research videos with AI-powered summaries, cross-domain bridge detection, and deep concept mapping.
          </p>

          <button 
            onClick={handleGlobalUpload}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Upload size={18} />
            Upload Video for Analysis
          </button>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto w-full mt-8 group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-xl shadow-gray-200/40 transition-all text-lg"
              placeholder="Search catalog..."
            />
             <div className="absolute inset-y-0 right-2 flex items-center">
                <button className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-colors">
                  <ArrowRight size={20} />
                </button>
             </div>
          </div>

          {/* Chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {SUGGESTED_QUERIES.map(q => (
              <button
                key={q}
                onClick={() => setSearchQuery(q)}
                className="px-4 py-1.5 bg-white border border-gray-200 text-gray-600 text-sm rounded-full hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Filter Toggle */}
          <div className="mt-6 flex flex-col items-center gap-4 w-full max-w-2xl">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showFilters ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Filter size={16} />
              {showFilters ? 'Hide Filters' : 'Show Advanced Filters'}
            </button>

            {showFilters && (
              <div className="flex flex-wrap gap-4 justify-center w-full animate-fade-in-up bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex flex-col items-start gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Field</label>
                  <select 
                    value={selectedField}
                    onChange={(e) => setSelectedField(e.target.value)}
                    className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 p-2.5"
                  >
                    <option value="">All Fields</option>
                    {uniqueFields.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col items-start gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Year</label>
                  <select 
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-32 p-2.5"
                  >
                    <option value="">All Years</option>
                    {uniqueYears.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                
                {(selectedField || selectedYear) && (
                  <div className="flex flex-col justify-end">
                    <button 
                      onClick={() => { setSelectedField(''); setSelectedYear(''); }}
                      className="px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        
        {/* FEATURED SECTION (Only show when not filtering) */}
        {!isFiltering && (
          <div className="mb-16 space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Star className="text-yellow-500 fill-yellow-500" size={20} />
                Featured Collections
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayFeatured.map((lecture, idx) => {
                const isDemo = lecture.filename === demoId || idx === 0;
                return (
                  <div 
                    key={lecture.url}
                    className={`
                      group relative bg-white rounded-2xl p-6 transition-all duration-300 border flex flex-col
                      ${isDemo 
                        ? 'border-green-500 ring-4 ring-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.3)] md:col-span-1' 
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-md'}
                    `}
                  >
                    {isDemo && (
                      <div className="absolute -top-3 left-6 bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide flex items-center gap-1 shadow-md shadow-green-900/20">
                        <Sparkles size={10} /> Editor's Pick
                      </div>
                    )}

                    <div className="flex flex-col h-full">
                       <div className="flex items-center justify-between mb-4">
                          <span className={`
                            w-10 h-10 rounded-full flex items-center justify-center transition-colors
                            ${isDemo ? 'bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}
                          `}>
                            <PlayCircle size={20} />
                          </span>
                          <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">{lecture.year}</span>
                       </div>
                       
                       <h3 className="text-lg font-serif font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                         {lecture.title}
                       </h3>
                       
                       <p className="text-sm text-gray-500 font-medium mb-2">
                         {lecture.speaker}
                       </p>
                       
                       <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1 leading-relaxed">
                         {lecture.one_line_summary}
                       </p>
                       
                       <div className="flex flex-wrap gap-2 mt-auto mb-4">
                         {lecture.fields.slice(0, 2).map(f => (
                           <span key={f} className="text-[10px] px-2 py-1 bg-gray-50 text-gray-600 rounded border border-gray-100">
                             {f}
                           </span>
                         ))}
                       </div>

                       <div className="mt-auto pt-2 border-t border-gray-100">
                         {isDemo ? (
                           <button
                              onClick={() => onAnalyze({ ...lecture, isLocalDemo: true } as any)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
                           >
                             <PlayCircle size={16} /> Watch Demo
                           </button>
                         ) : (
                           <button
                              onClick={() => onAnalyze(lecture)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
                           >
                             <Upload size={16} /> Upload to Analyze
                           </button>
                         )}
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* RESULTS SECTION */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-4 gap-4">
             <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
               {isFiltering ? `Search Results (${filteredLectures.length})` : 'Recent Lectures'}
             </h2>
             
             {isFiltering && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-400 mr-1">Active Filters:</span>
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      "{searchQuery}"
                      <button onClick={() => setSearchQuery('')}><X size={12} /></button>
                    </span>
                  )}
                  {selectedField && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                      {selectedField}
                      <button onClick={() => setSelectedField('')}><X size={12} /></button>
                    </span>
                  )}
                  {selectedYear && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      {selectedYear}
                      <button onClick={() => setSelectedYear('')}><X size={12} /></button>
                    </span>
                  )}
                  <button 
                    onClick={clearFilters}
                    className="text-xs text-gray-500 hover:text-red-600 underline ml-2"
                  >
                    Clear All
                  </button>
                </div>
             )}
          </div>

          {filteredLectures.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Search className="text-gray-300" size={24} />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No lectures found</h3>
              <p className="text-gray-500">Try adjusting your search terms or filters.</p>
              <button 
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {(isFiltering ? filteredLectures : filteredLectures.slice(3)).map((lecture) => (
                  <div 
                    key={lecture.url}
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all group flex flex-col h-full"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 uppercase tracking-wide truncate max-w-[150px]">
                          {lecture.fields[0]}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-base font-serif font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {lecture.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                      <span className="font-medium">{lecture.speaker}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Calendar size={10} /> {lecture.year}</span>
                    </div>
                    
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
                      {lecture.one_line_summary}
                    </p>
                    
                    <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center gap-2">
                       <span className="text-xs text-gray-400 font-mono truncate max-w-[100px]">
                         {lecture.workshop_code}
                       </span>
                       
                       <button
                          onClick={(e) => { e.stopPropagation(); window.open(lecture.url, '_blank'); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                       >
                         <Download size={14} /> Download
                       </button>
                    </div>
                  </div>
               ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DiscoveryInterface;
