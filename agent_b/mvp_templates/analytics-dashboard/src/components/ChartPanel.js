import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export default function ChartPanel({ title, data }) {
  return (
    <article className="panel">
      <header>
        <h2>{title}</h2>
        <span className="badge">Demo данные</span>
      </header>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="label" stroke="#6B7280" />
          <YAxis stroke="#6B7280" />
          <Tooltip cursor={{ stroke: '#6366F1', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#4F46E5"
            fillOpacity={1}
            fill="url(#colorTrend)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </article>
  );
}
