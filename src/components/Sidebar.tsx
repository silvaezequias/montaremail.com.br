import React, { useState } from 'react';
import { ElementType, EmailElement, EmailTemplate, ReusableComponent, VisualIdentity, BrandColor, ColorRule } from '../types';
import { ColorPalettePicker } from './ColorPalettePicker';
import {
  Heading as HeadingIcon,
  Type,
  Square,
  Image,
  Link as LinkIcon,
  Minus,
  Maximize,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Settings,
  Palette,
  Calendar,
  MapPin,
  Sparkles,
  HardDrive,
  Save,
  FileText,
  Upload,
  Download,
  Layout,
  Grid,
  Copy,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Check,
  Hash,
  User,
  Briefcase,
  Phone,
  RotateCcw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Search,
  Smile,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Github,
  Globe,
  MessageSquare,
  Mail as MailIcon,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  MessageCircle,
  Share2,
  Star,
  Gift,
  ShoppingCart,
  Heart,
  Bell,
  Trophy,
  Tag,
  Flame,
  Zap,
  DollarSign
} from 'lucide-react';

interface SidebarProps {
  template: EmailTemplate;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onAddElement: (type: ElementType) => void;
  onAddCustomElement: (element: EmailElement) => void;
  onUpdateGlobalStyles: (styles: EmailTemplate['globalStyles']) => void;
  onReorderElements: (elements: EmailElement[]) => void;
  onDeleteElement: (id: string) => void;
  onLoadPreset: (id: string) => void;
  savedTemplates: EmailTemplate[];
  onLoadSavedTemplate: (id: string) => void;
  onOpenSaveModal: () => void;
  onOpenStorageManager: () => void;
  reusableComponents: ReusableComponent[];
  onInsertComponent: (comp: ReusableComponent) => void;
  onInsertSignature: () => void;
  onUpdateElement: (updatedElement: EmailElement) => void;
  onImportTemplate: (template: EmailTemplate) => void;
  onImportComponent: (component: ReusableComponent) => void;
  visualIdentity: VisualIdentity;
  onUpdateVisualIdentity: (updated: VisualIdentity) => void;
  isFloating?: boolean;
  floatingSection?: 'quickTemplates' | 'savedTemplates' | 'reusableComponents' | 'iconsGallery' | 'blocks' | 'structure' | 'globalStyles' | null;
  openSections?: {
    quickTemplates: boolean;
    savedTemplates: boolean;
    reusableComponents: boolean;
    iconsGallery: boolean;
    blocks: boolean;
    structure: boolean;
    globalStyles: boolean;
  };
  onToggleSection?: (section: 'quickTemplates' | 'savedTemplates' | 'reusableComponents' | 'iconsGallery' | 'blocks' | 'structure' | 'globalStyles') => void;
  onToggleCollapse?: () => void;
}

const ELEMENT_TEMPLATES: { type: ElementType; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    type: 'heading',
    label: 'Título (Heading)',
    icon: <HeadingIcon className="h-4 w-4" />,
    desc: 'Título em negrito personalizável'
  },
  {
    type: 'text',
    label: 'Parágrafo (Text)',
    icon: <Type className="h-4 w-4" />,
    desc: 'Bloco de texto com quebra de linhas'
  },
  {
    type: 'button',
    label: 'Botão (CTA Button)',
    icon: <Square className="h-4 w-4" />,
    desc: 'Botão de clique com hyperlink'
  },
  {
    type: 'image',
    label: 'Imagem (Img)',
    icon: <Image className="h-4 w-4" />,
    desc: 'Adicione fotos ou banners'
  },
  {
    type: 'link',
    label: 'Hiperlink (Link)',
    icon: <LinkIcon className="h-4 w-4" />,
    desc: 'Texto clicável com URL externa'
  },
  {
    type: 'divider',
    label: 'Divisor (Hr)',
    icon: <Minus className="h-4 w-4" />,
    desc: 'Linha fina separadora de blocos'
  },
  {
    type: 'spacer',
    label: 'Espaçador (Spacer)',
    icon: <Maximize className="h-4 w-4" />,
    desc: 'Espaço vertical customizável'
  },
  {
    type: 'container',
    label: 'Container',
    icon: <Layout className="h-4 w-4" />,
    desc: 'Container para agrupar elementos'
  },
  {
    type: 'grid',
    label: 'Grid de Colunas',
    icon: <Grid className="h-4 w-4" />,
    desc: 'Grid estruturado de linhas e colunas'
  }
];

interface IconListItem {
  name: string;
  tag: string;
  icon: React.ReactNode;
}

const EMAIL_ICONS: IconListItem[] = [
  { name: 'Facebook', tag: 'facebook-new', icon: <Facebook className="h-4 w-4" /> },
  { name: 'Instagram', tag: 'instagram', icon: <Instagram className="h-4 w-4" /> },
  { name: 'Twitter / X', tag: 'twitter', icon: <Twitter className="h-4 w-4" /> },
  { name: 'LinkedIn', tag: 'linkedin', icon: <Linkedin className="h-4 w-4" /> },
  { name: 'YouTube', tag: 'youtube', icon: <Youtube className="h-4 w-4" /> },
  { name: 'GitHub', tag: 'github', icon: <Github className="h-4 w-4" /> },
  { name: 'WhatsApp', tag: 'whatsapp', icon: <MessageSquare className="h-4 w-4" /> },
  { name: 'Website', tag: 'globe', icon: <Globe className="h-4 w-4" /> },
  { name: 'E-mail', tag: 'mail', icon: <MailIcon className="h-4 w-4" /> },
  { name: 'Telefone', tag: 'phone', icon: <Phone className="h-4 w-4" /> },
  { name: 'Calendário', tag: 'calendar', icon: <Calendar className="h-4 w-4" /> },
  { name: 'Localização', tag: 'marker', icon: <MapPin className="h-4 w-4" /> },
  { name: 'Check', tag: 'checkmark', icon: <Check className="h-4 w-4" /> },
  { name: 'Alerta', tag: 'error', icon: <AlertTriangle className="h-4 w-4" /> },
  { name: 'Sucesso', tag: 'ok', icon: <CheckCircle className="h-4 w-4" /> },
  { name: 'Ajuda', tag: 'help', icon: <HelpCircle className="h-4 w-4" /> },
  { name: 'Configurações', tag: 'settings', icon: <Settings className="h-4 w-4" /> },
  { name: 'Mensagem', tag: 'speech-bubble', icon: <MessageCircle className="h-4 w-4" /> },
  { name: 'Compartilhar', tag: 'share', icon: <Share2 className="h-4 w-4" /> },
  { name: 'Estrela', tag: 'star', icon: <Star className="h-4 w-4" /> },
  { name: 'Presente', tag: 'gift', icon: <Gift className="h-4 w-4" /> },
  { name: 'Carrinho', tag: 'shopping-cart', icon: <ShoppingCart className="h-4 w-4" /> },
  { name: 'Usuário', tag: 'user-male-circle', icon: <User className="h-4 w-4" /> },
  { name: 'Coração', tag: 'like', icon: <Heart className="h-4 w-4" /> },
  { name: 'Notificação', tag: 'bell', icon: <Bell className="h-4 w-4" /> },
  { name: 'Troféu', tag: 'trophy', icon: <Trophy className="h-4 w-4" /> },
  { name: 'Desconto/Tag', tag: 'price-tag', icon: <Tag className="h-4 w-4" /> },
  { name: 'Fogo/Quente', tag: 'fire', icon: <Flame className="h-4 w-4" /> },
  { name: 'Relâmpago', tag: 'flash', icon: <Zap className="h-4 w-4" /> },
  { name: 'Dinheiro', tag: 'money-bag', icon: <DollarSign className="h-4 w-4" /> },
];

export default function Sidebar({
  template,
  selectedElementId,
  onSelectElement,
  onAddElement,
  onAddCustomElement,
  onUpdateGlobalStyles,
  onReorderElements,
  onDeleteElement,
  onLoadPreset,
  savedTemplates,
  onLoadSavedTemplate,
  onOpenSaveModal,
  onOpenStorageManager,
  reusableComponents,
  onInsertComponent,
  onImportTemplate,
  onImportComponent,
  visualIdentity,
  onUpdateVisualIdentity,
  onInsertSignature,
  onUpdateElement,
  isFloating = false,
  floatingSection = null,
  openSections: propsOpenSections,
  onToggleSection,
  onToggleCollapse,
}: SidebarProps) {
  const { elements, globalStyles } = template;

  // Fallback to local state if openSections prop is not provided
  const [localOpenSections, setLocalOpenSections] = useState({
    quickTemplates: false,
    savedTemplates: false,
    reusableComponents: false,
    iconsGallery: false,
    blocks: true,
    structure: true,
    globalStyles: true,
  });

  const openSections = propsOpenSections || localOpenSections;

  // State for PNG icons builder
  const [iconColor, setIconColor] = useState('#4f46e5');
  const [iconSize, setIconSize] = useState(32);
  const [iconStyle, setIconStyle] = useState<'filled' | 'outline' | 'material'>('filled');
  const [iconSearch, setIconSearch] = useState('');

  const getIconPngUrl = (tag: string) => {
    const cleanColor = iconColor.replace('#', '');
    const stylePrefix = iconStyle === 'filled' ? 'ios-filled' : iconStyle === 'outline' ? 'ios' : 'material-rounded';
    return `https://img.icons8.com/${stylePrefix}/${iconSize}/${cleanColor}/${tag}.png`;
  };

  const handleDragIconStart = (e: React.DragEvent, tag: string, name: string) => {
    const url = getIconPngUrl(tag);
    const element: EmailElement = {
      id: `image_icon_${Date.now()}`,
      type: 'image',
      content: '',
      src: url,
      alt: name,
      styles: {
        width: iconSize,
        height: iconSize,
        align: 'center',
        marginTop: 4,
        marginBottom: 4,
      }
    };
    e.dataTransfer.setData('application/react-email-builder-custom-element', JSON.stringify(element));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleAddIconClick = (tag: string, name: string) => {
    const url = getIconPngUrl(tag);
    const element: EmailElement = {
      id: `image_icon_${Date.now()}`,
      type: 'image',
      content: '',
      src: url,
      alt: name,
      styles: {
        width: iconSize,
        height: iconSize,
        align: 'center',
        marginTop: 4,
        marginBottom: 4,
      }
    };
    onAddCustomElement(element);
  };

  const toggleSection = (section: 'quickTemplates' | 'savedTemplates' | 'reusableComponents' | 'iconsGallery' | 'blocks' | 'structure' | 'globalStyles') => {
    if (onToggleSection) {
      onToggleSection(section);
    } else {
      setLocalOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
    }
  };

  const handleApplyColor = (colorHex: string) => {
    if (!selectedElementId) return;
    const activeEl = template.elements.find((el) => el.id === selectedElementId);
    if (!activeEl) return;

    const updatedStyles = { ...activeEl.styles };
    if (activeEl.type === 'button') {
      updatedStyles.backgroundColor = colorHex;
    } else {
      updatedStyles.textColor = colorHex;
    }

    onUpdateElement({
      ...activeEl,
      styles: updatedStyles,
    });
  };

  const handleImportTemplateJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === 'object' && parsed.name && Array.isArray(parsed.elements)) {
          onImportTemplate(parsed);
          // Reset file input
          e.target.value = '';
        } else {
          alert('Formato de arquivo inválido. O arquivo JSON deve ser um modelo de e-mail válido.');
        }
      } catch (err) {
        alert('Erro ao ler o arquivo JSON de modelo.');
      }
    };
    reader.readAsText(file);
  };

  const handleImportComponentJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === 'object' && parsed.name && parsed.element && typeof parsed.element === 'object') {
          onImportComponent(parsed);
          // Reset file input
          e.target.value = '';
        } else {
          alert('Formato de arquivo inválido. O arquivo JSON deve ser um componente válido.');
        }
      } catch (err) {
        alert('Erro ao ler o arquivo JSON de componente.');
      }
    };
    reader.readAsText(file);
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

  const handleDragStart = (e: React.DragEvent, type: ElementType) => {
    e.dataTransfer.setData('application/react-email-builder-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragComponentStart = (e: React.DragEvent, element: EmailElement) => {
    e.dataTransfer.setData('application/react-email-builder-custom-element', JSON.stringify(element));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className={isFloating ? "flex flex-col h-full bg-transparent text-zinc-100" : "flex flex-col h-full bg-[#0f0f0f] text-zinc-100 border-r border-zinc-800"}>
      {/* Sidebar Header with Title & Collapse Trigger */}
      {!isFloating && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80 bg-zinc-950/40 shrink-0">
          <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
            <Settings className="h-3.5 w-3.5 text-zinc-500" />
            Painel de Controle
          </span>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Recolher Painel"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Scrollable sections */}
      <div className={isFloating ? "flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar" : "flex-1 overflow-y-auto p-4 space-y-4"}>
        
        {/* Componentes Reutilizáveis */}
        {(!isFloating || floatingSection === 'reusableComponents') && (
          <div className={isFloating ? "overflow-hidden transition-all animate-fade-in" : "border border-zinc-800 bg-zinc-900/10 rounded-xl overflow-hidden transition-all"}>
            {!isFloating && (
              <button
                type="button"
                onClick={() => toggleSection('reusableComponents')}
                className="w-full px-4 py-3 bg-zinc-900/60 hover:bg-zinc-850/80 flex justify-between items-center text-xs font-bold text-zinc-300 uppercase tracking-wider transition-colors cursor-pointer border-b border-zinc-800/40"
              >
                <span className="flex items-center gap-1.5">
                  <Layout className="h-3.5 w-3.5 text-indigo-400" />
                  Componentes ({reusableComponents.length})
                </span>
                {openSections.reusableComponents ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
              </button>
            )}

            {(openSections.reusableComponents || isFloating) && (
              <div className={isFloating ? "p-1.5 space-y-3 bg-transparent" : "p-3 space-y-3 bg-[#0c0c0c]/40 border-t border-zinc-900"}>
                <div className="flex justify-between items-center pb-1 border-b border-zinc-850/30">
                  <span className="text-[10px] text-zinc-500">Biblioteca de Componentes</span>
                  <label className="text-[9px] bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1 font-semibold">
                    <Upload className="h-2.5 w-2.5" />
                    Importar
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportComponentJSON}
                      className="hidden"
                    />
                  </label>
                </div>

                {reusableComponents.length === 0 ? (
                  <div className="text-center py-4 px-2 border border-dashed border-zinc-800 rounded-lg text-zinc-500 text-[10px] bg-zinc-950/20 leading-relaxed">
                    Sem componentes. Selecione um bloco e clique em "Salvar como Componente" para criá-lo.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                    {reusableComponents.map((comp) => (
                      <div
                        key={comp.id}
                        draggable
                        onDragStart={(e) => handleDragComponentStart(e, comp.element)}
                        className="group flex items-center justify-between p-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-all cursor-grab active:cursor-grabbing"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <span className="block text-xs font-semibold text-zinc-200 truncate" title={comp.name}>
                            {comp.name}
                          </span>
                          <span className="inline-block text-[8px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/10 rounded px-1 mt-0.5 capitalize">
                            {comp.element.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(comp, null, 2));
                              const downloadAnchor = document.createElement('a');
                              downloadAnchor.setAttribute("href", dataStr);
                              downloadAnchor.setAttribute("download", `${comp.name.toLowerCase().replace(/\s+/g, '_')}_componente.json`);
                              document.body.appendChild(downloadAnchor);
                              downloadAnchor.click();
                              downloadAnchor.remove();
                            }}
                            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition-colors cursor-pointer"
                            title="Exportar JSON"
                          >
                            <Download className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => onInsertComponent(comp)}
                            className="p-1 hover:bg-indigo-600 hover:text-white bg-indigo-950/40 border border-indigo-900 text-indigo-300 rounded transition-colors cursor-pointer flex items-center gap-0.5 text-[10px] px-1.5 font-bold"
                          >
                            <Plus className="h-3 w-3" />
                            Inserir
                          </button>
                        </div>
                      </div>
                    ))}
                    <p className="text-[9px] text-zinc-500 text-center italic mt-1">
                      💡 Arraste e solte o componente no preview!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Biblioteca de Ícones (PNG para E-mail) */}
        {(!isFloating || floatingSection === 'iconsGallery') && (
          <div className={isFloating ? "overflow-hidden transition-all animate-fade-in" : "border border-zinc-800 bg-zinc-900/10 rounded-xl overflow-hidden transition-all animate-fade-in"}>
            {!isFloating && (
              <button
                type="button"
                onClick={() => toggleSection('iconsGallery')}
                className="w-full px-4 py-3 bg-zinc-900/60 hover:bg-zinc-850/80 flex justify-between items-center text-xs font-bold text-zinc-300 uppercase tracking-wider transition-colors cursor-pointer border-b border-zinc-800/40"
              >
                <span className="flex items-center gap-1.5">
                  <Smile className="h-3.5 w-3.5 text-pink-400" />
                  Ícones
                </span>
                {openSections.iconsGallery ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
              </button>
            )}

            {(openSections.iconsGallery || isFloating) && (
              <div className={isFloating ? "p-1.5 space-y-4 bg-transparent" : "p-3.5 space-y-4 bg-[#0c0c0c]/40 border-t border-zinc-900"}>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Escolha, configure e arraste ícones para o seu e-mail. Eles são gerados em formato <strong>PNG real</strong>, garantindo renderização correta em qualquer gerenciador de e-mail (Outlook, Gmail, etc).
                </p>

                {/* Icon Customizer Settings */}
                <div className="bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-800/60 space-y-3 text-xs">
                  {/* Color config */}
                  <ColorPalettePicker
                    color={iconColor}
                    onChange={setIconColor}
                    brandColors={visualIdentity.brandColors}
                    label="Cor do Ícone"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    {/* Style selector */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 font-bold uppercase block">Estilo</label>
                      <select
                        value={iconStyle}
                        onChange={(e) => setIconStyle(e.target.value as any)}
                        className="w-full text-[10px] bg-zinc-950 border border-zinc-800 rounded p-1.5 text-zinc-300 focus:outline-none"
                      >
                        <option value="filled">Preenchido</option>
                        <option value="outline">Contorno</option>
                        <option value="material">Arredondado</option>
                      </select>
                    </div>

                    {/* Size slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] text-zinc-500 font-bold uppercase">
                        <span>Tamanho</span>
                        <span className="text-pink-400 font-mono">{iconSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="16"
                        max="128"
                        step="4"
                        value={iconSize}
                        onChange={(e) => setIconSize(parseInt(e.target.value))}
                        className="w-full accent-pink-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Buscar ícone (ex: Facebook, star, mail)..."
                    value={iconSearch}
                    onChange={(e) => setIconSearch(e.target.value)}
                    className="w-full text-xs bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-pink-500"
                  />
                </div>

                {/* Icons grid */}
                <div className="grid grid-cols-4 gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {EMAIL_ICONS.filter(
                    (item) =>
                      item.name.toLowerCase().includes(iconSearch.toLowerCase()) ||
                      item.tag.toLowerCase().includes(iconSearch.toLowerCase())
                  ).map((item) => (
                    <div
                      key={item.tag}
                      draggable
                      onDragStart={(e) => handleDragIconStart(e, item.tag, item.name)}
                      onClick={() => handleAddIconClick(item.tag, item.name)}
                      className="group bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-pink-500/50 p-2 rounded-lg cursor-grab active:cursor-grabbing transition-all text-center flex flex-col items-center gap-1.5"
                      title="Arraste para o canvas ou clique para inserir"
                    >
                      <div 
                        className="p-1.5 bg-zinc-850/50 group-hover:bg-zinc-800 rounded transition-colors"
                        style={{ color: iconColor }}
                      >
                        {item.icon}
                      </div>
                      <span className="text-[8px] text-zinc-400 group-hover:text-zinc-200 font-medium truncate w-full block">
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[8px] text-zinc-500 text-center italic leading-none">
                  💡 Clique para adicionar ao final ou arraste para o editor!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Available blocks to Drag or Click */}
        {(!isFloating || floatingSection === 'blocks') && (
          <div className={isFloating ? "overflow-hidden transition-all animate-fade-in" : "border border-zinc-800 bg-zinc-900/10 rounded-xl overflow-hidden transition-all"}>
            {!isFloating && (
              <button
                type="button"
                onClick={() => toggleSection('blocks')}
                className="w-full px-4 py-3 bg-zinc-900/60 hover:bg-zinc-850/80 flex justify-between items-center text-xs font-bold text-zinc-300 uppercase tracking-wider transition-colors cursor-pointer border-b border-zinc-800/40"
              >
                <span className="flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-blue-400" />
                  Blocos
                </span>
                {openSections.blocks ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
              </button>
            )}

            {(openSections.blocks || isFloating) && (
              <div className={isFloating ? "p-1.5 space-y-2 bg-transparent" : "p-3 space-y-2 bg-[#0c0c0c]/40 border-t border-zinc-900 max-h-[300px] overflow-y-auto pr-1"}>
                <p className="text-[9px] text-zinc-500 text-center mb-1">
                  Arraste os blocos para o preview ou clique para adicionar ao final.
                </p>

                <div className="grid grid-cols-1 gap-2">
                  {ELEMENT_TEMPLATES.map((item) => (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.type)}
                      className="group flex items-center justify-between p-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-lg cursor-grab active:cursor-grabbing transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-zinc-800/50 group-hover:bg-zinc-800 text-blue-400 rounded-lg transition-colors">
                          {item.icon}
                        </div>
                        <div className="text-left">
                          <span className="block text-xs font-semibold text-zinc-200">{item.label}</span>
                          <span className="block text-[9px] text-zinc-500 leading-none">{item.desc}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => onAddElement(item.type)}
                        className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-md transition-colors cursor-pointer"
                        title="Adicionar ao final"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Email structural tree */}
        {(!isFloating || floatingSection === 'structure') && (
          <div className={isFloating ? "overflow-hidden transition-all animate-fade-in" : "border border-zinc-800 bg-zinc-900/10 rounded-xl overflow-hidden transition-all"}>
            {!isFloating && (
              <button
                type="button"
                onClick={() => toggleSection('structure')}
                className="w-full px-4 py-3 bg-zinc-900/60 hover:bg-zinc-850/80 flex justify-between items-center text-xs font-bold text-zinc-300 uppercase tracking-wider transition-colors cursor-pointer border-b border-zinc-800/40"
              >
                <span className="flex items-center gap-1.5">
                  <Layout className="h-3.5 w-3.5 text-indigo-400" />
                  Estrutura ({elements.length})
                </span>
                {openSections.structure ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
              </button>
            )}

            {(openSections.structure || isFloating) && (
              <div className={isFloating ? "p-1.5 bg-transparent space-y-2" : "p-3 bg-[#0c0c0c]/40 border-t border-zinc-900"}>
                {elements.length === 0 ? (
                  <div className="text-center py-5 border border-dashed border-zinc-800 rounded-lg text-zinc-500 text-[10px]">
                    O email está vazio. Adicione blocos acima.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {elements.map((el, index) => {
                      const isSelected = selectedElementId === el.id;
                      return (
                        <div
                          key={el.id}
                          onClick={() => onSelectElement(el.id)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-600 border-blue-500 text-white font-semibold shadow-sm'
                              : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-855 text-zinc-300'
                          }`}
                        >
                          <span className="truncate max-w-[120px] capitalize font-medium">
                            {index + 1}. {el.type}
                          </span>
                          <div className="flex items-center gap-0.5">
                            <button
                              disabled={index === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                moveElement(index, 'up');
                              }}
                              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-20 disabled:pointer-events-none"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              disabled={index === elements.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                moveElement(index, 'down');
                              }}
                              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-20 disabled:pointer-events-none"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteElement(el.id);
                              }}
                              className="p-1 rounded hover:bg-red-950/50 text-zinc-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Global styling */}
        {(!isFloating || floatingSection === 'globalStyles') && (
          <div className={isFloating ? "overflow-hidden transition-all animate-fade-in" : "border border-zinc-800 bg-zinc-900/10 rounded-xl overflow-hidden transition-all"}>
            {!isFloating && (
              <button
                type="button"
                onClick={() => toggleSection('globalStyles')}
                className="w-full px-4 py-3 bg-zinc-900/60 hover:bg-zinc-850/80 flex justify-between items-center text-xs font-bold text-zinc-300 uppercase tracking-wider transition-colors cursor-pointer border-b border-zinc-800/40"
              >
                <span className="flex items-center gap-1.5">
                  <Settings className="h-3.5 w-3.5 text-zinc-400" />
                  Estilos
                </span>
                {openSections.globalStyles ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
              </button>
            )}

            {(openSections.globalStyles || isFloating) && (
              <div className={isFloating ? "p-1.5 space-y-4 bg-transparent" : "p-3.5 space-y-4 bg-[#0c0c0c]/40 border-t border-zinc-900"}>
                {/* Background Canvas */}
                <ColorPalettePicker
                  color={globalStyles.backgroundColor}
                  onChange={(newColor) => onUpdateGlobalStyles({ ...globalStyles, backgroundColor: newColor })}
                  brandColors={visualIdentity.brandColors}
                  label="Fundo da Tela"
                />

                {/* Background Card */}
                <ColorPalettePicker
                  color={globalStyles.containerColor}
                  onChange={(newColor) => onUpdateGlobalStyles({ ...globalStyles, containerColor: newColor })}
                  brandColors={visualIdentity.brandColors}
                  label="Bloco do E-mail"
                />

                {/* Padding Card slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-400">
                    <span>Espaçamento Interno</span>
                    <span className="text-blue-400 font-mono">{globalStyles.padding}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="120"
                    value={globalStyles.padding}
                    onChange={(e) => onUpdateGlobalStyles({ ...globalStyles, padding: parseInt(e.target.value) })}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>

                {/* Border radius Card */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-400">
                    <span>Cantos Arredondados</span>
                    <span className="text-blue-400 font-mono">{globalStyles.borderRadius}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={globalStyles.borderRadius}
                    onChange={(e) => onUpdateGlobalStyles({ ...globalStyles, borderRadius: parseInt(e.target.value) })}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>

                {/* Width Limiter checkbox / toggle */}
                <div className="flex items-center justify-between pt-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Limitar Largura</label>
                  <button
                    type="button"
                    onClick={() => onUpdateGlobalStyles({ ...globalStyles, hasWidthLimit: globalStyles.hasWidthLimit === false ? true : false })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      globalStyles.hasWidthLimit !== false ? 'bg-blue-600' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        globalStyles.hasWidthLimit !== false ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Width slider, shown/active based on limit */}
                {globalStyles.hasWidthLimit !== false && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-400">
                      <span>Largura do Corpo</span>
                      <span className="text-blue-400 font-mono">{globalStyles.bodyWidth || 600}px</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="400"
                        max="1200"
                        step="10"
                        value={globalStyles.bodyWidth || 600}
                        onChange={(e) => onUpdateGlobalStyles({ ...globalStyles, bodyWidth: parseInt(e.target.value) })}
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                      <input
                        type="number"
                        min="400"
                        max="1200"
                        value={globalStyles.bodyWidth || 600}
                        onChange={(e) => onUpdateGlobalStyles({ ...globalStyles, bodyWidth: Math.max(400, Math.min(1200, parseInt(e.target.value) || 600)) })}
                        className="w-16 text-center text-xs bg-zinc-900 border border-zinc-800 rounded p-1 text-zinc-300 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Alignments: Left, Center, Right */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Alinhamento do Corpo</label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { val: 'left', label: 'Esquerda', icon: AlignLeft },
                      { val: 'center', label: 'Centro', icon: AlignCenter },
                      { val: 'right', label: 'Direita', icon: AlignRight }
                    ].map((item) => {
                      const Icon = item.icon;
                      const isActive = (globalStyles.bodyAlignment || 'center') === item.val;
                      return (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => onUpdateGlobalStyles({ ...globalStyles, bodyAlignment: item.val as 'left' | 'center' | 'right' })}
                          className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                            isActive
                              ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                              : 'bg-zinc-900 border-zinc-880 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                          }`}
                          title={item.label}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span className="hidden xl:inline">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Margin top & bottom */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-400">
                      <span>Margem Sup</span>
                      <span className="text-blue-400 font-mono">{globalStyles.bodyMarginTop ?? 40}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="120"
                      step="4"
                      value={globalStyles.bodyMarginTop ?? 40}
                      onChange={(e) => onUpdateGlobalStyles({ ...globalStyles, bodyMarginTop: parseInt(e.target.value) })}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-400">
                      <span>Margem Inf</span>
                      <span className="text-blue-400 font-mono">{globalStyles.bodyMarginBottom ?? 40}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="120"
                      step="4"
                      value={globalStyles.bodyMarginBottom ?? 40}
                      onChange={(e) => onUpdateGlobalStyles({ ...globalStyles, bodyMarginBottom: parseInt(e.target.value) })}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Font Family select */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Fonte do Texto</label>
                  <select
                    value={globalStyles.fontFamily}
                    onChange={(e) => onUpdateGlobalStyles({ ...globalStyles, fontFamily: e.target.value })}
                    className="w-full text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="system-ui, -apple-system, sans-serif">Sans-Serif (Moderna)</option>
                    <option value="Georgia, serif">Georgia (Elegante)</option>
                    <option value="Courier New, monospace">Courier (Técnica)</option>
                    <option value="'Inter', sans-serif">Inter (Design limpo)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
