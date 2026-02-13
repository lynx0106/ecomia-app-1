'use client';

import { useActionState, useEffect, useRef } from 'react';
import type { GuidedLandingFormState } from '@/app/actions/landing-pages';
import { updateLandingCheckoutFromForm } from '@/app/actions/landing-pages';
import { useToast } from '@/components/ui/ToastProvider';
import GenericCheckoutSettingsPanel from '@/components/CheckoutSettingsPanel';

type CheckoutSettingsPanelProps = {
  landingId: string;
  content: Record<string, unknown>;
};

const initialState: GuidedLandingFormState = { ok: false, error: undefined };

export default function CheckoutSettingsPanel({ landingId, content }: CheckoutSettingsPanelProps) {
  const [state, formAction] = useActionState(updateLandingCheckoutFromForm, initialState);
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
      id={landingId}
      data={content}
      formAction={formAction}
      theme="emerald"
      title="Activa el pago en esta landing"
      defaultSourceOptions={['research', 'manual']}
      error={state?.error}
    />
  );
}
