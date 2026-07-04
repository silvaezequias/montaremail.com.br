import React, { useState, useEffect, useRef } from 'react';
import { Palette, Clock, Check, Eye } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  placeholder?: string;
}

// Grouped predefined colors (Paletas predefinidas separadas)
const PREDEFINED_COLORS_GROUPED = [
  {
    category: 'Neutros & Sofisticados',
    colors: ['#000000', '#171717', '#404040', '#737373', '#d4d4d4', '#f5f5f5', '#ffffff']
  },
  {
    category: 'Cores Vivas',
    colors: ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899']
  },
  {
    category: 'Tons Pastéis & Soft',
    colors: ['#fee2e2', '#ffedd5', '#fef3c7', '#d1fae5', '#e0f7fa', '#dbeafe', '#e0e7ff', '#f3e8ff', '#fce7f3']
  }
];

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  let r = 0, g = 0, b = 0;
  const cleaned = hex.replace('#', '');
  if (cleaned.length === 3) {
    r = parseInt(cleaned[0] + cleaned[0], 16);
    g = parseInt(cleaned[1] + cleaned[1], 16);
    b = parseInt(cleaned[2] + cleaned[2], 16);
  } else if (cleaned.length === 6) {
    r = parseInt(cleaned.substring(0, 2), 16);
    g = parseInt(cleaned.substring(2, 4), 16);
    b = parseInt(cleaned.substring(4, 6), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
}

function hsvToHex(h: number, s: number, v: number): string {
  s /= 100;
  v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else if (h >= 300 && h <= 360) { r = c; g = 0; b = x; }
  
  const ri = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  const gi = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  const bi = Math.round((b + m) * 255).toString(16).padStart(2, '0');
  return `#${ri}${gi}${bi}`;
}

export default function ColorPicker({ value, onChange, placeholder }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const popoverRef = useRef<HTMLDivElement>(null);
  const svRef = useRef<HTMLDivElement>(null);

  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [valueState, setValueState] = useState(100);
  
  // Load visual identity brand colors
  const [brandColors, setBrandColors] = useState<{ id: string; name: string; value: string }[]>([]);

  useEffect(() => {
    const loadBrandColors = () => {
      try {
        const saved = localStorage.getItem('react-email-builder-visual-identity');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.brandColors)) {
            setBrandColors(parsed.brandColors);
          }
        }
      } catch (e) {
        // Ignore
      }
    };

    if (isOpen) {
      loadBrandColors();
    }
  }, [isOpen]);

  // Load recent colors from localStorage
  useEffect(() => {
    const loadRecent = () => {
      try {
        const saved = localStorage.getItem('react-email-builder-recent-colors');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setRecentColors(parsed.slice(0, 5));
            return;
          }
        }
      } catch (e) {
        // Fallback
      }
      setRecentColors(['#2563eb', '#10b981', '#ef4444', '#f59e0b', '#7c3aed']);
    };

    loadRecent();

    // Set up storage listener to keep multiple picker components in sync
    const handleStorageChange = () => {
      loadRecent();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Update HSV states when value changes externally
  useEffect(() => {
    if (value && value.startsWith('#')) {
      const { h, s, v } = hexToHsv(value);
      setHue(h);
      setSaturation(s);
      setValueState(v);
    }
  }, [value]);

  // Save color to recents list
  const addToRecents = (color: string) => {
    if (!color || color.toLowerCase() === 'transparent' || !color.startsWith('#')) return;
    try {
      const saved = localStorage.getItem('react-email-builder-recent-colors');
      const parsed = saved ? JSON.parse(saved) : [];
      const filtered = parsed.filter((c: string) => c.toLowerCase() !== color.toLowerCase());
      const updated = [color, ...filtered].slice(0, 5);
      localStorage.setItem('react-email-builder-recent-colors', JSON.stringify(updated));
      setRecentColors(updated);
    } catch (e) {
      // Ignore
    }
  };

  const handleSelectColor = (color: string) => {
    onChange(color);
    addToRecents(color);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Interactive 2D Drag handlers for Saturation-Value square
  const handleSvMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    updateSvCoords(e);
    const handleMouseMove = (moveEvent: MouseEvent) => {
      updateSvCoords(moveEvent);
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const updateSvCoords = (e: MouseEvent | React.MouseEvent) => {
    if (!svRef.current) return;
    const rect = svRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (rect.bottom - e.clientY) / rect.height)); // 1 at top, 0 at bottom
    
    const newS = Math.round(x * 100);
    const newV = Math.round(y * 100);
    
    setSaturation(newS);
    setValueState(newV);
    
    const hex = hsvToHex(hue, newS, newV);
    onChange(hex);
  };

  const activeColor = value || '#ffffff';

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      {/* Target Color Swatch and Text display */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-8 h-8 rounded-xl border border-zinc-850 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer relative flex items-center justify-center overflow-hidden"
          style={{ 
            backgroundColor: activeColor === 'transparent' ? '#ffffff' : activeColor,
            backgroundImage: activeColor === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, #fff 25%, #fff 75%, #ccc 75%, #ccc)' : 'none',
            backgroundSize: activeColor === 'transparent' ? '10px 10px' : 'auto',
            backgroundPosition: activeColor === 'transparent' ? '0 0, 5px 5px' : 'auto'
          }}
          title="Abrir Painel de Cores"
        >
          {activeColor === 'transparent' && (
            <span className="text-[10px] text-red-500 font-bold rotate-45">/</span>
          )}
        </button>

        <input
          type="text"
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val);
            if (val.startsWith('#') && (val.length === 4 || val.length === 7)) {
              addToRecents(val);
            }
          }}
          placeholder={placeholder || 'Nenhum'}
          className="text-xs font-mono bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 w-24 text-zinc-200 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Popover container */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-[#121212] border border-zinc-800 rounded-2xl shadow-2xl z-50 p-4 space-y-4 animate-fade-in">
          
          {/* Identidade Visual Colors */}
          {brandColors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 border-b border-zinc-850 pb-1">
                <Palette className="h-3.5 w-3.5 text-indigo-400" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Identidade Visual
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {brandColors.map((bc, idx) => {
                  const isSelected = activeColor.toLowerCase() === bc.value.toLowerCase();
                  return (
                    <button
                      key={bc.id || idx}
                      type="button"
                      onClick={() => handleSelectColor(bc.value)}
                      className="w-5.5 h-5.5 rounded-full border border-zinc-900 shadow-sm cursor-pointer hover:scale-110 active:scale-95 transition-transform relative flex items-center justify-center group"
                      style={{ backgroundColor: bc.value }}
                      title={`${bc.name}: ${bc.value}`}
                    >
                      {isSelected && (
                        <Check className={`h-3 w-3 ${bc.value.toLowerCase() === '#ffffff' || bc.value.toLowerCase() === '#f5f5f5' ? 'text-black' : 'text-white'}`} />
                      )}
                      
                      {/* Hover Tooltip */}
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-zinc-950 text-zinc-200 text-[8px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none border border-zinc-850 shadow-lg">
                        {bc.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 1: Predefined colors separately grouped */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 border-b border-zinc-850 pb-1">
              <Palette className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Cores Predefinidas
              </span>
            </div>

            <div className="space-y-3 max-h-[170px] overflow-y-auto pr-1 scrollbar-thin">
              {PREDEFINED_COLORS_GROUPED.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-1">
                  <span className="text-[9px] text-zinc-500 font-medium tracking-wide block">
                    {group.category}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {group.colors.map((c) => {
                      const isSelected = activeColor.toLowerCase() === c.toLowerCase();
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => handleSelectColor(c)}
                          className="w-5.5 h-5.5 rounded-full border border-zinc-900 shadow-sm cursor-pointer hover:scale-110 active:scale-95 transition-transform relative flex items-center justify-center"
                          style={{ backgroundColor: c }}
                          title={c}
                        >
                          {isSelected && (
                            <Check className={`h-3 w-3 ${c.toLowerCase() === '#ffffff' || c.toLowerCase() === '#f5f5f5' ? 'text-black' : 'text-white'}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Recently Used Colors (5 cores utilizadas recentemente) */}
          <div className="space-y-2 pt-1 border-t border-zinc-850">
            <div className="flex items-center gap-1.5 pb-1">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Recentes (Últimas 5)
              </span>
            </div>

            <div className="flex items-center">
              {recentColors.length === 0 ? (
                <span className="text-[10px] text-zinc-650 italic">Nenhuma cor recente</span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {recentColors.map((c, idx) => {
                    const isSelected = activeColor.toLowerCase() === c.toLowerCase();
                    return (
                      <button
                        key={`${c}-${idx}`}
                        type="button"
                        onClick={() => handleSelectColor(c)}
                        className="w-6 h-6 rounded-lg border border-zinc-900 shadow-sm cursor-pointer hover:scale-110 active:scale-95 transition-transform relative flex items-center justify-center"
                        style={{ backgroundColor: c }}
                        title={`Cor recente: ${c}`}
                      >
                        {isSelected && (
                          <Check className={`h-3 w-3 ${c.toLowerCase() === '#ffffff' || c.toLowerCase() === '#f5f5f5' ? 'text-black' : 'text-white'}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Fine color picker (Photoshop/Figma Style Saturation-Value box) */}
          <div className="space-y-3 pt-2 border-t border-zinc-850">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Seletor Interativo
            </span>
            
            {/* 2D SV Pad */}
            <div
              ref={svRef}
              onMouseDown={handleSvMouseDown}
              className="relative w-full h-24 rounded-lg cursor-crosshair overflow-hidden select-none"
              style={{
                backgroundColor: `hsl(${hue}, 100%, 50%)`,
                backgroundImage: `
                  linear-gradient(to right, #fff 0%, transparent 100%),
                  linear-gradient(to top, #000 0%, transparent 100%)
                `,
                backgroundBlendMode: 'multiply'
              }}
            >
              {/* Target Dot */}
              <div
                className="absolute w-3.5 h-3.5 -ml-1.5 -mb-1.5 rounded-full border border-white shadow-md cursor-pointer pointer-events-none bg-transparent"
                style={{
                  left: `${saturation}%`,
                  bottom: `${valueState}%`,
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.4)'
                }}
              />
            </div>

            {/* Hue Slider */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max="360"
                value={hue}
                onChange={(e) => {
                  const newH = parseInt(e.target.value);
                  setHue(newH);
                  const hex = hsvToHex(newH, saturation, valueState);
                  onChange(hex);
                }}
                className="w-full h-2.5 rounded-full appearance-none cursor-pointer focus:outline-none"
                style={{
                  background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
                }}
              />
            </div>

            {/* Manual Hex Input and Clear */}
            <div className="flex items-center justify-between bg-zinc-950 p-1.5 rounded-lg border border-zinc-850">
              <span className="text-[10px] font-mono text-zinc-400 uppercase select-all pl-1.5">
                {activeColor}
              </span>
              <button
                type="button"
                onClick={() => handleSelectColor('transparent')}
                className="text-[9px] font-bold text-zinc-400 hover:text-white px-2 py-0.5 hover:bg-zinc-800 rounded border border-zinc-850 cursor-pointer transition-colors"
              >
                Transparente
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
