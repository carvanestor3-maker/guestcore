const STYLES: Record<string, string> = {
  bajo: "bg-green-100 text-green-800",
  medio: "bg-amber-100 text-amber-800",
  alto: "bg-red-100 text-red-800",
  PENDIENTE: "bg-amber-100 text-amber-800",
  VERIFICADO: "bg-green-100 text-green-800",
  RECHAZADO: "bg-neutral-200 text-neutral-600",
  CONFIRMADA: "bg-blue-100 text-blue-800",
  CANCELADA: "bg-neutral-200 text-neutral-600",
  FINALIZADA: "bg-green-100 text-green-800",
  GRATIS: "bg-green-100 text-green-800",
  BASICO: "bg-amber-100 text-amber-800",
  ABONO: "bg-blue-100 text-blue-800",
};

export function Badge({ children, tone }: { children: React.ReactNode; tone: string }) {
  const style = STYLES[tone] ?? "bg-neutral-100 text-neutral-700";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {children}
    </span>
  );
}
