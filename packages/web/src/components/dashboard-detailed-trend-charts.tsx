'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type TrendPoint = {
  date: string;
  orders: number;
  revenue: number;
};

type ChartRow = TrendPoint & {
  label: string;
  dateFull: string;
};

function buildRows(data: TrendPoint[]): ChartRow[] {
  if (data.length === 0) return [];
  const first = new Date(data[0].date + 'T12:00:00');
  const last = new Date(data[data.length - 1].date + 'T12:00:00');
  const spanDays = Math.max(0, (last.getTime() - first.getTime()) / 86400000);
  const longRange = spanDays > 120;

  return data.map((d) => {
    const dt = new Date(d.date + 'T12:00:00');
    return {
      ...d,
      label: longRange
        ? dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
        : dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      dateFull: dt.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    };
  });
}

function formatRupee(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatRupeeFull(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const axisTick = { fill: '#71717a', fontSize: 11 };
const gridStyle = { stroke: '#e4e4e7', strokeDasharray: '3 3' };

function OrdersTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartRow }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-xs shadow-lg">
      <p className="font-semibold text-zinc-900">{row.dateFull}</p>
      <p className="mt-1.5 tabular-nums text-indigo-700">
        <span className="font-medium">{row.orders}</span> orders registered
      </p>
    </div>
  );
}

function RevenueTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartRow }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-xs shadow-lg">
      <p className="font-semibold text-zinc-900">{row.dateFull}</p>
      <p className="mt-1.5 tabular-nums text-teal-800">
        Collected <span className="font-semibold">{formatRupeeFull(row.revenue)}</span>
      </p>
    </div>
  );
}

const DEFAULT_CHART_H = 300;
const DEFAULT_BRUSH_H = 28;
const showBrush = (n: number) => n > 18;

export function OrdersDailyBarChart({
  data,
  chartHeight = DEFAULT_CHART_H,
  brushHeight = DEFAULT_BRUSH_H,
}: {
  data: TrendPoint[];
  /** Shorter height helps fit KPIs + charts in one viewport */
  chartHeight?: number;
  brushHeight?: number;
}) {
  const rows = useMemo(() => buildRows(data), [data]);
  const avgOrders = useMemo(() => {
    if (!rows.length) return 0;
    return rows.reduce((s, r) => s + r.orders, 0) / rows.length;
  }, [rows]);
  const maxO = useMemo(() => Math.max(...rows.map((r) => r.orders), 1), [rows]);
  const yMax = Math.max(5, Math.ceil(maxO * 1.12));
  const tight = chartHeight < 240;
  const totalH = chartHeight + (showBrush(rows.length) ? brushHeight + 6 : 0);

  return (
    <div className="w-full touch-manipulation [contain:layout]" style={{ height: totalH }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          margin={
            tight
              ? { top: 4, right: 6, left: 0, bottom: 0 }
              : { top: 12, right: 12, left: 4, bottom: 4 }
          }
        >
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ ...axisTick, fontSize: tight ? 10 : 11 }}
            tickLine={false}
            axisLine={{ stroke: '#d4d4d8' }}
            interval="preserveStartEnd"
            minTickGap={tight ? 12 : 16}
            angle={rows.length > 24 ? -32 : 0}
            textAnchor={rows.length > 24 ? 'end' : 'middle'}
            height={rows.length > 24 ? (tight ? 44 : 52) : tight ? 22 : 28}
          />
          <YAxis
            tick={{ ...axisTick, fontSize: tight ? 10 : 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            domain={[0, yMax]}
            width={tight ? 30 : 36}
            label={{
              value: 'Orders',
              angle: -90,
              position: 'insideLeft',
              fill: '#71717a',
              fontSize: tight ? 10 : 11,
            }}
          />
          <Tooltip content={<OrdersTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }} />
          <Legend
            wrapperStyle={{ fontSize: tight ? 10 : 12, paddingTop: tight ? 4 : 8 }}
            formatter={(value) => <span className="text-zinc-600">{value}</span>}
          />
          <ReferenceLine
            y={avgOrders}
            stroke="#a78bfa"
            strokeDasharray="5 5"
            strokeWidth={1.5}
            label={{
              value: `Avg ${avgOrders.toFixed(1)}`,
              position: 'insideTopRight',
              fill: '#7c3aed',
              fontSize: tight ? 9 : 11,
            }}
          />
          <Bar
            name="Orders"
            dataKey="orders"
            fill="#4f46e5"
            radius={[4, 4, 0, 0]}
            maxBarSize={tight ? 36 : 48}
          />
          {showBrush(rows.length) ? (
            <Brush
              dataKey="label"
              height={brushHeight}
              stroke="#a1a1aa"
              fill="#fafafa"
              travellerWidth={8}
            />
          ) : null}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RevenueDailyAreaChart({
  data,
  chartHeight = DEFAULT_CHART_H,
  brushHeight = DEFAULT_BRUSH_H,
}: {
  data: TrendPoint[];
  chartHeight?: number;
  brushHeight?: number;
}) {
  const rows = useMemo(() => buildRows(data), [data]);
  const avgRev = useMemo(() => {
    if (!rows.length) return 0;
    return rows.reduce((s, r) => s + r.revenue, 0) / rows.length;
  }, [rows]);
  const tight = chartHeight < 240;
  const totalH = chartHeight + (showBrush(rows.length) ? brushHeight + 6 : 0);

  return (
    <div className="w-full touch-manipulation [contain:layout]" style={{ height: totalH }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={rows}
          margin={
            tight
              ? { top: 4, right: 6, left: 0, bottom: 0 }
              : { top: 12, right: 12, left: 4, bottom: 4 }
          }
        >
          <defs>
            <linearGradient id="dashboardRevenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d9488" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#0d9488" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridStyle} />
          <XAxis
            dataKey="label"
            tick={{ ...axisTick, fontSize: tight ? 10 : 11 }}
            tickLine={false}
            axisLine={{ stroke: '#d4d4d8' }}
            interval="preserveStartEnd"
            minTickGap={tight ? 12 : 16}
            angle={rows.length > 24 ? -32 : 0}
            textAnchor={rows.length > 24 ? 'end' : 'middle'}
            height={rows.length > 24 ? (tight ? 44 : 52) : tight ? 22 : 28}
          />
          <YAxis
            tick={{ ...axisTick, fontSize: tight ? 10 : 11 }}
            tickLine={false}
            axisLine={false}
            width={tight ? 38 : 44}
            tickFormatter={(v) => (v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
            label={{
              value: '₹ collected',
              angle: -90,
              position: 'insideLeft',
              fill: '#71717a',
              fontSize: tight ? 10 : 11,
            }}
          />
          <Tooltip content={<RevenueTooltip />} cursor={{ stroke: '#0f766e', strokeWidth: 1 }} />
          <Legend
            wrapperStyle={{ fontSize: tight ? 10 : 12, paddingTop: tight ? 4 : 8 }}
            formatter={(value) => <span className="text-zinc-600">{value}</span>}
          />
          <ReferenceLine
            y={avgRev}
            stroke="#f59e0b"
            strokeDasharray="5 5"
            strokeWidth={1.5}
            label={{
              value: `Avg ${formatRupee(avgRev)}`,
              position: 'insideTopRight',
              fill: '#b45309',
              fontSize: tight ? 9 : 11,
            }}
          />
          <Area
            type="monotone"
            name="Daily collection"
            dataKey="revenue"
            stroke="#0f766e"
            strokeWidth={tight ? 1.5 : 2}
            fill="url(#dashboardRevenueFill)"
            dot={rows.length <= 40 ? { r: tight ? 1.5 : 2, fill: '#0f766e', strokeWidth: 0 } : false}
            activeDot={{ r: 4, fill: '#0d9488', stroke: '#fff', strokeWidth: 2 }}
          />
          {showBrush(rows.length) ? (
            <Brush
              dataKey="label"
              height={brushHeight}
              stroke="#a1a1aa"
              fill="#fafafa"
              travellerWidth={8}
            />
          ) : null}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
