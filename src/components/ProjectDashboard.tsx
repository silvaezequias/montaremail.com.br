import React, { useState, useRef } from 'react';
import { Project, EmailTemplate, EmailElement, VisualIdentity, ReusableComponent } from '../types';
import { DEFAULT_TEMPLATES } from '../utils';
import MiniTemplatePreview from './MiniTemplatePreview';
import communityTemplate from '../../templates/community/newsletter_comunidade.json';
import {
  Folder,
  FileText,
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  Eye,
  Copy,
  ChevronRight,
  Sparkles,
  Palette,
  Layers,
  Settings,
  X,
  ArrowRight,
  ExternalLink,
  Lock,
  Clock,
  CheckCircle,
  File,
  AlertTriangle,
  Mail,
  Sliders,
  Inbox,
  Users,
  Github
} from 'lucide-react';

const COMMUNITY_TEMPLATES: EmailTemplate[] = [
  communityTemplate as unknown as EmailTemplate
];

interface ProjectDashboardProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string, baseTemplate?: EmailTemplate) => void;
  onRenameProject: (id: string, name: string) => void;
  onDeleteProject: (id: string) => void;
  onExportProject: (project: Project) => void;
  onImportProjects: (importedProjects: Project[]) => void;
  
  // Model operations inside active project
  onCreateTemplate: (projectId: string, name: string, baseTemplate?: EmailTemplate) => void;
  onDeleteTemplate: (projectId: string, templateId: string) => void;
  onDuplicateTemplate: (projectId: string, templateId: string) => void;
  onSelectTemplate: (projectId: string, templateId: string) => void;
  
  // App brand logo
  logoUrl?: string;
}

export default function ProjectDashboard({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  onExportProject,
  onImportProjects,
  onCreateTemplate,
  onDeleteTemplate,
  onDuplicateTemplate,
  onSelectTemplate,
  logoUrl = 'https://montaremail.com.br/logo_icon.png'
}: ProjectDashboardProps) {
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedBaseTemplateIndex, setSelectedBaseTemplateIndex] = useState<number>(-1); // -1 for blank
  
  const [showNewModelModal, setShowNewModelModal] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [selectedBaseModelIndex, setSelectedBaseModelIndex] = useState<number>(-1); // -1 for blank
  
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [previewVisualIdentity, setPreviewVisualIdentity] = useState<VisualIdentity | null>(null);
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dashboardTab, setDashboardTab] = useState<'project' | 'predefined' | 'community'>('project');
  const [confirmDeleteProjectId, setConfirmDeleteProjectId] = useState<string | null>(null);
  const [confirmDeleteTemplateId, setConfirmDeleteTemplateId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  const handleExport = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    onExportProject(project);
    showToast(`Projeto "${project.name}" exportado com sucesso!`);
  };

  const handleExportTemplate = (template: EmailTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `modelo_${template.name.toLowerCase().replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Modelo "${template.name}" exportado com sucesso!`);
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const importedArray = Array.isArray(parsed) ? parsed : [parsed];
        
        // Basic validation
        const validProjects = importedArray.filter((p: any) => p && p.id && p.name && Array.isArray(p.templates));
        if (validProjects.length === 0) {
          showToast('Nenhum projeto válido encontrado no arquivo.');
          return;
        }

        onImportProjects(validProjects);
        showToast(`${validProjects.length} projeto(s) importado(s) com sucesso!`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        showToast('Erro ao ler o arquivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleImportModelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed || !parsed.name || !Array.isArray(parsed.elements)) {
          showToast('Modelo inválido ou corrompido no arquivo JSON.');
          return;
        }

        onCreateTemplate(activeProject.id, parsed.name, parsed);
        showToast(`Modelo "${parsed.name}" importado com sucesso!`);
        if (modelFileInputRef.current) modelFileInputRef.current.value = '';
      } catch (err) {
        showToast('Erro ao ler o arquivo JSON do modelo.');
      }
    };
    reader.readAsText(file);
  };

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    
    const baseTemplate = selectedBaseTemplateIndex === -1 ? undefined : DEFAULT_TEMPLATES[selectedBaseTemplateIndex];
    onCreateProject(newProjectName.trim(), baseTemplate);
    setShowNewProjectModal(false);
    setNewProjectName('');
    setSelectedBaseTemplateIndex(-1);
    showToast('Projeto criado com sucesso!');
  };

  const handleCreateModelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelName.trim() || !activeProject) return;

    const baseTemplate = selectedBaseModelIndex === -1 ? undefined : DEFAULT_TEMPLATES[selectedBaseModelIndex];
    onCreateTemplate(activeProject.id, newModelName.trim(), baseTemplate);
    setShowNewModelModal(false);
    setNewModelName('');
    setSelectedBaseModelIndex(-1);
    showToast('Novo modelo criado no projeto!');
  };

  const handleStartRename = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProjectId(project.id);
    setEditingProjectName(project.name);
  };

  const handleSaveRename = (project: Project, e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProjectName.trim()) return;
    onRenameProject(project.id, editingProjectName.trim());
    setEditingProjectId(null);
    showToast('Projeto renomeado!');
  };

  // Helper to render elements inside the modal for preview
  const renderPreviewElement = (el: EmailElement, visId: VisualIdentity | null): React.ReactNode => {
    const s = el.styles || {};
    
    // Apply visual identity background or colors if needed
    let customColor = s.textColor;
    let customBg = s.backgroundColor;
    let customBorder = s.borderColor;

    // Simulate conditional color rule preview
    if (visId && visId.colorRules && visId.colorRules.length > 0) {
      const rule = visId.colorRules[0];
      // In preview, we default to the "true" state color if it matches standard keys, or let it be
      if (el.type === 'button') {
        customBg = rule.colorIfTrue;
      }
    }

    const inlineStyles: React.CSSProperties = {
      color: customColor,
      backgroundColor: customBg,
      fontSize: s.fontSize ? `${s.fontSize}px` : undefined,
      fontWeight: s.fontWeight,
      textAlign: s.align || 'left',
      paddingTop: s.paddingTop ? `${s.paddingTop}px` : undefined,
      paddingBottom: s.paddingBottom ? `${s.paddingBottom}px` : undefined,
      paddingLeft: s.paddingLeft ? `${s.paddingLeft}px` : undefined,
      paddingRight: s.paddingRight ? `${s.paddingRight}px` : undefined,
      marginTop: s.marginTop ? `${s.marginTop}px` : undefined,
      marginBottom: s.marginBottom ? `${s.marginBottom}px` : undefined,
      borderRadius: s.borderRadius ? `${s.borderRadius}px` : undefined,
      borderWidth: s.borderWidth ? `${s.borderWidth}px` : undefined,
      borderColor: customBorder,
      borderStyle: s.borderWidth ? 'solid' : undefined,
      width: s.width ? `${s.width}px` : undefined,
      height: s.height ? `${s.height}px` : undefined,
    };

    // Replace basic variables like {{userName}}
    const replaceVars = (text: string) => {
      let result = text;
      // Default placeholder variables
      const vars = [
        { key: 'userName', value: 'Ezequias Lopes' },
        { key: 'discountPercent', value: '30%' },
        { key: 'couponCode', value: 'INBOX30' },
        { key: 'appUrl', value: 'https://meuapp.com' }
      ];
      vars.forEach(v => {
        result = result.replace(new RegExp(`{{\\s*${v.key}\\s*}}`, 'g'), v.value);
      });
      return result;
    };

    switch (el.type) {
      case 'heading':
        return (
          <h2 key={el.id} style={inlineStyles} className="font-extrabold tracking-tight">
            {replaceVars(el.content)}
          </h2>
        );
      case 'text':
        return (
          <p key={el.id} style={inlineStyles} className="whitespace-pre-line leading-relaxed text-sm">
            {replaceVars(el.content)}
          </p>
        );
      case 'button':
        return (
          <div key={el.id} className="w-full flex justify-center">
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              style={{
                ...inlineStyles,
                display: 'inline-block',
                textDecoration: 'none',
              }}
              className="font-bold shadow-md hover:opacity-90 transition-all text-center"
            >
              {replaceVars(el.content)}
            </a>
          </div>
        );
      case 'image':
        return (
          <div key={el.id} className="w-full flex justify-center">
            <img
              src={el.src || 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=800'}
              alt={el.alt || 'Preview'}
              style={{
                width: s.width ? `${s.width}px` : '100%',
                maxHeight: s.height ? `${s.height}px` : '400px',
                borderRadius: s.borderRadius ? `${s.borderRadius}px` : '12px',
                objectFit: 'cover'
              }}
              referrerPolicy="no-referrer"
            />
          </div>
        );
      case 'divider':
        return (
          <hr
            key={el.id}
            style={{
              borderTopWidth: s.borderWidth || '2px',
              borderTopColor: s.borderColor || '#e2e8f0',
              marginTop: s.marginTop ? `${s.marginTop}px` : '16px',
              marginBottom: s.marginBottom ? `${s.marginBottom}px` : '16px',
            }}
          />
        );
      case 'spacer':
        return <div key={el.id} style={{ height: s.height ? `${s.height}px` : '24px' }} />;
      case 'container':
        return (
          <div
            key={el.id}
            style={{
              ...inlineStyles,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
            className="border border-dashed border-zinc-200/50 p-4"
          >
            {el.children?.map(child => renderPreviewElement(child, visId))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0a0b] text-zinc-100 overflow-y-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 bg-zinc-900 text-zinc-100 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg border border-zinc-800 flex items-center gap-2 z-50 animate-bounce">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="border-b border-zinc-900 bg-zinc-950/40 py-8 px-8 flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[200px] pointer-events-none opacity-20 z-0">
          <div className="absolute top-[-30%] right-[10%] w-[250px] h-[250px] rounded-full bg-blue-600 blur-[80px]" />
          <div className="absolute top-[10%] right-[30%] w-[150px] h-[150px] rounded-full bg-purple-600 blur-[60px]" />
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center shrink-0">
            <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Gerenciador de Projetos
              <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold border border-blue-500/20">
                InboxFlow
              </span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Organize seus e-mails em grupos de projetos com identidades visuais e componentes independentes.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5 text-blue-400" />
            Importar Projeto
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFileChange}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => setShowNewProjectModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-550 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-950/20"
          >
            <Plus className="h-4 w-4" />
            Criar Novo Projeto
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 flex overflow-hidden min-h-[500px]">
        {/* Left Sidebar: Projects List */}
        <div className="w-80 shrink-0 border-r border-zinc-900 bg-[#0c0c0d] p-5 flex flex-col gap-4 overflow-y-auto">
          <div className="flex justify-between items-center px-1">
            <span className="text-[11px] font-bold uppercase text-zinc-500 tracking-wider">Seus Projetos ({projects.length})</span>
          </div>

          <div className="flex flex-col gap-2">
            {projects.map((proj) => {
              const isActive = proj.id === activeProject.id;
              const isEditing = editingProjectId === proj.id;

              return (
                <div
                  key={proj.id}
                  onClick={() => onSelectProject(proj.id)}
                  className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                    isActive
                      ? 'bg-gradient-to-b from-zinc-900 to-zinc-900/60 border-blue-500/30 shadow-md shadow-blue-950/5'
                      : 'bg-zinc-950/40 border-zinc-900 hover:bg-zinc-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Folder className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-zinc-500'}`} />
                      {isEditing ? (
                        <form
                          onSubmit={(e) => handleSaveRename(proj, e)}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5"
                        >
                          <input
                            type="text"
                            value={editingProjectName}
                            onChange={(e) => setEditingProjectName(e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-xs font-semibold text-zinc-100 focus:outline-none focus:border-blue-500 w-32"
                            autoFocus
                          />
                          <button
                            type="submit"
                            className="p-1 text-emerald-400 hover:text-emerald-300"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs font-bold text-zinc-200 truncate leading-none">
                          {proj.name}
                        </span>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        {confirmDeleteProjectId === proj.id ? (
                          <div className="flex items-center gap-1.5 bg-red-950/80 border border-red-500/30 px-1.5 py-0.5 rounded-lg">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteProject(proj.id);
                                setConfirmDeleteProjectId(null);
                                showToast('Projeto excluído.');
                              }}
                              className="text-[9px] text-red-400 hover:text-red-350 font-black uppercase tracking-wider cursor-pointer"
                              title="Confirmar Exclusão"
                            >
                              Excluir
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteProjectId(null);
                              }}
                              className="text-[9px] text-zinc-400 hover:text-zinc-200 font-black uppercase tracking-wider cursor-pointer px-0.5"
                              title="Cancelar"
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={(e) => handleStartRename(proj, e)}
                              title="Renomear Projeto"
                              className="p-1 text-zinc-400 hover:text-white rounded transition-colors"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => handleExport(proj, e)}
                              title="Exportar Projeto"
                              className="p-1 text-zinc-400 hover:text-blue-400 rounded transition-colors"
                            >
                              <Download className="h-3 w-3" />
                            </button>
                            {projects.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteProjectId(proj.id);
                                }}
                                title="Excluir Projeto"
                                className="p-1 text-zinc-400 hover:text-red-400 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-semibold px-0.5">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3 text-zinc-600" />
                      {proj.templates.length} {proj.templates.length === 1 ? 'modelo' : 'modelos'}
                    </span>
                    <span>
                      {new Date(proj.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Area: Models & Identity of Active Project */}
        <div className="flex-1 p-8 overflow-y-auto flex flex-col gap-8">
          {/* Active Project Card with visual identity configuration summary */}
          {activeProject && (
            <div className="bg-zinc-950/30 border border-zinc-900 rounded-2xl p-6 flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-bold">
                    PROJETO ATIVO
                  </span>
                  <span className="text-zinc-500 text-xs font-semibold">•</span>
                  <span className="text-xs text-zinc-400 font-semibold">
                    {activeProject.templates.length} {activeProject.templates.length === 1 ? 'Modelo Disponível' : 'Modelos Disponíveis'}
                  </span>
                </div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  {activeProject.name}
                </h2>
                <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                  Todos os modelos abaixo compartilham a mesma identidade visual de assinatura e regras de cores condicionais. Edite as cores da marca para refletir o design da empresa em tempo real em todos os templates.
                </p>
              </div>

              {/* Shared Visual Identity summary widget */}
              <div className="border border-zinc-900 bg-[#0d0d0f] rounded-xl p-4 md:w-80 flex flex-col justify-between gap-4">
                <div className="flex justify-between items-center border-b border-zinc-850 pb-2">
                  <span className="text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider flex items-center gap-1">
                    <Palette className="h-3 w-3 text-indigo-400" /> Identidade Visual
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">Compartilhada</span>
                </div>

                <div className="space-y-3">
                  {/* Colors */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Cores da Marca:</span>
                    <div className="flex gap-2">
                      {activeProject.visualIdentity?.brandColors?.slice(0, 4).map((c, i) => (
                        <div
                          key={c.id || i}
                          style={{ backgroundColor: c.value }}
                          className="w-5 h-5 rounded-full border border-zinc-800 shadow-sm"
                          title={`${c.name}: ${c.value}`}
                        />
                      ))}
                      {(!activeProject.visualIdentity?.brandColors || activeProject.visualIdentity.brandColors.length === 0) && (
                        <span className="text-[10px] text-zinc-500 font-semibold italic">Nenhuma configurada</span>
                      )}
                    </div>
                  </div>

                  {/* Signature */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Assinatura do Projeto:</span>
                    <div className="bg-zinc-900/60 rounded px-2 py-1.5 border border-zinc-850">
                      <p className="text-[11px] font-bold text-zinc-200 truncate leading-tight">
                        {activeProject.visualIdentity?.signatureName || 'Não configurada'}
                      </p>
                      <p className="text-[9px] text-zinc-500 truncate leading-none mt-0.5">
                        {activeProject.visualIdentity?.signatureRole || 'Cargo'} na {activeProject.visualIdentity?.signatureCompany || 'Empresa'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
              {/* CARDS DE SELEÇÃO DE MODELOS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b border-zinc-900">
            {/* Card 1: Modelos Deste Projeto */}
            <button
              type="button"
              onClick={() => setDashboardTab('project')}
              className={`p-5 rounded-2xl border transition-all duration-300 text-left cursor-pointer relative group flex flex-col justify-between h-40 ${
                dashboardTab === 'project'
                  ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/5'
                  : 'border-zinc-850 hover:border-zinc-800 bg-zinc-950/20 hover:bg-zinc-950/40'
              }`}
            >
              <div className="space-y-2 w-full">
                <div className="flex justify-between items-start w-full">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    dashboardTab === 'project' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-zinc-900 text-zinc-500 group-hover:text-zinc-400'
                  }`}>
                    <Folder className="h-5 w-5" />
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    dashboardTab === 'project' ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/40' : 'bg-zinc-900 text-zinc-500 border border-zinc-850'
                  }`}>
                    {activeProject?.templates.length || 0} Modelos
                  </span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200 group-hover:text-white">
                    Modelos deste Projeto
                  </h4>
                  <p className="text-[11px] text-zinc-500 leading-normal line-clamp-2">
                    Edite ou crie modelos de e-mail personalizados e exclusivos salvos dentro deste projeto.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 mt-2">
                <span>Visualizar Modelos</span>
                <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Card 2: Templates Predefinidos */}
            <button
              type="button"
              onClick={() => setDashboardTab('predefined')}
              className={`p-5 rounded-2xl border transition-all duration-300 text-left cursor-pointer relative group flex flex-col justify-between h-40 ${
                dashboardTab === 'predefined'
                  ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/5'
                  : 'border-zinc-850 hover:border-zinc-800 bg-zinc-950/20 hover:bg-zinc-950/40'
              }`}
            >
              <div className="space-y-2 w-full">
                <div className="flex justify-between items-start w-full">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    dashboardTab === 'predefined' ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-900 text-zinc-500 group-hover:text-zinc-400'
                  }`}>
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    dashboardTab === 'predefined' ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40' : 'bg-zinc-900 text-zinc-500 border border-zinc-850'
                  }`}>
                    {DEFAULT_TEMPLATES.length} Disponíveis
                  </span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200 group-hover:text-white">
                    Templates Predefinidos
                  </h4>
                  <p className="text-[11px] text-zinc-500 leading-normal line-clamp-2">
                    Comece rapidamente a partir de modelos prontos de alta conversão, incluindo o especial para a Gabrielle.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 mt-2">
                <span>Explorar Templates</span>
                <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Card 3: Templates da Comunidade */}
            <button
              type="button"
              onClick={() => setDashboardTab('community')}
              className={`p-5 rounded-2xl border transition-all duration-300 text-left cursor-pointer relative group flex flex-col justify-between h-40 ${
                dashboardTab === 'community'
                  ? 'border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/5'
                  : 'border-zinc-850 hover:border-zinc-800 bg-zinc-950/20 hover:bg-zinc-950/40'
              }`}
            >
              <div className="space-y-2 w-full">
                <div className="flex justify-between items-start w-full">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    dashboardTab === 'community' ? 'bg-sky-500/20 text-sky-300' : 'bg-zinc-900 text-zinc-500 group-hover:text-zinc-400'
                  }`}>
                    <Users className="h-5 w-5" />
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    dashboardTab === 'community' ? 'bg-sky-500/30 text-sky-200 border border-sky-500/40' : 'bg-zinc-900 text-zinc-500 border border-zinc-850'
                  }`}>
                    {COMMUNITY_TEMPLATES.length} Contribuições
                  </span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200 group-hover:text-white">
                    Templates da Comunidade
                  </h4>
                  <p className="text-[11px] text-zinc-500 leading-normal line-clamp-2">
                    Modelos enviados pela comunidade de código aberto via Pull Requests no GitHub.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-sky-400 mt-2">
                <span>Explorar Comunidade</span>
                <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>

          {/* RENDERING ACTIVE SECTION */}
          {dashboardTab === 'project' && (
            /* Section 1: Modelos deste Projeto */
            <div className="space-y-5 pt-2">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    Modelos Deste Projeto ({activeProject?.templates.length || 0})
                  </h3>
                  <p className="text-xs text-zinc-500">Selecione um modelo criado neste projeto para editar ou visualizar no canvas.</p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={modelFileInputRef}
                    onChange={handleImportModelFileChange}
                    accept=".json"
                    className="hidden"
                  />
                  <button
                    onClick={() => modelFileInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-zinc-200 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                  >
                    <Upload className="h-4 w-4 text-indigo-400" />
                    Importar Modelo
                  </button>

                  <button
                    onClick={() => setShowNewModelModal(true)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-550 hover:to-indigo-550 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                    Criar Novo Modelo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Blank model option card inside project templates section */}
                <div
                  onClick={() => onSelectTemplate(activeProject.id, 'blank')}
                  className="group relative border-2 border-dashed border-zinc-850 hover:border-indigo-550/40 bg-zinc-950/20 hover:bg-zinc-900/20 rounded-2xl p-5 transition-all cursor-pointer flex flex-col justify-between text-center h-[350px]"
                >
                  <div className="w-full h-36 rounded-xl border border-dashed border-zinc-800/80 bg-zinc-900/10 flex items-center justify-center transition-colors group-hover:border-indigo-550/30 group-hover:bg-indigo-550/5">
                    <Plus className="h-6 w-6 text-zinc-600 group-hover:text-indigo-400 transition-all" />
                  </div>
                  <div className="space-y-1 pb-4">
                    <h4 className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors">
                      Novo Modelo em Branco 📄
                    </h4>
                    <p className="text-[10px] text-zinc-500 leading-normal max-w-xs px-2">
                      Comece do zero com uma estrutura totalmente limpa para compor seu e-mail.
                    </p>
                  </div>
                  <div className="w-full py-2 bg-zinc-900 border border-zinc-850 rounded-xl text-zinc-400 font-bold text-xs group-hover:text-white group-hover:bg-indigo-600 group-hover:border-indigo-500 transition-all">
                    Criar Modelo Limpo
                  </div>
                </div>

                {/* List of custom templates of this project */}
                {activeProject?.templates?.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800 rounded-2xl p-5 transition-all flex flex-col justify-between h-[350px] group relative"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="w-8 h-8 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center shrink-0">
                          <Mail className="h-4 w-4" />
                        </div>

                        {/* Hover action bar for duplicating / deleting models */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {confirmDeleteTemplateId === tpl.id ? (
                            <div className="flex items-center gap-1.5 bg-red-950/85 border border-red-500/30 px-1.5 py-0.5 rounded-lg">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteTemplate(activeProject.id, tpl.id);
                                  setConfirmDeleteTemplateId(null);
                                  showToast('Modelo excluído.');
                                }}
                                className="text-[9px] text-red-400 hover:text-red-350 font-black uppercase tracking-wider px-1 cursor-pointer"
                                title="Confirmar"
                              >
                                Excluir
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteTemplateId(null);
                                }}
                                className="text-[9px] text-zinc-400 hover:text-zinc-200 font-black uppercase tracking-wider px-1 cursor-pointer"
                                title="Cancelar"
                              >
                                X
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExportTemplate(tpl, e);
                                }}
                                title="Exportar Modelo"
                                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-850 rounded-lg transition-all cursor-pointer"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDuplicateTemplate(activeProject.id, tpl.id);
                                  showToast('Modelo duplicado!');
                                }}
                                title="Duplicar Modelo"
                                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-850 rounded-lg transition-all"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteTemplateId(tpl.id);
                                }}
                                title="Excluir Modelo"
                                className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-900 border border-transparent hover:border-zinc-850 rounded-lg transition-all cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Mini visual representation of custom templates */}
                      <MiniTemplatePreview template={tpl} />

                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors truncate">
                          {tpl.name}
                        </h4>
                        <p className="text-[10px] font-semibold text-zinc-500 flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          {tpl.elements?.length || 0} blocos estruturais
                        </p>
                      </div>
                    </div>

                    {/* Primary actions row */}
                    <div className="pt-3 border-t border-zinc-900/80 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewTemplate(tpl);
                          setPreviewVisualIdentity(activeProject.visualIdentity);
                        }}
                        className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 text-zinc-300 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5 text-indigo-400" />
                        Visualizar
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectTemplate(activeProject.id, tpl.id)}
                        className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-550 hover:to-indigo-550 active:scale-95 text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        Editar
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dashboardTab === 'predefined' && (
            /* Section 2: Templates Predefinidos */
            <div className="space-y-5 pt-2">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-amber-400 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Templates Predefinidos
                </h3>
                <p className="text-xs text-zinc-500">Escolha um dos modelos abaixo para visualizar a identidade visual ou carregar uma cópia no seu projeto atual.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* DEFAULT_TEMPLATES pre-defined */}
                {DEFAULT_TEMPLATES.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="bg-zinc-950/20 border border-zinc-900/60 hover:border-zinc-800 rounded-2xl p-5 transition-all flex flex-col justify-between h-[350px] group relative"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center shrink-0">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportTemplate(tpl, e);
                            }}
                            title="Exportar Modelo Base"
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-850 rounded-lg transition-all cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5 text-amber-400" />
                          </button>
                          <span className="bg-zinc-900 text-[9px] text-zinc-400 font-bold px-2.5 py-0.5 rounded-full border border-zinc-800 uppercase tracking-wider">
                            Template Base
                          </span>
                        </div>
                      </div>

                      {/* Mini visual representation of pre-defined templates */}
                      <MiniTemplatePreview template={tpl} />

                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors truncate">
                          {tpl.name}
                        </h4>
                        <p className="text-[10px] text-zinc-500 line-clamp-1 leading-relaxed">
                          {tpl.id === 'romantic_gabrielle'
                            ? 'Lindo template temático com amor, corações e detalhes românticos.'
                            : 'Modelo otimizado com design limpo, pronto para ser personalizado.'}
                        </p>
                      </div>
                    </div>

                    {/* Predefined actions row */}
                    <div className="pt-3 border-t border-zinc-900/60 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewTemplate(tpl);
                          setPreviewVisualIdentity(activeProject.visualIdentity);
                        }}
                        className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 text-zinc-300 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5 text-indigo-400" />
                        Visualizar
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onCreateTemplate(activeProject.id, tpl.name, tpl);
                          showToast(`Modelo "${tpl.name}" criado no projeto!`);
                        }}
                        className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-750 text-zinc-200 hover:text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-1.5 font-semibold group-hover:bg-zinc-850"
                      >
                        Usar Modelo
                        <ArrowRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dashboardTab === 'community' && (
            /* Section 3: Templates da Comunidade */
            <div className="space-y-5 pt-2">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-sky-400 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Templates da Comunidade
                </h3>
                <p className="text-xs text-zinc-500">
                  Modelos de e-mail de alta qualidade criados e compartilhados pela comunidade open source via Pull Request no GitHub.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {COMMUNITY_TEMPLATES.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="bg-zinc-950/20 border border-zinc-900/60 hover:border-zinc-800 rounded-2xl p-5 transition-all flex flex-col justify-between h-[350px] group relative animate-fade-in"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="w-9 h-9 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl flex items-center justify-center shrink-0">
                          <Users className="h-4 w-4" />
                        </div>
                        
                        {tpl.author && (
                          <a
                            href={`https://github.com/${tpl.author.github}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-zinc-900 hover:bg-zinc-850 text-[10px] text-zinc-400 hover:text-white font-bold px-3 py-1 rounded-full border border-zinc-850 flex items-center gap-1 transition-all cursor-pointer shadow"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Github className="h-3 w-3 text-zinc-500 group-hover:text-white" />
                            <span>@{tpl.author.github}</span>
                          </a>
                        )}
                      </div>

                      {/* Mini visual representation of community templates in 3:4 */}
                      <MiniTemplatePreview template={tpl} />

                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors truncate">
                          {tpl.name}
                        </h4>
                        <p className="text-[10px] text-zinc-500 leading-relaxed">
                          Por: <span className="font-semibold text-zinc-400">{tpl.author?.name || 'Autor'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-3 border-t border-zinc-900/60 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewTemplate(tpl);
                          setPreviewVisualIdentity(activeProject.visualIdentity);
                        }}
                        className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 text-zinc-300 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5 text-sky-400" />
                        Visualizar
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onCreateTemplate(activeProject.id, tpl.name, tpl);
                          showToast(`Modelo "${tpl.name}" criado no projeto!`);
                        }}
                        className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-750 text-zinc-200 hover:text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-1.5 font-semibold group-hover:bg-zinc-850"
                      >
                        Usar Modelo
                        <ArrowRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Visual Preview of Selected Model */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Eye className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Visualização do Modelo: {previewTemplate.name}
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
                    Identidade Visual Aplicada
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setPreviewTemplate(null);
                  setPreviewVisualIdentity(null);
                }}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Email Body Container */}
            <div className="flex-1 overflow-y-auto p-6 bg-zinc-950 flex justify-center items-start">
              {/* Actual email styled container */}
              <div
                style={{
                  backgroundColor: previewTemplate.globalStyles.containerColor || '#ffffff',
                  fontFamily: previewTemplate.globalStyles.fontFamily || 'Inter, sans-serif',
                  borderRadius: `${previewTemplate.globalStyles.borderRadius || 16}px`,
                  padding: `${previewTemplate.globalStyles.padding || 32}px`,
                  color: previewTemplate.globalStyles.textColor || '#1e293b',
                  width: '100%',
                  maxWidth: `${previewTemplate.globalStyles.bodyWidth || 600}px`,
                }}
                className="shadow-xl"
              >
                {/* Render nested elements */}
                <div className="space-y-4">
                  {previewTemplate.elements.map(el => renderPreviewElement(el, previewVisualIdentity))}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 border-t border-zinc-800 flex justify-between items-center bg-zinc-950/20">
              <span className="text-[11px] font-semibold text-zinc-500">
                A visualização substitui as variáveis dinâmicas por exemplos estáticos.
              </span>

              <button
                type="button"
                onClick={() => {
                  const tplId = previewTemplate.id;
                  setPreviewTemplate(null);
                  setPreviewVisualIdentity(null);
                  onSelectTemplate(activeProject.id, tplId);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-550 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                Editar Este Modelo
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create New Project */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateProjectSubmit}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-fade-in"
          >
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Folder className="h-4 w-4 text-blue-400" />
                Criar Novo Projeto
              </h3>
              <button
                type="button"
                onClick={() => setShowNewProjectModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">Nome do Projeto</label>
                <input
                  type="text"
                  placeholder="Ex: Campanhas de Marketing, Lançamento SaaS"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-semibold text-zinc-100 focus:outline-none focus:border-blue-500"
                  required
                  autoFocus
                />
              </div>

              {/* Choose Base template model */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400">Modelo Inicial do Projeto</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => setSelectedBaseTemplateIndex(-1)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                      selectedBaseTemplateIndex === -1
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                        : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    📄 Modelo em Branco
                  </button>

                  {DEFAULT_TEMPLATES.map((t, idx) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedBaseTemplateIndex(idx)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold truncate transition-all ${
                        selectedBaseTemplateIndex === idx
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                          : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700'
                      }`}
                      title={t.name}
                    >
                      ✉️ {t.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 flex gap-3">
              <button
                type="button"
                onClick={() => setShowNewProjectModal(false)}
                className="flex-1 py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white text-xs font-bold rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-550 text-white text-xs font-bold rounded-xl transition-all shadow-lg"
              >
                Criar Projeto
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Create New Model inside Active Project */}
      {showNewModelModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateModelSubmit}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-fade-in"
          >
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-blue-400" />
                Criar Novo Modelo de E-mail
              </h3>
              <button
                type="button"
                onClick={() => setShowNewModelModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">Nome do Modelo</label>
                <input
                  type="text"
                  placeholder="Ex: Newsletter Semanal, Cupom de Aniversário"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-semibold text-zinc-100 focus:outline-none focus:border-blue-500"
                  required
                  autoFocus
                />
              </div>

              {/* Choose Base template model */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400">Base Estrutural</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => setSelectedBaseModelIndex(-1)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                      selectedBaseModelIndex === -1
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                        : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    📄 Modelo em Branco
                  </button>

                  {DEFAULT_TEMPLATES.map((t, idx) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedBaseModelIndex(idx)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold truncate transition-all ${
                        selectedBaseModelIndex === idx
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                          : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700'
                      }`}
                      title={t.name}
                    >
                      ✉️ {t.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 flex gap-3">
              <button
                type="button"
                onClick={() => setShowNewModelModal(false)}
                className="flex-1 py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white text-xs font-bold rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-550 text-white text-xs font-bold rounded-xl transition-all shadow-lg"
              >
                Criar Modelo
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
