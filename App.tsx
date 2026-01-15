import React, { useState, useEffect } from 'react';
import { parseCRDs } from './utils/yamlParser';
import { CustomResourceDefinition } from './types';
import { CRDViewer } from './components/CRDViewer';
import { FileUp, Link as LinkIcon, AlertCircle, Loader2, Database, Search, Trash2 } from 'lucide-react';

const DEFAULT_BUNDLE_URL = "https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/refs/heads/main/bundle.yaml";

export default function App() {
  const [crds, setCrds] = useState<CustomResourceDefinition[]>([]);
  const [selectedCrdIndex, setSelectedCrdIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState(DEFAULT_BUNDLE_URL);
  const [searchTerm, setSearchTerm] = useState('');

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
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      
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
        <div className="p-4 space-y-4 border-b border-slate-200">
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
            <div className="relative">
               <input 
                  type="file" 
                  accept=".yaml,.yml,.json" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
               />
               <button className="w-full text-xs flex items-center justify-center gap-2 border border-dashed border-slate-300 rounded py-2 text-slate-600 hover:bg-slate-50 hover:border-blue-400 transition-colors">
                  <FileUp size={14} />
                  Upload Bundle File
               </button>
            </div>
          </div>
          
          {crds.length > 0 && (
             <div className="space-y-2">
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
              Enter a URL or upload a file to view definitions.
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
    </div>
  );
}