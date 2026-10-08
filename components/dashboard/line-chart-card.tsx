"use client";

import { useState } from "react";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type ScriptableContext,
} from "chart.js";
import { Line } from "react-chartjs-2";

import { BarChartIcon, TrendIcon } from "@/components/ui/icons";
import { RangeTabs } from "./range-tabs";
import { SectionCard } from "./section-card";
import {
  bodyFont,
  seriesColor,
  token,
  withAlpha,
  type SeriesColor,
} from "./chart-theme";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
);

export type ChartRange = "year" | "month" | "week";

export type ChartSeries = { label: string; color: SeriesColor };

export type RangeData = { labels: string[]; values: number[][] };

/**
 * Icons are chosen by key rather than passed as components: this is a Client
 * Component, and a component function cannot cross the server → client prop
 * boundary (it is not serialisable), which would make SSR throw.
 */
const CHART_ICONS = { bars: BarChartIcon, trend: TrendIcon } as const;
export type ChartIconKey = keyof typeof CHART_ICONS;

const RANGES: ReadonlyArray<{ value: ChartRange; label: string }> = [
  { value: "year", label: "This Year" },
  { value: "month", label: "This Month" },
  { value: "week", label: "This Week" },
];

/**
 * A line chart in a section card with This Year / Month / Week tabs, styled
 * per DESIGN_SYSTEM.md §8 "Charts": 2.5px strokes, tension .4, points only on
 * hover, dashed horizontal grid, muted Instrument Sans ticks, and a fading
 * area fill under each series.
 *
 * When every value is zero the axis still renders (so the card keeps its
 * shape) with a short caption explaining why it is flat.
 */
export function LineChartCard({
  title,
  icon,
  series,
  data,
  emptyCaption,
  valuePrefix = "$",
}: {
  title: string;
  icon: ChartIconKey;
  series: ChartSeries[];
  data: Record<ChartRange, RangeData>;
  emptyCaption: string;
  valuePrefix?: string;
}) {
  const [range, setRange] = useState<ChartRange>("year");
  const current = data[range];
  const isEmpty = current.values.every((row) => row.every((v) => v === 0));

  const chartData: ChartData<"line"> = {
    labels: current.labels,
    datasets: series.map((s, index) => ({
      label: s.label,
      data: current.values[index] ?? [],
      borderColor: () => seriesColor(s.color),
      pointHoverBackgroundColor: () => seriesColor(s.color),
      backgroundColor: (ctx: ScriptableContext<"line">) => {
        const { chartArea, ctx: canvas } = ctx.chart;
        const color = seriesColor(s.color);
        if (!chartArea) return withAlpha(color, 0);
        const gradient = canvas.createLinearGradient(
          0,
          chartArea.top,
          0,
          chartArea.bottom,
        );
        // The primary series gets the design's stronger wash.
        gradient.addColorStop(0, withAlpha(color, index === 0 ? 0.22 : 0.1));
        gradient.addColorStop(1, withAlpha(color, 0));
        return gradient;
      },
      borderWidth: 2.5,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 5,
    })),
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    // Nothing to animate on a flat series; animating it only flickers.
    animation: isEmpty ? false : undefined,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (item) =>
            ` ${item.dataset.label}: ${valuePrefix}${Number(item.raw).toLocaleString("en-US")}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        // Keep a readable axis when there is nothing to plot yet.
        suggestedMax: isEmpty ? 100 : undefined,
        ticks: {
          callback: (value) => `${valuePrefix}${Number(value).toLocaleString("en-US")}`,
          color: () => token("--muted-soft"),
          font: () => ({ family: bodyFont(), size: 11 }),
        },
        grid: { color: () => token("--line-soft") },
        border: { display: false, dash: [4, 4] },
      },
      x: {
        ticks: {
          // Skip labels on narrow cards instead of rotating them diagonally.
          maxRotation: 0,
          autoSkip: true,
          color: () => token("--muted-soft"),
          font: () => ({ family: bodyFont(), size: 11 }),
        },
        grid: { display: false },
        border: { display: false },
      },
    },
  };

  return (
    <SectionCard
      title={title}
      icon={CHART_ICONS[icon]}
      action={
        <RangeTabs
          options={RANGES}
          value={range}
          onChange={setRange}
          label={`${title} range`}
        />
      }
    >
      <ul className="mb-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {series.map((s) => (
          <li
            key={s.label}
            className="flex items-center gap-2 text-[12.5px] font-medium leading-none text-ink-soft"
          >
            <SeriesDot color={s.color} />
            {s.label}
          </li>
        ))}
      </ul>

      <div className="relative h-[260px] sm:h-[300px]">
        <Line
          data={chartData}
          options={options}
          aria-label={`${title} chart`}
          role="img"
        />
        {isEmpty ? (
          // Inset past the y-axis labels, on a surface pill so gridlines never
          // run through the text when it wraps on a narrow card.
          <div className="pointer-events-none absolute inset-x-0 top-[38%] flex justify-center pl-12 pr-4">
            <p className="rounded-full bg-surface px-3 py-1 text-center text-[13px] leading-[1.4] text-muted">
              {emptyCaption}
            </p>
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}

const DOT: Record<SeriesColor, string> = {
  iris: "bg-iris-500",
  success: "bg-success-solid",
  warning: "bg-warning-solid",
  info: "bg-info-solid",
  deep: "bg-iris-900",
};

export function SeriesDot({ color }: { color: SeriesColor }) {
  return <span className={`size-[11px] flex-none rounded-full ${DOT[color]}`} />;
}
