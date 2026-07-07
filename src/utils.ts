import React from 'react';
import { EmailElement, EmailVariable, EmailTemplate, VisualIdentity } from './types';

// Replace placeholders like {{variableName}} with their current values
export function replaceVariables(text: string, variables: EmailVariable[]): string {
  if (!text) return '';
  let result = text;
  variables.forEach((variable) => {
    // Escape special characters in key just in case
    const escapedKey = variable.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`{{\\s*${escapedKey}\\s*}}`, 'g');
    result = result.replace(regex, variable.value || `[${variable.key}]`);
  });
  return result;
}

// A robust nested parser that parses Markdown and inline HTML styling tags into React nodes
export function parseFormattedTextToReact(text: string): React.ReactNode {
  if (!text) return '';

  const regexes = [
    {
      name: 'fontSizeSpan',
      regex: /<span\s+style="font-size:\s*(\d+)px;?"\s*>([\s\S]*?)<\/span>/i,
      parse: (match: RegExpExecArray) => ({
        content: match[2],
        style: { fontSize: `${match[1]}px` }
      })
    },
    {
      name: 'strongTag',
      regex: /<strong>([\s\S]*?)<\/strong>/i,
      parse: (match: RegExpExecArray) => ({
        content: match[1],
        style: { fontWeight: 'bold' as const }
      })
    },
    {
      name: 'bTag',
      regex: /<b>([\s\S]*?)<\/b>/i,
      parse: (match: RegExpExecArray) => ({
        content: match[1],
        style: { fontWeight: 'bold' as const }
      })
    },
    {
      name: 'emTag',
      regex: /<em>([\s\S]*?)<\/em>/i,
      parse: (match: RegExpExecArray) => ({
        content: match[1],
        style: { fontStyle: 'italic' as const }
      })
    },
    {
      name: 'iTag',
      regex: /<i>([\s\S]*?)<\/i>/i,
      parse: (match: RegExpExecArray) => ({
        content: match[1],
        style: { fontStyle: 'italic' as const }
      })
    },
    {
      name: 'uTag',
      regex: /<u>([\s\S]*?)<\/u>/i,
      parse: (match: RegExpExecArray) => ({
        content: match[1],
        style: { textDecoration: 'underline' as const }
      })
    },
    {
      name: 'strikeTag',
      regex: /<strike>([\s\S]*?)<\/strike>/i,
      parse: (match: RegExpExecArray) => ({
        content: match[1],
        style: { textDecoration: 'line-through' as const }
      })
    },
    {
      name: 'sTag',
      regex: /<s>([\s\S]*?)<\/s>/i,
      parse: (match: RegExpExecArray) => ({
        content: match[1],
        style: { textDecoration: 'line-through' as const }
      })
    },
    {
      name: 'boldMarkdown',
      regex: /\*\*([\s\S]*?)\*\*/,
      parse: (match: RegExpExecArray) => ({
        content: match[1],
        style: { fontWeight: 'bold' as const }
      })
    },
    {
      name: 'italicMarkdown',
      regex: /\*([\s\S]*?)\*/,
      parse: (match: RegExpExecArray) => ({
        content: match[1],
        style: { fontStyle: 'italic' as const }
      })
    },
    {
      name: 'italicMarkdownUnderscore',
      regex: /_([\s\S]*?)_/,
      parse: (match: RegExpExecArray) => ({
        content: match[1],
        style: { fontStyle: 'italic' as const }
      })
    },
    {
      name: 'underlineMarkdown',
      regex: /__([\s\S]*?)__/,
      parse: (match: RegExpExecArray) => ({
        content: match[1],
        style: { textDecoration: 'underline' as const }
      })
    },
    {
      name: 'strikeMarkdown',
      regex: /~~([\s\S]*?)~~/,
      parse: (match: RegExpExecArray) => ({
        content: match[1],
        style: { textDecoration: 'line-through' as const }
      })
    }
  ];

  function parseSegment(str: string): React.ReactNode {
    if (!str) return '';

    let earliestMatch: { index: number; length: number; content: string; style?: React.CSSProperties } | null = null;

    for (const rule of regexes) {
      const match = rule.regex.exec(str);
      if (match) {
        if (earliestMatch === null || match.index < earliestMatch.index) {
          const parsed = rule.parse(match);
          earliestMatch = {
            index: match.index,
            length: match[0].length,
            content: parsed.content,
            style: parsed.style
          };
        }
      }
    }

    if (!earliestMatch) {
      return str;
    }

    const left = str.slice(0, earliestMatch.index);
    const middleContent = earliestMatch.content;
    const right = str.slice(earliestMatch.index + earliestMatch.length);

    const middleNode = React.createElement(
      'span',
      { style: earliestMatch.style, key: Math.random() },
      parseSegment(middleContent)
    );

    return React.createElement(
      React.Fragment,
      { key: Math.random() },
      parseSegment(left),
      middleNode,
      parseSegment(right)
    );
  }

  return parseSegment(text);
}

// Check if a string contains any of the variables
export function highlightVariablesInEditor(text: string, variables: EmailVariable[]): string {
  if (!text) return '';
  let result = text;
  // Temporary escape HTML tags to prevent breaking
  result = result
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  variables.forEach((variable) => {
    const escapedKey = variable.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`({{\\s*${escapedKey}\\s*}})`, 'g');
    result = result.replace(
      regex,
      `<span class="bg-blue-100 text-blue-700 px-1 rounded font-mono text-xs border border-blue-200" title="Variável: ${variable.description}">$1</span>`
    );
  });
  return result;
}

// Generate the React Email code with Tailwind configured
export function generateReactEmailCode(
  template: EmailTemplate,
  options?: {
    format?: 'tsx' | 'jsx';
    staticVariables?: boolean;
    variableValues?: Record<string, string>;
  }
): string {
  const { elements, variables, globalStyles } = template;
  const isTsx = (options?.format || 'tsx') === 'tsx';
  const isStatic = !!options?.staticVariables;
  const values = options?.variableValues || {};

  // 1. Setup Prop interface
  const propTypes = variables.map(v => `  ${v.key}?: string;`).join('\n');
  const destructuring = variables.map(v => {
    const val = values[v.key] !== undefined ? values[v.key] : (v.value || '');
    return `  ${v.key} = "${val.replace(/"/g, '\\"')}"`;
  }).join(',\n');
  
  // 2. Setup Default Props
  const defaultPropsObj = variables.map(v => {
    const val = values[v.key] !== undefined ? values[v.key] : (v.value || '');
    return `  ${v.key}: "${val.replace(/"/g, '\\"')}",`;
  }).join('\n');

  // Convert an element's custom style into Tailwind classes or inline styles
  const getTailwindClasses = (el: EmailElement): string => {
    const classes: string[] = [];
    const styles = el.styles;

    // Alignment
    if (styles.align === 'center') classes.push('text-center');
    if (styles.align === 'right') classes.push('text-right');
    if (styles.align === 'left') classes.push('text-left');

    // Font weights
    if (styles.fontWeight === 'bold') classes.push('font-bold');
    if (styles.fontWeight === 'semibold') classes.push('font-semibold');
    if (styles.fontWeight === 'medium') classes.push('font-medium');

    // Margin bottom
    if (styles.marginBottom !== undefined) {
      const mb = styles.marginBottom;
      if (mb <= 4) classes.push('mb-1');
      else if (mb <= 8) classes.push('mb-2');
      else if (mb <= 12) classes.push('mb-3');
      else if (mb <= 16) classes.push('mb-4');
      else if (mb <= 24) classes.push('mb-6');
      else if (mb <= 32) classes.push('mb-8');
      else if (mb <= 48) classes.push('mb-12');
      else classes.push(`mb-[${mb}px]`);
    }

    // Margin top
    if (styles.marginTop !== undefined) {
      const mt = styles.marginTop;
      if (mt <= 4) classes.push('mt-1');
      else if (mt <= 8) classes.push('mt-2');
      else if (mt <= 12) classes.push('mt-3');
      else if (mt <= 16) classes.push('mt-4');
      else if (mt <= 24) classes.push('mt-6');
      else if (mt <= 32) classes.push('mt-8');
      else classes.push(`mt-[${mt}px]`);
    }

    return classes.join(' ');
  };

  // Convert custom style properties into a JSON/JSX style object
  const getInlineStyles = (el: EmailElement): string => {
    const styles = el.styles;
    const styleObj: Record<string, string | number> = {};

    let textColor = styles.textColor;
    let backgroundColor = styles.backgroundColor;

    // Apply conditional color rules from visual identity
    const visualIdentity = template.visualIdentity;
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
    const tl = styles.borderRadiusTopLeft !== undefined ? styles.borderRadiusTopLeft : styles.borderRadius;
    const tr = styles.borderRadiusTopRight !== undefined ? styles.borderRadiusTopRight : styles.borderRadius;
    const bl = styles.borderRadiusBottomLeft !== undefined ? styles.borderRadiusBottomLeft : styles.borderRadius;
    const br = styles.borderRadiusBottomRight !== undefined ? styles.borderRadiusBottomRight : styles.borderRadius;

    if (tl !== undefined) styleObj.borderTopLeftRadius = `${tl}px`;
    if (tr !== undefined) styleObj.borderTopRightRadius = `${tr}px`;
    if (bl !== undefined) styleObj.borderBottomLeftRadius = `${bl}px`;
    if (br !== undefined) styleObj.borderBottomRightRadius = `${br}px`;

    const borderWidth = styles.borderWidth !== undefined ? styles.borderWidth : 0;
    const borderStyle = styles.borderStyle || 'solid';
    const borderColor = styles.borderColor || '#cbd5e1';
    const borderSides = styles.borderSides || ['top', 'bottom', 'left', 'right'];

    if (borderWidth > 0) {
      if (borderSides.includes('top')) {
        styleObj.borderTopWidth = `${borderWidth}px`;
        styleObj.borderTopStyle = borderStyle;
        styleObj.borderTopColor = borderColor;
      } else {
        styleObj.borderTopWidth = '0px';
      }
      if (borderSides.includes('bottom')) {
        styleObj.borderBottomWidth = `${borderWidth}px`;
        styleObj.borderBottomStyle = borderStyle;
        styleObj.borderBottomColor = borderColor;
      } else {
        styleObj.borderBottomWidth = '0px';
      }
      if (borderSides.includes('left')) {
        styleObj.borderLeftWidth = `${borderWidth}px`;
        styleObj.borderLeftStyle = borderStyle;
        styleObj.borderLeftColor = borderColor;
      } else {
        styleObj.borderLeftWidth = '0px';
      }
      if (borderSides.includes('right')) {
        styleObj.borderRightWidth = `${borderWidth}px`;
        styleObj.borderRightStyle = borderStyle;
        styleObj.borderRightColor = borderColor;
      } else {
        styleObj.borderRightWidth = '0px';
      }
    } else if (el.type === 'divider') {
      styleObj.borderTopWidth = '1px';
      styleObj.borderTopStyle = 'solid';
      styleObj.borderTopColor = borderColor;
    }

    if (el.type === 'container' || el.type === 'grid') {
      styleObj.overflow = 'hidden';
    }

    // Padding settings
    if (styles.paddingTop !== undefined) styleObj.paddingTop = `${styles.paddingTop}px`;
    if (styles.paddingBottom !== undefined) styleObj.paddingBottom = `${styles.paddingBottom}px`;
    if (styles.paddingLeft !== undefined) styleObj.paddingLeft = `${styles.paddingLeft}px`;
    if (styles.paddingRight !== undefined) styleObj.paddingRight = `${styles.paddingRight}px`;

    if (el.type === 'button') {
      styleObj.display = 'inline-block';
      styleObj.textDecoration = 'none';
      if (!styles.paddingTop) styleObj.paddingTop = '12px';
      if (!styles.paddingBottom) styleObj.paddingBottom = '12px';
      if (!styles.paddingLeft) styleObj.paddingLeft = '24px';
      if (!styles.paddingRight) styleObj.paddingRight = '24px';
    }

    if (Object.keys(styleObj).length === 0) return '';
    return ` style={${JSON.stringify(styleObj, null, 2).replace(/\n/g, '\n      ')}}`;
  };

  // Helpers to replace React props variables inside TSX output
  const formatTextForReact = (text: string): string => {
    if (!text) return '""';
    let formatted = text;
    
    if (isStatic) {
      variables.forEach(v => {
        const val = values[v.key] !== undefined ? values[v.key] : (v.value || '');
        const regex = new RegExp(`{{\\s*${v.key}\\s*}}`, 'g');
        formatted = formatted.replace(regex, val);
      });
      return `"${formatted.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
    } else {
      variables.forEach(v => {
        const regex = new RegExp(`{{\\s*${v.key}\\s*}}`, 'g');
        formatted = formatted.replace(regex, `\${${v.key}}`);
      });

      if (formatted !== text) {
        return `{\`${formatted.replace(/`/g, '\\`').replace(/\n/g, '\\n')}\`}`;
      }
      return `"${text.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
    }
  };

  const formatTextChildForReact = (text: string): string => {
    if (!text) return '';
    let formatted = text;
    
    // Convert variables
    if (isStatic) {
      variables.forEach(v => {
        const val = values[v.key] !== undefined ? values[v.key] : (v.value || '');
        const regex = new RegExp(`{{\\s*${v.key}\\s*}}`, 'g');
        formatted = formatted.replace(regex, val);
      });
    } else {
      variables.forEach(v => {
        const regex = new RegExp(`{{\\s*${v.key}\\s*}}`, 'g');
        formatted = formatted.replace(regex, `{${v.key}}`);
      });
    }

    // Translate markdown / HTML elements into JSX
    formatted = formatted
      // Bold
      .replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*([\s\S]*?)\*/g, '<em>$1</em>')
      .replace(/_([\s\S]*?)_/g, '<em>$1</em>')
      // Strikethrough
      .replace(/~~([\s\S]*?)~~/g, '<strike>$1</strike>')
      // Underline
      .replace(/__([\s\S]*?)__/g, '<u>$1</u>')
      // Custom span inline style for font size
      .replace(/<span\s+style="font-size:\s*(\d+)px;?"\s*>([\s\S]*?)<\/span>/gi, '<span style={{ fontSize: \'$1px\' }}>$2</span>');

    return formatted;
  };

  // 3. Generate HTML/TSX string for elements (recursive to support container and grid)
  const compileElementToTSX = (el: EmailElement): string => {
    const twClass = getTailwindClasses(el);
    const inlineStyle = getInlineStyles(el);
    const twAttr = twClass ? ` className="${twClass}"` : '';

    switch (el.type) {
      case 'heading': {
        const textChild = formatTextChildForReact(el.content);
        return `            <Heading${twAttr}${inlineStyle}>\n              ${textChild}\n            </Heading>`;
      }
      case 'text': {
        const paragraphs = el.content.split('\n\n');
        return paragraphs.map(p => {
          const textChild = formatTextChildForReact(p);
          return `            <Text${twAttr}${inlineStyle}>\n              ${textChild}\n            </Text>`;
        }).join('\n');
      }
      case 'button': {
        const textChild = formatTextChildForReact(el.content);
        const buttonHref = formatTextForReact(el.href || '#');
        const alignment = el.styles.align || 'center';
        let containerTw = 'text-center';
        if (alignment === 'left') containerTw = 'text-left';
        if (alignment === 'right') containerTw = 'text-right';

        return `            <Section className="${containerTw}">\n              <Button${twAttr}${inlineStyle} href=${buttonHref}>\n                ${textChild}\n              </Button>\n            </Section>`;
      }
      case 'image': {
        const imageSrc = formatTextForReact(el.src || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop');
        const imageAlt = el.alt ? ` alt="${el.alt.replace(/"/g, '\\"')}"` : ' alt="Template Image"';
        const widthVal = el.styles.width ? ` width="${el.styles.width}"` : ' width="100%"';
        const heightVal = el.styles.height ? ` height="${el.styles.height}"` : '';
        const alignVal = el.styles.align ? ` align="${el.styles.align}"` : ' align="center"';
        const imgStyles: Record<string, string | number> = {};
        if (el.styles.borderRadius) imgStyles.borderRadius = `${el.styles.borderRadius}px`;
        const imgStyleStr = Object.keys(imgStyles).length > 0 ? ` style={${JSON.stringify(imgStyles)}}` : '';

        const baseImg = `<Img${twAttr}${imgStyleStr} src=${imageSrc}${imageAlt}${widthVal}${heightVal}${alignVal} />`;
        if (el.href) {
          const linkHref = formatTextForReact(el.href);
          return `            <Link href=${linkHref} className="block">\n              ${baseImg}\n            </Link>`;
        }
        return `            ${baseImg}`;
      }
      case 'link': {
        const textChild = formatTextChildForReact(el.content);
        const linkHref = formatTextForReact(el.href || '#');
        return `            <Link${twAttr}${inlineStyle} href=${linkHref}>\n              ${textChild}\n            </Link>`;
      }
      case 'divider': {
        const borderStyle: Record<string, string | number> = {};
        if (el.styles.borderColor) borderStyle.borderColor = el.styles.borderColor;
        if (el.styles.borderWidth) borderStyle.borderWidth = `${el.styles.borderWidth}px`;
        const styleStr = Object.keys(borderStyle).length > 0 ? ` style={${JSON.stringify(borderStyle)}}` : '';
        return `            <Hr${twAttr}${styleStr} />`;
      }
      case 'spacer': {
        const height = el.styles.height || 24;
        return `            <Section style={{ height: '${height}px' }} />`;
      }
      case 'container': {
        const containerChildren = (el.children || []).map(child => compileElementToTSX(child)).join('\n');
        return `            <Section${twAttr}${inlineStyle} style={{
              backgroundColor: "${el.styles.backgroundColor || 'transparent'}",
              padding: "${el.styles.paddingTop || 16}px ${el.styles.paddingRight || 16}px ${el.styles.paddingBottom || 16}px ${el.styles.paddingLeft || 16}px",
              borderRadius: "${el.styles.borderRadius || 0}px",
              border: "${el.styles.borderWidth ? `${el.styles.borderWidth}px solid ${el.styles.borderColor || '#e2e8f0'}` : 'none'}"
            }}>\n              ${containerChildren}\n            </Section>`;
      }
      case 'grid': {
        const rows = el.rowsCount || 1;
        const cols = el.colsCount || 2;
        const gridCells = el.gridCells || {};
        let gridRowsTSX = '';
        for (let r = 0; r < rows; r++) {
          gridRowsTSX += `              <Section style={{ display: 'flex' }}>\n`;
          for (let c = 0; c < cols; c++) {
            const cellKey = `${r}-${c}`;
            const cellElements = gridCells[cellKey] || [];
            const cellContentTSX = cellElements.map(child => compileElementToTSX(child)).join('\n');
            const colWidthPercent = Math.round(100 / cols);
            gridRowsTSX += `                <Section style={{ width: '${colWidthPercent}%', padding: '8px' }}>\n                  ${cellContentTSX}\n                </Section>\n`;
          }
          gridRowsTSX += `              </Section>\n`;
        }
        return `            <Section${twAttr}${inlineStyle} style={{
          backgroundColor: "${el.styles.backgroundColor || 'transparent'}",
          borderRadius: "${el.styles.borderRadius || 0}px",
          border: "${el.styles.borderWidth ? `${el.styles.borderWidth}px solid ${el.styles.borderColor || '#e2e8f0'}` : 'none'}"
        }}>\n              ${gridRowsTSX}\n            </Section>`;
      }
      default:
        return '';
    }
  };

  const elementsCode = elements.map((el) => compileElementToTSX(el)).join('\n\n');

  // Prop or default setup logic
  const interfaceDeclaration = (isTsx && !isStatic) ? `\ninterface EmailTemplateProps {
${propTypes || '  // Sem variáveis definidas'}
}

export const EmailTemplateDefaultProps: EmailTemplateProps = {
${defaultPropsObj || '  // Sem variáveis definidas'}
};\n` : '';

  const signature = !isStatic
    ? `export default function EmailTemplate({
${destructuring || '  // Sem variáveis'}
}${isTsx ? ': EmailTemplateProps' : ''})`
    : `export default function EmailTemplate()`;

  // Generate the actual source file
  return `import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Tailwind,
} from "@react-email/components";
import * as React from "react";
${interfaceDeclaration}
${signature} {
  return (
    <Html>
      <Head />
      <Preview>Seu template de email incrível</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: "#2563eb",
              },
            },
          },
        }}
      >
        <Body style={{ backgroundColor: "${globalStyles.backgroundColor}", margin: "auto", fontFamily: "${globalStyles.fontFamily}" }}>
          <Container style={{
            backgroundColor: "${globalStyles.containerColor}",
            borderRadius: "${globalStyles.borderRadius}px",
            border: "1px solid #eaeaea",
            padding: "${globalStyles.padding}px",
            marginTop: "${globalStyles.bodyMarginTop ?? 40}px",
            marginBottom: "${globalStyles.bodyMarginBottom ?? 40}px",
            marginLeft: "${globalStyles.bodyAlignment === 'left' ? '0px' : 'auto'}",
            marginRight: "${globalStyles.bodyAlignment === 'right' ? '0px' : 'auto'}",
            maxWidth: "${globalStyles.hasWidthLimit !== false ? `${globalStyles.bodyWidth || 600}px` : '100%'}",
            color: "${globalStyles.textColor}"
          }}>
${elementsCode}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
`;
}

// Compiles the entire template into standard email-safe inline HTML with standard tables
export function compileTemplateToEmailHtml(template: EmailTemplate): string {
  const { elements, variables, globalStyles } = template;

  const formatTextForHtml = (text: string): string => {
    if (!text) return '';
    let formatted = text;
    
    // First apply markdown formatting to get clean HTML tags for style
    formatted = formatted
      .replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([\s\S]*?)\*/g, '<em>$1</em>')
      .replace(/_([\s\S]*?)_/g, '<em>$1</em>')
      .replace(/~~([\s\S]*?)~~/g, '<strike>$1</strike>')
      .replace(/__([\s\S]*?)__/g, '<u>$1</u>')
      .replace(/<span\s+style="font-size:\s*(\d+)px;?"\s*>([\s\S]*?)<\/span>/gi, '<span style="font-size: $1px;">$2</span>');
      
    // Find all valid HTML tags that we want to preserve
    const validTagsRegex = /<\/?(?:strong|em|u|strike|span|b|i|s|strong|em)(?:\s+style="font-size:\s*\d+px;")?>/gi;
    const tokens: string[] = [];
    
    // Replace valid tags with placeholders
    formatted = formatted.replace(validTagsRegex, (match) => {
      const token = `__VALID_TAG_TOKEN_${tokens.length}__`;
      tokens.push(match);
      return token;
    });

    // Now escape all remaining & to &amp;, < to &lt;, > to &gt;
    formatted = formatted
      .replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;)/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Restore the valid tags
    tokens.forEach((tag, index) => {
      formatted = formatted.replace(`__VALID_TAG_TOKEN_${index}__`, tag);
    });
    
    // Replace variable placeholders with values
    variables.forEach(v => {
      const regex = new RegExp(`{{\\s*${v.key}\\s*}}`, 'g');
      formatted = formatted.replace(regex, v.value || `[${v.key}]`);
    });
    
    return formatted;
  };

  const getElementStyles = (el: EmailElement): string => {
    const styles = el.styles;
    const styleParts: string[] = [];

    let textColor = styles.textColor;
    let backgroundColor = styles.backgroundColor;

    // Apply conditional color rules from visual identity
    const visualIdentity = template.visualIdentity;
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

    if (textColor) styleParts.push(`color: ${textColor}`);
    if (backgroundColor && el.type !== 'divider' && el.type !== 'spacer') {
      styleParts.push(`background-color: ${backgroundColor}`);
    }
    if (styles.fontSize) styleParts.push(`font-size: ${styles.fontSize}px`);
    if (styles.fontWeight) styleParts.push(`font-weight: ${styles.fontWeight}`);

    // Individual border radius (canto a canto) or standard border radius
    if (styles.borderRadiusTopLeft !== undefined) styleParts.push(`border-top-left-radius: ${styles.borderRadiusTopLeft}px`);
    if (styles.borderRadiusTopRight !== undefined) styleParts.push(`border-top-right-radius: ${styles.borderRadiusTopRight}px`);
    if (styles.borderRadiusBottomLeft !== undefined) styleParts.push(`border-bottom-left-radius: ${styles.borderRadiusBottomLeft}px`);
    if (styles.borderRadiusBottomRight !== undefined) styleParts.push(`border-bottom-right-radius: ${styles.borderRadiusBottomRight}px`);
    if (styles.borderRadius !== undefined && styles.borderRadiusTopLeft === undefined) {
      styleParts.push(`border-radius: ${styles.borderRadius}px`);
    }

    if (styles.borderWidth !== undefined) {
      styleParts.push(`border: ${styles.borderWidth}px solid ${styles.borderColor || '#000000'}`);
    }

    // Individual paddings
    if (styles.paddingTop !== undefined) styleParts.push(`padding-top: ${styles.paddingTop}px`);
    if (styles.paddingBottom !== undefined) styleParts.push(`padding-bottom: ${styles.paddingBottom}px`);
    if (styles.paddingLeft !== undefined) styleParts.push(`padding-left: ${styles.paddingLeft}px`);
    if (styles.paddingRight !== undefined) styleParts.push(`padding-right: ${styles.paddingRight}px`);

    // Individual margins
    if (styles.marginTop !== undefined) styleParts.push(`margin-top: ${styles.marginTop}px`);
    if (styles.marginBottom !== undefined) styleParts.push(`margin-bottom: ${styles.marginBottom}px`);
    if (styles.marginLeft !== undefined) styleParts.push(`margin-left: ${styles.marginLeft}px`);
    if (styles.marginRight !== undefined) styleParts.push(`margin-right: ${styles.marginRight}px`);

    if (styles.align) {
      styleParts.push(`text-align: ${styles.align}`);
    }

    return styleParts.join('; ');
  };

  const getInnerTextStyles = (el: EmailElement): string => {
    const styles = el.styles;
    const styleParts: string[] = [];

    // Font Family
    styleParts.push(`font-family: ${globalStyles.fontFamily || 'system-ui, -apple-system, sans-serif'}`);

    // Font Size
    if (styles.fontSize) {
      styleParts.push(`font-size: ${styles.fontSize}px`);
    } else {
      styleParts.push(`font-size: ${el.type === 'heading' ? '24px' : '15px'}`);
    }

    // Font Weight
    if (styles.fontWeight) {
      styleParts.push(`font-weight: ${styles.fontWeight}`);
    } else {
      styleParts.push(`font-weight: ${el.type === 'heading' ? 'bold' : 'normal'}`);
    }

    // Color
    let textColor = styles.textColor || globalStyles.textColor || '#1e293b';
    const visualIdentity = template.visualIdentity;
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

          if (match && el.type !== 'button') {
            textColor = rule.colorIfTrue;
          } else if (!match && el.type !== 'button') {
            textColor = rule.colorIfFalse;
          }
        }
      }
    }
    styleParts.push(`color: ${textColor}`);

    // Line Height
    styleParts.push(`line-height: ${el.type === 'heading' ? '1.3' : '1.5'}`);

    return styleParts.join('; ');
  };

  const compileElementToHtml = (el: EmailElement): string => {
    const inlineStyle = getElementStyles(el);
    const alignAttr = el.styles.align ? ` align="${el.styles.align}"` : '';

    const getBorderAndRadiusStyles = (element: EmailElement): string => {
      const s = element.styles || {};
      const stylesList: string[] = [];
      
      const tl = s.borderRadiusTopLeft !== undefined ? s.borderRadiusTopLeft : s.borderRadius;
      const tr = s.borderRadiusTopRight !== undefined ? s.borderRadiusTopRight : s.borderRadius;
      const bl = s.borderRadiusBottomLeft !== undefined ? s.borderRadiusBottomLeft : s.borderRadius;
      const br = s.borderRadiusBottomRight !== undefined ? s.borderRadiusBottomRight : s.borderRadius;

      const numTl = tl !== undefined ? Number(tl) : undefined;
      const numTr = tr !== undefined ? Number(tr) : undefined;
      const numBl = bl !== undefined ? Number(bl) : undefined;
      const numBr = br !== undefined ? Number(br) : undefined;

      const hasRadius = (numTl && numTl > 0) || (numTr && numTr > 0) || (numBl && numBl > 0) || (numBr && numBr > 0);

      if (numTl !== undefined && numTr !== undefined && numBl !== undefined && numBr !== undefined && numTl === numTr && numTr === numBl && numBl === numBr) {
        if (numTl > 0) {
          stylesList.push(`border-radius: ${numTl}px`);
        }
      } else {
        if (numTl !== undefined && numTl > 0) stylesList.push(`border-top-left-radius: ${numTl}px`);
        if (numTr !== undefined && numTr > 0) stylesList.push(`border-top-right-radius: ${numTr}px`);
        if (numBl !== undefined && numBl > 0) stylesList.push(`border-bottom-left-radius: ${numBl}px`);
        if (numBr !== undefined && numBr > 0) stylesList.push(`border-bottom-right-radius: ${numBr}px`);
      }

      let borderWidth = 0;
      if (s.borderWidth !== undefined) {
        const parsed = Number(s.borderWidth);
        if (!isNaN(parsed)) borderWidth = parsed;
      }
      const borderStyle = s.borderStyle || 'solid';
      const borderColor = s.borderColor || '#cbd5e1';
      const borderSides = s.borderSides || ['top', 'bottom', 'left', 'right'];

      if (borderWidth > 0) {
        if (borderSides.length === 4 && borderSides.includes('top') && borderSides.includes('bottom') && borderSides.includes('left') && borderSides.includes('right')) {
          stylesList.push(`border: ${borderWidth}px ${borderStyle} ${borderColor}`);
        } else {
          if (borderSides.includes('top')) stylesList.push(`border-top: ${borderWidth}px ${borderStyle} ${borderColor}`);
          if (borderSides.includes('bottom')) stylesList.push(`border-bottom: ${borderWidth}px ${borderStyle} ${borderColor}`);
          if (borderSides.includes('left')) stylesList.push(`border-left: ${borderWidth}px ${borderStyle} ${borderColor}`);
          if (borderSides.includes('right')) stylesList.push(`border-right: ${borderWidth}px ${borderStyle} ${borderColor}`);
        }
      } else if (element.type === 'divider') {
        stylesList.push(`border-top: 1px solid ${borderColor}`);
      }

      if (hasRadius) {
        stylesList.push(`border-collapse: separate`);
      }

      if (element.type === 'container' || element.type === 'grid') {
        stylesList.push(`overflow: hidden`);
      }

      return stylesList.join('; ');
    };

    switch (el.type) {
      case 'heading': {
        const textChild = formatTextForHtml(el.content);
        const innerStyle = getInnerTextStyles(el);
        
        // Extract spacing styles to put as padding on <td>
        const pt = (el.styles.paddingTop ?? 0) + (el.styles.marginTop ?? 0);
        const pb = (el.styles.paddingBottom ?? 0) + (el.styles.marginBottom ?? 12); // Heading default margin-bottom is 12px
        const pl = (el.styles.paddingLeft ?? 0) + (el.styles.marginLeft ?? 0);
        const pr = (el.styles.paddingRight ?? 0) + (el.styles.marginRight ?? 0);
        
        // Background color and borders
        const bgStyle = el.styles.backgroundColor ? `background-color: ${el.styles.backgroundColor};` : '';
        const borderAndRadius = getBorderAndRadiusStyles(el);
        
        return `            <!-- Heading -->
            <tr>
              <td style="padding-top: ${pt}px; padding-bottom: ${pb}px; padding-left: ${pl}px; padding-right: ${pr}px; margin: 0;${bgStyle ? ' ' + bgStyle : ''}${borderAndRadius ? ' ' + borderAndRadius + ';' : ''}"${alignAttr}>
                <h1 style="margin: 0; ${innerStyle}">
                  ${textChild}
                </h1>
              </td>
            </tr>`;
      }
      case 'text': {
        const paragraphs = el.content.split('\n\n');
        const innerStyle = getInnerTextStyles(el);
        
        const pt = (el.styles.paddingTop ?? 0) + (el.styles.marginTop ?? 0);
        const pb = (el.styles.paddingBottom ?? 0) + (el.styles.marginBottom ?? 0);
        const pl = (el.styles.paddingLeft ?? 0) + (el.styles.marginLeft ?? 0);
        const pr = (el.styles.paddingRight ?? 0) + (el.styles.marginRight ?? 0);
        
        const bgStyle = el.styles.backgroundColor ? `background-color: ${el.styles.backgroundColor};` : '';
        const borderAndRadius = getBorderAndRadiusStyles(el);

        const paragraphsHtml = paragraphs.map((p, index) => {
          const textChild = formatTextForHtml(p);
          const pMarginBottom = index < paragraphs.length - 1 ? 12 : 0;
          return `<p style="margin: 0 0 ${pMarginBottom}px 0; ${innerStyle}">${textChild}</p>`;
        }).join('\n');

        return `            <!-- Text Block -->
            <tr>
              <td style="padding-top: ${pt}px; padding-bottom: ${pb}px; padding-left: ${pl}px; padding-right: ${pr}px; margin: 0;${bgStyle ? ' ' + bgStyle : ''}${borderAndRadius ? ' ' + borderAndRadius + ';' : ''}"${alignAttr}>
                ${paragraphsHtml}
              </td>
            </tr>`;
      }
      case 'button': {
        const textChild = formatTextForHtml(el.content);
        const alignment = el.styles.align || 'center';
        
        let buttonBgColor = el.styles.backgroundColor || '#2563eb';
        let buttonTextColor = el.styles.textColor || '#ffffff';
        
        // Evaluate visual identity rules for button
        const visualIdentity = template.visualIdentity;
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
                buttonBgColor = rule.colorIfTrue;
              } else {
                buttonBgColor = rule.colorIfFalse;
              }
            }
          }
        }
        
        const pt = el.styles.marginTop ?? 0;
        const pb = el.styles.marginBottom ?? 16;
        const pl = el.styles.marginLeft ?? 0;
        const pr = el.styles.marginRight ?? 0;
        
        return `            <!-- Button -->
            <tr>
              <td align="${alignment}" style="padding-top: ${pt}px; padding-bottom: ${pb}px; padding-left: ${pl}px; padding-right: ${pr}px; margin: 0;">
                <table border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center" style="margin: 0;">
                      <a href="${el.href || '#'}" target="_blank" style="display: inline-block; font-family: ${globalStyles.fontFamily || 'system-ui, -apple-system, sans-serif'}; font-size: ${el.styles.fontSize || 16}px; font-weight: ${el.styles.fontWeight || 'semibold'}; color: ${buttonTextColor}; background-color: ${buttonBgColor}; text-decoration: none; ${getBorderAndRadiusStyles(el)}; padding-top: ${el.styles.paddingTop ?? 12}px; padding-bottom: ${el.styles.paddingBottom ?? 12}px; padding-left: ${el.styles.paddingLeft ?? 24}px; padding-right: ${el.styles.paddingRight ?? 24}px;">
                        ${textChild}
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`;
      }
      case 'image': {
        const borderAndRadius = getBorderAndRadiusStyles(el);
        const widthVal = el.styles.width ? `${el.styles.width}` : '500';
        const heightVal = el.styles.height ? ` height="${el.styles.height}"` : '';
        const alignment = el.styles.align || 'center';

        const pt = (el.styles.paddingTop ?? 0) + (el.styles.marginTop ?? 0);
        const pb = (el.styles.paddingBottom ?? 0) + (el.styles.marginBottom ?? 0);
        const pl = (el.styles.paddingLeft ?? 0) + (el.styles.marginLeft ?? 0);
        const pr = (el.styles.paddingRight ?? 0) + (el.styles.marginRight ?? 0);

        const borderStyleVal = borderAndRadius ? borderAndRadius : 'border: 0;';
        const baseImg = `<img src="${el.src || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop'}" alt="${el.alt || 'Image'}" width="${widthVal}"${heightVal} style="display: block; max-width: 100%; ${borderStyleVal}" />`;

        return `            <!-- Image -->
            <tr>
              <td align="${alignment}" style="padding-top: ${pt}px; padding-bottom: ${pb}px; padding-left: ${pl}px; padding-right: ${pr}px; margin: 0;">
                ${el.href ? `<a href="${el.href}" target="_blank" style="display: block; text-decoration: none;">${baseImg}</a>` : baseImg}
              </td>
            </tr>`;
      }
      case 'link': {
        const textChild = formatTextForHtml(el.content);
        const pt = (el.styles.paddingTop ?? 0) + (el.styles.marginTop ?? 0);
        const pb = (el.styles.paddingBottom ?? 0) + (el.styles.marginBottom ?? 0);
        const pl = (el.styles.paddingLeft ?? 0) + (el.styles.marginLeft ?? 0);
        const pr = (el.styles.paddingRight ?? 0) + (el.styles.marginRight ?? 0);

        return `            <!-- Link -->
            <tr>
              <td style="padding-top: ${pt}px; padding-bottom: ${pb}px; padding-left: ${pl}px; padding-right: ${pr}px; margin: 0;"${alignAttr}>
                <a href="${el.href || '#'}" target="_blank" style="font-family: ${globalStyles.fontFamily || 'system-ui, -apple-system, sans-serif'}; font-size: ${el.styles.fontSize || 14}px; color: ${el.styles.textColor || '#2563eb'}; text-decoration: underline;">
                  ${textChild}
                </a>
              </td>
            </tr>`;
      }
      case 'divider': {
        const bColor = el.styles.borderColor || '#e2e8f0';
        const bWidth = el.styles.borderWidth || 1;
        const mt = el.styles.marginTop !== undefined ? el.styles.marginTop : 12;
        const mb = el.styles.marginBottom !== undefined ? el.styles.marginBottom : 20;
        const ml = el.styles.marginLeft !== undefined ? el.styles.marginLeft : 0;
        const mr = el.styles.marginRight !== undefined ? el.styles.marginRight : 0;
        
        return `            <!-- Divider -->
            <tr>
              <td style="padding-top: ${mt}px; padding-bottom: ${mb}px; padding-left: ${ml}px; padding-right: ${mr}px; margin: 0;">
                <table border="0" cellspacing="0" cellpadding="0" width="100%">
                  <tr>
                    <td style="border-top: ${bWidth}px solid ${bColor}; font-size: 0; line-height: 0;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>`;
      }
      case 'spacer': {
        const height = el.styles.height || 24;
        return `            <!-- Spacer -->
            <tr>
              <td style="font-size: 0; line-height: 0; height: ${height}px; padding: 0; margin: 0;">&nbsp;</td>
            </tr>`;
      }
      case 'container': {
        const childrenHtml = (el.children || []).map(child => compileElementToHtml(child)).join('\n');
        const containerBg = el.styles.backgroundColor ? `background-color: ${el.styles.backgroundColor};` : '';
        const containerPadding = `padding-top: ${el.styles.paddingTop ?? 16}px; padding-bottom: ${el.styles.paddingBottom ?? 16}px; padding-left: ${el.styles.paddingLeft ?? 16}px; padding-right: ${el.styles.paddingRight ?? 16}px;`;
        const borderAndRadius = getBorderAndRadiusStyles(el);
        const hasRadius = borderAndRadius.includes('border-radius');
        const tableBorderCollapse = hasRadius ? 'separate' : 'collapse';
        
        const mt = el.styles.marginTop ?? 0;
        const mb = el.styles.marginBottom ?? 16;
        const ml = el.styles.marginLeft ?? 0;
        const mr = el.styles.marginRight ?? 0;

        return `            <!-- Container -->
            <tr>
              <td style="padding-top: ${mt}px; padding-bottom: ${mb}px; padding-left: ${ml}px; padding-right: ${mr}px; margin: 0;">
                <table border="0" cellspacing="0" cellpadding="0" width="100%" style="width: 100%; border-collapse: ${tableBorderCollapse}; ${containerBg} ${borderAndRadius} ${containerPadding}">
                  ${childrenHtml}
                </table>
              </td>
            </tr>`;
      }
      case 'grid': {
        const rows = el.rowsCount || 1;
        const cols = el.colsCount || 2;
        const gridCells = el.gridCells || {};
        
        const gridBg = el.styles.backgroundColor ? `background-color: ${el.styles.backgroundColor};` : '';
        const gridPadding = `padding-top: ${el.styles.paddingTop ?? 8}px; padding-bottom: ${el.styles.paddingBottom ?? 8}px; padding-left: ${el.styles.paddingLeft ?? 8}px; padding-right: ${el.styles.paddingRight ?? 8}px;`;
        const borderAndRadius = getBorderAndRadiusStyles(el);
        const hasRadius = borderAndRadius.includes('border-radius');
        const tableBorderCollapse = hasRadius ? 'separate' : 'collapse';
        
        const mt = el.styles.marginTop ?? 0;
        const mb = el.styles.marginBottom ?? 16;
        const ml = el.styles.marginLeft ?? 0;
        const mr = el.styles.marginRight ?? 0;

        let gridRowsHtml = '';
        for (let r = 0; r < rows; r++) {
          gridRowsHtml += `                  <tr>\n`;
          for (let c = 0; c < cols; c++) {
            const cellKey = `${r}-${c}`;
            const cellElements = gridCells[cellKey] || [];
            const cellContentHtml = cellElements.map(child => compileElementToHtml(child)).join('\n');
            const colWidthPercent = Math.round(100 / cols);
            gridRowsHtml += `                    <td valign="top" width="${colWidthPercent}%" style="padding: 8px; width: ${colWidthPercent}%;">
                      <table border="0" cellspacing="0" cellpadding="0" width="100%" style="width: 100%;">
                        ${cellContentHtml}
                      </table>
                    </td>\n`;
          }
          gridRowsHtml += `                  </tr>\n`;
        }

        return `            <!-- Grid -->
            <tr>
              <td style="padding-top: ${mt}px; padding-bottom: ${mb}px; padding-left: ${ml}px; padding-right: ${mr}px; margin: 0;">
                <table border="0" cellspacing="0" cellpadding="0" width="100%" style="width: 100%; table-layout: fixed; border-collapse: ${tableBorderCollapse}; ${gridBg} ${borderAndRadius} ${gridPadding}">
                  ${gridRowsHtml}
                </table>
              </td>
            </tr>`;
      }
      default:
        return '';
    }
  };

  const elementsHtml = elements.map((el) => compileElementToHtml(el)).join('\n\n');

  const widthLimitStyle = globalStyles.hasWidthLimit !== false ? `max-width: ${globalStyles.bodyWidth || 600}px;` : 'width: 100%;';
  const alignStyle = globalStyles.bodyAlignment === 'left' ? 'margin-right: auto; margin-left: 0;' : globalStyles.bodyAlignment === 'right' ? 'margin-left: auto; margin-right: 0;' : 'margin-left: auto; margin-right: auto;';
  const marginStyle = `margin-top: ${globalStyles.bodyMarginTop ?? 40}px; margin-bottom: ${globalStyles.bodyMarginBottom ?? 40}px;`;
  const alignAttrVal = globalStyles.bodyAlignment || 'center';

  const googleFontsLink = globalStyles.fontFamily && globalStyles.fontFamily.includes('Inter')
    ? '  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">\n'
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Email Template</title>
  ${googleFontsLink}<!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
  </style>
</head>
<body style="background-color: ${globalStyles.backgroundColor}; margin: 0; padding: 40px 0; font-family: ${globalStyles.fontFamily};">
  <center>
    <!-- Main Email Container table -->
    <table border="0" align="${alignAttrVal}" cellspacing="0" cellpadding="0" width="100%" style="${widthLimitStyle} background-color: ${globalStyles.containerColor}; border-radius: ${globalStyles.borderRadius}px; border: 1px solid #eaeaea; border-collapse: separate; color: ${globalStyles.textColor}; font-family: ${globalStyles.fontFamily}; text-align: left; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); ${marginStyle} ${alignStyle}">
      <tr>
        <td style="padding: ${globalStyles.padding}px;">
          <table border="0" cellspacing="0" cellpadding="0" width="100%" style="width: 100%;">
            ${elementsHtml}
          </table>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`;
}

// Preset designs for faster creation
export const DEFAULT_TEMPLATES: EmailTemplate[] = [
{
    id: 'empresarial_relatorio',
    name: 'Relatório Corporativo Trimestral 📊',
    globalStyles: {
      backgroundColor: '#f8fafc',
      containerColor: '#ffffff',
      textColor: '#334155',
      fontFamily: 'Inter, sans-serif',
      borderRadius: 12,
      padding: 40
    },
    variables: [
      { id: 'emp1', key: 'directorName', value: 'Ana Souza', description: 'Nome do Diretor/Gestor destinatário' },
      { id: 'emp2', key: 'quarterPeriod', value: 'Q2 2026', description: 'Período do relatório' },
      { id: 'emp3', key: 'growthRate', value: '24.5%', description: 'Taxa de crescimento atingida' }
    ],
    elements: [
      {
        id: 'emp_heading',
        type: 'heading',
        content: 'Resultados Consolidados: {{quarterPeriod}} 📈',
        styles: {
          fontSize: 24,
          fontWeight: 'bold',
          textColor: '#0f172a',
          align: 'left',
          marginBottom: 16
        }
      },
      {
        id: 'emp_img_growth_top',
        type: 'image',
        content: '',
        src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
        alt: 'Business Intelligence and Charts',
        styles: {
          width: 536,
          height: 160,
          borderRadius: 8,
          marginBottom: 20,
          align: 'center'
        }
      },
      {
        id: 'emp_intro',
        type: 'text',
        content: `Prezada {{directorName}},

Temos o prazer de compartilhar os resultados financeiros e operacionais consolidados relativos ao período de **{{quarterPeriod}}**.

Nosso desempenho superou as expectativas iniciais, registrando um crescimento expressivo de **{{growthRate}}** em relação ao trimestre anterior. Este resultado foi impulsionado pela otimização das campanhas digitais e pelo aumento de retenção de clientes recorrentes.`,
        styles: {
          fontSize: 14,
          textColor: '#334155',
          align: 'left',
          marginBottom: 20
        }
      },
      {
        id: 'emp_grid',
        type: 'grid',
        content: '',
        styles: {
          marginBottom: 24
        },
        rowsCount: 1,
        colsCount: 2,
        gridCells: {
          '0-0': [
            {
              id: 'emp_grid_h1',
              type: 'heading',
              content: 'Faturamento Trimestral 💵',
              styles: {
                fontSize: 14,
                fontWeight: 'bold',
                textColor: '#1e3a8a',
                marginBottom: 6
              }
            },
            {
              id: 'emp_grid_t1',
              type: 'text',
              content: 'Atingimos a marca de **R$ 2.4M** líquidos, representando um aumento real de receita recorrente anualizada (ARR).',
              styles: {
                fontSize: 12,
                textColor: '#475569',
                marginBottom: 10
              }
            },
            {
              id: 'emp_grid_img1',
              type: 'image',
              content: '',
              src: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=200&auto=format&fit=crop',
              alt: 'Sales Growth',
              styles: {
                width: 120,
                height: 60,
                borderRadius: 4,
                align: 'left'
              }
            }
          ],
          '0-1': [
            {
              id: 'emp_grid_h2',
              type: 'heading',
              content: 'Retenção & LTV 👥',
              styles: {
                fontSize: 14,
                fontWeight: 'bold',
                textColor: '#1e3a8a',
                marginBottom: 6
              }
            },
            {
              id: 'emp_grid_t2',
              type: 'text',
              content: 'A taxa de churn reduziu para **1.8%**, mantendo o Net Revenue Retention (NRR) em impressionantes **112%**.',
              styles: {
                fontSize: 12,
                textColor: '#475569',
                marginBottom: 10
              }
            },
            {
              id: 'emp_grid_img2',
              type: 'image',
              content: '',
              src: 'https://images.unsplash.com/photo-1552581230-c01bc0d48403?w=200&auto=format&fit=crop',
              alt: 'Retention Team',
              styles: {
                width: 120,
                height: 60,
                borderRadius: 4,
                align: 'left'
              }
            }
          ]
        }
      },
      {
        id: 'emp_divider',
        type: 'divider',
        content: '',
        styles: {
          borderColor: '#e2e8f0',
          borderWidth: 1,
          marginBottom: 20,
          marginTop: 10
        }
      },
      {
        id: 'emp_btn',
        type: 'button',
        content: 'Acessar Dashboard Completo 💻',
        href: '#',
        styles: {
          backgroundColor: '#0f172a',
          textColor: '#ffffff',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 'bold',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          align: 'center',
          marginBottom: 20
        }
      },
      {
        id: 'emp_outro',
        type: 'text',
        content: 'Caso tenha dúvidas sobre a consolidação dos dados ou necessite de análises adicionais por departamento, nossa equipe de Business Intelligence está à total disposição.',
        styles: {
          fontSize: 13,
          textColor: '#64748b',
          align: 'left',
          marginBottom: 0
        }
      }
    ],
    visualIdentity: {
      brandColors: [
        { id: 'bc_emp1', name: 'Azul Corporativo', value: '#1e3a8a' },
        { id: 'bc_emp2', name: 'Grafite Escuro', value: '#0f172a' },
        { id: 'bc_emp3', name: 'Fundo Neutro', value: '#f8fafc' }
      ],
      colorRules: [],
      signatureName: 'Roberto Vasconcelos',
      signatureRole: 'CFO & Diretor de Operações',
      signatureCompany: 'Nexus Analytics SA',
      signaturePhone: '+55 (11) 4004-9900',
      signatureColor: '#1e3a8a'
    }
  },
{
    id: 'casual_evento',
    name: 'Convite para Encontro Casual 🍕',
    globalStyles: {
      backgroundColor: '#fef3c7',
      containerColor: '#ffffff',
      textColor: '#78350f',
      fontFamily: 'system-ui, sans-serif',
      borderRadius: 24,
      padding: 32
    },
    variables: [
      { id: 'cas1', key: 'friendName', value: 'Thiago', description: 'Nome do amigo ou membro convidado' },
      { id: 'cas2', key: 'eventTime', value: 'Sexta-feira às 19h', description: 'Data e hora do encontro' },
      { id: 'cas3', key: 'location', value: 'Pizzaria Bella Itália', description: 'Local do encontro' }
    ],
    elements: [
      {
        id: 'cas_img',
        type: 'image',
        content: '',
        src: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
        alt: 'Pizza and Friends',
        styles: {
          width: 536,
          height: 180,
          borderRadius: 16,
          marginBottom: 20,
          align: 'center'
        }
      },
      {
        id: 'cas_heading',
        type: 'heading',
        content: 'Fala, {{friendName}}! Tudo certo? 🙌',
        styles: {
          fontSize: 24,
          fontWeight: 'bold',
          textColor: '#78350f',
          align: 'center',
          marginBottom: 12
        }
      },
      {
        id: 'cas_text',
        type: 'text',
        content: `Está na hora daquele nosso reencontro para jogar conversa fora, dar boas risadas e, claro, comer muita pizza!

Combinamos de nos reunir nesta **{{eventTime}}** lá na **{{location}}**.`,
        styles: {
          fontSize: 14,
          textColor: '#92400e',
          align: 'center',
          marginBottom: 20
        }
      },
      {
        id: 'cas_grid_details',
        type: 'grid',
        content: '',
        styles: {
          marginBottom: 20
        },
        rowsCount: 1,
        colsCount: 2,
        gridCells: {
          '0-0': [
            {
              id: 'cas_grid_h1',
              type: 'heading',
              content: 'Cardápio Especial 🍕',
              styles: {
                fontSize: 14,
                fontWeight: 'bold',
                textColor: '#d97706',
                marginBottom: 4
              }
            },
            {
              id: 'cas_grid_t1',
              type: 'text',
              content: 'Mais de 20 sabores salgados e doces assados no forno a lenha, com opções vegetarianas incríveis!',
              styles: {
                fontSize: 11,
                textColor: '#78350f',
                marginBottom: 10
              }
            },
            {
              id: 'cas_grid_img_pizza',
              type: 'image',
              content: '',
              src: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=120&auto=format&fit=crop',
              alt: 'Hot pizza slice',
              styles: {
                width: 100,
                height: 60,
                borderRadius: 8,
                align: 'center'
              }
            }
          ],
          '0-1': [
            {
              id: 'cas_grid_h2',
              type: 'heading',
              content: 'Drinks & Beer 🍻',
              styles: {
                fontSize: 14,
                fontWeight: 'bold',
                textColor: '#d97706',
                marginBottom: 4
              }
            },
            {
              id: 'cas_grid_t2',
              type: 'text',
              content: 'Chopp artesanal trincando de gelado, refrigerantes liberados e sodas italianas exclusivas para nós.',
              styles: {
                fontSize: 11,
                textColor: '#78350f',
                marginBottom: 10
              }
            },
            {
              id: 'cas_grid_img_drinks',
              type: 'image',
              content: '',
              src: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=120&auto=format&fit=crop',
              alt: 'Fresh drinks',
              styles: {
                width: 100,
                height: 60,
                borderRadius: 8,
                align: 'center'
              }
            }
          ]
        }
      },
      {
        id: 'cas_img_gathering',
        type: 'image',
        content: '',
        src: 'https://images.unsplash.com/photo-1543807535-eceef0bc6599?w=600&auto=format&fit=crop&q=80',
        alt: 'Friends laughing around a table',
        styles: {
          width: 536,
          height: 180,
          borderRadius: 16,
          marginBottom: 20,
          align: 'center'
        }
      },
      {
        id: 'cas_text_invite',
        type: 'text',
        content: 'Confirme sua presença até quinta-feira de manhã para podermos reservar a mesa grande nos fundos perto da lareira!',
        styles: {
          fontSize: 13,
          textColor: '#b45309',
          align: 'center',
          marginBottom: 20
        }
      },
      {
        id: 'cas_btn',
        type: 'button',
        content: 'Confirmar Minha Presença! ✔️',
        href: '#',
        styles: {
          backgroundColor: '#d97706',
          textColor: '#ffffff',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 'bold',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          align: 'center',
          marginBottom: 0
        }
      }
    ],
    visualIdentity: {
      brandColors: [
        { id: 'bc_cas1', name: 'Laranja Quente', value: '#d97706' },
        { id: 'bc_cas2', name: 'Marrom Café', value: '#78350f' },
        { id: 'bc_cas3', name: 'Amarelo Suave', value: '#fef3c7' }
      ],
      colorRules: [],
      signatureName: 'Roberto Vasconcelos',
      signatureRole: 'CFO & Diretor de Operações',
      signatureCompany: 'Nexus Analytics SA',
      signaturePhone: '+55 (11) 4004-9900',
      signatureColor: '#1e3a8a'
    }
  },
{
    id: 'comercial_oferta',
    name: 'Lançamento & Oferta Exclusiva 🛍️',
    globalStyles: {
      backgroundColor: '#faf5ff',
      containerColor: '#ffffff',
      textColor: '#1f1e24',
      fontFamily: 'Inter, sans-serif',
      borderRadius: 16,
      padding: 36
    },
    variables: [
      { id: 'com1', key: 'customerName', value: 'Mariana', description: 'Nome do cliente' },
      { id: 'com2', key: 'discountVal', value: '20% OFF', description: 'Cupom de desconto especial' },
      { id: 'com3', key: 'productName', value: 'Smart Watch Aura 3', description: 'Nome do produto em destaque' }
    ],
    elements: [
      {
        id: 'com_img',
        type: 'image',
        content: '',
        src: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&auto=format&fit=crop&q=80',
        alt: 'Smart Watch Product',
        styles: {
          width: 536,
          height: 180,
          borderRadius: 12,
          marginBottom: 24,
          align: 'center'
        }
      },
      {
        id: 'com_heading',
        type: 'heading',
        content: 'Seu acesso antecipado chegou, {{customerName}}! ✨',
        styles: {
          fontSize: 24,
          fontWeight: 'bold',
          textColor: '#581c87',
          align: 'center',
          marginBottom: 16
        }
      },
      {
        id: 'com_text',
        type: 'text',
        content: `Prepare-se para conhecer o futuro em seu pulso. O novo **{{productName}}** acaba de ser apresentado e você tem o privilégio de adquiri-lo antes de todo mundo.

E tem mais: como agradecimento por ser nossa cliente vip, use o botão abaixo para garantir sua compra com **{{discountVal}}** e frete grátis apenas nas próximas 24 horas.`,
        styles: {
          fontSize: 15,
          textColor: '#3b0764',
          align: 'center',
          marginBottom: 20
        }
      },
      {
        id: 'com_grid_features',
        type: 'grid',
        content: '',
        styles: {
          marginBottom: 20
        },
        rowsCount: 1,
        colsCount: 2,
        gridCells: {
          '0-0': [
            {
              id: 'com_grid_h1',
              type: 'heading',
              content: 'Bateria de Longa Duração 🔋',
              styles: {
                fontSize: 13,
                fontWeight: 'bold',
                textColor: '#7c3aed',
                marginBottom: 4
              }
            },
            {
              id: 'com_grid_t1',
              type: 'text',
              content: 'Até **14 dias** de autonomia real com uso contínuo de monitoramento inteligente.',
              styles: {
                fontSize: 11,
                textColor: '#581c87',
                marginBottom: 10
              }
            },
            {
              id: 'com_grid_img_battery',
              type: 'image',
              content: '',
              src: 'https://images.unsplash.com/photo-1584438784894-089d6a128f3e?w=120&auto=format&fit=crop',
              alt: 'Battery charging',
              styles: {
                width: 120,
                height: 60,
                borderRadius: 4,
                align: 'center'
              }
            }
          ],
          '0-1': [
            {
              id: 'com_grid_h2',
              type: 'heading',
              content: "À Prova D'Água 5ATM 🌊",
              styles: {
                fontSize: 13,
                fontWeight: 'bold',
                textColor: '#7c3aed',
                marginBottom: 4
              }
            },
            {
              id: 'com_grid_t2',
              type: 'text',
              content: 'Resistência extrema para natação livre, chuvas fortes e mergulhos de até 50 metros.',
              styles: {
                fontSize: 11,
                textColor: '#581c87',
                marginBottom: 10
              }
            },
            {
              id: 'com_grid_img_water',
              type: 'image',
              content: '',
              src: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop',
              alt: 'Splashing water',
              styles: {
                width: 120,
                height: 60,
                borderRadius: 4,
                align: 'center'
              }
            }
          ]
        }
      },
      {
        id: 'com_divider',
        type: 'divider',
        content: '',
        styles: {
          borderColor: '#f3e8ff',
          borderWidth: 1,
          marginBottom: 20
        }
      },
      {
        id: 'com_subheading_editions',
        type: 'heading',
        content: 'Escolha a sua Edição Exclusiva:',
        styles: {
          fontSize: 16,
          fontWeight: 'bold',
          textColor: '#581c87',
          align: 'center',
          marginBottom: 15
        }
      },
      {
        id: 'com_grid_options',
        type: 'grid',
        content: '',
        styles: {
          marginBottom: 25
        },
        rowsCount: 1,
        colsCount: 2,
        gridCells: {
          '0-0': [
            {
              id: 'com_opt_img_black',
              type: 'image',
              content: '',
              src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop',
              alt: 'Classic Black Edition',
              styles: {
                width: 140,
                height: 100,
                borderRadius: 8,
                align: 'center',
                marginBottom: 10
              }
            },
            {
              id: 'com_opt_h_black',
              type: 'heading',
              content: 'Preto Clássico Space 🖤',
              styles: {
                fontSize: 12,
                fontWeight: 'bold',
                textColor: '#1f1e24',
                align: 'center',
                marginBottom: 4
              }
            },
            {
              id: 'com_opt_t_black',
              type: 'text',
              content: 'Corpo em titânio escovado com pulseira esportiva ultra leve.',
              styles: {
                fontSize: 10,
                textColor: '#6b7280',
                align: 'center'
              }
            }
          ],
          '0-1': [
            {
              id: 'com_opt_img_gold',
              type: 'image',
              content: '',
              src: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=200&auto=format&fit=crop',
              alt: 'Luxury Rose Gold Edition',
              styles: {
                width: 140,
                height: 100,
                borderRadius: 8,
                align: 'center',
                marginBottom: 10
              }
            },
            {
              id: 'com_opt_h_gold',
              type: 'heading',
              content: 'Rose Gold Premium 💖',
              styles: {
                fontSize: 12,
                fontWeight: 'bold',
                textColor: '#1f1e24',
                align: 'center',
                marginBottom: 4
              }
            },
            {
              id: 'com_opt_t_gold',
              type: 'text',
              content: 'Acabamento banhado a ouro rosê com pulseira milanesa em malha de aço.',
              styles: {
                fontSize: 10,
                textColor: '#6b7280',
                align: 'center'
              }
            }
          ]
        }
      },
      {
        id: 'com_btn',
        type: 'button',
        content: 'Garantir Meu Aura 3 com Desconto! 🛒',
        href: '#',
        styles: {
          backgroundColor: '#7c3aed',
          textColor: '#ffffff',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 'bold',
          paddingTop: 14,
          paddingBottom: 14,
          paddingLeft: 28,
          paddingRight: 28,
          align: 'center',
          marginBottom: 0
        }
      }
    ],
    visualIdentity: {
      brandColors: [
        { id: 'bc_com1', name: 'Roxo Elétrico', value: '#7c3aed' },
        { id: 'bc_com2', name: 'Roxo Escuro', value: '#581c87' },
        { id: 'bc_com3', name: 'Rosa Vibrante', value: '#db2777' }
      ],
      colorRules: [],
      signatureName: 'Roberto Vasconcelos',
      signatureRole: 'CFO & Diretor de Operações',
      signatureCompany: 'Nexus Analytics SA',
      signaturePhone: '+55 (11) 4004-9900',
      signatureColor: '#1e3a8a'
    }
  },
{
    id: 'tecnico_update',
    name: 'Atualização de Recursos e SaaS 🚀',
    globalStyles: {
      backgroundColor: '#09090b',
      containerColor: '#18181b',
      textColor: '#e4e4e7',
      fontFamily: 'Courier New, monospace',
      borderRadius: 16,
      padding: 32
    },
    variables: [
      { id: 'tec1', key: 'developerName', value: 'Dev Team', description: 'Identificação da equipe' },
      { id: 'tec2', key: 'versionNumber', value: 'v4.2.0-beta', description: 'Número da versão lançada' }
    ],
    elements: [
      {
        id: 'tec_heading',
        type: 'heading',
        content: 'DEPLOY COMPLETADO: {{versionNumber}} 💻',
        styles: {
          fontSize: 20,
          fontWeight: 'bold',
          textColor: '#22c55e',
          align: 'left',
          marginBottom: 16
        }
      },
      {
        id: 'tec_img_header',
        type: 'image',
        content: '',
        src: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
        alt: 'Abstract lines of code on black computer screen',
        styles: {
          width: 536,
          height: 140,
          borderRadius: 8,
          marginBottom: 20,
          align: 'center'
        }
      },
      {
        id: 'tec_text',
        type: 'text',
        content: `Olá devs,

Nossa equipe de engenharia finalizou com sucesso a implantação da versão **{{versionNumber}}** em nossos clusters de produção.

Principais otimizações desta build:
- Redução de 45% na latência do renderizador de templates
- Suporte nativo a bindings condicionais sem re-render
- Correção de bugs críticos de persistência em cache regional`,
        styles: {
          fontSize: 14,
          textColor: '#a1a1aa',
          align: 'left',
          marginBottom: 24
        }
      },
      {
        id: 'tec_grid_status',
        type: 'grid',
        content: '',
        styles: {
          marginBottom: 24
        },
        rowsCount: 1,
        colsCount: 2,
        gridCells: {
          '0-0': [
            {
              id: 'tec_grid_h1',
              type: 'heading',
              content: 'Engine V2 Online 🟢',
              styles: {
                fontSize: 13,
                fontWeight: 'bold',
                textColor: '#22c55e',
                marginBottom: 4
              }
            },
            {
              id: 'tec_grid_t1',
              type: 'text',
              content: 'A latência de render caiu de 12ms para **3.4ms** nos servidores de borda baseados em Edge Functions.',
              styles: {
                fontSize: 11,
                textColor: '#a1a1aa'
              }
            }
          ],
          '0-1': [
            {
              id: 'tec_grid_h2',
              type: 'heading',
              content: 'SSL & Segurança 🔒',
              styles: {
                fontSize: 13,
                fontWeight: 'bold',
                textColor: '#22c55e',
                marginBottom: 4
              }
            },
            {
              id: 'tec_grid_t2',
              type: 'text',
              content: 'Introdução do TLS 1.3 nativo e criptografia pós-quântica em todas as transações de e-mail transacional.',
              styles: {
                fontSize: 11,
                textColor: '#a1a1aa'
              }
            }
          ]
        }
      },
      {
        id: 'tec_btn',
        type: 'button',
        content: 'Verificar Changelog Completo 🛠️',
        href: '#',
        styles: {
          backgroundColor: '#22c55e',
          textColor: '#09090b',
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 'bold',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 20,
          paddingRight: 20,
          align: 'left',
          marginBottom: 0
        }
      }
    ],
    visualIdentity: {
      brandColors: [
        { id: 'bc_tec1', name: 'Terminal Green', value: '#22c55e' },
        { id: 'bc_tec2', name: 'Dark Gray', value: '#18181b' },
        { id: 'bc_tec3', name: 'Terminal Black', value: '#09090b' }
      ],
      colorRules: [],
      signatureName: 'Roberto Vasconcelos',
      signatureRole: 'CFO & Diretor de Operações',
      signatureCompany: 'Nexus Analytics SA',
      signaturePhone: '+55 (11) 4004-9900',
      signatureColor: '#1e3a8a'
    }
  },{
    id: 'romantic_gabrielle',
    name: 'Corações para Gabrielle ❤️',
    globalStyles: {
      backgroundColor: '#fef2f2',
      containerColor: '#ffffff',
      textColor: '#7f1d1d',
      fontFamily: 'Georgia, serif',
      borderRadius: 20,
      padding: 32
    },
    variables: [
      { id: 'rom1', key: 'userName', value: 'Gabrielle', description: 'Nome do seu amor' },
      { id: 'rom2', key: 'romanticMessage', value: 'Você é a razão de todos os meus sorrisos. Meu coração bate no ritmo do seu! ❤️', description: 'Mensagem romântica especial' }
    ],
    elements: [
      {
        id: 'rom_img',
        type: 'image',
        content: '',
        src: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80',
        alt: 'Love Hearts',
        styles: {
          width: 536,
          height: 240,
          borderRadius: 16,
          marginBottom: 24,
          align: 'center'
        }
      },
      {
        id: 'rom_head',
        type: 'heading',
        content: 'Para o Meu Grande Amor, {{userName}} 🌹',
        styles: {
          fontSize: 26,
          fontWeight: 'bold',
          textColor: '#e11d48',
          align: 'center',
          marginBottom: 16
        }
      },
      {
        id: 'rom_text',
        type: 'text',
        content: 'Oi meu amor,\n\nEstava pensando em você e decidi criar este e-mail especial para lembrar o quanto você é incrível, doce e amada.\n\n{{romanticMessage}}\n\nQue o seu dia seja repleto de flores, sorrisos e doçura. Mal posso esperar para te ver!',
        styles: {
          fontSize: 15,
          textColor: '#9f1239',
          align: 'center',
          marginBottom: 24
        }
      },
      {
        id: 'rom_btn',
        type: 'button',
        content: 'Ver Nossa Surpresa Especial 💖',
        href: '#',
        styles: {
          backgroundColor: '#e11d48',
          textColor: '#ffffff',
          borderRadius: 9999,
          fontSize: 16,
          fontWeight: 'bold',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 28,
          paddingRight: 28,
          align: 'center',
          marginBottom: 24
        }
      },
      {
        id: 'rom_div',
        type: 'divider',
        content: '',
        styles: {
          borderColor: '#fecdd3',
          borderWidth: 2,
          marginBottom: 20,
          marginTop: 12
        }
      },
      {
        id: 'rom_footer',
        type: 'text',
        content: 'Com todo o amor do mundo, eternamente seu. ❤️',
        styles: {
          fontSize: 13,
          textColor: '#be123c',
          align: 'center',
          marginBottom: 0
        }
      }
    ],
    visualIdentity: {
      brandColors: [
        { id: 'bc_rom1', name: 'Vermelho Amor', value: '#e11d48' },
        { id: 'bc_rom2', name: 'Rosa Paixão', value: '#f43f5e' },
        { id: 'bc_rom3', name: 'Rosa Suave', value: '#fff1f2' },
        { id: 'bc_rom4', name: 'Burgundy Elegante', value: '#881337' }
      ],
      colorRules: [],
      signatureName: 'Seu Amor',
      signatureRole: 'Eterno Apaixonado',
      signatureCompany: 'Corações Unidos Ltda.',
      signaturePhone: '+55 (11) 99999-5220',
      signatureColor: '#e11d48'
    }
  },
{
    id: 'news_semanal',
    name: 'Newsletter Semanal Tech Hub 📰',
    globalStyles: {
      backgroundColor: '#f1f5f9',
      containerColor: '#ffffff',
      textColor: '#334155',
      fontFamily: 'Inter, sans-serif',
      borderRadius: 16,
      padding: 32
    },
    variables: [
      { id: 'news1', key: 'subscriberName', value: 'Rodrigo', description: 'Nome do assinante' },
      { id: 'news2', key: 'currentDate', value: 'Julho de 2026', description: 'Mês de envio da newsletter' },
      { id: 'news3', key: 'readTime', value: '5 min', description: 'Tempo médio de leitura' }
    ],
    elements: [
      {
        id: 'news_img',
        type: 'image',
        content: '',
        src: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&auto=format&fit=crop&q=80',
        alt: 'Coding workspace',
        styles: {
          width: 536,
          height: 180,
          borderRadius: 12,
          marginBottom: 20,
          align: 'center'
        }
      },
      {
        id: 'news_heading',
        type: 'heading',
        content: 'Destaques Tech Hub — {{currentDate}} ⚡',
        styles: {
          fontSize: 22,
          fontWeight: 'bold',
          textColor: '#1e3a8a',
          align: 'left',
          marginBottom: 10
        }
      },
      {
        id: 'news_sub',
        type: 'text',
        content: 'Olá, {{subscriberName}}! 👋\n\nTempo estimado de leitura: **{{readTime}}**.\n\nNesta edição, reunimos as principais novidades do ecossistema de desenvolvimento de software, com foco em inteligência artificial generativa e na nova versão estável do React.',
        styles: {
          fontSize: 14,
          textColor: '#475569',
          align: 'left',
          marginBottom: 16
        }
      },
      {
        id: 'news_div',
        type: 'divider',
        content: '',
        styles: {
          borderColor: '#e2e8f0',
          borderWidth: 1,
          marginBottom: 16,
          marginTop: 10
        }
      },
      {
        id: 'news_grid_articles',
        type: 'grid',
        content: '',
        styles: {
          marginBottom: 20
        },
        colsCount: 2,
        gridCells: {
          '0-0': [
            {
              id: 'news_art1_img',
              type: 'image',
              content: '',
              src: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=300&auto=format&fit=crop&q=80',
              alt: 'AI Neural Network illustration',
              styles: {
                width: 250,
                height: 100,
                borderRadius: 8,
                marginBottom: 8,
                align: 'center'
              }
            },
            {
              id: 'news_art1_h',
              type: 'heading',
              content: 'IA no Browser 🧠',
              styles: {
                fontSize: 13,
                fontWeight: 'bold',
                textColor: '#1e3a8a',
                marginBottom: 4
              }
            },
            {
              id: 'news_art1_t',
              type: 'text',
              content: 'Aprenda a otimizar modelos LLM locais utilizando compilações WebAssembly ultra-rápidas.',
              styles: {
                fontSize: 11,
                textColor: '#334155'
              }
            }
          ],
          '0-1': [
            {
              id: 'news_art2_img',
              type: 'image',
              content: '',
              src: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&auto=format&fit=crop&q=80',
              alt: 'React coding code screen',
              styles: {
                width: 250,
                height: 100,
                borderRadius: 8,
                marginBottom: 8,
                align: 'center'
              }
            },
            {
              id: 'news_art2_h',
              type: 'heading',
              content: 'React 19 Hooks ⚛️',
              styles: {
                fontSize: 13,
                fontWeight: 'bold',
                textColor: '#1e3a8a',
                marginBottom: 4
              }
            },
            {
              id: 'news_art2_t',
              type: 'text',
              content: 'Nova arquitetura de componentes assíncronos que prometem carregar páginas até 3x mais rápido.',
              styles: {
                fontSize: 11,
                textColor: '#334155'
              }
            }
          ]
        }
      },
      {
        id: 'news_btn',
        type: 'button',
        content: 'Ler Artigos Completos 📖',
        href: '#',
        styles: {
          backgroundColor: '#2563eb',
          textColor: '#ffffff',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 'bold',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          align: 'center',
          marginBottom: 0
        }
      }
    ],
    visualIdentity: {
      brandColors: [
        { id: 'bc_news1', name: 'Azul Elétrico', value: '#2563eb' },
        { id: 'bc_news2', name: 'Azul Escuro', value: '#1e3a8a' },
        { id: 'bc_news3', name: 'Grafite', value: '#334155' }
      ],
      colorRules: [],
      signatureName: 'Curadores Tech Hub',
      signatureRole: 'Equipe de Tecnologia',
      signatureCompany: 'Tech Hub Newsletters',
      signaturePhone: '+55 (11) 3300-8811',
      signatureColor: '#2563eb'
    }
  },
{
    id: 'welcome_app',
    name: 'Boas-vindas ao InboxFlow! 🚀',
    globalStyles: {
      backgroundColor: '#eff6ff',
      containerColor: '#ffffff',
      textColor: '#1e293b',
      fontFamily: 'Inter, sans-serif',
      borderRadius: 16,
      padding: 32
    },
    variables: [
      { id: 'wel1', key: 'newUserName', value: 'Carlos', description: 'Nome do novo usuário' },
      { id: 'wel2', key: 'supportEmail', value: 'suporte@inboxflow.com', description: 'E-mail de suporte' }
    ],
    elements: [
      {
        id: 'wel_head',
        type: 'heading',
        content: 'Seu design de e-mail nunca mais será o mesmo, {{newUserName}}! 🎉',
        styles: {
          fontSize: 22,
          fontWeight: 'bold',
          textColor: '#1d4ed8',
          align: 'center',
          marginBottom: 16
        }
      },
      {
        id: 'wel_txt1',
        type: 'text',
        content: 'Seja muito bem-vindo ao **InboxFlow**!\n\nNossa missão é dar superpoderes à sua equipe para criar e-mails transacionais e de marketing com agilidade, beleza estética incomparável e conformidade total de código.',
        styles: {
          fontSize: 14,
          textColor: '#334155',
          align: 'center',
          marginBottom: 20
        }
      },
      {
        id: 'wel_div',
        type: 'divider',
        content: '',
        styles: {
          borderColor: '#dbeafe',
          borderWidth: 2,
          marginBottom: 20,
          marginTop: 10
        }
      },
      {
        id: 'wel_steps',
        type: 'text',
        content: '### 👣 Próximos Passos de Integração:\n1. **Ajuste sua Identidade Visual**: Configure as cores da marca e sua assinatura.\n2. **Defina suas Variáveis**: Crie campos para personalizar dinamicamente os envios.\n3. **Exporte e Envie**: Copie o HTML puro otimizado e envie com sua ferramenta favorita.',
        styles: {
          fontSize: 13,
          textColor: '#475569',
          align: 'left',
          marginBottom: 24
        }
      },
      {
        id: 'wel_btn',
        type: 'button',
        content: 'Concluir Configuração do App ⚙️',
        href: '#',
        styles: {
          backgroundColor: '#1d4ed8',
          textColor: '#ffffff',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 'bold',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          align: 'center',
          marginBottom: 16
        }
      },
      {
        id: 'wel_txt2',
        type: 'text',
        content: 'Se tiver dúvidas durante a navegação, basta enviar uma mensagem para nosso time pelo e-mail **{{supportEmail}}**. Estamos aqui para te ajudar!',
        styles: {
          fontSize: 12,
          textColor: '#64748b',
          align: 'center',
          marginBottom: 0
        }
      }
    ],
    visualIdentity: {
      brandColors: [
        { id: 'bc_wel1', name: 'Azul Safira', value: '#1d4ed8' },
        { id: 'bc_wel2', name: 'Azul Céu', value: '#3b82f6' },
        { id: 'bc_wel3', name: 'Fundo Azul', value: '#eff6ff' }
      ],
      colorRules: [],
      signatureName: 'Letícia Menezes',
      signatureRole: 'Head of Customer Success',
      signatureCompany: 'InboxFlow Editor',
      signaturePhone: '+55 (11) 90000-1234',
      signatureColor: '#1d4ed8'
    }
  },
{
    id: 'ecommerce_receipt',
    name: 'Confirmação de Pedido #1092 🛍️',
    globalStyles: {
      backgroundColor: '#f8fafc',
      containerColor: '#ffffff',
      textColor: '#1e293b',
      fontFamily: 'Inter, sans-serif',
      borderRadius: 12,
      padding: 32
    },
    variables: [
      { id: 'rec1', key: 'buyerName', value: 'Marcos Silva', description: 'Nome do comprador' },
      { id: 'rec2', key: 'orderId', value: '#99876-01', description: 'ID do pedido' },
      { id: 'rec3', key: 'totalAmount', value: 'R$ 389,90', description: 'Valor total do pedido' },
      { id: 'rec4', key: 'shippingAddress', value: 'Av. Paulista, 1000 - Bela Vista - São Paulo/SP', description: 'Endereço de entrega' }
    ],
    elements: [
      {
        id: 'rec_head',
        type: 'heading',
        content: 'Seu pedido foi confirmado! 🎉🛍️',
        styles: {
          fontSize: 22,
          fontWeight: 'bold',
          textColor: '#15803d',
          align: 'left',
          marginBottom: 12
        }
      },
      {
        id: 'rec_txt',
        type: 'text',
        content: 'Olá, {{buyerName}}!\n\nEstamos muito felizes com a sua compra! Seu pagamento foi processado com sucesso e seu pedido **{{orderId}}** já entrou em nossa linha de separação e embalagem.',
        styles: {
          fontSize: 14,
          textColor: '#334155',
          align: 'left',
          marginBottom: 16
        }
      },
      {
        id: 'rec_div1',
        type: 'divider',
        content: '',
        styles: {
          borderColor: '#e2e8f0',
          borderWidth: 1,
          marginBottom: 16,
          marginTop: 10
        }
      },
      {
        id: 'rec_details',
        type: 'text',
        content: '### 📦 Resumo da Entrega:\n- **Destino:** {{shippingAddress}}\n- **Valor Pago:** {{totalAmount}}\n- **Prazo de Envio:** Até 2 dias úteis',
        styles: {
          fontSize: 13,
          textColor: '#475569',
          align: 'left',
          marginBottom: 20
        }
      },
      {
        id: 'rec_btn',
        type: 'button',
        content: 'Rastrear Meu Pedido 🚚',
        href: '#',
        styles: {
          backgroundColor: '#15803d',
          textColor: '#ffffff',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 'bold',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          align: 'center',
          marginBottom: 0
        }
      }
    ],
    visualIdentity: {
      brandColors: [
        { id: 'bc_rec1', name: 'Verde Sucesso', value: '#15803d' },
        { id: 'bc_rec2', name: 'Cinza Ardósia', value: '#1e293b' },
        { id: 'bc_rec3', name: 'Esmeralda', value: '#059669' }
      ],
      colorRules: [],
      signatureName: 'Expedição & Logística',
      signatureRole: 'Suporte de Vendas',
      signatureCompany: 'Mega E-Store S/A',
      signaturePhone: '+55 (11) 4004-8899',
      signatureColor: '#15803d'
    }
  },
{
    id: 'abandoned_cart',
    name: 'Seu carrinho te espera! 🛒',
    globalStyles: {
      backgroundColor: '#fffbeb',
      containerColor: '#ffffff',
      textColor: '#451a03',
      fontFamily: 'system-ui, sans-serif',
      borderRadius: 16,
      padding: 32
    },
    variables: [
      { id: 'cart1', key: 'customerFirstName', value: 'Juliana', description: 'Nome do cliente' },
      { id: 'cart2', key: 'discountCoupon', value: 'VOLTA15', description: 'Cupom de desconto especial' }
    ],
    elements: [
      {
        id: 'cart_img',
        type: 'image',
        content: '',
        src: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
        alt: 'Fruit cart shopping',
        styles: {
          width: 536,
          height: 180,
          borderRadius: 12,
          marginBottom: 20,
          align: 'center'
        }
      },
      {
        id: 'cart_heading',
        type: 'heading',
        content: 'Seus produtos estão te esperando, {{customerFirstName}}! ⏰',
        styles: {
          fontSize: 22,
          fontWeight: 'bold',
          textColor: '#b45309',
          align: 'center',
          marginBottom: 12
        }
      },
      {
        id: 'cart_text',
        type: 'text',
        content: 'Notamos que você adicionou itens incríveis ao seu carrinho, mas acabou não finalizando a compra.\n\nPara te dar aquele empurrãozinho especial, liberamos um cupom de **15% de desconto extra** com frete grátis apenas para as próximas 3 horas. Use o cupom **{{discountCoupon}}** ou simplesmente clique no botão abaixo:',
        styles: {
          fontSize: 14,
          textColor: '#78350f',
          align: 'center',
          marginBottom: 20
        }
      },
      {
        id: 'cart_btn',
        type: 'button',
        content: 'Recuperar Meu Carrinho e Comprar 🛒',
        href: '#',
        styles: {
          backgroundColor: '#d97706',
          textColor: '#ffffff',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 'bold',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          align: 'center',
          marginBottom: 0
        }
      }
    ],
    visualIdentity: {
      brandColors: [
        { id: 'bc_cart1', name: 'Laranja Quente', value: '#d97706' },
        { id: 'bc_cart2', name: 'Marrom Ouro', value: '#b45309' },
        { id: 'bc_cart3', name: 'Amarelo Suave', value: '#fffbeb' }
      ],
      colorRules: [],
      signatureName: 'Felipe Martins',
      signatureRole: 'Gerente de Fidelização',
      signatureCompany: 'Vendas E-commerce',
      signaturePhone: '+55 (11) 97777-5555',
      signatureColor: '#d97706'
    }
  },
{
    id: 'customer_nps',
    name: 'Como foi sua experiência? ⭐',
    globalStyles: {
      backgroundColor: '#fcf6ff',
      containerColor: '#ffffff',
      textColor: '#2e1065',
      fontFamily: 'Inter, sans-serif',
      borderRadius: 16,
      padding: 36
    },
    variables: [
      { id: 'nps1', key: 'clientName', value: 'Renata', description: 'Nome da cliente' },
      { id: 'nps2', key: 'serviceType', value: 'suporte técnico', description: 'Serviço prestado' }
    ],
    elements: [
      {
        id: 'nps_head',
        type: 'heading',
        content: 'Sua opinião é fundamental para nós, {{clientName}}! 🌟',
        styles: {
          fontSize: 22,
          fontWeight: 'bold',
          textColor: '#5b21b6',
          align: 'center',
          marginBottom: 16
        }
      },
      {
        id: 'nps_txt',
        type: 'text',
        content: 'Olá, {{clientName}}!\n\nRecentemente você utilizou o nosso serviço de **{{serviceType}}**.\n\nQueremos saber como foi sua experiência para continuarmos melhorando nossos processos de atendimento e entrega. Leva menos de 1 minuto para responder:',
        styles: {
          fontSize: 14,
          textColor: '#4c1d95',
          align: 'center',
          marginBottom: 24
        }
      },
      {
        id: 'nps_btn',
        type: 'button',
        content: 'Responder Pesquisa Rápida ⭐',
        href: '#',
        styles: {
          backgroundColor: '#7c3aed',
          textColor: '#ffffff',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 'bold',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          align: 'center',
          marginBottom: 0
        }
      }
    ],
    visualIdentity: {
      brandColors: [
        { id: 'bc_nps1', name: 'Roxo Puro', value: '#7c3aed' },
        { id: 'bc_nps2', name: 'Roxo Escuro', value: '#5b21b6' },
        { id: 'bc_nps3', name: 'Lavanda', value: '#fcf6ff' }
      ],
      colorRules: [],
      signatureName: 'Equipe de Qualidade',
      signatureRole: 'Customer Experience Manager',
      signatureCompany: 'SaaS Solutions Corp',
      signaturePhone: '+55 (11) 4005-5500',
      signatureColor: '#7c3aed'
    }
  },
{
    id: 'webinar_invite',
    name: 'Convite: Masterclass de Design e UI 🎨',
    globalStyles: {
      backgroundColor: '#fafafa',
      containerColor: '#171717',
      textColor: '#e5e5e5',
      fontFamily: 'Inter, sans-serif',
      borderRadius: 16,
      padding: 32
    },
    variables: [
      { id: 'web1', key: 'registrantName', value: 'Patrícia', description: 'Nome do convidado' },
      { id: 'web2', key: 'webinarTime', value: 'Quinta-feira às 20h', description: 'Dia e hora do webinar' },
      { id: 'web3', key: 'speakerName', value: 'Marcus Vinicius (Lead UI Designer)', description: 'Nome do palestrante' }
    ],
    elements: [
      {
        id: 'web_img',
        type: 'image',
        content: '',
        src: 'https://images.unsplash.com/photo-1541462608141-2ff01dd0385c?w=600&auto=format&fit=crop&q=80',
        alt: 'UI Design software screen',
        styles: {
          width: 536,
          height: 180,
          borderRadius: 12,
          marginBottom: 20,
          align: 'center'
        }
      },
      {
        id: 'web_head',
        type: 'heading',
        content: 'Sua vaga está pré-reservada, {{registrantName}}! 🎨💡',
        styles: {
          fontSize: 22,
          fontWeight: 'bold',
          textColor: '#f59e0b',
          align: 'left',
          marginBottom: 12
        }
      },
      {
        id: 'web_text',
        type: 'text',
        content: 'Temos o prazer de te convidar para nossa próxima **Masterclass Exclusiva sobre Design System e Layouts Responsivos**.\n\n- **Quando:** {{webinarTime}}\n- **Com quem:** {{speakerName}}\n\nNesta aula prática, vamos decodificar as decisões de design de grandes marcas mundiais e construir do zero uma estrutura visual flexível de altíssimo impacto estético.',
        styles: {
          fontSize: 14,
          textColor: '#d4d4d4',
          align: 'left',
          marginBottom: 24
        }
      },
      {
        id: 'web_btn',
        type: 'button',
        content: 'Garantir Minha Vaga Gratuitamente 🎟️',
        href: '#',
        styles: {
          backgroundColor: '#f59e0b',
          textColor: '#171717',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 'bold',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          align: 'center',
          marginBottom: 0
        }
      }
    ],
    visualIdentity: {
      brandColors: [
        { id: 'bc_web1', name: 'Âmbar Tech', value: '#f59e0b' },
        { id: 'bc_web2', name: 'Escuro Neutro', value: '#171717' },
        { id: 'bc_web3', name: 'Preto Puro', value: '#0a0a0a' }
      ],
      colorRules: [],
      signatureName: 'Marcus Vinicius',
      signatureRole: 'Lead UI/UX Designer',
      signatureCompany: 'Creative Studios Corp',
      signaturePhone: '+55 (11) 90022-4455',
      signatureColor: '#f59e0b'
    }
  },
{
    id: 'invoice_billing',
    name: 'Sua fatura mensal está pronta 💳',
    globalStyles: {
      backgroundColor: '#f8fafc',
      containerColor: '#ffffff',
      textColor: '#334155',
      fontFamily: 'Inter, sans-serif',
      borderRadius: 12,
      padding: 32
    },
    variables: [
      { id: 'inv1', key: 'accountHolder', value: 'Arthur Azevedo', description: 'Nome do titular da conta' },
      { id: 'inv2', key: 'billingCycle', value: 'Junho/2026', description: 'Período da fatura' },
      { id: 'inv3', key: 'dueDate', value: '15/07/2026', description: 'Data de vencimento' },
      { id: 'inv4', key: 'invoiceAmount', value: 'R$ 149,90', description: 'Valor total da fatura' }
    ],
    elements: [
      {
        id: 'inv_head',
        type: 'heading',
        content: 'Sua fatura de {{billingCycle}} está fechada! 💳',
        styles: {
          fontSize: 20,
          fontWeight: 'bold',
          textColor: '#1e3a8a',
          align: 'left',
          marginBottom: 12
        }
      },
      {
        id: 'inv_text',
        type: 'text',
        content: 'Prezado {{accountHolder}},\n\nComunicamos que a sua fatura mensal referente ao ciclo de **{{billingCycle}}** já está disponível para consulta e pagamento.\n\n- **Valor Total:** {{invoiceAmount}}\n- **Vencimento:** {{dueDate}}',
        styles: {
          fontSize: 14,
          textColor: '#475569',
          align: 'left',
          marginBottom: 20
        }
      },
      {
        id: 'inv_div',
        type: 'divider',
        content: '',
        styles: {
          borderColor: '#e2e8f0',
          borderWidth: 1,
          marginBottom: 20,
          marginTop: 10
        }
      },
      {
        id: 'inv_btn',
        type: 'button',
        content: 'Visualizar Fatura e Copiar PIX 📲',
        href: '#',
        styles: {
          backgroundColor: '#1e3a8a',
          textColor: '#ffffff',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 'bold',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          align: 'center',
          marginBottom: 0
        }
      }
    ],
    visualIdentity: {
      brandColors: [
        { id: 'bc_inv1', name: 'Azul Escuro', value: '#1e3a8a' },
        { id: 'bc_inv2', name: 'Cinza Escuro', value: '#334155' },
        { id: 'bc_inv3', name: 'Verde Faturamento', value: '#10b981' }
      ],
      colorRules: [],
      signatureName: 'Setor de Contas a Receber',
      signatureRole: 'Faturamento Digital',
      signatureCompany: 'Telecomunicações Integradas S/A',
      signaturePhone: '+55 (11) 0800-400-500',
      signatureColor: '#1e3a8a'
    }
  },
{
    id: 'security_otp',
    name: 'Código de Segurança / Reset de Senha 🔒',
    globalStyles: {
      backgroundColor: '#fbfbfb',
      containerColor: '#ffffff',
      textColor: '#1c1917',
      fontFamily: 'Inter, sans-serif',
      borderRadius: 16,
      padding: 32
    },
    variables: [
      { id: 'otp1', key: 'userEmail', value: 'desenvolvedor@empresa.com', description: 'Email do destinatário' },
      { id: 'otp2', key: 'verificationCode', value: '489-201', description: 'Código OTP' }
    ],
    elements: [
      {
        id: 'otp_head',
        type: 'heading',
        content: 'Seu código de acesso único 🔒',
        styles: {
          fontSize: 20,
          fontWeight: 'bold',
          textColor: '#dc2626',
          align: 'center',
          marginBottom: 16
        }
      },
      {
        id: 'otp_text',
        type: 'text',
        content: 'Recebemos uma solicitação de autenticação em duas etapas ou redefinição de credenciais de acesso para a conta vinculada ao e-mail **{{userEmail}}**.\n\nUtilize o código temporário abaixo para confirmar sua identidade. Ele expira em 10 minutos:',
        styles: {
          fontSize: 14,
          textColor: '#44403c',
          align: 'center',
          marginBottom: 24
        }
      },
      {
        id: 'otp_code_display',
        type: 'heading',
        content: '{{verificationCode}}',
        styles: {
          fontSize: 32,
          fontWeight: 'bold',
          textColor: '#1c1917',
          align: 'center',
          marginBottom: 24
        }
      },
      {
        id: 'otp_warning',
        type: 'text',
        content: 'Se você não solicitou este código, sugerimos acessar imediatamente o portal de segurança e alterar sua senha mestra. Não compartilhe este código com ninguém.',
        styles: {
          fontSize: 11,
          textColor: '#78716c',
          align: 'center',
          marginBottom: 0
        }
      }
    ],
    visualIdentity: {
      brandColors: [
        { id: 'bc_otp1', name: 'Vermelho Alerta', value: '#dc2626' },
        { id: 'bc_otp2', name: 'Grafite Escuro', value: '#1c1917' },
        { id: 'bc_otp3', name: 'Cinza Suave', value: '#78716c' }
      ],
      colorRules: [],
      signatureName: 'Equipe de Segurança',
      signatureRole: 'CISO Office Security Bot',
      signatureCompany: 'Identity Provider Services',
      signaturePhone: '+55 (11) 127.0.0.1',
      signatureColor: '#dc2626'
    }
  },
{
    id: 'legal_update',
    name: 'Atualização nos Termos de Uso ⚖️',
    globalStyles: {
      backgroundColor: '#f4f4f5',
      containerColor: '#ffffff',
      textColor: '#27272b',
      fontFamily: 'Inter, sans-serif',
      borderRadius: 16,
      padding: 40
    },
    variables: [
      { id: 'leg1', key: 'legalDate', value: '01 de Agosto de 2026', description: 'Data de vigor legal' }
    ],
    elements: [
      {
        id: 'leg_head',
        type: 'heading',
        content: 'Avisos importantes sobre nossos Termos de Serviço ⚖️',
        styles: {
          fontSize: 22,
          fontWeight: 'bold',
          textColor: '#18181b',
          align: 'left',
          marginBottom: 16
        }
      },
      {
        id: 'leg_text',
        type: 'text',
        content: 'Prezado cliente,\n\nEstamos entrando em contato para informar que atualizamos nossos **Termos de Uso e nossa Política de Privacidade**, com vigência a partir de **{{legalDate}}**.\n\nEssas alterações refletem o cumprimento das novas regulamentações nacionais de proteção de dados (LGPD) e o lançamento das nossas APIs de criptografia ponta a ponta.',
        styles: {
          fontSize: 14,
          textColor: '#52525b',
          align: 'left',
          marginBottom: 20
        }
      },
      {
        id: 'leg_btn',
        type: 'button',
        content: 'Conhecer Termos Atualizados 📄',
        href: '#',
        styles: {
          backgroundColor: '#18181b',
          textColor: '#ffffff',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 'bold',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          align: 'center',
          marginBottom: 0
        }
      }
    ],
    visualIdentity: {
      brandColors: [
        { id: 'bc_leg1', name: 'Preto Total', value: '#18181b' },
        { id: 'bc_leg2', name: 'Cinza Escuro', value: '#52525b' },
        { id: 'bc_leg3', name: 'Cinza Claro', value: '#f4f4f5' }
      ],
      colorRules: [],
      signatureName: 'Legal & Compliance S/A',
      signatureRole: 'DPO & Head of Legal Office',
      signatureCompany: 'Enterprise Platforms Group',
      signaturePhone: '+55 (11) 4004-1212',
      signatureColor: '#18181b'
    }
  },
{
    id: 'meeting_booking',
    name: 'Reunião Confirmada no Calendário 📅',
    globalStyles: {
      backgroundColor: '#f0fdf4',
      containerColor: '#ffffff',
      textColor: '#166534',
      fontFamily: 'Inter, sans-serif',
      borderRadius: 16,
      padding: 32
    },
    variables: [
      { id: 'meet1', key: 'inviteeName', value: 'Dra. Sandra', description: 'Nome do convidado' },
      { id: 'meet2', key: 'meetingSubject', value: 'Alinhamento Estratégico de Marketing Digital', description: 'Tema da chamada' },
      { id: 'meet3', key: 'meetingTime', value: 'Quarta-feira, 15:30 (Horário de Brasília)', description: 'Horário do compromisso' },
      { id: 'meet4', key: 'joinUrl', value: 'https://meet.google.com/abc-defg-hij', description: 'Link da chamada virtual' }
    ],
    elements: [
      {
        id: 'meet_head',
        type: 'heading',
        content: 'Tudo pronto para nossa chamada! 📅🤝',
        styles: {
          fontSize: 22,
          fontWeight: 'bold',
          textColor: '#15803d',
          align: 'left',
          marginBottom: 12
        }
      },
      {
        id: 'meet_txt',
        type: 'text',
        content: 'Olá, {{inviteeName}}!\n\nConfirmamos em nosso calendário o agendamento do compromisso:\n\n- **Assunto:** {{meetingSubject}}\n- **Horário:** {{meetingTime}}\n\nO link de videoconferência já foi gerado de forma segura e anexado a este e-mail. Para entrar na sala virtual, basta utilizar o botão abaixo no momento marcado:',
        styles: {
          fontSize: 14,
          textColor: '#166534',
          align: 'left',
          marginBottom: 20
        }
      },
      {
        id: 'meet_div',
        type: 'divider',
        content: '',
        styles: {
          borderColor: '#bbf7d0',
          borderWidth: 1,
          marginBottom: 20,
          marginTop: 10
        }
      },
      {
        id: 'meet_btn',
        type: 'button',
        content: 'Acessar Videochamada no Google Meet 💻',
        href: '#',
        styles: {
          backgroundColor: '#15803d',
          textColor: '#ffffff',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 'bold',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          align: 'center',
          marginBottom: 0
        }
      }
    ],
    visualIdentity: {
      brandColors: [
        { id: 'bc_meet1', name: 'Verde Calendário', value: '#15803d' },
        { id: 'bc_meet2', name: 'Verde Escuro', value: '#166534' },
        { id: 'bc_meet3', name: 'Fundo Verde', value: '#f0fdf4' }
      ],
      colorRules: [],
      signatureName: 'Agendador de Tarefas',
      signatureRole: 'Assistente Virtual Integrado',
      signatureCompany: 'Agenda Inteligente S/A',
      signaturePhone: '+55 (11) 98877-6655',
      signatureColor: '#15803d'
    }
  },
{
    id: 'birthday_gift',
    name: 'Parabéns pelo seu dia! 🎉',
    globalStyles: {
      backgroundColor: '#fff1f2',
      containerColor: '#ffffff',
      textColor: '#9f1239',
      fontFamily: 'Inter, sans-serif',
      borderRadius: 20,
      padding: 32
    },
    variables: [
      { id: 'bday1', key: 'birthdayName', value: 'Renato Reis', description: 'Aniversariante do dia' },
      { id: 'bday2', key: 'giftCoupon', value: 'NIVERVIP25', description: 'Código do presente' }
    ],
    elements: [
      {
        id: 'bday_img',
        type: 'image',
        content: '',
        src: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&auto=format&fit=crop&q=80',
        alt: 'Balloons Party Celebration',
        styles: {
          width: 536,
          height: 180,
          borderRadius: 16,
          marginBottom: 20,
          align: 'center'
        }
      },
      {
        id: 'bday_head',
        type: 'heading',
        content: 'Feliz Aniversário, {{birthdayName}}! 🎂🎈',
        styles: {
          fontSize: 24,
          fontWeight: 'bold',
          textColor: '#e11d48',
          align: 'center',
          marginBottom: 12
        }
      },
      {
        id: 'bday_text',
        type: 'text',
        content: 'Hoje é um dia de muita comemoração! 🎉\n\nDesejamos a você muita paz, saúde, felicidade e conquistas extraordinárias neste novo ciclo que se inicia.\n\nComo forma de comemoração, preparamos um presente especial: **R$ 50 de crédito livre** em toda a nossa loja. Basta usar o código **{{giftCoupon}}** na finalização de qualquer pedido pelo link abaixo:',
        styles: {
          fontSize: 14,
          textColor: '#9f1239',
          align: 'center',
          marginBottom: 24
        }
      },
      {
        id: 'bday_btn',
        type: 'button',
        content: 'Ativar Meu Cupom de Aniversário 🎁',
        href: '#',
        styles: {
          backgroundColor: '#e11d48',
          textColor: '#ffffff',
          borderRadius: 9999,
          fontSize: 14,
          fontWeight: 'bold',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          align: 'center',
          marginBottom: 0
        }
      }
    ],
    visualIdentity: {
      brandColors: [
        { id: 'bc_bday1', name: 'Rosa Vibrante', value: '#e11d48' },
        { id: 'bc_bday2', name: 'Rosa Vinho', value: '#9f1239' },
        { id: 'bc_bday3', name: 'Fundo Rosa', value: '#fff1f2' }
      ],
      colorRules: [],
      signatureName: 'Equipe de Relacionamento',
      signatureRole: 'Gerente de CRM & Fidelidade',
      signatureCompany: 'Clube de Vantagens Gold',
      signaturePhone: '+55 (11) 4004-9889',
      signatureColor: '#e11d48'
    }
  },
{
    id: 'course_launch',
    name: 'Inscrições Abertas: Formação Fullstack 🎓',
    globalStyles: {
      backgroundColor: '#faf5ff',
      containerColor: '#ffffff',
      textColor: '#3b0764',
      fontFamily: 'Inter, sans-serif',
      borderRadius: 16,
      padding: 36
    },
    variables: [
      { id: 'cls1', key: 'studentName', value: 'Mateus', description: 'Nome do estudante' },
      { id: 'cls2', key: 'earlyBirdDiscount', value: '35% de desconto', description: 'Desconto de lançamento' }
    ],
    elements: [
      {
        id: 'cls_img',
        type: 'image',
        content: '',
        src: 'https://images.unsplash.com/photo-1516116211223-5c359a36298a?w=600&auto=format&fit=crop&q=80',
        alt: 'Code editor screen',
        styles: {
          width: 536,
          height: 180,
          borderRadius: 12,
          marginBottom: 20,
          align: 'center'
        }
      },
      {
        id: 'cls_head',
        type: 'heading',
        content: 'Seu próximo nível profissional, {{studentName}}! 🚀',
        styles: {
          fontSize: 22,
          fontWeight: 'bold',
          textColor: '#6b21a8',
          align: 'center',
          marginBottom: 12
        }
      },
      {
        id: 'cls_text',
        type: 'text',
        content: 'É oficial! As inscrições para a nova **Formação Desenvolvedor Fullstack Premium** acabam de ser abertas.\n\nNeste programa completo, você aprenderá do básico às arquiteturas mais avançadas de nuvem, APIs resilientes, GraphQL, PostgreSQL, Next.js e Inteligência Artificial integrando agentes.\n\nFaça sua matrícula agora com **{{earlyBirdDiscount}}** aplicando nossa oferta de abertura:',
        styles: {
          fontSize: 14,
          textColor: '#581c87',
          align: 'center',
          marginBottom: 24
        }
      },
      {
        id: 'cls_btn',
        type: 'button',
        content: 'Garantir Vaga com {{earlyBirdDiscount}} 🎓',
        href: '#',
        styles: {
          backgroundColor: '#7c3aed',
          textColor: '#ffffff',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 'bold',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          align: 'center',
          marginBottom: 0
        }
      }
    ],
    visualIdentity: {
      brandColors: [
        { id: 'bc_cls1', name: 'Roxo Puro', value: '#7c3aed' },
        { id: 'bc_cls2', name: 'Roxo Escuro', value: '#6b21a8' },
        { id: 'bc_cls3', name: 'Lavanda', value: '#faf5ff' }
      ],
      colorRules: [],
      signatureName: 'Coordenação Acadêmica',
      signatureRole: 'Diretor de Ensino Tecnológico',
      signatureCompany: 'Dev School International',
      signaturePhone: '+55 (11) 90011-2233',
      signatureColor: '#7c3aed'
    }
  },
{
    id: 'black_friday',
    name: 'BLACK FRIDAY: Até 70% OFF 🔥',
    globalStyles: {
      backgroundColor: '#000000',
      containerColor: '#09090b',
      textColor: '#f4f4f5',
      fontFamily: 'system-ui, sans-serif',
      borderRadius: 16,
      padding: 32
    },
    variables: [
      { id: 'bf1', key: 'customerName', value: 'Helena', description: 'Nome do cliente' },
      { id: 'bf2', key: 'saleCategory', value: 'Eletrônicos e Smartphones', description: 'Categoria em destaque' }
    ],
    elements: [
      {
        id: 'bf_img',
        type: 'image',
        content: '',
        src: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?w=600&auto=format&fit=crop&q=80',
        alt: 'Neon storefront neon lights',
        styles: {
          width: 536,
          height: 180,
          borderRadius: 12,
          marginBottom: 20,
          align: 'center'
        }
      },
      {
        id: 'bf_head',
        type: 'heading',
        content: 'É HORA DO MAIOR DESCONTO DO ANO, {{customerName}}! 💣🔥',
        styles: {
          fontSize: 22,
          fontWeight: 'bold',
          textColor: '#ef4444',
          align: 'center',
          marginBottom: 12
        }
      },
      {
        id: 'bf_text',
        type: 'text',
        content: 'As portas dos nossos servidores foram abertas para a maior liquidação da história. O setor de **{{saleCategory}}** está com cupons brutais de até 70% off.\n\nEstoque super limitado! Os carrinhos expiram rapidamente pela altíssima demanda. Acesse o portal vip pelo botão abaixo e aproveite:',
        styles: {
          fontSize: 14,
          textColor: '#e4e4e7',
          align: 'center',
          marginBottom: 24
        }
      },
      {
        id: 'bf_btn',
        type: 'button',
        content: 'ACESSAR OFERTAS BLACK FRIDAY 🛍️🔥',
        href: '#',
        styles: {
          backgroundColor: '#ef4444',
          textColor: '#000000',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 'bold',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          align: 'center',
          marginBottom: 0
        }
      }
    ],
    visualIdentity: {
      brandColors: [
        { id: 'bc_bf1', name: 'Vermelho Fogo', value: '#ef4444' },
        { id: 'bc_bf2', name: 'Preto Profundo', value: '#09090b' },
        { id: 'bc_bf3', name: 'Cinza Gelo', value: '#f4f4f5' }
      ],
      colorRules: [],
      signatureName: 'Vendas Exclusivas Black',
      signatureRole: 'Squad de Atendimento VIP',
      signatureCompany: 'Mega Ofertas S/A',
      signaturePhone: '+55 (11) 4004-7000',
      signatureColor: '#ef4444'
    }
  },
{
    id: 'subscription_receipt',
    name: 'Confirmação de Upgrade do Plano ⚡',
    globalStyles: {
      backgroundColor: '#f4f4f5',
      containerColor: '#ffffff',
      textColor: '#18181b',
      fontFamily: 'Inter, sans-serif',
      borderRadius: 16,
      padding: 36
    },
    variables: [
      { id: 'sub1', key: 'clientName', value: 'Danielle', description: 'Nome da cliente' },
      { id: 'sub2', key: 'planName', value: 'Enterprise SaaS Pro', description: 'Nome do plano assinado' },
      { id: 'sub3', key: 'renewalDate', value: '12/08/2026', description: 'Próxima renovação faturamento' }
    ],
    elements: [
      {
        id: 'sub_head',
        type: 'heading',
        content: 'Parabéns, {{clientName}}! Seu upgrade foi ativado! ⚡✨',
        styles: {
          fontSize: 22,
          fontWeight: 'bold',
          textColor: '#4f46e5',
          align: 'left',
          marginBottom: 12
        }
      },
      {
        id: 'sub_text',
        type: 'text',
        content: 'Olá, {{clientName}}!\n\nTemos o prazer de confirmar que o plano de assinatura **{{planName}}** está totalmente configurado e ativo para seu workspace de desenvolvimento.\n\nSeu ambiente de trabalho já conta com renderizador 5x mais rápido, limites ilimitados de templates mensais e suporte prioritário via webhook com resposta em até 30 minutos.',
        styles: {
          fontSize: 14,
          textColor: '#3f3f46',
          align: 'left',
          marginBottom: 20
        }
      },
      {
        id: 'sub_div',
        type: 'divider',
        content: '',
        styles: {
          borderColor: '#e4e4e7',
          borderWidth: 1,
          marginBottom: 20,
          marginTop: 10
        }
      },
      {
        id: 'sub_btn',
        type: 'button',
        content: 'Acessar Recursos do Plano {{planName}} 🚀',
        href: '#',
        styles: {
          backgroundColor: '#4f46e5',
          textColor: '#ffffff',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 'bold',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          align: 'center',
          marginBottom: 0
        }
      }
    ],
    visualIdentity: {
      brandColors: [
        { id: 'bc_sub1', name: 'Índigo Elétrico', value: '#4f46e5' },
        { id: 'bc_sub2', name: 'Cinza Escuro', value: '#18181b' },
        { id: 'bc_sub3', name: 'Cinza Médio', value: '#3f3f46' }
      ],
      colorRules: [],
      signatureName: 'Faturamento de Contas VIP',
      signatureRole: 'Gerente Financeiro de Assinatura',
      signatureCompany: 'SaaS Software Enterprise',
      signaturePhone: '+55 (11) 0800-722-1100',
      signatureColor: '#4f46e5'
    }
  },
{
    id: 'weekly_digest',
    name: 'Seu relatório semanal de tráfego 📈',
    globalStyles: {
      backgroundColor: '#fafaf9',
      containerColor: '#ffffff',
      textColor: '#292524',
      fontFamily: 'Inter, sans-serif',
      borderRadius: 16,
      padding: 32
    },
    variables: [
      { id: 'dig1', key: 'managerName', value: 'Eduardo Martins', description: 'Nome do gestor' },
      { id: 'dig2', key: 'clicksCount', value: '18.452 cliques', description: 'Contagem de cliques' },
      { id: 'dig3', key: 'impressionsCount', value: '245.981 impressões', description: 'Contagem de impressões' }
    ],
    elements: [
      {
        id: 'dig_head',
        type: 'heading',
        content: 'Seu Relatório de Tráfego Semanal 📈📊',
        styles: {
          fontSize: 20,
          fontWeight: 'bold',
          textColor: '#ea580c',
          align: 'left',
          marginBottom: 12
        }
      },
      {
        id: 'dig_text',
        type: 'text',
        content: 'Prezado {{managerName}},\n\nConsolidamos o tráfego gerado nos seus canais digitais ao longo dos últimos 7 dias. O desempenho de cliques e conversões apresentou um crescimento robusto em relação ao período anterior.\n\n- **Métricas Chave:**\n- **Cliques Ativos:** {{clicksCount}}\n- **Impressões Digitais:** {{impressionsCount}}\n- **Taxa de Conversão:** 7.4% (alta de 1.2%!)',
        styles: {
          fontSize: 14,
          textColor: '#44403c',
          align: 'left',
          marginBottom: 20
        }
      },
      {
        id: 'dig_div',
        type: 'divider',
        content: '',
        styles: {
          borderColor: '#e7e5e4',
          borderWidth: 1,
          marginBottom: 20,
          marginTop: 10
        }
      },
      {
        id: 'dig_btn',
        type: 'button',
        content: 'Ver Relatório Completo de Performance 💻',
        href: '#',
        styles: {
          backgroundColor: '#ea580c',
          textColor: '#ffffff',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 'bold',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          align: 'center',
          marginBottom: 0
        }
      }
    ],
    visualIdentity: {
      brandColors: [
        { id: 'bc_dig1', name: 'Laranja Tráfego', value: '#ea580c' },
        { id: 'bc_dig2', name: 'Marrom Terra', value: '#292524' },
        { id: 'bc_dig3', name: 'Areia Suave', value: '#fafaf9' }
      ],
      colorRules: [],
      signatureName: 'Robô de Métricas Integradas',
      signatureRole: 'Status Bot de Desempenho',
      signatureCompany: 'Analytics Automation SA',
      signaturePhone: '+55 (11) 127.0.0.1',
      signatureColor: '#ea580c'
    }
  },
{
    id: 'security_alert',
    name: 'Alerta de Segurança / Login Suspeito 🚨',
    globalStyles: {
      backgroundColor: '#fff5f5',
      containerColor: '#ffffff',
      textColor: '#7f1d1d',
      fontFamily: 'Inter, sans-serif',
      borderRadius: 16,
      padding: 32
    },
    variables: [
      { id: 'ale1', key: 'userAccount', value: 'administrador@empresa.com.br', description: 'Conta de acesso' },
      { id: 'ale2', key: 'loginDevice', value: 'Chrome via Linux (Ubuntu 24.04)', description: 'Dispositivo detectado' },
      { id: 'ale3', key: 'loginLocation', value: 'Maceió, AL (Provedor Regional)', description: 'Localização geográfica' },
      { id: 'ale4', key: 'loginIp', value: '189.12.190.4', description: 'Endereço IP' }
    ],
    elements: [
      {
        id: 'ale_head',
        type: 'heading',
        content: 'ALERTA: Tentativa de login suspeito detectada! 🚨',
        styles: {
          fontSize: 20,
          fontWeight: 'bold',
          textColor: '#b91c1c',
          align: 'left',
          marginBottom: 12
        }
      },
      {
        id: 'ale_text',
        type: 'text',
        content: 'Prezado administrador,\n\nIdentificamos uma nova sessão de autenticação na sua conta **{{userAccount}}** a partir de um IP que não pertence ao seu padrão de navegação regular.\n\n- **Detalhes da Sessão:**\n- **Navegador:** {{loginDevice}}\n- **Origem:** {{loginLocation}}\n- **IP Originário:** {{loginIp}}',
        styles: {
          fontSize: 14,
          textColor: '#991b1b',
          align: 'left',
          marginBottom: 20
        }
      },
      {
        id: 'ale_div',
        type: 'divider',
        content: '',
        styles: {
          borderColor: '#fee2e2',
          borderWidth: 1,
          marginBottom: 20,
          marginTop: 10
        }
      },
      {
        id: 'ale_btn',
        type: 'button',
        content: 'Bloquear Conta e Resetar Senha 🔒🚨',
        href: '#',
        styles: {
          backgroundColor: '#b91c1c',
          textColor: '#ffffff',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 'bold',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          align: 'center',
          marginBottom: 0
        }
      }
    ],
    visualIdentity: {
      brandColors: [
        { id: 'bc_ale1', name: 'Vermelho Crítico', value: '#b91c1c' },
        { id: 'bc_ale2', name: 'Vinho', value: '#7f1d1d' },
        { id: 'bc_ale3', name: 'Vermelho Fundo', value: '#fff5f5' }
      ],
      colorRules: [],
      signatureName: 'DevOps Incident Response',
      signatureRole: 'Cyber Security Operations Specialist',
      signatureCompany: 'Infra Segura & Dados SA',
      signaturePhone: '+55 (11) 4004-9111',
      signatureColor: '#b91c1c'
    }
  },
{
    id: 'interview_invite',
    name: 'Convite para Entrevista de Emprego 🤝',
    globalStyles: {
      backgroundColor: '#f8fafc',
      containerColor: '#ffffff',
      textColor: '#1e293b',
      fontFamily: 'Inter, sans-serif',
      borderRadius: 12,
      padding: 32
    },
    variables: [
      { id: 'int1', key: 'candidateName', value: 'Gabriel Silveira', description: 'Nome do candidato' },
      { id: 'int2', key: 'jobTitle', value: 'Desenvolvedor Frontend Sênior', description: 'Vaga pretendida' },
      { id: 'int3', key: 'interviewerName', value: 'Juliana Costa (Sênior Tech Recruiter)', description: 'Nome da recrutadora' },
      { id: 'int4', key: 'interviewDate', value: 'Sexta-feira, 11/07 às 14:00', description: 'Data da entrevista' }
    ],
    elements: [
      {
        id: 'int_head',
        type: 'heading',
        content: 'Parabéns! Sua entrevista está confirmada 🤝🚀',
        styles: {
          fontSize: 20,
          fontWeight: 'bold',
          textColor: '#2563eb',
          align: 'left',
          marginBottom: 12
        }
      },
      {
        id: 'int_text',
        type: 'text',
        content: 'Olá, {{candidateName}}!\n\nTemos o prazer de avançar com o seu perfil no processo seletivo para a posição de **{{jobTitle}}**.\n\nAgendamos o nosso bate-papo técnico com a recrutadora **{{interviewerName}}**.\n\n- **Horário:** {{interviewDate}}\n\nA chamada de vídeo será realizada de forma totalmente online. Use o botão abaixo no horário agendado para acessar a sala:',
        styles: {
          fontSize: 14,
          textColor: '#334155',
          align: 'left',
          marginBottom: 20
        }
      },
      {
        id: 'int_div',
        type: 'divider',
        content: '',
        styles: {
          borderColor: '#e2e8f0',
          borderWidth: 1,
          marginBottom: 20,
          marginTop: 10
        }
      },
      {
        id: 'int_btn',
        type: 'button',
        content: 'Entrar na Sala de Entrevista Virtual 💻',
        href: '#',
        styles: {
          backgroundColor: '#2563eb',
          textColor: '#ffffff',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 'bold',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          align: 'center',
          marginBottom: 0
        }
      }
    ],
    visualIdentity: {
      brandColors: [
        { id: 'bc_int1', name: 'Azul Recrutamento', value: '#2563eb' },
        { id: 'bc_int2', name: 'Cinza Escuro', value: '#1e293b' },
        { id: 'bc_int3', name: 'Azul Claro', value: '#f8fafc' }
      ],
      colorRules: [],
      signatureName: 'Juliana Costa',
      signatureRole: 'Sênior Talent Acquisition',
      signatureCompany: 'Software Enterprise Inc',
      signaturePhone: '+55 (11) 98888-1212',
      signatureColor: '#2563eb'
    }
  },
{
    id: 'hr_onboarding',
    name: 'Boas-vindas a Novo Colaborador (RH) 🎉',
    globalStyles: {
      backgroundColor: '#fdf4ff',
      containerColor: '#ffffff',
      textColor: '#581c87',
      fontFamily: 'Inter, sans-serif',
      borderRadius: 16,
      padding: 32
    },
    variables: [
      { id: 'onb1', key: 'collaboratorName', value: 'Aline Souza', description: 'Nome do colaborador' },
      { id: 'onb2', key: 'teamName', value: 'Time de Core Engineering', description: 'Nome da equipe' },
      { id: 'onb3', key: 'managerName', value: 'Roberto Vasconcelos (CTO)', description: 'Gestor direto' }
    ],
    elements: [
      {
        id: 'onb_img',
        type: 'image',
        content: '',
        src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80',
        alt: 'Team high five group',
        styles: {
          width: 536,
          height: 180,
          borderRadius: 12,
          marginBottom: 20,
          align: 'center'
        }
      },
      {
        id: 'onb_head',
        type: 'heading',
        content: 'Seja muito bem-vinda ao time, {{collaboratorName}}! 🎉🚀',
        styles: {
          fontSize: 22,
          fontWeight: 'bold',
          textColor: '#7e22ce',
          align: 'center',
          marginBottom: 12
        }
      },
      {
        id: 'onb_text',
        type: 'text',
        content: 'Oi, {{collaboratorName}}!\n\nToda a equipe está imensamente feliz com a sua chegada! Você atuará como engenheira de software no **{{teamName}}**, respondendo diretamente ao gestor **{{managerName}}**.\n\nPreparamos um guia interativo com todo o setup de ambiente inicial, acessos do repositório, credenciais do Slack e o manual de cultura corporativa. Use o botão abaixo para iniciar:',
        styles: {
          fontSize: 14,
          textColor: '#581c87',
          align: 'center',
          marginBottom: 24
        }
      },
      {
        id: 'onb_btn',
        type: 'button',
        content: 'Acessar Meu Guia de Onboarding 📚⚙️',
        href: '#',
        styles: {
          backgroundColor: '#7e22ce',
          textColor: '#ffffff',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 'bold',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          align: 'center',
          marginBottom: 0
        }
      }
    ],
    visualIdentity: {
      brandColors: [
        { id: 'bc_onb1', name: 'Roxo Nobre', value: '#7e22ce' },
        { id: 'bc_onb2', name: 'Rosa Suave', value: '#fdf4ff' },
        { id: 'bc_onb3', name: 'Roxo Profundo', value: '#581c87' }
      ],
      colorRules: [],
      signatureName: 'People & Culture Team',
      signatureRole: 'Head of Human Resources Office',
      signatureCompany: 'Nexus Analytics SA',
      signaturePhone: '+55 (11) 4004-9911',
      signatureColor: '#7e22ce'
    }
  },
{
    id: 'charity_donation',
    name: 'Campanha de Doação / Crowdfunding ❤️',
    globalStyles: {
      backgroundColor: '#f0fdf4',
      containerColor: '#ffffff',
      textColor: '#14532d',
      fontFamily: 'Georgia, serif',
      borderRadius: 16,
      padding: 32
    },
    variables: [
      { id: 'don1', key: 'donorName', value: 'Cláudio', description: 'Nome do doador' },
      { id: 'don2', key: 'projectName', value: 'Projeto Sorriso Infantil', description: 'Nome do projeto beneficiado' }
    ],
    elements: [
      {
        id: 'don_img',
        type: 'image',
        content: '',
        src: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&auto=format&fit=crop&q=80',
        alt: 'Smiling happy kids',
        styles: {
          width: 536,
          height: 180,
          borderRadius: 12,
          marginBottom: 20,
          align: 'center'
        }
      },
      {
        id: 'don_head',
        type: 'heading',
        content: 'Seu ato de carinho transforma vidas, {{donorName}}! ❤️',
        styles: {
          fontSize: 22,
          fontWeight: 'bold',
          textColor: '#15803d',
          align: 'center',
          marginBottom: 12
        }
      },
      {
        id: 'don_text',
        type: 'text',
        content: 'Olá, {{donorName}}!\n\nAcreditamos que pequenas ações coordenadas geram revoluções sociais duradouras.\n\nEstamos liderando o **{{projectName}}**, que fornece refeições saudáveis, aulas de reforço de programação e materiais escolares para mais de 350 famílias em situação de extrema vulnerabilidade social.\n\nSua contribuição mensal garante que nenhuma criança fique sem estudar ou se alimentar:',
        styles: {
          fontSize: 14,
          textColor: '#166534',
          align: 'center',
          marginBottom: 24
        }
      },
      {
        id: 'don_btn',
        type: 'button',
        content: 'Fazer uma Doação Solidária (PIX) 💖',
        href: '#',
        styles: {
          backgroundColor: '#16a34a',
          textColor: '#ffffff',
          borderRadius: 9999,
          fontSize: 14,
          fontWeight: 'bold',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          align: 'center',
          marginBottom: 0
        }
      }
    ],
    visualIdentity: {
      brandColors: [
        { id: 'bc_don1', name: 'Verde Caridade', value: '#16a34a' },
        { id: 'bc_don2', name: 'Verde Escuro', value: '#14532d' },
        { id: 'bc_don3', name: 'Fundo Verde', value: '#f0fdf4' }
      ],
      colorRules: [],
      signatureName: 'Mãos Solidárias',
      signatureRole: 'Diretoria de Relações Humanas',
      signatureCompany: 'Associação Sorriso e Progresso',
      signaturePhone: '+55 (11) 97766-2211',
      signatureColor: '#16a34a'
    }
  },
{
    id: 'travel_voucher',
    name: 'Itinerário de Viagem / Voucher ✈️',
    globalStyles: {
      backgroundColor: '#f0f9ff',
      containerColor: '#ffffff',
      textColor: '#0369a1',
      fontFamily: 'Inter, sans-serif',
      borderRadius: 16,
      padding: 32
    },
    variables: [
      { id: 'trv1', key: 'travelerName', value: 'Beatriz Ramos', description: 'Nome do passageiro' },
      { id: 'trv2', key: 'destination', value: 'Rio de Janeiro (SDU)', description: 'Cidade destino' },
      { id: 'trv3', key: 'flightNumber', value: 'G3-1092', description: 'Número do voo' },
      { id: 'trv4', key: 'departureTime', value: 'Quinta-feira, 16 de Julho às 09:30', description: 'Hora de embarque' }
    ],
    elements: [
      {
        id: 'trv_img',
        type: 'image',
        content: '',
        src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
        alt: 'Sunny beach sea view',
        styles: {
          width: 536,
          height: 180,
          borderRadius: 12,
          marginBottom: 20,
          align: 'center'
        }
      },
      {
        id: 'trv_head',
        type: 'heading',
        content: 'Boa viagem! Voo confirmado para {{destination}} ✈️🏝️',
        styles: {
          fontSize: 20,
          fontWeight: 'bold',
          textColor: '#0284c7',
          align: 'left',
          marginBottom: 12
        }
      },
      {
        id: 'trv_text',
        type: 'text',
        content: 'Olá, {{travelerName}}!\n\nTudo pronto para sua próxima aventura! O seu bilhete eletrônico e cartão de embarque digital já foram emitidos pelas companhias aéreas parceiras.\n\n- **Dados do Cartão de Embarque:**\n- **Destino Final:** {{destination}}\n- **Código do Voo:** {{flightNumber}}\n- **Horário de Partida:** {{departureTime}}\n- **Portão de Embarque:** Portão 12B (Favor confirmar no painel local)',
        styles: {
          fontSize: 14,
          textColor: '#0369a1',
          align: 'left',
          marginBottom: 20
        }
      },
      {
        id: 'trv_div',
        type: 'divider',
        content: '',
        styles: {
          borderColor: '#bae6fd',
          borderWidth: 1,
          marginBottom: 20,
          marginTop: 10
        }
      },
      {
        id: 'trv_btn',
        type: 'button',
        content: 'Baixar Cartão de Embarque PDF 🎫📲',
        href: '#',
        styles: {
          backgroundColor: '#0284c7',
          textColor: '#ffffff',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 'bold',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          align: 'center',
          marginBottom: 0
        }
      }
    ],
    visualIdentity: {
      brandColors: [
        { id: 'bc_trv1', name: 'Azul Céu', value: '#0284c7' },
        { id: 'bc_trv2', name: 'Azul Oceano', value: '#0369a1' },
        { id: 'bc_trv3', name: 'Fundo Celeste', value: '#f0f9ff' }
      ],
      colorRules: [],
      signatureName: 'Decola Viagens',
      signatureRole: 'Suporte de Atendimento ao Passageiro',
      signatureCompany: 'Decola Turismo Internacional',
      signaturePhone: '+55 (11) 4004-9222',
      signatureColor: '#0284c7'
    }
  },
{
    id: 'fitness_workout',
    name: 'Treino do Dia / Plano de Fitness 💪',
    globalStyles: {
      backgroundColor: '#f7fee7',
      containerColor: '#1e293b',
      textColor: '#f8fafc',
      fontFamily: 'Inter, sans-serif',
      borderRadius: 16,
      padding: 32
    },
    variables: [
      { id: 'fit1', key: 'athleteName', value: 'Rodrigo Lima', description: 'Nome do aluno' },
      { id: 'fit2', key: 'workoutType', value: 'Força e Hipertrofia (Membros Superiores)', description: 'Modalidade de treino' },
      { id: 'fit3', key: 'focusArea', value: 'Peitoral e Tríceps', description: 'Grupamento muscular' }
    ],
    elements: [
      {
        id: 'fit_head',
        type: 'heading',
        content: 'Foco de Hoje: {{focusArea}} 🔥💪',
        styles: {
          fontSize: 22,
          fontWeight: 'bold',
          textColor: '#a3e635',
          align: 'left',
          marginBottom: 12
        }
      },
      {
        id: 'fit_text',
        type: 'text',
        content: 'Bora treinar, {{athleteName}}!\n\nNão pule o treino de hoje! Preparamos uma rotina de alta intensidade focada no grupamento muscular **{{focusArea}}**.\n\n- **Estrutura de Hoje:**\n1. **Aquecimento:** 5 min de mobilidade de ombros.\n2. **Principal:** 4 séries de Supino Reto, 4 séries de Desenvolvimento, 3 séries de Tríceps Corda.\n3. **Frequência:** Intervalos de repouso entre séries de 90 segundos.',
        styles: {
          fontSize: 14,
          textColor: '#e2e8f0',
          align: 'left',
          marginBottom: 20
        }
      },
      {
        id: 'fit_div',
        type: 'divider',
        content: '',
        styles: {
          borderColor: '#334155',
          borderWidth: 1,
          marginBottom: 20,
          marginTop: 10
        }
      },
      {
        id: 'fit_btn',
        type: 'button',
        content: 'Abrir Ficha e Iniciar Cronômetro ⏱️💪',
        href: '#',
        styles: {
          backgroundColor: '#a3e635',
          textColor: '#1e293b',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 'bold',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          align: 'center',
          marginBottom: 0
        }
      }
    ],
    visualIdentity: {
      brandColors: [
        { id: 'bc_fit1', name: 'Limão Fitness', value: '#a3e635' },
        { id: 'bc_fit2', name: 'Grafite Escuro', value: '#1e293b' },
        { id: 'bc_fit3', name: 'Verde Fundo', value: '#f7fee7' }
      ],
      colorRules: [],
      signatureName: 'Trainer Rodrigo',
      signatureRole: 'Personal Trainer & Head of Gym',
      signatureCompany: 'High Performance Fitness',
      signaturePhone: '+55 (11) 98888-2233',
      signatureColor: '#a3e635'
    }
  },
{
    id: 'food_recipe',
    name: 'Receita da Semana / Gastronomia 🍄',
    globalStyles: {
      backgroundColor: '#fdf8f6',
      containerColor: '#ffffff',
      textColor: '#431407',
      fontFamily: 'Georgia, serif',
      borderRadius: 16,
      padding: 32
    },
    variables: [
      { id: 'rcp1', key: 'cookName', value: 'Amanda Lopes', description: 'Nome de quem cozinha' },
      { id: 'rcp2', key: 'prepTime', value: '40 minutos', description: 'Tempo total de preparo' }
    ],
    elements: [
      {
        id: 'rcp_img',
        type: 'image',
        content: '',
        src: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
        alt: 'Gourmet plate dish recipe',
        styles: {
          width: 536,
          height: 180,
          borderRadius: 12,
          marginBottom: 20,
          align: 'center'
        }
      },
      {
        id: 'rcp_head',
        type: 'heading',
        content: 'Sua Receita Especial: Risoto de Funghi Secchi 🍄🍲',
        styles: {
          fontSize: 22,
          fontWeight: 'bold',
          textColor: '#9a3412',
          align: 'center',
          marginBottom: 12
        }
      },
      {
        id: 'rcp_text',
        type: 'text',
        content: 'Olá, chefe {{cookName}}! 👋\n\nPara animar o seu fim de semana, trouxemos uma receita super aconchegante, elegante e extremamente fácil de cozinhar. Tempo de preparo: **{{prepTime}}**.\n\n- **Ingredientes Principais:**\n- 1 xícara de Arroz Arbóreo\n- 50g de Funghi Secchi reidratado\n- 1 litro de Caldo de Legumes caseiro fervente\n- Meia xícara de Vinho Branco seco\n- Parmesão e Manteiga gelada para finalizar',
        styles: {
          fontSize: 14,
          textColor: '#431407',
          align: 'left',
          marginBottom: 24
        }
      },
      {
        id: 'rcp_btn',
        type: 'button',
        content: 'Ver Vídeo com Passo a Passo Completo 🎥🍲',
        href: '#',
        styles: {
          backgroundColor: '#ea580c',
          textColor: '#ffffff',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 'bold',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          align: 'center',
          marginBottom: 0
        }
      }
    ],
    visualIdentity: {
      brandColors: [
        { id: 'bc_rcp1', name: 'Laranja Terracota', value: '#ea580c' },
        { id: 'bc_rcp2', name: 'Marrom Castanha', value: '#431407' },
        { id: 'bc_rcp3', name: 'Creme Fundo', value: '#fdf8f6' }
      ],
      colorRules: [],
      signatureName: 'Chef Amanda Lopes',
      signatureRole: 'Chef de Cozinha Consultora',
      signatureCompany: 'Master Gourmet Receitas',
      signaturePhone: '+55 (11) 99988-7711',
      signatureColor: '#ea580c'
    }
  },
  {
    id: 'medico_reuniao',
    name: 'Visita / Reunião Médica 📅',
    globalStyles: {
      backgroundColor: '#f1f5f9',
      containerColor: '#ffffff',
      textColor: '#1e293b',
      fontFamily: 'Inter, sans-serif',
      borderRadius: 16,
      padding: 32
    },
    variables: [
      { id: 'medr1', key: 'doctorName', value: 'Dr. Carlos Mendes', description: 'Nome do médico destinatário' },
      { id: 'medr2', key: 'meetingDate', value: '12 de Julho de 2026', description: 'Data da visita/reunião' },
      { id: 'medr3', key: 'meetingTime', value: '14:30', description: 'Horário do compromisso' },
      { id: 'medr4', key: 'meetingLocation', value: 'Consultório 302 (Bloco B) ou meet.google.com/xyz-abc-123', description: 'Local físico ou link da vídeo-reunião' },
      { id: 'medr5', key: 'repName', value: 'Beatriz Silva', description: 'Nome da representante comercial' },
      { id: 'medr6', key: 'repEmail', value: 'beatriz.silva@medpharma.com', description: 'Email de contato da representante' },
      { id: 'medr7', key: 'repPhone', value: '+55 (11) 98765-4321', description: 'Telefone de contato da representante' },
      { id: 'medr8', key: 'repRole', value: 'Consultora Científica Sênior', description: 'Cargo da representante na empresa' }
    ],
    elements: [
      {
        id: 'medr_head',
        type: 'heading',
        content: 'Confirmação de Reunião Científica 🩺',
        styles: {
          fontSize: 22,
          fontWeight: 'bold',
          textColor: '#0284c7',
          align: 'center',
          marginBottom: 16
        }
      },
      {
        id: 'medr_intro',
        type: 'text',
        content: 'Olá, **{{doctorName}}**,\n\nConfirmamos o agendamento da nossa próxima reunião científica de atualização terapêutica. Seguem abaixo todos os detalhes do compromisso, bem como os contatos do representante técnico responsável por sua região:',
        styles: {
          fontSize: 14,
          textColor: '#334155',
          align: 'left',
          marginBottom: 24
        }
      },
      {
        id: 'medr_grid',
        type: 'grid',
        content: '',
        styles: {
          backgroundColor: '#f8fafc',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#e2e8f0',
          paddingTop: 16,
          paddingBottom: 16,
          paddingLeft: 16,
          paddingRight: 16,
          marginBottom: 24
        },
        rowsCount: 1,
        colsCount: 2,
        gridCells: {
          '0-0': [
            {
              id: 'medr_g_h1',
              type: 'heading',
              content: 'Compromisso 📅',
              styles: {
                fontSize: 14,
                fontWeight: 'bold',
                textColor: '#0369a1',
                marginBottom: 12
              }
            },
            {
              id: 'medr_g_t1',
              type: 'text',
              content: '📅 **Data:** {{meetingDate}}\n\n⏰ **Horário:** {{meetingTime}}\n\n📍 **Local/Link:** {{meetingLocation}}',
              styles: {
                fontSize: 12,
                textColor: '#475569',
                marginBottom: 0
              }
            }
          ],
          '0-1': [
            {
              id: 'medr_g_h2',
              type: 'heading',
              content: 'Representante 🧑‍⚕️',
              styles: {
                fontSize: 14,
                fontWeight: 'bold',
                textColor: '#0369a1',
                marginBottom: 12
              }
            },
            {
              id: 'medr_g_t2',
              type: 'text',
              content: '👤 **Nome:** {{repName}}\n\n💼 **Cargo:** {{repRole}}\n\n✉️ **E-mail:** {{repEmail}}\n\n📞 **Tel:** {{repPhone}}',
              styles: {
                fontSize: 12,
                textColor: '#475569',
                marginBottom: 0
              }
            }
          ]
        }
      },
      {
        id: 'medr_sp',
        type: 'spacer',
        content: '',
        styles: {
          height: 8
        }
      },
      {
        id: 'medr_btn',
        type: 'button',
        content: 'Confirmar e Adicionar à Agenda 🗓️',
        href: '#',
        styles: {
          backgroundColor: '#0284c7',
          textColor: '#ffffff',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 'bold',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          align: 'center',
          marginBottom: 20
        }
      },
      {
        id: 'medr_footer',
        type: 'text',
        content: 'Caso precise alterar o horário ou local, por favor entre em contato respondendo a este e-mail ou diretamente com o(a) representante **{{repName}}**.',
        styles: {
          fontSize: 11,
          textColor: '#64748b',
          align: 'center',
          marginBottom: 0
        }
      }
    ],
    visualIdentity: {
      brandColors: [
        { id: 'bc_medr1', name: 'Azul Médico', value: '#0284c7' },
        { id: 'bc_medr2', name: 'Cinza Fundo', value: '#f1f5f9' },
        { id: 'bc_medr3', name: 'Texto Chumbo', value: '#1e293b' }
      ],
      colorRules: [],
      signatureName: 'Beatriz Silva',
      signatureRole: 'Consultora Científica Sênior',
      signatureCompany: 'MedPharma Soluções em Saúde',
      signaturePhone: '+55 (11) 98765-4321',
      signatureColor: '#0284c7'
    }
  },
  {
    id: 'medico_pesquisa',
    name: 'Pesquisa de Satisfação Médica 📝',
    globalStyles: {
      backgroundColor: '#f1f5f9',
      containerColor: '#ffffff',
      textColor: '#1e293b',
      fontFamily: 'Inter, sans-serif',
      borderRadius: 16,
      padding: 32
    },
    variables: [
      { id: 'medp1', key: 'doctorFullName', value: 'Dr. Ricardo Santos', description: 'Nome completo do médico' },
      { id: 'medp2', key: 'doctorCRM', value: 'CRM-SP 123456', description: 'Registro CRM do médico' },
      { id: 'medp3', key: 'doctorSpecialty', value: 'Cardiologia', description: 'Especialidade do médico' },
      { id: 'medp4', key: 'repName', value: 'Beatriz Silva', description: 'Nome da representante' },
      { id: 'medp5', key: 'surveyLink', value: 'https://survey.medpharma.com/satisfaction', description: 'Link para responder a pesquisa de satisfação' }
    ],
    elements: [
      {
        id: 'medp_head',
        type: 'heading',
        content: 'Avaliação do Atendimento Científico 📝',
        styles: {
          fontSize: 22,
          fontWeight: 'bold',
          textColor: '#0f766e',
          align: 'center',
          marginBottom: 16
        }
      },
      {
        id: 'medp_intro',
        type: 'text',
        content: 'Prezado(a) **{{doctorFullName}}**,\n\nSua opinião é fundamental para garantir a excelência no fornecimento de informações científicas e amostras regulamentadas. Gostaríamos de solicitar que responda a esta breve pesquisa de satisfação em relação à visita realizada pela representante **{{repName}}**:',
        styles: {
          fontSize: 14,
          textColor: '#334155',
          align: 'left',
          marginBottom: 24
        }
      },
      {
        id: 'medp_container',
        type: 'container',
        content: '',
        styles: {
          backgroundColor: '#f0fdf4',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#bbf7d0',
          paddingTop: 16,
          paddingBottom: 16,
          paddingLeft: 16,
          paddingRight: 16,
          marginBottom: 24
        },
        children: [
          {
            id: 'medp_c_h1',
            type: 'heading',
            content: 'Resumo da Visita 🩺',
            styles: {
              fontSize: 14,
              fontWeight: 'bold',
              textColor: '#0f766e',
              marginBottom: 12
            }
          },
          {
            id: 'medp_c_t1',
            type: 'text',
            content: '🩺 **Médico:** {{doctorFullName}}\n\n🆔 **CRM:** {{doctorCRM}} | 🎓 **Especialidade:** {{doctorSpecialty}}\n\n👤 **Representante Responsável:** {{repName}}\n\n⏱️ **Tempo Estimado da Pesquisa:** Menos de 2 minutos',
            styles: {
              fontSize: 12,
              textColor: '#166534',
              marginBottom: 0
            }
          }
        ]
      },
      {
        id: 'medp_sp',
        type: 'spacer',
        content: '',
        styles: {
          height: 8
        }
      },
      {
        id: 'medp_btn',
        type: 'button',
        content: 'Realizar Pesquisa de Satisfação 📝',
        href: '{{surveyLink}}',
        styles: {
          backgroundColor: '#0f766e',
          textColor: '#ffffff',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 'bold',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          align: 'center',
          marginBottom: 20
        }
      },
      {
        id: 'medp_footer',
        type: 'text',
        content: 'Agradecemos profundamente pela sua participação e por sua colaboração com o avanço da educação médica continuada.',
        styles: {
          fontSize: 11,
          textColor: '#64748b',
          align: 'center',
          marginBottom: 0
        }
      }
    ],
    visualIdentity: {
      brandColors: [
        { id: 'bc_medp1', name: 'Verde Mar', value: '#0f766e' },
        { id: 'bc_medp2', name: 'Fundo Verde Claro', value: '#f0fdf4' },
        { id: 'bc_medp3', name: 'Borda Verde', value: '#bbf7d0' }
      ],
      colorRules: [],
      signatureName: 'Beatriz Silva',
      signatureRole: 'Consultora Científica Sênior',
      signatureCompany: 'MedPharma Soluções em Saúde',
      signaturePhone: '+55 (11) 98765-4321',
      signatureColor: '#0f766e'
    }
  }
];
