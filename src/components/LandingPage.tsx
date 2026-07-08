import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Code,
  Mail,
  Layout,
  Sparkles,
  ArrowRight,
  Check,
  Zap,
  Paintbrush,
  Layers,
  Smile,
  HardDrive,
  MousePointerClick,
  CheckCircle,
  FileText,
  Type,
  Palette,
  Minus,
  Settings,
  Trash2,
  CheckCircle2
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  // Simulator states
  const [step, setStep] = React.useState(0);
  const [headingText, setHeadingText] = React.useState("Olá, Estudante! 🎉");
  const [themeColor, setThemeColor] = React.useState("#2563eb");
  const [isBtnDropped, setIsBtnDropped] = React.useState(false);
  const [showCode, setShowCode] = React.useState(false);
  const [activePalette, setActivePalette] = React.useState(0);
  const [cursorPos, setCursorPos] = React.useState({ left: "14%", top: "45%", scale: 1 });

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    let typingInterval: NodeJS.Timeout;

    if (step === 0) {
      setIsBtnDropped(false);
      setHeadingText("Olá, Estudante! 🎉");
      setThemeColor("#2563eb");
      setActivePalette(0);
      setShowCode(false);
      setCursorPos({ left: "14%", top: "45%", scale: 1 });

      timer = setTimeout(() => {
        setCursorPos({ left: "58%", top: "72%", scale: 1.1 });
        
        setTimeout(() => {
          setIsBtnDropped(true);
          setCursorPos({ left: "58%", top: "72%", scale: 0.9 });
          setTimeout(() => {
            setCursorPos({ left: "58%", top: "72%", scale: 1 });
          }, 150);
        }, 1500);
      }, 500);
    } 
    else if (step === 1) {
      setCursorPos({ left: "55%", top: "34%", scale: 1 });
      
      timer = setTimeout(() => {
        setCursorPos({ left: "55%", top: "34%", scale: 0.9 });
        
        setTimeout(() => {
          setCursorPos({ left: "55%", top: "34%", scale: 1 });
          const targetText = "Oferta Especial Ativa! 🎁";
          let currentIdx = 0;
          setHeadingText("");
          typingInterval = setInterval(() => {
            if (currentIdx < targetText.length) {
              setHeadingText(targetText.slice(0, currentIdx + 1));
              currentIdx++;
            } else {
              clearInterval(typingInterval);
            }
          }, 80);
        }, 150);
      }, 1000);
    }
    else if (step === 2) {
      setCursorPos({ left: "14%", top: "75%", scale: 1 });

      timer = setTimeout(() => {
        setCursorPos({ left: "14%", top: "75%", scale: 0.9 });
        setTimeout(() => {
          setCursorPos({ left: "14%", top: "75%", scale: 1 });
          setActivePalette(1);
          setThemeColor("#7c3aed");
        }, 150);
      }, 1200);
    }
    else if (step === 3) {
      setCursorPos({ left: "86%", top: "6%", scale: 1 });

      timer = setTimeout(() => {
        setCursorPos({ left: "86%", top: "6%", scale: 0.9 });
        setTimeout(() => {
          setCursorPos({ left: "86%", top: "6%", scale: 1 });
          setShowCode(true);
        }, 150);
      }, 1200);
    }
    else if (step === 4) {
      setCursorPos({ left: "50%", top: "50%", scale: 1.1 });
    }

    return () => {
      clearTimeout(timer);
      if (typingInterval) clearInterval(typingInterval);
    };
  }, [step]);

  React.useEffect(() => {
    const mainInterval = setInterval(() => {
      setStep((prev) => (prev + 1) % 5);
    }, 4500);
    return () => clearInterval(mainInterval);
  }, []);
  return (
    <div className="min-h-screen bg-[#070708] text-zinc-100 font-sans selection:bg-blue-600/30 selection:text-blue-300 overflow-x-hidden">
      
      {/* Aurora Radial Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none select-none overflow-hidden opacity-30 z-0">
        <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] rounded-full bg-blue-600 blur-[130px]" />
        <div className="absolute top-[-10%] right-[20%] w-[450px] h-[450px] rounded-full bg-indigo-600 blur-[120px]" />
        <div className="absolute top-[20%] left-[40%] w-[350px] h-[350px] rounded-full bg-purple-600 blur-[140px]" />
      </div>

      {/* Header / Navbar */}
      <header className="relative z-10 border-b border-zinc-900 bg-zinc-950/40 backdrop-blur-md sticky top-0 shrink-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
              <img src="https://montaremail.com.br/logo_icon.png" alt="MontarEmail" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-zinc-100 flex items-center gap-1.5">
                MontarEmail
                <span className="bg-blue-500/10 text-blue-400 text-[9px] px-2 py-0.5 rounded-full font-mono font-bold border border-blue-500/20">
                  v1.3
                </span>
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-zinc-400">
            <a href="#funcionalidades" className="hover:text-zinc-200 transition-colors">Funcionalidades</a>
            <a href="#como-funciona" className="hover:text-zinc-200 transition-colors">Como Funciona</a>
            <a href="#vantagens" className="hover:text-zinc-200 transition-colors">Vantagens</a>
          </nav>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block text-[11px] font-bold px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-emerald-400 font-mono">
              ● 100% Gratuito
            </span>
            <button
              onClick={onStart}
              className="group relative flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-100 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              Começar Agora
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform text-blue-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-24 md:pt-28 md:pb-36 max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
        
        {/* Floating Free Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-extrabold text-blue-400 uppercase tracking-widest mb-6 animate-fade-in">
          <Sparkles className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
          <span>Editor de E-mails com Inteligência Artificial Integrada</span>
        </div>

        {/* Catchy Title with requested sentence */}
        <h1 className="text-4xl sm:text-5xl md:text-6.5xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.1] mb-6">
          Monte e-mails profissionais com{' '}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            facilidade extrema
          </span>
        </h1>

        {/* Required bold catchphrase: Clear in the hero that it's FREE FOREVER */}
        <p className="text-lg md:text-xl text-zinc-300 max-w-2xl mb-4 font-medium leading-relaxed">
          Arraste blocos prontos, crie e refine layouts conversando com a nossa IA, configure variáveis em tempo real e exporte o código limpo.
        </p>
        <p className="text-xl md:text-2xl font-extrabold text-emerald-400 tracking-tight mb-10">
          ✨ E o melhor: é de graça para sempre. ✨
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
          <button
            onClick={onStart}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-550 active:scale-98 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-900/20 hover:shadow-blue-900/30 transition-all cursor-pointer"
          >
            Experimentar Agora
            <ArrowRight className="h-4 w-4" />
          </button>
          
          <a
            href="#funcionalidades"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-bold text-sm rounded-xl transition-all"
          >
            Ver Recursos
          </a>
        </div>

        {/* Security & Access indicators */}
        <div className="mt-8 flex flex-wrap justify-center items-center gap-x-8 gap-y-3 text-[11px] font-semibold text-zinc-500">
          <span className="flex items-center gap-1.5">
            <Check className="h-4.5 w-4.5 text-blue-400" /> Sem Cadastro ou Login
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="h-4.5 w-4.5 text-blue-400" /> Download Ilimitado de Código
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="h-4.5 w-4.5 text-blue-400" /> Sem Cartão de Crédito
          </span>
        </div>

        {/* Beautiful Mockup / Application Teaser */}
        <div className="mt-16 md:mt-20 w-full max-w-5xl rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-3 shadow-2xl relative group overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
          
          {/* Mockup Window Header */}
          <div className="flex items-center justify-between px-3 pb-3 border-b border-zinc-900 shrink-0 relative z-20">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800/50 px-6 py-0.5 rounded-md text-[10px] font-mono text-zinc-400 select-none">
              montaremail.com.br/editor
            </div>
            <div className="w-12" />
          </div>

          {/* Simulated Workspace */}
          <div className="aspect-[16/9] w-full rounded-lg bg-[#0e0e10] flex overflow-hidden border border-zinc-900/60 relative">
            
            {/* Step Indicator Overlay Bar */}
            <div className="absolute top-3 left-3 right-3 z-30 bg-zinc-950/90 backdrop-blur-md border border-zinc-800/80 px-4 py-2.5 rounded-xl flex items-center justify-between text-left shadow-xl pointer-events-none">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <Sparkles className="h-3 w-3 animate-pulse text-indigo-400" />
                </div>
                <div>
                  <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Simulador Interativo do Editor</p>
                  <p className="text-xs font-bold text-zinc-100 transition-all duration-300">
                    {step === 0 && "Passo 1/4: Arrastando Bloco de Botão CTA para o e-mail..."}
                    {step === 1 && "Passo 2/4: Customizando texto com digitação em tempo real..."}
                    {step === 2 && "Passo 3/4: Trocando paleta de cores da marca..."}
                    {step === 3 && "Passo 4/4: Gerando e exportando código HTML otimizado..."}
                    {step === 4 && "✨ Demonstração finalizada com sucesso! Reiniciando..."}
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div 
                    key={i} 
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: step === i ? "24px" : "6px",
                      backgroundColor: step === i ? themeColor : "#27272a"
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Mock Sidebar */}
            <div className="w-1/4 h-full border-r border-zinc-900 bg-[#0c0c0e] p-4 pt-18 flex flex-col justify-between select-none text-left relative z-10">
              <div className="flex flex-col gap-3">
                <p className="text-[9px] font-bold text-zinc-500 tracking-wider uppercase mb-1">Elementos</p>
                
                {/* Drag blocks */}
                <div className="space-y-2">
                  <div className="h-9 w-full bg-zinc-900/40 border border-zinc-800/80 rounded-lg flex items-center px-3 gap-2 text-zinc-400">
                    <Layout className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="text-[10px] font-bold">Cabeçalho</span>
                  </div>
                  <div className="h-9 w-full bg-zinc-900/40 border border-zinc-800/80 rounded-lg flex items-center px-3 gap-2 text-zinc-400">
                    <Type className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="text-[10px] font-bold">Bloco de Texto</span>
                  </div>
                  <div className="h-9 w-full bg-zinc-900/40 border border-zinc-800/80 rounded-lg flex items-center px-3 gap-2 text-zinc-400">
                    <FileText className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="text-[10px] font-bold">Bloco de Imagem</span>
                  </div>
                  
                  {/* The CTA button block being dragged */}
                  <motion.div 
                    className={`h-9 w-full rounded-lg flex items-center px-3 gap-2 text-xs font-bold transition-all ${
                      step === 0 && !isBtnDropped 
                        ? 'bg-blue-600/10 border-2 border-dashed border-blue-500/50 text-blue-400 shadow-md scale-95' 
                        : 'bg-zinc-900/80 border border-zinc-800 text-zinc-300'
                    }`}
                    animate={step === 0 && !isBtnDropped ? { scale: [0.95, 0.98, 0.95] } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <Zap className={`h-3.5 w-3.5 ${step === 0 && !isBtnDropped ? 'text-blue-400 animate-pulse' : 'text-zinc-500'}`} />
                    <span className="text-[10px] font-bold">Botão CTA</span>
                  </motion.div>

                  <div className="h-9 w-full bg-zinc-900/40 border border-zinc-800/80 rounded-lg flex items-center px-3 gap-2 text-zinc-400">
                    <Minus className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="text-[10px] font-bold">Divisor</span>
                  </div>
                </div>
              </div>

              {/* Brand Identity Selector in Sidebar */}
              <div className="border-t border-zinc-900/80 pt-4 mb-2">
                <p className="text-[9px] font-bold text-zinc-500 tracking-wider uppercase mb-2 flex items-center gap-1">
                  <Palette className="h-3 w-3" />
                  Identidade Visual
                </p>
                <div className="flex gap-2 p-1.5 bg-zinc-950/60 rounded-lg border border-zinc-900">
                  <div className={`w-5 h-5 rounded-full bg-blue-500 cursor-pointer border transition-all ${activePalette === 0 ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`} />
                  <div className={`w-5 h-5 rounded-full bg-purple-500 cursor-pointer border transition-all ${activePalette === 1 ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`} />
                  <div className={`w-5 h-5 rounded-full bg-amber-500 cursor-pointer border transition-all ${activePalette === 2 ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`} />
                </div>
              </div>
            </div>

            {/* Mock Canvas Area */}
            <div className="flex-1 h-full bg-[#080809] pt-18 px-6 pb-6 flex flex-col select-none relative overflow-hidden">
              
              {/* Canvas Header bar */}
              <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-zinc-900">
                <div className="flex items-center gap-2">
                  <div className="h-5 px-2 rounded-md bg-zinc-900 border border-zinc-800 text-[9px] font-bold text-zinc-400 flex items-center gap-1.5">
                    <Layout className="w-2.5 h-2.5 text-indigo-400" />
                    Visualização Desktop
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                
                {/* Export Action Button */}
                <button 
                  className={`h-7 px-3 rounded-lg flex items-center gap-1.5 text-[10px] font-extrabold text-white transition-all ${
                    step === 3 
                      ? 'bg-emerald-600 scale-105 shadow-md shadow-emerald-900/20' 
                      : 'bg-zinc-900 border border-zinc-800'
                  }`}
                >
                  <Code className="h-3 w-3 text-emerald-400" />
                  Exportar HTML
                </button>
              </div>

              {/* Mock Subject area */}
              <div className="w-full bg-zinc-950/40 border border-zinc-900 rounded-lg px-3 py-1.5 mb-3 text-left flex items-center gap-2">
                <span className="text-[9px] font-bold font-mono text-zinc-600">Assunto:</span>
                <span className="text-[10px] text-zinc-400 font-medium">✨ Seu acesso prioritário ao painel foi liberado!</span>
              </div>

              {/* Email Viewport Wrapper */}
              <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                
                {/* Mock Email Template Body */}
                <div className="max-w-md w-full mx-auto bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3 shadow-xl text-left relative transition-all duration-300">
                  
                  {/* Email Header / Logo */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800/60">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: themeColor }}>
                        <Sparkles className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-[10px] font-extrabold tracking-wider text-zinc-300 font-mono uppercase">WORKSPACE</span>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-500 font-semibold">CUPOM: PRIORIDADE</span>
                  </div>

                  {/* Editable Heading Section */}
                  <div className="relative group/heading">
                    <motion.h2 
                      className={`text-sm.5 font-extrabold text-zinc-100 flex items-center gap-1 transition-all duration-300 ${
                        step === 1 ? 'bg-indigo-950/20 border-2 border-dashed border-indigo-500/50 p-1.5 rounded-lg' : ''
                      }`}
                    >
                      <span>{headingText}</span>
                      {step === 1 && (
                        <motion.span 
                          animate={{ opacity: [1, 0, 1] }} 
                          transition={{ repeat: Infinity, duration: 0.8 }} 
                          className="w-1.5 h-4 bg-indigo-400 inline-block align-middle ml-0.5"
                        />
                      )}
                    </motion.h2>
                    {step === 1 && (
                      <div className="absolute -top-3.5 -right-1 bg-indigo-600 text-white text-[8px] font-bold px-1 py-0.2 rounded shadow-lg select-none">
                        Editando...
                      </div>
                    )}
                  </div>

                  {/* Body text */}
                  <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">
                    Seu espaço de trabalho está configurado e pronto para uso. Aproveite ferramentas de automação, integrações avançadas de dados e exportação limpa.
                  </p>

                  {/* Inserted Button Container */}
                  <div className="py-2">
                    <AnimatePresence mode="wait">
                      {isBtnDropped ? (
                        <motion.div
                          key="dropped-btn"
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.7, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 180, damping: 14 }}
                          className="w-full text-center py-2 px-4 font-bold text-[10px] text-white rounded-lg shadow-lg flex items-center justify-center gap-2"
                          style={{ backgroundColor: themeColor }}
                        >
                          Acessar Workspace Premium 🚀
                        </motion.div>
                      ) : (
                        <motion.div
                          key="drop-target"
                          initial={{ opacity: 0.5 }}
                          animate={{ opacity: [0.5, 0.8, 0.5] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="w-full border-2 border-dashed border-zinc-700/80 rounded-lg py-3 text-center text-zinc-500 flex flex-col items-center justify-center gap-1 bg-zinc-950/20"
                        >
                          <Zap className="h-4 w-4 text-zinc-600" />
                          <span className="text-[9px] font-bold font-mono uppercase tracking-wider text-zinc-550">Arraste o Botão CTA Aqui</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Footer social icons mock */}
                  <div className="border-t border-zinc-800/80 pt-3 flex items-center justify-between text-zinc-500 text-[8px] font-mono font-medium">
                    <span>Equipe Workspace Ltda.</span>
                    <div className="flex gap-2">
                      <div className="w-4 h-4 rounded-full bg-zinc-800/50 flex items-center justify-center hover:bg-zinc-800 transition-colors">
                        <Mail className="h-2 w-2" />
                      </div>
                      <div className="w-4 h-4 rounded-full bg-zinc-800/50 flex items-center justify-center hover:bg-zinc-800 transition-colors">
                        <Code className="h-2 w-2" />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Code Export Result Drawer Screen Overlay */}
              <AnimatePresence>
                {showCode && (
                  <motion.div 
                    className="absolute inset-0 bg-zinc-950/98 flex flex-col p-6 z-40"
                    initial={{ opacity: 0, y: 150 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 150 }}
                    transition={{ type: "spring", damping: 20 }}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-900 shrink-0">
                      <div className="flex items-center gap-2">
                        <Code className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-bold font-mono text-zinc-300">HTML_EXPORT_RESULT.html</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-[9px] font-mono text-emerald-400 font-bold">100% RESPONSIVO</span>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto font-mono text-[10px] text-zinc-500 text-left p-3.5 bg-zinc-900/40 rounded-lg mt-3 border border-zinc-900 relative">
                      <div className="absolute top-2 right-2 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[8px] font-bold text-emerald-400 flex items-center gap-1 shadow-lg select-none">
                        <Check className="h-2.5 w-2.5" />
                        Copiado
                      </div>
                      <div className="space-y-1 select-none font-mono text-zinc-400">
                        <p className="text-zinc-600">{"<!DOCTYPE html>"}</p>
                        <p className="text-blue-400">{"<html lang=\"pt-BR\">"}</p>
                        <p className="text-blue-400">{"<head>"}</p>
                        <p className="text-zinc-500">{"  <meta charset=\"UTF-8\">"}</p>
                        <p className="text-purple-400">{"  <title>E-mail Exclusivo</title>"}</p>
                        <p className="text-blue-400">{"</head>"}</p>
                        <p className="text-blue-400">{"<body style=\"background-color: #f8fafc; margin: 0; padding: 40px;\">"}</p>
                        <p className="text-orange-400">{"  <table align=\"center\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"max-width: 600px;\">"}</p>
                        <p className="text-zinc-400">{"    <tr>"}</p>
                        <p className="text-zinc-400">{"      <td style=\"padding: 32px; background-color: #ffffff; border-radius: 16px;\">"}</p>
                        <p className="text-purple-400">{"        <h1 style=\"color: #0f172a; font-family: sans-serif; font-size: 22px; font-weight: bold;\">"}</p>
                        <p className="text-amber-400 font-bold">{"          " + headingText}</p>
                        <p className="text-purple-400">{"        </h1>"}</p>
                        <p className="text-zinc-500">{"        <p style=\"color: #475569; font-size: 14px; line-height: 1.6;\">"}</p>
                        <p className="text-zinc-500">{"          Seu design de e-mail incrível está pronto!"}</p>
                        <p className="text-zinc-500">{"        </p>"}</p>
                        <p className="text-zinc-400">{"        <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin-top: 24px;\">"}</p>
                        <p className="text-zinc-400">{"          <tr>"}</p>
                        <p className="text-zinc-400">{"            <td align=\"center\" bgcolor=\"" + themeColor + "\" style=\"border-radius: 8px;\">"}</p>
                        <p className="text-emerald-400">{"              <a href=\"#\" style=\"padding: 12px 24px; color: #ffffff; display: inline-block; font-weight: bold; text-decoration: none;\">Acessar Meu Painel</a>"}</p>
                        <p className="text-zinc-400">{"            </td>"}</p>
                        <p className="text-zinc-400">{"          </tr>"}</p>
                        <p className="text-zinc-400">{"        </table>"}</p>
                        <p className="text-zinc-400">{"      </td>"}</p>
                        <p className="text-zinc-400">{"    </tr>"}</p>
                        <p className="text-orange-400">{"  </table>"}</p>
                        <p className="text-blue-400">{"</body>"}</p>
                        <p className="text-blue-400">{"</html>"}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Floating Ghost Block following virtual cursor in Step 0 */}
              <AnimatePresence>
                {step === 0 && !isBtnDropped && cursorPos.left !== "14%" && (
                  <motion.div 
                    className="absolute bg-blue-600/95 border border-blue-400 text-white font-extrabold text-[10px] py-1.5 px-3.5 rounded-lg shadow-2xl pointer-events-none flex items-center gap-2 z-50 shrink-0"
                    style={{
                      left: `calc(${cursorPos.left} + 12px)`,
                      top: `calc(${cursorPos.top} + 12px)`,
                    }}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                  >
                    <Zap className="h-3 w-3 animate-pulse" />
                    <span>Botão CTA</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Smooth Virtual Cursor */}
              <motion.div 
                className="absolute pointer-events-none z-50 text-indigo-400 select-none shadow-2xl filter drop-shadow-[0_2px_10px_rgba(99,102,241,0.5)]"
                style={{
                  left: cursorPos.left,
                  top: cursorPos.top,
                }}
                animate={{
                  scale: cursorPos.scale,
                }}
                transition={{
                  type: "spring",
                  stiffness: 110,
                  damping: 15
                }}
              >
                <MousePointerClick className="h-5.5 w-5.5 text-indigo-400" />
              </motion.div>

            </div>
          </div>
        </div>

      </section>

      {/* Bento Grid Features Section */}
      <section id="funcionalidades" className="py-20 bg-zinc-950/40 relative border-t border-zinc-900 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-white mb-4">
              Tudo o que você precisa para criar e-mails fantásticos
            </h2>
            <p className="text-sm text-zinc-400 font-medium">
              Esqueça as limitações de ferramentas complexas. Com o MontarEmail, o controle do design está inteiramente nas suas mãos.
            </p>
          </div>

          {/* Bento-style Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Block 1: Drag & Drop */}
            <div className="md:col-span-2 group relative rounded-2xl border border-zinc-800/80 bg-zinc-900/20 p-8 hover:border-zinc-700/60 hover:bg-zinc-900/40 transition-all overflow-hidden flex flex-col justify-between min-h-[280px]">
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400 mb-6">
                  <Layout className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Estrutura Visual Arrasta e Solta</h3>
                <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
                  Crie colunas, configure espaçamentos, defina alinhamentos e insira blocos de texto, imagens ou botões de maneira totalmente visual e fluida.
                </p>
              </div>
              <div className="mt-6 flex gap-2">
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-zinc-900 rounded-md border border-zinc-800 text-zinc-400">Flexbox Amigável</span>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-zinc-900 rounded-md border border-zinc-800 text-zinc-400">Previsão Real</span>
              </div>
            </div>

            {/* Block 2: Brand Identity */}
            <div className="group relative rounded-2xl border border-zinc-800/80 bg-zinc-900/20 p-8 hover:border-zinc-700/60 hover:bg-zinc-900/40 transition-all flex flex-col justify-between min-h-[280px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl group-hover:bg-pink-500/10 transition-colors pointer-events-none" />
              <div>
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20 text-pink-400 mb-6">
                  <Paintbrush className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Identidade Visual Integrada</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Defina a paleta de cores da sua marca e salve suas assinaturas. Aplique as regras com regras condicionais exclusivas.
                </p>
              </div>
              <div className="mt-6">
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-zinc-900 rounded-md border border-zinc-800 text-pink-300">Brand Presets</span>
              </div>
            </div>

            {/* Block 3: Dynamic Variables */}
            <div className="group relative rounded-2xl border border-zinc-800/80 bg-zinc-900/20 p-8 hover:border-zinc-700/60 hover:bg-zinc-900/40 transition-all flex flex-col justify-between min-h-[280px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors pointer-events-none" />
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400 mb-6">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Variáveis Inteligentes</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Trabalhe com variáveis dinâmicas (ex: <code className="text-amber-300">{"{{nome}}"}</code>). Veja instantaneamente o preenchimento de teste no painel lateral.
                </p>
              </div>
              <div className="mt-6">
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-zinc-900 rounded-md border border-zinc-800 text-amber-300">Mapeamento Dinâmico</span>
              </div>
            </div>

            {/* Block 4: Icons Customizer */}
            <div className="md:col-span-2 group relative rounded-2xl border border-zinc-800/80 bg-zinc-900/20 p-8 hover:border-zinc-700/60 hover:bg-zinc-900/40 transition-all overflow-hidden flex flex-col justify-between min-h-[280px]">
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors pointer-events-none" />
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400 mb-6">
                  <Smile className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Construtor de Ícones PNG</h3>
                <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
                  Gere ícones sociais e indicativos diretamente para e-mail. Ajuste cores, tamanhos e baixe em PNG ou use na nuvem sem precisar de hospedagens terceiras.
                </p>
              </div>
              <div className="mt-6 flex gap-2">
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-zinc-900 rounded-md border border-zinc-800 text-purple-300">Customizador de Cor</span>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-zinc-900 rounded-md border border-zinc-800 text-purple-300">Hospedado na Cloud</span>
              </div>
            </div>

            {/* Block 5: Criador com IA */}
            <div className="md:col-span-3 group relative rounded-2xl border border-blue-900/40 bg-gradient-to-r from-blue-950/10 to-indigo-950/10 p-8 hover:border-blue-500/30 hover:bg-zinc-900/30 transition-all overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 min-h-[200px]" id="bento-ai-creator-block">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
              <div className="space-y-3.5 max-w-2xl text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 text-[10px] font-extrabold text-blue-300 rounded-full border border-blue-500/30 uppercase tracking-widest">
                  <Sparkles className="h-3 w-3 animate-pulse text-blue-400" />
                  Novo Recurso Inteligente
                </div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  Criador de E-mails com Inteligência Artificial Integrada
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Agora você pode criar layouts de e-mail inteiros e estruturas complexas simplesmente conversando com o nosso assistente de IA. Descreva o que você precisa e veja a IA organizar espaçamentos, margens, bento-grids e botões de forma profissional.
                </p>
              </div>
              <div className="shrink-0 flex flex-col gap-2 w-full md:w-auto text-left">
                <button
                  onClick={onStart}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-550 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-900/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Experimentar Criador IA
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <div className="flex gap-1.5 justify-start md:justify-center">
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-zinc-900/80 rounded border border-zinc-800 text-blue-400">100% JSON Compatível</span>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-zinc-900/80 rounded border border-zinc-800 text-indigo-400">Edição com Chat</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="como-funciona" className="py-20 max-w-7xl mx-auto px-6 z-10 relative">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-white mb-4">
            Construa em 3 passos simples
          </h2>
          <p className="text-sm text-zinc-400 font-medium">
            O fluxo é projetado para economizar seu tempo e garantir compatibilidade perfeita.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Step 1 */}
          <div className="relative flex flex-col bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6.5">
            <span className="absolute top-4 right-4 text-3xl font-extrabold text-blue-500/10 font-mono">01</span>
            <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 font-extrabold text-xs">
              1
            </div>
            <h3 className="text-base font-bold text-white mb-2">Selecione ou Importe</h3>
            <p className="text-xs.5 text-zinc-400 leading-relaxed">
              Inicie com nossos modelos de início rápido integrados ou recupere um rascunho salvo anteriormente do seu próprio armazenamento local.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative flex flex-col bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6.5">
            <span className="absolute top-4 right-4 text-3xl font-extrabold text-indigo-500/10 font-mono">02</span>
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 font-extrabold text-xs">
              2
            </div>
            <h3 className="text-base font-bold text-white mb-2">Personalize Visualmente</h3>
            <p className="text-xs.5 text-zinc-400 leading-relaxed">
              Altere textos, cores, imagens, defina assinaturas automáticas de e-mail e confira a visualização em tempo real tanto para desktop quanto para telas mobile.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative flex flex-col bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6.5">
            <span className="absolute top-4 right-4 text-3xl font-extrabold text-purple-500/10 font-mono">03</span>
            <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 font-extrabold text-xs">
              3
            </div>
            <h3 className="text-base font-bold text-white mb-2">Exportar e Usar</h3>
            <p className="text-xs.5 text-zinc-400 leading-relaxed">
              Gere o código HTML otimizado para provedores de email comuns (Gmail, Outlook, etc.) ou copie o markup de React Email puro.
            </p>
          </div>

        </div>
      </section>

      {/* Free Forever / Value Highlight Section */}
      <section id="vantagens" className="py-20 bg-gradient-to-b from-zinc-950/20 to-zinc-950/60 relative border-t border-zinc-900 z-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-extrabold text-emerald-400 rounded-full mb-6 uppercase tracking-wider">
            Compromisso de Gratuidade
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6 tracking-tight">
            Por que criamos o MontarEmail?
          </h2>
          <p className="text-sm md:text-base text-zinc-300 leading-relaxed max-w-2xl mx-auto mb-10">
            Acreditamos que todo mundo deveria ter acesso a uma ferramenta limpa, que não exige cadastros demorados, sem pegadinhas de assinaturas ou cartões de crédito. O MontarEmail armazena seus rascunhos de forma 100% segura no seu próprio navegador e é <strong className="text-emerald-400">de graça para sempre</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
            <div className="p-5 bg-zinc-900/30 border border-zinc-900 rounded-xl flex flex-col items-center">
              <span className="text-2xl font-extrabold text-white font-mono mb-1">0%</span>
              <span className="text-xs text-zinc-400 font-bold">Comissões ou Taxas</span>
            </div>
            <div className="p-5 bg-zinc-900/30 border border-zinc-900 rounded-xl flex flex-col items-center">
              <span className="text-2xl font-extrabold text-white font-mono mb-1">100%</span>
              <span className="text-xs text-zinc-400 font-bold">Privacidade de Dados</span>
            </div>
            <div className="p-5 bg-zinc-900/30 border border-zinc-900 rounded-xl flex flex-col items-center">
              <span className="text-2xl font-extrabold text-white font-mono mb-1">Grátis</span>
              <span className="text-xs text-zinc-400 font-bold">Sempre e para todos</span>
            </div>
          </div>

          <button
            onClick={onStart}
            className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-550 text-white font-extrabold rounded-xl text-sm transition-all shadow-lg hover:shadow-blue-900/35 cursor-pointer"
          >
            Começar Agora Grátis
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-[#040405] relative z-10 py-12 text-zinc-500 text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded flex items-center justify-center overflow-hidden">
              <img src="https://montaremail.com.br/logo_icon.png" alt="MontarEmail" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
            </div>
            <span className="font-bold text-zinc-300">MontarEmail</span>
          </div>

          <p className="font-medium text-zinc-550 text-center sm:text-right">
            Projetado de forma aberta para criadores, profissionais de marketing e desenvolvedores. De graça para sempre.
          </p>
        </div>
      </footer>

    </div>
  );
}
