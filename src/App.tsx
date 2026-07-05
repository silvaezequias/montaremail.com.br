import React, { useState, useEffect, useRef } from 'react';
import { EmailElement, EmailTemplate, ElementType, EmailVariable, ReusableComponent, VisualIdentity, BrandColor, ColorRule, Project } from './types';
import { DEFAULT_TEMPLATES } from './utils';
import Sidebar from './components/Sidebar';
import { FloatingSectionPanel } from './components/FloatingSectionPanel';
import Canvas from './components/Canvas';
import SettingsPanel from './components/SettingsPanel';
import VariablesManager from './components/VariablesManager';
import ExportModal from './components/ExportModal';
import StorageManagerModal from './components/StorageManagerModal';
import ComponentsWorkspace from './components/ComponentsWorkspace';
import VisualIdentityWorkspace from './components/VisualIdentityWorkspace';
import LandingPage from './components/LandingPage';
import ProjectDashboard from './components/ProjectDashboard';
import {
  Code,
  Variable,
  Layers,
  Sliders,
  CheckCircle,
  HelpCircle,
  Undo2,
  Redo2,
  Sparkles,
  RotateCcw,
  Plus,
  HardDrive,
  Save,
  Mail,
  Layout,
  Palette,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  FileText,
  Smile,
  AlignLeft,
  Settings,
  AlertTriangle
} from 'lucide-react';

export default function App() {
  // Simple path routing state
  const [currentPath, setCurrentPath] = useState(() => {
    const path = window.location.pathname;
    return path === '/editor' ? '/editor' : '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      setCurrentPath(path === '/editor' ? '/editor' : '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const [activeTab, setActiveTab] = useState<'editor' | 'components' | 'identity'>('editor');

  // Helper to create blank email templates
  const createBlankTemplate = (name: string): EmailTemplate => {
    return {
      id: `blank_${Date.now()}`,
      name: name,
      elements: [
        {
          id: `hero_heading_${Date.now()}`,
          type: 'heading',
          content: 'Novo E-mail em Branco 📄',
          styles: {
            fontSize: 24,
            fontWeight: 'bold',
            textColor: '#0f172a',
            align: 'center',
            marginTop: 20,
            marginBottom: 10
          }
        },
        {
          id: `hero_text_${Date.now()}`,
          type: 'text',
          content: 'Comece a arrastar elementos para criar sua composição de e-mail incrível!',
          styles: {
            fontSize: 14,
            textColor: '#475569',
            align: 'center',
            marginTop: 10,
            marginBottom: 20
          }
        }
      ],
      variables: [
        { id: 'v1', key: 'userName', value: 'Usuário', description: 'Nome do destinatário' }
      ],
      globalStyles: {
        backgroundColor: '#f8fafc',
        containerColor: '#ffffff',
        textColor: '#334155',
        fontFamily: 'Inter, sans-serif',
        borderRadius: 16,
        padding: 32,
        bodyWidth: 600,
        hasWidthLimit: true,
        bodyAlignment: 'center'
      }
    };
  };

  // Brand identity, customizable presets, conditional color rules, signature templates
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('react-email-builder-projects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    
    // Default visual identity and custom components to bootstrap the first project
    const defaultVisualIdentity: VisualIdentity = {
      brandColors: [
        { id: 'bc_1', name: 'Primária (Indigo)', value: '#4f46e5' },
        { id: 'bc_2', name: 'Sucesso (Emerald)', value: '#10b981' },
        { id: 'bc_3', name: 'Atenção (Amber)', value: '#f59e0b' },
        { id: 'bc_4', name: 'Escuro (Slate)', value: '#1e293b' },
      ],
      colorRules: [
        {
          id: 'cr_1',
          name: 'Prioridade Urgente',
          variableName: 'status',
          operator: 'equals',
          value: 'urgente',
          colorIfTrue: '#ef4444',
          colorIfFalse: '#3b82f6',
        }
      ],
      signatureName: 'Ezequias Lopes',
      signatureRole: 'Diretor de Design',
      signatureCompany: 'InboxFlow Tech',
      signaturePhone: '+55 (11) 98765-4321',
      signatureColor: '#4f46e5',
    };

    const defaultReusableComponents: ReusableComponent[] = [
      {
        id: 'default_cta_button',
        name: 'Botão CTA Roxo Moderno',
        element: {
          id: 'btn_default_reusable',
          type: 'button',
          content: 'Quero Garantir Meu Desconto 🚀',
          href: '#',
          styles: {
            backgroundColor: '#7c3aed',
            textColor: '#ffffff',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 'bold',
            align: 'center',
            paddingTop: 12,
            paddingBottom: 12,
            paddingLeft: 28,
            paddingRight: 28,
            marginTop: 10,
            marginBottom: 10,
          }
        },
        updatedAt: Date.now()
      },
      {
        id: 'default_divider_line',
        name: 'Divisor Sutil Degradê',
        element: {
          id: 'divider_default_reusable',
          type: 'divider',
          content: '',
          styles: {
            borderWidth: 2,
            borderColor: '#e2e8f0',
            marginTop: 20,
            marginBottom: 20,
          }
        },
        updatedAt: Date.now()
      }
    ];

    return [
      {
        id: 'proj_default',
        name: 'Meu Primeiro Projeto',
        templates: [],
        visualIdentity: defaultVisualIdentity,
        reusableComponents: defaultReusableComponents,
        updatedAt: Date.now()
      }
    ];
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    const saved = localStorage.getItem('react-email-builder-active-project-id');
    return saved || (projects.length > 0 ? projects[0].id : null);
  });

  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(() => {
    // Default to null to open with project dashboard first!
    return null;
  });

  // Keep track of current email template being edited
  const [template, setTemplate] = useState<EmailTemplate>(() => {
    return DEFAULT_TEMPLATES[0];
  });

  // Shared visual identity for active project
  const [visualIdentity, setVisualIdentity] = useState<VisualIdentity>(() => {
    return projects[0]?.visualIdentity || {
      brandColors: [],
      colorRules: [],
      signatureName: '',
      signatureRole: '',
      signatureCompany: '',
      signaturePhone: '',
      signatureColor: ''
    };
  });

  // Shared reusable components for active project
  const [reusableComponents, setReusableComponents] = useState<ReusableComponent[]>(() => {
    return projects[0]?.reusableComponents || [];
  });

  // Persist projects state
  useEffect(() => {
    localStorage.setItem('react-email-builder-projects', JSON.stringify(projects));
  }, [projects]);

  // Persist activeProjectId
  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem('react-email-builder-active-project-id', activeProjectId);
    }
  }, [activeProjectId]);

  // Synchronize loading of template, visual identity, and reusable components when active project or template changes
  useEffect(() => {
    if (activeProjectId && activeTemplateId) {
      const proj = projects.find(p => p.id === activeProjectId);
      if (proj) {
        const tpl = proj.templates.find(t => t.id === activeTemplateId);
        if (tpl) {
          setTemplate(tpl);
          setVisualIdentity(proj.visualIdentity);
          setReusableComponents(proj.reusableComponents);
        }
      }
    }
  }, [activeProjectId, activeTemplateId]);

  // Auto-save updates in the active editor back into the projects array
  useEffect(() => {
    if (activeProjectId && activeTemplateId && template && template.id === activeTemplateId) {
      setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
          const isTemplateInProject = p.templates.some(t => t.id === activeTemplateId);
          let updatedTemplates = p.templates;
          if (isTemplateInProject) {
            updatedTemplates = p.templates.map(t => t.id === activeTemplateId ? template : t);
          } else {
            updatedTemplates = [...p.templates, template];
          }
          return {
            ...p,
            templates: updatedTemplates,
            visualIdentity,
            reusableComponents,
            updatedAt: Date.now()
          };
        }
        return p;
      }));
    }
  }, [template, visualIdentity, reusableComponents, activeProjectId, activeTemplateId]);

  // Undo and Redo History stacks
  const [undoStack, setUndoStack] = useState<EmailTemplate[]>([]);
  const [redoStack, setRedoStack] = useState<EmailTemplate[]>([]);
  const isUndoRedoAction = useRef(false);

  // Clipboard for copying and pasting email blocks
  const [clipboardElement, setClipboardElement] = useState<EmailElement | null>(null);

  // State for converting elements to custom components modal
  const [componentToSave, setComponentToSave] = useState<EmailElement | null>(null);
  const [tempComponentName, setTempComponentName] = useState('');

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isVariablesOpen, setIsVariablesOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Collapsible Sidebar and Accordion states
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [floatingSection, setFloatingSection] = useState<'quickTemplates' | 'savedTemplates' | 'reusableComponents' | 'iconsGallery' | 'blocks' | 'structure' | 'globalStyles' | null>(null);

  const handleToggleFloatingSection = (section: 'quickTemplates' | 'savedTemplates' | 'reusableComponents' | 'iconsGallery' | 'blocks' | 'structure' | 'globalStyles') => {
    setFloatingSection((prev) => (prev === section ? null : section));
  };

  const [openSections, setOpenSections] = useState({
    quickTemplates: false,
    savedTemplates: false,
    reusableComponents: false,
    iconsGallery: false,
    blocks: true,
    structure: true,
    globalStyles: true,
  });

  const handleToggleSection = (section: 'quickTemplates' | 'savedTemplates' | 'reusableComponents' | 'iconsGallery' | 'blocks' | 'structure' | 'globalStyles') => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleOpenSectionWithSidebar = (section: 'quickTemplates' | 'savedTemplates' | 'reusableComponents' | 'iconsGallery' | 'blocks' | 'structure' | 'globalStyles') => {
    setIsSidebarOpen(true);
    setFloatingSection(null);
    setOpenSections((prev) => ({
      ...prev,
      [section]: true
    }));
    showToast(`Painel expandido: ${
      section === 'quickTemplates' ? 'Modelos Rápidos' :
      section === 'savedTemplates' ? 'Modelos Salvos' :
      section === 'reusableComponents' ? 'Componentes' :
      section === 'iconsGallery' ? 'Ícones' :
      section === 'blocks' ? 'Blocos' :
      section === 'structure' ? 'Estrutura' : 'Configurações'
    }`);
  };

  // Load saved templates from localStorage
  const [savedTemplates, setSavedTemplates] = useState<EmailTemplate[]>(() => {
    const saved = localStorage.getItem('react-email-builder-saved-templates');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [];
  });

  const [isStorageOpen, setIsStorageOpen] = useState(false);
  const [isSavingMode, setIsSavingMode] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const [dismissMobileWarning, setDismissMobileWarning] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const STORAGE_LIMIT_BYTES = 4096 * 1024; // Real localStorage capacity with safety margin (4 MB limit, out of 5 MB)

  const getStorageUsageBytes = (templates: EmailTemplate[]): number => {
    return new Blob([JSON.stringify(templates)]).size;
  };

  const handleSaveCurrentTemplate = (name: string): boolean => {
    let isExisting = false;
    let targetId = template.id;

    // Make a unique ID if it's currently on a generic/preset
    if (targetId === 'scratch' || targetId.startsWith('welcome') || targetId.startsWith('promo')) {
      targetId = `custom_${Date.now()}`;
    } else {
      isExisting = savedTemplates.some((t) => t.id === targetId);
    }

    const updatedTemplate: EmailTemplate = {
      ...template,
      id: targetId,
      name: name,
      updatedAt: Date.now(),
      visualIdentity: visualIdentity,
    };

    let newSavedTemplates = [...savedTemplates];
    if (isExisting) {
      newSavedTemplates = newSavedTemplates.map((t) => (t.id === targetId ? updatedTemplate : t));
    } else {
      newSavedTemplates.push(updatedTemplate);
    }

    const newSize = getStorageUsageBytes(newSavedTemplates);
    if (newSize > STORAGE_LIMIT_BYTES) {
      // Storage quota limit exceeded! Let's return false so modal displays error
      return false;
    }

    try {
      localStorage.setItem('react-email-builder-saved-templates', JSON.stringify(newSavedTemplates));
      setSavedTemplates(newSavedTemplates);
      setTemplate(updatedTemplate);
      showToast(`Modelo "${name}" salvo com sucesso!`);
      return true;
    } catch (err) {
      // Physical quota exceeded or other storage failure
      return false;
    }
  };

  const handleDeleteSavedTemplate = (id: string) => {
    const updated = savedTemplates.filter((t) => t.id !== id);
    localStorage.setItem('react-email-builder-saved-templates', JSON.stringify(updated));
    setSavedTemplates(updated);
    showToast('Modelo excluído do armazenamento.');

    // If deleted template is currently loaded on screen, unload/reset to first preset
    if (template.id === id) {
      setTemplate(DEFAULT_TEMPLATES[0]);
      setSelectedElementId(null);
      showToast('O modelo ativo foi excluído. Carregando modelo padrão.');
    }
  };

  const handleLoadSavedTemplate = (id: string) => {
    const selected = savedTemplates.find((t) => t.id === id);
    if (selected) {
      setTemplate(selected);
      setSelectedElementId(null);
      if (selected.visualIdentity) {
        setVisualIdentity(selected.visualIdentity);
      }
      showToast(`Modelo "${selected.name}" carregado!`);
    }
  };

  // --- PROJECT MANAGEMENT HANDLERS ---
  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    setActiveTemplateId(null);
  };

  const handleCreateProject = (name: string, baseTemplate?: EmailTemplate) => {
    const newProjId = `proj_${Date.now()}`;
    const newVisualIdentity: VisualIdentity = {
      brandColors: [
        { id: `bc_${Date.now()}_1`, name: 'Primária (Indigo)', value: '#4f46e5' },
        { id: `bc_${Date.now()}_2`, name: 'Sucesso (Emerald)', value: '#10b981' },
        { id: `bc_${Date.now()}_3`, name: 'Atenção (Amber)', value: '#f59e0b' },
        { id: `bc_${Date.now()}_4`, name: 'Escuro (Slate)', value: '#1e293b' },
      ],
      colorRules: [],
      signatureName: 'Ezequias Lopes',
      signatureRole: 'Diretor',
      signatureCompany: name,
      signaturePhone: '+55 (11) 98765-4321',
      signatureColor: '#4f46e5',
    };

    const firstTpl = baseTemplate 
      ? { ...baseTemplate, id: `tpl_${Date.now()}`, name: baseTemplate.name } 
      : createBlankTemplate('Modelo Base');
    
    const newProj: Project = {
      id: newProjId,
      name,
      templates: [firstTpl],
      visualIdentity: newVisualIdentity,
      reusableComponents: [
        {
          id: `default_cta_${Date.now()}`,
          name: 'Botão CTA Roxo Moderno',
          element: {
            id: `btn_${Date.now()}`,
            type: 'button',
            content: 'Garantir Acesso 🚀',
            href: '#',
            styles: {
              backgroundColor: '#4f46e5',
              textColor: '#ffffff',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 'bold',
              align: 'center',
              paddingTop: 12,
              paddingBottom: 12,
              paddingLeft: 28,
              paddingRight: 28,
              marginTop: 10,
              marginBottom: 10,
            }
          },
          updatedAt: Date.now()
        }
      ],
      updatedAt: Date.now()
    };

    setProjects(prev => [newProj, ...prev]);
    setActiveProjectId(newProjId);
    setActiveTemplateId(null);
  };

  const handleRenameProject = (id: string, name: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name, updatedAt: Date.now() } : p));
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => {
      const next = prev.filter(p => p.id !== id);
      if (activeProjectId === id && next.length > 0) {
        setActiveProjectId(next[0].id);
      }
      return next;
    });
    setActiveTemplateId(null);
  };

  const handleExportProject = (project: Project) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `projeto_${project.name.toLowerCase().replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportProjects = (imported: Project[]) => {
    const mapped = imported.map(p => ({
      ...p,
      id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      updatedAt: Date.now()
    }));
    setProjects(prev => [...mapped, ...prev]);
    if (mapped.length > 0) {
      setActiveProjectId(mapped[0].id);
      setActiveTemplateId(null);
    }
  };

  const handleCreateTemplate = (projectId: string, name: string, baseTemplate?: EmailTemplate) => {
    const newTplId = `tpl_${Date.now()}`;
    const newTpl = baseTemplate
      ? { ...baseTemplate, id: newTplId, name: name }
      : createBlankTemplate(name);
    
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          templates: [...p.templates, newTpl],
          updatedAt: Date.now()
        };
      }
      return p;
    }));
    setActiveTemplateId(newTplId);
  };

  const handleDeleteTemplate = (projectId: string, templateId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          templates: p.templates.filter(t => t.id !== templateId),
          updatedAt: Date.now()
        };
      }
      return p;
    }));
    if (activeTemplateId === templateId) {
      setActiveTemplateId(null);
    }
  };

  const handleDuplicateTemplate = (projectId: string, templateId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const target = p.templates.find(t => t.id === templateId);
        if (target) {
          const copy: EmailTemplate = {
            ...target,
            id: `tpl_copy_${Date.now()}`,
            name: `${target.name} (Cópia)`
          };
          return {
            ...p,
            templates: [...p.templates, copy],
            updatedAt: Date.now()
          };
        }
      }
      return p;
    }));
  };

  const handleSelectTemplate = (projectId: string, templateId: string) => {
    setActiveProjectId(projectId);
    if (templateId === 'blank') {
      const newTplId = `tpl_${Date.now()}`;
      const newTpl = createBlankTemplate('Modelo em Branco');
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            templates: [...p.templates, newTpl],
            updatedAt: Date.now()
          };
        }
        return p;
      }));
      setActiveTemplateId(newTplId);
    } else {
      setActiveTemplateId(templateId);
    }
  };

  const handleOpenSaveModal = () => {
    setIsSavingMode(true);
    setIsStorageOpen(true);
  };

  const handleOpenStorageManagerOnly = () => {
    setIsSavingMode(false);
    setIsStorageOpen(true);
  };

  // Automatic change-tracking history observer for infinite Undo/Redo
  const prevTemplateRef = useRef<EmailTemplate | null>(null);

  useEffect(() => {
    if (!prevTemplateRef.current) {
      prevTemplateRef.current = template;
      return;
    }

    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      prevTemplateRef.current = template;
      return;
    }

    // New manual design interaction. Track state!
    const prev = prevTemplateRef.current;
    setUndoStack((stack) => {
      const nextStack = [...stack, prev];
      if (nextStack.length > 50) {
        nextStack.shift();
      }
      return nextStack;
    });
    setRedoStack([]); // Clear redo
    prevTemplateRef.current = template;
  }, [template]);

  const handleUndo = () => {
    if (undoStack.length === 0) {
      showToast('⚠️ Nada para desfazer');
      return;
    }
    const target = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, template]);
    
    isUndoRedoAction.current = true;
    setTemplate(target);
    showToast('↩️ Desfeito (CTRL+Z)');
  };

  const handleRedo = () => {
    if (redoStack.length === 0) {
      showToast('⚠️ Nada para refazer');
      return;
    }
    const target = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => [...prev, template]);
    
    isUndoRedoAction.current = true;
    setTemplate(target);
    showToast('↪️ Refeito (CTRL+Y)');
  };

  const handleCopyElement = () => {
    const activeEl = template.elements.find((el) => el.id === selectedElementId);
    if (activeEl) {
      setClipboardElement(JSON.parse(JSON.stringify(activeEl)));
      showToast(`📋 Copiado: ${activeEl.type.toUpperCase()}`);
    } else {
      showToast('⚠️ Selecione um bloco para copiar');
    }
  };

  const handlePasteElement = () => {
    if (!clipboardElement) {
      showToast('⚠️ Nenhum bloco copiado na memória');
      return;
    }
    const pastedElement: EmailElement = {
      ...clipboardElement,
      id: `${clipboardElement.type}_${Date.now()}`,
    };

    setTemplate((prev) => {
      const index = prev.elements.findIndex((el) => el.id === selectedElementId);
      const updated = [...prev.elements];
      if (index !== -1) {
        updated.splice(index + 1, 0, pastedElement);
      } else {
        updated.push(pastedElement);
      }
      return {
        ...prev,
        elements: updated,
      };
    });
    setSelectedElementId(pastedElement.id);
    showToast(`📥 Colado: ${pastedElement.type.toUpperCase()}`);
  };

  const handleInsertSignature = () => {
    const sigId = `text_sig_${Date.now()}`;
    const newElement: EmailElement = {
      id: sigId,
      type: 'text',
      content: `**Atenciosamente,**\n\n**${visualIdentity.signatureName}**\n${visualIdentity.signatureRole} | **${visualIdentity.signatureCompany}**\n📞 ${visualIdentity.signaturePhone}`,
      styles: {
        textColor: '#334155',
        fontSize: 13,
        align: 'left',
        marginTop: 20,
        marginBottom: 10,
        paddingLeft: 12,
        borderColor: visualIdentity.signatureColor,
        borderWidth: 3,
      }
    };

    setTemplate((prev) => ({
      ...prev,
      elements: [...prev.elements, newElement],
    }));
    setSelectedElementId(sigId);
    showToast('✍️ Assinatura inserida com sucesso!');
  };

  // Mount global Keyboard Shortcuts observer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.getAttribute('contenteditable') === 'true'
      );

      if (isInput) return;

      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }

      // Redo: Ctrl+Y or Cmd+Y
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }

      // Copy: Ctrl+C or Cmd+C
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopyElement();
      }

      // Paste: Ctrl+V or Cmd+V
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handlePasteElement();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [template, selectedElementId, clipboardElement, undoStack, redoStack, visualIdentity]);

  // Auto-save templates in browser local storage
  useEffect(() => {
    localStorage.setItem('react-email-builder-template', JSON.stringify(template));
  }, [template]);

  // Auto-save reusable components in browser local storage
  useEffect(() => {
    localStorage.setItem('react-email-builder-reusable-components', JSON.stringify(reusableComponents));
  }, [reusableComponents]);

  // Insert a reusable component into the current email template
  const handleInsertComponent = (comp: ReusableComponent) => {
    const clonedElement: EmailElement = {
      ...comp.element,
      id: `${comp.element.type}_${Date.now()}`,
    };
    setTemplate((prev) => ({
      ...prev,
      elements: [...prev.elements, clonedElement],
    }));
    showToast(`Componente "${comp.name}" inserido com sucesso!`);
  };

  // Trigger naming modal for transforming active canvas element to component
  const handleConvertToComponent = (element: EmailElement) => {
    setComponentToSave(element);
    setTempComponentName(`Meu Componente ${element.type.toUpperCase()}`);
  };

  // Confirms saving element as component from modal
  const handleConfirmConvertToComponent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!componentToSave || !tempComponentName.trim()) return;

    const newComponent: ReusableComponent = {
      id: `comp_${Date.now()}`,
      name: tempComponentName.trim(),
      element: {
        ...componentToSave,
        id: `${componentToSave.type}_${Date.now()}`, // Clean ID for reused copies
      },
      updatedAt: Date.now(),
    };

    setReusableComponents((prev) => [...prev, newComponent]);
    setComponentToSave(null);
    showToast(`Elemento salvo como "${tempComponentName.trim()}" na Biblioteca!`);
  };

  // Update an existing component
  const handleUpdateComponent = (updated: ReusableComponent) => {
    setReusableComponents((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  };

  // Delete a component from library
  const handleDeleteComponent = (id: string) => {
    setReusableComponents((prev) => prev.filter((c) => c.id !== id));
    showToast('Componente removido da biblioteca.');
  };

  // Create a new component from scratch inside the components workspace
  const handleAddComponentFromScratch = (name: string, type: ElementType) => {
    const id = `comp_${Date.now()}`;
    let baseElement: EmailElement;

    switch (type) {
      case 'heading':
        baseElement = {
          id: `heading_${Date.now()}`,
          type,
          content: 'Seu Novo Título Reutilizável 👑',
          styles: {
            fontSize: 20,
            fontWeight: 'bold',
            textColor: '#1e1b4b',
            align: 'center',
            marginBottom: 12,
            marginTop: 12,
          }
        };
        break;
      case 'text':
        baseElement = {
          id: `text_${Date.now()}`,
          type,
          content: 'Este é um texto do seu componente. Você pode usá-lo como template de parágrafo reutilizável.',
          styles: {
            fontSize: 14,
            textColor: '#475569',
            align: 'left',
            marginBottom: 12,
          }
        };
        break;
      case 'button':
        baseElement = {
          id: `button_${Date.now()}`,
          type,
          content: 'Clique de Ação Agendada',
          href: '#',
          styles: {
            backgroundColor: '#0f766e',
            textColor: '#ffffff',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 'semibold',
            align: 'center',
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 20,
            paddingRight: 20,
            marginTop: 8,
            marginBottom: 8,
          }
        };
        break;
      case 'image':
        baseElement = {
          id: `image_${Date.now()}`,
          type,
          content: '',
          src: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=60',
          alt: 'Placeholder',
          styles: {
            borderRadius: 8,
            align: 'center',
            marginTop: 10,
            marginBottom: 10,
          }
        };
        break;
      case 'link':
        baseElement = {
          id: `link_${Date.now()}`,
          type,
          content: '👉 Link de Onboarding',
          href: '#',
          styles: {
            textColor: '#4f46e5',
            align: 'center',
            marginTop: 8,
            marginBottom: 8,
          }
        };
        break;
      case 'divider':
        baseElement = {
          id: `divider_${Date.now()}`,
          type,
          content: '',
          styles: {
            borderWidth: 1,
            borderColor: '#e2e8f0',
            marginTop: 16,
            marginBottom: 16,
          }
        };
        break;
      case 'spacer':
        baseElement = {
          id: `spacer_${Date.now()}`,
          type,
          content: '',
          styles: {
            height: 24,
          }
        };
        break;
      default:
        baseElement = {
          id: `el_${Date.now()}`,
          type: 'text',
          content: 'Novo Bloco',
          styles: {}
        };
    }

    const newComponent: ReusableComponent = {
      id,
      name,
      element: baseElement,
      updatedAt: Date.now(),
    };

    setReusableComponents((prev) => [...prev, newComponent]);
    showToast(`Componente "${name}" criado com sucesso!`);
  };

  // Import dynamic component from JSON
  const handleImportComponent = (comp: ReusableComponent) => {
    const imported: ReusableComponent = {
      ...comp,
      id: `comp_${Date.now()}`,
      element: {
        ...comp.element,
        id: `${comp.element.type}_${Date.now()}`,
      },
      updatedAt: Date.now(),
    };
    setReusableComponents((prev) => [...prev, imported]);
    showToast(`Componente "${comp.name}" importado com sucesso!`);
  };

  // Import dynamic template from JSON
  const handleImportTemplate = (imported: EmailTemplate) => {
    const newTemplate: EmailTemplate = {
      ...imported,
      id: `custom_${Date.now()}`,
      updatedAt: Date.now(),
    };

    const newSavedTemplates = [...savedTemplates, newTemplate];
    const newSize = getStorageUsageBytes(newSavedTemplates);
    if (newSize > STORAGE_LIMIT_BYTES) {
      showToast('⚠️ Erro: Limite de armazenamento excedido! Delete templates antigos antes de importar.');
      return;
    }

    setSavedTemplates(newSavedTemplates);
    localStorage.setItem('react-email-builder-saved-templates', JSON.stringify(newSavedTemplates));
    setTemplate(newTemplate);
    setSelectedElementId(null);
    showToast(`Modelo "${newTemplate.name}" importado com sucesso!`);
  };

  // Show a beautiful quick visual notification
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Callback to update entire elements list
  const handleReorderElements = (newElements: EmailElement[]) => {
    setTemplate((prev) => ({
      ...prev,
      elements: newElements,
    }));
  };

  // Add Element with standard pristine starting design settings
  const handleAddElement = (type: ElementType) => {
    const id = `${type}_${Date.now()}`;
    let newElement: EmailElement;

    switch (type) {
      case 'heading':
        newElement = {
          id,
          type,
          content: 'Título Do Bloco De Email 🌟',
          styles: {
            fontSize: 22,
            fontWeight: 'bold',
            textColor: '#0f172a',
            align: 'center',
            marginBottom: 16,
            marginTop: 8,
          },
        };
        break;
      case 'text':
        newElement = {
          id,
          type,
          content: 'Este é um parágrafo de texto editável. Você pode escrever mensagens personalizadas, adicionar instruções de serviços e citar chaves dinâmicas como {{userName}} no meio do conteúdo para criar experiências únicas.',
          styles: {
            fontSize: 14,
            textColor: '#334155',
            align: 'left',
            marginBottom: 16,
          },
        };
        break;
      case 'button':
        newElement = {
          id,
          type,
          content: 'Clique de Ação CTA',
          href: '{{appUrl}}/login',
          styles: {
            backgroundColor: '#2563eb',
            textColor: '#ffffff',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 'semibold',
            align: 'center',
            paddingTop: 12,
            paddingBottom: 12,
            paddingLeft: 24,
            paddingRight: 24,
            marginBottom: 20,
            marginTop: 10,
          },
        };
        break;
      case 'image':
        newElement = {
          id,
          type,
          content: '',
          src: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80',
          alt: 'Placeholder Image',
          styles: {
            width: 500,
            borderRadius: 8,
            align: 'center',
            marginBottom: 20,
            marginTop: 10,
          },
        };
        break;
      case 'link':
        newElement = {
          id,
          type,
          content: 'Visitar nosso site oficial',
          href: 'https://meuapp.com',
          styles: {
            textColor: '#2563eb',
            fontSize: 13,
            align: 'center',
            marginBottom: 16,
          },
        };
        break;
      case 'divider':
        newElement = {
          id,
          type,
          content: '',
          styles: {
            borderColor: '#e2e8f0',
            borderWidth: 1,
            marginBottom: 20,
            marginTop: 12,
          },
        };
        break;
      case 'spacer':
        newElement = {
          id,
          type,
          content: '',
          styles: {
            height: 24,
          },
        };
        break;
      case 'container':
        newElement = {
          id,
          type,
          content: '',
          children: [
            {
              id: `text_nested_${Date.now()}`,
              type: 'text',
              content: 'Texto interno do container. Selecione para editar.',
              styles: { fontSize: 14, textColor: '#334155' }
            }
          ],
          styles: {
            backgroundColor: '#f1f5f9',
            borderRadius: 8,
            paddingTop: 16,
            paddingBottom: 16,
            paddingLeft: 16,
            paddingRight: 16,
            marginTop: 10,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#cbd5e1'
          }
        };
        break;
      case 'grid':
        newElement = {
          id,
          type,
          content: '',
          rowsCount: 1,
          colsCount: 2,
          gridCells: {
            '0-0': [
              {
                id: `heading_g_${Date.now()}_0`,
                type: 'heading',
                content: 'Coluna 1',
                styles: { fontSize: 16, fontWeight: 'bold', align: 'center', marginBottom: 8 }
              },
              {
                id: `text_g_${Date.now()}_0`,
                type: 'text',
                content: 'Conteúdo esquerdo.',
                styles: { fontSize: 13, align: 'center' }
              }
            ],
            '0-1': [
              {
                id: `heading_g_${Date.now()}_1`,
                type: 'heading',
                content: 'Coluna 2',
                styles: { fontSize: 16, fontWeight: 'bold', align: 'center', marginBottom: 8 }
              },
              {
                id: `text_g_${Date.now()}_1`,
                type: 'text',
                content: 'Conteúdo direito.',
                styles: { fontSize: 13, align: 'center' }
              }
            ]
          },
          styles: {
            backgroundColor: 'transparent',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            marginTop: 10,
            marginBottom: 20,
            paddingTop: 8,
            paddingBottom: 8,
            paddingLeft: 8,
            paddingRight: 8
          }
        };
        break;
      default:
        return;
    }

    setTemplate((prev) => ({
      ...prev,
      elements: [...prev.elements, newElement],
    }));
    setSelectedElementId(id);
    showToast(`Bloco de ${type} adicionado!`);
  };

  // Add at exact target index (for drag and drop positions)
  const handleAddElementAt = (type: ElementType, index: number) => {
    const id = `${type}_${Date.now()}`;
    let newElement: EmailElement;

    switch (type) {
      case 'heading':
        newElement = {
          id,
          type,
          content: 'Título Do Bloco De Email 🌟',
          styles: {
            fontSize: 22,
            fontWeight: 'bold',
            textColor: '#0f172a',
            align: 'center',
            marginBottom: 16,
            marginTop: 8,
          },
        };
        break;
      case 'text':
        newElement = {
          id,
          type,
          content: 'Este é um parágrafo de texto editável. Você pode escrever mensagens personalizadas, adicionar instruções de serviços e citar chaves dinâmicas como {{userName}} no meio do conteúdo para criar experiências únicas.',
          styles: {
            fontSize: 14,
            textColor: '#334155',
            align: 'left',
            marginBottom: 16,
          },
        };
        break;
      case 'button':
        newElement = {
          id,
          type,
          content: 'Clique de Ação CTA',
          href: '{{appUrl}}/login',
          styles: {
            backgroundColor: '#2563eb',
            textColor: '#ffffff',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 'semibold',
            align: 'center',
            paddingTop: 12,
            paddingBottom: 12,
            paddingLeft: 24,
            paddingRight: 24,
            marginBottom: 20,
            marginTop: 10,
          },
        };
        break;
      case 'image':
        newElement = {
          id,
          type,
          content: '',
          src: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80',
          alt: 'Placeholder Image',
          styles: {
            width: 500,
            borderRadius: 8,
            align: 'center',
            marginBottom: 20,
            marginTop: 10,
          },
        };
        break;
      case 'link':
        newElement = {
          id,
          type,
          content: 'Visitar nosso site oficial',
          href: 'https://meuapp.com',
          styles: {
            textColor: '#2563eb',
            fontSize: 13,
            align: 'center',
            marginBottom: 16,
          },
        };
        break;
      case 'divider':
        newElement = {
          id,
          type,
          content: '',
          styles: {
            borderColor: '#e2e8f0',
            borderWidth: 1,
            marginBottom: 20,
            marginTop: 12,
          },
        };
        break;
      case 'spacer':
        newElement = {
          id,
          type,
          content: '',
          styles: {
            height: 24,
          },
        };
        break;
      case 'container':
        newElement = {
          id,
          type,
          content: '',
          children: [
            {
              id: `text_nested_${Date.now()}`,
              type: 'text',
              content: 'Texto interno do container. Selecione para editar.',
              styles: { fontSize: 14, textColor: '#334155' }
            }
          ],
          styles: {
            backgroundColor: '#f1f5f9',
            borderRadius: 8,
            paddingTop: 16,
            paddingBottom: 16,
            paddingLeft: 16,
            paddingRight: 16,
            marginTop: 10,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#cbd5e1'
          }
        };
        break;
      case 'grid':
        newElement = {
          id,
          type,
          content: '',
          rowsCount: 1,
          colsCount: 2,
          gridCells: {
            '0-0': [
              {
                id: `heading_g_${Date.now()}_0`,
                type: 'heading',
                content: 'Coluna 1',
                styles: { fontSize: 16, fontWeight: 'bold', align: 'center', marginBottom: 8 }
              },
              {
                id: `text_g_${Date.now()}_0`,
                type: 'text',
                content: 'Conteúdo esquerdo.',
                styles: { fontSize: 13, align: 'center' }
              }
            ],
            '0-1': [
              {
                id: `heading_g_${Date.now()}_1`,
                type: 'heading',
                content: 'Coluna 2',
                styles: { fontSize: 16, fontWeight: 'bold', align: 'center', marginBottom: 8 }
              },
              {
                id: `text_g_${Date.now()}_1`,
                type: 'text',
                content: 'Conteúdo direito.',
                styles: { fontSize: 13, align: 'center' }
              }
            ]
          },
          styles: {
            backgroundColor: 'transparent',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            marginTop: 10,
            marginBottom: 20,
            paddingTop: 8,
            paddingBottom: 8,
            paddingLeft: 8,
            paddingRight: 8
          }
        };
        break;
      default:
        return;
    }

    setTemplate((prev) => {
      const updatedElements = [...prev.elements];
      updatedElements.splice(index, 0, newElement);
      return {
        ...prev,
        elements: updatedElements,
      };
    });

    setSelectedElementId(id);
    showToast(`Bloco de ${type} inserido com sucesso!`);
  };

  // Recursive deep updates and deletions to handle containers and grids perfectly
  const deepUpdateElement = (elements: EmailElement[], updated: EmailElement): EmailElement[] => {
    return elements.map(el => {
      if (el.id === updated.id) {
        return updated;
      }
      if (el.type === 'container' && el.children) {
        return {
          ...el,
          children: deepUpdateElement(el.children, updated)
        };
      }
      if (el.type === 'grid' && el.gridCells) {
        const updatedCells: Record<string, EmailElement[]> = {};
        for (const [key, cellElements] of Object.entries(el.gridCells)) {
          updatedCells[key] = deepUpdateElement(cellElements, updated);
        }
        return {
          ...el,
          gridCells: updatedCells
        };
      }
      return el;
    });
  };

  const deepDeleteElement = (elements: EmailElement[], idToDelete: string): EmailElement[] => {
    return elements
      .filter(el => el.id !== idToDelete)
      .map(el => {
        if (el.type === 'container' && el.children) {
          return {
            ...el,
            children: deepDeleteElement(el.children, idToDelete)
          };
        }
        if (el.type === 'grid' && el.gridCells) {
          const updatedCells: Record<string, EmailElement[]> = {};
          for (const [key, cellElements] of Object.entries(el.gridCells)) {
            updatedCells[key] = deepDeleteElement(cellElements, idToDelete);
          }
          return {
            ...el,
            gridCells: updatedCells
          };
        }
        return el;
      });
  };

  const handleUpdateElement = (updated: EmailElement) => {
    setTemplate((prev) => ({
      ...prev,
      elements: deepUpdateElement(prev.elements, updated),
    }));
  };

  const handleDeleteElement = (id: string) => {
    setTemplate((prev) => ({
      ...prev,
      elements: deepDeleteElement(prev.elements, id),
    }));
    if (selectedElementId === id) setSelectedElementId(null);
    showToast('Bloco excluído');
  };

  const handleUpdateGlobalStyles = (styles: EmailTemplate['globalStyles']) => {
    setTemplate((prev) => ({
      ...prev,
      globalStyles: styles,
    }));
  };

  const handleUpdateVariables = (vars: EmailVariable[]) => {
    setTemplate((prev) => ({
      ...prev,
      variables: vars,
    }));
  };

  const handleLoadPreset = (presetId: string) => {
    if (presetId === 'empty' || presetId === 'scratch') {
      setShowResetConfirmModal(true);
      return;
    }
    const selected = DEFAULT_TEMPLATES.find((t) => t.id === presetId);
    if (selected) {
      setTemplate(selected);
      setSelectedElementId(null);
      if (selected.visualIdentity) {
        setVisualIdentity(selected.visualIdentity);
      }
      showToast('Modelo carregado com sucesso!');
    }
  };

  const handleReset = () => {
    setShowResetConfirmModal(true);
  };

  const deepFindElement = (elements: EmailElement[], targetId: string | null): EmailElement | undefined => {
    if (!targetId) return undefined;
    for (const el of elements) {
      if (el.id === targetId) return el;
      if (el.type === 'container' && el.children) {
        const found = deepFindElement(el.children, targetId);
        if (found) return found;
      }
      if (el.type === 'grid' && el.gridCells) {
        for (const cellElements of Object.values(el.gridCells)) {
          const found = deepFindElement(cellElements, targetId);
          if (found) return found;
        }
      }
    }
    return undefined;
  };

  const activeElement = deepFindElement(template.elements, selectedElementId);
  const currentProject = projects.find(p => p.id === activeProjectId);
  const currentProjectName = currentProject ? currentProject.name : '';

  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0b] text-zinc-100 flex flex-col items-center justify-center p-6 text-center z-[200]">
        <div className="max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6 animate-fade-in">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-white tracking-tight">
              Apenas para Desktop 💻
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Esta aplicação ainda não suporta dispositivos que não sejam desktop. Estamos trabalhando ativamente para ajustar isso e trazer a compatibilidade com tablets e celulares em breve.
            </p>
          </div>
          <p className="text-xs text-zinc-600 font-bold uppercase tracking-wider">
            MontarEmail • Em Desenvolvimento
          </p>
        </div>
      </div>
    );
  }

  if (currentPath === '/') {
    return <LandingPage onStart={() => navigateTo('/editor')} />;
  }

  if (currentPath === '/editor' && !activeTemplateId) {
    return (
      <ProjectDashboard
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
        onExportProject={handleExportProject}
        onImportProjects={handleImportProjects}
        onCreateTemplate={handleCreateTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        onDuplicateTemplate={handleDuplicateTemplate}
        onSelectTemplate={handleSelectTemplate}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0a0a] font-sans antialiased text-zinc-100">

      {/* Dynamic Visual Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 bg-zinc-900 text-zinc-100 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg border border-zinc-850 flex items-center gap-2 z-50 animate-bounce">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Main Header / Navigation */}
      <header className="bg-[#0f0f0f] text-zinc-100 px-6 py-4 flex flex-col sm:flex-row justify-between items-center border-b border-zinc-800 shadow-sm shrink-0 gap-4">
        <div className="flex items-center gap-3">
          {activeTemplateId && (
            <button
              onClick={() => {
                setActiveTemplateId(null);
                setSelectedElementId(null);
              }}
              className="mr-2 px-3 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-750 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Voltar ao Painel de Projetos"
            >
              <ChevronLeft className="h-4 w-4 text-blue-400" />
              Projetos
            </button>
          )}
          {currentProjectName && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-blue-400 bg-blue-500/10 border border-blue-500/25 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {currentProjectName}
              </span>
              <span className="text-zinc-800 text-sm font-light select-none">|</span>
            </div>
          )}
          <img src="https://montaremail.com.br/logo_completa.png" alt="MontarEmail" className="h-7 w-auto object-contain" referrerPolicy="no-referrer" />
        </div>

        {/* Workspace Tab Toggle */}
        <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 shadow-inner">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'editor'
                ? 'bg-blue-600 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            Editor de Modelos
          </button>
          <button
            onClick={() => setActiveTab('components')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'components'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layout className="h-3.5 w-3.5" />
            Área de Componentes
          </button>
          <button
            onClick={() => setActiveTab('identity')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'identity'
                ? 'bg-pink-600 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Palette className="h-3.5 w-3.5" />
            Identidade Visual
          </button>
        </div>
 
         {/* Action controls in header */}
        <div className="flex items-center gap-3">
          {activeTab === 'editor' ? (
            <>
              {/* Expandable Variable Button */}
              <button
                onClick={() => setIsVariablesOpen(!isVariablesOpen)}
                className={`group relative flex items-center h-10 w-10 hover:w-28 overflow-hidden rounded-xl text-xs font-bold transition-all duration-300 border cursor-pointer ${
                  isVariablesOpen
                    ? 'bg-blue-600/20 border-blue-500/80 text-blue-300'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200 hover:text-white'
                }`}
                title="Mapeamento de Variáveis"
              >
                <div className="flex items-center gap-2 whitespace-nowrap pl-2.5">
                  <Variable className="h-4 w-4 text-blue-400 shrink-0" />
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-bold select-none text-zinc-200">Variáveis</span>
                </div>
              </button>
 
              {/* Expandable Storage Button */}
              <button
                onClick={handleOpenStorageManagerOnly}
                className="group relative flex items-center h-10 w-10 hover:w-36 overflow-hidden bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white font-bold text-xs rounded-xl shadow-xs transition-all duration-300 cursor-pointer"
                title="Gerenciar Armazenamento"
              >
                <div className="flex items-center gap-2 whitespace-nowrap pl-2.5">
                  <HardDrive className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-bold select-none text-zinc-200">Armazenamento</span>
                </div>
              </button>
 
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                <button
                  onClick={handleUndo}
                  disabled={undoStack.length === 0}
                  className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Desfazer (Ctrl+Z)"
                >
                  <Undo2 className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Refazer (Ctrl+Y)"
                >
                  <Redo2 className="h-4.5 w-4.5" />
                </button>
              </div>
 
              <button
                onClick={() => setIsExportOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-550 active:scale-95 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
              >
                <Sparkles className="h-4 w-4" /> Exportar / Copiar E-mail
              </button>
            </>
          ) : activeTab === 'components' ? (
            <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-xl border border-indigo-900/40 text-[11px] text-indigo-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              Modo Criação de Componentes Ativo
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-xl border border-pink-900/40 text-[11px] text-pink-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
              Estúdio de Identidade Visual Ativo
            </div>
          )}
        </div>
      </header>
 
      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden relative bg-[#0a0a0a]">
        {activeTab === 'editor' && (
          <>
            {/* Left column: Sidebar list + Global Styles */}
            <div className={`shrink-0 h-full overflow-hidden border-r border-zinc-800 bg-[#0f0f0f] transition-all duration-300 relative ${
              isSidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 border-r-0'
            }`}>
              <Sidebar
                template={template}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                onAddElement={handleAddElement}
                onUpdateGlobalStyles={handleUpdateGlobalStyles}
                onReorderElements={handleReorderElements}
                onDeleteElement={handleDeleteElement}
                onLoadPreset={handleLoadPreset}
                savedTemplates={savedTemplates}
                onLoadSavedTemplate={handleLoadSavedTemplate}
                onOpenSaveModal={handleOpenSaveModal}
                onOpenStorageManager={handleOpenStorageManagerOnly}
                reusableComponents={reusableComponents}
                onInsertComponent={handleInsertComponent}
                onImportTemplate={handleImportTemplate}
                onImportComponent={handleImportComponent}
                visualIdentity={visualIdentity}
                onUpdateVisualIdentity={setVisualIdentity}
                onInsertSignature={handleInsertSignature}
                onUpdateElement={handleUpdateElement}
                openSections={openSections}
                onToggleSection={handleToggleSection}
                onToggleCollapse={() => setIsSidebarOpen(false)}
                onAddCustomElement={(el) => {
                  setTemplate((prev) => ({
                    ...prev,
                    elements: [...prev.elements, el],
                  }));
                  setSelectedElementId(el.id);
                  showToast('Ícone inserido com sucesso!');
                }}
              />
            </div>

            {/* Center Canvas area */}
            <div className="flex-1 h-full overflow-hidden bg-[#0a0a0a] relative flex flex-col">
              <Canvas
                template={template}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                onUpdateElement={handleUpdateElement}
                onAddElementAt={handleAddElementAt}
                onAddCustomElementAt={(el, idx) => {
                  setTemplate((prev) => {
                    const nextElements = [...prev.elements];
                    nextElements.splice(idx, 0, el);
                    return {
                      ...prev,
                      elements: nextElements,
                    };
                  });
                  setSelectedElementId(el.id);
                  showToast('Componente reutilizável inserido!');
                }}
                onDeleteElement={handleDeleteElement}
                onReorderElements={handleReorderElements}
                visualIdentity={visualIdentity}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() => setIsSidebarOpen(true)}
              />

              {/* Floating draggable section panel inside simulation field */}
              {floatingSection && !isSidebarOpen && (
                <FloatingSectionPanel
                  section={floatingSection}
                  onClose={() => setFloatingSection(null)}
                >
                  <Sidebar
                    template={template}
                    selectedElementId={selectedElementId}
                    onSelectElement={setSelectedElementId}
                    onAddElement={handleAddElement}
                    onUpdateGlobalStyles={handleUpdateGlobalStyles}
                    onReorderElements={handleReorderElements}
                    onDeleteElement={handleDeleteElement}
                    onLoadPreset={handleLoadPreset}
                    savedTemplates={savedTemplates}
                    onLoadSavedTemplate={handleLoadSavedTemplate}
                    onOpenSaveModal={handleOpenSaveModal}
                    onOpenStorageManager={handleOpenStorageManagerOnly}
                    reusableComponents={reusableComponents}
                    onInsertComponent={handleInsertComponent}
                    onImportTemplate={handleImportTemplate}
                    onImportComponent={handleImportComponent}
                    visualIdentity={visualIdentity}
                    onUpdateVisualIdentity={setVisualIdentity}
                    onInsertSignature={handleInsertSignature}
                    onUpdateElement={handleUpdateElement}
                    isFloating={true}
                    floatingSection={floatingSection}
                    openSections={openSections}
                    onToggleSection={handleToggleSection}
                    onAddCustomElement={(el) => {
                      setTemplate((prev) => ({
                        ...prev,
                        elements: [...prev.elements, el],
                      }));
                      setSelectedElementId(el.id);
                      showToast('Ícone inserido com sucesso!');
                    }}
                  />
                </FloatingSectionPanel>
              )}

              {/* Slim Floating Shortcuts Bar centered inside the Simulation Field */}
              {!isSidebarOpen && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-zinc-950/95 backdrop-blur-md border border-zinc-800/80 px-2.5 py-1.5 rounded-full shadow-2xl animate-fade-in border-zinc-800/80">
                  {/* Expand Sidebar */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSidebarOpen(true);
                      setFloatingSection(null);
                    }}
                    className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-all cursor-pointer border border-zinc-800/30"
                    title="Expandir Painel Lateral"
                  >
                    <ChevronsRight className="h-3.5 w-3.5 text-blue-400" />
                  </button>

                  <div className="h-4 w-px bg-zinc-800 mx-1" />

                  {/* 3. Componentes Reutilizáveis */}
                  <button
                    type="button"
                    onClick={() => handleToggleFloatingSection('reusableComponents')}
                    className={`p-1.5 rounded-full transition-all cursor-pointer flex items-center hover:bg-zinc-800 text-zinc-300 hover:text-white ${
                      floatingSection === 'reusableComponents' ? 'bg-purple-500/25 text-purple-400 border border-purple-500/45 scale-110 shadow-lg' : 'border border-transparent'
                    }`}
                    title="Componentes"
                  >
                    <Layout className="h-3.5 w-3.5 text-purple-400" />
                  </button>

                  {/* 4. Ícones PNG */}
                  <button
                    type="button"
                    onClick={() => handleToggleFloatingSection('iconsGallery')}
                    className={`p-1.5 rounded-full transition-all cursor-pointer flex items-center hover:bg-zinc-800 text-zinc-300 hover:text-white ${
                      floatingSection === 'iconsGallery' ? 'bg-pink-500/25 text-pink-400 border border-pink-500/45 scale-110 shadow-lg' : 'border border-transparent'
                    }`}
                    title="Ícones PNG"
                  >
                    <Smile className="h-3.5 w-3.5 text-pink-400" />
                  </button>

                  {/* 5. Blocos Disponíveis */}
                  <button
                    type="button"
                    onClick={() => handleToggleFloatingSection('blocks')}
                    className={`p-1.5 rounded-full transition-all cursor-pointer flex items-center hover:bg-zinc-800 text-zinc-300 hover:text-white ${
                      floatingSection === 'blocks' ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/45 scale-110 shadow-lg' : 'border border-transparent'
                    }`}
                    title="Blocos"
                  >
                    <Plus className="h-3.5 w-3.5 text-emerald-400" />
                  </button>

                  {/* 6. Estrutura */}
                  <button
                    type="button"
                    onClick={() => handleToggleFloatingSection('structure')}
                    className={`p-1.5 rounded-full transition-all cursor-pointer flex items-center hover:bg-zinc-800 text-zinc-300 hover:text-white ${
                      floatingSection === 'structure' ? 'bg-amber-500/25 text-amber-400 border border-amber-500/45 scale-110 shadow-lg' : 'border border-transparent'
                    }`}
                    title="Estrutura"
                  >
                    <AlignLeft className="h-3.5 w-3.5 text-amber-400" />
                  </button>

                  {/* 7. Config Globais */}
                  <button
                    type="button"
                    onClick={() => handleToggleFloatingSection('globalStyles')}
                    className={`p-1.5 rounded-full transition-all cursor-pointer flex items-center hover:bg-zinc-800 text-zinc-300 hover:text-white ${
                      floatingSection === 'globalStyles' ? 'bg-zinc-500/25 text-zinc-400 border border-zinc-500/45 scale-110 shadow-lg' : 'border border-transparent'
                    }`}
                    title="Configurações Globais"
                  >
                    <Settings className="h-3.5 w-3.5 text-zinc-400" />
                  </button>
                </div>
              )}
            </div>

            {/* Right column: Selected element settings OR guide */}
            <div className="w-80 shrink-0 h-full bg-[#0f0f0f] border-l border-zinc-800 overflow-hidden shadow-xs">
              {activeElement ? (
                <SettingsPanel
                  element={activeElement}
                  variables={template.variables}
                  onUpdateElement={handleUpdateElement}
                  onDeleteElement={handleDeleteElement}
                  onConvertToComponent={handleConvertToComponent}
                />
              ) : (
                <div className="p-6 h-full flex flex-col justify-center items-center text-center text-zinc-400 space-y-4 bg-[#0f0f0f]">
                  <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-500 animate-pulse">
                    <Sliders className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-200 text-xs uppercase tracking-wider">
                      Estilo de Bloco
                    </h4>
                    <p className="text-xs text-zinc-500 mt-2 max-w-[220px] leading-relaxed">
                      Clique em qualquer bloco do e-mail no preview central para customizar suas cores, margens, fontes, tamanho e links.
                    </p>
                  </div>
                  <div className="border border-dashed border-zinc-800 rounded-xl p-3 text-[11px] text-zinc-500 max-w-[220px] bg-zinc-900/40">
                    💡 Cada alteração que fizer atualiza o código final instantaneamente!
                  </div>
                </div>
              )}
            </div>
          </>
        )}
 
        {activeTab === 'components' && (
          <ComponentsWorkspace
            reusableComponents={reusableComponents}
            onUpdateComponent={handleUpdateComponent}
            onDeleteComponent={handleDeleteComponent}
            onAddComponent={handleAddComponentFromScratch}
            onImportComponent={handleImportComponent}
            variables={template.variables}
          />
        )}
 
        {activeTab === 'identity' && (
          <VisualIdentityWorkspace
            visualIdentity={visualIdentity}
            onUpdateVisualIdentity={setVisualIdentity}
            onInsertSignature={handleInsertSignature}
          />
        )}

        {/* Slide-out Sidebar Overlay for variables manager */}
        {isVariablesOpen && (
          <div className="absolute top-0 right-0 w-full sm:w-80 h-full bg-[#0f0f0f] border-l border-zinc-800 shadow-xl z-30 animate-slide-in flex flex-col">
            <VariablesManager
              variables={template.variables}
              onUpdateVariables={handleUpdateVariables}
              onClose={() => setIsVariablesOpen(false)}
            />
          </div>
        )}

      </div>

      {/* Code Export overlay modal */}
      {isExportOpen && (
        <ExportModal
          template={template}
          onClose={() => setIsExportOpen(false)}
        />
      )}

      {/* Storage Manager and Template Naming unified modal */}
      <StorageManagerModal
        isOpen={isStorageOpen}
        onClose={() => setIsStorageOpen(false)}
        savedTemplates={savedTemplates}
        onDeleteTemplate={handleDeleteSavedTemplate}
        onSaveCurrentTemplate={handleSaveCurrentTemplate}
        currentTemplate={template}
        storageUsageBytes={getStorageUsageBytes(savedTemplates)}
        storageLimitBytes={STORAGE_LIMIT_BYTES}
        isSavingMode={isSavingMode}
      />

      {/* Convert Element to Component Naming Modal */}
      {componentToSave && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <form 
            onSubmit={handleConfirmConvertToComponent}
            className="bg-[#0f0f0f] border border-indigo-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3 border-b border-zinc-850 pb-3">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <Layout className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-100 text-sm">Transformar em Componente</h3>
                <p className="text-[11px] text-zinc-500">Salve este bloco para usar em qualquer outro e-mail</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                Nome do Componente
              </label>
              <input
                type="text"
                required
                value={tempComponentName}
                onChange={(e) => setTempComponentName(e.target.value)}
                placeholder="Ex: Cabeçalho com Logo, Botão de Compra..."
                className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                autoFocus
              />
            </div>

            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850/50 space-y-1.5">
              <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Prévia do Bloco</span>
              <div className="text-[11px] text-zinc-300 font-medium flex items-center gap-2 capitalize">
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                Tipo: {componentToSave.type}
              </div>
              {componentToSave.content && (
                <p className="text-[10px] text-zinc-550 truncate mt-1 italic">
                  "{componentToSave.content}"
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setComponentToSave(null)}
                className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-550 hover:to-violet-550 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Salvar Componente
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#0f0f0f] border border-red-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-zinc-850 pb-3">
              <div className="p-2 bg-red-500/10 text-red-400 rounded-lg animate-pulse">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-100 text-sm">Apagar Modelo e Começar do Zero?</h3>
                <p className="text-[11px] text-zinc-550">Aviso: Esta ação é irreversível.</p>
              </div>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850/50 space-y-2">
              <p className="text-xs text-zinc-300 leading-relaxed">
                Tem certeza de que deseja <span className="text-red-400 font-semibold">apagar tudo</span> o que está no canvas? O modelo atual será totalmente removido e você iniciará com uma tela em branco.
              </p>
              <p className="text-[10px] text-zinc-550">
                Dica: Você pode salvar seu modelo atual na barra lateral antes de apagá-lo.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setTemplate({
                    id: 'scratch',
                    name: 'Design em Branco',
                    globalStyles: {
                      backgroundColor: '#f1f5f9',
                      containerColor: '#ffffff',
                      textColor: '#1e293b',
                      fontFamily: 'system-ui, sans-serif',
                      borderRadius: 8,
                      padding: 24,
                    },
                    variables: [
                      { id: '1', key: 'userName', value: 'Ezequias Lopes', description: 'Nome do destinatário' }
                    ],
                    elements: [
                      {
                        id: 'h_start',
                        type: 'heading',
                        content: 'Olá, {{userName}}!',
                        styles: {
                          fontSize: 24,
                          fontWeight: 'bold',
                          textColor: '#0f172a',
                          align: 'left',
                          marginBottom: 12,
                        },
                      },
                      {
                        id: 't_start',
                        type: 'text',
                        content: 'Comece a arrastar novos elementos ou edite este bloco diretamente!',
                        styles: {
                          fontSize: 14,
                          textColor: '#475569',
                          align: 'left',
                          marginBottom: 0,
                        },
                      }
                    ],
                  });
                  setSelectedElementId(null);
                  setShowResetConfirmModal(false);
                  showToast('Canvas resetado para o início!');
                }}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-550 hover:to-rose-550 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Sim, Apagar Tudo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
