import React from 'react';
import { EmailElement, EmailVariable, Alignment } from '../types';
import { AlignLeft, AlignCenter, AlignRight, Type, Move, Frame, Layout, Image, Link, Sliders, Bold, Italic, Underline, Strikethrough, Lock, Unlock } from 'lucide-react';
import ColorPicker from './ColorPicker';

interface SettingsPanelProps {
  element: EmailElement;
  variables: EmailVariable[];
  onUpdateElement: (updatedElement: EmailElement) => void;
  onDeleteElement: (id: string) => void;
  onConvertToComponent?: (element: EmailElement) => void;
}

export default function SettingsPanel({
  element,
  variables,
  onUpdateElement,
  onDeleteElement,
  onConvertToComponent,
}: SettingsPanelProps) {
  const { type, content, styles, href, src, alt } = element;

  const [keepProportion, setKeepProportion] = React.useState(true);
  const [linkMargins, setLinkMargins] = React.useState(true);
  const [linkPaddings, setLinkPaddings] = React.useState(true);
  const [radiusMode, setRadiusMode] = React.useState<'linked' | 'axes' | 'separated'>('linked');

  const updateStyle = (key: keyof typeof styles, value: any) => {
    onUpdateElement({
      ...element,
      styles: {
        ...styles,
        [key]: value,
      },
    });
  };

  const updateStyles = (updates: Partial<typeof styles>) => {
    onUpdateElement({
      ...element,
      styles: {
        ...styles,
        ...updates,
      },
    });
  };

  const updateAttr = (key: 'content' | 'href' | 'src' | 'alt', value: string) => {
    onUpdateElement({
      ...element,
      [key]: value,
    });
  };

  const applyFormatting = (prefix: string, suffix: string) => {
    const textarea = document.getElementById(`editor-${element.id}`) as HTMLTextAreaElement | HTMLInputElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const text = content || '';

    const selectedText = text.substring(start, end);
    const formatted = prefix + selectedText + suffix;

    const newContent = text.substring(0, start) + formatted + text.substring(end);
    updateAttr('content', newContent);

    // Refocus and reselect
    setTimeout(() => {
      textarea.focus();
      const newStart = start + prefix.length;
      const newEnd = newStart + selectedText.length;
      textarea.setSelectionRange(newStart, newEnd);
    }, 50);
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f] text-zinc-300">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-[#0f0f0f]">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-blue-500" />
          <h3 className="font-semibold text-zinc-100 text-sm">
            Editar: <span className="capitalize text-blue-400">{type}</span>
          </h3>
        </div>
        <button
          onClick={() => onDeleteElement(element.id)}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        >
          Excluir
        </button>
      </div>

      {onConvertToComponent && (
        <div className="px-4 py-2 bg-indigo-950/20 border-b border-zinc-800 flex justify-between items-center">
          <span className="text-[11px] text-zinc-400 font-medium">Elemento Reutilizável?</span>
          <button
            type="button"
            onClick={() => onConvertToComponent(element)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg shadow transition-all cursor-pointer"
          >
            <Layout className="h-3 w-3" />
            Salvar como Componente
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Grid Dimensions Setting */}
        {type === 'grid' && (
          <div className="space-y-4 p-3 bg-zinc-900/40 rounded-xl border border-zinc-850">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800 pb-1.5">
              <Layout className="h-3.5 w-3.5 text-blue-400" />
              Definições do Grid
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-zinc-500 font-medium block mb-0.5">Colunas (Cols)</label>
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={element.colsCount || 2}
                  onChange={(e) => {
                    const cols = Math.max(1, Math.min(4, parseInt(e.target.value) || 1));
                    const rows = element.rowsCount || 1;
                    
                    // Update gridCells helper
                    const currentCells = element.gridCells || {};
                    const newCells: Record<string, EmailElement[]> = {};
                    for (let r = 0; r < rows; r++) {
                      for (let c = 0; c < cols; c++) {
                        const key = `${r}-${c}`;
                        newCells[key] = currentCells[key] || [];
                      }
                    }
                    onUpdateElement({
                      ...element,
                      colsCount: cols,
                      gridCells: newCells
                    });
                  }}
                  className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 font-medium block mb-0.5">Linhas (Rows)</label>
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={element.rowsCount || 1}
                  onChange={(e) => {
                    const rows = Math.max(1, Math.min(4, parseInt(e.target.value) || 1));
                    const cols = element.colsCount || 2;
                    
                    // Update gridCells helper
                    const currentCells = element.gridCells || {};
                    const newCells: Record<string, EmailElement[]> = {};
                    for (let r = 0; r < rows; r++) {
                      for (let c = 0; c < cols; c++) {
                        const key = `${r}-${c}`;
                        newCells[key] = currentCells[key] || [];
                      }
                    }
                    onUpdateElement({
                      ...element,
                      rowsCount: rows,
                      gridCells: newCells
                    });
                  }}
                  className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Content Field (if applicable) */}
        {type !== 'divider' && type !== 'spacer' && type !== 'container' && type !== 'grid' && (
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
                <Type className="h-3.5 w-3.5 text-zinc-500" />
                Conteúdo de Texto
              </label>
              <span className="text-[10px] text-zinc-500 font-medium">Selecione texto para formatar</span>
            </div>

            {/* Rich Text Selection Formatting Toolbar */}
            <div className="flex flex-wrap items-center gap-1 bg-zinc-950 p-1.5 rounded-t-xl border border-zinc-800 border-b-0">
              <button
                type="button"
                onClick={() => applyFormatting('**', '**')}
                className="p-1.5 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="Negrito (**)"
              >
                <Bold className="h-3.5 w-3.5 font-bold" />
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('*', '*')}
                className="p-1.5 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="Itálico (*)"
              >
                <Italic className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('<u>', '</u>')}
                className="p-1.5 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="Sublinhado (<u>)"
              >
                <Underline className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('<s>', '</s>')}
                className="p-1.5 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="Tachado (<s>)"
              >
                <Strikethrough className="h-3.5 w-3.5" />
              </button>

              <div className="h-4 w-px bg-zinc-800 mx-1" />

              {/* Selection Font Size selection */}
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-zinc-500 font-medium uppercase">Tamanho Seleção:</span>
                <select
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      applyFormatting(`<span style="font-size: ${val}px">`, '</span>');
                      e.target.value = ''; // Reset select
                    }
                  }}
                  className="bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] text-zinc-300 focus:outline-none focus:border-blue-500"
                  title="Alterar tamanho da fonte do texto selecionado"
                >
                  <option value="">Aplicar...</option>
                  <option value="12">12px</option>
                  <option value="14">14px</option>
                  <option value="16">16px</option>
                  <option value="18">18px</option>
                  <option value="20">20px</option>
                  <option value="24">24px</option>
                  <option value="28">28px</option>
                  <option value="32">32px</option>
                  <option value="36">36px</option>
                  <option value="40">40px</option>
                  <option value="48">48px</option>
                </select>
              </div>
            </div>

            {type === 'text' ? (
              <textarea
                id={`editor-${element.id}`}
                value={content}
                onChange={(e) => updateAttr('content', e.target.value)}
                className="w-full text-sm bg-zinc-900 border border-zinc-800 rounded-b-xl rounded-t-none p-3 text-zinc-100 focus:outline-none focus:border-blue-500 min-h-[110px]"
                placeholder="Insira o texto aqui. Use {{variável}} para valores dinâmicos."
              />
            ) : (
              <input
                id={`editor-${element.id}`}
                type="text"
                value={content}
                onChange={(e) => updateAttr('content', e.target.value)}
                className="w-full text-sm bg-zinc-900 border border-zinc-800 rounded-b-xl rounded-t-none px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                placeholder="Insira o texto..."
              />
            )}
          </div>
        )}

        {/* Hyperlink Href settings */}
        {(type === 'button' || type === 'link' || type === 'image') && (
          <div className="space-y-1.5 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
              <Link className="h-3.5 w-3.5 text-zinc-500" />
              Destino do Link (Hyperlink)
            </label>
            <input
              type="text"
              value={href || ''}
              onChange={(e) => updateAttr('href', e.target.value)}
              className="w-full text-xs font-mono bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-blue-500"
              placeholder="https://exemplo.com ou {{appUrl}}"
            />
            <p className="text-[10px] text-zinc-500">
              Insira a URL completa do link ou utilize variáveis do projeto.
            </p>
          </div>
        )}

        {/* Image Source & Alt settings */}
        {type === 'image' && (
          <div className="space-y-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
                <Image className="h-3.5 w-3.5 text-zinc-500" />
                Endereço da Imagem (SRC)*
              </label>
              <input
                type="text"
                value={src || ''}
                onChange={(e) => updateAttr('src', e.target.value)}
                className="w-full text-xs font-mono bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-blue-500"
                placeholder="https://exemplo.com/imagem.png"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                Texto Alternativo (Alt)
              </label>
              <input
                type="text"
                value={alt || ''}
                onChange={(e) => updateAttr('alt', e.target.value)}
                className="w-full text-xs bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-blue-500"
                placeholder="Ex: Logo do Meu App"
              />
            </div>
          </div>
        )}

        {/* Alignment settings */}
        {type !== 'divider' && type !== 'spacer' && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
              Alinhamento
            </label>
            <div className="flex bg-zinc-900 p-1 rounded-xl w-fit gap-0.5 border border-zinc-800">
              {(['left', 'center', 'right'] as Alignment[]).map((align) => {
                const isSelected = styles.align === align || (!styles.align && align === 'left');
                return (
                  <button
                    key={align}
                    onClick={() => updateStyle('align', align)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-800 text-blue-400 border border-zinc-700/50 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {align === 'left' && <AlignLeft className="h-4 w-4" />}
                    {align === 'center' && <AlignCenter className="h-4 w-4" />}
                    {align === 'right' && <AlignRight className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Color Settings */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-850 pb-1.5">
            Cores
          </h4>

          {/* Text Color */}
          {type !== 'divider' && type !== 'spacer' && type !== 'image' && (
            <div className="space-y-1.5 flex justify-between items-center bg-zinc-900/40 p-3 rounded-xl border border-zinc-800">
              <span className="text-xs font-semibold text-zinc-400">Cor do Texto</span>
              <ColorPicker
                value={styles.textColor || '#000000'}
                onChange={(c) => updateStyle('textColor', c)}
              />
            </div>
          )}

          {/* Background Color */}
          {(type === 'button' || type === 'heading' || type === 'text' || type === 'container' || type === 'grid') && (
            <div className="space-y-1.5 flex justify-between items-center bg-zinc-900/40 p-3 rounded-xl border border-zinc-800">
              <span className="text-xs font-semibold text-zinc-400">
                Cor de Fundo {type === 'button' ? 'do Botão' : 'do Bloco'}
              </span>
              <ColorPicker
                value={styles.backgroundColor || 'transparent'}
                onChange={(c) => updateStyle('backgroundColor', c)}
                placeholder="Transparente"
              />
            </div>
          )}
        </div>

        {/* Spacing & Sizes settings */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-850 pb-1.5 flex items-center gap-1.5">
            <Layout className="h-3.5 w-3.5 text-zinc-400" />
            Dimensões e Espaçamentos
          </h4>

          {/* Font Size input (number input) */}
          {type !== 'divider' && type !== 'spacer' && type !== 'image' && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Tamanho da Fonte Geral</span>
                <span className="font-semibold text-blue-400 font-mono">{styles.fontSize || (type === 'heading' ? 24 : 14)}px</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const current = styles.fontSize || (type === 'heading' ? 24 : 14);
                    if (current > 10) updateStyle('fontSize', current - 1);
                  }}
                  className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  min="10"
                  max="72"
                  value={styles.fontSize || (type === 'heading' ? 24 : 14)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val >= 10 && val <= 72) {
                      updateStyle('fontSize', val);
                    } else if (isNaN(val)) {
                      // Allow clearing/typing
                      updateStyle('fontSize', undefined);
                    }
                  }}
                  onBlur={(e) => {
                    // Fallback to defaults on blur if empty
                    const val = parseInt(e.target.value);
                    if (isNaN(val) || val < 10 || val > 72) {
                      updateStyle('fontSize', type === 'heading' ? 24 : 14);
                    }
                  }}
                  className="flex-1 text-center text-sm bg-zinc-900 border border-zinc-800 rounded-lg py-1 text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    const current = styles.fontSize || (type === 'heading' ? 24 : 14);
                    if (current < 72) updateStyle('fontSize', current + 1);
                  }}
                  className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Width / Height settings for Image */}
          {type === 'image' && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-zinc-400">Dimensões da Imagem</div>
              <div className="flex items-center gap-2">
                {/* Width */}
                <div className="flex-1 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800 flex flex-col gap-1.5 relative">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-center">Largura (px)</span>
                  <input
                    type="number"
                    min="20"
                    max="1200"
                    value={styles.width || 500}
                    onChange={(e) => {
                      const newWidth = parseInt(e.target.value) || 500;
                      if (keepProportion) {
                        const currentWidth = styles.width || 500;
                        const currentHeight = styles.height || 333;
                        const ratio = currentWidth / currentHeight;
                        const newHeight = Math.round(newWidth / ratio);
                        updateStyles({
                          width: newWidth,
                          height: newHeight > 0 ? newHeight : undefined,
                        });
                      } else {
                        updateStyle('width', newWidth);
                      }
                    }}
                    className="text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500 w-full text-center"
                  />
                </div>

                {/* Aspect Ratio Lock Toggle Button */}
                <button
                  type="button"
                  onClick={() => setKeepProportion(!keepProportion)}
                  title={keepProportion ? "Manter proporções (Ativo)" : "Manter proporções (Inativo)"}
                  className={`p-2.5 rounded-xl border transition-all active:scale-95 cursor-pointer mt-5 flex items-center justify-center shrink-0 ${
                    keepProportion 
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {keepProportion ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                </button>

                {/* Height */}
                <div className="flex-1 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800 flex flex-col gap-1.5 relative">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-center">Altura (px)</span>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={styles.height || ''}
                    placeholder="Auto"
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      const newHeight = isNaN(val) || val <= 0 ? undefined : val;
                      if (keepProportion && newHeight) {
                        const currentWidth = styles.width || 500;
                        const currentHeight = styles.height || 333;
                        const ratio = currentWidth / currentHeight;
                        const newWidth = Math.round(newHeight * ratio);
                        updateStyles({
                          width: newWidth > 0 ? newWidth : styles.width,
                          height: newHeight,
                        });
                      } else {
                        updateStyle('height', newHeight);
                      }
                    }}
                    className="text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500 w-full text-center"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Height settings for Spacer */}
          {type === 'spacer' && (
            <div className="space-y-1.5 flex justify-between items-center bg-zinc-900/40 p-3 rounded-xl border border-zinc-800">
              <span className="text-xs font-semibold text-zinc-400">Altura do Espaçador (px)</span>
              <input
                type="number"
                min="1"
                max="300"
                value={styles.height || 24}
                onChange={(e) => updateStyle('height', parseInt(e.target.value) || 24)}
                className="text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500 w-24 text-center"
              />
            </div>
          )}

          {/* Margens Settings with fine-grained individual controls for all 4 sides */}
          <div className="space-y-2 p-3 bg-zinc-900/40 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Margens Externas (px)
              </span>
              <button
                type="button"
                onClick={() => setLinkMargins(!linkMargins)}
                className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-[10px] cursor-pointer ${
                  linkMargins 
                    ? 'bg-blue-600/15 border-blue-500/30 text-blue-400 hover:bg-blue-600/25' 
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
                title={linkMargins ? "Mudar cada margem separadamente" : "Mudar todas de uma vez"}
              >
                {linkMargins ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                {linkMargins ? "Vinculado" : "Separado"}
              </button>
            </div>

            {linkMargins ? (
              <div>
                <label className="text-[10px] text-zinc-500 font-medium block mb-0.5">Todas as Margens</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={styles.marginTop || 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    updateStyles({
                      marginTop: val,
                      marginBottom: val,
                      marginLeft: val,
                      marginRight: val
                    });
                  }}
                  className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 animate-fade-in">
                <div>
                  <label className="text-[10px] text-zinc-500 font-medium block mb-0.5">Superior (Top)</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={styles.marginTop || 0}
                    onChange={(e) => updateStyle('marginTop', parseInt(e.target.value) || 0)}
                    className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-medium block mb-0.5">Inferior (Bottom)</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={styles.marginBottom !== undefined ? styles.marginBottom : 16}
                    onChange={(e) => updateStyle('marginBottom', parseInt(e.target.value) || 0)}
                    className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-medium block mb-0.5">Esquerda (Left)</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={styles.marginLeft || 0}
                    onChange={(e) => updateStyle('marginLeft', parseInt(e.target.value) || 0)}
                    className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-medium block mb-0.5">Direita (Right)</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={styles.marginRight || 0}
                    onChange={(e) => updateStyle('marginRight', parseInt(e.target.value) || 0)}
                    className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Padding settings for Button, Container and Grid elements */}
          {(type === 'button' || type === 'container' || type === 'grid') && (
            <div className="space-y-2 p-3 bg-zinc-900/40 rounded-xl border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Espaçamento Interno (Padding px)
                </span>
                <button
                  type="button"
                  onClick={() => setLinkPaddings(!linkPaddings)}
                  className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-[10px] cursor-pointer ${
                    linkPaddings 
                      ? 'bg-blue-600/15 border-blue-500/30 text-blue-400 hover:bg-blue-600/25' 
                      : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }`}
                  title={linkPaddings ? "Mudar cada padding separadamente" : "Mudar todos de uma vez"}
                >
                  {linkPaddings ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                  {linkPaddings ? "Vinculado" : "Separado"}
                </button>
              </div>

              {linkPaddings ? (
                <div>
                  <label className="text-[10px] text-zinc-500 font-medium block mb-0.5">Todo o Espaçamento</label>
                  <input
                    type="number"
                    min="0"
                    max="64"
                    value={styles.paddingTop !== undefined ? styles.paddingTop : 12}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      updateStyles({
                        paddingTop: val,
                        paddingBottom: val,
                        paddingLeft: val,
                        paddingRight: val
                      });
                    }}
                    className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 animate-fade-in">
                  <div>
                    <label className="text-[10px] text-zinc-500 font-medium block mb-0.5">Superior (Top)</label>
                    <input
                      type="number"
                      min="0"
                      max="64"
                      value={styles.paddingTop !== undefined ? styles.paddingTop : 12}
                      onChange={(e) => updateStyle('paddingTop', parseInt(e.target.value) || 0)}
                      className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 font-medium block mb-0.5">Inferior (Bottom)</label>
                    <input
                      type="number"
                      min="0"
                      max="64"
                      value={styles.paddingBottom !== undefined ? styles.paddingBottom : 12}
                      onChange={(e) => updateStyle('paddingBottom', parseInt(e.target.value) || 0)}
                      className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 font-medium block mb-0.5">Esquerda (Left)</label>
                    <input
                      type="number"
                      min="0"
                      max="64"
                      value={styles.paddingLeft !== undefined ? styles.paddingLeft : 24}
                      onChange={(e) => updateStyle('paddingLeft', parseInt(e.target.value) || 0)}
                      className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 font-medium block mb-0.5">Direita (Right)</label>
                    <input
                      type="number"
                      min="0"
                      max="64"
                      value={styles.paddingRight !== undefined ? styles.paddingRight : 24}
                      onChange={(e) => updateStyle('paddingRight', parseInt(e.target.value) || 0)}
                      className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Borders and Rounding Section */}
        {(type === 'button' || type === 'image' || type === 'divider' || type === 'container' || type === 'grid') && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-850 pb-1.5 flex items-center gap-1.5">
              <Frame className="h-3.5 w-3.5 text-zinc-400" />
              Bordas e Arredondamento
            </h4>

            {type !== 'divider' && (
              <div className="space-y-4 p-3 bg-zinc-900/40 rounded-xl border border-zinc-800">
                {/* Rounding Mode Switcher */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Arredondamento</span>
                    <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-850">
                      {(['linked', 'axes', 'separated'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setRadiusMode(mode)}
                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition-all cursor-pointer ${
                            radiusMode === mode
                              ? 'bg-blue-600 text-white shadow font-extrabold'
                              : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {mode === 'linked' ? 'Vinc.' : mode === 'axes' ? 'Eixos' : 'Sep.'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rounding Inputs depending on mode */}
                  {radiusMode === 'linked' && (
                    <div className="animate-fade-in">
                      <label className="text-[10px] text-zinc-500 font-medium block mb-1">Todos os Cantos (px)</label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={styles.borderRadius !== undefined ? styles.borderRadius : (styles.borderRadiusTopLeft || 0)}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          updateStyles({
                            borderRadius: val,
                            borderRadiusTopLeft: val,
                            borderRadiusTopRight: val,
                            borderRadiusBottomLeft: val,
                            borderRadiusBottomRight: val
                          });
                        }}
                        className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  )}

                  {radiusMode === 'axes' && (
                    <div className="grid grid-cols-2 gap-2 animate-fade-in">
                      <div>
                        <label className="text-[10px] text-zinc-500 font-medium block mb-1">Cima (Topo)</label>
                        <input
                          type="number"
                          min="0"
                          max="120"
                          value={styles.borderRadiusTopLeft !== undefined ? styles.borderRadiusTopLeft : (styles.borderRadius || 0)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            updateStyles({
                              borderRadiusTopLeft: val,
                              borderRadiusTopRight: val
                            });
                          }}
                          className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 font-medium block mb-1">Baixo (Base)</label>
                        <input
                          type="number"
                          min="0"
                          max="120"
                          value={styles.borderRadiusBottomLeft !== undefined ? styles.borderRadiusBottomLeft : (styles.borderRadius || 0)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            updateStyles({
                              borderRadiusBottomLeft: val,
                              borderRadiusBottomRight: val
                            });
                          }}
                          className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 font-medium block mb-1">Esquerda (Esq)</label>
                        <input
                          type="number"
                          min="0"
                          max="120"
                          value={styles.borderRadiusTopLeft !== undefined ? styles.borderRadiusTopLeft : (styles.borderRadius || 0)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            updateStyles({
                              borderRadiusTopLeft: val,
                              borderRadiusBottomLeft: val
                            });
                          }}
                          className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 font-medium block mb-1">Direita (Dir)</label>
                        <input
                          type="number"
                          min="0"
                          max="120"
                          value={styles.borderRadiusTopRight !== undefined ? styles.borderRadiusTopRight : (styles.borderRadius || 0)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            updateStyles({
                              borderRadiusTopRight: val,
                              borderRadiusBottomRight: val
                            });
                          }}
                          className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {radiusMode === 'separated' && (
                    <div className="grid grid-cols-2 gap-2 animate-fade-in">
                      <div>
                        <label className="text-[10px] text-zinc-500 font-medium block mb-1">Sup. Esquerdo (TL)</label>
                        <input
                          type="number"
                          min="0"
                          max="120"
                          value={styles.borderRadiusTopLeft !== undefined ? styles.borderRadiusTopLeft : (styles.borderRadius || 0)}
                          onChange={(e) => updateStyle('borderRadiusTopLeft', parseInt(e.target.value) || 0)}
                          className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 font-medium block mb-1">Sup. Direito (TR)</label>
                        <input
                          type="number"
                          min="0"
                          max="120"
                          value={styles.borderRadiusTopRight !== undefined ? styles.borderRadiusTopRight : (styles.borderRadius || 0)}
                          onChange={(e) => updateStyle('borderRadiusTopRight', parseInt(e.target.value) || 0)}
                          className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 font-medium block mb-1">Inf. Esquerdo (BL)</label>
                        <input
                          type="number"
                          min="0"
                          max="120"
                          value={styles.borderRadiusBottomLeft !== undefined ? styles.borderRadiusBottomLeft : (styles.borderRadius || 0)}
                          onChange={(e) => updateStyle('borderRadiusBottomLeft', parseInt(e.target.value) || 0)}
                          className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 font-medium block mb-1">Inf. Direito (BR)</label>
                        <input
                          type="number"
                          min="0"
                          max="120"
                          value={styles.borderRadiusBottomRight !== undefined ? styles.borderRadiusBottomRight : (styles.borderRadius || 0)}
                          onChange={(e) => updateStyle('borderRadiusBottomRight', parseInt(e.target.value) || 0)}
                          className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Consolidated Border Style, Width, Color, and Sides Selector */}
            <div className="space-y-4 p-3 bg-zinc-900/40 rounded-xl border border-zinc-800">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Configurações de Linha / Borda
              </span>

              {/* Quantas bordas quer colocar (Border Sides Selector) */}
              {type !== 'divider' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide">Onde aplicar a borda?</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {([
                      { id: 'top', label: 'Topo' },
                      { id: 'bottom', label: 'Base' },
                      { id: 'left', label: 'Esq' },
                      { id: 'right', label: 'Dir' }
                    ] as const).map((side) => {
                      const isSelected = (styles.borderSides || ['top', 'bottom', 'left', 'right']).includes(side.id);
                      return (
                        <button
                          key={side.id}
                          type="button"
                          onClick={() => {
                            const current = styles.borderSides || ['top', 'bottom', 'left', 'right'];
                            let updated: ('top' | 'bottom' | 'left' | 'right')[];
                            if (current.includes(side.id)) {
                              updated = current.filter(s => s !== side.id);
                            } else {
                              updated = [...current, side.id];
                            }
                            updateStyle('borderSides', updated);
                          }}
                          className={`px-1 py-1.5 rounded-lg border text-[10px] font-bold text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600/15 border-blue-500/45 text-blue-400 font-extrabold'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {side.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Width & Style Row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 font-medium">Espessura (px)</label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={styles.borderWidth !== undefined ? styles.borderWidth : (type === 'divider' ? 1 : 0)}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      updateStyle('borderWidth', val);
                    }}
                    className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500 text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 font-medium">Estilo</label>
                  <select
                    value={styles.borderStyle || 'solid'}
                    onChange={(e) => updateStyle('borderStyle', e.target.value)}
                    className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 text-zinc-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="solid">Sólida</option>
                    <option value="dashed">Tracejada</option>
                    <option value="dotted">Pontilhada</option>
                    <option value="double">Dupla</option>
                    <option value="none">Nenhum</option>
                  </select>
                </div>
              </div>

              {/* Color Selector */}
              <div className="flex justify-between items-center bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider font-mono">Cor da Linha</span>
                <ColorPicker
                  value={styles.borderColor || '#cbd5e1'}
                  onChange={(c) => updateStyle('borderColor', c)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
