import Image from "next/image";

export function BrandMark({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/decision-data-logo.png"
        alt="Decision Data"
        width={48}
        height={48}
        className="rounded-lg border border-primary/30 bg-[#05091f] object-contain"
        priority
      />
      <div>
        <b className="block text-sm text-foreground">Decision Data</b>
        <span className="text-xs text-muted">{label}</span>
      </div>
    </div>
  );
}
