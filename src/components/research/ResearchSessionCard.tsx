'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import { updateResearchSession } from '@/app/actions/research-sessions';
import { listProductCandidates } from '@/app/actions/product-candidates';
import { listProductSuppliers } from '@/app/actions/product-suppliers';
import { useToast } from '@/components/ui/ToastProvider';
import PillLink from '@/components/ui/PillLink';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type ProductCandidate = {
  id: string;
  name: string;
  summary: string | null;
  demand_level: string | null;
  competition_level: string | null;
  price_range: string | null;
};

type ProductSupplier = {
  id: string;
  candidate_id: string | null;
  name: string;
  website: string | null;
  contact: string | null;
  price_range: string | null;
  notes: string | null;
};

type ResearchSessionCardProps = {
  session: {
    id: string;
    goal: string;
    status: string;
    notes: string | null;
    selected_candidate_id: string | null;
    created_at: string;
    updated_at: string;
  };
  readOnly?: boolean;
};

const SESSION_STATUSES = new Set(['draft', 'researching', 'proposed', 'selected', 'completed']);

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  researching: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  proposed: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  selected: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  completed: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
};

export default function ResearchSessionCard({ session, readOnly }: ResearchSessionCardProps) {
  const [candidates, setCandidates] = useState<ProductCandidate[]>([]);
  const [suppliers, setSuppliers] = useState<ProductSupplier[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [expandedCandidates, setExpandedCandidates] = useState<Set<string>>(new Set());
  const [editingNotes, setEditingNotes] = useState(session.notes || '');
  const [editingStatus, setEditingStatus] = useState(session.status);
  const [isUpdating, startUpdating] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast } = useToast();
  const lastToastRef = useRef<string>('');
  const router = useRouter();

  useEffect(() => {
    (async () => {
      setLoadingCandidates(true);
      try {
        const candidateResult = await listProductCandidates(session.id);
        if ('candidates' in candidateResult && candidateResult.candidates) {
          setCandidates(candidateResult.candidates);
        }

        const supplierResult = await listProductSuppliers(session.id);
        if ('suppliers' in supplierResult && supplierResult.suppliers) {
          setSuppliers(supplierResult.suppliers);
        }
      } catch (error) {
        console.error('Error loading candidates/suppliers', error);
      } finally {
        setLoadingCandidates(false);
      }
    })();
  }, [session.id]);

  const handleSaveUpdate = async () => {
    if (editingNotes === session.notes && editingStatus === session.status) {
      toast({ title: 'Sin cambios', tone: 'info' });
      return;
    }

    startUpdating(async () => {
      const result = await updateResearchSession({
        id: session.id,
        notes: editingNotes,
        status: editingStatus,
      });

      if ('error' in result) {
        const errorKey = `error-${result.error}`;
        if (lastToastRef.current !== errorKey) {
          toast({ title: 'Error', description: result.error, tone: 'error' });
          lastToastRef.current = errorKey;
        }
      } else if ('session' in result) {
        const successKey = 'update-success';
        if (lastToastRef.current !== successKey) {
          toast({ title: 'Investigación actualizada', tone: 'success' });
          lastToastRef.current = successKey;
        }
      }
    });
  };

  const handleExportPDF = async () => {
    const lines = [
      `INVESTIGACIÓN: ${session.goal}`,
      `Estado: ${session.status}`,
      `Fecha: ${new Date(session.created_at).toLocaleDateString()}`,
      '',
      `Notas: ${session.notes || 'Sin notas'}`,
      '',
      `PRODUCTOS CANDIDATOS:`,
    ];

    candidates.forEach((c) => {
      lines.push(`\n- ${c.name}`);
      if (c.summary) lines.push(`  Resumen: ${c.summary}`);
      if (c.demand_level) lines.push(`  Demanda: ${c.demand_level}`);
      if (c.competition_level) lines.push(`  Competencia: ${c.competition_level}`);
      if (c.price_range) lines.push(`  Rango de precio: ${c.price_range}`);

      const candidateSuppliers = suppliers.filter((s) => s.candidate_id === c.id);
      if (candidateSuppliers.length > 0) {
        lines.push(`  Proveedores:`);
        candidateSuppliers.forEach((s) => {
          lines.push(`    - ${s.name}`);
          if (s.website) lines.push(`      Web: ${s.website}`);
          if (s.contact) lines.push(`      Contacto: ${s.contact}`);
          if (s.price_range) lines.push(`      Rango: ${s.price_range}`);
        });
      }
    });

    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investigacion-${session.goal.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteResearch = async () => {
    if (isDeleting) return;
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/research-sessions/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: session.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({ title: 'Error', description: error.error || 'No se pudo eliminar la investigación', tone: 'error' });
        setShowDeleteConfirm(false);
        return;
      }

      toast({ title: 'Investigación eliminada completamente', tone: 'success' });
      setShowDeleteConfirm(false);
      router.refresh();
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: 'Error', description: 'Hubo un problema al eliminar', tone: 'error' });
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleCandidateExpand = (candidateId: string) => {
    const newExpanded = new Set(expandedCandidates);
    if (newExpanded.has(candidateId)) {
      newExpanded.delete(candidateId);
    } else {
      newExpanded.add(candidateId);
    }
    setExpandedCandidates(newExpanded);
  };

  if (readOnly) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{session.goal}</h3>
            <p className="text-xs text-gray-500 mt-1">{session.notes || 'Sin notas'}</p>
          </div>
          <button
            onClick={handleExportPDF}
            className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50"
          >
            📥 PDF
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span className={`rounded-full px-3 py-1 font-medium ${statusColors[session.status] || statusColors.draft}`}>
            {session.status}
          </span>
          <span>Creada: {new Date(session.created_at).toLocaleDateString()}</span>
          {session.selected_candidate_id && (
            <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 text-emerald-700 dark:text-emerald-300">
              ✓ Producto seleccionado
            </span>
          )}
        </div>

        {candidates.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Productos Candidatos ({candidates.length})
            </h4>
            <div className="space-y-2">
              {candidates.map((c) => {
                const candidateSuppliers = suppliers.filter((s) => s.candidate_id === c.id);
                const isExpanded = expandedCandidates.has(c.id);

                return (
                  <div key={c.id} className="text-xs bg-gray-50 dark:bg-gray-800/50 p-3 rounded">
                    <button
                      onClick={() => toggleCandidateExpand(c.id)}
                      className="w-full text-left flex items-center justify-between hover:opacity-80"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">{c.name}</p>
                      <span className="text-gray-500">{isExpanded ? '▼' : '▶'}</span>
                    </button>

                    {isExpanded && (
                      <>
                        {c.summary && <p className="text-gray-600 dark:text-gray-400 mt-2">{c.summary}</p>}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {c.demand_level && (
                            <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                              Demanda: {c.demand_level}
                            </span>
                          )}
                          {c.competition_level && (
                            <span className="inline-block bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded">
                              Competencia: {c.competition_level}
                            </span>
                          )}
                          {c.price_range && (
                            <span className="inline-block bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                              ${c.price_range}
                            </span>
                          )}
                        </div>

                        {candidateSuppliers.length > 0 && (
                          <div className="mt-3 pl-3 border-l-2 border-gray-300 dark:border-gray-700">
                            <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Proveedores ({candidateSuppliers.length})</p>
                            <div className="space-y-2">
                              {candidateSuppliers.map((s) => (
                                <div key={s.id} className="bg-gray-100 dark:bg-gray-900/50 p-2 rounded text-xs">
                                  <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                                  {s.website && (
                                    <p className="text-gray-600 dark:text-gray-400">
                                      🌐 <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                        {s.website.replace(/^https?:\/\//, '')}
                                      </a>
                                    </p>
                                  )}
                                  {s.contact && <p className="text-gray-600 dark:text-gray-400">📧 {s.contact}</p>}
                                  {s.price_range && <p className="text-gray-600 dark:text-gray-400">💰 {s.price_range}</p>}
                                  {s.notes && <p className="text-gray-600 dark:text-gray-400 italic">{s.notes}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (readOnly) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{session.goal}</h3>
            <p className="text-xs text-gray-500 mt-1">{session.notes || 'Sin notas'}</p>
          </div>
          <button
            onClick={handleExportPDF}
            className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50"
          >
            📥 PDF
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span className={`rounded-full px-3 py-1 font-medium ${statusColors[session.status] || statusColors.draft}`}>
            {session.status}
          </span>
          <span>Creada: {new Date(session.created_at).toLocaleDateString()}</span>
          {session.selected_candidate_id && (
            <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 text-emerald-700 dark:text-emerald-300">
              ✓ Producto seleccionado
            </span>
          )}
        </div>

        {candidates.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Productos Candidatos ({candidates.length})
            </h4>
            <div className="space-y-2">
              {candidates.map((c) => {
                const candidateSuppliers = suppliers.filter((s) => s.candidate_id === c.id);
                const isExpanded = expandedCandidates.has(c.id);

                return (
                  <div key={c.id} className="text-xs bg-gray-50 dark:bg-gray-800/50 p-3 rounded">
                    <button
                      onClick={() => toggleCandidateExpand(c.id)}
                      className="w-full text-left flex items-center justify-between hover:opacity-80"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">{c.name}</p>
                      <span className="text-gray-500">{isExpanded ? '▼' : '▶'}</span>
                    </button>

                    {isExpanded && (
                      <>
                        {c.summary && <p className="text-gray-600 dark:text-gray-400 mt-2">{c.summary}</p>}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {c.demand_level && (
                            <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                              Demanda: {c.demand_level}
                            </span>
                          )}
                          {c.competition_level && (
                            <span className="inline-block bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded">
                              Competencia: {c.competition_level}
                            </span>
                          )}
                          {c.price_range && (
                            <span className="inline-block bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                              ${c.price_range}
                            </span>
                          )}
                        </div>

                        {candidateSuppliers.length > 0 && (
                          <div className="mt-3 pl-3 border-l-2 border-gray-300 dark:border-gray-700">
                            <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Proveedores ({candidateSuppliers.length})</p>
                            <div className="space-y-2">
                              {candidateSuppliers.map((s) => (
                                <div key={s.id} className="bg-gray-100 dark:bg-gray-900/50 p-2 rounded text-xs">
                                  <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                                  {s.website && (
                                    <p className="text-gray-600 dark:text-gray-400">
                                      🌐 <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                        {s.website.replace(/^https?:\/\//, '')}
                                      </a>
                                    </p>
                                  )}
                                  {s.contact && <p className="text-gray-600 dark:text-gray-400">📧 {s.contact}</p>}
                                  {s.price_range && <p className="text-gray-600 dark:text-gray-400">💰 {s.price_range}</p>}
                                  {s.notes && <p className="text-gray-600 dark:text-gray-400 italic">{s.notes}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{session.goal}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50"
          >
            📥 PDF
          </button>
          <button
            onClick={handleDeleteResearch}
            disabled={isDeleting}
            className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition ${showDeleteConfirm ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/40'} disabled:opacity-60`}
          >
            <Trash2 size={14} />
            {isDeleting ? 'Eliminando...' : showDeleteConfirm ? 'Confirmar' : 'Eliminar'}
          </button>
          {showDeleteConfirm && !isDeleting && (
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="rounded px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <span className={`rounded-full px-3 py-1 font-medium ${statusColors[session.status] || statusColors.draft}`}>
          {session.status}
        </span>
        <span>Creada: {new Date(session.created_at).toLocaleDateString()}</span>
        {session.selected_candidate_id && (
          <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 text-emerald-700 dark:text-emerald-300">
            ✓ Producto seleccionado
          </span>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          <textarea
            value={editingNotes}
            onChange={(e) => setEditingNotes(e.target.value)}
            placeholder="Notas adicionales..."
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
            rows={2}
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={editingStatus}
            onChange={(e) => setEditingStatus(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
          >
            {Array.from(SESSION_STATUSES).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            onClick={handleSaveUpdate}
            disabled={isUpdating}
            className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs text-indigo-700 hover:bg-indigo-100 disabled:opacity-60 whitespace-nowrap"
          >
            {isUpdating ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {candidates.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Productos Candidatos ({candidates.length})
          </h4>
          <div className="space-y-2">
            {candidates.map((c) => {
              const candidateSuppliers = suppliers.filter((s) => s.candidate_id === c.id);
              const isExpanded = expandedCandidates.has(c.id);

              return (
                <div key={c.id} className="text-xs bg-gray-50 dark:bg-gray-800/50 p-3 rounded">
                  <button
                    onClick={() => toggleCandidateExpand(c.id)}
                    className="w-full text-left flex items-center justify-between hover:opacity-80"
                  >
                    <p className="font-medium text-gray-900 dark:text-white">{c.name}</p>
                    <span className="text-gray-500">{isExpanded ? '▼' : '▶'}</span>
                  </button>

                  {isExpanded && (
                    <>
                      {c.summary && <p className="text-gray-600 dark:text-gray-400 mt-2">{c.summary}</p>}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {c.demand_level && (
                          <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                            Demanda: {c.demand_level}
                          </span>
                        )}
                        {c.competition_level && (
                          <span className="inline-block bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded">
                            Competencia: {c.competition_level}
                          </span>
                        )}
                        {c.price_range && (
                          <span className="inline-block bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                            ${c.price_range}
                          </span>
                        )}
                      </div>

                      {candidateSuppliers.length > 0 && (
                        <div className="mt-3 pl-3 border-l-2 border-gray-300 dark:border-gray-700">
                          <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Proveedores ({candidateSuppliers.length})</p>
                          <div className="space-y-2">
                            {candidateSuppliers.map((s) => (
                              <div key={s.id} className="bg-gray-100 dark:bg-gray-900/50 p-2 rounded text-xs">
                                <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                                {s.website && (
                                  <p className="text-gray-600 dark:text-gray-400">
                                    🌐 <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                      {s.website.replace(/^https?:\/\//, '')}
                                    </a>
                                  </p>
                                )}
                                {s.contact && <p className="text-gray-600 dark:text-gray-400">📧 {s.contact}</p>}
                                {s.price_range && <p className="text-gray-600 dark:text-gray-400">💰 {s.price_range}</p>}
                                {s.notes && <p className="text-gray-600 dark:text-gray-400 italic">{s.notes}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
