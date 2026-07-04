import React from "react";
import {
  EmailElement,
  EmailVariable,
  EmailTemplate,
  VisualIdentity,
} from "./types";

// Replace placeholders like {{variableName}} with their current values
export function replaceVariables(
  text: string,
  variables: EmailVariable[],
): string {
  if (!text) return "";
  let result = text;
  variables.forEach((variable) => {
    // Escape special characters in key just in case
    const escapedKey = variable.key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`{{\\s*${escapedKey}\\s*}}`, "g");
    result = result.replace(regex, variable.value || `[${variable.key}]`);
  });
  return result;
}

// A robust nested parser that parses Markdown and inline HTML styling tags into React nodes
export function parseFormattedTextToReact(text: string): React.ReactNode {
  if (!text) return "";

  const regexes = [
    {
      name: "fontSizeSpan",
      regex: /<span\s+style="font-size:\s*(\d+)px;?"\s*>([\s\S]*?)<\/span>/i,
      parse: (match: RegExpExecArray) => ({
        content: match[2],
        style: { fontSize: `${match[1]}px` },
      }),
    },
    {
      name: "strongTag",
      regex: /<strong>([\s\S]*?)<\/strong>/i,
      parse: (match: RegExpExecArray) => ({
        content: match[1],
        style: { fontWeight: "bold" as const },
      }),
    },
    {
      name: "bTag",
      regex: /<b>([\s\S]*?)<\/b>/i,
      parse: (match: RegExpExecArray) => ({
        content: match[1],
        style: { fontWeight: "bold" as const },
      }),
    },
    {
      name: "emTag",
      regex: /<em>([\s\S]*?)<\/em>/i,
      parse: (match: RegExpExecArray) => ({
        content: match[1],
        style: { fontStyle: "italic" as const },
      }),
    },
    {
      name: "iTag",
      regex: /<i>([\s\S]*?)<\/i>/i,
      parse: (match: RegExpExecArray) => ({
        content: match[1],
        style: { fontStyle: "italic" as const },
      }),
    },
    {
      name: "uTag",
      regex: /<u>([\s\S]*?)<\/u>/i,
      parse: (match: RegExpExecArray) => ({
        content: match[1],
        style: { textDecoration: "underline" as const },
      }),
    },
    {
      name: "strikeTag",
      regex: /<strike>([\s\S]*?)<\/strike>/i,
      parse: (match: RegExpExecArray) => ({
        content: match[1],
        style: { textDecoration: "line-through" as const },
      }),
    },
    {
      name: "sTag",
      regex: /<s>([\s\S]*?)<\/s>/i,
      parse: (match: RegExpExecArray) => ({
        content: match[1],
        style: { textDecoration: "line-through" as const },
      }),
    },
    {
      name: "boldMarkdown",
      regex: /\*\*([\s\S]*?)\*\*/,
      parse: (match: RegExpExecArray) => ({
        content: match[1],
        style: { fontWeight: "bold" as const },
      }),
    },
    {
      name: "italicMarkdown",
      regex: /\*([\s\S]*?)\*/,
      parse: (match: RegExpExecArray) => ({
        content: match[1],
        style: { fontStyle: "italic" as const },
      }),
    },
    {
      name: "italicMarkdownUnderscore",
      regex: /_([\s\S]*?)_/,
      parse: (match: RegExpExecArray) => ({
        content: match[1],
        style: { fontStyle: "italic" as const },
      }),
    },
    {
      name: "underlineMarkdown",
      regex: /__([\s\S]*?)__/,
      parse: (match: RegExpExecArray) => ({
        content: match[1],
        style: { textDecoration: "underline" as const },
      }),
    },
    {
      name: "strikeMarkdown",
      regex: /~~([\s\S]*?)~~/,
      parse: (match: RegExpExecArray) => ({
        content: match[1],
        style: { textDecoration: "line-through" as const },
      }),
    },
  ];

  function parseSegment(str: string): React.ReactNode {
    if (!str) return "";

    let earliestMatch: {
      index: number;
      length: number;
      content: string;
      style?: React.CSSProperties;
    } | null = null;

    for (const rule of regexes) {
      const match = rule.regex.exec(str);
      if (match) {
        if (earliestMatch === null || match.index < earliestMatch.index) {
          const parsed = rule.parse(match);
          earliestMatch = {
            index: match.index,
            length: match[0].length,
            content: parsed.content,
            style: parsed.style,
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
      "span",
      { style: earliestMatch.style, key: Math.random() },
      parseSegment(middleContent),
    );

    return React.createElement(
      React.Fragment,
      { key: Math.random() },
      parseSegment(left),
      middleNode,
      parseSegment(right),
    );
  }

  return parseSegment(text);
}

// Check if a string contains any of the variables
export function highlightVariablesInEditor(
  text: string,
  variables: EmailVariable[],
): string {
  if (!text) return "";
  let result = text;
  // Temporary escape HTML tags to prevent breaking
  result = result
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  variables.forEach((variable) => {
    const escapedKey = variable.key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`({{\\s*${escapedKey}\\s*}})`, "g");
    result = result.replace(
      regex,
      `<span class="bg-blue-100 text-blue-700 px-1 rounded font-mono text-xs border border-blue-200" title="Variável: ${variable.description}">$1</span>`,
    );
  });
  return result;
}

// Generate the React Email code with Tailwind configured
export function generateReactEmailCode(
  template: EmailTemplate,
  options?: {
    format?: "tsx" | "jsx";
    staticVariables?: boolean;
    variableValues?: Record<string, string>;
  },
): string {
  const { elements, variables, globalStyles } = template;
  const isTsx = (options?.format || "tsx") === "tsx";
  const isStatic = !!options?.staticVariables;
  const values = options?.variableValues || {};

  // 1. Setup Prop interface
  const propTypes = variables.map((v) => `  ${v.key}?: string;`).join("\n");
  const destructuring = variables
    .map((v) => {
      const val = values[v.key] !== undefined ? values[v.key] : v.value || "";
      return `  ${v.key} = "${val.replace(/"/g, '\\"')}"`;
    })
    .join(",\n");

  // 2. Setup Default Props
  const defaultPropsObj = variables
    .map((v) => {
      const val = values[v.key] !== undefined ? values[v.key] : v.value || "";
      return `  ${v.key}: "${val.replace(/"/g, '\\"')}",`;
    })
    .join("\n");

  // Convert an element's custom style into Tailwind classes or inline styles
  const getTailwindClasses = (el: EmailElement): string => {
    const classes: string[] = [];
    const styles = el.styles;

    // Alignment
    if (styles.align === "center") classes.push("text-center");
    if (styles.align === "right") classes.push("text-right");
    if (styles.align === "left") classes.push("text-left");

    // Font weights
    if (styles.fontWeight === "bold") classes.push("font-bold");
    if (styles.fontWeight === "semibold") classes.push("font-semibold");
    if (styles.fontWeight === "medium") classes.push("font-medium");

    // Margin bottom
    if (styles.marginBottom !== undefined) {
      const mb = styles.marginBottom;
      if (mb <= 4) classes.push("mb-1");
      else if (mb <= 8) classes.push("mb-2");
      else if (mb <= 12) classes.push("mb-3");
      else if (mb <= 16) classes.push("mb-4");
      else if (mb <= 24) classes.push("mb-6");
      else if (mb <= 32) classes.push("mb-8");
      else if (mb <= 48) classes.push("mb-12");
      else classes.push(`mb-[${mb}px]`);
    }

    // Margin top
    if (styles.marginTop !== undefined) {
      const mt = styles.marginTop;
      if (mt <= 4) classes.push("mt-1");
      else if (mt <= 8) classes.push("mt-2");
      else if (mt <= 12) classes.push("mt-3");
      else if (mt <= 16) classes.push("mt-4");
      else if (mt <= 24) classes.push("mt-6");
      else if (mt <= 32) classes.push("mt-8");
      else classes.push(`mt-[${mt}px]`);
    }

    return classes.join(" ");
  };

  // Convert custom style properties into a JSON/JSX style object
  const getInlineStyles = (el: EmailElement): string => {
    const styles = el.styles;
    const styleObj: Record<string, string | number> = {};

    if (styles.textColor) styleObj.color = styles.textColor;
    if (
      styles.backgroundColor &&
      el.type !== "divider" &&
      el.type !== "spacer"
    ) {
      styleObj.backgroundColor = styles.backgroundColor;
    }
    if (styles.fontSize) styleObj.fontSize = `${styles.fontSize}px`;
    if (styles.borderRadius !== undefined)
      styleObj.borderRadius = `${styles.borderRadius}px`;
    if (styles.borderWidth !== undefined) {
      styleObj.borderStyle = "solid";
      styleObj.borderWidth = `${styles.borderWidth}px`;
      if (styles.borderColor) styleObj.borderColor = styles.borderColor;
    }

    // Padding settings
    if (styles.paddingTop !== undefined)
      styleObj.paddingTop = `${styles.paddingTop}px`;
    if (styles.paddingBottom !== undefined)
      styleObj.paddingBottom = `${styles.paddingBottom}px`;
    if (styles.paddingLeft !== undefined)
      styleObj.paddingLeft = `${styles.paddingLeft}px`;
    if (styles.paddingRight !== undefined)
      styleObj.paddingRight = `${styles.paddingRight}px`;

    if (el.type === "button") {
      styleObj.display = "inline-block";
      styleObj.textDecoration = "none";
      if (!styles.paddingTop) styleObj.paddingTop = "12px";
      if (!styles.paddingBottom) styleObj.paddingBottom = "12px";
      if (!styles.paddingLeft) styleObj.paddingLeft = "24px";
      if (!styles.paddingRight) styleObj.paddingRight = "24px";
    }

    if (Object.keys(styleObj).length === 0) return "";
    return ` style={${JSON.stringify(styleObj, null, 2).replace(/\n/g, "\n      ")}}`;
  };

  // Helpers to replace React props variables inside TSX output
  const formatTextForReact = (text: string): string => {
    if (!text) return '""';
    let formatted = text;

    if (isStatic) {
      variables.forEach((v) => {
        const val = values[v.key] !== undefined ? values[v.key] : v.value || "";
        const regex = new RegExp(`{{\\s*${v.key}\\s*}}`, "g");
        formatted = formatted.replace(regex, val);
      });
      return `"${formatted.replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
    } else {
      variables.forEach((v) => {
        const regex = new RegExp(`{{\\s*${v.key}\\s*}}`, "g");
        formatted = formatted.replace(regex, `\${${v.key}}`);
      });

      if (formatted !== text) {
        return `{\`${formatted.replace(/`/g, "\\`").replace(/\n/g, "\\n")}\`}`;
      }
      return `"${text.replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
    }
  };

  const formatTextChildForReact = (text: string): string => {
    if (!text) return "";
    let formatted = text;

    // Convert variables
    if (isStatic) {
      variables.forEach((v) => {
        const val = values[v.key] !== undefined ? values[v.key] : v.value || "";
        const regex = new RegExp(`{{\\s*${v.key}\\s*}}`, "g");
        formatted = formatted.replace(regex, val);
      });
    } else {
      variables.forEach((v) => {
        const regex = new RegExp(`{{\\s*${v.key}\\s*}}`, "g");
        formatted = formatted.replace(regex, `{${v.key}}`);
      });
    }

    // Translate markdown / HTML elements into JSX
    formatted = formatted
      // Bold
      .replace(/\*\*([\s\S]*?)\*\*/g, "<strong>$1</strong>")
      // Italic
      .replace(/\*([\s\S]*?)\*/g, "<em>$1</em>")
      .replace(/_([\s\S]*?)_/g, "<em>$1</em>")
      // Strikethrough
      .replace(/~~([\s\S]*?)~~/g, "<strike>$1</strike>")
      // Underline
      .replace(/__([\s\S]*?)__/g, "<u>$1</u>")
      // Custom span inline style for font size
      .replace(
        /<span\s+style="font-size:\s*(\d+)px;?"\s*>([\s\S]*?)<\/span>/gi,
        "<span style={{ fontSize: '$1px' }}>$2</span>",
      );

    return formatted;
  };

  // 3. Generate HTML/TSX string for elements (recursive to support container and grid)
  const compileElementToTSX = (el: EmailElement): string => {
    const twClass = getTailwindClasses(el);
    const inlineStyle = getInlineStyles(el);
    const twAttr = twClass ? ` className="${twClass}"` : "";

    switch (el.type) {
      case "heading": {
        const textChild = formatTextChildForReact(el.content);
        return `            <Heading${twAttr}${inlineStyle}>\n              ${textChild}\n            </Heading>`;
      }
      case "text": {
        const paragraphs = el.content.split("\n\n");
        return paragraphs
          .map((p) => {
            const textChild = formatTextChildForReact(p);
            return `            <Text${twAttr}${inlineStyle}>\n              ${textChild}\n            </Text>`;
          })
          .join("\n");
      }
      case "button": {
        const textChild = formatTextChildForReact(el.content);
        const buttonHref = formatTextForReact(el.href || "#");
        const alignment = el.styles.align || "center";
        let containerTw = "text-center";
        if (alignment === "left") containerTw = "text-left";
        if (alignment === "right") containerTw = "text-right";

        return `            <Section className="${containerTw}">\n              <Button${twAttr}${inlineStyle} href=${buttonHref}>\n                ${textChild}\n              </Button>\n            </Section>`;
      }
      case "image": {
        const imageSrc = formatTextForReact(
          el.src ||
            "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop",
        );
        const imageAlt = el.alt
          ? ` alt="${el.alt.replace(/"/g, '\\"')}"`
          : ' alt="Template Image"';
        const widthVal = el.styles.width
          ? ` width="${el.styles.width}"`
          : ' width="100%"';
        const heightVal = el.styles.height
          ? ` height="${el.styles.height}"`
          : "";
        const alignVal = el.styles.align
          ? ` align="${el.styles.align}"`
          : ' align="center"';
        const imgStyles: Record<string, string | number> = {};
        if (el.styles.borderRadius)
          imgStyles.borderRadius = `${el.styles.borderRadius}px`;
        const imgStyleStr =
          Object.keys(imgStyles).length > 0
            ? ` style={${JSON.stringify(imgStyles)}}`
            : "";

        const baseImg = `<Img${twAttr}${imgStyleStr} src=${imageSrc}${imageAlt}${widthVal}${heightVal}${alignVal} />`;
        if (el.href) {
          const linkHref = formatTextForReact(el.href);
          return `            <Link href=${linkHref} className="block">\n              ${baseImg}\n            </Link>`;
        }
        return `            ${baseImg}`;
      }
      case "link": {
        const textChild = formatTextChildForReact(el.content);
        const linkHref = formatTextForReact(el.href || "#");
        return `            <Link${twAttr}${inlineStyle} href=${linkHref}>\n              ${textChild}\n            </Link>`;
      }
      case "divider": {
        const borderStyle: Record<string, string | number> = {};
        if (el.styles.borderColor)
          borderStyle.borderColor = el.styles.borderColor;
        if (el.styles.borderWidth)
          borderStyle.borderWidth = `${el.styles.borderWidth}px`;
        const styleStr =
          Object.keys(borderStyle).length > 0
            ? ` style={${JSON.stringify(borderStyle)}}`
            : "";
        return `            <Hr${twAttr}${styleStr} />`;
      }
      case "spacer": {
        const height = el.styles.height || 24;
        return `            <Section style={{ height: '${height}px' }} />`;
      }
      case "container": {
        const containerChildren = (el.children || [])
          .map((child) => compileElementToTSX(child))
          .join("\n");
        return `            <Section${twAttr}${inlineStyle} style={{
              backgroundColor: "${el.styles.backgroundColor || "transparent"}",
              padding: "${el.styles.paddingTop || 16}px ${el.styles.paddingRight || 16}px ${el.styles.paddingBottom || 16}px ${el.styles.paddingLeft || 16}px",
              borderRadius: "${el.styles.borderRadius || 0}px",
              border: "${el.styles.borderWidth ? `${el.styles.borderWidth}px solid ${el.styles.borderColor || "#e2e8f0"}` : "none"}"
            }}>\n              ${containerChildren}\n            </Section>`;
      }
      case "grid": {
        const rows = el.rowsCount || 1;
        const cols = el.colsCount || 2;
        const gridCells = el.gridCells || {};
        let gridRowsTSX = "";
        for (let r = 0; r < rows; r++) {
          gridRowsTSX += `              <Section style={{ display: 'flex' }}>\n`;
          for (let c = 0; c < cols; c++) {
            const cellKey = `${r}-${c}`;
            const cellElements = gridCells[cellKey] || [];
            const cellContentTSX = cellElements
              .map((child) => compileElementToTSX(child))
              .join("\n");
            const colWidthPercent = Math.round(100 / cols);
            gridRowsTSX += `                <Section style={{ width: '${colWidthPercent}%', padding: '8px' }}>\n                  ${cellContentTSX}\n                </Section>\n`;
          }
          gridRowsTSX += `              </Section>\n`;
        }
        return `            <Section${twAttr}${inlineStyle} style={{
          backgroundColor: "${el.styles.backgroundColor || "transparent"}",
          borderRadius: "${el.styles.borderRadius || 0}px",
          border: "${el.styles.borderWidth ? `${el.styles.borderWidth}px solid ${el.styles.borderColor || "#e2e8f0"}` : "none"}"
        }}>\n              ${gridRowsTSX}\n            </Section>`;
      }
      default:
        return "";
    }
  };

  const elementsCode = elements
    .map((el) => compileElementToTSX(el))
    .join("\n\n");

  // Prop or default setup logic
  const interfaceDeclaration =
    isTsx && !isStatic
      ? `\ninterface EmailTemplateProps {
${propTypes || "  // Sem variáveis definidas"}
}

export const EmailTemplateDefaultProps: EmailTemplateProps = {
${defaultPropsObj || "  // Sem variáveis definidas"}
};\n`
      : "";

  const signature = !isStatic
    ? `export default function EmailTemplate({
${destructuring || "  // Sem variáveis"}
}${isTsx ? ": EmailTemplateProps" : ""})`
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
            marginLeft: "${globalStyles.bodyAlignment === "left" ? "0px" : "auto"}",
            marginRight: "${globalStyles.bodyAlignment === "right" ? "0px" : "auto"}",
            maxWidth: "${globalStyles.hasWidthLimit !== false ? `${globalStyles.bodyWidth || 600}px` : "100%"}",
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
    if (!text) return "";
    let formatted = text;

    // Replace custom elements with inline HTML
    formatted = formatted
      .replace(/\*\*([\s\S]*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([\s\S]*?)\*/g, "<em>$1</em>")
      .replace(/_([\s\S]*?)_/g, "<em>$1</em>")
      .replace(/~~([\s\S]*?)~~/g, "<strike>$1</strike>")
      .replace(/__([\s\S]*?)__/g, "<u>$1</u>")
      .replace(
        /<span\s+style="font-size:\s*(\d+)px;?"\s*>([\s\S]*?)<\/span>/gi,
        '<span style="font-size: $1px;">$2</span>',
      );

    // Replace variable placeholders with values
    variables.forEach((v) => {
      const regex = new RegExp(`{{\\s*${v.key}\\s*}}`, "g");
      formatted = formatted.replace(regex, v.value || `[${v.key}]`);
    });

    return formatted;
  };

  const getElementStyles = (el: EmailElement): string => {
    const styles = el.styles;
    const styleParts: string[] = [];

    if (styles.textColor) styleParts.push(`color: ${styles.textColor}`);
    if (
      styles.backgroundColor &&
      el.type !== "divider" &&
      el.type !== "spacer"
    ) {
      styleParts.push(`background-color: ${styles.backgroundColor}`);
    }
    if (styles.fontSize) styleParts.push(`font-size: ${styles.fontSize}px`);

    // Individual border radius (canto a canto) or standard border radius
    if (styles.borderRadiusTopLeft !== undefined)
      styleParts.push(
        `border-top-left-radius: ${styles.borderRadiusTopLeft}px`,
      );
    if (styles.borderRadiusTopRight !== undefined)
      styleParts.push(
        `border-top-right-radius: ${styles.borderRadiusTopRight}px`,
      );
    if (styles.borderRadiusBottomLeft !== undefined)
      styleParts.push(
        `border-bottom-left-radius: ${styles.borderRadiusBottomLeft}px`,
      );
    if (styles.borderRadiusBottomRight !== undefined)
      styleParts.push(
        `border-bottom-right-radius: ${styles.borderRadiusBottomRight}px`,
      );
    if (
      styles.borderRadius !== undefined &&
      styles.borderRadiusTopLeft === undefined
    ) {
      styleParts.push(`border-radius: ${styles.borderRadius}px`);
    }

    if (styles.borderWidth !== undefined) {
      styleParts.push(
        `border: ${styles.borderWidth}px solid ${styles.borderColor || "#000000"}`,
      );
    }

    // Individual paddings
    if (styles.paddingTop !== undefined)
      styleParts.push(`padding-top: ${styles.paddingTop}px`);
    if (styles.paddingBottom !== undefined)
      styleParts.push(`padding-bottom: ${styles.paddingBottom}px`);
    if (styles.paddingLeft !== undefined)
      styleParts.push(`padding-left: ${styles.paddingLeft}px`);
    if (styles.paddingRight !== undefined)
      styleParts.push(`padding-right: ${styles.paddingRight}px`);

    // Individual margins
    if (styles.marginTop !== undefined)
      styleParts.push(`margin-top: ${styles.marginTop}px`);
    if (styles.marginBottom !== undefined)
      styleParts.push(`margin-bottom: ${styles.marginBottom}px`);
    if (styles.marginLeft !== undefined)
      styleParts.push(`margin-left: ${styles.marginLeft}px`);
    if (styles.marginRight !== undefined)
      styleParts.push(`margin-right: ${styles.marginRight}px`);

    if (styles.align) {
      styleParts.push(`text-align: ${styles.align}`);
    }

    return styleParts.join("; ");
  };

  const compileElementToHtml = (el: EmailElement): string => {
    const inlineStyle = getElementStyles(el);
    const alignAttr = el.styles.align ? ` align="${el.styles.align}"` : "";

    switch (el.type) {
      case "heading": {
        const textChild = formatTextForHtml(el.content);
        return `            <!-- Heading -->
            <tr>
              <td style="padding: 0; margin: 0;${inlineStyle ? " " + inlineStyle : ""}"${alignAttr}>
                <h1 style="margin: 0; font-family: inherit; font-size: inherit; font-weight: inherit; color: inherit; line-height: 1.3;">
                  ${textChild}
                </h1>
              </td>
            </tr>`;
      }
      case "text": {
        const paragraphs = el.content.split("\n\n");
        return paragraphs
          .map((p) => {
            const textChild = formatTextForHtml(p);
            return `            <!-- Text Paragraph -->
            <tr>
              <td style="padding: 0; margin: 0;${inlineStyle ? " " + inlineStyle : ""}"${alignAttr}>
                <p style="margin: 0; font-family: inherit; font-size: inherit; color: inherit; line-height: 1.5;">
                  ${textChild}
                </p>
              </td>
            </tr>`;
          })
          .join("\n");
      }
      case "button": {
        const textChild = formatTextForHtml(el.content);
        const alignment = el.styles.align || "center";

        return `            <!-- Button -->
            <tr>
              <td align="${alignment}" style="padding: 0; margin: 0;">
                <table border="0" cellspacing="0" cellpadding="0" style="margin-top: ${el.styles.marginTop || 0}px; margin-bottom: ${el.styles.marginBottom || 16}px; margin-left: ${el.styles.marginLeft || 0}px; margin-right: ${el.styles.marginRight || 0}px;">
                  <tr>
                    <td align="center" style="margin: 0;">
                      <a href="${el.href || "#"}" target="_blank" style="display: inline-block; font-family: inherit; font-size: ${el.styles.fontSize || 16}px; font-weight: ${el.styles.fontWeight || "semibold"}; color: ${el.styles.textColor || "#ffffff"}; background-color: ${el.styles.backgroundColor || "#2563eb"}; text-decoration: none; border-top-left-radius: ${el.styles.borderRadiusTopLeft ?? el.styles.borderRadius ?? 8}px; border-top-right-radius: ${el.styles.borderRadiusTopRight ?? el.styles.borderRadius ?? 8}px; border-bottom-left-radius: ${el.styles.borderRadiusBottomLeft ?? el.styles.borderRadius ?? 8}px; border-bottom-right-radius: ${el.styles.borderRadiusBottomRight ?? el.styles.borderRadius ?? 8}px; padding-top: ${el.styles.paddingTop ?? 12}px; padding-bottom: ${el.styles.paddingBottom ?? 12}px; padding-left: ${el.styles.paddingLeft ?? 24}px; padding-right: ${el.styles.paddingRight ?? 24}px; border: ${el.styles.borderWidth ? `${el.styles.borderWidth}px solid ${el.styles.borderColor || "#000000"}` : "none"};">
                        ${textChild}
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`;
      }
      case "image": {
        const imgStyles: string[] = [];
        if (el.styles.borderRadiusTopLeft !== undefined)
          imgStyles.push(
            `border-top-left-radius: ${el.styles.borderRadiusTopLeft}px`,
          );
        if (el.styles.borderRadiusTopRight !== undefined)
          imgStyles.push(
            `border-top-right-radius: ${el.styles.borderRadiusTopRight}px`,
          );
        if (el.styles.borderRadiusBottomLeft !== undefined)
          imgStyles.push(
            `border-bottom-left-radius: ${el.styles.borderRadiusBottomLeft}px`,
          );
        if (el.styles.borderRadiusBottomRight !== undefined)
          imgStyles.push(
            `border-bottom-right-radius: ${el.styles.borderRadiusBottomRight}px`,
          );
        if (
          el.styles.borderRadius !== undefined &&
          el.styles.borderRadiusTopLeft === undefined
        ) {
          imgStyles.push(`border-radius: ${el.styles.borderRadius}px`);
        }
        if (el.styles.marginTop !== undefined)
          imgStyles.push(`margin-top: ${el.styles.marginTop}px`);
        if (el.styles.marginBottom !== undefined)
          imgStyles.push(`margin-bottom: ${el.styles.marginBottom}px`);
        if (el.styles.marginLeft !== undefined)
          imgStyles.push(`margin-left: ${el.styles.marginLeft}px`);
        if (el.styles.marginRight !== undefined)
          imgStyles.push(`margin-right: ${el.styles.marginRight}px`);

        const widthVal = el.styles.width ? `${el.styles.width}` : "500";
        const heightVal = el.styles.height
          ? ` height="${el.styles.height}"`
          : "";
        const alignment = el.styles.align || "center";

        const baseImg = `<img src="${el.src || "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop"}" alt="${el.alt || "Image"}" width="${widthVal}"${heightVal} style="display: block; max-width: 100%; border: 0;${imgStyles.length > 0 ? " " + imgStyles.join("; ") : ""}" />`;

        return `            <!-- Image -->
            <tr>
              <td align="${alignment}" style="padding: 0; margin: 0;">
                ${el.href ? `<a href="${el.href}" target="_blank" style="display: block; text-decoration: none;">${baseImg}</a>` : baseImg}
              </td>
            </tr>`;
      }
      case "link": {
        const textChild = formatTextForHtml(el.content);
        return `            <!-- Link -->
            <tr>
              <td style="padding: 0; margin: 0;${inlineStyle ? " " + inlineStyle : ""}"${alignAttr}>
                <a href="${el.href || "#"}" target="_blank" style="color: ${el.styles.textColor || "#2563eb"}; text-decoration: underline;">
                  ${textChild}
                </a>
              </td>
            </tr>`;
      }
      case "divider": {
        const bColor = el.styles.borderColor || "#e2e8f0";
        const bWidth = el.styles.borderWidth || 1;
        const mt = el.styles.marginTop !== undefined ? el.styles.marginTop : 12;
        const mb =
          el.styles.marginBottom !== undefined ? el.styles.marginBottom : 20;
        return `            <!-- Divider -->
            <tr>
              <td style="padding: 0; margin: 0; padding-top: ${mt}px; padding-bottom: ${mb}px;">
                <table border="0" cellspacing="0" cellpadding="0" width="100%">
                  <tr>
                    <td style="border-top: ${bWidth}px solid ${bColor}; font-size: 0; line-height: 0;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>`;
      }
      case "spacer": {
        const height = el.styles.height || 24;
        return `            <!-- Spacer -->
            <tr>
              <td style="font-size: 0; line-height: 0; height: ${height}px; padding: 0; margin: 0;">&nbsp;</td>
            </tr>`;
      }
      case "container": {
        const childrenHtml = (el.children || [])
          .map((child) => compileElementToHtml(child))
          .join("\n");
        const containerBg = el.styles.backgroundColor
          ? `background-color: ${el.styles.backgroundColor};`
          : "";
        const containerPadding = `padding-top: ${el.styles.paddingTop ?? 16}px; padding-bottom: ${el.styles.paddingBottom ?? 16}px; padding-left: ${el.styles.paddingLeft ?? 16}px; padding-right: ${el.styles.paddingRight ?? 16}px;`;
        const containerBorder = el.styles.borderWidth
          ? `border: ${el.styles.borderWidth}px solid ${el.styles.borderColor || "#e2e8f0"};`
          : "";
        const containerRadius = el.styles.borderRadius
          ? `border-radius: ${el.styles.borderRadius}px;`
          : "";
        const containerMargin = `margin-top: ${el.styles.marginTop ?? 0}px; margin-bottom: ${el.styles.marginBottom ?? 16}px;`;

        return `            <!-- Container -->
            <tr>
              <td style="padding: 0; margin: 0;">
                <table border="0" cellspacing="0" cellpadding="0" width="100%" style="width: 100%; ${containerBg} ${containerPadding} ${containerBorder} ${containerRadius} ${containerMargin}">
                  ${childrenHtml}
                </table>
              </td>
            </tr>`;
      }
      case "grid": {
        const rows = el.rowsCount || 1;
        const cols = el.colsCount || 2;
        const gridCells = el.gridCells || {};

        const gridBg = el.styles.backgroundColor
          ? `background-color: ${el.styles.backgroundColor};`
          : "";
        const gridPadding = `padding-top: ${el.styles.paddingTop ?? 8}px; padding-bottom: ${el.styles.paddingBottom ?? 8}px; padding-left: ${el.styles.paddingLeft ?? 8}px; padding-right: ${el.styles.paddingRight ?? 8}px;`;
        const gridBorder = el.styles.borderWidth
          ? `border: ${el.styles.borderWidth}px solid ${el.styles.borderColor || "#e2e8f0"};`
          : "";
        const gridRadius = el.styles.borderRadius
          ? `border-radius: ${el.styles.borderRadius}px;`
          : "";
        const gridMargin = `margin-top: ${el.styles.marginTop ?? 0}px; margin-bottom: ${el.styles.marginBottom ?? 16}px;`;

        let gridRowsHtml = "";
        for (let r = 0; r < rows; r++) {
          gridRowsHtml += `                  <tr>\n`;
          for (let c = 0; c < cols; c++) {
            const cellKey = `${r}-${c}`;
            const cellElements = gridCells[cellKey] || [];
            const cellContentHtml = cellElements
              .map((child) => compileElementToHtml(child))
              .join("\n");
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
              <td style="padding: 0; margin: 0;">
                <table border="0" cellspacing="0" cellpadding="0" width="100%" style="width: 100%; table-layout: fixed; ${gridBg} ${gridPadding} ${gridBorder} ${gridRadius} ${gridMargin}">
                  ${gridRowsHtml}
                </table>
              </td>
            </tr>`;
      }
      default:
        return "";
    }
  };

  const elementsHtml = elements
    .map((el) => compileElementToHtml(el))
    .join("\n\n");

  const widthLimitStyle =
    globalStyles.hasWidthLimit !== false
      ? `max-width: ${globalStyles.bodyWidth || 600}px;`
      : "width: 100%;";
  const alignStyle =
    globalStyles.bodyAlignment === "left"
      ? "margin-right: auto; margin-left: 0;"
      : globalStyles.bodyAlignment === "right"
        ? "margin-left: auto; margin-right: 0;"
        : "margin-left: auto; margin-right: auto;";
  const marginStyle = `margin-top: ${globalStyles.bodyMarginTop ?? 40}px; margin-bottom: ${globalStyles.bodyMarginBottom ?? 40}px;`;
  const alignAttrVal = globalStyles.bodyAlignment || "center";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Email Template</title>
  <!--[if mso]>
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
    <table border="0" align="${alignAttrVal}" cellspacing="0" cellpadding="0" width="100%" style="${widthLimitStyle} background-color: ${globalStyles.containerColor}; border-radius: ${globalStyles.borderRadius}px; border: 1px solid #eaeaea; color: ${globalStyles.textColor}; text-align: left; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); ${marginStyle} ${alignStyle}">
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
    id: "welcome",
    name: "Boas-vindas para Novos Usuários",
    globalStyles: {
      backgroundColor: "#f8fafc",
      containerColor: "#ffffff",
      textColor: "#1e293b",
      fontFamily: "system-ui, -apple-system, sans-serif",
      borderRadius: 12,
      padding: 32,
    },
    variables: [
      {
        id: "1",
        key: "userName",
        value: "Gabrielle Gouveia",
        description: "Nome do usuário recém-cadastrado",
      },
      {
        id: "2",
        key: "appUrl",
        value: "https://meuapp.com",
        description: "URL de acesso ao aplicativo",
      },
      {
        id: "3",
        key: "supportEmail",
        value: "suporte@meuapp.com",
        description: "Email de contato para suporte",
      },
    ],
    elements: [
      {
        id: "img_hero",
        type: "image",
        content: "",
        src: "https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=600&auto=format&fit=crop&q=80",
        alt: "Welcome Hero Banner",
        styles: {
          width: 536,
          height: 180,
          borderRadius: 8,
          marginBottom: 24,
          align: "center",
        },
      },
      {
        id: "head_1",
        type: "heading",
        content: "Bem-vinda ao time, {{userName}}! 🎉",
        styles: {
          fontSize: 24,
          fontWeight: "bold",
          textColor: "#0f172a",
          align: "center",
          marginBottom: 16,
        },
      },
      {
        id: "txt_1",
        type: "text",
        content:
          "Estamos extremamente felizes em ter você conosco! Sua conta já foi ativada com sucesso e você está pronta para explorar todos os nossos recursos exclusivos.\n\nPreparamos um guia interativo para você começar com o pé direito. Clique no botão abaixo para acessar o painel:",
        styles: {
          fontSize: 15,
          textColor: "#334155",
          align: "left",
          marginBottom: 24,
        },
      },
      {
        id: "btn_1",
        type: "button",
        content: "Acessar Meu Painel",
        href: "{{appUrl}}/dashboard",
        styles: {
          backgroundColor: "#2563eb",
          textColor: "#ffffff",
          borderRadius: 8,
          fontSize: 16,
          fontWeight: "semibold",
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          align: "center",
          marginBottom: 24,
        },
      },
      {
        id: "div_1",
        type: "divider",
        content: "",
        styles: {
          borderColor: "#e2e8f0",
          borderWidth: 1,
          marginBottom: 20,
          marginTop: 12,
        },
      },
      {
        id: "txt_2",
        type: "text",
        content:
          "Se você tiver qualquer dúvida ou precisar de ajuda para configurar sua conta, basta responder a este email ou entrar em contato através do {{supportEmail}}.\n\nAbraços,\nEquipe de Sucesso do Cliente",
        styles: {
          fontSize: 13,
          textColor: "#64748b",
          align: "left",
          marginBottom: 0,
        },
      },
    ],
    visualIdentity: {
      brandColors: [
        { id: "bc_wel1", name: "Primária (Indigo)", value: "#2563eb" },
        { id: "bc_wel2", name: "Sucesso (Emerald)", value: "#10b981" },
        { id: "bc_wel3", name: "Atenção (Amber)", value: "#f59e0b" },
        { id: "bc_wel4", name: "Escuro (Slate)", value: "#1e293b" },
      ],
      colorRules: [
        {
          id: "cr_wel1",
          name: "Prioridade Urgente",
          variableName: "userName",
          operator: "equals",
          value: "Gabrielle Gouveia",
          colorIfTrue: "#ef4444",
          colorIfFalse: "#3b82f6",
        },
      ],
      signatureName: "Felipe Sales",
      signatureRole: "Diretor de Design",
      signatureCompany: "InboxFlow Tech",
      signaturePhone: "+55 (11) 98765-4321",
      signatureColor: "#2563eb",
    },
  },
  {
    id: "promo",
    name: "Campanha de Cupom de Desconto",
    globalStyles: {
      backgroundColor: "#f5f5f5",
      containerColor: "#ffffff",
      textColor: "#262626",
      fontFamily: "system-ui, sans-serif",
      borderRadius: 16,
      padding: 40,
    },
    variables: [
      {
        id: "p1",
        key: "userName",
        value: "Mateus",
        description: "Nome do cliente",
      },
      {
        id: "p2",
        key: "discountPercent",
        value: "30%",
        description: "Percentual do desconto",
      },
      {
        id: "p3",
        key: "couponCode",
        value: "FESTIVAL30",
        description: "Código do cupom a ser copiado",
      },
      {
        id: "p4",
        key: "expirationDate",
        value: "15 de Julho",
        description: "Data de expiração da oferta",
      },
    ],
    elements: [
      {
        id: "p_head",
        type: "heading",
        content: "Uma oferta especial para você, {{userName}}! 🏷️",
        styles: {
          fontSize: 26,
          fontWeight: "bold",
          textColor: "#dc2626",
          align: "center",
          marginBottom: 20,
        },
      },
      {
        id: "p_img",
        type: "image",
        content: "",
        src: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&auto=format&fit=crop&q=80",
        alt: "Promo Banner",
        styles: {
          width: 520,
          borderRadius: 12,
          marginBottom: 20,
          align: "center",
        },
      },
      {
        id: "p_txt1",
        type: "text",
        content:
          "Nós sabemos o quanto você ama novidades. Por isso, preparamos um desconto exclusivo de **{{discountPercent}}** em toda a nossa loja virtual!\n\nUse o cupom abaixo durante a finalização da sua compra para obter o desconto:",
        styles: {
          fontSize: 16,
          textColor: "#404040",
          align: "center",
          marginBottom: 20,
        },
      },
      {
        id: "p_btn_coupon",
        type: "button",
        content: "CUPOM: {{couponCode}}",
        href: "https://loja.com?coupon={{couponCode}}",
        styles: {
          backgroundColor: "#171717",
          textColor: "#ffffff",
          borderRadius: 9999,
          fontSize: 18,
          fontWeight: "bold",
          paddingTop: 14,
          paddingBottom: 14,
          paddingLeft: 32,
          paddingRight: 32,
          align: "center",
          marginBottom: 20,
        },
      },
      {
        id: "p_txt2",
        type: "text",
        content:
          "*Atenção: Este cupom é válido até o dia **{{expirationDate}}** e não pode ser cumulativo com outras promoções vigentes.",
        styles: {
          fontSize: 12,
          textColor: "#737373",
          align: "center",
          marginBottom: 0,
        },
      },
    ],
    visualIdentity: {
      brandColors: [
        { id: "bc_pro1", name: "Alerta Vermelho (Primário)", value: "#dc2626" },
        { id: "bc_pro2", name: "Cinza Escuro (Secundário)", value: "#404040" },
        { id: "bc_pro3", name: "Cinza Claro (Fundo)", value: "#f5f5f5" },
        { id: "bc_pro4", name: "Botão Cupom", value: "#171717" },
      ],
      colorRules: [
        {
          id: "cr_pro1",
          name: "Desconto Alto",
          variableName: "discountPercent",
          operator: "contains",
          value: "30%",
          colorIfTrue: "#dc2626",
          colorIfFalse: "#f59e0b",
        },
      ],
      signatureName: "Mariana Lima",
      signatureRole: "Gerente de Growth",
      signatureCompany: "Festival Store",
      signaturePhone: "+55 (11) 97777-1111",
      signatureColor: "#dc2626",
    },
  },
  {
    id: "scheduling",
    name: "Agendamento de Visita",
    globalStyles: {
      backgroundColor: "#f1f5f9",
      containerColor: "#ffffff",
      textColor: "#1e293b",
      fontFamily: "system-ui, sans-serif",
      borderRadius: 16,
      padding: 36,
    },
    variables: [
      {
        id: "v1",
        key: "visitorName",
        value: "Carlos Henrique",
        description: "Nome de quem vai visitar/receber",
      },
      {
        id: "v2",
        key: "visitDate",
        value: "12 de Julho de 2026",
        description: "Data agendada",
      },
      {
        id: "v3",
        key: "visitTime",
        value: "14:30",
        description: "Horário agendado",
      },
      {
        id: "v4",
        key: "locationAddress",
        value: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP",
        description: "Endereço completo da visita",
      },
      {
        id: "v5",
        key: "hostName",
        value: "Sílvia Reis",
        description: "Responsável pela visita",
      },
    ],
    elements: [
      {
        id: "v_head",
        type: "heading",
        content: "Você foi Convidado! 📅✨",
        styles: {
          fontSize: 26,
          fontWeight: "bold",
          textColor: "#4f46e5",
          align: "center",
          marginBottom: 16,
        },
      },
      {
        id: "v_txt1",
        type: "text",
        content:
          "Olá, {{visitorName}}!\n\nVocê tem um convite especial confirmado para nos visitar. Nós e a **{{hostName}}** estamos preparando tudo para te receber com a melhor experiência possível.\n\nConfira todos os detalhes do seu convite:",
        styles: {
          fontSize: 15,
          textColor: "#334155",
          align: "left",
          marginBottom: 20,
        },
      },
      {
        id: "v_info",
        type: "text",
        content:
          "📍 **Local:** {{locationAddress}}\n🗓️ **Data:** {{visitDate}}\n🕒 **Horário:** {{visitTime}}\n👤 **Anfitrião:** {{hostName}}",
        styles: {
          fontSize: 14,
          textColor: "#1e293b",
          align: "left",
          marginBottom: 24,
        },
      },
      {
        id: "v_btn_cal",
        type: "button",
        content: "🗓️ Adicionar ao Meu Calendário",
        href: "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Visita+Confirmada:+{{hostName}}&details=Olá+{{visitorName}},+sua+visita+com+{{hostName}}+está+confirmada!+Local:+{{locationAddress}}&location={{locationAddress}}",
        styles: {
          backgroundColor: "#4f46e5",
          textColor: "#ffffff",
          borderRadius: 8,
          fontSize: 15,
          fontWeight: "semibold",
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          align: "center",
          marginBottom: 12,
        },
      },
      {
        id: "v_btn",
        type: "button",
        content: "🗺️ Ver Rotas no Google Maps",
        href: "https://maps.google.com/?q={{locationAddress}}",
        styles: {
          backgroundColor: "#10b981",
          textColor: "#ffffff",
          borderRadius: 8,
          fontSize: 15,
          fontWeight: "semibold",
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          align: "center",
          marginBottom: 24,
        },
      },
      {
        id: "v_div",
        type: "divider",
        content: "",
        styles: {
          borderColor: "#e2e8f0",
          borderWidth: 1,
          marginBottom: 20,
          marginTop: 12,
        },
      },
      {
        id: "v_txt2",
        type: "text",
        content:
          "Caso ocorra algum imprevisto e precise remarcar, basta nos responder avisando com antecedência. Até breve!",
        styles: {
          fontSize: 12,
          textColor: "#64748b",
          align: "center",
          marginBottom: 0,
        },
      },
    ],
    visualIdentity: {
      brandColors: [
        {
          id: "bc_sch1",
          name: "Roxo Agendamento (Primário)",
          value: "#4f46e5",
        },
        { id: "bc_sch2", name: "Sucesso Verde (Secundário)", value: "#10b981" },
        { id: "bc_sch3", name: "Escuro Slate", value: "#1e293b" },
      ],
      colorRules: [
        {
          id: "cr_sch1",
          name: "Sílvia Reis Responsável",
          variableName: "hostName",
          operator: "equals",
          value: "Sílvia Reis",
          colorIfTrue: "#4f46e5",
          colorIfFalse: "#10b981",
        },
      ],
      signatureName: "Sílvia Reis",
      signatureRole: "Head de Customer Experience",
      signatureCompany: "AgendeFacil",
      signaturePhone: "+55 (11) 96666-2222",
      signatureColor: "#4f46e5",
    },
  },
  {
    id: "otp_code",
    name: "Confirmação por Código (OTP)",
    globalStyles: {
      backgroundColor: "#fafafa",
      containerColor: "#ffffff",
      textColor: "#171717",
      fontFamily: "system-ui, sans-serif",
      borderRadius: 16,
      padding: 36,
    },
    variables: [
      {
        id: "o1",
        key: "userName",
        value: "Rodrigo Santos",
        description: "Nome do usuário",
      },
      {
        id: "o2",
        key: "securityCode",
        value: "849-203",
        description: "Código de uso único gerado",
      },
      {
        id: "o3",
        key: "expirationMinutes",
        value: "10",
        description: "Tempo para expiração do código",
      },
    ],
    elements: [
      {
        id: "o_head",
        type: "heading",
        content: "Código de Confirmação 🔑",
        styles: {
          fontSize: 24,
          fontWeight: "bold",
          textColor: "#1d4ed8",
          align: "center",
          marginBottom: 16,
        },
      },
      {
        id: "o_txt1",
        type: "text",
        content:
          "Olá, {{userName}}!\n\nRecebemos uma solicitação de acesso ou ação de segurança que requer validação. Para prosseguir com segurança, utilize o código de verificação abaixo:",
        styles: {
          fontSize: 15,
          textColor: "#404040",
          align: "left",
          marginBottom: 24,
        },
      },
      {
        id: "o_code_block",
        type: "heading",
        content: "{{securityCode}}",
        styles: {
          fontSize: 36,
          fontWeight: "bold",
          textColor: "#2563eb",
          align: "center",
          marginBottom: 24,
        },
      },
      {
        id: "o_txt2",
        type: "text",
        content:
          "Este código de uso único expira em **{{expirationMinutes}}** minutos. Se você não realizou esta solicitação, por favor ignore este email e garanta que sua senha esteja segura.",
        styles: {
          fontSize: 14,
          textColor: "#525252",
          align: "left",
          marginBottom: 20,
        },
      },
      {
        id: "o_div",
        type: "divider",
        content: "",
        styles: {
          borderColor: "#e5e5e5",
          borderWidth: 1,
          marginBottom: 20,
          marginTop: 12,
        },
      },
      {
        id: "o_txt3",
        type: "text",
        content:
          "Aviso de Segurança: Nunca compartilhe este código com ninguém. Nossa equipe de suporte nunca solicitará este código por telefone ou redes sociais.",
        styles: {
          fontSize: 11,
          textColor: "#737373",
          align: "left",
          marginBottom: 0,
        },
      },
    ],
    visualIdentity: {
      brandColors: [
        { id: "bc_otp1", name: "Azul Segurança (Primário)", value: "#1d4ed8" },
        { id: "bc_otp2", name: "Azul Claro (Secundário)", value: "#2563eb" },
        { id: "bc_otp3", name: "Preto (Fundo)", value: "#171717" },
      ],
      colorRules: [
        {
          id: "cr_otp1",
          name: "Código Secreto",
          variableName: "securityCode",
          operator: "not_equals",
          value: "",
          colorIfTrue: "#2563eb",
          colorIfFalse: "#dc2626",
        },
      ],
      signatureName: "Rodrigo Santos",
      signatureRole: "Lead Security Officer",
      signatureCompany: "SecureAuth",
      signaturePhone: "+55 (11) 95555-3333",
      signatureColor: "#1d4ed8",
    },
  },
  {
    id: "account_created",
    name: "Aviso de Conta Criada",
    globalStyles: {
      backgroundColor: "#f8fafc",
      containerColor: "#ffffff",
      textColor: "#334155",
      fontFamily: "system-ui, sans-serif",
      borderRadius: 12,
      padding: 32,
    },
    variables: [
      {
        id: "ac1",
        key: "userName",
        value: "Luana Costa",
        description: "Nome do usuário",
      },
      {
        id: "ac2",
        key: "userEmail",
        value: "luana.costa@email.com",
        description: "E-mail do usuário cadastrado",
      },
      {
        id: "ac3",
        key: "creationDate",
        value: "04 de Julho de 2026",
        description: "Data de criação da conta",
      },
    ],
    elements: [
      {
        id: "ac_img",
        type: "image",
        content: "",
        src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80",
        alt: "Welcome Graphics",
        styles: {
          width: 536,
          height: 180,
          borderRadius: 8,
          marginBottom: 24,
          align: "center",
        },
      },
      {
        id: "ac_head",
        type: "heading",
        content: "Conta Criada com Sucesso! 🚀",
        styles: {
          fontSize: 24,
          fontWeight: "bold",
          textColor: "#0f172a",
          align: "center",
          marginBottom: 16,
        },
      },
      {
        id: "ac_txt1",
        type: "text",
        content:
          "Olá, {{userName}}!\n\nSeja muito bem-vinda! Sua nova conta foi registrada com sucesso em nossa plataforma no dia {{creationDate}}.\n\nA partir de agora, você tem acesso completo a todas as ferramentas inovadoras para impulsionar seus resultados. Aqui estão seus dados de acesso confirmados:",
        styles: {
          fontSize: 15,
          textColor: "#475569",
          align: "left",
          marginBottom: 20,
        },
      },
      {
        id: "ac_details",
        type: "text",
        content:
          "E-mail cadastrado: {{userEmail}}\nData de registro: {{creationDate}}",
        styles: {
          fontSize: 14,
          textColor: "#1e293b",
          align: "left",
          marginBottom: 24,
        },
      },
      {
        id: "ac_btn",
        type: "button",
        content: "Acessar Minha Conta",
        href: "https://meuapp.com/login",
        styles: {
          backgroundColor: "#4f46e5",
          textColor: "#ffffff",
          borderRadius: 8,
          fontSize: 15,
          fontWeight: "semibold",
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          align: "center",
          marginBottom: 24,
        },
      },
      {
        id: "ac_div",
        type: "divider",
        content: "",
        styles: {
          borderColor: "#f1f5f9",
          borderWidth: 1,
          marginBottom: 20,
          marginTop: 12,
        },
      },
      {
        id: "ac_txt2",
        type: "text",
        content:
          "Para garantir a segurança da sua conta, recomendamos não compartilhar seus dados de acesso e manter uma senha forte e única.",
        styles: {
          fontSize: 12,
          textColor: "#94a3b8",
          align: "left",
          marginBottom: 0,
        },
      },
    ],
    visualIdentity: {
      brandColors: [
        { id: "bc_ac1", name: "Slate Escuro (Primário)", value: "#0f172a" },
        { id: "bc_ac2", name: "Slate Claro (Secundário)", value: "#475569" },
        { id: "bc_ac3", name: "Slate Médio", value: "#1e293b" },
      ],
      colorRules: [
        {
          id: "cr_ac1",
          name: "Verificação Luana",
          variableName: "userName",
          operator: "equals",
          value: "Luana Costa",
          colorIfTrue: "#4f46e5",
          colorIfFalse: "#10b981",
        },
      ],
      signatureName: "Luana Costa",
      signatureRole: "Head of Support",
      signatureCompany: "OnboardFlow",
      signaturePhone: "+55 (11) 94444-4444",
      signatureColor: "#0f172a",
    },
  },
  {
    id: "barebone",
    name: "Barebone (Minimalista Moderno)",
    globalStyles: {
      backgroundColor: "#f4f4f5",
      containerColor: "#ffffff",
      textColor: "#18181b",
      fontFamily:
        'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      borderRadius: 12,
      padding: 36,
      bodyWidth: 600,
      hasWidthLimit: true,
      bodyAlignment: "center",
    },
    variables: [
      {
        id: "bb1",
        key: "userName",
        value: "Guilherme",
        description: "Nome do usuário",
      },
      {
        id: "bb2",
        key: "productName",
        value: "Barebone SaaS",
        description: "Nome do produto",
      },
    ],
    elements: [
      {
        id: "bb_logo_row",
        type: "grid",
        content: "",
        rowsCount: 1,
        colsCount: 2,
        gridCells: {
          "0-0": [
            {
              id: "bb_logo_shape",
              type: "heading",
              content: "⚄",
              styles: {
                fontSize: 24,
                fontWeight: "bold",
                textColor: "#18181b",
                align: "left",
                marginBottom: 0,
              },
            },
          ],
          "0-1": [
            {
              id: "bb_brand_name",
              type: "text",
              content: "Barebones",
              styles: {
                fontSize: 14,
                fontWeight: "semibold",
                textColor: "#71717a",
                align: "right",
                marginBottom: 0,
                marginTop: 4,
              },
            },
          ],
        },
        styles: {
          backgroundColor: "transparent",
          borderRadius: 0,
          borderWidth: 0,
          borderColor: "transparent",
          marginTop: 0,
          marginBottom: 32,
          paddingTop: 0,
          paddingBottom: 12,
          paddingLeft: 0,
          paddingRight: 0,
        },
      },
      {
        id: "bb_title",
        type: "heading",
        content: "Here's what's new\nwith Barebone ✦",
        styles: {
          fontSize: 32,
          fontWeight: "bold",
          textColor: "#18181b",
          align: "left",
          marginBottom: 16,
        },
      },
      {
        id: "bb_intro",
        type: "text",
        content:
          "Olá, {{userName}}!\n\nWe shipped a new release that has been requested for months. Check out the key updates below to see how you can work faster and build smarter with your team.",
        styles: {
          fontSize: 15,
          textColor: "#52525b",
          align: "left",
          marginBottom: 32,
        },
      },
      {
        id: "bb_card_container",
        type: "container",
        content: "",
        children: [
          {
            id: "bb_card_icon",
            type: "heading",
            content: "⚙️",
            styles: {
              fontSize: 28,
              align: "center",
              marginBottom: 12,
            },
          },
          {
            id: "bb_card_title",
            type: "heading",
            content: "Reset your password",
            styles: {
              fontSize: 20,
              fontWeight: "bold",
              textColor: "#18181b",
              align: "center",
              marginBottom: 10,
            },
          },
          {
            id: "bb_card_desc",
            type: "text",
            content:
              "Someone requested a link to change your password for {{productName}}. You can do this through the button below:",
            styles: {
              fontSize: 13,
              textColor: "#71717a",
              align: "center",
              marginBottom: 20,
            },
          },
          {
            id: "bb_card_btn",
            type: "button",
            content: "Change password",
            href: "#",
            styles: {
              backgroundColor: "#18181b",
              textColor: "#ffffff",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: "semibold",
              align: "center",
              paddingTop: 10,
              paddingBottom: 10,
              paddingLeft: 20,
              paddingRight: 20,
              marginBottom: 12,
            },
          },
          {
            id: "bb_card_footer",
            type: "text",
            content:
              "If you didn't request this, you can safely ignore this email.",
            styles: {
              fontSize: 11,
              textColor: "#a1a1aa",
              align: "center",
              marginBottom: 0,
            },
          },
        ],
        styles: {
          backgroundColor: "#ffffff",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#e4e4e7",
          paddingTop: 24,
          paddingBottom: 24,
          paddingLeft: 24,
          paddingRight: 24,
          marginTop: 10,
          marginBottom: 24,
        },
      },
    ],
    visualIdentity: {
      brandColors: [
        { id: "bc_bb1", name: "Zinco Escuro (Primário)", value: "#18181b" },
        { id: "bc_bb2", name: "Zinco Muted (Secundário)", value: "#71717a" },
        { id: "bc_bb3", name: "Zinco Claro (Fundo)", value: "#f4f4f5" },
        { id: "bc_bb4", name: "Linha de Borda", value: "#e4e4e7" },
      ],
      colorRules: [
        {
          id: "cr_bb1",
          name: "Nome Definido",
          variableName: "userName",
          operator: "contains",
          value: "Guilherme",
          colorIfTrue: "#18181b",
          colorIfFalse: "#71717a",
        },
      ],
      signatureName: "Guilherme Sampaio",
      signatureRole: "Lead Product Designer",
      signatureCompany: "Barebone SaaS",
      signaturePhone: "+55 (11) 99999-0001",
      signatureColor: "#18181b",
    },
  },
  {
    id: "matte",
    name: "Matte (Estilo Collage Orgânico)",
    globalStyles: {
      backgroundColor: "#e2ece5",
      containerColor: "#ffffff",
      textColor: "#163f25",
      fontFamily: "Georgia, serif",
      borderRadius: 16,
      padding: 32,
      bodyWidth: 600,
      hasWidthLimit: true,
      bodyAlignment: "center",
    },
    variables: [
      {
        id: "mt1",
        key: "userName",
        value: "Juliana",
        description: "Nome do usuário",
      },
      {
        id: "mt2",
        key: "teamName",
        value: "Design Co.",
        description: "Nome do time",
      },
    ],
    elements: [
      {
        id: "mt_banner",
        type: "image",
        content: "",
        src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
        alt: "Collage Abstract Banner",
        styles: {
          width: 536,
          height: 180,
          borderRadius: 12,
          marginBottom: 24,
          align: "center",
        },
      },
      {
        id: "mt_title",
        type: "heading",
        content: "Try Collage to\ntell your story 🌿",
        styles: {
          fontSize: 28,
          fontWeight: "bold",
          textColor: "#163f25",
          align: "left",
          marginBottom: 16,
        },
      },
      {
        id: "mt_intro",
        type: "text",
        content:
          "Olá, {{userName}}!\n\nCollage is the workspace where {{teamName}} coordinates, plans, and shares. Explore our organic layout design styles built to match clean editorial workflows.",
        styles: {
          fontSize: 14,
          textColor: "#3e5c4a",
          align: "left",
          marginBottom: 24,
        },
      },
      {
        id: "mt_card_container",
        type: "container",
        content: "",
        children: [
          {
            id: "mt_card_title",
            type: "heading",
            content: "Reset your password",
            styles: {
              fontSize: 22,
              fontWeight: "bold",
              textColor: "#163f25",
              align: "left",
              marginBottom: 12,
            },
          },
          {
            id: "mt_card_desc",
            type: "text",
            content:
              "Someone requested a password reset for your account. Use the organic-styled green button below to proceed securely:",
            styles: {
              fontSize: 13,
              textColor: "#3e5c4a",
              align: "left",
              marginBottom: 20,
            },
          },
          {
            id: "mt_card_btn",
            type: "button",
            content: "Change password",
            href: "#",
            styles: {
              backgroundColor: "#163f25",
              textColor: "#ffffff",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: "bold",
              align: "left",
              paddingTop: 10,
              paddingBottom: 10,
              paddingLeft: 18,
              paddingRight: 18,
              marginBottom: 12,
            },
          },
          {
            id: "mt_card_footer",
            type: "text",
            content: "If you didn't request this, please ignore this email.",
            styles: {
              fontSize: 11,
              textColor: "#8ca696",
              align: "left",
              marginBottom: 0,
            },
          },
        ],
        styles: {
          backgroundColor: "#fcfdfd",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#e2ece5",
          paddingTop: 24,
          paddingBottom: 24,
          paddingLeft: 24,
          paddingRight: 24,
          marginTop: 10,
          marginBottom: 20,
        },
      },
    ],
    visualIdentity: {
      brandColors: [
        { id: "bc_mt1", name: "Floresta Verde (Primário)", value: "#163f25" },
        { id: "bc_mt2", name: "Sálvia (Secundário)", value: "#3e5c4a" },
        { id: "bc_mt3", name: "Menta Creme (Fundo)", value: "#e2ece5" },
        { id: "bc_mt4", name: "Folha Opaca (Borda)", value: "#8ca696" },
      ],
      colorRules: [
        {
          id: "cr_mt1",
          name: "Time de Design",
          variableName: "teamName",
          operator: "equals",
          value: "Design Co.",
          colorIfTrue: "#163f25",
          colorIfFalse: "#8ca696",
        },
      ],
      signatureName: "Juliana Mendes",
      signatureRole: "Coordenadora de Criação",
      signatureCompany: "Design Co.",
      signaturePhone: "+55 (11) 98888-0002",
      signatureColor: "#163f25",
    },
  },
  {
    id: "protocol",
    name: "Protocol (Cyber Tech Grotesk)",
    globalStyles: {
      backgroundColor: "#0a0a0c",
      containerColor: "#121214",
      textColor: "#fafafa",
      fontFamily: "monospace",
      borderRadius: 12,
      padding: 32,
      bodyWidth: 600,
      hasWidthLimit: true,
      bodyAlignment: "center",
    },
    variables: [
      {
        id: "pr1",
        key: "userName",
        value: "Arthur",
        description: "Nome do desenvolvedor",
      },
      {
        id: "pr2",
        key: "nodeId",
        value: "node-us-east-12",
        description: "Identificador do servidor",
      },
    ],
    elements: [
      {
        id: "pr_header_row",
        type: "grid",
        content: "",
        rowsCount: 1,
        colsCount: 2,
        gridCells: {
          "0-0": [
            {
              id: "pr_logo",
              type: "heading",
              content: "⧁ PROTOCOL",
              styles: {
                fontSize: 14,
                fontWeight: "bold",
                textColor: "#ffffff",
                align: "left",
                marginBottom: 0,
              },
            },
          ],
          "0-1": [
            {
              id: "pr_meta",
              type: "text",
              content: "SECURE MAIL //",
              styles: {
                fontSize: 11,
                textColor: "#a1a1aa",
                align: "right",
                marginBottom: 0,
                marginTop: 2,
              },
            },
          ],
        },
        styles: {
          backgroundColor: "transparent",
          borderRadius: 0,
          borderWidth: 0,
          borderColor: "transparent",
          marginTop: 0,
          marginBottom: 32,
          paddingTop: 0,
          paddingBottom: 8,
          paddingLeft: 0,
          paddingRight: 0,
        },
      },
      {
        id: "pr_banner",
        type: "image",
        content: "",
        src: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80",
        alt: "Protocol Technical Grayscale Texture",
        styles: {
          width: 536,
          height: 160,
          borderRadius: 8,
          marginBottom: 24,
          align: "center",
        },
      },
      {
        id: "pr_title",
        type: "heading",
        content: "MEET A NEW WAY\nTO MANAGE WORKFLOWS",
        styles: {
          fontSize: 22,
          fontWeight: "bold",
          textColor: "#ffffff",
          align: "left",
          marginBottom: 16,
        },
      },
      {
        id: "pr_intro",
        type: "text",
        content:
          "SYSTEM ACTIVE [{{nodeId}}]\n\nHello {{userName}}, we have initiated the new protocol suite for standard cryptographic communication across distributed nodes.",
        styles: {
          fontSize: 13,
          textColor: "#a1a1aa",
          align: "left",
          marginBottom: 28,
        },
      },
      {
        id: "pr_card",
        type: "container",
        content: "",
        children: [
          {
            id: "pr_card_header",
            type: "heading",
            content: "PASSWORD RESET",
            styles: {
              fontSize: 16,
              fontWeight: "bold",
              textColor: "#ffffff",
              align: "left",
              marginBottom: 12,
            },
          },
          {
            id: "pr_card_body",
            type: "text",
            content:
              "We received a request to reset your master key for Protocol. Secure authentication is required to finish this procedure.",
            styles: {
              fontSize: 12,
              textColor: "#a1a1aa",
              align: "left",
              marginBottom: 20,
            },
          },
          {
            id: "pr_card_btn",
            type: "button",
            content: "Create New Password",
            href: "#",
            styles: {
              backgroundColor: "#ffffff",
              textColor: "#000000",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: "bold",
              align: "left",
              paddingTop: 8,
              paddingBottom: 8,
              paddingLeft: 16,
              paddingRight: 16,
              marginBottom: 0,
            },
          },
        ],
        styles: {
          backgroundColor: "#09090b",
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "#27272a",
          paddingTop: 20,
          paddingBottom: 20,
          paddingLeft: 20,
          paddingRight: 20,
          marginTop: 10,
          marginBottom: 20,
        },
      },
    ],
    visualIdentity: {
      brandColors: [
        { id: "bc_pr1", name: "Branco Puro (Primário)", value: "#ffffff" },
        { id: "bc_pr2", name: "Zinco Cyber (Secundário)", value: "#a1a1aa" },
        { id: "bc_pr3", name: "Preto Cyber (Fundo)", value: "#0a0a0c" },
        { id: "bc_pr4", name: "Zinco Dark (Borda)", value: "#27272a" },
        { id: "bc_pr5", name: "Neon Verde", value: "#22c55e" },
      ],
      colorRules: [
        {
          id: "cr_pr1",
          name: "Nó Leste Ativo",
          variableName: "nodeId",
          operator: "contains",
          value: "us-east",
          colorIfTrue: "#22c55e",
          colorIfFalse: "#ef4444",
        },
      ],
      signatureName: "Arthur Pendragon",
      signatureRole: "Systems Cryptographer",
      signatureCompany: "PROTOCOL Sec",
      signaturePhone: "+55 (11) 97777-0003",
      signatureColor: "#22c55e",
    },
  },
  {
    id: "arcane",
    name: "Arcane (Editorial Romântico Burgundy)",
    globalStyles: {
      backgroundColor: "#1b0e11",
      containerColor: "#2b1015",
      textColor: "#fdeef2",
      fontFamily: "Georgia, serif",
      borderRadius: 16,
      padding: 36,
      bodyWidth: 600,
      hasWidthLimit: true,
      bodyAlignment: "center",
    },
    variables: [
      {
        id: "arc1",
        key: "userName",
        value: "Isadora",
        description: "Nome do cliente",
      },
      {
        id: "arc2",
        key: "routineName",
        value: "Hidratação Noturna",
        description: "Rotina sugerida",
      },
    ],
    elements: [
      {
        id: "arc_banner",
        type: "image",
        content: "",
        src: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=600&auto=format&fit=crop&q=80",
        alt: "Skin Ritual Red Flowers",
        styles: {
          width: 528,
          height: 180,
          borderRadius: 12,
          marginBottom: 24,
          align: "center",
        },
      },
      {
        id: "arc_title",
        type: "heading",
        content: "Welcome to Skin 🌹",
        styles: {
          fontSize: 28,
          fontWeight: "bold",
          textColor: "#ffffff",
          align: "left",
          marginBottom: 16,
        },
      },
      {
        id: "arc_intro",
        type: "text",
        content:
          "Olá, {{userName}}!\n\nYour skin deserves the finest natural routine. We are excited to guide you towards a glowing look with our custom-curated ingredients designed for your beauty.",
        styles: {
          fontSize: 14,
          textColor: "#fbcfe8",
          align: "left",
          marginBottom: 24,
        },
      },
      {
        id: "arc_card",
        type: "container",
        content: "",
        children: [
          {
            id: "arc_card_title",
            type: "heading",
            content: "Reset your Password",
            styles: {
              fontSize: 20,
              fontWeight: "bold",
              textColor: "#ffffff",
              align: "left",
              marginBottom: 12,
            },
          },
          {
            id: "arc_card_desc",
            type: "text",
            content:
              "We received a request to change your Skin account key. Tap below to routine setup:",
            styles: {
              fontSize: 13,
              textColor: "#fbcfe8",
              align: "left",
              marginBottom: 20,
            },
          },
          {
            id: "arc_card_btn",
            type: "button",
            content: "Reset Password",
            href: "#",
            styles: {
              backgroundColor: "#fbcfe8",
              textColor: "#3f1a20",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: "bold",
              align: "left",
              paddingTop: 10,
              paddingBottom: 10,
              paddingLeft: 18,
              paddingRight: 18,
              marginBottom: 0,
            },
          },
        ],
        styles: {
          backgroundColor: "#3f1a20",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#5c2630",
          paddingTop: 24,
          paddingBottom: 24,
          paddingLeft: 24,
          paddingRight: 24,
          marginTop: 10,
          marginBottom: 20,
        },
      },
    ],
    visualIdentity: {
      brandColors: [
        { id: "bc_arc1", name: "Burgundy Escuro (Primário)", value: "#1b0e11" },
        { id: "bc_arc2", name: "Burgundy (Secundário)", value: "#2b1015" },
        { id: "bc_arc3", name: "Rosa Claro (Fundo)", value: "#fdeef2" },
        { id: "bc_arc4", name: "Rosa Muted (Borda)", value: "#5c2630" },
        { id: "bc_arc5", name: "Rosa Accent", value: "#fbcfe8" },
      ],
      colorRules: [
        {
          id: "cr_arc1",
          name: "Rotina de Hidratação",
          variableName: "routineName",
          operator: "equals",
          value: "Hidratação Noturna",
          colorIfTrue: "#fbcfe8",
          colorIfFalse: "#db2777",
        },
      ],
      signatureName: "Isadora Duncan",
      signatureRole: "Beauty Curator",
      signatureCompany: "Skin Rituals",
      signaturePhone: "+55 (11) 96666-0004",
      signatureColor: "#fbcfe8",
    },
  },
  {
    id: "studio",
    name: "Studio (Tech Industrial Chrome)",
    globalStyles: {
      backgroundColor: "#eae8e5",
      containerColor: "#fdfbf7",
      textColor: "#211d1c",
      fontFamily: "system-ui, -apple-system, sans-serif",
      borderRadius: 16,
      padding: 32,
      bodyWidth: 600,
      hasWidthLimit: true,
      bodyAlignment: "center",
    },
    variables: [
      {
        id: "st_v1",
        key: "userName",
        value: "Mateo",
        description: "Nome do cliente",
      },
      {
        id: "st_v2",
        key: "modelName",
        value: "Halo Ring Active",
        description: "Modelo do anel inteligente",
      },
    ],
    elements: [
      {
        id: "st_banner",
        type: "image",
        content: "",
        src: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=600&auto=format&fit=crop&q=80",
        alt: "Halo Chrome Fluid Art",
        styles: {
          width: 536,
          height: 160,
          borderRadius: 12,
          marginBottom: 20,
          align: "center",
        },
      },
      {
        id: "st_header_tag",
        type: "container",
        content: "",
        children: [
          {
            id: "st_header_tag_txt",
            type: "text",
            content: "Welcome to Halo — set up your ring in minutes.",
            styles: {
              fontSize: 11,
              textColor: "#eae5e3",
              align: "center",
              marginBottom: 0,
            },
          },
        ],
        styles: {
          backgroundColor: "#211d1c",
          borderRadius: 8,
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft: 16,
          paddingRight: 16,
          marginTop: 4,
          marginBottom: 24,
        },
      },
      {
        id: "st_title",
        type: "heading",
        content: "Meet the ring that thinks 💍",
        styles: {
          fontSize: 24,
          fontWeight: "bold",
          textColor: "#211d1c",
          align: "left",
          marginBottom: 16,
        },
      },
      {
        id: "st_intro",
        type: "text",
        content:
          "Hello {{userName}}, we are proud to introduce {{modelName}}. Start tracking your sleep, heart rate, and steps dynamically with high-precision chromium modules.",
        styles: {
          fontSize: 14,
          textColor: "#5a5553",
          align: "left",
          marginBottom: 24,
        },
      },
      {
        id: "st_card",
        type: "container",
        content: "",
        children: [
          {
            id: "st_card_title",
            type: "heading",
            content: "Reset your password",
            styles: {
              fontSize: 18,
              fontWeight: "bold",
              textColor: "#211d1c",
              align: "left",
              marginBottom: 10,
            },
          },
          {
            id: "st_card_desc",
            type: "text",
            content:
              "We received a request to change your Halo password. Rest assured, your ring health data stays fully secure.",
            styles: {
              fontSize: 13,
              textColor: "#5a5553",
              align: "left",
              marginBottom: 20,
            },
          },
          {
            id: "st_card_btn",
            type: "button",
            content: "Create New Password",
            href: "#",
            styles: {
              backgroundColor: "#211d1c",
              textColor: "#ffffff",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: "bold",
              align: "left",
              paddingTop: 10,
              paddingBottom: 10,
              paddingLeft: 18,
              paddingRight: 18,
              marginBottom: 0,
            },
          },
        ],
        styles: {
          backgroundColor: "#ffffff",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#ebdcd3",
          paddingTop: 24,
          paddingBottom: 24,
          paddingLeft: 24,
          paddingRight: 24,
          marginTop: 10,
          marginBottom: 20,
        },
      },
    ],
    visualIdentity: {
      brandColors: [
        {
          id: "bc_st1",
          name: "Carvão Industrial (Primário)",
          value: "#211d1c",
        },
        { id: "bc_st2", name: "Cinza Quente (Secundário)", value: "#5a5553" },
        { id: "bc_st3", name: "Cinza Pérola (Fundo)", value: "#eae8e5" },
        { id: "bc_st4", name: "Cromo Líquido (Borda)", value: "#ebdcd3" },
        { id: "bc_st5", name: "Preto Puro", value: "#000000" },
      ],
      colorRules: [
        {
          id: "cr_st1",
          name: "Anel Inteligente Halo",
          variableName: "modelName",
          operator: "contains",
          value: "Halo",
          colorIfTrue: "#211d1c",
          colorIfFalse: "#ebdcd3",
        },
      ],
      signatureName: "Mateo Rossi",
      signatureRole: "Hardware Design Director",
      signatureCompany: "Halo Ring Labs",
      signaturePhone: "+55 (11) 95555-0005",
      signatureColor: "#211d1c",
    },
  },
];
