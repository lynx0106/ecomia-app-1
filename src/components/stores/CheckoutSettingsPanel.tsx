'use client';

import { useActionState, useEffect, useRef } from 'react';
import type { GuidedStoreFormState } from '@/app/actions/stores';
import { updateStoreCheckoutFromForm } from '@/app/actions/stores';
import { useToast } from '@/components/ui/ToastProvider';
import GenericCheckoutSettingsPanel from '@/components/CheckoutSettingsPanel';

type CheckoutSettingsPanelProps = {
  storeId: string;
  meta: Record<string, unknown>;
};

const initialState: GuidedStoreFormState = { ok: false, error: undefined };

export default function CheckoutSettingsPanel({ storeId, meta }: CheckoutSettingsPanelProps) {
  const [state, formAction] = useActionState(updateStoreCheckoutFromForm, initialState);
  const { toast } = useToast();
  const lastRef = useRef<{ ok?: boolean; error?: string }>({});

  useEffect(() => {
    if (state?.error && state.error !== lastRef.current.error) {
      toast({ title: 'No se pudo actualizar', description: state.error, tone: 'error' });
      lastRef.current.error = state.error;
    }
    if (state?.ok && !lastRef.current.ok) {
      toast({ title: 'Checkout actualizado', tone: 'success' });
      lastRef.current.ok = true;
    }
  }, [state, toast]);

  return (
    <GenericCheckoutSettingsPanel
      id={storeId}
      data={meta}
      formAction={formAction}
      theme="slate"
      title="Activa el pago en tu tienda"
      defaultSourceOptions={['manual', 'research']}
      error={state?.error}
    />
  );
}
