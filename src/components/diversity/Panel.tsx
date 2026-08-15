import type { ReactNode } from "react";

export function Panel({
  step,
  title,
  subtitle,
  children,
  className = "",
}: {
  step?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-border bg-card/60 p-5 backdrop-blur ${className}`}>
      <header className="mb-4">
        <div className="flex items-baseline gap-2">
          {step ? <span className="num text-xs text-primary">{step}</span> : null}
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        </div>
        {subtitle ? (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{subtitle}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
