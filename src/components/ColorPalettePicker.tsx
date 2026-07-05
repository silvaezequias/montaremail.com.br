import React, { useState, useRef, useEffect } from 'react';
import { BrandColor } from '../types';
import { Pipette, ChevronDown, Check } from 'lucide-react';

interface ColorPalettePickerProps {
  color: string;
  onChange: (newColor: string) => void;
  brandColors?: BrandColor[];
  label?: string;
}

const PRESET_COLORS = [
  // Neutrals / Lights / Darks
  '#ffffff', '#f8fafc', '#f1f5f9', '#cbd5e1', '#64748b', '#1e293b', '#0f172a', '#000000',
  // Warm / Red / Orange / Amber
  '#fecaca', '#ef4444', '#b91c1c', '#fef3c7', '#eab308', '#d97706',
  // Cool / Greens / Blues / Purples
  '#d1fae5', '#10b981', '#047857', '#dbeafe', '#3b82f6', '#1d4ed8', '#f3e8ff', '#8b5cf6', '#6d28d9'
];

export const ColorPalettePicker: React.FC<ColorPalettePickerProps> = ({
  color,
  onChange,
  brandColors = [],
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-1" ref={containerRef}>
      {label && (
        <label className="text-[10px] uppercase font-bold text-zinc-400 block">{label}</label>
      )}
      
      <div className="relative">
        {/* Main triggering control bar */}
        <div className="flex items-center gap-1.5 bg-zinc-950/80 hover:bg-zinc-950 border border-zinc-850 rounded-xl p-1.5 transition-colors cursor-pointer justify-between">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 flex-1 text-left"
          >
            {/* Color preview circle */}
            <span 
              className="w-5.5 h-5.5 rounded-lg border border-zinc-800 shadow-inner shrink-0 block"
              style={{ backgroundColor: color || '#ffffff' }}
            />
            {/* Hex code display */}
            <span className="text-[11px] font-mono font-bold text-zinc-300 uppercase truncate">
              {color || '#ffffff'}
            </span>
          </button>

          {/* Trigger action dropdown */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ChevronDown className={`h-3 w-3 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Dropdown Popover */}
        {isOpen && (
          <div className="absolute left-0 mt-1.5 w-64 bg-[#0a0a0b] border border-zinc-800/95 rounded-xl shadow-2xl p-3 z-50 space-y-3 animate-fade-in">
            
            {/* Brand Colors Grid */}
            <div>
              <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                Cores da Marca
              </span>
              {brandColors.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {brandColors.map((bc) => {
                    const isSelected = (color || '').toLowerCase() === bc.value.toLowerCase();
                    return (
                      <button
                        key={bc.id}
                        type="button"
                        onClick={() => {
                          onChange(bc.value);
                          setIsOpen(false);
                        }}
                        style={{ backgroundColor: bc.value }}
                        className="w-6 h-6 rounded-lg border border-zinc-800/80 cursor-pointer hover:scale-110 transition-transform relative flex items-center justify-center shrink-0"
                        title={`${bc.name}: ${bc.value}`}
                      >
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-white stroke-[3] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] text-zinc-500 italic">Nenhuma cor de marca salva.</p>
              )}
            </div>

            {/* Standard Color Presets Grid */}
            <div>
              <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                Paleta Padrão
              </span>
              <div className="grid grid-cols-8 gap-1.5">
                {PRESET_COLORS.map((pc) => {
                  const isSelected = (color || '').toLowerCase() === pc.toLowerCase();
                  return (
                    <button
                      key={pc}
                      type="button"
                      onClick={() => {
                        onChange(pc);
                        setIsOpen(false);
                      }}
                      style={{ backgroundColor: pc }}
                      className="w-5.5 h-5.5 rounded-md border border-zinc-900 cursor-pointer hover:scale-110 transition-transform relative flex items-center justify-center"
                      title={pc}
                    >
                      {isSelected && (
                        <Check className="h-3 w-3 text-white stroke-[3] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Manual custom picker inputs */}
            <div className="pt-2 border-t border-zinc-900 flex items-center justify-between gap-2">
              <span className="text-[9px] font-bold text-zinc-500 uppercase">
                Cor Livre
              </span>
              <div className="flex items-center gap-1.5">
                {/* Text hex input */}
                <input
                  type="text"
                  value={color || ''}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="#ffffff"
                  className="w-20 text-[10px] font-mono text-zinc-300 bg-zinc-950 border border-zinc-850 rounded-lg px-1.5 py-1 text-center uppercase focus:outline-none focus:border-zinc-700"
                />
                
                {/* Pipette custom color button trigger */}
                <label className="relative flex items-center justify-center w-6 h-6 rounded-lg bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors shadow-sm">
                  <Pipette className="h-3 w-3" />
                  <input
                    type="color"
                    value={color || '#ffffff'}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                </label>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
