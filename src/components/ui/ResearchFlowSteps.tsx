'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const steps = [
  'Definir objetivo y nicho',
  'Investigar mercado y demanda',
  'Proponer 3 productos ganadores',
  'Buscar proveedores confiables',
  'Elegir producto final',
  'Generar assets y copys',
  'Crear tienda o landing',
];

export default function ResearchFlowSteps() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-xs text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-sm font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        <span>Flujo guiado</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      {isExpanded && (
        <ol className="mt-2 space-y-1 text-[11px] text-gray-500 dark:text-gray-400">
          {steps.map((step, index) => (
            <li key={step} className="flex items-start gap-2">
              <span className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-100 text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
