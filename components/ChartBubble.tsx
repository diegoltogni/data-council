'use client';

import { useEffect } from 'react';
import { ChartData } from '@/lib/types';
import { events } from '@/lib/analytics';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from 'recharts';

const COLORS = ['#00a884', '#53bdeb', '#f5c842', '#e88c5a', '#ff6b6b'];

/** Format numbers for chart axes: 49703 → "49.7K", 0.695 → "0.70", 85 → "85" */
function formatNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 10_000) return `${(value / 1_000).toFixed(0)}K`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  if (Math.abs(value) < 1 && value !== 0) return value.toFixed(2);
  return value.toLocaleString();
}

interface Props {
  data: ChartData;
  agentColor?: string;
}

export function ChartBubble({ data, agentColor }: Props) {
  useEffect(() => {
    events.chartRendered(data.type);
  }, [data.type]);

  const chartData = data.labels.map((label, i) => {
    const point: Record<string, string | number> = { name: label };
    data.datasets.forEach((ds) => {
      point[ds.label] = ds.data[i] ?? 0;
    });
    return point;
  });

  const tooltipStyle = {
    contentStyle: {
      background: '#1a2730',
      border: '1px solid #2a3942',
      borderRadius: 10,
      color: '#e9edef',
      fontSize: 12,
      padding: '8px 12px',
    },
  };

  const tickStyle = { fill: '#8696a0', fontSize: 11 };
  const axisStyle = { stroke: '#2a3942' };
  const showLegend = data.datasets.length > 1;
  const legendStyle = { fontSize: 11, fill: '#8696a0' };
  const accent = agentColor || COLORS[0];

  return (
    <div
      className="my-2 bg-[#111b21] rounded-xl overflow-hidden chart-appear"
      style={{ borderTop: `2px solid ${accent}` }}
    >
      {/* Title */}
      <div className="px-3 pt-3 pb-1">
        <p className="text-[13px] text-[#e9edef] font-semibold leading-tight">
          {data.title}
        </p>
        {showLegend && (
          <div className="flex items-center gap-3 mt-1.5">
            {data.datasets.map((ds, i) => (
              <div key={ds.label} className="flex items-center gap-1">
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span className="text-[10px] text-[#8696a0]">{ds.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="px-2 pb-3" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          {data.type === 'bar' ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d36" vertical={false} />
              <XAxis dataKey="name" tick={tickStyle} axisLine={axisStyle} tickLine={false} />
              <YAxis tick={tickStyle} axisLine={false} tickLine={false} tickFormatter={formatNumber} width={40} />
              <Tooltip {...tooltipStyle} formatter={(value) => formatNumber(Number(value))} />
              {data.datasets.map((ds, i) => (
                <Bar
                  key={ds.label}
                  dataKey={ds.label}
                  fill={COLORS[i % COLORS.length]}
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              ))}
            </BarChart>
          ) : data.type === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d36" vertical={false} />
              <XAxis dataKey="name" tick={tickStyle} axisLine={axisStyle} tickLine={false} />
              <YAxis tick={tickStyle} axisLine={false} tickLine={false} tickFormatter={formatNumber} width={40} />
              <Tooltip {...tooltipStyle} formatter={(value) => formatNumber(Number(value))} />
              {data.datasets.map((ds, i) => (
                <Line
                  key={ds.label}
                  dataKey={ds.label}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2.5}
                  dot={{ fill: COLORS[i % COLORS.length], r: 3.5, strokeWidth: 0 }}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              ))}
            </LineChart>
          ) : (
            <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="#1e2d36" />
              <PolarAngleAxis dataKey="name" tick={tickStyle} />
              {data.datasets.map((ds, i) => (
                <Radar
                  key={ds.label}
                  dataKey={ds.label}
                  stroke={COLORS[i % COLORS.length]}
                  fill={COLORS[i % COLORS.length]}
                  fillOpacity={0.15}
                  strokeWidth={2}
                  isAnimationActive={true}
                  animationDuration={800}
                />
              ))}
            </RadarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
