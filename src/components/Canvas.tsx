import React, { useState } from 'react';
import { EmailElement, EmailTemplate, ElementType, VisualIdentity } from '../types';
import { replaceVariables, parseFormattedTextToReact } from '../utils';
import { 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Sparkles, 
  Mail, 
  Inbox, 
  Smartphone, 
  Laptop, 
  Plus, 
  Layout, 
  Search, 
  Menu, 
  ArrowLeft, 
  Reply, 
  MoreVertical, 
  Settings, 
  HelpCircle, 
  Grid, 
  Star, 
  Archive, 
  Send, 
  File, 
  Trash,
  Sliders,
  ChevronRight,
  RefreshCw,
  Clock,
  Briefcase,
  Edit3,
  Eye,
  Columns
} from 'lucide-react';

interface CanvasProps {
  template: EmailTemplate;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (updatedElement: EmailElement) => void;
  onAddElementAt: (type: ElementType, index: number) => void;
  onAddCustomElementAt: (element: EmailElement, index: number) => void;
  onDeleteElement: (id: string) => void;
  onReorderElements: (elements: EmailElement[]) => void;
  visualIdentity: VisualIdentity;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export default function Canvas({
  template,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onAddElementAt,
  onAddCustomElementAt,
  onDeleteElement,
  onReorderElements,
  visualIdentity,
  isSidebarOpen = true,
  onToggleSidebar,
}: CanvasProps) {
  const { elements, variables, globalStyles } = template;
  const [isDragOverCanvas, setIsDragOverCanvas] = useState(false);
  const [activeDropIndex, setActiveDropIndex] = useState<number | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  
  const [dragOverContainerId, setDragOverContainerId] = useState<string | null>(null);
  const [dragOverChildId, setDragOverChildId] = useState<string | null>(null);
  const [dragOverGridCellKey, setDragOverGridCellKey] = useState<string | null>(null);

  // State for email client visual simulation
  const [emailClient, setEmailClient] = useState<'default' | 'gmail' | 'outlook' | 'hotmail'>('default');
  const [canvasMode, setCanvasMode] = useState<'editor' | 'preview' | 'both'>('editor');

  const [renderKey, setRenderKey] = useState(0);
  const [isReloading, setIsReloading] = useState(false);

  const handleReloadSimulation = () => {
    setIsReloading(true);
    setIsDragOverCanvas(false);
    setActiveDropIndex(null);
    setDragOverContainerId(null);
    setDragOverChildId(null);
    setDragOverGridCellKey(null);
    setRenderKey((prev) => prev + 1);
    setTimeout(() => {
      setIsReloading(false);
    }, 600);
  };

  const createDefaultElement = (type: ElementType): EmailElement => {
    const id = `${type}_nested_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    switch (type) {
      case 'heading':
        return {
          id,
          type,
          content: 'Título Interno 🌟',
          styles: { fontSize: 18, fontWeight: 'bold', textColor: '#0f172a', align: 'center', marginBottom: 12, marginTop: 8 }
        };
      case 'text':
        return {
          id,
          type,
          content: 'Texto interno editável do container.',
          styles: { fontSize: 13, textColor: '#334155', align: 'left', marginBottom: 12 }
        };
      case 'button':
        return {
          id,
          type,
          content: 'Clique Aqui',
          href: '#',
          styles: {
            backgroundColor: '#2563eb',
            textColor: '#ffffff',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 'semibold',
            align: 'center',
            paddingTop: 8,
            paddingBottom: 8,
            paddingLeft: 16,
            paddingRight: 16,
            marginTop: 8,
            marginBottom: 8
          }
        };
      case 'image':
        return {
          id,
          type,
          content: '',
          src: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80',
          alt: 'Placeholder Image',
          styles: { width: 150, borderRadius: 6, align: 'center', marginTop: 8, marginBottom: 8 }
        };
      case 'link':
        return {
          id,
          type,
          content: 'Visitar link interno',
          href: '#',
          styles: { textColor: '#2563eb', fontSize: 12, align: 'center', marginBottom: 12 }
        };
      case 'divider':
        return {
          id,
          type,
          content: '',
          styles: { borderColor: '#e2e8f0', borderWidth: 1, marginBottom: 12, marginTop: 8 }
        };
      case 'spacer':
        return {
          id,
          type,
          content: '',
          styles: { height: 16 }
        };
      case 'container':
        return {
          id,
          type,
          content: '',
          children: [
            {
              id: `text_nested_inner_${Date.now()}`,
              type: 'text',
              content: 'Texto interno do container aninhado.',
              styles: { fontSize: 13, textColor: '#334155' }
            }
          ],
          styles: {
            backgroundColor: '#f8fafc',
            borderRadius: 6,
            paddingTop: 12,
            paddingBottom: 12,
            paddingLeft: 12,
            paddingRight: 12,
            marginTop: 8,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: '#e2e8f0'
          }
        };
      case 'grid':
        return {
          id,
          type,
          content: '',
          rowsCount: 1,
          colsCount: 2,
          gridCells: {
            '0-0': [
              {
                id: `text_g_nested_${Date.now()}_0`,
                type: 'text',
                content: 'Coluna 1',
                styles: { fontSize: 12, align: 'center' }
              }
            ],
            '0-1': [
              {
                id: `text_g_nested_${Date.now()}_1`,
                type: 'text',
                content: 'Coluna 2',
                styles: { fontSize: 12, align: 'center' }
              }
            ]
          },
          styles: {
            backgroundColor: 'transparent',
            borderRadius: 6,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            marginTop: 8,
            marginBottom: 8,
            paddingTop: 4,
            paddingBottom: 4,
            paddingLeft: 4,
            paddingRight: 4
          }
        };
      default:
        return {
          id,
          type: 'text',
          content: 'Novo Bloco',
          styles: {}
        };
    }
  };

  const deepRemoveElement = (list: EmailElement[], idToDelete: string): EmailElement[] => {
    return list
      .filter(el => el.id !== idToDelete)
      .map(el => {
        if (el.type === 'container' && el.children) {
          return {
            ...el,
            children: deepRemoveElement(el.children, idToDelete)
          };
        }
        if (el.type === 'grid' && el.gridCells) {
          const updatedCells: Record<string, EmailElement[]> = {};
          for (const [key, cellElements] of Object.entries(el.gridCells)) {
            updatedCells[key] = deepRemoveElement(cellElements, idToDelete);
          }
          return {
            ...el,
            gridCells: updatedCells
          };
        }
        return el;
      });
  };

  const handleDropUnified = (
    e: React.DragEvent,
    dest: 
      | { type: 'top'; index?: number }
      | { type: 'container'; containerId: string; childIndex?: number }
      | { type: 'grid'; gridId: string; cellKey: string; childIndex?: number }
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const customElementJson = e.dataTransfer.getData('application/react-email-builder-custom-element');
    const sourceId = e.dataTransfer.getData('application/react-email-builder-source-id');
    const type = e.dataTransfer.getData('application/react-email-builder-type') as ElementType;

    let targetElement: EmailElement | null = null;

    if (customElementJson) {
      try {
        const element = JSON.parse(customElementJson) as EmailElement;
        const id = sourceId ? element.id : `${element.type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        targetElement = {
          ...element,
          id,
        };
      } catch (err) {
        console.error('Failed parsing custom element:', err);
        return;
      }
    } else if (type) {
      targetElement = createDefaultElement(type);
    }

    if (!targetElement) return;

    let updatedElements = [...elements];

    if (sourceId) {
      updatedElements = deepRemoveElement(updatedElements, sourceId);
    }

    if (dest.type === 'top') {
      const targetIndex = dest.index !== undefined ? dest.index : updatedElements.length;
      updatedElements.splice(targetIndex, 0, targetElement);
    } else if (dest.type === 'container') {
      const insertIntoContainer = (list: EmailElement[]): EmailElement[] => {
        return list.map((item) => {
          if (item.id === dest.containerId) {
            const currentChildren = item.children || [];
            const updatedChildren = [...currentChildren];
            const childIndex = dest.childIndex !== undefined ? dest.childIndex : updatedChildren.length;
            updatedChildren.splice(childIndex, 0, targetElement!);
            return {
              ...item,
              children: updatedChildren,
            };
          }
          if (item.type === 'container' && item.children) {
            return {
              ...item,
              children: insertIntoContainer(item.children),
            };
          }
          if (item.type === 'grid' && item.gridCells) {
            const updatedCells: Record<string, EmailElement[]> = {};
            for (const [key, cellElements] of Object.entries(item.gridCells)) {
              updatedCells[key] = insertIntoContainer(cellElements);
            }
            return {
              ...item,
              gridCells: updatedCells,
            };
          }
          return item;
        });
      };
      updatedElements = insertIntoContainer(updatedElements);
    } else if (dest.type === 'grid') {
      const insertIntoGrid = (list: EmailElement[]): EmailElement[] => {
        return list.map((item) => {
          if (item.id === dest.gridId) {
            const currentCells = item.gridCells || {};
            const currentCellElements = currentCells[dest.cellKey] || [];
            const updatedCellElements = [...currentCellElements];
            const childIndex = dest.childIndex !== undefined ? dest.childIndex : updatedCellElements.length;
            updatedCellElements.splice(childIndex, 0, targetElement!);
            return {
              ...item,
              gridCells: {
                ...currentCells,
                [dest.cellKey]: updatedCellElements,
              },
            };
          }
          if (item.type === 'container' && item.children) {
            return {
              ...item,
              children: insertIntoGrid(item.children),
            };
          }
          if (item.type === 'grid' && item.gridCells) {
            const updatedCells: Record<string, EmailElement[]> = {};
            for (const [key, cellElements] of Object.entries(item.gridCells)) {
              updatedCells[key] = insertIntoGrid(cellElements);
            }
            return {
              ...item,
              gridCells: updatedCells,
            };
          }
          return item;
        });
      };
      updatedElements = insertIntoGrid(updatedElements);
    }

    onReorderElements(updatedElements);
    onSelectElement(targetElement.id);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent, index?: number) => {
    e.preventDefault();
    setIsDragOverCanvas(true);
    if (index !== undefined) {
      setActiveDropIndex(index);
    }
  };

  const handleDragLeave = () => {
    setIsDragOverCanvas(false);
    setActiveDropIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index?: number) => {
    setIsDragOverCanvas(false);
    setActiveDropIndex(null);
    handleDropUnified(e, { type: 'top', index });
  };

  const moveElement = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= elements.length) return;

    const updated = [...elements];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    onReorderElements(updated);
  };

  // Convert custom styles to React Inline styles for CSS preview, applying conditional visual identity rules
  const getElementStyles = (el: EmailElement): React.CSSProperties => {
    const styles = el.styles;
    const styleObj: React.CSSProperties = {};

    let textColor = styles.textColor;
    let backgroundColor = styles.backgroundColor;

    // Apply conditional color rules from visual identity
    if (visualIdentity && visualIdentity.colorRules && visualIdentity.colorRules.length > 0) {
      for (const rule of visualIdentity.colorRules) {
        const variable = variables.find((v) => v.key === rule.variableName);
        const varValue = variable ? variable.value : '';

        if (varValue) {
          let match = false;
          if (rule.operator === 'equals') {
            match = varValue.toLowerCase() === rule.value.toLowerCase();
          } else if (rule.operator === 'contains') {
            match = varValue.toLowerCase().includes(rule.value.toLowerCase());
          } else if (rule.operator === 'not_equals') {
            match = varValue.toLowerCase() !== rule.value.toLowerCase();
          }

          if (match) {
            if (el.type === 'button') {
              backgroundColor = rule.colorIfTrue;
            } else {
              textColor = rule.colorIfTrue;
            }
          } else {
            if (el.type === 'button') {
              backgroundColor = rule.colorIfFalse;
            } else {
              textColor = rule.colorIfFalse;
            }
          }
        }
      }
    }

    if (textColor) styleObj.color = textColor;
    
    if (backgroundColor && el.type !== 'divider' && el.type !== 'spacer') {
      styleObj.backgroundColor = backgroundColor;
    }
    
    if (styles.fontSize) styleObj.fontSize = `${styles.fontSize}px`;
    
    if (styles.fontWeight) styleObj.fontWeight = styles.fontWeight;
    
    if (styles.borderRadiusTopLeft !== undefined) styleObj.borderTopLeftRadius = `${styles.borderRadiusTopLeft}px`;
    if (styles.borderRadiusTopRight !== undefined) styleObj.borderTopRightRadius = `${styles.borderRadiusTopRight}px`;
    if (styles.borderRadiusBottomLeft !== undefined) styleObj.borderBottomLeftRadius = `${styles.borderRadiusBottomLeft}px`;
    if (styles.borderRadiusBottomRight !== undefined) styleObj.borderBottomRightRadius = `${styles.borderRadiusBottomRight}px`;
    if (styles.borderRadius !== undefined && styles.borderRadiusTopLeft === undefined) {
      styleObj.borderRadius = `${styles.borderRadius}px`;
    }
    
    if (styles.borderWidth !== undefined) {
      styleObj.borderStyle = 'solid';
      styleObj.borderWidth = `${styles.borderWidth}px`;
      if (styles.borderColor) styleObj.borderColor = styles.borderColor;
    }

    // Align layout
    if (styles.align) styleObj.textAlign = styles.align;

    // Spacings
    if (el.type === 'container' || el.type === 'grid') {
      styleObj.paddingTop = styles.paddingTop !== undefined ? `${styles.paddingTop}px` : '16px';
      styleObj.paddingBottom = styles.paddingBottom !== undefined ? `${styles.paddingBottom}px` : '16px';
      styleObj.paddingLeft = styles.paddingLeft !== undefined ? `${styles.paddingLeft}px` : '16px';
      styleObj.paddingRight = styles.paddingRight !== undefined ? `${styles.paddingRight}px` : '16px';
    } else {
      if (styles.paddingTop !== undefined) styleObj.paddingTop = `${styles.paddingTop}px`;
      if (styles.paddingBottom !== undefined) styleObj.paddingBottom = `${styles.paddingBottom}px`;
      if (styles.paddingLeft !== undefined) styleObj.paddingLeft = `${styles.paddingLeft}px`;
      if (styles.paddingRight !== undefined) styleObj.paddingRight = `${styles.paddingRight}px`;
    }
    
    if (styles.marginTop !== undefined) styleObj.marginTop = `${styles.marginTop}px`;
    if (styles.marginBottom !== undefined) styleObj.marginBottom = `${styles.marginBottom}px`;
    if (styles.marginLeft !== undefined) styleObj.marginLeft = `${styles.marginLeft}px`;
    if (styles.marginRight !== undefined) styleObj.marginRight = `${styles.marginRight}px`;

    if (el.type === 'button') {
      styleObj.display = 'inline-block';
      styleObj.textDecoration = 'none';
      if (!styles.paddingTop) styleObj.paddingTop = '12px';
      if (!styles.paddingBottom) styleObj.paddingBottom = '12px';
      if (!styles.paddingLeft) styleObj.paddingLeft = '24px';
      if (!styles.paddingRight) styleObj.paddingRight = '24px';
    }

    return styleObj;
  };

  // Safe wrapper for rendering element content with replaced variables and rich text formatting
  const renderContent = (contentString: string) => {
    const textWithVars = replaceVariables(contentString, variables);
    return parseFormattedTextToReact(textWithVars);
  };

  // Helper variables for layout rendering
  const activeSubject = elements.find((el) => el.type === 'heading')?.content
    ? replaceVariables(elements.find((el) => el.type === 'heading')!.content, variables)
    : 'Seu e-mail pronto para envio!';

  const activeDestinatary = replaceVariables('{{userName}}', variables) || 'cliente@email.com';

  // Render pristine, clean preview elements (hiding all editor outlines, handles, grids indicators)
  const renderCleanElement = (el: EmailElement): React.ReactNode => {
    const elStyle = getElementStyles(el);
    
    switch (el.type) {
      case 'heading':
        return (
          <h2 style={elStyle} className="font-bold leading-tight m-0">
            {renderContent(el.content) || 'Título Vazio'}
          </h2>
        );
      case 'text':
        return (
          <div style={elStyle} className="space-y-2 leading-relaxed">
            {el.content.split('\n\n').map((para, i) => (
              <p key={i} className="m-0">
                {renderContent(para) || 'Parágrafo Vazio'}
              </p>
            ))}
          </div>
        );
      case 'button': {
        const alignment = el.styles.align || 'center';
        let alignClass = 'text-center';
        if (alignment === 'left') alignClass = 'text-left';
        if (alignment === 'right') alignClass = 'text-right';

        return (
          <div className={alignClass}>
            <a
              href={replaceVariables(el.href || '#', variables)}
              style={elStyle}
              className="hover:opacity-90 inline-block font-semibold shadow-xs"
              onClick={(e) => e.preventDefault()}
            >
              {renderContent(el.content) || 'Clique Aqui'}
            </a>
          </div>
        );
      }
      case 'image': {
        const imgSrc = replaceVariables(el.src || '', variables) || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop';
        const alignment = el.styles.align || 'center';
        let alignClass = 'flex justify-center';
        if (alignment === 'left') alignClass = 'flex justify-start';
        if (alignment === 'right') alignClass = 'flex justify-end';

        const imageTag = (
          <img
            src={imgSrc}
            alt={el.alt || 'Template Image'}
            style={{
              width: el.styles.width ? `${el.styles.width}px` : '100%',
              height: el.styles.height ? `${el.styles.height}px` : 'auto',
              borderRadius: el.styles.borderRadius ? `${el.styles.borderRadius}px` : '0px',
              objectFit: 'cover',
            }}
            className="max-w-full"
            referrerPolicy="no-referrer"
          />
        );

        return (
          <div className={alignClass} style={{ marginTop: el.styles.marginTop, marginBottom: el.styles.marginBottom }}>
            {el.href ? (
              <a
                href={replaceVariables(el.href, variables)}
                onClick={(e) => e.preventDefault()}
                className="block"
              >
                {imageTag}
              </a>
            ) : (
              imageTag
            )}
          </div>
        );
      }
      case 'link':
        return (
          <div style={{ textAlign: el.styles.align || 'left', marginTop: el.styles.marginTop, marginBottom: el.styles.marginBottom }}>
            <a
              href={replaceVariables(el.href || '#', variables)}
              style={elStyle}
              className="underline hover:opacity-85 font-medium"
              onClick={(e) => e.preventDefault()}
            >
              {renderContent(el.content) || 'Link Clicável'}
            </a>
          </div>
        );
      case 'divider':
        return (
          <hr
            style={{
              borderColor: el.styles.borderColor || '#e2e8f0',
              borderWidth: el.styles.borderWidth || 1,
              borderStyle: 'solid',
              marginTop: el.styles.marginTop !== undefined ? `${el.styles.marginTop}px` : '12px',
              marginBottom: el.styles.marginBottom !== undefined ? `${el.styles.marginBottom}px` : '20px',
            }}
          />
        );
      case 'spacer':
        return (
          <div
            style={{
              height: `${el.styles.height || 24}px`,
            }}
          />
        );
      case 'container': {
        const childrenList = el.children || [];
        return (
          <div style={elStyle} className="w-full">
            <div className="space-y-2">
              {childrenList.map((child) => (
                <div key={child.id}>{renderCleanElement(child)}</div>
              ))}
            </div>
          </div>
        );
      }
      case 'grid': {
        const rows = el.rowsCount || 1;
        const cols = el.colsCount || 2;
        const gridCells = el.gridCells || {};
        
        return (
          <div style={elStyle} className="w-full">
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
              {Array.from({ length: rows }).map((_, r) => (
                <React.Fragment key={r}>
                  {Array.from({ length: cols }).map((_, c) => {
                    const cellKey = `${r}-${c}`;
                    const cellElements = gridCells[cellKey] || [];
                    return (
                      <div key={cellKey} className="space-y-1.5 flex flex-col justify-start">
                        {cellElements.map((child) => (
                          <div key={child.id}>{renderCleanElement(child)}</div>
                        ))}
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

  const cleanEmailPreview = (
    <div
      style={{
        backgroundColor: globalStyles.backgroundColor,
        fontFamily: globalStyles.fontFamily,
        minHeight: '340px',
      }}
      className={`p-6 flex flex-col justify-start ${
        globalStyles.bodyAlignment === 'left' ? 'items-start' : globalStyles.bodyAlignment === 'right' ? 'items-end' : 'items-center'
      }`}
    >
      {/* Core Card Container */}
      <div
        style={{
          backgroundColor: globalStyles.containerColor,
          borderRadius: `${globalStyles.borderRadius}px`,
          padding: `${globalStyles.padding}px`,
          color: globalStyles.textColor,
          width: '100%',
          maxWidth: globalStyles.hasWidthLimit !== false ? `${globalStyles.bodyWidth || 600}px` : '100%',
          marginTop: `${globalStyles.bodyMarginTop ?? 40}px`,
          marginBottom: `${globalStyles.bodyMarginBottom ?? 40}px`,
          border: '1px solid rgba(255,255,255,0.06)',
        }}
        className="shadow-2xl flex flex-col"
      >
        {elements.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 flex flex-col items-center justify-center gap-2">
            <Mail className="h-10 w-10 text-zinc-600 animate-pulse" />
            <p className="text-sm font-semibold text-zinc-400">Nenhum conteúdo no template</p>
          </div>
        ) : (
          <div className="space-y-4">
            {elements.map((el) => (
              <div key={el.id} className="relative">
                {renderCleanElement(el)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const coreEmailDropArea = (
    <div
      onDragOver={(e) => handleDragOver(e)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e)}
      style={{
        backgroundColor: globalStyles.backgroundColor,
        fontFamily: globalStyles.fontFamily,
        minHeight: '340px',
      }}
      className={`p-6 transition-all relative flex flex-col justify-start ${
        globalStyles.bodyAlignment === 'left' ? 'items-start' : globalStyles.bodyAlignment === 'right' ? 'items-end' : 'items-center'
      } ${
        isDragOverCanvas && activeDropIndex === null ? 'ring-4 ring-blue-500 ring-dashed' : ''
      }`}
    >
      {/* Visual drag overlay alert */}
      {isDragOverCanvas && activeDropIndex === null && (
        <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center pointer-events-none z-10">
          <span className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 animate-bounce">
            <Plus className="h-4 w-4" /> Solte para adicionar ao final
          </span>
        </div>
      )}

      {/* Core Card Container */}
      <div
        style={{
          backgroundColor: globalStyles.containerColor,
          borderRadius: `${globalStyles.borderRadius}px`,
          padding: `${globalStyles.padding}px`,
          color: globalStyles.textColor,
          width: '100%',
          maxWidth: globalStyles.hasWidthLimit !== false ? `${globalStyles.bodyWidth || 600}px` : '100%',
          marginTop: `${globalStyles.bodyMarginTop ?? 40}px`,
          marginBottom: `${globalStyles.bodyMarginBottom ?? 40}px`,
          border: '1px solid rgba(255,255,255,0.06)',
        }}
        className="shadow-2xl transition-all relative flex flex-col"
      >
        {elements.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 flex flex-col items-center justify-center gap-2">
            <Inbox className="h-10 w-10 text-zinc-600 animate-pulse" />
            <p className="text-sm font-semibold text-zinc-400">Seu template de email está vazio</p>
            <p className="text-xs text-zinc-500 max-w-[280px]">
              Arraste blocos da barra lateral esquerda e solte-os aqui para começar a criar seu design incrível!
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {elements.map((el, index) => {
              const isSelected = selectedElementId === el.id;
              const elStyle = getElementStyles(el);

              // Render separate views
              const renderElementBody = () => {
                switch (el.type) {
                  case 'heading':
                    return (
                      <h2 style={elStyle} className="font-bold leading-tight m-0">
                        {renderContent(el.content) || 'Título Vazio'}
                      </h2>
                    );
                  case 'text':
                    return (
                      <div style={elStyle} className="space-y-2 leading-relaxed">
                        {el.content.split('\n\n').map((para, i) => (
                          <p key={i} className="m-0">
                            {renderContent(para) || 'Parágrafo Vazio'}
                          </p>
                        ))}
                      </div>
                    );
                  case 'button': {
                    const alignment = el.styles.align || 'center';
                    let alignClass = 'text-center';
                    if (alignment === 'left') alignClass = 'text-left';
                    if (alignment === 'right') alignClass = 'text-right';

                    return (
                      <div className={alignClass}>
                        <a
                          href={replaceVariables(el.href || '#', variables)}
                          style={elStyle}
                          className="hover:opacity-90 inline-block font-semibold shadow-xs"
                          onClick={(e) => e.preventDefault()}
                        >
                          {renderContent(el.content) || 'Clique Aqui'}
                        </a>
                      </div>
                    );
                  }
                  case 'image': {
                    const imgSrc = replaceVariables(el.src || '', variables) || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop';
                    const alignment = el.styles.align || 'center';
                    let alignClass = 'flex justify-center';
                    if (alignment === 'left') alignClass = 'flex justify-start';
                    if (alignment === 'right') alignClass = 'flex justify-end';

                    const imageTag = (
                      <img
                        src={imgSrc}
                        alt={el.alt || 'Template Image'}
                        style={{
                          width: el.styles.width ? `${el.styles.width}px` : '100%',
                          height: el.styles.height ? `${el.styles.height}px` : 'auto',
                          borderRadius: el.styles.borderRadius ? `${el.styles.borderRadius}px` : '0px',
                          objectFit: 'cover',
                        }}
                        className="max-w-full"
                      />
                    );

                    return (
                      <div className={alignClass} style={{ marginTop: el.styles.marginTop, marginBottom: el.styles.marginBottom }}>
                        {el.href ? (
                          <a
                            href={replaceVariables(el.href, variables)}
                            onClick={(e) => e.preventDefault()}
                            className="block"
                          >
                            {imageTag}
                          </a>
                        ) : (
                          imageTag
                        )}
                      </div>
                    );
                  }
                  case 'link':
                    return (
                      <div style={{ textAlign: el.styles.align || 'left', marginTop: el.styles.marginTop, marginBottom: el.styles.marginBottom }}>
                        <a
                          href={replaceVariables(el.href || '#', variables)}
                          style={elStyle}
                          className="underline hover:opacity-85 font-medium"
                          onClick={(e) => e.preventDefault()}
                        >
                          {renderContent(el.content) || 'Link Clicável'}
                        </a>
                      </div>
                    );
                  case 'divider':
                    return (
                      <hr
                        style={{
                          borderColor: el.styles.borderColor || '#e2e8f0',
                          borderWidth: el.styles.borderWidth || 1,
                          borderStyle: 'solid',
                          marginTop: el.styles.marginTop !== undefined ? `${el.styles.marginTop}px` : '12px',
                          marginBottom: el.styles.marginBottom !== undefined ? `${el.styles.marginBottom}px` : '20px',
                        }}
                      />
                    );
                  case 'spacer':
                    return (
                      <div
                        style={{
                          height: `${el.styles.height || 24}px`,
                        }}
                      />
                    );
                  case 'container': {
                    const childrenList = el.children || [];
                    return (
                      <div
                        style={elStyle}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOverContainerId(el.id);
                        }}
                        onDragLeave={() => {
                          setDragOverContainerId(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOverContainerId(null);
                          handleDropUnified(e, { type: 'container', containerId: el.id });
                        }}
                        className={`border border-dashed rounded-xl relative group/container transition-colors ${
                          dragOverContainerId === el.id && !dragOverChildId
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-zinc-700/50 bg-zinc-900/10'
                        }`}
                      >
                        {/* Container Label */}
                        <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex justify-between items-center">
                          <span>📦 Container</span>
                          <span className="text-zinc-600">{childrenList.length} elementos</span>
                        </div>
                        
                        {/* Nested elements */}
                        <div className="space-y-2 min-h-[60px] bg-zinc-950/20 p-2 rounded-lg border border-zinc-800/30">
                          {childrenList.map((child, childIdx) => {
                            const isChildSelected = selectedElementId === child.id;
                            const childStyle = getElementStyles(child);
                            const isOverThisChild = dragOverContainerId === el.id && dragOverChildId === child.id;
                            
                            return (
                              <div
                                key={child.id}
                                draggable
                                onDragStart={(e) => {
                                  e.stopPropagation();
                                  e.dataTransfer.setData('application/react-email-builder-custom-element', JSON.stringify(child));
                                  e.dataTransfer.setData('application/react-email-builder-source-id', child.id);
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setDragOverContainerId(el.id);
                                  setDragOverChildId(child.id);
                                }}
                                onDragLeave={() => {
                                  setDragOverChildId(null);
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setDragOverContainerId(null);
                                  setDragOverChildId(null);
                                  handleDropUnified(e, { type: 'container', containerId: el.id, childIndex: childIdx });
                                }}
                                className={`relative p-2.5 rounded-lg group/child cursor-pointer border transition-all ${
                                  isChildSelected 
                                    ? 'ring-2 ring-blue-500 bg-blue-500/5 border-blue-500/30' 
                                    : 'hover:bg-zinc-800/20 border-zinc-800/20'
                                } ${isOverThisChild ? 'border-t-2 border-t-blue-500 bg-blue-500/5' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectElement(child.id);
                                }}
                              >
                                {/* Nested child control actions */}
                                <div className="absolute top-1 right-1 bg-zinc-900/90 rounded border border-zinc-700 hidden group-hover/child:flex items-center gap-1 px-1 py-0.5 z-30 shadow-md">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Delete nested element!
                                      const updatedChildren = childrenList.filter(c => c.id !== child.id);
                                      onUpdateElement({
                                        ...el,
                                        children: updatedChildren
                                      });
                                    }}
                                    className="text-red-400 hover:text-red-300 p-0.5"
                                    title="Remover do container"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                                
                                {/* Render nested child content */}
                                <div>
                                  {child.type === 'heading' && (
                                    <h3 style={childStyle} className="font-bold m-0 leading-tight">{renderContent(child.content)}</h3>
                                  )}
                                  {child.type === 'text' && (
                                    <div style={childStyle} className="space-y-1">{renderContent(child.content)}</div>
                                  )}
                                  {child.type === 'button' && (
                                    <div className={child.styles.align === 'left' ? 'text-left' : child.styles.align === 'right' ? 'text-right' : 'text-center'}>
                                      <span style={childStyle} className="inline-block font-semibold rounded-lg px-4 py-2">{renderContent(child.content)}</span>
                                    </div>
                                  )}
                                  {child.type === 'image' && (
                                    <img src={replaceVariables(child.src || '', variables) || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop'} style={{ width: child.styles.width ? `${child.styles.width}px` : '100%', borderRadius: child.styles.borderRadius ? `${child.styles.borderRadius}px` : '0px' }} alt={child.alt} className="max-w-full" />
                                  )}
                                  {child.type === 'link' && (
                                    <span style={childStyle} className="underline">{renderContent(child.content)}</span>
                                  )}
                                  {child.type === 'divider' && (
                                    <hr style={{ borderColor: child.styles.borderColor || '#e2e8f0', borderWidth: child.styles.borderWidth || 1 }} />
                                  )}
                                  {child.type === 'spacer' && (
                                    <div style={{ height: `${child.styles.height || 24}px` }} />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Quick Insert Toolbar inside Container */}
                        <div className="mt-3 pt-2 border-t border-zinc-800/40 flex items-center justify-between gap-1.5 flex-wrap">
                          <span className="text-[10px] text-zinc-500 font-medium">Inserir no Container:</span>
                          <div className="flex items-center gap-1.5">
                            {(['heading', 'text', 'button', 'image', 'link', 'divider'] as ElementType[]).map((typeToInsert) => (
                              <button
                                key={typeToInsert}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  let defaultContent = 'Novo Bloco';
                                  let defaultStyles: any = {};
                                  if (typeToInsert === 'heading') {
                                    defaultContent = 'Título Interno';
                                    defaultStyles = { fontSize: 18, fontWeight: 'bold' };
                                  } else if (typeToInsert === 'text') {
                                    defaultContent = 'Texto interno editável.';
                                    defaultStyles = { fontSize: 13 };
                                  } else if (typeToInsert === 'button') {
                                    defaultContent = 'Clique Aqui';
                                    defaultStyles = { backgroundColor: '#2563eb', textColor: '#ffffff', borderRadius: 6, fontSize: 12, paddingTop: 6, paddingBottom: 6, paddingLeft: 12, paddingRight: 12 };
                                  } else if (typeToInsert === 'image') {
                                    defaultStyles = { width: 150, align: 'center' };
                                  }
                                  
                                  const newNested: EmailElement = {
                                    id: `${typeToInsert}_nested_${Date.now()}`,
                                    type: typeToInsert,
                                    content: defaultContent,
                                    styles: defaultStyles
                                  };
                                  
                                  onUpdateElement({
                                    ...el,
                                    children: [...childrenList, newNested]
                                  });
                                  onSelectElement(newNested.id);
                                }}
                                className="text-[10px] bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white px-2 py-1 rounded-lg cursor-pointer capitalize transition-all"
                              >
                                {typeToInsert}
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
                      <div style={elStyle} className="border border-dashed border-zinc-700/50 rounded-xl relative group/grid bg-zinc-900/10">
                        {/* Grid Label */}
                        <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                          🎛️ Grid de Layout ({rows}x{cols})
                        </div>
                        
                        {/* Real Table/Flex Columns Simulation */}
                        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                          {Array.from({ length: rows }).map((_, r) => (
                            <React.Fragment key={r}>
                              {Array.from({ length: cols }).map((_, c) => {
                                const cellKey = `${r}-${c}`;
                                const cellElements = gridCells[cellKey] || [];
                                const isOverThisCell = dragOverContainerId === el.id && dragOverGridCellKey === cellKey;
                                
                                return (
                                  <div
                                    key={cellKey}
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setDragOverContainerId(el.id);
                                      setDragOverGridCellKey(cellKey);
                                    }}
                                    onDragLeave={() => {
                                      setDragOverContainerId(null);
                                      setDragOverGridCellKey(null);
                                    }}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setDragOverContainerId(null);
                                      setDragOverGridCellKey(null);
                                      handleDropUnified(e, { type: 'grid', gridId: el.id, cellKey });
                                    }}
                                    className={`border p-2 rounded-lg space-y-2 min-h-[100px] flex flex-col justify-between transition-all ${
                                      isOverThisCell && !dragOverChildId
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-zinc-800/40 bg-zinc-950/40'
                                    }`}
                                  >
                                    <div>
                                      <div className="text-[8px] text-zinc-600 font-mono font-bold uppercase tracking-wider mb-1.5">Célula {r+1},{c+1}</div>
                                      
                                      {/* Cell Nested Items */}
                                      <div className="space-y-1.5">
                                        {cellElements.map((child, childIdx) => {
                                          const isChildSelected = selectedElementId === child.id;
                                          const childStyle = getElementStyles(child);
                                          const isOverThisGridChild = dragOverContainerId === el.id && dragOverGridCellKey === cellKey && dragOverChildId === child.id;
                                          
                                          return (
                                            <div
                                              key={child.id}
                                              draggable
                                              onDragStart={(e) => {
                                                e.stopPropagation();
                                                e.dataTransfer.setData('application/react-email-builder-custom-element', JSON.stringify(child));
                                                e.dataTransfer.setData('application/react-email-builder-source-id', child.id);
                                              }}
                                              onDragOver={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setDragOverContainerId(el.id);
                                                setDragOverGridCellKey(cellKey);
                                                setDragOverChildId(child.id);
                                              }}
                                              onDragLeave={() => {
                                                setDragOverChildId(null);
                                              }}
                                              onDrop={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setDragOverContainerId(null);
                                                setDragOverGridCellKey(null);
                                                setDragOverChildId(null);
                                                handleDropUnified(e, { type: 'grid', gridId: el.id, cellKey, childIndex: childIdx });
                                              }}
                                              className={`relative p-2 rounded group/gridchild cursor-pointer border transition-all ${
                                                isChildSelected 
                                                  ? 'ring-2 ring-blue-500 bg-blue-500/5 border-blue-500/30' 
                                                  : 'hover:bg-zinc-800/20 border-zinc-800/10'
                                              } ${isOverThisGridChild ? 'border-t-2 border-t-blue-500 bg-blue-500/5' : ''}`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectElement(child.id);
                                              }}
                                            >
                                              {/* Cell Nested child control actions */}
                                              <div className="absolute top-0.5 right-0.5 bg-zinc-900/90 rounded border border-zinc-700 hidden group-hover/gridchild:flex items-center gap-1 px-1 py-0.5 z-30 shadow-md">
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Delete nested element from cell
                                                    const updatedCellElements = cellElements.filter(c => c.id !== child.id);
                                                    onUpdateElement({
                                                      ...el,
                                                      gridCells: {
                                                        ...gridCells,
                                                        [cellKey]: updatedCellElements
                                                      }
                                                    });
                                                  }}
                                                  className="text-red-400 hover:text-red-300 p-0.5"
                                                  title="Remover da célula"
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </button>
                                              </div>
                                              
                                              <div>
                                                {child.type === 'heading' && (
                                                  <h4 style={childStyle} className="font-bold m-0 leading-tight">{renderContent(child.content)}</h4>
                                                )}
                                                {child.type === 'text' && (
                                                  <div style={childStyle} className="space-y-0.5 leading-snug">{renderContent(child.content)}</div>
                                                )}
                                                {child.type === 'button' && (
                                                  <div className={child.styles.align === 'left' ? 'text-left' : child.styles.align === 'right' ? 'text-right' : 'text-center'}>
                                                    <span style={childStyle} className="inline-block font-semibold rounded px-2.5 py-1 text-xs">{renderContent(child.content)}</span>
                                                  </div>
                                                )}
                                                {child.type === 'image' && (
                                                  <img src={replaceVariables(child.src || '', variables) || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop'} style={{ width: child.styles.width ? `${child.styles.width}px` : '100%', borderRadius: child.styles.borderRadius ? `${child.styles.borderRadius}px` : '0px' }} alt={child.alt} className="max-w-full" />
                                                )}
                                                {child.type === 'link' && (
                                                  <span style={childStyle} className="underline text-xs">{renderContent(child.content)}</span>
                                                )}
                                                {child.type === 'divider' && (
                                                  <hr style={{ borderColor: child.styles.borderColor || '#e2e8f0', borderWidth: child.styles.borderWidth || 1 }} />
                                                )}
                                                {child.type === 'spacer' && (
                                                  <div style={{ height: `${child.styles.height || 24}px` }} />
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                    
                                    {/* Mini plus toolbar per cell */}
                                    <div className="pt-1.5 flex items-center justify-between border-t border-zinc-850/60 flex-wrap gap-1">
                                      <span className="text-[7px] text-zinc-500 font-bold uppercase">Inserir:</span>
                                      <div className="flex gap-0.5">
                                        {(['heading', 'text', 'button', 'image'] as ElementType[]).map((typeToInsert) => (
                                          <button
                                            key={typeToInsert}
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              let defaultContent = 'Novo Bloco';
                                              let defaultStyles: any = {};
                                              if (typeToInsert === 'heading') {
                                                defaultContent = 'Título';
                                                defaultStyles = { fontSize: 14, fontWeight: 'bold' };
                                              } else if (typeToInsert === 'text') {
                                                defaultContent = 'Texto célula.';
                                                defaultStyles = { fontSize: 11 };
                                              } else if (typeToInsert === 'button') {
                                                defaultContent = 'CTA';
                                                defaultStyles = { backgroundColor: '#2563eb', textColor: '#ffffff', borderRadius: 4, fontSize: 10, paddingTop: 4, paddingBottom: 4, paddingLeft: 8, paddingRight: 8 };
                                              } else if (typeToInsert === 'image') {
                                                defaultStyles = { width: 100, align: 'center' };
                                              }
                                              
                                              const newNested: EmailElement = {
                                                id: `${typeToInsert}_gridnested_${Date.now()}`,
                                                type: typeToInsert,
                                                content: defaultContent,
                                                styles: defaultStyles
                                              };
                                              
                                              onUpdateElement({
                                                ...el,
                                                gridCells: {
                                                  ...gridCells,
                                                  [cellKey]: [...cellElements, newNested]
                                                }
                                              });
                                              onSelectElement(newNested.id);
                                            }}
                                            className="text-[7px] bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white px-1 py-0.5 rounded cursor-pointer font-bold uppercase transition-all"
                                          >
                                            {typeToInsert}
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
                  key={el.id}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`relative group rounded-lg p-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-blue-500 bg-blue-500/5'
                      : 'hover:bg-zinc-800/15 border border-transparent'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectElement(el.id);
                  }}
                >
                  {/* Drag and Drop middle inserting visual guide */}
                  {isDragOverCanvas && activeDropIndex === index && (
                    <div className="absolute -top-1.5 left-0 right-0 h-1 bg-blue-500 rounded-full animate-pulse z-10" />
                  )}

                  {/* Block visual wrapper handle */}
                  <div className="absolute -top-3.5 right-2 bg-zinc-900 text-[10px] text-zinc-100 px-2 py-0.5 rounded font-mono border border-zinc-700 hidden group-hover:flex items-center gap-1 shadow-lg z-20 transition-all opacity-0 group-hover:opacity-100">
                    <span className="capitalize">{el.type}</span>
                    <button
                      disabled={index === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveElement(index, 'up');
                      }}
                      className="hover:text-blue-400 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      disabled={index === elements.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveElement(index, 'down');
                      }}
                      className="hover:text-blue-400 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteElement(el.id);
                      }}
                      className="hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Real rendered body */}
                  <div className="relative">{renderElementBody()}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] flex-1">
      
      {/* 1. Primary Device Toolbar Controls */}
      <div className="bg-[#0f0f0f] border-b border-zinc-800 px-6 py-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-xs shrink-0">
        <div className="flex items-center gap-2.5">
          {!isSidebarOpen && onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer text-xs font-bold shrink-0 shadow-xs mr-2 hover:border-zinc-700 animate-fade-in"
              title="Expandir Painel Lateral"
            >
              <ChevronRight className="h-4 w-4 text-blue-400" />
              <span>Painel</span>
            </button>
          )}
          <Mail className="h-4.5 w-4.5 text-zinc-400" />
          <span className="text-xs font-bold text-zinc-350 uppercase tracking-wider">
            Simulador de Inbox & Visualização
          </span>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-center">
          <div className="flex items-center bg-zinc-900 p-1 rounded-xl gap-1 border border-zinc-800">
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                previewDevice === 'desktop'
                  ? 'bg-zinc-800 text-blue-400 shadow-sm border border-zinc-700/50'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Laptop className="h-4 w-4" /> Desktop
            </button>
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                previewDevice === 'mobile'
                  ? 'bg-zinc-800 text-blue-400 shadow-sm border border-zinc-700/50'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Smartphone className="h-4 w-4" /> Mobile
            </button>
          </div>

          <button
            type="button"
            onClick={handleReloadSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 h-[34px] rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all cursor-pointer active:scale-95 shadow-sm"
            title="Recarregar renderização da simulação"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isReloading ? 'animate-spin text-blue-400' : 'text-zinc-400'}`} />
            <span>Recarregar</span>
          </button>
        </div>
      </div>

      {/* 2. Secondary Email Client Simulator Views Selector */}
      <div className="bg-[#121212] border-b border-zinc-800/50 px-6 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-bold uppercase tracking-wider">
          <Sliders className="h-3.5 w-3.5 text-zinc-500" />
          <span>Cliente de E-mail (Simulador):</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setEmailClient('default')}
            className={`flex-1 sm:flex-initial text-center px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
              emailClient === 'default'
                ? 'bg-blue-600/15 border-blue-500/30 text-blue-400 font-bold'
                : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-850 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Padrão (Limpo)
          </button>
          <button
            onClick={() => setEmailClient('gmail')}
            className={`flex-1 sm:flex-initial text-center px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
              emailClient === 'gmail'
                ? 'bg-red-500/15 border-red-500/30 text-red-400 font-bold'
                : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-850 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Gmail
          </button>
          <button
            onClick={() => setEmailClient('outlook')}
            className={`flex-1 sm:flex-initial text-center px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
              emailClient === 'outlook'
                ? 'bg-blue-500/15 border-blue-500/30 text-blue-400 font-bold'
                : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-850 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Outlook
          </button>
          <button
            onClick={() => setEmailClient('hotmail')}
            className={`flex-1 sm:flex-initial text-center px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
              emailClient === 'hotmail'
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 font-bold'
                : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-850 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Hotmail
          </button>
        </div>
      </div>

      {/* 3. Simulator Frame Body */}
      <div key={renderKey} className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center items-start bg-[#0a0a0a]">
        
        {/* Dynamic envelope depending on selection and device */}
        {emailClient === 'default' ? (
          /* DEFAULT CLEAN DESIGN */
          <div
            className={`bg-[#0f0f0f] rounded-2xl border border-zinc-800 shadow-xl transition-all duration-300 ${
              previewDevice === 'mobile' ? 'max-w-[380px] w-full' : 'max-w-[680px] w-full'
            }`}
          >
            {/* Email headers placeholder */}
            <div className="px-5 py-4 border-b border-zinc-800 bg-[#0f0f0f] rounded-t-2xl space-y-1.5 text-xs text-zinc-400">
              <div className="flex items-center gap-1">
                <span className="font-bold text-zinc-500 min-w-[50px]">Para:</span>
                <span className="bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded-md font-mono border border-zinc-800">
                  {activeDestinatary}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-zinc-500 min-w-[50px]">Assunto:</span>
                <span className="text-zinc-200 font-medium italic">
                  {activeSubject}
                </span>
              </div>
            </div>

            {/* Email canvas body */}
            <div className="rounded-b-2xl overflow-hidden bg-zinc-900">
              {coreEmailDropArea}
            </div>
          </div>

        ) : emailClient === 'gmail' ? (
          /* GMAIL EMULATOR */
          previewDevice === 'desktop' ? (
            /* Gmail Desktop */
            <div className="w-full max-w-[1050px] bg-[#f6f8fc] rounded-2xl shadow-2xl border border-zinc-300 flex flex-col overflow-hidden text-zinc-800 font-sans transition-all duration-300">
              
              {/* Top Search & Logo Bar */}
              <div className="h-14 bg-white flex items-center justify-between px-5 border-b border-[#e0e3e9]">
                <div className="flex items-center gap-4">
                  <Menu className="h-5 w-5 text-zinc-500 cursor-default" />
                  <div className="flex items-center gap-1.5 text-red-500 font-bold tracking-tight text-sm">
                    <div className="p-1 bg-red-100 rounded-lg text-red-600">
                      <Mail className="h-4 w-4" />
                    </div>
                    <span className="text-zinc-800 font-sans font-bold text-base select-none">Gmail</span>
                  </div>
                </div>

                <div className="bg-[#f1f3f4] h-10 w-96 max-w-md rounded-full flex items-center px-4 gap-3 text-xs text-zinc-500 shadow-inner">
                  <Search className="h-4 w-4 text-zinc-400" />
                  <span>Pesquisar no e-mail</span>
                </div>

                <div className="flex items-center gap-3">
                  <HelpCircle className="h-4.5 w-4.5 text-zinc-500" />
                  <Settings className="h-4.5 w-4.5 text-zinc-500" />
                  <Grid className="h-4.5 w-4.5 text-zinc-500" />
                  <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-red-500 to-amber-400 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    Z
                  </div>
                </div>
              </div>

              {/* Side drawer & Message details box */}
              <div className="flex h-[550px] overflow-hidden bg-[#f6f8fc]">
                
                {/* Left Side Drawer */}
                <div className="w-48 bg-[#f6f8fc] p-3 flex flex-col gap-1 shrink-0 border-r border-[#f1f3f4]">
                  <button className="flex items-center justify-center gap-2 bg-[#c2e7ff] text-[#001d35] font-semibold text-xs py-3.5 px-4 rounded-2xl shadow-sm cursor-default mb-3 self-start hover:shadow-md transition-shadow">
                    <Plus className="h-4.5 w-4.5 text-zinc-800" />
                    <span>Escrever</span>
                  </button>

                  <div className="flex items-center justify-between bg-[#d3e3fd] text-[#041e49] font-bold text-xs px-3.5 py-2 rounded-full cursor-default">
                    <div className="flex items-center gap-2.5">
                      <Inbox className="h-4 w-4 text-[#041e49]" />
                      <span>Caixa de entrada</span>
                    </div>
                    <span className="text-[10px]">12</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-[#444746] text-xs px-3.5 py-2 hover:bg-zinc-200/50 rounded-full cursor-default">
                    <Star className="h-4 w-4" />
                    <span>Com estrela</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-[#444746] text-xs px-3.5 py-2 hover:bg-zinc-200/50 rounded-full cursor-default">
                    <Clock className="h-4 w-4" />
                    <span>Adiados</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-[#444746] text-xs px-3.5 py-2 hover:bg-zinc-200/50 rounded-full cursor-default">
                    <Send className="h-4 w-4" />
                    <span>Enviados</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-[#444746] text-xs px-3.5 py-2 hover:bg-zinc-200/50 rounded-full cursor-default">
                    <File className="h-4 w-4" />
                    <span>Rascunhos</span>
                  </div>
                </div>

                {/* Right Side Reading Area */}
                <div className="flex-1 bg-white flex flex-col overflow-y-auto">
                  
                  {/* Message Action Strip */}
                  <div className="h-10 border-b border-[#f1f3f4] flex items-center justify-between px-5 text-[#444746] text-xs bg-white shrink-0">
                    <div className="flex items-center gap-4">
                      <ArrowLeft className="h-4.5 w-4.5 hover:text-zinc-800 cursor-default" />
                      <Archive className="h-4.5 w-4.5 hover:text-zinc-800 cursor-default" />
                      <Trash className="h-4.5 w-4.5 hover:text-zinc-800 text-red-500/80 cursor-default" />
                      <Mail className="h-4.5 w-4.5 hover:text-zinc-800 cursor-default" />
                    </div>
                    <div className="flex items-center gap-3">
                      <span>1 de 1.450</span>
                      <ChevronRight className="h-4 w-4 cursor-default" />
                    </div>
                  </div>

                  {/* Subject and sender detail */}
                  <div className="p-6 flex-1 bg-white overflow-y-auto">
                    
                    {/* Subject line */}
                    <div className="mb-4">
                      <h2 className="text-xl font-normal text-[#1f1f1f] flex items-center gap-2.5 font-sans">
                        {activeSubject}
                        <span className="text-[10px] bg-[#f1f3f4] text-[#444746] px-1.5 py-0.5 rounded font-mono">Caixa de entrada</span>
                      </h2>
                    </div>

                    {/* Sender detail row */}
                    <div className="flex items-center justify-between mb-6 border-b border-zinc-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center font-bold font-sans">
                          R
                        </div>
                        <div className="text-xs text-zinc-500">
                          <span className="font-bold text-zinc-800 mr-1.5 text-sm">Remetente Oficial</span>
                          <span>&lt;envio@dominio.com&gt;</span>
                          <div className="text-zinc-500 mt-0.5">
                            <span>Para: </span>
                            <span className="text-zinc-700">{activeDestinatary}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-zinc-400">
                        <span className="text-[11px] font-sans">Hoje, 10:00 (há 2 min)</span>
                        <Reply className="h-4 w-4 cursor-default text-zinc-500" />
                        <MoreVertical className="h-4 w-4 cursor-default" />
                      </div>
                    </div>

                    {/* Inner core email builder drop area */}
                    <div className="border border-zinc-200/80 rounded-2xl overflow-hidden shadow-xs bg-zinc-50 max-w-[620px] mx-auto">
                      {coreEmailDropArea}
                    </div>

                  </div>
                </div>

              </div>
            </div>
          ) : (
            /* Gmail Mobile */
            <div className="w-full max-w-[380px] bg-[#f6f8fc] rounded-2xl shadow-xl border border-zinc-300 flex flex-col overflow-hidden text-zinc-800 font-sans transition-all duration-300">
              
              {/* App Search Bar inside mobile mockup */}
              <div className="p-3 shrink-0">
                <div className="bg-white h-11 px-3 rounded-full flex items-center justify-between shadow-sm border border-zinc-200">
                  <div className="flex items-center gap-2">
                    <Menu className="h-4.5 w-4.5 text-zinc-500" />
                    <span className="text-xs text-zinc-400 font-sans">Pesquisar no e-mail</span>
                  </div>
                  <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-red-500 to-amber-400 text-white flex items-center justify-center font-bold text-[10px]">
                    Z
                  </div>
                </div>
              </div>

              {/* Mobile Message Reader View */}
              <div className="flex-1 bg-white flex flex-col h-[480px] overflow-y-auto p-4">
                
                {/* Back and top utilities */}
                <div className="flex items-center justify-between text-zinc-600 mb-4 shrink-0">
                  <ArrowLeft className="h-4.5 w-4.5" />
                  <div className="flex items-center gap-4">
                    <Archive className="h-4.5 w-4.5" />
                    <Trash className="h-4.5 w-4.5 text-red-500/80" />
                    <Mail className="h-4.5 w-4.5" />
                    <MoreVertical className="h-4.5 w-4.5" />
                  </div>
                </div>

                {/* Subject */}
                <h3 className="text-lg font-normal text-zinc-900 mb-4 font-sans leading-snug">
                  {activeSubject}
                </h3>

                {/* Sender details */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center font-bold text-xs">
                      R
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-800">Remetente Oficial</div>
                      <div className="text-[10px] text-zinc-500">para {activeDestinatary}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[10px]">
                    <span>10:00</span>
                    <Reply className="h-3.5 w-3.5 text-zinc-500" />
                  </div>
                </div>

                {/* Core Email Area */}
                <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-2xs max-w-full">
                  {coreEmailDropArea}
                </div>

              </div>

            </div>
          )

        ) : emailClient === 'outlook' ? (
          /* OUTLOOK EMULATOR */
          previewDevice === 'desktop' ? (
            /* Outlook Desktop */
            <div className="w-full max-w-[1050px] bg-[#f3f2f1] rounded-2xl shadow-2xl border border-zinc-300 flex flex-col overflow-hidden text-[#323130] font-sans transition-all duration-300">
              
              {/* Blue Header Bar */}
              <div className="h-12 bg-[#0078d4] text-white flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-3">
                  <Grid className="h-4.5 w-4.5 hover:bg-white/10 p-0.5 rounded cursor-default" />
                  <span className="font-sans font-bold text-sm tracking-wide select-none">Outlook</span>
                </div>

                <div className="bg-white/15 hover:bg-white/20 h-8 w-96 rounded-md flex items-center px-3 gap-2.5 text-xs text-white placeholder-white/80 transition-colors">
                  <Search className="h-4 w-4 text-white/80" />
                  <span className="text-white/85">Pesquisar</span>
                </div>

                <div className="flex items-center gap-3">
                  <HelpCircle className="h-4.5 w-4.5 text-white/90" />
                  <Settings className="h-4.5 w-4.5 text-white/90" />
                  <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                    O
                  </div>
                </div>
              </div>

              {/* Main inner workspace */}
              <div className="flex h-[550px] overflow-hidden bg-white">
                
                {/* Extreme Left Slim App Rail */}
                <div className="w-11 bg-[#201f1e] text-zinc-400 flex flex-col items-center py-4 gap-5 shrink-0">
                  <Mail className="h-4.5 w-4.5 text-white bg-[#323130] p-1.5 box-content rounded-lg" />
                  <Smartphone className="h-4.5 w-4.5 text-zinc-400 hover:text-white" />
                  <Sliders className="h-4.5 w-4.5 text-zinc-400 hover:text-white" />
                </div>

                {/* Folders drawer */}
                <div className="w-40 bg-[#f3f2f1] p-3 border-r border-[#e1dfdd] flex flex-col gap-3 shrink-0 text-[#323130] text-xs">
                  <div className="font-bold text-[#0078d4] uppercase text-[9px] tracking-wider">Favoritos</div>
                  
                  <div className="flex items-center justify-between bg-[#edebe9] text-[#323130] font-bold px-2 py-1.5 rounded-md cursor-default">
                    <div className="flex items-center gap-2">
                      <Inbox className="h-3.5 w-3.5 text-[#0078d4]" />
                      <span>Caixa de Entrada</span>
                    </div>
                    <span className="text-[10px] text-zinc-500">12</span>
                  </div>

                  <div className="flex items-center gap-2 px-2 py-1 hover:bg-[#edebe9] rounded-md text-zinc-600 cursor-default">
                    <Send className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Itens Enviados</span>
                  </div>

                  <div className="flex items-center gap-2 px-2 py-1 hover:bg-[#edebe9] rounded-md text-zinc-600 cursor-default">
                    <File className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Rascunhos</span>
                  </div>

                  <div className="flex items-center gap-2 px-2 py-1 hover:bg-[#edebe9] rounded-md text-zinc-600 cursor-default">
                    <Trash className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Lixo Eletrônico</span>
                  </div>
                </div>

                {/* Outlook reading panel */}
                <div className="flex-1 bg-white flex flex-col overflow-y-auto">
                  
                  {/* Subject Title Top */}
                  <div className="px-8 pt-6 pb-2 shrink-0">
                    <h2 className="text-xl font-bold text-[#323130] font-sans">
                      {activeSubject}
                    </h2>
                  </div>

                  {/* Sender details and responsive layout */}
                  <div className="px-8 py-3 flex items-center justify-between border-b border-[#f3f2f1] shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-[#0078d4] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        RM
                      </div>
                      <div className="text-xs text-zinc-500">
                        <span className="font-bold text-[#323130] mr-1 text-sm">Remetente Outlook</span>
                        <span>&lt;outlook-sender@empresa.com&gt;</span>
                        <div className="text-zinc-500 mt-0.5">
                          Para: <span className="text-[#323130] font-medium">{activeDestinatary}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-zinc-400">
                      <span className="text-[11px]">Hoje, 10:00</span>
                      <button className="text-zinc-600 hover:text-blue-600 text-xs flex items-center gap-1 border border-zinc-200 px-2 py-1 rounded cursor-default">
                        <Reply className="h-3.5 w-3.5" /> Responder
                      </button>
                    </div>
                  </div>

                  {/* Core Email Area */}
                  <div className="p-6 bg-[#faf9f8] flex-1 overflow-y-auto flex justify-center">
                    <div className="border border-[#e1dfdd] rounded-xl overflow-hidden bg-white shadow-xs max-w-[620px] w-full">
                      {coreEmailDropArea}
                    </div>
                  </div>

                </div>

              </div>
            </div>
          ) : (
            /* Outlook Mobile */
            <div className="w-full max-w-[380px] bg-[#0078d4] rounded-2xl shadow-xl border border-zinc-300 flex flex-col overflow-hidden text-zinc-800 font-sans transition-all duration-300">
              
              {/* App Blue Header */}
              <div className="h-12 bg-[#0078d4] px-4 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-3">
                  <Menu className="h-4.5 w-4.5" />
                  <span className="text-xs font-bold tracking-wide">Outlook</span>
                </div>
                <Search className="h-4.5 w-4.5" />
              </div>

              {/* Mobile Message Reader View */}
              <div className="flex-1 bg-white flex flex-col h-[480px] overflow-y-auto p-4">
                
                {/* Outlook subject */}
                <h3 className="text-lg font-bold text-[#323130] mb-3 font-sans">
                  {activeSubject}
                </h3>

                {/* Sender card */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-[#0078d4] text-white flex items-center justify-center font-bold text-xs">
                      RM
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#323130]">Remetente Outlook</div>
                      <div className="text-[10px] text-zinc-400">para {activeDestinatary}</div>
                    </div>
                  </div>
                  <span className="text-zinc-400 text-[10px]">10:00</span>
                </div>

                {/* Email Canvas container */}
                <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-2xs max-w-full">
                  {coreEmailDropArea}
                </div>

              </div>

            </div>
          )

        ) : (
          /* HOTMAIL EMULATOR */
          previewDevice === 'desktop' ? (
            /* Hotmail Desktop */
            <div className="w-full max-w-[1050px] bg-[#e2ecf5] rounded-2xl shadow-2xl border border-[#b2c8dc] flex flex-col overflow-hidden text-[#1e395b] font-sans transition-all duration-300">
              
              {/* Classic MSN Hotmail Turquoise Header */}
              <div className="h-12 bg-[#005da6] text-white flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-2">
                  {/* Simulated colorful MSN butterfly butterfly logo */}
                  <div className="flex items-center relative gap-0.5 h-6 w-6">
                    <div className="absolute top-0.5 left-0.5 w-2 h-2 rounded-full bg-red-400" />
                    <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-green-400" />
                    <div className="absolute bottom-0.5 left-0.5 w-2 h-2 rounded-full bg-blue-400" />
                    <div className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-amber-400" />
                  </div>
                  <span className="font-serif italic font-bold text-base tracking-wide select-none bg-gradient-to-r from-zinc-100 to-amber-200 bg-clip-text text-transparent">hotmail</span>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold text-zinc-100">
                  <span>Windows Live</span>
                  <span>MSN</span>
                  <span>|</span>
                  <span>workzeca@hotmail.com</span>
                </div>
              </div>

              {/* Main Live content split */}
              <div className="flex h-[550px] overflow-hidden bg-[#e2ecf5] p-2 gap-2">
                
                {/* Left Side Classic Box */}
                <div className="w-44 bg-white/80 border border-[#b2c8dc] rounded-lg p-3 shrink-0 flex flex-col gap-2.5 text-xs text-[#005da6]">
                  <div className="font-bold border-b border-[#b2c8dc] pb-1.5 flex items-center gap-1.5 text-zinc-700">
                    <Inbox className="h-3.5 w-3.5 text-[#005da6]" />
                    <span>Pastas</span>
                  </div>

                  <div className="flex items-center justify-between font-bold text-zinc-800 bg-white/90 border border-[#b2c8dc] px-2 py-1 rounded">
                    <span>Caixa de Entrada</span>
                    <span>(12)</span>
                  </div>

                  <div className="px-2 hover:underline cursor-default">Lixo Eletrônico</div>
                  <div className="px-2 hover:underline cursor-default">Rascunhos (2)</div>
                  <div className="px-2 hover:underline cursor-default">Itens Enviados</div>
                  <div className="px-2 hover:underline cursor-default">Itens Excluídos</div>
                </div>

                {/* Right Side Reading Area */}
                <div className="flex-1 bg-white rounded-lg border border-[#b2c8dc] flex flex-col overflow-y-auto">
                  
                  {/* Subject Header classic banner */}
                  <div className="bg-gradient-to-b from-[#f2f7fc] to-[#e2ecf5] p-5 border-b border-[#b2c8dc] shrink-0">
                    <h2 className="text-lg font-bold text-[#1e395b] font-sans">
                      {activeSubject}
                    </h2>
                    
                    <div className="flex justify-between items-center mt-3 text-xs text-zinc-500">
                      <div>
                        <span className="font-bold text-zinc-700 mr-1">De:</span>
                        <span>Equipe MSN Hotmail &lt;equipe@hotmail.com&gt;</span>
                      </div>
                      <span>Hoje, 10:00 AM</span>
                    </div>
                  </div>

                  {/* Core Email Area */}
                  <div className="p-6 flex-1 overflow-y-auto bg-zinc-50/50 flex justify-center">
                    <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-md max-w-[620px] w-full">
                      {coreEmailDropArea}
                    </div>
                  </div>

                </div>

              </div>
            </div>
          ) : (
            /* Hotmail Mobile */
            <div className="w-full max-w-[380px] bg-[#005da6] rounded-2xl shadow-xl border border-zinc-300 flex flex-col overflow-hidden text-zinc-800 font-sans transition-all duration-300">
              
              {/* Hotmail/MSN Mobile Header */}
              <div className="h-12 bg-[#005da6] px-4 flex items-center justify-between text-white shrink-0 border-b border-[#004e8c]">
                <div className="flex items-center gap-2">
                  <div className="relative h-4 w-4">
                    <div className="absolute top-0 left-0 w-1.5 h-1.5 rounded-full bg-red-400" />
                    <div className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-green-400" />
                    <div className="absolute bottom-0 left-0 w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <div className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-amber-400" />
                  </div>
                  <span className="font-serif italic font-bold text-xs">Hotmail Mobile</span>
                </div>
                <Menu className="h-4 w-4" />
              </div>

              {/* Mobile Message Reader View */}
              <div className="flex-1 bg-white flex flex-col h-[480px] overflow-y-auto p-4">
                
                {/* Hotmail Subject */}
                <h3 className="text-base font-bold text-[#1e395b] mb-2 font-sans border-b border-zinc-100 pb-2">
                  {activeSubject}
                </h3>

                {/* Sender row */}
                <div className="flex items-center justify-between mb-4 text-[11px] text-zinc-400 shrink-0">
                  <span>De: Equipe MSN Hotmail</span>
                  <span>10:00</span>
                </div>

                {/* Email canvas container */}
                <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-2xs max-w-full">
                  {coreEmailDropArea}
                </div>

              </div>

            </div>
          )
        )}

      </div>
    </div>
  );
}
