import React from 'react';
import { EmailElement, EmailVariable, Alignment } from '../types';
import { AlignLeft, AlignCenter, AlignRight, Type, Move, Frame, Layout, Image, Link, Sliders, Bold, Italic, Underline, Strikethrough } from 'lucide-react';
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

  const updateStyle = (key: keyof typeof styles, value: any) => {
    onUpdateElement({
      ...element,
      styles: {
        ...styles,
        [key]: value,
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
              <div className="space-y-1.5 flex justify-between items-center bg-zinc-900/40 p-3 rounded-xl border border-zinc-800">
                <span className="text-xs font-semibold text-zinc-400">Largura da Imagem (px)</span>
                <input
                  type="number"
                  min="20"
                  max="1200"
                  value={styles.width || 500}
                  onChange={(e) => updateStyle('width', parseInt(e.target.value) || 500)}
                  className="text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500 w-24 text-center"
                />
              </div>
              <div className="space-y-1.5 flex justify-between items-center bg-zinc-900/40 p-3 rounded-xl border border-zinc-800">
                <span className="text-xs font-semibold text-zinc-400">Altura (Opcional - px)</span>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={styles.height || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    updateStyle('height', isNaN(val) || val <= 0 ? undefined : val);
                  }}
                  placeholder="Auto"
                  className="text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500 w-24 text-center"
                />
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

          {/* Margins Settings with fine-grained individual controls for all 4 sides */}
          <div className="space-y-2 p-3 bg-zinc-900/40 rounded-xl border border-zinc-800">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Margens Externas (px)
            </span>
            <div className="grid grid-cols-2 gap-2">
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
          </div>

          {/* Padding settings for Button, Container and Grid elements */}
          {(type === 'button' || type === 'container' || type === 'grid') && (
            <div className="space-y-2 p-3 bg-zinc-900/40 rounded-xl border border-zinc-800">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Espaçamento Interno (Padding px)
              </span>
              <div className="grid grid-cols-2 gap-2">
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
            </div>
          )}
        </div>

        {/* Borders and Rounding */}
        {(type === 'button' || type === 'image' || type === 'divider' || type === 'container' || type === 'grid') && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-850 pb-1.5 flex items-center gap-1.5">
              <Frame className="h-3.5 w-3.5 text-zinc-400" />
              Bordas e Arredondamento
            </h4>

            {type !== 'divider' && (
              <div className="space-y-2 p-3 bg-zinc-900/40 rounded-xl border border-zinc-800">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Arredondamento por Canto (Radius px)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-500 font-medium block mb-0.5">Sup. Esquerdo (TL)</label>
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
                    <label className="text-[10px] text-zinc-500 font-medium block mb-0.5">Sup. Direito (TR)</label>
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
                    <label className="text-[10px] text-zinc-500 font-medium block mb-0.5">Inf. Esquerdo (BL)</label>
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
                    <label className="text-[10px] text-zinc-500 font-medium block mb-0.5">Inf. Direito (BR)</label>
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
              </div>
            )}

            {(type === 'divider' || type === 'container' || type === 'grid') && (
              <div className="space-y-3">
                <div className="space-y-1.5 flex justify-between items-center bg-zinc-900/40 p-3 rounded-xl border border-zinc-800">
                  <span className="text-xs font-semibold text-zinc-400">Espessura da Borda/Linha (px)</span>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={styles.borderWidth !== undefined ? styles.borderWidth : (type === 'divider' ? 1 : 0)}
                    onChange={(e) => updateStyle('borderWidth', parseInt(e.target.value) || 0)}
                    className="text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500 w-24 text-center"
                  />
                </div>
                <div className="space-y-1.5 flex justify-between items-center bg-zinc-900/40 p-3 rounded-xl border border-zinc-800">
                  <span className="text-xs font-semibold text-zinc-400">Cor da Borda/Linha</span>
                  <ColorPicker
                    value={styles.borderColor || '#cbd5e1'}
                    onChange={(c) => updateStyle('borderColor', c)}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
