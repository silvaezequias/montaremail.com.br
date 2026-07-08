import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Copy, 
  Code, 
  FileDown, 
  ExternalLink, 
  Loader2, 
  Check, 
  Info,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Flame,
  LayoutGrid,
  FileJson,
  Plus,
  Eye,
  Key,
  HelpCircle,
  Lock,
  Unlock
} from 'lucide-react';
import { EmailElement, EmailTemplate, ElementType, VisualIdentity, EmailVariable } from '../types';
import Canvas from './Canvas';
import { compileTemplateToEmailHtml } from '../utils';
import MarkdownMessage from './MarkdownMessage';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  template?: EmailTemplate;
  isPromptError?: boolean;
}

interface AiWorkspaceProps {
  onLoadIntoEditor: (template: EmailTemplate) => void;
  visualIdentity: VisualIdentity;
  onPreviewTemplate?: (template: EmailTemplate) => void;
  externalMessages?: ChatMessage[];
  onExternalMessagesChange?: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  externalTemplate?: EmailTemplate | null;
  onExternalTemplateChange?: (template: EmailTemplate) => void;
}

const QUICK_SUGGESTIONS = [
  {
    title: 'Boas-vindas Moderno',
    prompt: 'Crie um e-mail de boas-vindas corporativo moderno, usando tons de azul profundo (#1e3a8a) e cinza claro (#f3f4f6). Adicione variáveis para userName e discountCode, e um container com borda arredondada de 16px destacando um cupom de 15% de desconto.',
    icon: Sparkles
  },
  {
    title: 'Newsletter Semanal',
    prompt: 'Crie uma newsletter semanal de tecnologia de duas colunas (usando um elemento grid de 1 linha e 2 colunas). Use tipografia Space Grotesk para títulos, fundo escuro (#09090b) e detalhes em roxo violeta (#7c3aed). Insira ícones ilustrativos e espaçadores refinados de 20px.',
    icon: LayoutGrid
  },
  {
    title: 'Cobrança Amigável',
    prompt: 'Gere um e-mail de lembrete de cobrança amigável e clean. Use tons pastéis, fundo cinza-claro (#f8fafc), um container central branco com sombra sutil e borda de 1px sólida. Adicione variáveis para clientName, dueDate, invoiceAmount e um botão elegante para "Visualizar Fatura" em verde (#16a34a).',
    icon: Flame
  },
  {
    title: 'Feedback pós-consulta',
    prompt: 'Crie um modelo elegante de feedback pós-atendimento para consultórios. Use fonte Inter, cores suaves, um ícone de estetoscópio ou prancheta centralizado no topo. Insira uma grid de duas colunas contendo informações do profissional na esquerda e do agendamento na direita, com um botão centralizado para iniciar a pesquisa.',
    icon: MessageSquare
  }
];

export default function AiWorkspace({ 
  onLoadIntoEditor, 
  visualIdentity, 
  onPreviewTemplate,
  externalMessages,
  onExternalMessagesChange,
  externalTemplate,
  onExternalTemplateChange
}: AiWorkspaceProps) {
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      content: 'Olá! Sou seu assistente de design de e-mails com IA. Eu entendo perfeitamente o nosso formato de templates JSON, incluindo todas as variações de espaçamentos (paddings e margins), bordas, raios de canto personalizados (border radius), contêineres aninhados para criar cartões destacados (bento-box) e grids de múltiplas colunas para layouts responsivos.\n\nEscreva abaixo o tipo de e-mail que deseja criar ou selecione uma de nossas sugestões rápidas para começarmos!'
    }
  ]);

  const messages = externalMessages !== undefined ? externalMessages : localMessages;
  const setMessages = (msgs: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    if (onExternalMessagesChange && externalMessages !== undefined) {
      onExternalMessagesChange(msgs);
    } else {
      setLocalMessages(msgs);
    }
  };

  const [localTemplate, setLocalTemplate] = useState<EmailTemplate | null>(null);
  const currentTemplate = externalTemplate !== undefined ? externalTemplate : localTemplate;
  const setCurrentTemplate = (tpl: EmailTemplate | null | ((prev: EmailTemplate | null) => EmailTemplate | null)) => {
    if (onExternalTemplateChange && externalTemplate !== undefined) {
      if (typeof tpl === 'function') {
        onExternalTemplateChange(tpl(externalTemplate) as EmailTemplate);
      } else if (tpl !== null) {
        onExternalTemplateChange(tpl);
      }
    } else {
      setLocalTemplate(tpl);
    }
  };

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [showJsonView, setShowJsonView] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [copiedType, setCopiedType] = useState<'json' | 'html' | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [apiStatus, setApiStatus] = useState<'normal' | 'unstable' | 'high_demand'>('normal');
  const [sessionKey, setSessionKey] = useState<string>(() => {
    return sessionStorage.getItem('react-email-builder-temp-key') || '';
  });
  const [sessionKeyInput, setSessionKeyInput] = useState('');
  const [keyError, setKeyError] = useState<string | null>(null);

  const checkApiConfig = async () => {
    try {
      const res = await fetch('/api/ai-config');
      if (res.ok) {
        const data = await res.json();
        setHasApiKey(data.hasKey);
      } else {
        setHasApiKey(false);
      }
    } catch (err) {
      console.error("Failed to check AI config:", err);
      setHasApiKey(false);
    }
  };

  const handleSaveSessionKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionKeyInput.trim()) {
      setKeyError("Por favor, cole uma chave de API válida.");
      return;
    }
    const trimmed = sessionKeyInput.trim();
    if (!trimmed.startsWith("AIzaSy")) {
      setKeyError("Chaves do Gemini geralmente começam com 'AIzaSy'. Verifique se copiou corretamente.");
      return;
    }
    sessionStorage.setItem('react-email-builder-temp-key', trimmed);
    setSessionKey(trimmed);
    setKeyError(null);
  };

  useEffect(() => {
    checkApiConfig();
  }, []);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Loading steps animation
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoading]);

  const getLoadingMessage = () => {
    switch (loadingStep) {
      case 0: return 'Analisando instruções de design...';
      case 1: return 'Construindo estrutura do e-mail e variáveis...';
      case 2: return 'Aplicando espaçamentos, bordas e cores de alta conversão...';
      case 3: return 'Formatando código JSON estruturado...';
      default: return 'Processando...';
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: textToSend };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);
    setLoadingStep(0);

    try {
      // Map history to server schema
      const historyPayload = updatedMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (sessionKey) {
        headers['x-gemini-key'] = sessionKey;
      }

      const response = await fetch('/api/generate-template', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          messages: historyPayload,
          currentTemplate: currentTemplate
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const rawErrorMsg = errData.error || 'Falha na comunicação com a API de IA.';
        
        // Detect if error is related to the prompt containing something invalid/safety/etc.
        const isPromptIssue = rawErrorMsg.toLowerCase().includes('prompt') ||
                             rawErrorMsg.toLowerCase().includes('safety') ||
                             rawErrorMsg.toLowerCase().includes('block') ||
                             rawErrorMsg.toLowerCase().includes('policy') ||
                             rawErrorMsg.toLowerCase().includes('inappropriate') ||
                             rawErrorMsg.toLowerCase().includes('violat') ||
                             rawErrorMsg.toLowerCase().includes('recusad') ||
                             rawErrorMsg.toLowerCase().includes('inválido') ||
                             rawErrorMsg.toLowerCase().includes('conteúdo') ||
                             response.status === 400;

        if (errData.errorType === 'HIGH_DEMAND') {
          setApiStatus('high_demand');
          throw new Error('O modelo de IA está sob alta demanda temporária (Rate Limit excedido). Por favor, tente novamente em instantes.');
        } else if (errData.errorType === 'UNSTABLE') {
          setApiStatus('unstable');
          throw new Error('Instabilidade detectada na API do Gemini. Suas requisições podem falhar ou sofrer atrasos.');
        } else if (isPromptIssue) {
          setApiStatus('normal');
          setMessages(prev => [
            ...prev,
            {
              role: 'model',
              content: `⚠️ **Problema de Conteúdo ou Instrução no Comando:**\n\nA solicitação não pôde ser processada pela API do Gemini. O comando enviado parece conter algo incorreto, fora do escopo ou que não atende às diretrizes de uso.\n\n**Detalhes do erro retornado:**\n> ${rawErrorMsg}`,
              isPromptError: true
            }
          ]);
          return;
        } else {
          setApiStatus('unstable');
          throw new Error(rawErrorMsg);
        }
      }

      const data = await response.json();
      setApiStatus('normal'); // Reset API status to normal on successful response

      if (data && data.template) {
        // Enforce basic fallback global styles if missing
        const rawTemplate = data.template;
        const normalizedTemplate: EmailTemplate = {
          ...rawTemplate,
          id: rawTemplate.id || `ai_template_${Date.now()}`,
          name: rawTemplate.name || 'Modelo Gerado por IA',
          variables: rawTemplate.variables || [],
          elements: rawTemplate.elements || [],
          globalStyles: {
            backgroundColor: rawTemplate.globalStyles?.backgroundColor || '#f4f4f5',
            containerColor: rawTemplate.globalStyles?.containerColor || '#ffffff',
            textColor: rawTemplate.globalStyles?.textColor || '#18181b',
            fontFamily: rawTemplate.globalStyles?.fontFamily || 'Inter, sans-serif',
            borderRadius: typeof rawTemplate.globalStyles?.borderRadius === 'number' ? rawTemplate.globalStyles.borderRadius : 12,
            padding: typeof rawTemplate.globalStyles?.padding === 'number' ? rawTemplate.globalStyles.padding : 24,
            bodyWidth: rawTemplate.globalStyles?.bodyWidth || 600,
            hasWidthLimit: true,
            bodyAlignment: 'center'
          }
        };

        setMessages(prev => [
          ...prev,
          {
            role: 'model',
            content: data.message || 'E-mail gerado com sucesso!',
            template: normalizedTemplate
          }
        ]);
        setCurrentTemplate(normalizedTemplate);
      } else {
        const modelContent = typeof data === 'string' ? data : (data.message || '');
        const hasPromptIssueKeywords = modelContent.toLowerCase().includes('não posso') ||
                                       modelContent.toLowerCase().includes('desculpe') ||
                                       modelContent.toLowerCase().includes('fora do escopo') ||
                                       modelContent.toLowerCase().includes('não entendi') ||
                                       modelContent.toLowerCase().includes('erro') ||
                                       modelContent.toLowerCase().includes('inválido') ||
                                       modelContent.toLowerCase().includes('instrução incorreta') ||
                                       modelContent.toLowerCase().includes('não foi possível');

        setMessages(prev => [
          ...prev,
          {
            role: 'model',
            content: modelContent || 'Recebi sua mensagem, mas não consegui estruturar o e-mail em formato JSON. Por favor, tente novamente especificando mais detalhes de design.',
            isPromptError: hasPromptIssueKeywords
          }
        ]);
      }
    } catch (error: any) {
      console.error(error);
      const isPromptErrorInMsg = error.message && (
        error.message.toLowerCase().includes('prompt') ||
        error.message.toLowerCase().includes('safety') ||
        error.message.toLowerCase().includes('block') ||
        error.message.toLowerCase().includes('policy') ||
        error.message.toLowerCase().includes('inappropriate') ||
        error.message.toLowerCase().includes('violat') ||
        error.message.toLowerCase().includes('inválido') ||
        error.message.toLowerCase().includes('conteúdo')
      );

      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          content: isPromptErrorInMsg 
            ? `⚠️ **Problema no Comando Detectado:**\n\nA solicitação foi recusada devido a restrições no comando de entrada.\n\n**Detalhes do erro:**\n> ${error.message || 'Erro de validação'}`
            : `Ops! Ocorreu um erro ao processar sua solicitação: ${error.message || 'Erro de rede ou na API'}. Por favor, verifique sua chave de API do Gemini ou tente novamente em instantes.`,
          isPromptError: isPromptErrorInMsg
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'json' | 'html') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const downloadHtmlFile = () => {
    if (!currentTemplate) return;
    const htmlContent = compileTemplateToEmailHtml(currentTemplate);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentTemplate.name.toLowerCase().replace(/\s+/g, '_')}_ia.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Local stub handlers to make Canvas component happy in preview
  const handleSelectElement = () => {};
  const handleUpdateElementLocal = (updated: EmailElement) => {
    if (!currentTemplate) return;
    const updateInList = (list: EmailElement[]): EmailElement[] => {
      return list.map(el => {
        if (el.id === updated.id) return updated;
        if (el.children) return { ...el, children: updateInList(el.children) };
        if (el.gridCells) {
          const cells: Record<string, EmailElement[]> = {};
          for (const key in el.gridCells) {
            cells[key] = updateInList(el.gridCells[key]);
          }
          return { ...el, gridCells: cells };
        }
        return el;
      });
    };
    const updatedElements = updateInList(currentTemplate.elements);
    setCurrentTemplate({ ...currentTemplate, elements: updatedElements });
  };
  const handleAddElementAtLocal = () => {};
  const handleAddCustomElementAtLocal = () => {};
  const handleDeleteElementLocal = () => {};
  const handleReorderElementsLocal = () => {};

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-zinc-950 text-zinc-200 border-t border-zinc-900 overflow-hidden" id="ai-workspace-panel">
      
      {/* LEFT COLUMN: Chat & Prompting */}
      <div className="w-full lg:w-[560px] border-r border-zinc-900 flex flex-col bg-zinc-950 shrink-0 h-full">
        
        {/* Chat Header */}
        <div className="p-4 border-b border-zinc-900 bg-zinc-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600/15 text-blue-400 rounded-lg">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Criador de Templates IA</h3>
                {sessionKey ? (
                  <span className="px-1.5 py-0.5 bg-green-500/10 border border-green-500/25 text-green-400 font-extrabold rounded text-[8px] tracking-wider uppercase flex items-center gap-0.5" title="Sua chave está armazenada temporariamente nesta sessão (sessionStorage)">
                    <Lock className="h-2 w-2" />
                    Sessão
                  </span>
                ) : hasApiKey === true ? (
                  <span className="px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/25 text-blue-400 font-extrabold rounded text-[8px] tracking-wider uppercase">
                    Servidor
                  </span>
                ) : hasApiKey === false ? (
                  <span className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/25 text-red-400 font-extrabold rounded text-[8px] tracking-wider uppercase">
                    Sem Chave
                  </span>
                ) : null}
              </div>
              <p className="text-[10px] text-zinc-500">Desenvolva layouts responsivos em JSON via chat</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {sessionKey && (
              <button
                onClick={() => {
                  sessionStorage.removeItem('react-email-builder-temp-key');
                  setSessionKey('');
                  setSessionKeyInput('');
                }}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/45 border border-red-900/30 hover:border-red-800/40 rounded-lg cursor-pointer transition-all"
                title="Desconectar chave de API da sessão atual"
              >
                <Unlock className="h-3 w-3" />
                Desconectar
              </button>
            )}

            <button
              onClick={() => setIsGuideOpen(!isGuideOpen)}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg cursor-pointer transition-all"
            >
              <Info className="h-3 w-3" />
              Guia JSON
            </button>
          </div>
        </div>

        {/* Collapsible JSON Training Guide */}
        {isGuideOpen && (
          <div className="p-3 bg-zinc-900/60 border-b border-zinc-800 text-[11px] text-zinc-400 max-h-48 overflow-y-auto leading-relaxed scrollbar-thin">
            <h4 className="font-bold text-zinc-200 mb-1">Capacidades da IA Ensinadas:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong className="text-zinc-300">Layouts Bento & Cartões:</strong> Usando elementos <code className="text-blue-400 font-mono">"container"</code> com paddings internos, bordas de respiro e raios de canto personalizados.</li>
              <li><strong className="text-zinc-300">Layouts Multi-colunas:</strong> Usando elementos <code className="text-purple-400 font-mono">"grid"</code> com colunas dinâmicas (ex: 2 colunas para logos/cards lado a lado).</li>
              <li><strong className="text-zinc-300">Espaçamento Cirúrgico:</strong> Uso preciso de margins e paddings em cada elemento para criar respiros elegantes.</li>
              <li><strong className="text-zinc-300">Tipografia Avançada:</strong> Uso de fontes como <code className="text-yellow-500 font-mono">Space Grotesk</code> (moderno) e <code className="text-emerald-500 font-mono">Inter</code> (limpo).</li>
              <li><strong className="text-zinc-300">Componentização:</strong> Criação de blocos reutilizáveis com variáveis dinâmicas em chaves duplas <code className="text-zinc-200 font-mono">{"{{key}}"}</code>.</li>
            </ul>
          </div>
        )}

        {/* Status da API de IA */}
        {apiStatus !== 'normal' && (
          <div className={`px-4 py-2.5 flex items-center justify-between gap-3 text-[11px] border-b animate-fade-in ${
            apiStatus === 'high_demand' 
              ? 'bg-amber-600/10 border-amber-500/20 text-amber-400' 
              : 'bg-red-600/10 border-red-500/20 text-red-400'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${apiStatus === 'high_demand' ? 'bg-amber-500 animate-pulse' : 'bg-red-500 animate-pulse'}`} />
              <span className="font-medium">
                {apiStatus === 'high_demand' 
                  ? '🔥 Modelo de IA sob alta demanda temporária (limite de quota). Tente novamente em instantes.' 
                  : '⚠️ Instabilidade detectada na API do Gemini. Respostas podem falhar.'}
              </span>
            </div>
            <button 
              type="button"
              onClick={() => setApiStatus('normal')}
              className="text-[10px] underline font-bold cursor-pointer opacity-80 hover:opacity-100 shrink-0"
            >
              Ignorar
            </button>
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {messages.map((msg, i) => (
            <div 
              key={i} 
              className={`flex gap-3 max-w-[85%] ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-zinc-800 text-zinc-200' 
                  : msg.isPromptError
                    ? 'bg-red-600/15 border border-red-500/30 text-red-400'
                    : 'bg-blue-600/15 border border-blue-500/20 text-blue-400'
              }`}>
                {msg.role === 'user' ? <User className="h-4 w-4" /> : msg.isPromptError ? <Info className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Bubble */}
              <div className="space-y-2 max-w-full">
                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-zinc-800 text-zinc-100 rounded-tr-none'
                    : msg.isPromptError
                      ? 'bg-red-950/45 border border-red-900/40 text-red-200 rounded-tl-none shadow-[0_2px_10px_rgba(220,38,38,0.08)]'
                      : 'bg-zinc-900/60 border border-zinc-850 text-zinc-200 rounded-tl-none'
                }`}>
                  <MarkdownMessage text={msg.content} />
                </div>

                {/* If model response has an associated generated template, show micro status card */}
                {msg.role === 'model' && msg.template && (
                  <div className="p-2 bg-blue-600/5 border border-blue-500/10 rounded-xl flex items-center justify-between gap-3 text-[11px] animate-fade-in">
                    <div className="flex items-center gap-1.5 text-blue-300 font-medium">
                      <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                      <span>Modelo "{msg.template.name}"</span>
                    </div>
                    <button
                      onClick={() => {
                        if (msg.template) {
                          setCurrentTemplate(msg.template);
                        }
                      }}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg cursor-pointer transition-all text-[10px]"
                    >
                      Visualizar no Preview
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* AI Loader */}
          {isLoading && (
            <div className="flex gap-3 max-w-[85%] mr-auto items-start">
              <div className="h-8 w-8 rounded-lg bg-blue-600/15 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <div className="p-3.5 bg-zinc-900/60 border border-zinc-850 rounded-2xl rounded-tl-none space-y-2 w-full">
                <div className="flex items-center gap-2 text-xs text-blue-400 font-bold">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  <span>{getLoadingMessage()}</span>
                </div>
                <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full animate-progress" style={{ width: `${(loadingStep + 1) * 25}%`, transition: 'width 2s ease' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {(hasApiKey === false && !sessionKey) ? (
          <div className="p-4 border-t border-zinc-900 bg-zinc-900/35 space-y-4 animate-fade-in">
            {/* Tutorial Balloon */}
            <div className="relative p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3 shadow-xl">
              {/* Arrow Accent representing a conversation balloon */}
              <div className="absolute -bottom-2 left-6 w-4 h-4 bg-zinc-900 border-r border-b border-zinc-800 transform rotate-45" />
              
              <div className="flex items-center gap-2 text-amber-400">
                <HelpCircle className="h-4 w-4 text-amber-400 shrink-0" />
                <h4 className="text-xs font-black uppercase tracking-wider">Como obter sua Chave de API?</h4>
              </div>

              <div className="text-[11px] text-zinc-300 space-y-2.5 leading-relaxed">
                <p>
                  Siga os passos rápidos abaixo para gerar sua chave oficial e gratuita no Google AI Studio:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 pl-1 text-zinc-400">
                  <li>
                    Acesse o site oficial do <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-bold underline inline-flex items-center gap-0.5">Google AI Studio <ExternalLink className="h-2.5 w-2.5" /></a>
                  </li>
                  <li>Faça login usando qualquer conta do Google.</li>
                  <li>Clique no botão azul <strong className="text-zinc-200">"Get API key"</strong> no topo esquerdo.</li>
                  <li>Clique em <strong className="text-zinc-200">"Create API key"</strong> e copie o código gerado.</li>
                </ol>
              </div>

              {/* External Link Quick Button */}
              <a 
                href="https://aistudio.google.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-1 w-full py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 hover:border-blue-500/30 text-blue-400 hover:text-blue-300 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="h-3 w-3" />
                Ir para o Google AI Studio
              </a>
            </div>

            {/* Input Form with Safety Disclaimer */}
            <form onSubmit={handleSaveSessionKey} className="space-y-3 pt-1">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Insira sua Chave de API do Gemini:</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Key className="h-3.5 w-3.5" />
                  </div>
                  <input
                    type="password"
                    value={sessionKeyInput}
                    onChange={(e) => setSessionKeyInput(e.target.value)}
                    placeholder="Cole a chave aqui (começa com AIzaSy...)"
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-zinc-100 placeholder-zinc-600"
                  />
                </div>
                {keyError && (
                  <p className="text-[10px] text-red-400 font-medium mt-1 pl-1">
                    {keyError}
                  </p>
                )}
              </div>

              {/* Safety Shield Box */}
              <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl flex gap-2.5">
                <Lock className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-blue-300">Sua Chave está Segura</h5>
                  <p className="text-[10px] text-zinc-500 leading-normal">
                    Este segredo <strong className="text-zinc-400">não será guardado permanentemente</strong> em nossos servidores. Ele ficará armazenado apenas na sessão atual do seu navegador (<code className="font-mono text-zinc-400 text-[9px]">sessionStorage</code>) e será excluído permanentemente ao fechar a aba.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-md shadow-blue-950/40 flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Iniciar Modelo de IA
                </button>
                <button
                  type="button"
                  onClick={checkApiConfig}
                  title="Verificar se os segredos do workspace foram carregados"
                  className="px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl cursor-pointer transition-all flex items-center justify-center"
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* Suggestion Prompts Section (Shown when chat has only welcome or template is null) */}
            {!currentTemplate && !isLoading && (
              <div className="p-4 border-t border-zinc-900 bg-zinc-900/15">
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2">Sugestões de Modelagem:</p>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_SUGGESTIONS.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(item.prompt)}
                      className="p-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 hover:border-zinc-800 rounded-xl text-left cursor-pointer transition-all group flex flex-col justify-between h-20"
                    >
                      <span className="text-[11px] font-black text-zinc-300 group-hover:text-white transition-colors">{item.title}</span>
                      <span className="text-[9px] text-zinc-500 line-clamp-2 mt-1 font-medium">{item.prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="p-4 border-t border-zinc-900 bg-zinc-950 flex gap-2 items-center"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={hasApiKey === null ? "Verificando configuração..." : "Ex: Crie um e-mail bento-grid de boas-vindas..."}
                className="flex-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-zinc-200 placeholder-zinc-500"
                disabled={isLoading || hasApiKey === null}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim() || hasApiKey === null}
                className={`p-2.5 rounded-xl flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                  isLoading || !inputValue.trim() || hasApiKey === null
                    ? 'bg-zinc-900 border border-zinc-850 text-zinc-600'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-950/40'
                }`}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        )}

      </div>

      {/* RIGHT COLUMN: Live Interactive Preview */}
      <div className="flex-1 flex flex-col bg-zinc-950 h-full overflow-hidden relative">
        
        {currentTemplate ? (
          <>
            {/* Preview Toolbar Header */}
            <div className="p-3 border-b border-zinc-900 bg-zinc-900/20 flex flex-wrap items-center justify-between gap-3 z-10 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-white">Visualização Ativa:</span>
                <span className="text-xs text-zinc-400 bg-zinc-900 px-2.5 py-1 border border-zinc-850 rounded-lg">{currentTemplate.name}</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Full HTML Preview Popup Modal */}
                {onPreviewTemplate && (
                  <button
                    onClick={() => onPreviewTemplate(currentTemplate)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 text-xs font-bold rounded-xl cursor-pointer transition-all"
                    title="Visualizar Modelo com a Identidade Aplicada"
                  >
                    <Eye className="h-3.5 w-3.5 text-blue-400" />
                    Visualizar Modelo
                  </button>
                )}

                {/* Save and Unload in Main Editor */}
                <button
                  onClick={() => onLoadIntoEditor(currentTemplate)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-md shadow-indigo-950/40 border border-indigo-500/30"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Carregar no Editor Principal
                </button>

                {/* Copy JSON */}
                <button
                  onClick={() => copyToClipboard(JSON.stringify(currentTemplate, null, 2), 'json')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 text-xs font-bold rounded-xl cursor-pointer transition-all"
                  title="Copiar JSON do Modelo"
                >
                  {copiedType === 'json' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  JSON
                </button>

                {/* Export responsive HTML */}
                <button
                  onClick={downloadHtmlFile}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 text-xs font-bold rounded-xl cursor-pointer transition-all"
                  title="Exportar HTML Responsivo"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  HTML
                </button>

                {/* Toggle Code View */}
                <button
                  onClick={() => setShowJsonView(!showJsonView)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl cursor-pointer transition-all border ${
                    showJsonView
                      ? 'bg-zinc-800 border-zinc-700 text-white'
                      : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Visualizar JSON gerado"
                >
                  <Code className="h-3.5 w-3.5" />
                  Código
                </button>
              </div>
            </div>

            {/* Content area splitting Preview and JSON View */}
            <div className="flex-1 flex overflow-hidden relative">
              
              {/* Main Canvas preview */}
              <div className={`flex-1 overflow-y-auto bg-zinc-950 p-2 sm:p-6 transition-all duration-300 ${showJsonView ? 'lg:mr-[320px]' : ''}`}>
                <div className="w-full max-w-5xl mx-auto border border-zinc-900 rounded-2xl overflow-hidden shadow-2xl bg-zinc-950 relative">
                  <Canvas
                    template={currentTemplate}
                    selectedElementId={null}
                    onSelectElement={handleSelectElement}
                    onUpdateElement={handleUpdateElementLocal}
                    onAddElementAt={handleAddElementAtLocal}
                    onAddCustomElementAt={handleAddCustomElementAtLocal}
                    onDeleteElement={handleDeleteElementLocal}
                    onReorderElements={handleReorderElementsLocal}
                    visualIdentity={visualIdentity}
                    isSidebarOpen={false}
                  />
                </div>
              </div>

              {/* Side-panel code viewer */}
              {showJsonView && (
                <div className="absolute right-0 top-0 bottom-0 w-full sm:w-80 border-l border-zinc-900 bg-[#0c0c0e] flex flex-col z-10 animate-slide-in">
                  <div className="p-3 border-b border-zinc-900 bg-zinc-900/30 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <FileJson className="h-3.5 w-3.5 text-yellow-500" />
                      Estrutura JSON do Modelo
                    </span>
                    <button
                      onClick={() => setShowJsonView(false)}
                      className="text-zinc-500 hover:text-white text-xs cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto p-3 font-mono text-[10px] text-zinc-400 leading-normal scrollbar-thin select-text selection:bg-zinc-800">
                    <pre>{JSON.stringify(currentTemplate, null, 2)}</pre>
                  </div>
                </div>
              )}

            </div>
          </>
        ) : (
          /* Welcome/Empty state when no template has been generated yet */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-950/40 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.06),transparent_60%)] pointer-events-none" />
            
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600/10 to-indigo-600/15 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 shadow-lg shadow-indigo-950/20 relative animate-pulse">
              <Sparkles className="h-7 w-7" />
              <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-zinc-950" />
            </div>

            <h3 className="text-lg font-black text-white tracking-tight">Seu Sandbox de Criação com IA</h3>
            <p className="text-xs text-zinc-500 max-w-sm mt-2 leading-relaxed font-medium">
              Envie uma instrução descritiva no chat lateral ou clique em um dos modelos sugeridos para ver a mágica acontecer em tempo real nesta tela de preview.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 max-w-lg w-full">
              <div className="p-3 bg-zinc-900/40 border border-zinc-900/80 rounded-xl text-left">
                <div className="text-blue-400 font-bold text-xs mb-1">1. Converse</div>
                <div className="text-[10px] text-zinc-500 leading-normal font-medium">Instrua o modelo a usar estruturas complexas, cartões bento ou grids.</div>
              </div>
              <div className="p-3 bg-zinc-900/40 border border-zinc-900/80 rounded-xl text-left">
                <div className="text-indigo-400 font-bold text-xs mb-1">2. Visualize</div>
                <div className="text-[10px] text-zinc-500 leading-normal font-medium">Veja a estilização fina, as margens, bordas e os cantos assimétricos se formando.</div>
              </div>
              <div className="p-3 bg-zinc-900/40 border border-zinc-900/80 rounded-xl text-left">
                <div className="text-pink-400 font-bold text-xs mb-1">3. Edite</div>
                <div className="text-[10px] text-zinc-500 leading-normal font-medium">Transfira a criação direto para o editor principal com um único clique!</div>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
