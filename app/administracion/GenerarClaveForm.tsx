"use client";

import { useActionState } from "react";
import { generarClaveNivel2, type EstadoGenerarClave } from "@/lib/actions";

const ESTADO_INICIAL: EstadoGenerarClave = { clave: null, error: null };

export function GenerarClaveForm({
  actorId,
  usuariosNivel2,
}: {
  actorId: string;
  usuariosNivel2: { id: string; nombre: string }[];
}) {
  const [estado, formAction, pending] = useActionState(generarClaveNivel2, ESTADO_INICIAL);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-neutral-200 bg-white p-6">
      <h2 className="font-semibold text-teal-700">Generar clave para una cuenta de nivel 2</h2>
      <input type="hidden" name="actorId" value={actorId} />
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <select name="usuarioId" required className="rounded border border-neutral-300 px-2 py-1 text-teal-400">
          <option value="">Elegir cuenta nivel 2…</option>
          {usuariosNivel2.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {pending ? "Generando…" : "Generar clave"}
        </button>
      </div>

      {estado.error && <p className="text-sm text-red-600">{estado.error}</p>}

      {estado.clave && (
        <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
          <p className="font-medium text-amber-800">
            Copiá esta clave ahora: no se guarda en texto plano y no se va a
            volver a mostrar.
          </p>
          <code className="mt-1 block break-all rounded bg-white px-2 py-1 text-neutral-900">{estado.clave}</code>
        </div>
      )}
    </form>
  );
}
