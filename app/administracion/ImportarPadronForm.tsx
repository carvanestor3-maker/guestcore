"use client";

import { useActionState } from "react";
import { importarPadronManual, type EstadoImportarPadron } from "@/lib/actions";

const ESTADO_INICIAL: EstadoImportarPadron = { importados: 0, error: null };

export function ImportarPadronForm({ actorId }: { actorId: string }) {
  const [estado, formAction, pending] = useActionState(importarPadronManual, ESTADO_INICIAL);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-neutral-200 bg-white p-6">
      <h2 className="font-semibold text-teal-700">Importar padrón manual</h2>
      <p className="text-xs text-neutral-500">
        Una línea por persona, formato <code className="text-neutral-800">DNI, Nombre completo</code>.
        Estas entradas tienen prioridad sobre el padrón simulado fijo del
        código al validar un DNI.
      </p>
      <input type="hidden" name="actorId" value={actorId} />
      <textarea
        name="lista"
        required
        rows={5}
        placeholder={"30111222, Juan Pérez\n27333444, María López"}
        className="w-full rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Importando…" : "Importar lista"}
      </button>
      {estado.error && <p className="text-sm text-red-600">{estado.error}</p>}
      {estado.importados > 0 && (
        <p className="text-sm text-green-700">{estado.importados} DNI(s) importado(s) correctamente.</p>
      )}
    </form>
  );
}
