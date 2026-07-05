import React from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  GripHorizontal,
  Sparkles,
  FileText,
  Layout,
  Smile,
  Plus,
  AlignLeft,
  Settings
} from 'lucide-react';

interface FloatingSectionPanelProps {
  section: 'quickTemplates' | 'savedTemplates' | 'reusableComponents' | 'iconsGallery' | 'blocks' | 'structure' | 'globalStyles';
  onClose: () => void;
  children: React.ReactNode;
}

const SECTION_CONFIG = {
  quickTemplates: { title: 'Modelos Rápidos', icon: Sparkles, color: 'text-blue-400' },
  savedTemplates: { title: 'Modelos Salvos', icon: FileText, color: 'text-indigo-400' },
  reusableComponents: { title: 'Componentes', icon: Layout, color: 'text-purple-400' },
  iconsGallery: { title: 'Ícones PNG', icon: Smile, color: 'text-pink-400' },
  blocks: { title: 'Blocos de Email', icon: Plus, color: 'text-emerald-400' },
  structure: { title: 'Estrutura do Email', icon: AlignLeft, color: 'text-amber-400' },
  globalStyles: { title: 'Configurações Globais', icon: Settings, color: 'text-zinc-400' },
};

export const FloatingSectionPanel: React.FC<FloatingSectionPanelProps> = ({
  section,
  onClose,
  children
}) => {
  const config = SECTION_CONFIG[section] || { title: 'Menu', icon: Settings, color: 'text-zinc-400' };
  const Icon = config.icon;

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragHandleClassName="floating-panel-drag-handle"
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      style={{ x: 0, y: 0 }}
      id={`floating-panel-${section}`}
      className="absolute top-24 left-10 w-80 max-h-[500px] bg-[#0c0c0d]/95 backdrop-blur-md border border-zinc-800/90 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
    >
      {/* Draggable Header */}
      <div className="floating-panel-drag-handle flex items-center justify-between px-4 py-3 bg-zinc-950/70 border-b border-zinc-800/60 cursor-grab active:cursor-grabbing select-none shrink-0">
        <div className="flex items-center gap-2">
          <GripHorizontal className="h-4 w-4 text-zinc-550 shrink-0" />
          <Icon className={`h-4 w-4 ${config.color} shrink-0`} />
          <span className="text-xs font-bold text-zinc-200 tracking-wide uppercase">
            {config.title}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors cursor-pointer"
          title="Fechar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Content body - scrollable */}
      <div className="flex-1 overflow-y-auto p-1.5 custom-scrollbar">
        {children}
      </div>
    </motion.div>
  );
};
