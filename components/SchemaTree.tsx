import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Info, Box, List, FileText, Type } from 'lucide-react';
import { JSONSchemaProps } from '../types';

interface SchemaNodeProps {
  name: string;
  schema: JSONSchemaProps;
  isRequired?: boolean;
  depth?: number;
  isLast?: boolean;
}

const TypeBadge: React.FC<{ type?: string }> = ({ type }) => {
  if (!type) return <span className="text-xs text-gray-400 font-mono">any</span>;

  const colors: Record<string, string> = {
    object: 'bg-blue-100 text-blue-700 border-blue-200',
    array: 'bg-purple-100 text-purple-700 border-purple-200',
    string: 'bg-green-100 text-green-700 border-green-200',
    integer: 'bg-orange-100 text-orange-700 border-orange-200',
    number: 'bg-orange-100 text-orange-700 border-orange-200',
    boolean: 'bg-red-100 text-red-700 border-red-200',
  };

  const style = colors[type.toLowerCase()] || 'bg-gray-100 text-gray-600 border-gray-200';

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono uppercase tracking-wide ${style}`}>
      {type}
    </span>
  );
};

export const SchemaNode: React.FC<SchemaNodeProps> = ({ name, schema, isRequired = false, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine children
  const properties = schema.properties;
  const items = schema.items;
  const hasChildren = (properties && Object.keys(properties).length > 0) || !!items;
  
  // Handle toggling
  const toggle = () => {
    if (hasChildren) setIsExpanded(!isExpanded);
  };

  // Icon selection
  const Icon = useMemo(() => {
    if (schema.type === 'array') return List;
    if (schema.type === 'object' || properties) return Box;
    return FileText;
  }, [schema.type, properties]);

  return (
    <div className="flex flex-col select-none">
      <div 
        className={`
          group flex items-start py-1.5 pr-2 rounded-md transition-colors cursor-pointer border-l-2
          ${isExpanded ? 'bg-slate-50 border-blue-500' : 'hover:bg-slate-50 border-transparent'}
        `}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={toggle}
      >
        {/* Expand/Collapse Caret */}
        <div className="mr-1 mt-0.5 flex-shrink-0 text-slate-400">
          {hasChildren ? (
            isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
          ) : (
            <div className="w-4 h-4" /> 
          )}
        </div>

        {/* Node Content */}
        <div className="flex flex-col w-full min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Icon size={14} className={`flex-shrink-0 ${hasChildren ? 'text-blue-600' : 'text-slate-400'}`} />
            
            <span className={`font-mono text-sm font-medium ${isRequired ? 'text-slate-900' : 'text-slate-700'}`}>
              {name}
            </span>
            
            {isRequired && (
              <span className="text-xs text-red-500 font-bold" title="Required Field">*</span>
            )}

            <TypeBadge type={schema.type} />
            
            {/* Format Badge (e.g., date-time, int64) */}
            {schema.format && (
              <span className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                {schema.format}
              </span>
            )}
          </div>

          {/* Description */}
          {schema.description && (
            <div className={`text-xs text-slate-500 mt-1 leading-relaxed ${!isExpanded ? 'line-clamp-1 group-hover:line-clamp-none' : ''}`}>
              {schema.description}
            </div>
          )}
        </div>
      </div>

      {/* Children Recursion */}
      {isExpanded && hasChildren && (
        <div className="flex flex-col border-l border-slate-100 ml-4">
          {properties && Object.entries(properties).map(([key, propSchema]) => (
            <SchemaNode 
              key={key} 
              name={key} 
              schema={propSchema} 
              isRequired={schema.required?.includes(key)}
              depth={depth + 1} 
            />
          ))}
          
          {items && (
            <div className="mt-1">
               {/* Visual indicator that these are array items */}
               <div className="text-xs font-mono text-slate-400 ml-6 mb-1 flex items-center gap-1">
                 <List size={10} />
                 <span>Array Items ({items.type})</span>
               </div>
               <SchemaNode 
                name="[index]" 
                schema={items} 
                depth={depth + 1} 
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
