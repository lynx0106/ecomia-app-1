'use client';

import { useFormStatus } from 'react-dom';
import { useMemo } from 'react';

export type CheckoutSettingsPanelConfig = {
  id: string;
  data: Record<string, unknown>;
  formAction: (formData: FormData) => void;
  theme?: 'slate' | 'emerald';
  title?: string;
  defaultSourceOptions?: string[];
  error?: string;
};

function SaveButton({ theme = 'slate' }: { theme?: 'slate' | 'emerald' }) {
  const { pending } = useFormStatus();
  const bgColor = theme === 'emerald' 
    ? 'bg-emerald-500 hover:bg-emerald-400' 
    : 'bg-slate-900 hover:bg-slate-800';
  
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center rounded-full ${bgColor} px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-60`}
    >
      {pending ? 'Guardando...' : 'Guardar checkout'}
    </button>
  );
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function getNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export default function CheckoutSettingsPanel({ 
  id, 
  data, 
  formAction,
  theme = 'slate',
  title = 'Activa el pago',
  defaultSourceOptions = ['research', 'manual'],
  error
}: CheckoutSettingsPanelConfig) {
  const defaults = useMemo(() => {
    const product = (data.product ?? {}) as Record<string, unknown>;
    const checkout = (data.checkout ?? {}) as Record<string, unknown>;
    
    return {
      enabled: Boolean(checkout.enabled),
      price: getNumber(checkout.price_cop) ?? null,
      productName: getString(checkout.product_name) || getString(product.name) || '',
      source: getString(checkout.source) || getString(product.source) || defaultSourceOptions[0] || 'research',
    };
  }, [data, defaultSourceOptions]);

  const borderColor = theme === 'emerald' ? 'border-emerald-100' : 'border-slate-200/60';
  const bgGradient = theme === 'emerald'
    ? 'from-white via-white to-emerald-50/60 dark:border-emerald-500/20 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-900/20'
    : 'from-white via-white to-slate-100/60 dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900/40';
  
  const badgeBorder = theme === 'emerald' ? 'border-emerald-200' : 'border-slate-200';
  const badgeText = theme === 'emerald' ? 'text-emerald-600 dark:text-emerald-200' : 'text-slate-600 dark:text-slate-300';
  const badgeBg = theme === 'emerald' ? 'dark:border-emerald-500/40 dark:bg-emerald-500/10' : 'dark:bg-slate-900 dark:border-slate-700';
  
  const focusColor = theme === 'emerald' ? 'focus:border-emerald-300' : 'focus:border-slate-400';
  const checkboxColor = theme === 'emerald' ? 'text-emerald-500' : 'text-slate-900';

  return (
    <div className={`rounded-3xl border ${borderColor} bg-gradient-to-br ${bgGradient} p-6 shadow-sm`}>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Checkout</p>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h3>
        </div>
        <div className={`rounded-full border ${badgeBorder} bg-white px-3 py-1 text-[11px] font-semibold ${badgeText} ${badgeBg}`}>
          Paso opcional
        </div>
      </div>

      <form action={formAction} className="mt-6 grid gap-4">
        <input type="hidden" name="id" value={id} />

        <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            name="checkout_enabled"
            defaultChecked={defaults.enabled}
            className={`h-4 w-4 rounded border-slate-300 ${checkboxColor}`}
          />
          Activar checkout MercadoPago
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Producto</span>
            <input
              name="checkout_product"
              defaultValue={defaults.productName}
              placeholder="Nombre del producto"
              className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ${focusColor} focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white`}
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Precio (COP)</span>
            <input
              name="checkout_price"
              defaultValue={defaults.price ?? ''}
              placeholder="99000"
              className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ${focusColor} focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white`}
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Origen del producto</span>
          <select
            name="checkout_source"
            defaultValue={defaults.source}
            className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ${focusColor} focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white`}
          >
            {defaultSourceOptions.map(opt => (
              <option key={opt} value={opt}>
                {opt === 'research' ? 'Investigacion (producto recomendado)' : 'Manual'}
              </option>
            ))}
          </select>
        </label>

        {error && (
          <p className="text-xs text-rose-500">{error}</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            El checkout usara MercadoPago Checkout Pro y redireccionara al pago.
          </div>
          <SaveButton theme={theme} />
        </div>
      </form>
    </div>
  );
}
