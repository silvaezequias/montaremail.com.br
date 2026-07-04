import React, { useState } from "react";
import { EmailTemplate } from "../types";
import {
  X,
  Trash2,
  HardDrive,
  AlertTriangle,
  Check,
  Save,
  FileText,
  Calendar,
  Layers,
} from "lucide-react";

interface StorageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedTemplates: EmailTemplate[];
  onDeleteTemplate: (id: string) => void;
  onSaveCurrentTemplate: (name: string) => boolean;
  currentTemplate: EmailTemplate;
  storageUsageBytes: number;
  storageLimitBytes: number;
  isSavingMode?: boolean; // If true, opens a prompt to save current template first
}

export default function StorageManagerModal({
  isOpen,
  onClose,
  savedTemplates,
  onDeleteTemplate,
  onSaveCurrentTemplate,
  currentTemplate,
  storageUsageBytes,
  storageLimitBytes,
  isSavingMode = false,
}: StorageManagerModalProps) {
  const [templateName, setTemplateName] = useState(
    currentTemplate.id !== "scratch" &&
      !currentTemplate.id.startsWith("welcome") &&
      !currentTemplate.id.startsWith("promo")
      ? currentTemplate.name
      : "",
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSavingFlow, setShowSavingFlow] = useState(isSavingMode);

  if (!isOpen) return null;

  // Calculate percentages
  const usagePercentage = Math.min(
    100,
    (storageUsageBytes / storageLimitBytes) * 100,
  );
  const formattedUsage = (storageUsageBytes / 1024).toFixed(1);
  const formattedLimit = (storageLimitBytes / 1024).toFixed(1);

  // Helper to calculate individual template size
  const getTemplateSizeKB = (t: EmailTemplate): string => {
    const size = new Blob([JSON.stringify(t)]).size;
    return (size / 1024).toFixed(1);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    if (!templateName.trim()) {
      setSaveError("Por favor, insira um nome para o seu template.");
      return;
    }

    const success = onSaveCurrentTemplate(templateName.trim());
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1500);
    } else {
      setSaveError(
        "Limite de armazenamento excedido! Delete um ou mais templates antigos abaixo para liberar espaço.",
      );
    }
  };

  // Color of storage bar based on usage
  let barColorClass = "bg-blue-500";
  if (usagePercentage >= 90) {
    barColorClass = "bg-red-500";
  } else if (usagePercentage >= 75) {
    barColorClass = "bg-amber-500";
  }

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-[#0f0f0f] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-zinc-800">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800 bg-[#0f0f0f] rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-zinc-900 text-blue-400 rounded-lg border border-zinc-800">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-base">
                {showSavingFlow
                  ? "Salvar Template"
                  : "Gerenciador de Armazenamento"}
              </h3>
              <p className="text-xs text-zinc-500">
                {showSavingFlow
                  ? "Guarde o progresso do seu modelo atual"
                  : "Gerencie o espaço dos seus templates no navegador"}
              </p>
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

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Storage Quota Progress Bar Panel */}
          <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-850 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5 text-zinc-400" />
                Espaço de Armazenamento
              </span>
              <span className="font-mono text-zinc-400">
                <strong
                  className={
                    usagePercentage >= 90 ? "text-red-400" : "text-zinc-200"
                  }
                >
                  {formattedUsage} KB
                </strong>{" "}
                de {formattedLimit} KB usado ({usagePercentage.toFixed(1)}%)
              </span>
            </div>

            {/* Real Progress Bar */}
            <div className="w-full bg-zinc-850 h-3 rounded-full overflow-hidden border border-zinc-800/40">
              <div
                className={`h-full transition-all duration-500 rounded-full ${barColorClass}`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>

            {usagePercentage >= 90 && (
              <div className="flex items-start gap-2 text-red-400 text-xs bg-red-500/10 p-3 rounded-lg border border-red-900/30">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  <strong>Atenção:</strong> Você está prestes a esgotar o limite
                  de armazenamento. Delete templates antigos para continuar
                  salvando novos designs de email.
                </p>
              </div>
            )}
          </div>

          {/* Flow 1: Save Template Prompt */}
          {showSavingFlow && (
            <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/30 space-y-4">
              <div className="flex items-center gap-2 text-zinc-200 font-semibold text-sm">
                <Save className="h-4 w-4 text-blue-400" />
                Salvar template atual no localStorage
              </div>

              <form onSubmit={handleSave} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                    Nome do Template
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => {
                      setTemplateName(e.target.value);
                      setSaveError(null);
                    }}
                    placeholder="Ex: Newsletter Semanal Julho, E-mail de Lançamento..."
                    className="w-full text-sm bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                </div>

                {saveError && (
                  <p className="text-red-400 text-xs font-medium flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> {saveError}
                  </p>
                )}

                {saveSuccess && (
                  <p className="text-emerald-400 text-xs font-bold flex items-center gap-1.5 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                    <Check className="h-4 w-4" /> Template salvo com sucesso!
                  </p>
                )}

                <div className="flex justify-end gap-2.5 pt-1">
                  {savedTemplates.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowSavingFlow(false)}
                      className="px-4 py-2 text-xs bg-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition-colors cursor-pointer"
                    >
                      Ver Outros Modelos
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-550 active:scale-95 text-white font-bold rounded-xl shadow transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="h-4 w-4" /> Confirmar e Salvar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Flow 2: Saved Templates List */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Meus Templates Salvos ({savedTemplates.length})
              </h4>
              {showSavingFlow && (
                <button
                  onClick={() => setShowSavingFlow(false)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                >
                  Visualizar Espaço e Lista
                </button>
              )}
              {!showSavingFlow && (
                <button
                  onClick={() => setShowSavingFlow(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 hover:underline"
                >
                  <Save className="h-3.5 w-3.5" /> Salvar Modelo Atual
                </button>
              )}
            </div>

            {savedTemplates.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm bg-zinc-950/20">
                <FileText className="h-8 w-8 text-zinc-650 mx-auto mb-2 animate-pulse" />
                Nenhum template salvo no localStorage ainda.
                <button
                  onClick={() => setShowSavingFlow(true)}
                  className="block mx-auto mt-2 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                >
                  Clique para salvar o atual!
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {savedTemplates.map((t) => {
                  const sizeKB = getTemplateSizeKB(t);
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3.5 bg-zinc-950 border border-zinc-850 hover:border-zinc-800 rounded-xl transition-all"
                    >
                      <div className="space-y-1 pr-4 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-zinc-200 truncate block">
                            {t.name}
                          </span>
                          <span className="shrink-0 bg-blue-500/10 text-blue-400 text-[10px] px-1.5 py-0.5 rounded font-mono border border-blue-500/10">
                            {sizeKB} KB
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Layers className="h-3 w-3 text-zinc-600" />
                            {t.elements.length} blocos
                          </span>
                          {t.updatedAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-zinc-600" />
                              {new Date(t.updatedAt).toLocaleString("pt-BR", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onDeleteTemplate(t.id);
                          }}
                          className="p-2 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                          title="Excluir do Armazenamento"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-[#0f0f0f] flex justify-between items-center rounded-b-2xl">
          <span className="text-[10px] text-zinc-500 leading-normal max-w-85">
            💡 O limite de armazenamento é definido pelo tamanho de espaço local
            do seu navegador. Nada é salvo na núvem!
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold border border-zinc-700 cursor-pointer transition-all"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
}
