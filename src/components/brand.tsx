import Image from "next/image";

export function BrandMark({ label }: { label: string }) {
  return (
    <div className="dd-brand-mark">
      <Image
        src="/brand/dd-icon.png"
        alt="Decision Data"
        width={48}
        height={48}
        className="dd-brand-mark__icon"
        priority
      />
      <div>
        <Image src="/brand/dd-lockup-white.png" alt="Decision Data" width={178} height={36} className="dd-brand-mark__lockup" priority />
        <span>{label}</span>
      </div>
    </div>
  );
}
