import React, { useState, useMemo } from 'react';
import { CustomResourceDefinition, CRDVersion } from '../types';
import { SchemaNode } from './SchemaTree';
import { Layers, GitBranch, Code } from 'lucide-react';

interface CRDViewerProps {
  crd: CustomResourceDefinition;
}

export const CRDViewer: React.FC<CRDViewerProps> = ({ crd }) => {
  const [selectedVersionName, setSelectedVersionName] = useState<string>(
    crd.spec.versions[0]?.name || ''
  );

  const selectedVersion = useMemo(() => {
    return crd.spec.versions.find(v => v.name === selectedVersionName);
  }, [crd, selectedVersionName]);

  const schema = selectedVersion?.schema?.openAPIV3Schema;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <Layers className="text-blue-600" size={20} />
               <h2 className="text-xl font-bold text-slate-900">{crd.spec.names.kind}</h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 font-mono">
              <span className="bg-slate-200 px-1.5 rounded">{crd.spec.group}</span>
              <span>/</span>
              <span className="bg-slate-200 px-1.5 rounded">{crd.spec.names.plural}</span>
            </div>
          </div>
          
          {/* Version Selector */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            <GitBranch size={16} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Version:</span>
            <select 
              value={selectedVersionName}
              onChange={(e) => setSelectedVersionName(e.target.value)}
              className="text-sm font-mono text-slate-900 bg-transparent outline-none cursor-pointer"
            >
              {crd.spec.versions.map(v => (
                <option key={v.name} value={v.name}>{v.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Schema Content */}
      <div className="flex-1 overflow-auto p-2 sm:p-6 custom-scrollbar">
        {!schema ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400">
            <Code size={48} className="mb-4 opacity-50" />
            <p>No OpenAPI v3 Schema found for this version.</p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <SchemaNode 
              name="spec" 
              schema={schema} 
              isRequired={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};
