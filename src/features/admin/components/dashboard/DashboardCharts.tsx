import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AdminDashboardEmpty } from "@/features/admin/components/dashboard/AdminDashboardStates";

export type RevenueDataPoint = {
  name: string;
  revenue: number;
};

export type BookingDataPoint = {
  name: string;
  bookings: number;
};

const tooltipStyle = {
  backgroundColor: "#1B2233",
  borderColor: "rgba(255, 255, 255, 0.1)",
  borderRadius: "12px",
  color: "#FFFFFF",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
  fontSize: "13px",
  fontFamily: "Inter",
};

const labelStyle = {
  color: "#B8C1D1",
  fontWeight: 500,
  marginBottom: "4px",
};

const axisTick = {
  fill: "#B8C1D1",
  fontSize: 12,
  fontFamily: "Inter",
  fontWeight: 400,
};

export function RevenueTrendChart({ data }: { data?: RevenueDataPoint[] }) {
  const chartData = data ?? [];

  return (
    <div className="flex h-[402px] w-full flex-col justify-between rounded-2xl border border-white/10 bg-[#1E293B]/40 p-6 font-inter transition-colors duration-200 hover:border-white/20">
      <div className="mb-2">
        <h2 className="text-lg font-semibold tracking-normal text-white">
          Revenue Trend
        </h2>
      </div>

      <div className="min-h-0 w-full flex-1">
        {chartData.length === 0 ? (
          <AdminDashboardEmpty
            message="Revenue chart data is not available yet."
            title="No revenue trend found"
          />
        ) : (
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="revenueGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B4A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF6B4A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                horizontal
                stroke="rgba(148, 163, 184, 0.1)"
                strokeDasharray="3 3"
                vertical
              />
              <XAxis
                axisLine={{ stroke: "rgba(184, 193, 209, 0.3)" }}
                dataKey="name"
                dy={8}
                stroke="transparent"
                tick={axisTick}
                tickLine={false}
              />
              <YAxis
                axisLine={{ stroke: "rgba(184, 193, 209, 0.3)" }}
                domain={[0, 80000]}
                dx={-8}
                stroke="transparent"
                tick={axisTick}
                tickLine={false}
                ticks={[0, 20000, 40000, 60000, 80000]}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]}
                itemStyle={{ color: "#FF5733" }}
                labelStyle={labelStyle}
              />
              <Area
                activeDot={{
                  r: 5,
                  fill: "#FF5733",
                  stroke: "#121826",
                  strokeWidth: 2,
                }}
                dataKey="revenue"
                dot={false}
                fill="url(#revenueGrad)"
                fillOpacity={1}
                stroke="#FF5733"
                strokeWidth={2}
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export function MonthlyBookingsChart({ data }: { data?: BookingDataPoint[] }) {
  const chartData = data ?? [];

  return (
    <div className="flex h-[402px] w-full flex-col justify-between rounded-2xl border border-white/10 bg-[#1E293B]/40 p-6 font-inter transition-colors duration-200 hover:border-white/20">
      <div className="mb-2">
        <h2 className="text-lg font-semibold tracking-normal text-white">
          Monthly Bookings
        </h2>
      </div>

      <div className="min-h-0 w-full flex-1">
        {chartData.length === 0 ? (
          <AdminDashboardEmpty
            message="Monthly booking chart data is not available yet."
            title="No booking chart found"
          />
        ) : (
          <ResponsiveContainer height="100%" width="100%">
            <BarChart
              barGap={0}
              data={chartData}
              margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
            >
              <CartesianGrid
                horizontal
                stroke="rgba(148, 163, 184, 0.1)"
                strokeDasharray="3 3"
                vertical
              />
              <XAxis
                axisLine={{ stroke: "rgba(184, 193, 209, 0.3)" }}
                dataKey="name"
                dy={8}
                stroke="transparent"
                tick={axisTick}
                tickLine={false}
              />
              <YAxis
                axisLine={{ stroke: "rgba(184, 193, 209, 0.3)" }}
                domain={[0, 200]}
                dx={-8}
                stroke="transparent"
                tick={axisTick}
                tickLine={false}
                ticks={[0, 50, 100, 150, 200]}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [value, "Bookings"]}
                itemStyle={{ color: "#2DD4BF" }}
                labelStyle={labelStyle}
              />
              <Bar
                dataKey="bookings"
                fill="#2DD4BF"
                maxBarSize={48}
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
