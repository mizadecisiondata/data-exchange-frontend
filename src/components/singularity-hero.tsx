import Image from "next/image";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

export function SingularityHero({
  eyebrow,
  title,
  body,
  items,
  className
}: {
  eyebrow: string;
  title: string;
  body: string;
  items: string[];
  className?: string;
}) {
  return (
    <section className={cn("dd-singularity-card", className)}>
      <div className="dd-singularity-visual" aria-hidden="true">
        <div className="dd-singularity-stars" />
        <div className="dd-singularity-ring dd-singularity-ring--outer" />
        <div className="dd-singularity-ring dd-singularity-ring--inner" />
        <Image src="/brand/dd-planet.png" alt="" width={420} height={420} className="dd-singularity-logo" priority />
      </div>
      <div className="dd-singularity-copy">
        <Image src="/brand/dd-lockup-white.png" alt="Decision Data" width={220} height={44} className="h-10 w-auto object-contain" priority />
        <Badge tone="warn" className="w-fit">{eyebrow}</Badge>
        <h1>{title}</h1>
        <p>{body}</p>
        <div className="dd-singularity-list">
          {items.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
