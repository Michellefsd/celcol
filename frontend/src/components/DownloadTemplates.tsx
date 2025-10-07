'use client';

import { api } from '@/services/api';
import IconButton from '@/components/IconButton';
import { IconDescargar } from '@/components/ui/Icons';

export default function BotonesPlantillas({
  ordenId,
  disabled,
}: {
  ordenId: string;          // viene del input
  disabled?: boolean;
}) {
  const descargar = (tipo: 'ccm' | 'conformidad') => {
    if (!ordenId) return;
    const url = api(`/ordenes-trabajo/${ordenId}/plantilla/${tipo}`);
    const win = window.open('about:blank', '_blank');
    if (win) setTimeout(() => (win.location.href = url), 60);
    else window.open(url, '_blank');
  };

  return (
    <div className="flex gap-2">
      <IconButton
        icon={IconDescargar}
        title="Descargar plantilla CCM (editable)"
        label="CCM (editable)"
        onClick={() => descargar('ccm')}
        className={disabled ? 'opacity-50 cursor-not-allowed' : ''}
        disabled={disabled}
      />
      <IconButton
        icon={IconDescargar}
        title="Descargar plantilla PDF (editable)"
        label="PDF (editable)"
        onClick={() => descargar('conformidad')}
        className={disabled ? 'opacity-50 cursor-not-allowed' : ''}
        disabled={disabled}
      />
    </div>
  );
}
