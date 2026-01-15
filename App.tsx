import React, { useState, useEffect } from 'react';
import { parseCRDs } from './utils/yamlParser';
import { CustomResourceDefinition } from './types';
import { CRDViewer } from './components/CRDViewer';
import { FileUp, Link as LinkIcon, AlertCircle, Loader2, Database, Search, Trash2, Clipboard, X } from 'lucide-react';

const DEFAULT_BUNDLE_URL = "https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/refs/heads/main/bundle.yaml";

export default function App() {
  const [crds, setCrds] = useState<CustomResourceDefinition[]>([]);
  const [selectedCrdIndex, setSelectedCrdIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState(DEFAULT_BUNDLE_URL);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Paste Modal State
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pasteContent, setPasteContent] = useState('');

  const loadFromUrl = async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      const text = await response.text();
      const parsed = parseCRDs(text);
      if (parsed.length === 0) {
        setError("No CustomResourceDefinitions found in the file.");
      } else {
        setCrds(parsed);
        setSelectedCrdIndex(0);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while loading the file.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCRDs(text);
        if (parsed.length === 0) {
          setError("No CustomResourceDefinitions found in this file.");
        } else {
          setCrds(parsed);
          setSelectedCrdIndex(0);
        }
      } catch (err) {
        setError("Failed to parse YAML file.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handlePasteLoad = () => {
    if (!pasteContent.trim()) return;
    
    setLoading(true);
    setError(null);
    setIsPasteModalOpen(false);
    
    // Small timeout to allow modal to close before heavy parsing
    setTimeout(() => {
      try {
        const parsed = parseCRDs(pasteContent);
        if (parsed.length === 0) {
          setError("No CustomResourceDefinitions found in pasted content.");
        } else {
          setCrds(parsed);
          setSelectedCrdIndex(0);
        }
      } catch (err) {
        setError("Failed to parse pasted YAML. Please check the syntax.");
      } finally {
        setLoading(false);
        setPasteContent('');
      }
    }, 100);
  };

  const clearDefinitions = () => {
    setCrds([]);
    setSelectedCrdIndex(null);
    setError(null);
    setSearchTerm('');
  };

  // Load default on mount
  useEffect(() => {
    loadFromUrl(DEFAULT_BUNDLE_URL);
  }, []);

  const filteredCrds = crds.filter(crd => 
    crd.spec.names.kind.toLowerCase().includes(searchTerm.toLowerCase()) || 
    crd.spec.group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans relative">
      
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 z-10 shadow-lg">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Database className="text-blue-600" />
            CRD Explorer
          </h1>
          <p className="text-xs text-slate-500 mt-1">Kubernetes Schema Viewer</p>
        </div>

        {/* Controls */}
        <div className="p-4 space-y-3 border-b border-slate-200">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">Load Source</label>
            <div className="flex gap-2 mb-2">
              <input 
                type="text" 
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://..."
                className="flex-1 text-xs border border-slate-300 rounded px-2 py-1.5 outline-none focus:border-blue-500 bg-white text-slate-900"
              />
              <button 
                onClick={() => loadFromUrl(urlInput)}
                disabled={loading}
                className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
                title="Load URL"
              >
                {loading ? <Loader2 className="animate-spin" size={14} /> : <LinkIcon size={14} />}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                 <input 
                    type="file" 
                    accept=".yaml,.yml,.json" 
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                 />
                 <button className="w-full text-xs flex items-center justify-center gap-1.5 border border-dashed border-slate-300 rounded py-2 text-slate-600 hover:bg-slate-50 hover:border-blue-400 transition-colors">
                    <FileUp size={14} />
                    Upload File
                 </button>
              </div>
              <button 
                onClick={() => setIsPasteModalOpen(true)}
                className="w-full text-xs flex items-center justify-center gap-1.5 border border-dashed border-slate-300 rounded py-2 text-slate-600 hover:bg-slate-50 hover:border-blue-400 transition-colors"
              >
                <Clipboard size={14} />
                Paste Text
              </button>
            </div>
          </div>
          
          {crds.length > 0 && (
             <div className="space-y-2 pt-1">
                <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Filter CRDs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
                    />
                </div>
                <button 
                   onClick={clearDefinitions}
                   className="w-full flex items-center justify-center gap-2 text-xs text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded py-2 transition-colors"
                >
                   <Trash2 size={14} />
                   Clear All
                </button>
             </div>
          )}
        </div>

        {/* CRD List */}
        <div className="flex-1 overflow-y-auto">
          {crds.length === 0 && !loading && !error && (
            <div className="p-8 text-center text-slate-400 text-sm">
              Enter a URL, upload a file, or paste text to view definitions.
            </div>
          )}
          
          {error && (
            <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-start gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="py-2">
             {filteredCrds.map((crd, index) => {
               const originalIndex = crds.indexOf(crd);
               return (
                <button
                  key={crd.metadata.uid || crd.metadata.name}
                  onClick={() => setSelectedCrdIndex(originalIndex)}
                  className={`w-full text-left px-4 py-3 border-l-4 transition-all hover:bg-slate-50 group ${
                    selectedCrdIndex === originalIndex 
                      ? 'border-blue-600 bg-blue-50/50' 
                      : 'border-transparent'
                  }`}
                >
                  <div className={`font-semibold text-sm ${selectedCrdIndex === originalIndex ? 'text-blue-900' : 'text-slate-700'}`}>
                    {crd.spec.names.kind}
                  </div>
                  <div className="text-xs text-slate-500 truncate font-mono mt-0.5">
                    {crd.spec.group}
                  </div>
                </button>
               );
             })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-2 sm:p-6 flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
             <Loader2 className="animate-spin text-blue-500" size={40} />
             <p className="font-medium animate-pulse">Parsing definitions...</p>
             <p className="text-xs text-slate-400">Large bundles can take a moment.</p>
          </div>
        ) : selectedCrdIndex !== null && crds[selectedCrdIndex] ? (
          <CRDViewer 
            key={crds[selectedCrdIndex].metadata.uid || crds[selectedCrdIndex].metadata.name}
            crd={crds[selectedCrdIndex]} 
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300 m-4">
             <Database size={64} className="mb-4 text-slate-200" />
             <h3 className="text-lg font-medium text-slate-600">No Definition Selected</h3>
             <p className="text-sm">Select a CRD from the sidebar to inspect its schema.</p>
          </div>
        )}
      </div>

      {/* Paste Modal */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
              <div className="flex items-center gap-2">
                <Clipboard className="text-blue-600" size={20} />
                <h3 className="font-bold text-slate-800">Paste Manifest</h3>
              </div>
              <button 
                onClick={() => setIsPasteModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition-colors"
              >
                 <X size={20} />
              </button>
            </div>
            <div className="p-0 flex-1 overflow-hidden relative">
              <textarea
                className="w-full h-full p-4 font-mono text-xs text-slate-700 bg-white resize-none focus:outline-none"
                placeholder="Paste your YAML or JSON content here..."
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                autoFocus
                spellCheck={false}
              />
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
              <button 
                 onClick={() => setIsPasteModalOpen(false)}
                 className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-800 border border-transparent hover:border-slate-200 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button 
                 onClick={handlePasteLoad}
                 disabled={!pasteContent.trim()}
                 className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Database size={14} />
                Load Definitions
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}