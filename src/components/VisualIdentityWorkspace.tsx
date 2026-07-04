import React, { useState } from 'react';
import { VisualIdentity, BrandColor, ColorRule } from '../types';
import { 
  Palette, 
  Plus, 
  Trash2, 
  Sparkles, 
  Copy, 
  Check, 
  Sliders, 
  Variable, 
  Info,
  HelpCircle,
  Scissors
} from 'lucide-react';

interface VisualIdentityWorkspaceProps {
  visualIdentity: VisualIdentity;
  onUpdateVisualIdentity: (updated: VisualIdentity) => void;
  onInsertSignature: () => void;
}

const PRESET_PALETTES = [
  {
    name: 'Tech Indigo',
    colors: ['#4f46e5', '#3b82f6', '#0f172a', '#64748b']
  },
  {
    name: 'Warm Sunset',
    colors: ['#f97316', '#ea580c', '#f59e0b', '#7c2d12']
  },
  {
    name: 'Emerald Forest',
    colors: ['#10b981', '#059669', '#064e3b', '#111827']
  },
  {
    name: 'Cosmic Magenta',
    colors: ['#d946ef', '#c084fc', '#4c1d95', '#0f172a']
  },
  {
    name: 'Ocean Breeze',
    colors: ['#06b6d4', '#0284c7', '#1e3a8a', '#e0f2fe']
  }
];

export default function VisualIdentityWorkspace({
  visualIdentity,
  onUpdateVisualIdentity,
  onInsertSignature
}: VisualIdentityWorkspaceProps) {
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#6366f1');
  
  // Rule editor state
  const [ruleName, setRuleName] = useState('');
  const [ruleVar, setRuleVar] = useState('userRole');
  const [ruleOp, setRuleOp] = useState<'equals' | 'contains' | 'is_not_empty'>('equals');
  const [ruleVal, setRuleVal] = useState('admin');
  const [ruleColorTrue, setRuleColorTrue] = useState('#10b981');
  const [ruleColorFalse, setRuleColorFalse] = useState('#ef4444');

  const updateIdentity = (updater: (prev: VisualIdentity) => VisualIdentity) => {
    const next = updater(visualIdentity);
    onUpdateVisualIdentity(next);
  };

  // Color actions
  const handleAddColor = () => {
    if (!newColorName.trim()) return;
    const newColor: BrandColor = {
      id: `bc_${Date.now()}`,
      name: newColorName.trim(),
      value: newColorHex
    };
    updateIdentity(prev => ({
      ...prev,
      brandColors: [...prev.brandColors, newColor]
    }));
    setNewColorName('');
  };

  const handleDeleteColor = (id: string) => {
    updateIdentity(prev => ({
      ...prev,
      brandColors: prev.brandColors.filter(c => c.id !== id)
    }));
  };

  const handleApplyPalette = (colors: string[]) => {
    const newBrandColors: BrandColor[] = colors.map((col, idx) => ({
      id: `bc_${Date.now()}_${idx}`,
      name: `Cor Coesa ${idx + 1}`,
      value: col
    }));
    updateIdentity(prev => ({
      ...prev,
      brandColors: newBrandColors
    }));
  };

  // Rule actions
  const handleAddRule = () => {
    if (!ruleName.trim() || !ruleVar.trim()) return;
    const newRule: ColorRule = {
      id: `cr_${Date.now()}`,
      name: ruleName.trim(),
      variableName: ruleVar.trim(),
      operator: ruleOp,
      value: ruleVal,
      colorIfTrue: ruleColorTrue,
      colorIfFalse: ruleColorFalse
    };
    updateIdentity(prev => ({
      ...prev,
      colorRules: [...prev.colorRules, newRule]
    }));
    setRuleName('');
    setRuleVar('userRole');
    setRuleVal('');
  };

  const handleDeleteRule = (id: string) => {
    updateIdentity(prev => ({
      ...prev,
      colorRules: prev.colorRules.filter(r => r.id !== id)
    }));
  };

  // Signature dynamic outputs
  const getSignatureHtmlCode = () => {
    return `<div style="border-left: 3px solid ${visualIdentity.signatureColor || '#4f46e5'}; padding-left: 12px; margin-top: 20px; margin-bottom: 10px; font-family: sans-serif; font-size: 13px; color: #334155; line-height: 1.5;">
  <p style="margin: 0; font-weight: bold; color: #1e293b;">Atenciosamente,</p>
  <p style="margin: 6px 0 2px 0; font-weight: bold; font-size: 15px; color: #0f172a;">${visualIdentity.signatureName || 'Seu Nome'}</p>
  <p style="margin: 0; color: #64748b;">${visualIdentity.signatureRole || 'Cargo'} | <strong style="color: ${visualIdentity.signatureColor || '#4f46e5'};">${visualIdentity.signatureCompany || 'Empresa'}</strong></p>
  <p style="margin: 4px 0 0 0; color: #64748b;">📞 ${visualIdentity.signaturePhone || 'Telefone'}</p>
</div>`;
  };

  const handleCopySignatureHtml = () => {
    navigator.clipboard.writeText(getSignatureHtmlCode());
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Intro Header */}
      <div className="border-b border-zinc-800 pb-5">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Palette className="h-6 w-6 text-indigo-400" />
          Estúdio de Identidade Visual
        </h2>
        <p className="text-zinc-400 text-xs mt-1 max-w-2xl">
          Centralize suas diretrizes de design. Defina cores reutilizáveis para os blocos, crie regras baseadas em variáveis do usuário e configure assinaturas inteligentes para injetar diretamente nos seus e-mails.
        </p>
      </div>

      {/* Grid Layout of Design Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Colors and Rules */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Section 1: Brand Colors */}
          <div className="bg-[#0f0f0f] border border-zinc-800 rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5 uppercase tracking-wider">
                  <Palette className="h-4 w-4 text-pink-400" />
                  Cores da Marca e Reutilizáveis
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Gerencie sua paleta corporativa padrão</p>
              </div>
              <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2.5 py-0.5 rounded-full font-semibold border border-zinc-700">
                {visualIdentity.brandColors.length} cadastradas
              </span>
            </div>

            {/* Recommended Palettes Quick Loader */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Estilos e Paletas Sugeridas</span>
              <div className="flex flex-wrap gap-2.5">
                {PRESET_PALETTES.map((pal, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleApplyPalette(pal.colors)}
                    className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-lg p-1.5 transition-all text-left text-[10px] text-zinc-300"
                    title={`Aplicar paleta ${pal.name}`}
                  >
                    <div className="flex -space-x-1">
                      {pal.colors.slice(0, 3).map((col, cIdx) => (
                        <span 
                          key={cIdx} 
                          className="w-3.5 h-3.5 rounded-full border border-zinc-950 block" 
                          style={{ backgroundColor: col }} 
                        />
                      ))}
                    </div>
                    <span>{pal.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* List of custom brand colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {visualIdentity.brandColors.map((color) => (
                <div 
                  key={color.id} 
                  className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-850 group hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg shadow-inner border border-zinc-800 relative cursor-pointer"
                      style={{ backgroundColor: color.value }}
                    >
                      <input 
                        type="color" 
                        value={color.value}
                        onChange={(e) => {
                          const updatedVal = e.target.value;
                          updateIdentity(prev => ({
                            ...prev,
                            brandColors: prev.brandColors.map(c => c.id === color.id ? { ...c, value: updatedVal } : c)
                          }));
                        }}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" 
                      />
                    </div>
                    <div>
                      <input 
                        type="text"
                        value={color.name}
                        onChange={(e) => {
                          const updatedName = e.target.value;
                          updateIdentity(prev => ({
                            ...prev,
                            brandColors: prev.brandColors.map(c => c.id === color.id ? { ...c, name: updatedName } : c)
                          }));
                        }}
                        className="text-xs font-bold text-zinc-100 bg-transparent border-none focus:outline-none focus:bg-zinc-900 rounded px-1 w-28"
                      />
                      <p className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5">{color.value}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteColor(color.id)}
                    className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Remover Cor"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Creator form */}
            <div className="flex flex-col sm:flex-row gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-850">
              <div className="flex-1 flex gap-2">
                <input 
                  type="text" 
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  placeholder="Nome (Ex: Secundária Teal)"
                  className="flex-1 text-xs bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-pink-500"
                />
                <div className="relative shrink-0 flex items-center">
                  <input 
                    type="color" 
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-zinc-800 cursor-pointer p-0 bg-transparent bg-none"
                  />
                </div>
              </div>
              <button
                onClick={handleAddColor}
                disabled={!newColorName.trim()}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar Cor
              </button>
            </div>
          </div>

          {/* Section 2: Variable-Based Color Rules */}
          <div className="bg-[#0f0f0f] border border-zinc-800 rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5 uppercase tracking-wider">
                  <Variable className="h-4 w-4 text-indigo-400" />
                  Cores que Mudam por Regras de Variáveis
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Defina cores condicionais dinâmicas baseadas nos dados do template</p>
              </div>
              <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2.5 py-0.5 rounded-full font-semibold border border-zinc-700">
                {visualIdentity.colorRules.length} ativas
              </span>
            </div>

            {/* Informational banner */}
            <div className="flex gap-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 p-3 rounded-xl text-xs leading-relaxed">
              <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                As regras condicionais monitoram variáveis do e-mail. Quando a condição é atendida (Ex: <strong>status</strong> é <strong>urgente</strong>), o sistema aplica automaticamente a cor alternativa designada em vez da cor de base do elemento.
              </span>
            </div>

            {/* List of rules */}
            <div className="space-y-3">
              {visualIdentity.colorRules.map((rule) => (
                <div 
                  key={rule.id} 
                  className="p-4 bg-zinc-950 rounded-xl border border-zinc-850 flex flex-col sm:flex-row justify-between sm:items-center gap-4 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-zinc-200">{rule.name}</span>
                      <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono uppercase">
                        Condicional
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400">
                      Se <span className="font-mono text-pink-400">{"{{"}{rule.variableName}{"}}"}</span> {rule.operator === 'equals' ? 'for igual a' : rule.operator === 'contains' ? 'contiver' : 'não estiver vazio'} <span className="font-mono text-zinc-300 font-bold bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">"{rule.value}"</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <span className="text-[8px] text-zinc-500 block font-mono">SE VERDADE</span>
                        <div className="flex items-center gap-1 justify-center mt-1">
                          <span className="w-3.5 h-3.5 rounded border border-zinc-800 block" style={{ backgroundColor: rule.colorIfTrue }} />
                          <span className="text-[10px] font-mono text-zinc-400">{rule.colorIfTrue}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="text-[8px] text-zinc-500 block font-mono">SE FALSO</span>
                        <div className="flex items-center gap-1 justify-center mt-1">
                          <span className="w-3.5 h-3.5 rounded border border-zinc-800 block" style={{ backgroundColor: rule.colorIfFalse }} />
                          <span className="text-[10px] font-mono text-zinc-400">{rule.colorIfFalse}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all sm:opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Excluir regra"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Rule Creator */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-4">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Criar Nova Regra Condicional</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase">Nome da Regra</label>
                  <input 
                    type="text" 
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    placeholder="Ex: Urgência Vermelha"
                    className="w-full text-xs bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase">Variável Alvo</label>
                  <input 
                    type="text" 
                    value={ruleVar}
                    onChange={(e) => setRuleVar(e.target.value)}
                    placeholder="Ex: priority"
                    className="w-full text-xs bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-indigo-500 font-mono text-indigo-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase">Operação</label>
                  <select
                    value={ruleOp}
                    onChange={(e) => setRuleOp(e.target.value as any)}
                    className="w-full text-xs bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="equals">Igual a</option>
                    <option value="contains">Contém</option>
                    <option value="is_not_empty">Não está vazia</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ruleOp !== 'is_not_empty' && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase">Valor de Comparação</label>
                    <input 
                      type="text" 
                      value={ruleVal}
                      onChange={(e) => setRuleVal(e.target.value)}
                      placeholder="Ex: urgente"
                      className="w-full text-xs bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase">Cor se VERDADE</label>
                  <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1">
                    <input 
                      type="color" 
                      value={ruleColorTrue}
                      onChange={(e) => setRuleColorTrue(e.target.value)}
                      className="w-6 h-6 border-none cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-zinc-400">{ruleColorTrue}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase">Cor se FALSO</label>
                  <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1">
                    <input 
                      type="color" 
                      value={ruleColorFalse}
                      onChange={(e) => setRuleColorFalse(e.target.value)}
                      className="w-6 h-6 border-none cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-zinc-400">{ruleColorFalse}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddRule}
                disabled={!ruleName.trim() || !ruleVar.trim()}
                className="w-full py-2 bg-zinc-800 hover:bg-indigo-650 disabled:opacity-45 text-white font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Criar Regra de Cor
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Signature Studio & Live Variable Signature Preview */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Section 3: Professional Signature Builder */}
          <div className="bg-[#0f0f0f] border border-zinc-800 rounded-2xl p-6 space-y-6 flex flex-col h-full justify-between">
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sliders className="h-4 w-4 text-emerald-400" />
                    Gerador de Assinatura de E-mail
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Crie assinaturas profissionais responsivas</p>
                </div>
              </div>

              {/* Signature Settings Forms */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase">Nome do Remetente</label>
                    <input 
                      type="text" 
                      value={visualIdentity.signatureName}
                      onChange={(e) => updateIdentity(prev => ({ ...prev, signatureName: e.target.value }))}
                      className="w-full text-xs bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase">Cargo / Função</label>
                    <input 
                      type="text" 
                      value={visualIdentity.signatureRole}
                      onChange={(e) => updateIdentity(prev => ({ ...prev, signatureRole: e.target.value }))}
                      className="w-full text-xs bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase">Empresa / Logomarca</label>
                    <input 
                      type="text" 
                      value={visualIdentity.signatureCompany}
                      onChange={(e) => updateIdentity(prev => ({ ...prev, signatureCompany: e.target.value }))}
                      className="w-full text-xs bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase">Telefone de Contato</label>
                    <input 
                      type="text" 
                      value={visualIdentity.signaturePhone}
                      onChange={(e) => updateIdentity(prev => ({ ...prev, signaturePhone: e.target.value }))}
                      className="w-full text-xs bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase">Cor do Detalhe Lateral (Accent)</label>
                  <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2">
                    <input 
                      type="color" 
                      value={visualIdentity.signatureColor}
                      onChange={(e) => updateIdentity(prev => ({ ...prev, signatureColor: e.target.value }))}
                      className="w-7 h-7 border-none cursor-pointer"
                    />
                    <span className="text-xs font-mono text-zinc-400">{visualIdentity.signatureColor}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic live visual HTML output preview */}
              <div className="space-y-2 pt-4">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Visualização Real no E-mail</span>
                
                <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                  <div style={{ borderLeft: `3px solid ${visualIdentity.signatureColor}`, paddingLeft: '12px' }} className="font-sans text-xs text-slate-700">
                    <p className="m-0 font-bold text-slate-500 text-[10px] uppercase tracking-wider mb-1.5">Atenciosamente,</p>
                    <p className="m-0 font-extrabold text-sm text-slate-900">{visualIdentity.signatureName || 'Felipe Sales'}</p>
                    <p className="m-0 text-slate-600 mt-1">
                      {visualIdentity.signatureRole || 'Diretor de Design'} | <strong style={{ color: visualIdentity.signatureColor }}>{visualIdentity.signatureCompany || 'InboxFlow Tech'}</strong>
                    </p>
                    <p className="m-0 text-slate-500 mt-1 text-[11px]">
                      📞 {visualIdentity.signaturePhone || '+55 (11) 98765-4321'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ingestion & Export Controls */}
            <div className="space-y-3 pt-6 border-t border-zinc-850 mt-6 shrink-0">
              <button
                onClick={onInsertSignature}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4 text-indigo-200" />
                Injetar Assinatura no E-mail Ativo
              </button>

              <button
                onClick={handleCopySignatureHtml}
                className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedHtml ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    Copiado para Área de Transferência!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-zinc-400" />
                    Copiar Código HTML da Assinatura
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
