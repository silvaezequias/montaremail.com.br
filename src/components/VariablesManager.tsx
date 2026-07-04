import React, { useState } from 'react';
import { Plus, Trash2, HelpCircle, X, Check, Variable, Sliders } from 'lucide-react';
import { EmailVariable } from '../types';

interface VariablesManagerProps {
  variables: EmailVariable[];
  onUpdateVariables: (variables: EmailVariable[]) => void;
  onClose: () => void;
}

export default function VariablesManager({
  variables,
  onUpdateVariables,
  onClose,
}: VariablesManagerProps) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState('');
  const [editingValue, setEditingValue] = useState('');
  const [editingDesc, setEditingDesc] = useState('');
  const [error, setError] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formattedKey = newKey.trim().replace(/\s+/g, '');
    if (!formattedKey) {
      setError('O nome da variável não pode estar vazio.');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formattedKey)) {
      setError('Use apenas letras, números e sublinhados (_) sem espaços.');
      return;
    }

    if (variables.some((v) => v.key.toLowerCase() === formattedKey.toLowerCase())) {
      setError('Já existe uma variável com esse nome.');
      return;
    }

    const newVar: EmailVariable = {
      id: Date.now().toString(),
      key: formattedKey,
      value: newValue.trim(),
      description: newDesc.trim() || `Valor customizado para ${formattedKey}`,
    };

    onUpdateVariables([...variables, newVar]);
    setNewKey('');
    setNewValue('');
    setNewDesc('');
  };

  const handleDelete = (id: string) => {
    onUpdateVariables(variables.filter((v) => v.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const startEditing = (v: EmailVariable) => {
    setEditingId(v.id);
    setEditingKey(v.key);
    setEditingValue(v.value);
    setEditingDesc(v.description);
    setError('');
  };

  const handleSaveEdit = (id: string) => {
    setError('');
    const formattedKey = editingKey.trim().replace(/\s+/g, '');

    if (!formattedKey) {
      setError('O nome da variável não pode estar vazio.');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formattedKey)) {
      setError('Formato inválido. Use letras, números e _');
      return;
    }

    if (
      variables.some(
        (v) => v.id !== id && v.key.toLowerCase() === formattedKey.toLowerCase()
      )
    ) {
      setError('Já existe outra variável com esse nome.');
      return;
    }

    const updated = variables.map((v) => {
      if (v.id === id) {
        return {
          ...v,
          key: formattedKey,
          value: editingValue,
          description: editingDesc.trim(),
        };
      }
      return v;
    });

    onUpdateVariables(updated);
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f]">
      <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-[#0f0f0f]">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-zinc-900 text-blue-400 rounded-lg border border-zinc-800">
            <Variable className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-100">Variáveis do Template</h3>
            <p className="text-xs text-zinc-500">Mude em tempo real e veja no preview</p>
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

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Helper guide */}
        <div className="bg-zinc-900/40 border border-zinc-850 rounded-xl p-3.5 text-xs text-zinc-400 space-y-1.5">
          <div className="flex items-center gap-1.5 font-medium text-zinc-200">
            <HelpCircle className="h-4 w-4 text-zinc-400" />
            Como utilizar no template?
          </div>
          <p>
            Insira as chaves duplas <code className="font-mono bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 text-blue-400 font-bold">{"{{chave}}"}</code> em qualquer texto, link de botão ou URL de imagem.
          </p>
          <p className="text-zinc-500 italic">
            Exemplo: Digite <code className="font-mono bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">Olá, {"{{userName}}"}</code> e o preview mostrará o valor inserido abaixo instantaneamente.
          </p>
        </div>

        {/* Existing variables list */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-zinc-500 tracking-wider uppercase">
            Minhas Variáveis ({variables.length})
          </h4>

          {variables.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
              Nenhuma variável adicionada. Adicione uma abaixo!
            </div>
          ) : (
            <div className="space-y-2.5">
              {variables.map((v) => {
                const isEditing = editingId === v.id;
                return (
                  <div
                    key={v.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isEditing
                        ? 'border-blue-500 bg-blue-500/5 shadow-sm'
                        : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/60'
                    }`}
                  >
                    {isEditing ? (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-medium text-zinc-500 uppercase mb-1">
                              Chave
                            </label>
                            <input
                              type="text"
                              value={editingKey}
                              onChange={(e) => setEditingKey(e.target.value)}
                              className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-blue-500"
                              placeholder="ex: userName"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-zinc-500 uppercase mb-1">
                              Valor Atual
                            </label>
                            <input
                              type="text"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-blue-500"
                              placeholder="ex: João"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-zinc-500 uppercase mb-1">
                            Descrição (Opcional)
                          </label>
                          <input
                            type="text"
                            value={editingDesc}
                            onChange={(e) => setEditingDesc(e.target.value)}
                            className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-blue-500"
                            placeholder="ex: Nome do destinatário"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2.5 py-1 text-xs text-zinc-400 hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleSaveEdit(v.id)}
                            className="px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-md font-medium flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" /> Salvar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="inline-block font-mono text-xs font-bold bg-blue-950/40 text-blue-300 px-1.5 py-0.5 rounded border border-blue-900/40">
                              {"{{"}
                              {v.key}
                              {"}}"}
                            </span>
                            <p className="text-zinc-500 text-[11px] mt-1.5 font-medium">
                              {v.description || 'Sem descrição'}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => startEditing(v)}
                              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-250 rounded-md transition-colors text-xs cursor-pointer"
                              title="Editar"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(v.id)}
                              className="p-1 hover:bg-red-950/40 text-zinc-500 hover:text-red-400 rounded-md transition-colors cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Interactive Direct Value Input for fast tuning */}
                        <div className="mt-2 pt-2 border-t border-zinc-850 flex items-center justify-between gap-2 bg-zinc-900/30 rounded-lg px-2 py-1">
                          <span className="text-[10px] font-medium text-zinc-500 uppercase">
                            Valor de Teste:
                          </span>
                          <input
                            type="text"
                            value={v.value}
                            onChange={(e) => {
                              const updated = variables.map((item) =>
                                item.id === v.id ? { ...item, value: e.target.value } : item
                              );
                              onUpdateVariables(updated);
                            }}
                            className="bg-zinc-950/60 border border-zinc-850 text-xs px-2 py-0.5 rounded-md focus:outline-none focus:border-blue-500 font-medium text-zinc-200 flex-1 text-right max-w-[140px]"
                            placeholder="Valor em tempo real..."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add new Variable Form */}
        <form onSubmit={handleAdd} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 uppercase tracking-wide">
            <Plus className="h-4 w-4 text-blue-400" />
            Nova Variável
          </div>

          <div className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Nome da Variável (Chave)*
              </label>
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="ex: dataEntrega"
                className="w-full text-xs font-mono bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Valor Inicial*
              </label>
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="ex: 10 de Agosto"
                className="w-full text-xs bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Descrição (Para que serve?)
              </label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="ex: Data limite de entrega estimada"
                className="w-full text-xs bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10"
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-xs font-medium">{error}</p>}

          <button
            type="submit"
            className="w-full mt-2 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-550 active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all hover:shadow cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Criar Variável
          </button>
        </form>
      </div>
    </div>
  );
}
