import React, { useState } from 'react';
import { ReusableComponent, EmailVariable, EmailElement, ElementType } from '../types';
import { parseFormattedTextToReact } from '../utils';
import SettingsPanel from './SettingsPanel';
import { 
  Layout, 
  Plus, 
  Upload, 
  Download, 
  Trash2, 
  Search, 
  HelpCircle, 
  Sparkles, 
  Sliders, 
  Edit2, 
  Check, 
  Eye, 
  Laptop, 
  Smartphone, 
  Maximize2 
} from 'lucide-react';

interface ComponentsWorkspaceProps {
  reusableComponents: ReusableComponent[];
  onUpdateComponent: (updated: ReusableComponent) => void;
  onDeleteComponent: (id: string) => void;
  onAddComponent: (name: string, type: ElementType) => void;
  onImportComponent: (comp: ReusableComponent) => void;
  variables: EmailVariable[];
}

export default function ComponentsWorkspace({
  reusableComponents,
  onUpdateComponent,
  onDeleteComponent,
  onAddComponent,
  onImportComponent,
  variables,
}: ComponentsWorkspaceProps) {
  const [selectedCompId, setSelectedCompId] = useState<string | null>(
    reusableComponents.length > 0 ? reusableComponents[0].id : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  
  // Creation form state
  const [isCreating, setIsCreating] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [newCompType, setNewCompType] = useState<ElementType>('heading');

  // Preview container background state
  const [previewBg, setPreviewBg] = useState<'white' | 'dark' | 'grid'>('white');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Edit component name state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  // Find active component
  const activeComponent = reusableComponents.find((c) => c.id === selectedCompId);

  // Filtered components
  const filteredComponents = reusableComponents.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.element.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartCreate = () => {
    setNewCompName('');
    setNewCompType('heading');
    setIsCreating(true);
  };

  const handleConfirmCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName.trim()) return;

    onAddComponent(newCompName.trim(), newCompType);
    setIsCreating(false);
    
    // Auto-select the newly created component
    // Note: The new ID is generated based on Date.now() in the parent,
    // so we select the latest one in the list in the next render cycle or using setTimeout
    setTimeout(() => {
      const sorted = [...reusableComponents].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      if (sorted.length > 0) {
        setSelectedCompId(sorted[0].id);
      }
    }, 100);
  };

  const handleUpdateElement = (updatedElement: EmailElement) => {
    if (!activeComponent) return;
    onUpdateComponent({
      ...activeComponent,
      element: updatedElement,
      updatedAt: Date.now(),
    });
  };

  const handleStartEditName = () => {
    if (!activeComponent) return;
    setEditedName(activeComponent.name);
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    if (!activeComponent || !editedName.trim()) return;
    onUpdateComponent({
      ...activeComponent,
      name: editedName.trim(),
      updatedAt: Date.now(),
    });
    setIsEditingName(false);
  };

  const handleExportSingleComponent = (comp: ReusableComponent) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(comp, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href",     dataStr);
    downloadAnchor.setAttribute("download", `${comp.name.toLowerCase().replace(/\s+/g, '_')}_componente.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === 'object' && parsed.name && parsed.element && typeof parsed.element === 'object') {
          onImportComponent(parsed);
          setSelectedCompId(parsed.id);
        } else {
          alert('Formato de arquivo inválido. Certifique-se de que é um JSON de componente de e-mail.');
        }
      } catch (err) {
        alert('Erro ao processar arquivo JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  // Safe element styles generation
  const getStyles = (element: EmailElement) => {
    const s = element.styles;
    const styleObj: React.CSSProperties = {
      color: s.textColor || '#1f2937',
      backgroundColor: s.backgroundColor || 'transparent',
      fontSize: s.fontSize ? `${s.fontSize}px` : undefined,
      fontWeight: s.fontWeight || 'normal',
      borderRadius: s.borderRadius ? `${s.borderRadius}px` : undefined,
      borderStyle: s.borderWidth ? 'solid' : undefined,
      borderWidth: s.borderWidth ? `${s.borderWidth}px` : undefined,
      borderColor: s.borderColor || undefined,
      paddingTop: s.paddingTop ? `${s.paddingTop}px` : undefined,
      paddingBottom: s.paddingBottom ? `${s.paddingBottom}px` : undefined,
      paddingLeft: s.paddingLeft ? `${s.paddingLeft}px` : undefined,
      paddingRight: s.paddingRight ? `${s.paddingRight}px` : undefined,
      marginTop: s.marginTop ? `${s.marginTop}px` : undefined,
      marginBottom: s.marginBottom ? `${s.marginBottom}px` : undefined,
      textAlign: s.align || 'left',
    };

    if (element.type === 'button') {
      styleObj.display = 'inline-block';
      styleObj.textDecoration = 'none';
    }

    if (element.type === 'image') {
      styleObj.maxWidth = '100%';
      styleObj.height = 'auto';
      if (s.width) styleObj.width = `${s.width}px`;
    }

    return styleObj;
  };

  return (
    <div className="flex-1 flex overflow-hidden h-full bg-[#0a0a0a]">
      
      {/* Left Sidebar: Components List */}
      <div className="w-80 shrink-0 h-full border-r border-zinc-800 bg-[#0f0f0f] flex flex-col">
        {/* Header Actions */}
        <div className="p-4 border-b border-zinc-800 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layout className="h-3.5 w-3.5 text-indigo-400" />
              Biblioteca de Componentes
            </h3>
            
            <div className="flex gap-1">
              <label className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg cursor-pointer transition-colors" title="Importar Componente (.json)">
                <Upload className="h-3.5 w-3.5" />
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <button
            onClick={handleStartCreate}
            className="w-full py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-550 hover:to-violet-550 active:scale-95 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Criar Novo Componente
          </button>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar componente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Components list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {isCreating && (
            <form onSubmit={handleConfirmCreate} className="bg-zinc-900 border border-indigo-500/50 rounded-xl p-3 space-y-3 animate-fade-in">
              <span className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Novo Componente</span>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-zinc-400">Nome do Componente</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Assinatura, CTA Roxo..."
                  value={newCompName}
                  onChange={(e) => setNewCompName(e.target.value)}
                  className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-zinc-400">Tipo do Bloco</label>
                <select
                  value={newCompType}
                  onChange={(e) => setNewCompType(e.target.value as ElementType)}
                  className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="heading">Título (Heading)</option>
                  <option value="text">Texto (Paragraph)</option>
                  <option value="button">Botão (CTA Button)</option>
                  <option value="image">Imagem (Image)</option>
                  <option value="link">Hiperlink (Link)</option>
                  <option value="divider">Divisor (Hr)</option>
                  <option value="spacer">Espaçador (Spacer)</option>
                </select>
              </div>
              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-white rounded text-[10px] font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold cursor-pointer"
                >
                  Criar
                </button>
              </div>
            </form>
          )}

          {filteredComponents.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs px-4">
              <Layout className="h-8 w-8 text-zinc-700 mx-auto mb-2 animate-pulse" />
              Nenhum componente encontrado. Crie um novo acima!
            </div>
          ) : (
            filteredComponents.map((comp) => {
              const isActive = comp.id === selectedCompId;
              return (
                <div
                  key={comp.id}
                  onClick={() => {
                    setSelectedCompId(comp.id);
                    setIsEditingName(false);
                  }}
                  className={`group flex items-center justify-between p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isActive
                      ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-300'
                      : 'bg-zinc-900 border-zinc-850 hover:bg-zinc-855 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-1">
                    <span className={`block text-xs font-semibold truncate ${isActive ? 'text-indigo-200' : 'text-zinc-200'}`}>
                      {comp.name}
                    </span>
                    <span className="inline-block text-[9px] font-mono text-zinc-500 mt-0.5 capitalize bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                      {comp.element.type}
                    </span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportSingleComponent(comp);
                      }}
                      className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded"
                      title="Exportar JSON"
                    >
                      <Download className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Tem certeza de que deseja excluir o componente "${comp.name}"?`)) {
                          onDeleteComponent(comp.id);
                          if (selectedCompId === comp.id) {
                            setSelectedCompId(reusableComponents.length > 1 ? reusableComponents[0].id : null);
                          }
                        }
                      }}
                      className="p-1 hover:bg-red-950/50 text-zinc-400 hover:text-red-400 rounded"
                      title="Excluir Componente"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Center Panel: Interactive Live Preview Box */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0a0a]">
        {activeComponent ? (
          <>
            {/* Component Header / Name Edit */}
            <div className="p-4 border-b border-zinc-800 bg-[#0f0f0f] flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                {isEditingName ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="text-sm font-semibold bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-100 focus:outline-none focus:border-indigo-500"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-zinc-200 text-sm">
                      {activeComponent.name}
                    </h2>
                    <button
                      onClick={handleStartEditName}
                      className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg transition-colors"
                      title="Renomear Componente"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/10 uppercase tracking-wider">
                  {activeComponent.element.type}
                </span>
              </div>

              {/* View options / Export */}
              <div className="flex items-center gap-3">
                {/* Contrast controls */}
                <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-[10px]">
                  <button
                    onClick={() => setPreviewBg('white')}
                    className={`px-2 py-1 rounded-md transition-colors ${previewBg === 'white' ? 'bg-zinc-850 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    Fundo Claro
                  </button>
                  <button
                    onClick={() => setPreviewBg('dark')}
                    className={`px-2 py-1 rounded-md transition-colors ${previewBg === 'dark' ? 'bg-zinc-850 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    Fundo Escuro
                  </button>
                  <button
                    onClick={() => setPreviewBg('grid')}
                    className={`px-2 py-1 rounded-md transition-colors ${previewBg === 'grid' ? 'bg-zinc-850 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    Grid
                  </button>
                </div>

                {/* Device controls */}
                <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-zinc-400">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1 rounded-md transition-colors ${previewDevice === 'desktop' ? 'bg-zinc-850 text-white' : 'hover:text-zinc-200'}`}
                    title="Visualização Desktop"
                  >
                    <Laptop className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1 rounded-md transition-colors ${previewDevice === 'mobile' ? 'bg-zinc-850 text-white' : 'hover:text-zinc-200'}`}
                    title="Visualização Mobile"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => handleExportSingleComponent(activeComponent)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> Exportar Componente JSON
                </button>
              </div>
            </div>

            {/* Split layout: Live Preview on Left, Editing Panel immediately next to it on the Right */}
            <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-zinc-950">
              {/* Isolated Canvas Stage */}
              <div className="flex-1 overflow-y-auto p-6 flex justify-center items-center relative bg-zinc-950 bg-radial-gradient">
                {/* Outer template canvas simulator with responsive devices */}
                <div 
                  className={`transition-all duration-300 rounded-2xl shadow-2xl relative border border-zinc-800 overflow-hidden flex flex-col justify-center ${
                    previewDevice === 'mobile' ? 'w-[360px] min-h-[500px]' : 'w-full max-w-xl min-h-[400px]'
                  } ${
                    previewBg === 'white' ? 'bg-white' : previewBg === 'dark' ? 'bg-[#18181b]' : 'bg-zinc-950 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:16px_16px]'
                  }`}
                >
                  {/* Stage Envelope mock header */}
                  <div className="px-4 py-2 border-b border-zinc-150 bg-zinc-50/50 flex items-center justify-between text-[10px] text-zinc-400 shrink-0 font-mono">
                    <span>Simulador de Bloco Isolado</span>
                    <span>largura: {previewDevice === 'mobile' ? '360px' : '600px'}</span>
                  </div>
 
                  <div className="p-10 flex-1 flex flex-col justify-center items-center min-h-0">
                    {/* The Component Render Box itself */}
                    <div className="w-full relative border border-dashed border-indigo-500/20 p-6 rounded-xl hover:border-indigo-500/40 transition-colors group">
                      {/* Visual Tag */}
                      <span className="absolute -top-2.5 left-4 px-1.5 py-0.5 bg-indigo-600 text-[8px] text-white font-bold rounded uppercase tracking-wider pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">
                        {activeComponent.element.type}
                      </span>
 
                      {/* RENDER LOGIC */}
                      {activeComponent.element.type === 'heading' && (
                        <h1 style={getStyles(activeComponent.element)}>
                          {parseFormattedTextToReact(activeComponent.element.content)}
                        </h1>
                      )}
 
                      {activeComponent.element.type === 'text' && (
                        <p style={getStyles(activeComponent.element)} className="whitespace-pre-line">
                          {parseFormattedTextToReact(activeComponent.element.content)}
                        </p>
                      )}
 
                      {activeComponent.element.type === 'button' && (
                        <div className={`flex justify-${activeComponent.element.styles.align === 'center' ? 'center' : activeComponent.element.styles.align === 'right' ? 'end' : 'start'}`}>
                          <a 
                            href={activeComponent.element.href || '#'} 
                            style={getStyles(activeComponent.element)}
                            onClick={(e) => e.preventDefault()}
                          >
                            {parseFormattedTextToReact(activeComponent.element.content)}
                          </a>
                        </div>
                      )}
 
                      {activeComponent.element.type === 'image' && (
                        <div className={`flex justify-${activeComponent.element.styles.align === 'center' ? 'center' : activeComponent.element.styles.align === 'right' ? 'end' : 'start'}`}>
                          <img 
                            src={activeComponent.element.src} 
                            alt={activeComponent.element.alt} 
                            style={getStyles(activeComponent.element)}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
 
                      {activeComponent.element.type === 'link' && (
                        <div className={`flex justify-${activeComponent.element.styles.align === 'center' ? 'center' : activeComponent.element.styles.align === 'right' ? 'end' : 'start'}`}>
                          <a 
                            href={activeComponent.element.href || '#'} 
                            style={getStyles(activeComponent.element)}
                            onClick={(e) => e.preventDefault()}
                            className="hover:underline text-xs"
                          >
                            {parseFormattedTextToReact(activeComponent.element.content)}
                          </a>
                        </div>
                      )}
 
                      {activeComponent.element.type === 'divider' && (
                        <div className="py-2">
                          <hr style={getStyles(activeComponent.element)} />
                        </div>
                      )}
 
                      {activeComponent.element.type === 'spacer' && (
                        <div style={getStyles(activeComponent.element)} className="bg-zinc-400/5 border border-dashed border-zinc-800/10 rounded" />
                      )}
                    </div>
                  </div>
 
                  {/* Stage help footer */}
                  <div className="p-3 bg-zinc-900/10 text-center text-[10px] text-zinc-500 font-mono flex items-center justify-center gap-1">
                    <Sliders className="h-3 w-3 text-indigo-400" /> Use o painel ao lado para editar estilos e textos em tempo real.
                  </div>
                </div>
              </div>
 
              {/* Settings Panel right beside the component editor */}
              <div className="w-80 shrink-0 h-full border-l border-zinc-800 bg-[#0c0c0c] flex flex-col overflow-hidden shadow-2xl relative">
                <div className="p-3 bg-[#0f0f0f] border-b border-zinc-800 flex items-center justify-between text-xs font-bold uppercase tracking-wider shrink-0">
                  <span className="flex items-center gap-1.5 text-zinc-200">
                    <Sliders className="h-3.5 w-3.5 text-indigo-400" />
                    Edição do Componente
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <SettingsPanel
                    element={activeComponent.element}
                    variables={variables}
                    onUpdateElement={handleUpdateElement}
                    onDeleteElement={() => onDeleteComponent(activeComponent.id)}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-center p-8 text-zinc-500 space-y-4">
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-full text-indigo-400">
              <Layout className="h-10 w-10" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-300 text-sm uppercase tracking-wider">Nenhum Componente Selecionado</h3>
              <p className="text-xs text-zinc-500 max-w-[320px] mt-2 leading-relaxed">
                Adicione componentes personalizados que você costuma usar sempre (como assinaturas, cabeçalhos, rodapés com botões) e use-os em qualquer template de email!
              </p>
            </div>
            <button
              onClick={handleStartCreate}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Criar Meu Primeiro Componente
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
