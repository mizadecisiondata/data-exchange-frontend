import Image from "next/image";

export function AccessFrame({
  eyebrow,
  children
}: {
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <main className="dd-access-page">
      <div className="dd-access-stars" aria-hidden="true" />
      <div className="dd-access-singularity" aria-hidden="true">
        <span className="dd-access-hole" />
        <span className="dd-access-orbit dd-access-orbit--one" />
        <span className="dd-access-orbit dd-access-orbit--two" />
        <span className="dd-access-orbit dd-access-orbit--three" />
        <span className="dd-access-dots" />
      </div>
      <section className="dd-access-card">
        <Image src="/brand/dd-lockup-white.png" alt="Decision Data" width={280} height={58} className="dd-access-lockup" priority />
        <p className="dd-access-tagline">Intelligence for Decisions</p>
        <span className="dd-access-eyebrow">{eyebrow}</span>
        {children}
      </section>
      <footer className="dd-access-footer">© 2026 Decision Data · Todos los derechos reservados</footer>
    </main>
  );
}
