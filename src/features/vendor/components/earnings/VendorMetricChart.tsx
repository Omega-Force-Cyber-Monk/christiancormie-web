import { useId } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { followerData, qrScanData } from "@/features/vendor/data/earnings.data";
export function VendorMetricChart({ metric }: { metric: "scans" | "followers" }) {
  const id = useId();
  const scans = metric === "scans";
  const data = scans ? qrScanData : followerData;
  const color = scans ? "#25C9CB" : "#FFB800";
  const axis = (
    <XAxis
      dataKey="label"
      stroke="#B8C1D1"
      tick={{ fontSize: 12 }}
      axisLine={false}
      tickLine={false}
      interval={0}
    />
  );
  const grid = (
    <CartesianGrid stroke="#343C4C" strokeOpacity={0.35} strokeDasharray="3 3" />
  );
  const tooltip = (
    <Tooltip
      contentStyle={{
        background: "#121826",
        border: "1px solid #414651",
        borderRadius: 8,
        color: "#FAFAFA",
      }}
      labelStyle={{ color: "#FAFAFA" }}
      itemStyle={{ color }}
      cursor={scans ? { fill: "#FFFFFF08" } : { stroke: "#596174" }}
    />
  );
  return (
    <figure aria-labelledby={id} className="vendor-metric-chart">
      <figcaption id={id} className="sr-only">
        {scans ? "QR scans by day this week" : "Followers by week this month"}. Use
        arrow keys to explore values.
      </figcaption>
      <div className={scans ? "h-[112px] min-w-0" : "h-[90px] min-w-0"}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          {scans ? (
            <BarChart
              data={data}
              margin={{ top: 5, right: 0, left: -10, bottom: 0 }}
              accessibilityLayer
            >
              {grid}
              {axis}
              <YAxis
                domain={[0, 160]}
                ticks={[0, 80, 160]}
                width={42}
                tick={{ fontSize: 12 }}
                stroke="#B8C1D1"
                axisLine={false}
                tickLine={false}
              />
              {tooltip}
              <Bar
                dataKey="value"
                name="QR scans"
                fill={color}
                radius={[6, 6, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          ) : (
            <LineChart
              data={data}
              margin={{ top: 8, right: 8, left: -6, bottom: 0 }}
              accessibilityLayer
            >
              {grid}
              {axis}
              <YAxis
                domain={[900, 1300]}
                ticks={[900, 1100, 1300]}
                width={48}
                tick={{ fontSize: 12 }}
                stroke="#B8C1D1"
                axisLine={false}
                tickLine={false}
              />
              {tooltip}
              <Line
                dataKey="value"
                name="Followers"
                type="linear"
                stroke={color}
                strokeWidth={2.5}
                dot={{ r: 4, fill: color }}
                activeDot={{ r: 6 }}
                isAnimationActive={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>{scans ? "QR scans" : "Followers"} chart data</caption>
        <thead>
          <tr>
            <th scope="col">{scans ? "Day" : "Week"}</th>
            <th scope="col">Count</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.label}>
              <th scope="row">{point.label}</th>
              <td>{point.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
