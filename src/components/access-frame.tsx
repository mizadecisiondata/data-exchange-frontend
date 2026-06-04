import Image from "next/image";

const decisionDataHeroVideo = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4";

export function AccessFrame({
  eyebrow,
  children
}: {
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <main className="dd-access-page">
      <video className="dd-access-video" autoPlay muted loop playsInline preload="metadata" poster="/brand/dd-icon.png" aria-hidden="true">
        <source src={decisionDataHeroVideo} type="video/mp4" />
      </video>
      <div className="dd-access-video-overlay" aria-hidden="true" />
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
