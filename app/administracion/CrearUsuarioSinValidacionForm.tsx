"use client";

import { useActionState } from "react";
import { crearUsuarioSinValidacion, type EstadoCrearUsuarioSinValidacion } from "@/lib/actions";

const ESTADO_INICIAL: EstadoCrearUsuarioSinValidacion = { ok: false, error: null };

const ROLES = [
  { value: "PROPIETARIO", label: "Propietario" },
  { value: "HUESPED", label: "Huésped" },
  { value: "INMOBILIARIA", label: "Inmobiliaria" },
  { value: "ASEGURADORA", label: "Aseguradora" },
  { value: "ADMIN", label: "Admin" },
];

export function CrearUsuarioSinValidacionForm({ actorId }: { actorId: string }) {
  const [estado, formAction, pending] = useActionState(crearUsuarioSinValidacion, ESTADO_INICIAL);

  return (
    <form
      action={formAction}
      className="grid grid-cols-1 gap-4 rounded-lg border border-neutral-200 bg-white p-6 sm:grid-cols-2"
    >
      <h2 className="col-span-full font-semibold text-teal-700">
        Dar de alta usuario sin validar el DNI (nivel 2, 3 o 4)
      </h2>
      <p className="col-span-full text-xs text-neutral-500">
        A diferencia del alta normal, acá el DNI no se chequea contra el
        padrón — se carga a mano. Pensado para cuentas internas o de prueba
        que no necesariamente corresponden a una persona verificable.
      </p>
      <input type="hidden" name="actorId" value={actorId} />
      <label className="text-sm text-neutral-700">
        Nombre completo
        <input name="nombre" required className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-neutral-900" />
      </label>
      <label className="text-sm text-neutral-700">
        Email
        <input name="email" type="email" required className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-neutral-900" />
      </label>
      <label className="text-sm text-neutral-700">
        DNI
        <input
          name="dni"
          inputMode="numeric"
          placeholder="Sin puntos, ej. 30123456"
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-neutral-900"
        />
      </label>
      <label className="text-sm text-neutral-700">
        Teléfono
        <input name="telefono" className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-neutral-900" />
      </label>
      <label className="text-sm text-neutral-700">
        Rol
        <select name="rol" required defaultValue="ADMIN" className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-teal-400">
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm text-neutral-700">
        Nivel
        <select name="nivel" required defaultValue="2" className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-teal-400">
          <option value="1">Nivel 1</option>
          <option value="2">Nivel 2</option>
          <option value="3">Nivel 3</option>
          <option value="4">Nivel 4</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="col-span-full w-fit rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Creando…" : "Crear usuario"}
      </button>
      {estado.error && <p className="col-span-full text-sm text-red-600">{estado.error}</p>}
      {estado.ok && <p className="col-span-full text-sm text-green-700">Cuenta creada.</p>}
    </form>
  );
}
