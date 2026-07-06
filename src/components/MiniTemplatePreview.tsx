import React from 'react';
import { EmailTemplate, EmailElement } from '../types';
import { Image as ImageIcon, Sparkles, Mail, FileText, Minus } from 'lucide-react';

interface MiniTemplatePreviewProps {
  template: EmailTemplate;
}

export default function MiniTemplatePreview({ template }: MiniTemplatePreviewProps) {
  const { globalStyles, elements } = template;

  // Render a single micro-element
  const renderMicroElement = (el: EmailElement) => {
    const alignClass = el.styles?.align === 'center' ? 'mx-auto' : el.styles?.align === 'right' ? 'ml-auto mr-0' : 'mr-auto ml-0';
    
    switch (el.type) {
      case 'heading':
        return (
          <div className="py-0.5" key={el.id}>
            <div 
              className={`h-2 rounded-sm ${alignClass}`}
              style={{ 
                backgroundColor: el.styles?.textColor || '#ffffff', 
                width: '70%',
                opacity: 0.95
              }} 
            />
          </div>
        );

      case 'text':
        return (
          <div className="space-y-1 py-0.5" key={el.id}>
            <div className="h-0.5 bg-zinc-700/60 rounded-sm w-full" />
            <div className="h-0.5 bg-zinc-700/60 rounded-sm w-5/6" />
            <div className="h-0.5 bg-zinc-700/60 rounded-sm w-2/3" />
          </div>
        );

      case 'button':
        return (
          <div className="py-1" key={el.id}>
            <div 
              className={`h-4 rounded-md flex items-center justify-center shadow-sm ${alignClass}`}
              style={{ 
                backgroundColor: el.styles?.backgroundColor || '#4f46e5',
                width: '60%',
              }}
            >
              <div 
                className="h-1 rounded-sm bg-white/90" 
                style={{ width: '45%' }}
              />
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="py-0.5" key={el.id}>
            <div className="h-7 rounded bg-gradient-to-br from-indigo-500/40 via-purple-500/20 to-pink-500/40 border border-zinc-800/60 flex items-center justify-center overflow-hidden">
              <ImageIcon className="h-2.5 w-2.5 text-indigo-200/50" />
            </div>
          </div>
        );

      case 'divider':
        return (
          <div className="py-1" key={el.id}>
            <div 
              className="border-t" 
              style={{ 
                borderColor: el.styles?.borderColor || '#3f3f46',
                borderTopWidth: `${Math.min(el.styles?.borderWidth || 1, 2)}px`
              }} 
            />
          </div>
        );

      case 'spacer':
        return <div key={el.id} style={{ height: '6px' }} />;

      case 'container':
        return (
          <div 
            key={el.id} 
            className="p-1 rounded border border-dashed border-zinc-800/60 space-y-0.5 my-0.5"
            style={{ backgroundColor: el.styles?.backgroundColor || 'transparent' }}
          >
            {el.children?.slice(0, 3).map(child => renderMicroElement(child))}
          </div>
        );

      case 'grid':
        return (
          <div key={el.id} className="grid grid-cols-2 gap-1 py-0.5">
            {[0, 1].map(colIdx => {
              const cellKey = `0-${colIdx}`;
              const cellChildren = el.gridCells?.[cellKey] || [];
              return (
                <div key={colIdx} className="p-0.5 rounded border border-zinc-850 bg-zinc-950/20 space-y-0.5">
                  {cellChildren.slice(0, 2).map(child => renderMicroElement(child))}
                </div>
              );
            })}
          </div>
        );

      case 'link':
        return (
          <div className="py-0.5" key={el.id}>
            <div 
              className={`h-0.5 rounded-sm ${alignClass}`}
              style={{ 
                backgroundColor: el.styles?.textColor || '#6366f1', 
                width: '35%',
                opacity: 0.8
              }} 
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="aspect-[3/4] h-36 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-900/80 p-2 select-none relative group/mini-canvas flex items-center justify-center mx-auto">
      {/* Background simulating real email outer canvas */}
      <div 
        className="absolute inset-0 transition-colors duration-300"
        style={{ backgroundColor: globalStyles.backgroundColor || '#0c0c0e' }}
      />

      {/* Mini email container */}
      <div 
        className="w-full h-full rounded-lg shadow-inner overflow-hidden flex flex-col p-1.5 transition-all duration-300 relative z-10"
        style={{ 
          backgroundColor: globalStyles.containerColor || '#18181b',
          borderRadius: `${Math.min((globalStyles.borderRadius || 12) / 3, 10)}px`
        }}
      >
        {/* Dynamic header simulation */}
        <div className="flex items-center justify-between pb-1 border-b border-zinc-800/40 shrink-0 mb-1">
          <div className="flex items-center gap-1">
            <div 
              className="w-1.5 h-1.5 rounded-sm bg-indigo-500 flex items-center justify-center shrink-0"
              style={{ backgroundColor: template.visualIdentity?.signatureColor || '#6366f1' }}
            />
            <div className="h-0.5 w-5 bg-zinc-700/60 rounded-sm" />
          </div>
          <div className="h-0.5 w-2.5 bg-zinc-700/40 rounded-sm" />
        </div>

        {/* Scrollable abstract elements list */}
        <div className="flex-1 overflow-hidden space-y-0.5 no-scrollbar">
          {elements && elements.length > 0 ? (
            elements.slice(0, 5).map((el) => renderMicroElement(el))
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="h-0.5 w-6 bg-zinc-800 rounded-sm" />
            </div>
          )}
        </div>
      </div>

      {/* Glossy overlay for modern tech feel */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/20 via-transparent to-white/5 pointer-events-none z-20" />
    </div>
  );
}
