import type { ReactNode } from "react";

interface SummaryCardProps {
  title: string;
  value: string;
  backgroundClassName: string;
  icon: ReactNode;
}

export function SummaryCard({
  title,
  value,
  backgroundClassName,
  icon,
}: SummaryCardProps) {
  return (
    <article
      className={`rounded-[24px] px-[26px] py-[24px] ${backgroundClassName}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="pt-[10px]">
          <p className="text-[14px] leading-[17px] text-foreground">{title}</p>
          <p className="mt-[10px] font-heading text-[24px] leading-[29px] font-bold text-foreground">
            {value}
          </p>
        </div>
        <div className="shrink-0 text-foreground">{icon}</div>
      </div>
    </article>
  );
}
