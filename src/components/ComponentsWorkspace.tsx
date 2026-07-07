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
  Maximize2,
  Heading as HeadingIcon,
  Type,
  Square,
  Image,
  Link as LinkIcon,
  Minus,
  GripVertical,
  ChevronDown,
  ChevronRight
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
  const [expandedCompIds, setExpandedCompIds] = useState<Record<string, boolean>>({});
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

  // Sub-elements state for nested components inside container or grid layout
  const [selectedSubElementId, setSelectedSubElementId] = useState<string | null>(null);

  // Safe recursive helper to find a nested element
  const deepFindElement = (elements: EmailElement[], targetId: string | null): EmailElement | undefined => {
    if (!targetId) return undefined;
    for (const el of elements) {
      if (el.id === targetId) return el;
      if (el.type === 'container' && el.children) {
        const found = deepFindElement(el.children, targetId);
        if (found) return found;
      }
      if (el.type === 'grid' && el.gridCells) {
        for (const cellElements of Object.values(el.gridCells)) {
          const found = deepFindElement(cellElements, targetId);
          if (found) return found;
        }
      }
    }
    return undefined;
  };

  // Currently active sub-element or fallback to root element of active component
  const activeSubElement = activeComponent
    ? (selectedSubElementId ? (deepFindElement([activeComponent.element], selectedSubElementId) || activeComponent.element) : activeComponent.element)
    : null;

  // Safe recursive update of sub-elements
  const deepUpdateSubElement = (elements: EmailElement[], updated: EmailElement): EmailElement[] => {
    return elements.map((el) => {
      if (el.id === updated.id) return updated;
      if (el.type === 'container' && el.children) {
        return {
          ...el,
          children: deepUpdateSubElement(el.children, updated)
        };
      }
      if (el.type === 'grid' && el.gridCells) {
        const updatedCells: Record<string, EmailElement[]> = {};
        for (const [key, cellElements] of Object.entries(el.gridCells)) {
          updatedCells[key] = deepUpdateSubElement(cellElements, updated);
        }
        return {
          ...el,
          gridCells: updatedCells
        };
      }
      return el;
    });
  };

  const handleUpdateSubElement = (updated: EmailElement) => {
    if (!activeComponent) return;
    if (updated.id === activeComponent.element.id) {
      handleUpdateElement(updated);
    } else {
      const root = activeComponent.element;
      const updatedRoot = { ...root };
      if (root.children) {
        updatedRoot.children = deepUpdateSubElement(root.children, updated);
      }
      if (root.gridCells) {
        const updatedCells: Record<string, EmailElement[]> = {};
        for (const [key, cellElements] of Object.entries(root.gridCells)) {
          updatedCells[key] = deepUpdateSubElement(cellElements, updated);
        }
        updatedRoot.gridCells = updatedCells;
      }
      handleUpdateElement(updatedRoot);
    }
  };

  // Safe recursive deletion of sub-elements
  const deepDeleteSubElement = (elements: EmailElement[], idToDelete: string): EmailElement[] => {
    return elements
      .filter((el) => el.id !== idToDelete)
      .map((el) => {
        if (el.type === 'container' && el.children) {
          return {
            ...el,
            children: deepDeleteSubElement(el.children, idToDelete)
          };
        }
        if (el.type === 'grid' && el.gridCells) {
          const updatedCells: Record<string, EmailElement[]> = {};
          for (const [key, cellElements] of Object.entries(el.gridCells)) {
            updatedCells[key] = deepDeleteSubElement(cellElements, idToDelete);
          }
          return {
            ...el,
            gridCells: updatedCells
          };
        }
        return el;
      });
  };

  const handleDeleteSubElement = (idToDelete: string) => {
    if (!activeComponent) return;
    if (idToDelete === activeComponent.element.id) {
      onDeleteComponent(activeComponent.id);
      setSelectedSubElementId(null);
    } else {
      const root = activeComponent.element;
      const updatedRoot = { ...root };
      if (root.children) {
        updatedRoot.children = deepDeleteSubElement(root.children, idToDelete);
      }
      if (root.gridCells) {
        const updatedCells: Record<string, EmailElement[]> = {};
        for (const [key, cellElements] of Object.entries(root.gridCells)) {
          updatedCells[key] = deepDeleteSubElement(cellElements, idToDelete);
        }
        updatedRoot.gridCells = updatedCells;
      }
      handleUpdateElement(updatedRoot);
      setSelectedSubElementId(null);
    }
  };

  // Helper to construct a new default element inside container/grid of component
  const createDefaultElement = (type: ElementType): EmailElement => {
    const id = `${type}_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    let content = 'Novo Bloco';
    let styles: any = {};

    switch (type) {
      case 'heading':
        content = 'Seu Novo Título 👑';
        styles = { fontSize: 18, fontWeight: 'bold', textColor: '#18181b', marginBottom: 12 };
        break;
      case 'text':
        content = 'Este é um parágrafo de texto editável.';
        styles = { fontSize: 14, textColor: '#4b5563', marginBottom: 16 };
        break;
      case 'button':
        content = 'Clique Aqui';
        styles = { backgroundColor: '#4f46e5', textColor: '#ffffff', borderRadius: 8, fontSize: 14, fontWeight: 'semibold', align: 'center', paddingTop: 10, paddingBottom: 10, paddingLeft: 20, paddingRight: 20 };
        break;
      case 'image':
        content = '';
        styles = { width: 200, align: 'center', borderRadius: 8 };
        break;
      case 'link':
        content = 'Clique para ver mais';
        styles = { textColor: '#4f46e5', fontSize: 13, align: 'center' };
        break;
      case 'divider':
        content = '';
        styles = { borderColor: '#e4e4e7', marginTop: 12, marginBottom: 12 };
        break;
      case 'spacer':
        content = '';
        styles = { height: 24 };
        break;
      case 'container':
        content = '';
        styles = { backgroundColor: '#f4f4f5', borderRadius: 12, paddingTop: 16, paddingBottom: 16, paddingLeft: 16, paddingRight: 16 };
        break;
      case 'grid':
        content = '';
        styles = { paddingTop: 12, paddingBottom: 12 };
        break;
    }

    const newEl: EmailElement = { id, type, content, styles };
    if (type === 'container') {
      newEl.children = [];
    } else if (type === 'grid') {
      newEl.rowsCount = 1;
      newEl.colsCount = 2;
      newEl.gridCells = {
        '0-0': [],
        '0-1': [],
      };
    }
    return newEl;
  };

  // Safe recursive helper to insert a new element inside container/grid of component
  const deepInsertElement = (
    elements: EmailElement[],
    targetId: string,
    newEl: EmailElement,
    cellKey?: string
  ): EmailElement[] => {
    return elements.map((el) => {
      if (el.id === targetId) {
        if (el.type === 'container') {
          return {
            ...el,
            children: [...(el.children || []), newEl],
          };
        }
        if (el.type === 'grid' && cellKey) {
          const cells = el.gridCells || {};
          return {
            ...el,
            gridCells: {
              ...cells,
              [cellKey]: [...(cells[cellKey] || []), newEl],
            },
          };
        }
      }

      if (el.type === 'container' && el.children) {
        return {
          ...el,
          children: deepInsertElement(el.children, targetId, newEl, cellKey),
        };
      }

      if (el.type === 'grid' && el.gridCells) {
        const updatedCells: Record<string, EmailElement[]> = {};
        for (const [key, cellElements] of Object.entries(el.gridCells)) {
          updatedCells[key] = deepInsertElement(cellElements, targetId, newEl, cellKey);
        }
        return {
          ...el,
          gridCells: updatedCells,
        };
      }

      return el;
    });
  };

  const handleDropElement = (type: ElementType, targetId: string, cellKey?: string) => {
    if (!activeComponent) return;
    const newEl = createDefaultElement(type);

    if (targetId === activeComponent.element.id) {
      const root = activeComponent.element;
      if (root.type === 'container') {
        const updatedRoot = {
          ...root,
          children: [...(root.children || []), newEl],
        };
        handleUpdateElement(updatedRoot);
        setSelectedSubElementId(newEl.id);
      } else if (root.type === 'grid' && cellKey) {
        const cells = root.gridCells || {};
        const updatedRoot = {
          ...root,
          gridCells: {
            ...cells,
            [cellKey]: [...(cells[cellKey] || []), newEl],
          },
        };
        handleUpdateElement(updatedRoot);
        setSelectedSubElementId(newEl.id);
      }
    } else {
      const root = activeComponent.element;
      const updatedRoot = { ...root };
      if (root.children) {
        updatedRoot.children = deepInsertElement(root.children, targetId, newEl, cellKey);
      }
      if (root.gridCells) {
        const updatedCells: Record<string, EmailElement[]> = {};
        for (const [key, cellElements] of Object.entries(root.gridCells)) {
          updatedCells[key] = deepInsertElement(cellElements, targetId, newEl, cellKey);
        }
        updatedRoot.gridCells = updatedCells;
      }
      handleUpdateElement(updatedRoot);
      setSelectedSubElementId(newEl.id);
    }
  };

  // PALETTE_ELEMENTS lists the available elements to drag or click
  const PALETTE_ELEMENTS = [
    { type: 'heading', label: 'Título (H1)', icon: <HeadingIcon className="h-4 w-4" />, color: 'text-amber-400' },
    { type: 'text', label: 'Parágrafo (Text)', icon: <Type className="h-4 w-4" />, color: 'text-emerald-400' },
    { type: 'button', label: 'Botão (CTA)', icon: <Square className="h-4 w-4" />, color: 'text-indigo-400' },
    { type: 'image', label: 'Imagem (Img)', icon: <Image className="h-4 w-4" />, color: 'text-pink-400' },
    { type: 'link', label: 'Hiperlink (Link)', icon: <LinkIcon className="h-4 w-4" />, color: 'text-sky-400' },
    { type: 'divider', label: 'Divisor (Hr)', icon: <Minus className="h-4 w-4" />, color: 'text-zinc-400' },
    { type: 'spacer', label: 'Espaço (Spacer)', icon: <Maximize2 className="h-4 w-4" />, color: 'text-purple-400' },
    { type: 'container', label: 'Layout Container', icon: <Layout className="h-4 w-4" />, color: 'text-blue-400' },
    { type: 'grid', label: 'Layout Grid', icon: <Layout className="h-4 w-4" />, color: 'text-rose-400' },
  ];

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

  // Recursive nested builder/renderer for elements inside Components Workspace
  const renderElementEditable = (el: EmailElement, parentId?: string, cellKey?: string): React.ReactNode => {
    const isSelected = el.id === selectedSubElementId || (activeComponent && el.id === activeComponent.element.id && !selectedSubElementId);
    const elStyle = getStyles(el);

    const handleSelect = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedSubElementId(el.id);
    };

    const renderInnerContent = () => {
      switch (el.type) {
        case 'heading':
          return (
            <h1 style={elStyle} className="font-bold leading-tight m-0">
              {parseFormattedTextToReact(el.content) || 'Título Vazio'}
            </h1>
          );
        case 'text':
          return (
            <p style={elStyle} className="whitespace-pre-line m-0">
              {parseFormattedTextToReact(el.content) || 'Texto Vazio'}
            </p>
          );
        case 'button':
          return (
            <div className={`flex justify-${el.styles.align === 'center' ? 'center' : el.styles.align === 'right' ? 'end' : 'start'}`}>
              <a 
                href={el.href || '#'} 
                style={elStyle}
                onClick={(e) => e.preventDefault()}
                className="inline-block"
              >
                {parseFormattedTextToReact(el.content) || 'Botão CTA'}
              </a>
            </div>
          );
        case 'image':
          return (
            <div className={`flex justify-${el.styles.align === 'center' ? 'center' : el.styles.align === 'right' ? 'end' : 'start'}`}>
              <img 
                src={el.src || 'https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?w=400&auto=format&fit=crop&q=60'} 
                alt={el.alt || 'Imagem do Componente'} 
                style={elStyle}
                referrerPolicy="no-referrer"
                className="max-w-full"
              />
            </div>
          );
        case 'link':
          return (
            <div className={`flex justify-${el.styles.align === 'center' ? 'center' : el.styles.align === 'right' ? 'end' : 'start'}`}>
              <a 
                href={el.href || '#'} 
                style={elStyle}
                onClick={(e) => e.preventDefault()}
                className="hover:underline text-xs"
              >
                {parseFormattedTextToReact(el.content) || 'Hiperlink'}
              </a>
            </div>
          );
        case 'divider':
          return (
            <div className="py-2 w-full">
              <hr style={elStyle} />
            </div>
          );
        case 'spacer':
          return (
            <div style={elStyle} className="bg-zinc-400/5 border border-dashed border-zinc-800/25 rounded flex items-center justify-center text-[9px] text-zinc-500 font-mono">
              Espaço ({el.styles.height || 24}px)
            </div>
          );
        case 'container': {
          const childrenList = el.children || [];
          return (
            <div 
              style={elStyle} 
              className="w-full min-h-[60px] border border-dashed border-zinc-700/50 rounded-xl p-4 bg-zinc-900/5 transition-all relative group/container"
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const type = e.dataTransfer.getData('application/react-email-builder-type') as ElementType;
                if (type) {
                  handleDropElement(type, el.id);
                }
              }}
            >
              <div className="absolute -top-2 right-2 px-1 py-0.5 bg-zinc-850 border border-zinc-800 rounded text-[7px] text-zinc-400 uppercase tracking-wider font-mono opacity-60 group-hover/container:opacity-100 transition-opacity">
                📦 Container
              </div>
              <div className="space-y-3 min-h-[40px]">
                {childrenList.length === 0 ? (
                  <div className="text-[10px] text-zinc-500 text-center py-4 border border-dashed border-zinc-800 rounded-lg">
                    Arraste ou insira elementos aqui
                  </div>
                ) : (
                  childrenList.map((child) => (
                    <React.Fragment key={child.id}>
                      {renderElementEditable(child, el.id)}
                    </React.Fragment>
                  ))
                )}
              </div>

              {/* Quick Toolbar Inside Container */}
              <div className="mt-3 pt-2 border-t border-zinc-800/50 flex items-center justify-between flex-wrap gap-1">
                <span className="text-[8px] text-zinc-500 font-mono uppercase font-bold">Inserir:</span>
                <div className="flex gap-1 flex-wrap">
                  {(['heading', 'text', 'button', 'image', 'spacer'] as ElementType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDropElement(t, el.id);
                      }}
                      className="text-[8px] bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white px-1.5 py-0.5 rounded border border-zinc-800 cursor-pointer transition-colors"
                    >
                      +{t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        }
        case 'grid': {
          const rows = el.rowsCount || 1;
          const cols = el.colsCount || 2;
          const gridCells = el.gridCells || {};
          return (
            <div style={elStyle} className="w-full border border-dashed border-zinc-700/50 rounded-xl p-3 bg-zinc-950/10 relative group/grid">
              <div className="absolute -top-2 right-2 px-1 py-0.5 bg-zinc-850 border border-zinc-800 rounded text-[7px] text-zinc-400 uppercase tracking-wider font-mono opacity-60 group-hover/grid:opacity-100 transition-opacity">
                🎛️ Grid {rows}x{cols}
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                {Array.from({ length: rows }).map((_, r) => (
                  <React.Fragment key={r}>
                    {Array.from({ length: cols }).map((_, c) => {
                      const cellKey = `${r}-${c}`;
                      const cellElements = gridCells[cellKey] || [];
                      return (
                        <div
                          key={cellKey}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const type = e.dataTransfer.getData('application/react-email-builder-type') as ElementType;
                            if (type) {
                              handleDropElement(type, el.id, cellKey);
                            }
                          }}
                          className="border border-zinc-850 bg-zinc-900/10 p-2.5 rounded-lg space-y-2 min-h-[100px] flex flex-col justify-between"
                        >
                          <div>
                            <div className="text-[7px] text-zinc-500 font-mono font-bold uppercase mb-1">Célula {r+1},{c+1}</div>
                            <div className="space-y-2">
                              {cellElements.length === 0 ? (
                                <div className="text-[8px] text-zinc-600 text-center py-3 border border-dashed border-zinc-850/60 rounded">
                                  Vazio
                                </div>
                              ) : (
                                cellElements.map((child) => (
                                  <React.Fragment key={child.id}>
                                    {renderElementEditable(child, el.id, cellKey)}
                                  </React.Fragment>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Quick Toolbar Inside Grid Cell */}
                          <div className="mt-2 pt-2 border-t border-zinc-800/40 flex items-center justify-between flex-wrap gap-1">
                            <span className="text-[7px] text-zinc-500 font-mono font-bold uppercase">Inserir:</span>
                            <div className="flex gap-0.5 flex-wrap">
                              {(['heading', 'text', 'button', 'image'] as ElementType[]).map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDropElement(t, el.id, cellKey);
                                  }}
                                  className="text-[7px] bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white px-1 py-0.5 rounded border border-zinc-800 cursor-pointer transition-colors"
                                >
                                  +{t}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          );
        }
        default:
          return null;
      }
    };

    return (
      <div
        onClick={handleSelect}
        className={`group/el relative p-3 rounded-xl border transition-all cursor-pointer ${
          isSelected 
            ? 'border-indigo-500 bg-indigo-500/5 shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/50' 
            : 'border-transparent hover:border-zinc-800 hover:bg-zinc-900/40'
        }`}
      >
        {/* Selection Indicator Tag */}
        {isSelected && (
          <div className="absolute -top-2 -left-2 px-1.5 py-0.5 bg-indigo-600 border border-indigo-400 text-[8px] text-white font-bold rounded shadow-lg uppercase tracking-wider font-mono animate-scale-in z-10 flex items-center gap-1">
            <Check className="h-2 w-2" /> {el.type}
          </div>
        )}

        {/* Hover element tag */}
        {!isSelected && (
          <div className="absolute -top-2.5 -right-2 hidden group-hover/el:flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 shadow-md z-10">
            <span className="text-[7px] text-zinc-500 font-mono uppercase tracking-wider font-bold">{el.type}</span>
          </div>
        )}

        {renderInnerContent()}
      </div>
    );
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
              const isExpanded = !!expandedCompIds[comp.id];
              return (
                <div key={comp.id} className="space-y-1">
                  <div
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
                    <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedCompIds(prev => ({
                            ...prev,
                            [comp.id]: !prev[comp.id]
                          }));
                        }}
                        className="p-1 hover:bg-zinc-850 text-zinc-500 hover:text-zinc-350 rounded shrink-0 transition-colors"
                        title={isExpanded ? "Recolher estrutura" : "Expandir estrutura"}
                      >
                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </button>
                      
                      <div className="min-w-0 flex-1">
                        <span className={`block text-xs font-semibold truncate ${isActive ? 'text-indigo-200' : 'text-zinc-200'}`}>
                          {comp.name}
                        </span>
                        <span className="inline-block text-[9px] font-mono text-zinc-500 mt-0.5 capitalize bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                          {comp.element.type}
                        </span>
                      </div>
                    </div>
                    
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all shrink-0">
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
                  
                  {isExpanded && (
                    <div className="ml-3 pl-3 py-1.5 border-l border-zinc-800 space-y-1 animate-fade-in text-[10px] bg-zinc-950/20 rounded-r-lg p-2 text-zinc-400">
                      <span className="text-zinc-500 block uppercase tracking-wider font-bold text-[8px] mb-1">
                        Estrutura Interna
                      </span>
                      {comp.element.type === 'container' && comp.element.children && comp.element.children.length > 0 ? (
                        comp.element.children.map((child, index) => (
                          <div key={child.id} className="flex items-center gap-2 text-zinc-400 py-0.5">
                            <span className="text-zinc-600 font-mono text-[8px]">#{index + 1}</span>
                            <span className="capitalize font-semibold text-zinc-300">{child.type}</span>
                            {child.content && (
                              <span className="text-zinc-500 truncate max-w-[120px] italic">
                                "{child.content}"
                              </span>
                            )}
                          </div>
                        ))
                      ) : comp.element.type === 'grid' && comp.element.gridCells ? (
                        <div className="text-zinc-500 italic text-[9px] py-0.5">Layout Grid (Colunas lado a lado)</div>
                      ) : (
                        <div className="text-zinc-400 py-0.5">
                          <span className="capitalize font-semibold text-zinc-300">{comp.element.type}</span>
                          {comp.element.content && (
                            <span className="text-zinc-500 truncate max-w-[120px] italic ml-1">
                              "{comp.element.content}"
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
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

            {/* Split layout: Elements Palette on Left, Live Preview in Center, Editing Panel on Right */}
            <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-zinc-950">
              
              {/* Left-side Palette of Draggable Elements */}
              <div className="w-56 shrink-0 border-r border-zinc-900 bg-[#0c0c0c] flex flex-col h-full overflow-hidden">
                <div className="p-3 border-b border-zinc-900">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Paleta de Elementos</h4>
                  <p className="text-[9px] text-zinc-500 mt-0.5">Arraste para o bloco ou use os botões rápidos de inserção.</p>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {PALETTE_ELEMENTS.map((item) => (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/react-email-builder-type', item.type);
                      }}
                      onClick={() => handleDropElement(item.type as ElementType, activeComponent.element.id)}
                      className="group flex items-center gap-2.5 p-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-xl cursor-grab active:cursor-grabbing transition-all hover:translate-x-0.5 active:scale-[0.98]"
                      title="Arraste para um Container/Grid ou clique para inserir"
                    >
                      <div className={`p-1.5 bg-zinc-950 rounded-lg group-hover:bg-zinc-900 transition-colors border border-zinc-800 ${item.color}`}>
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-semibold text-zinc-200">{item.label}</span>
                        <span className="block text-[8px] text-zinc-500 font-mono capitalize">{item.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-[#0a0a0a] border-t border-zinc-900 text-[8px] text-zinc-500 font-mono flex flex-col gap-1">
                  <span>💡 Dica:</span>
                  <span>Você pode clicar para adicionar ou arrastar para as áreas pontilhadas.</span>
                </div>
              </div>

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
 
                  <div className="p-6 flex-1 flex flex-col justify-center items-center min-h-0 overflow-y-auto">
                    {/* The Component Render Box itself */}
                    <div className="w-full relative">
                      {/* RENDER LOGIC */}
                      {renderElementEditable(activeComponent.element)}
                    </div>
                  </div>
 
                  {/* Stage help footer */}
                  <div className="p-3 bg-zinc-900/10 text-center text-[10px] text-zinc-500 font-mono flex items-center justify-center gap-1">
                    <Sliders className="h-3 w-3 text-indigo-400" /> Clique nos sub-elementos para selecioná-los e editá-los no painel de controle.
                  </div>
                </div>
              </div>
 
              {/* Settings Panel right beside the component editor */}
              <div className="w-80 shrink-0 h-full border-l border-zinc-800 bg-[#0c0c0c] flex flex-col overflow-hidden shadow-2xl relative">
                <div className="p-3 bg-[#0f0f0f] border-b border-zinc-800 flex items-center justify-between text-xs font-bold uppercase tracking-wider shrink-0">
                  <span className="flex items-center gap-1.5 text-zinc-200">
                    <Sliders className="h-3.5 w-3.5 text-indigo-400" />
                    Propriedades do Componente
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto flex flex-col">
                  {/* General Component Configuration (Always Visible) */}
                  <div className="p-4 border-b border-zinc-900 bg-[#0d0d0d] space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Nome do Componente</label>
                      <input
                        type="text"
                        value={activeComponent.name}
                        onChange={(e) => {
                          onUpdateComponent({
                            ...activeComponent,
                            name: e.target.value,
                            updatedAt: Date.now()
                          });
                        }}
                        className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-indigo-500 font-semibold"
                      />
                    </div>
                  </div>

                  {/* Specific Element Editor */}
                  <div className="flex-1 overflow-y-auto">
                    {activeSubElement && (
                      <SettingsPanel
                        element={activeSubElement}
                        variables={variables}
                        onUpdateElement={handleUpdateSubElement}
                        onDeleteElement={
                          activeSubElement.id === activeComponent.element.id
                            ? undefined // Don't let them delete the root element container of the component!
                            : () => handleDeleteSubElement(activeSubElement.id)
                        }
                      />
                    )}
                  </div>
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
