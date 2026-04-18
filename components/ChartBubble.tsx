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
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  LabelList,
} from 'recharts';

const COLORS = ['#00a884', '#53bdeb', '#f5c842', '#e88c5a', '#ff6b6b'];

function formatNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 10_000) return `${(value / 1_000).toFixed(0)}K`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  if (Math.abs(value) < 1 && value !== 0) return value.toFixed(2);
  return value.toLocaleString();
}

// ── Custom Tooltip ──
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-[#1a2730] border border-[#2a3942] rounded-lg shadow-xl px-3 py-2 min-w-[100px]">
      <p className="text-[11px] text-[#8696a0] mb-1 font-medium">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: entry.color }}
          />
          <span className="text-[11px] text-[#8696a0]">{entry.name}</span>
          <span className="text-[12px] text-[#e9edef] font-semibold ml-auto pl-3">
            {formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
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
    // Strip parentheticals from labels — agents sometimes add "(2009-2016)" etc.
    const cleanLabel = label.replace(/\s*\(.*?\)\s*/g, '').trim();
    const point: Record<string, string | number | undefined> = { name: cleanLabel };
    data.datasets.forEach((ds) => {
      const val = ds.data[i];
      point[ds.label] = val != null ? val : undefined;
    });
    return point;
  });

  // Smart Y-axis
  const allValues = data.datasets.flatMap((ds) => ds.data.filter((v): v is number => v != null && v !== undefined));
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);
  const range = dataMax - dataMin;
  // Only zoom for large values (>50) with tight range (<15%) — small counts always start from 0
  const shouldZoom = range > 0 && dataMin > 50 && range < dataMax * 0.15;
  const yDomain: [number | string, number | string] = shouldZoom
    ? [Math.floor(dataMin - range * 0.3), Math.ceil(dataMax + range * 0.2)]
    : [0, 'auto'];

  const tickStyle = { fill: '#8696a0', fontSize: 11 };
  const axisStyle = { stroke: '#2a3942' };
  const showLegend = data.datasets.length > 1;
  const accent = agentColor || COLORS[0];
  const singleDataset = data.datasets.length === 1;

  // Separate source from subtitle
  let subtitleText = data.subtitle || '';
  let sourceText = '';
  const sourceMatch = subtitleText.match(/[\s—–-]*(?:source|src|via|data|fonte|fuente|quelle):\s*(.+)$/i);
  if (sourceMatch) {
    sourceText = sourceMatch[1].trim();
    subtitleText = subtitleText.slice(0, sourceMatch.index).replace(/[\s—–-]+$/, '').trim();
  }

  // Auto-angle X labels when there are many
  const shouldAngleLabels = data.labels.length > 4 || data.labels.some((l) => l.length > 10);

  return (
    <div
      className="my-2 bg-[#111b21] rounded-xl overflow-hidden chart-appear"
      style={{ borderTop: `2px solid ${accent}` }}
    >
      {/* Title + Subtitle */}
      <div className="px-3 pt-3 pb-1">
        <p className="text-[13px] text-[#e9edef] font-semibold leading-tight">
          {data.title}
        </p>
        {subtitleText && (
          <p className="text-[10px] text-[#8696a0] mt-0.5 leading-snug">
            {subtitleText}
          </p>
        )}
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

      {/* Y-axis label — top-left, above chart (Nature/FT style) */}
      {data.yLabel && data.type !== 'radar' && (
        <div className="px-3 pt-1">
          <span className="text-[9px] text-[#667781] uppercase tracking-wider">{data.yLabel}</span>
        </div>
      )}

      {/* Chart */}
      <div className="px-1 pb-1" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          {data.type === 'bar' ? (
            <BarChart data={chartData} barCategoryGap="25%" margin={{ left: 5, right: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d36" vertical={false} />
              <XAxis
                dataKey="name"
                tick={tickStyle}
                axisLine={axisStyle}
                tickLine={false}
                angle={shouldAngleLabels ? -25 : 0}
                textAnchor={shouldAngleLabels ? 'end' : 'middle'}
                height={shouldAngleLabels ? 50 : 30}
              />
              <YAxis tick={tickStyle} axisLine={false} tickLine={false} tickFormatter={formatNumber} width={40} domain={yDomain} />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: '#ffffff08' }}
                trigger="hover"
              />
              {data.datasets.map((ds, i) => (
                <Bar
                  key={ds.label}
                  dataKey={ds.label}
                  fill={COLORS[i % COLORS.length]}
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {/* Value labels on top of bars */}
                  {singleDataset && (
                    <LabelList
                      dataKey={ds.label}
                      position="top"
                      formatter={(v) => formatNumber(Number(v))}
                      style={{ fill: '#8696a0', fontSize: 10, fontWeight: 500 }}
                    />
                  )}
                </Bar>
              ))}
            </BarChart>
          ) : data.type === 'line' ? (
            <LineChart data={chartData} margin={{ left: 5, right: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d36" vertical={false} />
              <XAxis
                dataKey="name"
                tick={tickStyle}
                axisLine={axisStyle}
                tickLine={false}
                angle={shouldAngleLabels ? -25 : 0}
                textAnchor={shouldAngleLabels ? 'end' : 'middle'}
                height={shouldAngleLabels ? 50 : 30}
              />
              <YAxis tick={tickStyle} axisLine={false} tickLine={false} tickFormatter={formatNumber} width={40} domain={yDomain} />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: '#ffffff20', strokeDasharray: '4 4' }}
                trigger="hover"
              />
              {data.datasets.map((ds, i) => (
                <Line
                  key={ds.label}
                  dataKey={ds.label}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2.5}
                  dot={{ fill: COLORS[i % COLORS.length], r: 3.5, strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#111b21', fill: COLORS[i % COLORS.length] }}
                  connectNulls={false}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              ))}
            </LineChart>
          ) : (
            <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="#1e2d36" />
              <PolarAngleAxis dataKey="name" tick={{ ...tickStyle, fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
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
                  dot={{ r: 3, fill: COLORS[i % COLORS.length], strokeWidth: 0 }}
                />
              ))}
            </RadarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* X-axis label — bottom-right (above footer) */}
      {data.xLabel && data.type !== 'radar' && (
        <div className="px-3 pb-1">
          <p className="text-[9px] text-[#667781] text-right uppercase tracking-wider">{data.xLabel}</p>
        </div>
      )}

      {/* Source footer — distinct strip */}
      {sourceText && (
        <div className="bg-[#0d1820] px-3 py-1.5 border-t border-[#1a2730] rounded-b-xl">
          <p className="text-[8px] text-[#556770] text-right">
            Source: {sourceText}
          </p>
        </div>
      )}
    </div>
  );
}
