import React from 'react';

// Common CSS Color Names
const COLOR_NAMES = [
  'black', 'white', 'gray', 'red', 'green', 'blue', 'yellow', 'purple', 'pink',
  'orange', 'teal', 'cyan', 'magenta', 'lime', 'indigo', 'violet', 'brown',
  'silver', 'gold', 'crimson', 'transparent'
];

interface MarkdownMessageProps {
  text: string;
}

export default function MarkdownMessage({ text }: MarkdownMessageProps) {
  if (!text) return null;

  // Function to split text and render styled inline text with color chips
  const parseInlineStyles = (lineText: string): React.ReactNode[] => {
    // We will build an array of tokens. Each token starts as a string.
    let parts: (string | React.ReactElement)[] = [lineText];

    // Helper to apply regex splits
    const applySplit = (
      regex: RegExp,
      renderFn: (match: string, ...groups: any[]) => React.ReactElement
    ) => {
      const newParts: (string | React.ReactElement)[] = [];
      for (const part of parts) {
        if (typeof part !== 'string') {
          newParts.push(part);
          continue;
        }

        let lastIndex = 0;
        regex.lastIndex = 0;
        let match;

        while ((match = regex.exec(part)) !== null) {
          const matchIndex = match.index;
          const matchText = match[0];

          // Push text preceding the match
          if (matchIndex > lastIndex) {
            newParts.push(part.substring(lastIndex, matchIndex));
          }

          // Push rendered element
          newParts.push(renderFn(matchText, ...match.slice(1)));
          lastIndex = regex.lastIndex;
        }

        if (lastIndex < part.length) {
          newParts.push(part.substring(lastIndex));
        }
      }
      parts = newParts;
    };

    // 1. Parse inline code backticks: `code`
    applySplit(/`([^`]+)`/g, (match, codeText) => (
      <code key={Math.random()} className="px-1.5 py-0.5 bg-zinc-950 text-amber-400 font-mono text-[10px] rounded border border-zinc-850 mx-0.5">
        {codeText}
      </code>
    ));

    // 2. Parse bold: **text**
    applySplit(/\*\*([^*]+)\*\*/g, (match, boldText) => (
      <strong key={Math.random()} className="font-bold text-white">
        {boldText}
      </strong>
    ));

    // 3. Parse italic: *text*
    applySplit(/\*([^*]+)\*/g, (match, italicText) => (
      <em key={Math.random()} className="italic text-zinc-300">
        {italicText}
      </em>
    ));

    // 4. Parse HEX colors (e.g. #fff, #1a2b3c, etc.)
    applySplit(/#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g, (match) => (
      <span 
        key={Math.random()} 
        className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-zinc-950 text-zinc-300 font-mono text-[11px] rounded border border-zinc-850 mx-0.5 select-all align-middle hover:border-zinc-700 transition-colors"
      >
        <span 
          className="w-3 h-3 rounded border border-white/20 shrink-0 inline-block shadow-inner" 
          style={{ backgroundColor: match }} 
        />
        {match}
      </span>
    ));

    // 5. Parse RGB/RGBA colors (e.g. rgb(255, 0, 0), rgba(12, 34, 56, 0.5))
    applySplit(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d\.]+\s*)?\)/gi, (match) => (
      <span 
        key={Math.random()} 
        className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-zinc-950 text-zinc-300 font-mono text-[11px] rounded border border-zinc-850 mx-0.5 select-all align-middle hover:border-zinc-700 transition-colors"
      >
        <span 
          className="w-3 h-3 rounded border border-white/20 shrink-0 inline-block shadow-inner" 
          style={{ backgroundColor: match }} 
        />
        {match}
      </span>
    ));

    // 6. Parse HSL/HSLA colors (e.g. hsl(120, 100%, 50%))
    applySplit(/hsla?\(\s*\d+\s*,\s*\d+(?:%|deg)?\s*,\s*\d+(?:%|deg)?\s*(?:,\s*[\d\.]+\s*)?\)/gi, (match) => (
      <span 
        key={Math.random()} 
        className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-zinc-950 text-zinc-300 font-mono text-[11px] rounded border border-zinc-850 mx-0.5 select-all align-middle hover:border-zinc-700 transition-colors"
      >
        <span 
          className="w-3 h-3 rounded border border-white/20 shrink-0 inline-block shadow-inner" 
          style={{ backgroundColor: match }} 
        />
        {match}
      </span>
    ));

    // 7. Parse Named Colors
    const namedColorsRegex = new RegExp(`\\b(${COLOR_NAMES.join('|')})\\b`, 'gi');
    applySplit(namedColorsRegex, (match) => (
      <span 
        key={Math.random()} 
        className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-zinc-950 text-zinc-300 font-mono text-[11px] rounded border border-zinc-850 mx-0.5 select-all align-middle hover:border-zinc-700 transition-colors"
      >
        <span 
          className="w-3 h-3 rounded border border-white/20 shrink-0 inline-block shadow-inner" 
          style={{ backgroundColor: match.toLowerCase() }} 
        />
        {match}
      </span>
    ));

    return parts;
  };

  // Split text by code blocks ```
  const segments = text.split('```');
  const blocks: React.ReactNode[] = [];

  segments.forEach((segment, index) => {
    const isCodeBlock = index % 2 === 1;

    if (isCodeBlock) {
      const lines = segment.split('\n');
      let language = 'text';
      let code = segment;

      if (lines.length > 0 && lines[0].trim().length < 15 && !lines[0].includes(' ') && lines[0].trim() !== '') {
        language = lines[0].trim();
        code = lines.slice(1).join('\n');
      }

      blocks.push(
        <div key={`code-${index}`} className="my-3 bg-zinc-950 border border-zinc-850 rounded-xl overflow-hidden font-mono text-[11px]">
          <div className="px-3 py-1 bg-zinc-900 border-b border-zinc-850 text-zinc-500 font-bold uppercase text-[9px] tracking-wider flex justify-between items-center">
            <span>{language}</span>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(code.trim())}
              className="hover:text-zinc-300 text-zinc-500 transition-colors text-[9px] font-bold"
            >
              Copiar
            </button>
          </div>
          <pre className="p-3 overflow-x-auto text-zinc-300 scrollbar-thin whitespace-pre leading-relaxed select-all">
            {code.trim()}
          </pre>
        </div>
      );
    } else {
      const lines = segment.split('\n');
      let currentParagraphLines: string[] = [];

      const flushParagraph = (key: string) => {
        if (currentParagraphLines.length > 0) {
          const content = currentParagraphLines.join('\n').trim();
          if (content) {
            blocks.push(
              <p key={key} className="mb-2 leading-relaxed text-zinc-200">
                {parseInlineStyles(content)}
              </p>
            );
          }
          currentParagraphLines = [];
        }
      };

      lines.forEach((line, lineIdx) => {
        const trimmed = line.trim();
        const lineKey = `text-${index}-${lineIdx}`;

        if (trimmed.startsWith('### ')) {
          flushParagraph(lineKey + '-pre-h3');
          blocks.push(
            <h5 key={lineKey + '-h3'} className="text-xs font-black text-white mt-3 mb-1.5 tracking-tight flex items-center gap-1">
              <span className="text-blue-500">◆</span>
              {parseInlineStyles(trimmed.substring(4))}
            </h5>
          );
        } else if (trimmed.startsWith('## ')) {
          flushParagraph(lineKey + '-pre-h2');
          blocks.push(
            <h4 key={lineKey + '-h2'} className="text-sm font-black text-white mt-3 mb-1.5 tracking-tight border-b border-zinc-900 pb-0.5">
              {parseInlineStyles(trimmed.substring(3))}
            </h4>
          );
        } else if (trimmed.startsWith('# ')) {
          flushParagraph(lineKey + '-pre-h1');
          blocks.push(
            <h3 key={lineKey + '-h1'} className="text-base font-black text-white mt-4 mb-2 tracking-tight border-b border-zinc-900 pb-0.5">
              {parseInlineStyles(trimmed.substring(2))}
            </h3>
          );
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          flushParagraph(lineKey + '-pre-ul');
          blocks.push(
            <ul key={lineKey + '-ul'} className="list-disc list-inside pl-1.5 mb-1.5 space-y-1 text-zinc-300">
              <li className="text-[11px]">{parseInlineStyles(trimmed.substring(2))}</li>
            </ul>
          );
        } else if (/^\d+\.\s+/.test(trimmed)) {
          flushParagraph(lineKey + '-pre-ol');
          const numMatch = trimmed.match(/^(\d+)\.\s+/);
          const offset = numMatch ? numMatch[0].length : 3;
          blocks.push(
            <ol key={lineKey + '-ol'} className="list-decimal list-inside pl-1.5 mb-1.5 space-y-1 text-zinc-300">
              <li className="text-[11px]">{parseInlineStyles(trimmed.substring(offset))}</li>
            </ol>
          );
        } else if (trimmed === '') {
          flushParagraph(lineKey);
        } else {
          currentParagraphLines.push(line);
        }
      });

      flushParagraph(`text-${index}-final`);
    }
  });

  return <div className="space-y-1 text-[11px]">{blocks}</div>;
}
