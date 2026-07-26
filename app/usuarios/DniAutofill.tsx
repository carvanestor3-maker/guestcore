"use client";

import { useState, useTransition } from "react";
import { buscarPersonaPorDniAction } from "@/lib/actions";

type Estado = "idle" | "buscando" | "encontrado" | "no_encontrado";

const ROLES = [
  { value: "PROPIETARIO", label: "Propietario" },
  { value: "HUESPED", label: "Huésped" },
  { value: "INMOBILIARIA", label: "Inmobiliaria" },
  { value: "ASEGURADORA", label: "Aseguradora" },
  { value: "ADMIN", label: "Admin" },
];

export function DniAutofill() {
  const [dni, setDni] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("PROPIETARIO");
  const [estado, setEstado] = useState<Estado>("idle");
  const [, startTransition] = useTransition();

  function buscar(valor: string) {
    const soloDigitos = valor.replace(/\D/g, "");
    if (!soloDigitos) {
      setEstado("idle");
      return;
    }
    setEstado("buscando");
    startTransition(async () => {
      const persona = await buscarPersonaPorDniAction(soloDigitos);
      if (persona) {
        setNombre(persona.nombreCompleto);
        setEstado("encontrado");
      } else {
        setEstado("no_encontrado");
      }
    });
  }

  return (
    <>
      <label className="text-sm">
        Rol
        <select
          name="rol"
          required
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-teal-400"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        DNI <span className="text-red-500">*</span>
        <input
          name="dni"
          inputMode="numeric"
          required
          placeholder="Sin puntos, ej. 30123456"
          value={dni}
          onChange={(e) => setDni(e.target.value)}
          onBlur={(e) => buscar(e.target.value)}
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
        />
        {estado === "buscando" && (
          <span className="mt-1 block text-xs text-neutral-400">Consultando padrón…</span>
        )}
        {estado === "encontrado" && (
          <span className="mt-1 block text-xs text-green-600">Identidad encontrada en el padrón.</span>
        )}
        {estado === "no_encontrado" && (
          <span className="mt-1 block text-xs text-red-600">
            DNI no encontrado en el padrón: la cuenta no se puede crear sin una identidad válida.
          </span>
        )}
      </label>
      <label className="text-sm">
        Nombre completo
        <input
          name="nombre"
          required
          readOnly={estado === "encontrado"}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Se completa solo al validar el DNI"
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 read-only:bg-neutral-100"
        />
      </label>
      {rol === "ADMIN" && (
        <label className="text-sm">
          Nivel de permisos
          <select
            name="nivel"
            defaultValue="2"
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-teal-400"
          >
            <option value="2">Nivel 2 — puede modificar tarifas</option>
            <option value="3">Nivel 3 — políticas del sistema (a futuro)</option>
          </select>
        </label>
      )}
    </>
  );
}
