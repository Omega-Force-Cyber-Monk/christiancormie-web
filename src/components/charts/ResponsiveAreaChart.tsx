import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartDatum = {
  label: string;
  value: number;
};

type ResponsiveAreaChartProps = {
  data: ChartDatum[];
};

export function ResponsiveAreaChart({ data }: ResponsiveAreaChartProps) {
  return (
    <div
      aria-label="Dashboard activity trend chart"
      className="h-72 min-w-0"
      role="img"
    >
      <ResponsiveContainer height="100%" width="100%">
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
          <CartesianGrid stroke="#d9dee7" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            minTickGap={16}
            stroke="#687586"
            tick={{ fontSize: 12 }}
          />
          <YAxis stroke="#687586" tick={{ fontSize: 12 }} width={36} />
          <Tooltip />
          <Area
            dataKey="value"
            fill="#0f766e"
            fillOpacity={0.16}
            stroke="#0f766e"
            strokeWidth={2}
            type="monotone"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
