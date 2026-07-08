"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  Label,
} from "recharts";
import type { TrendPoint } from "@/lib/types";
import { compact, shortDate } from "@/lib/format";

export default function TrendChart({
  data,
  color,
  valueFormat = compact,
  height = 150,
}: {
  data: TrendPoint[];
  color: string;
  valueFormat?: (n: number) => string;
  height?: number;
}) {
  const id = `grad-${color.replace("#", "")}`;
  const last = data[data.length - 1];

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 18, right: 16, bottom: 4, left: 4 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={color} stopOpacity={0.5} />
              <stop offset="100%" stopColor={color} stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} axisLine={false} tickLine={false} dy={6} />
          <YAxis
            width={40}
            tickFormatter={valueFormat}
            axisLine={false}
            tickLine={false}
            tickCount={5}
          />
          <Tooltip
            cursor={{ stroke: color, strokeOpacity: 0.3 }}
            contentStyle={{
              background: "#0a0f1e",
              border: "1px solid rgba(120,150,255,0.28)",
              borderRadius: 10,
              fontSize: 12,
              color: "#e8edf7",
            }}
            labelFormatter={(l) => shortDate(String(l))}
            formatter={(v: any) => [valueFormat(Number(v)), ""]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={`url(#${id})`}
            strokeWidth={2.5}
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: color, stroke: "#0a0f1e", strokeWidth: 2 }}
            isAnimationActive={false}
          />
          {last && (
            <ReferenceDot x={last.date} y={last.value} r={4} fill={color} stroke="#0a0f1e" strokeWidth={2}>
              <Label
                value={valueFormat(last.value)}
                position="top"
                offset={10}
                style={{ fill: "#e8edf7", fontSize: 11, fontWeight: 700 }}
              />
            </ReferenceDot>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
