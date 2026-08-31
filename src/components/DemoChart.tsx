"use client";

import { useMemo, useState } from "react";
import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { motion } from "motion/react";

/** Sanity-check component: proves visx (data + scales) and Motion (animation)
 * work together under Next.js App Router client-side rendering. */
const data = [
  { label: "D3", value: 40 },
  { label: "visx", value: 85 },
  { label: "Motion", value: 70 },
  { label: "Next.js", value: 95 },
];

const width = 400;
const height = 250;
const margin = { top: 20, bottom: 30, left: 30, right: 20 };

export default function DemoChart() {
  const [hovered, setHovered] = useState<string | null>(null);

  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const xScale = useMemo(
    () =>
      scaleBand<string>({
        range: [0, xMax],
        domain: data.map((d) => d.label),
        padding: 0.3,
      }),
    [xMax],
  );

  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        range: [yMax, 0],
        domain: [0, 100],
      }),
    [yMax],
  );

  return (
    <svg width={width} height={height}>
      <Group left={margin.left} top={margin.top}>
        {data.map((d) => {
          const barWidth = xScale.bandwidth();
          const barHeight = yMax - (yScale(d.value) ?? 0);
          const barX = xScale(d.label) ?? 0;

          return (
            <motion.rect
              key={d.label}
              x={barX}
              width={barWidth}
              fill={hovered === d.label ? "#f97316" : "#6366f1"}
              onMouseEnter={() => setHovered(d.label)}
              onMouseLeave={() => setHovered(null)}
              initial={{ height: 0, y: yMax }}
              animate={{ height: barHeight, y: yMax - barHeight }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          );
        })}
      </Group>
    </svg>
  );
}
