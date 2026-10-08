import type { ComponentType, ReactNode } from "react";

import type { IconProps } from "@/components/ui/icons";

export type WalletFigure = { value: string; label: string };

export type WalletStat = {
  /** One or two stacked figures, as in the designs. */
  figures: [WalletFigure] | [WalletFigure, WalletFigure];
  icon: ComponentType<IconProps>;
};

/**
 * The wallet block shared by vendor and admin: a highlighted hero figure
 * beside two columns of supporting figures. Collapses to a single column in a
 * narrow card and to hero-over-two-columns in a medium one.
 */
export function WalletPanel({
  hero,
  columns,
  align = "start",
}: {
  hero: {
    value: string;
    label: string;
    icon: ComponentType<IconProps>;
    action?: ReactNode;
    /** The vendor's hero figure is larger than the admin's. */
    size?: "lg" | "md";
  };
  columns: [WalletStat[], WalletStat[]];
  align?: "start" | "center";
}) {
  const HeroIcon = hero.icon;

  return (
    <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @4xl:grid-cols-[300px_1fr_1fr]">
      <div className="flex flex-col items-center justify-center rounded-lg border border-iris-100 bg-[linear-gradient(150deg,var(--iris-50),var(--bg-subtle))] p-6 text-center @2xl:col-span-2 @4xl:col-span-1">
        <span className="mb-[14px] grid size-14 place-items-center rounded-lg bg-surface text-iris-500 shadow-[0_6px_16px_-6px_rgba(101,68,224,.4)]">
          <HeroIcon size={26} strokeWidth={1.8} />
        </span>
        <p
          className={`font-display font-extrabold leading-none text-ink ${
            hero.size === "md" ? "text-[24px]" : "text-[28px]"
          }`}
        >
          {hero.value}
        </p>
        <p className="mt-2 text-[13px] leading-none text-muted">{hero.label}</p>
        {hero.action ? <div className="mt-4 w-full">{hero.action}</div> : null}
      </div>

      {columns.map((column, index) => (
        <div key={index} className="flex flex-col gap-4">
          {column.map(({ figures, icon: Icon }) => (
            <div
              key={figures[0].label}
              className={`flex flex-1 justify-between gap-3 rounded-lg border border-line-soft bg-bg-subtle p-5 ${
                align === "center" ? "items-center" : "items-start"
              }`}
            >
              <div className="flex flex-col gap-[14px]">
                {figures.map((figure) => (
                  <div key={figure.label}>
                    <p className="font-display text-[21px] font-extrabold leading-none text-ink">
                      {figure.value}
                    </p>
                    <p className="mt-[7px] text-[12.5px] leading-[1.2] text-muted">
                      {figure.label}
                    </p>
                  </div>
                ))}
              </div>
              <span className="grid size-11 flex-none place-items-center rounded-[12px] bg-iris-50 text-iris-500">
                <Icon size={22} strokeWidth={1.7} />
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
