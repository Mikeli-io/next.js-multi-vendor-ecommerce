"use client";

import { ArcElement, Chart as ChartJS, Tooltip, type ChartData, type ChartOptions } from "chart.js";
import { Doughnut } from "react-chartjs-2";

import { SeriesDot } from "./line-chart-card";
import { SectionCard } from "./section-card";
import { seriesColor, token, type SeriesColor } from "./chart-theme";

ChartJS.register(ArcElement, Tooltip);

export type DoughnutSlice = { label: string; value: number; color: SeriesColor };

/**
 * A doughnut with a dot legend beneath it (admin "User Overview"). With no
 * data it draws a single neutral ring rather than an invisible chart.
 */
export function DoughnutCard({
  title,
  slices,
}: {
  title: string;
  slices: DoughnutSlice[];
}) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const isEmpty = total === 0;

  const data: ChartData<"doughnut"> = isEmpty
    ? {
        labels: ["No users yet"],
        datasets: [{ data: [1], backgroundColor: () => token("--track"), borderWidth: 0 }],
      }
    : {
        labels: slices.map((s) => s.label),
        datasets: [
          {
            data: slices.map((s) => s.value),
            backgroundColor: (ctx) => seriesColor(slices[ctx.dataIndex]?.color ?? "iris"),
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: { display: false },
      tooltip: { enabled: !isEmpty },
    },
  };

  return (
    <SectionCard title={title}>
      <div className="relative mb-5 h-[230px]">
        <Doughnut data={data} options={options} aria-label={`${title} chart`} role="img" />
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="font-display text-[26px] font-extrabold leading-none text-ink">
              {total}
            </p>
            <p className="mt-[6px] text-[12px] leading-none text-muted">Total users</p>
          </div>
        </div>
      </div>
      <ul className="flex flex-col gap-3">
        {slices.map((s) => (
          <li
            key={s.label}
            className="flex items-center gap-[10px] text-[13px] font-medium leading-none text-ink-soft"
          >
            <SeriesDot color={s.color} />
            {s.label} ({s.value})
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
