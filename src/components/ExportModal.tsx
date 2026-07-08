import React, { useState } from 'react';
import { EmailTemplate } from '../types';
import { compileTemplateToEmailHtml, generateReactEmailCode } from '../utils';
import { X, Copy, Check, Download, Code, BookOpen, FileText, Sparkles, Eye, Info, Mail, Clipboard, Palette, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportModalProps {
  template: EmailTemplate;
  onClose: () => void;
}

function highlightHTML(code: string): string {
  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // HTML Comments (green)
  html = html.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="text-emerald-500/80 italic font-mono">$1</span>');

  // Tag names (cyan)
  html = html.replace(/&lt;(\/?\w+)/g, '&lt;<span class="text-cyan-400 font-semibold">$1</span>');

  // Attribute names (yellow) and values (amber)
  html = html.replace(/(\s+)([a-zA-Z\-]+)(=)(".*?"|'.*?')/g, '$1<span class="text-yellow-300 font-medium">$2</span>$3<span class="text-amber-300">$4</span>');

  return html;
}

function highlightTSX(code: string): string {
  let tsx = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Match string literals and comments safely in a single pass to avoid collision
  tsx = tsx.replace(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, (match) => {
    if (match.startsWith('//') || match.startsWith('/*')) {
      return `<span class="text-zinc-500 italic">${match}</span>`;
    } else {
      return `<span class="text-amber-300">${match}</span>`;
    }
  });

  // Key types/statements (fuchsia/indigo)
  const keywords = ['import', 'from', 'export', 'const', 'interface', 'default', 'function', 'return', 'as', 'any', 'string', 'export const'];
  keywords.forEach(word => {
    const regex = new RegExp(`\\b(${word})\\b`, 'g');
    tsx = tsx.replace(regex, '<span class="text-fuchsia-400 font-semibold">$1</span>');
  });

  // Tag names (cyan)
  tsx = tsx.replace(/&lt;(\/?\w+)/g, '&lt;<span class="text-cyan-400">$1</span>');

  return tsx;
}

export default function ExportModal({ template, onClose }: ExportModalProps) {
  const [activeTab, setActiveTab] = useState<'richtext' | 'html' | 'tsx' | 'pdf'>('richtext');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedRichText, setCopiedRichText] = useState(false);
  const [copiedTsx, setCopiedTsx] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<string>('');

  const handlePrintIframe = () => {
    const iframe = document.getElementById('print-preview-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } else {
      const tempIframe = document.createElement('iframe');
      tempIframe.style.position = 'absolute';
      tempIframe.style.width = '0';
      tempIframe.style.height = '0';
      tempIframe.style.border = 'none';
      document.body.appendChild(tempIframe);
      
      if (tempIframe.contentWindow) {
        tempIframe.contentDocument?.open();
        tempIframe.contentDocument?.write(htmlCode);
        tempIframe.contentDocument?.close();
        
        setTimeout(() => {
          tempIframe.contentWindow?.focus();
          tempIframe.contentWindow?.print();
          document.body.removeChild(tempIframe);
        }, 500);
      }
    }
  };

  const handleDownloadPdfContinuous = async () => {
    setIsGeneratingPdf(true);
    setPdfProgress('Renderizando e-mail...');
    try {
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '640px';
      container.style.backgroundColor = '#ffffff';
      container.innerHTML = htmlCode;
      document.body.appendChild(container);

      await new Promise(resolve => setTimeout(resolve, 1500));
      setPdfProgress('Capturando imagem de alta resolução...');

      const canvas = await html2canvas(container, {
        useCORS: true,
        scale: 2,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(container);
      setPdfProgress('Compilando PDF...');

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${template.name || 'EmailTemplate'}.pdf`);
    } catch (error) {
      console.error('Error generating continuous PDF:', error);
      alert('Erro ao gerar o PDF contínuo. Tente a opção "Imprimir / Salvar Vetorial" para maior compatibilidade.');
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress('');
    }
  };

  const handleDownloadPdfA4 = async () => {
    setIsGeneratingPdf(true);
    setPdfProgress('Renderizando e-mail...');
    try {
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '640px';
      container.style.backgroundColor = '#ffffff';
      container.innerHTML = htmlCode;
      document.body.appendChild(container);

      await new Promise(resolve => setTimeout(resolve, 1500));
      setPdfProgress('Fatiando páginas para tamanho A4...');

      const canvas = await html2canvas(container, {
        useCORS: true,
        scale: 2,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(container);
      setPdfProgress('Gerando arquivo final...');

      const imgWidth = 595.28;
      const pageHeight = 841.89;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const doc = new jsPDF('p', 'pt', 'a4');
      let position = 0;

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      doc.save(`${template.name || 'EmailTemplate'}_A4.pdf`);
    } catch (error) {
      console.error('Error generating A4 PDF:', error);
      alert('Erro ao gerar o PDF fatiado. Tente a opção "Imprimir / Salvar Vetorial" para maior compatibilidade.');
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress('');
    }
  };

  // React Email Custom options
  const [reactEmailFormat, setReactEmailFormat] = useState<'tsx' | 'jsx'>('tsx');
  const [staticVariables, setStaticVariables] = useState<boolean>(false);
  
  // State for customizing variables in real-time
  const [customVariableValues, setCustomVariableValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    template.variables.forEach(v => {
      init[v.key] = v.value || '';
    });
    return init;
  });

  // Generate customized template with user-filled values
  const customizedTemplate = {
    ...template,
    variables: template.variables.map(v => ({
      ...v,
      value: customVariableValues[v.key] !== undefined ? customVariableValues[v.key] : v.value
    }))
  };
  
  const htmlCode = compileTemplateToEmailHtml(customizedTemplate);
  const tsxCode = generateReactEmailCode(customizedTemplate, {
    format: reactEmailFormat,
    staticVariables: staticVariables,
    variableValues: customVariableValues
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText(htmlCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyTsx = () => {
    navigator.clipboard.writeText(tsxCode);
    setCopiedTsx(true);
    setTimeout(() => setCopiedTsx(false), 2000);
  };

  const handleCopyRichText = async () => {
    try {
      const plainText = htmlCode.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(); 
      const blobHtml = new Blob([htmlCode], { type: 'text/html' });
      const blobText = new Blob([plainText], { type: 'text/plain' });
      
      const data = [
        new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText,
        })
      ];
      
      await navigator.clipboard.write(data);
      setCopiedRichText(true);
      setTimeout(() => setCopiedRichText(false), 3000);
    } catch (err) {
      console.error('Failed to copy rich text:', err);
      // Fallback
      try {
        await navigator.clipboard.writeText(htmlCode);
        setCopiedRichText(true);
        setTimeout(() => setCopiedRichText(false), 3000);
      } catch (fallbackErr) {
        alert('Não foi possível copiar automaticamente. Selecione e copie o código na aba "Código HTML".');
      }
    }
  };

  const handleDownload = () => {
    const blob = new Blob([htmlCode], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'EmailTemplate.html');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTsx = () => {
    const blob = new Blob([tsxCode], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `EmailTemplate.${reactEmailFormat}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const highlightedCodeHtml = highlightHTML(htmlCode);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
      <div className="bg-[#0f0f0f] rounded-2xl shadow-2xl w-full max-w-[1440px] xl:max-w-[94vw] max-h-[92vh] flex flex-col border border-zinc-800 my-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800 bg-[#0f0f0f] rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-zinc-900 text-blue-400 rounded-lg border border-zinc-800">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 flex items-center gap-2">
                Exportar e Pré-visualizar E-mail
                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 font-mono">PRONTO PARA USO</span>
              </h3>
              <p className="text-xs text-zinc-500">Gere código HTML inline clássico, copie em formato Rich Text para colar diretamente, ou exporte em React Email TSX</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 py-3 bg-zinc-900/40 border-b border-zinc-800 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('richtext')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'richtext'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Copiar Rich Text (Para Gmail / Outlook)
          </button>
          <button
            onClick={() => setActiveTab('html')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'html'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/15'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Código HTML de Email (.html)
          </button>
          <button
            onClick={() => setActiveTab('tsx')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'tsx'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <Code className="h-3.5 w-3.5" />
            React Email (.{reactEmailFormat})
          </button>
          <button
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'pdf'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/15'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <Printer className="h-3.5 w-3.5" />
            Exportar PDF / Imprimir
          </button>
        </div>

        {/* Content body layout */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[calc(92vh-130px)]">
          
          {/* Column 1: Config & Variable Editor (lg:col-span-3 or lg:col-span-4 based on view) */}
          <div className={`${activeTab === 'html' ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-5 text-sm text-zinc-400 overflow-y-auto pr-1`}>
            
            {/* React Email Export Format (above Variable Editor) */}
            {activeTab === 'tsx' && (
              <div className="bg-indigo-950/15 rounded-xl p-4 border border-indigo-900/30 space-y-3 shadow-sm">
                <h4 className="font-bold text-indigo-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="h-4 w-4 text-indigo-400" />
                  Formato de Exportação
                </h4>
                <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-lg border border-zinc-850">
                  <button
                    type="button"
                    onClick={() => setReactEmailFormat('tsx')}
                    className={`py-1.5 text-center rounded-md font-mono text-[11px] font-bold cursor-pointer transition-all ${
                      reactEmailFormat === 'tsx'
                        ? 'bg-indigo-600 text-white shadow shadow-indigo-600/30'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    TSX (Padrão)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReactEmailFormat('jsx')}
                    className={`py-1.5 text-center rounded-md font-mono text-[11px] font-bold cursor-pointer transition-all ${
                      reactEmailFormat === 'jsx'
                        ? 'bg-indigo-600 text-white shadow shadow-indigo-600/30'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    JSX
                  </button>
                </div>
              </div>
            )}

            {/* Variable Editor Panel */}
            <div className="bg-zinc-900/60 rounded-xl p-4 border border-zinc-850 space-y-4 shadow-inner">
              <div className="pb-2 border-b border-zinc-800/60 space-y-2.5">
                <h4 className="font-bold text-zinc-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Code className="h-4 w-4 text-blue-400" />
                  Edição das Variáveis
                </h4>
                
                {/* Switcher style design inside its own full-width row to prevent horizontal overflow */}
                {activeTab === 'tsx' && (
                  <div className="flex items-center justify-between bg-zinc-950/60 px-2.5 py-1.5 rounded-lg border border-zinc-850/50">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-sans">
                      Substituir Variáveis
                    </span>
                    <label htmlFor="toggle-static-variables" className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        id="toggle-static-variables"
                        checked={staticVariables}
                        onChange={(e) => setStaticVariables(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="relative w-8 h-4 bg-zinc-800 rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                      <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-zinc-400 min-w-[50px] text-right">
                        {staticVariables ? "Ativado" : "Desativado"}
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Dynamic instruction texts depending on the active state and active tab */}
              {activeTab === 'tsx' ? (
                !staticVariables ? (
                  <div className="bg-blue-500/5 rounded-lg p-3 border border-blue-500/10 text-xs text-blue-400/90 leading-relaxed space-y-1">
                    <p className="font-semibold flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                      Variáveis como Parâmetros (Desativado)
                    </p>
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      As variáveis serão alteradas apenas pelo fluxo da sua aplicação através de propriedades (Props) do componente React.
                    </p>
                    <p className="text-[10px] text-zinc-500 font-medium">
                      Defina abaixo os valores padrões (Default Props) do código:
                    </p>
                  </div>
                ) : (
                  <div className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/10 text-xs text-amber-400/90 leading-relaxed space-y-1">
                    <p className="font-semibold flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                      Informações Estáticas (Ativado)
                    </p>
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      As informações são estáticas. Os marcadores de variáveis serão substituídos diretamente no corpo do código gerado pelos valores que você preencher abaixo.
                    </p>
                    <p className="text-[10px] text-zinc-500 font-medium">
                      Defina os valores estáticos para serem embutidos:
                    </p>
                  </div>
                )
              ) : (
                <p className="text-xs text-zinc-400 leading-normal">
                  Insira ou altere os valores das variáveis abaixo para compilar as informações e ver o resultado atualizado instantaneamente:
                </p>
              )}
              
              {template.variables.length === 0 ? (
                <span className="text-[11px] text-zinc-500 italic block py-2">Nenhuma variável configurada neste template.</span>
              ) : (
                <div className="space-y-3.5 pt-1">
                  {template.variables.map(v => (
                    <div key={v.id} className="space-y-1">
                      <label className="text-[11px] text-zinc-400 font-mono flex justify-between">
                        <span className="font-semibold text-zinc-300">{`{{${v.key}}}`}</span>
                        <span className="text-zinc-500 italic text-[9px]">{v.description}</span>
                      </label>
                      <input
                        type="text"
                        value={customVariableValues[v.key] || ''}
                        onChange={(e) => {
                          setCustomVariableValues(prev => ({
                            ...prev,
                            [v.key]: e.target.value
                          }));
                        }}
                        placeholder={`Ex: ${v.value || 'Insira o valor'}`}
                        className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* View Specific Tips */}
            {activeTab === 'richtext' ? (
              <div className="bg-blue-950/10 rounded-xl p-4 border border-blue-900/20 space-y-3">
                <h4 className="font-bold text-blue-400 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <BookOpen className="h-4 w-4" />
                  Como usar o Rich Text?
                </h4>
                <ul className="text-xs text-zinc-400 space-y-2 list-disc list-inside leading-relaxed">
                  <li>Clique no botão azul <strong>"Copiar E-mail Formatado"</strong>.</li>
                  <li>Abra o seu <strong>Gmail, Outlook, Yahoo Mail</strong> ou outro cliente.</li>
                  <li>Inicie uma nova mensagem e simplesmente cole com <strong>Ctrl+V / Cmd+V</strong>.</li>
                  <li>O e-mail será colado com o layout exato, cores, imagens e botões funcionais!</li>
                </ul>
              </div>
            ) : activeTab === 'html' ? (
              <div className="bg-emerald-950/10 rounded-xl p-4 border border-emerald-900/20 space-y-3">
                <h4 className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <Sparkles className="h-4 w-4" />
                  Alta Compatibilidade HTML
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  HTML puro compilado com todas as folhas de estilos convertidas em <strong>estilos inline</strong> e baseado em <strong>tabelas aninhadas</strong>.
                </p>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Perfeito para colar no Mailchimp, RD Station, ActiveCampaign ou mandar via SMTP corporativo.
                </p>
              </div>
            ) : activeTab === 'tsx' ? (
              <div className="bg-indigo-950/10 rounded-xl p-4 border border-indigo-900/20 space-y-3">
                <h4 className="font-bold text-indigo-400 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <Code className="h-4 w-4" />
                  Estrutura React Email
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Componente de React totalmente compatível com a biblioteca <strong>@react-email/components</strong>.
                </p>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Suporta estilização com Tailwind CSS embutido.
                </p>
              </div>
            ) : (
              <div className="bg-red-950/10 rounded-xl p-4 border border-red-900/20 space-y-3">
                <h4 className="font-bold text-red-400 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <Printer className="h-4 w-4" />
                  Opções de Exportação PDF
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Gere arquivos PDF do seu template de e-mail de três formas diferentes:
                </p>
                <ul className="text-xs text-zinc-400 space-y-2 list-disc list-inside leading-relaxed">
                  <li><strong>Impressão / Salvar Vetorial (Recomendado):</strong> Abre o menu de impressão nativo do navegador. Ao escolher "Salvar como PDF", você terá um PDF com textos selecionáveis e hiperlinks clicáveis.</li>
                  <li><strong>Baixar PDF Contínuo:</strong> Cria um arquivo PDF contínuo de página única, sem cortes incômodos no meio de textos ou imagens. Excelente para leitura móvel.</li>
                  <li><strong>Baixar PDF A4 Fatiado:</strong> Renders the template and cuts it into sequential A4 sheets automatically.</li>
                </ul>
              </div>
            )}

            <div className="space-y-2 text-xs text-zinc-500 leading-relaxed bg-zinc-900/20 p-4 rounded-xl border border-dashed border-zinc-800/80">
              <span className="font-semibold text-zinc-350 block flex items-center gap-1">
                <Info className="h-3 w-3 text-zinc-400" /> Dica de Imagens
              </span>
              <p>
                Hospede suas imagens em CDNs públicos confiáveis (ex: Imgur, Cloudinary, S3) para garantir que seus destinatários visualizem as fotos sem bloqueios.
              </p>
            </div>
          </div>

          {/* Tab Content Display */}
          {activeTab === 'richtext' ? (
            /* Rich Text View layout (lg:col-span-8) */
            <div className="lg:col-span-8 flex flex-col h-full min-h-[460px] bg-[#121212] rounded-2xl border border-zinc-800 overflow-hidden">
              
              {/* Rich Text Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-900/85 px-4 py-3 border-b border-zinc-850 gap-3">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Clipboard className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Cópia Rápida de Rich Text</span>
                </div>
                
                <button
                  onClick={handleCopyRichText}
                  className={`flex items-center justify-center gap-2 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/15 transition-all cursor-pointer ${
                    copiedRichText ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  {copiedRichText ? (
                    <>
                      <Check className="h-4 w-4 text-white animate-bounce" />
                      E-mail Formatado Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar E-mail Formatado (Rich Text)
                    </>
                  )}
                </button>
              </div>

              {/* Live Rich Text Iframe Container */}
              <div className="flex-1 bg-zinc-950 p-4 flex flex-col">
                {copiedRichText && (
                  <div className="mb-2 py-1.5 px-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-xs font-semibold text-center animate-pulse">
                    ✨ Pronto! O e-mail formatado está na sua área de transferência. Agora basta dar um Ctrl+V (ou Cmd+V) no seu Gmail/Outlook.
                  </div>
                )}
                <div className="flex-1 bg-white rounded-xl overflow-hidden border border-zinc-800 shadow-inner relative flex flex-col">
                  <iframe
                    srcDoc={htmlCode}
                    title="Real Rich Text Compiled Email Preview"
                    className="w-full h-full border-none bg-white flex-1"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="mt-3 text-center text-[10px] text-zinc-500 italic leading-snug">
                  💡 A caixa acima renderiza o visual exato que será colado. Você também pode clicar no botão superior para copiar tudo em formato Rich Text de uma só vez!
                </div>
              </div>

            </div>
          ) : activeTab === 'html' ? (
            /* HTML Code & Preview Layout (lg:col-span-9) */
            <>
              {/* Code Viewer (lg:col-span-5) */}
              <div className="lg:col-span-5 flex flex-col h-full min-h-[460px] bg-black rounded-2xl border border-zinc-800 relative shadow-inner overflow-hidden">
                
                {/* Code Top Bar */}
                <div className="flex justify-between items-center bg-zinc-900/85 px-4 py-2.5 border-b border-zinc-850">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-[11px] font-mono text-zinc-400 ml-2 truncate">
                      EmailTemplate.html
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border border-zinc-700 transition-colors"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="h-3 w-3.5 text-green-400 animate-pulse" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3.5" /> Copiar Código
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1.5 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors shrink-0 bg-emerald-600 hover:bg-emerald-500"
                    >
                      <Download className="h-3 w-3.5" /> Baixar
                    </button>
                  </div>
                </div>

                {/* Highlighted HTML Container */}
                <div className="flex-1 overflow-auto p-4 text-[11px] font-mono leading-relaxed select-text bg-[#030303] max-h-[500px]">
                  <pre className="m-0 font-mono text-zinc-350 whitespace-pre scrollbar-thin overflow-x-auto max-w-full">
                    <code dangerouslySetInnerHTML={{ __html: highlightedCodeHtml }} />
                  </pre>
                </div>
              </div>

              {/* Iframe Preview (lg:col-span-4) */}
              <div className="lg:col-span-4 flex flex-col h-full min-h-[460px] bg-[#121212] rounded-2xl border border-zinc-800 overflow-hidden">
                
                {/* Iframe Top Bar */}
                <div className="flex items-center justify-between bg-zinc-900/85 px-4 py-3 border-b border-zinc-850">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Eye className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">Visualização HTML</span>
                  </div>
                </div>

                {/* Sandbox iframe */}
                <div className="flex-1 bg-zinc-950 p-4 flex flex-col">
                  <div className="flex-1 bg-white rounded-xl overflow-hidden border border-zinc-800 shadow-inner relative flex flex-col">
                    <iframe
                      srcDoc={htmlCode}
                      title="Real HTML Compiled Email Preview"
                      className="w-full h-full border-none bg-white flex-1"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

              </div>
            </>
          ) : activeTab === 'tsx' ? (
            /* TSX/JSX Code View Layout (lg:col-span-8) - NO PREVIEW */
            <div className="lg:col-span-8 flex flex-col h-full min-h-[460px] bg-black rounded-2xl border border-zinc-800 relative shadow-inner overflow-hidden">
              
              {/* Code Top Bar */}
              <div className="flex justify-between items-center bg-zinc-900/85 px-4 py-2.5 border-b border-zinc-850">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-[11px] font-mono text-zinc-400 ml-2 truncate">
                    EmailTemplate.{reactEmailFormat}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyTsx}
                    className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border border-zinc-700 transition-colors"
                  >
                    {copiedTsx ? (
                      <>
                        <Check className="h-3 w-3.5 text-green-400 animate-pulse" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3.5" /> Copiar Código {reactEmailFormat.toUpperCase()}
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownloadTsx}
                    className="flex items-center gap-1.5 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors shrink-0 bg-indigo-600 hover:bg-indigo-500"
                  >
                    <Download className="h-3 w-3.5" /> Baixar .{reactEmailFormat}
                  </button>
                </div>
              </div>

              {/* Highlighted TSX Container */}
              <div className="flex-1 overflow-auto p-4 text-[11px] font-mono leading-relaxed select-text bg-[#030303] max-h-[500px]">
                <pre className="m-0 font-mono text-zinc-350 whitespace-pre scrollbar-thin overflow-x-auto max-w-full">
                  <code dangerouslySetInnerHTML={{ __html: highlightTSX(tsxCode) }} />
                </pre>
              </div>
            </div>
          ) : (
            /* PDF Export and Print Layout (lg:col-span-8) */
            <div className="lg:col-span-8 flex flex-col h-full min-h-[460px] bg-[#121212] rounded-2xl border border-zinc-800 overflow-hidden relative">
              
              {/* PDF Toolbar */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between bg-zinc-900/85 px-4 py-3 border-b border-zinc-850 gap-3">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Printer className="h-4 w-4 text-red-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">Painel de Exportação PDF</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handlePrintIframe}
                    disabled={isGeneratingPdf}
                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 disabled:bg-zinc-850 disabled:text-zinc-650 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-red-600/15 cursor-pointer transition-all shrink-0"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Salvar Vetorial (Recomendado)
                  </button>
                  <button
                    onClick={handleDownloadPdfContinuous}
                    disabled={isGeneratingPdf}
                    className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-850 disabled:text-zinc-650 text-zinc-200 px-3.5 py-2 rounded-xl text-xs font-semibold border border-zinc-700 cursor-pointer transition-all"
                  >
                    <Download className="h-3.5 w-3.5 text-zinc-400" />
                    Baixar PDF Contínuo
                  </button>
                  <button
                    onClick={handleDownloadPdfA4}
                    disabled={isGeneratingPdf}
                    className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-850 disabled:text-zinc-650 text-zinc-200 px-3.5 py-2 rounded-xl text-xs font-semibold border border-zinc-700 cursor-pointer transition-all"
                  >
                    <Download className="h-3.5 w-3.5 text-zinc-400" />
                    Baixar PDF A4 Fatiado
                  </button>
                </div>
              </div>

              {/* Preview and Iframe Area */}
              <div className="flex-1 bg-zinc-950 p-4 flex flex-col relative">
                {isGeneratingPdf && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center space-y-4">
                    <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-bold text-zinc-300 animate-pulse">{pdfProgress || 'Gerando PDF...'}</p>
                    <p className="text-[10px] text-zinc-500">Por favor, aguarde a renderização dos componentes.</p>
                  </div>
                )}

                <div className="flex-1 bg-white rounded-xl overflow-hidden border border-zinc-800 shadow-inner relative flex flex-col">
                  <iframe
                    srcDoc={htmlCode}
                    title="Real PDF Compiled Email Preview"
                    id="print-preview-iframe"
                    className="w-full h-full border-none bg-white flex-1"
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                <div className="mt-3 text-center text-[10px] text-zinc-500 italic leading-snug">
                  💡 A opção "Salvar Vetorial" usa o mecanismo de impressão do seu navegador, mantendo textos pesquisáveis e links clicáveis. Escolha "Salvar como PDF" nas opções de impressora.
                </div>
              </div>

            </div>
          )}

        </div>
        
        {/* Footer info */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-[#0f0f0f] flex flex-col sm:flex-row justify-between items-center gap-3 rounded-b-2xl">
          <span className="text-[11px] text-zinc-500 text-center sm:text-left">
            Gerado usando Compilador de Alta Fidelidade Inline e Rich Text Clipboard API.
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold border border-zinc-700 cursor-pointer transition-all"
          >
            Fechar Janela
          </button>
        </div>

      </div>
    </div>
  );
}
