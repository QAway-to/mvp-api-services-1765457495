import {
  ResponsiveContainer,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  CartesianGrid,
} from "recharts";

export function DeliverabilityChart({ data }) {
  return (
    <div className="card">
      <header className="card-header">
        <div>
          <h2>Доставляемость и открытие</h2>
          <p>Контроль ключевых метрик: доставлено, Open Rate, Click Rate.</p>
        </div>
      </header>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="4 4" stroke="#222" />
            <XAxis dataKey="label" stroke="#888" />
            <YAxis stroke="#888" domain={[0, 100]} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="delivered"
              stroke="#4caf50"
              strokeWidth={2}
              name="Delivered %"
            />
            <Line
              type="monotone"
              dataKey="open_rate"
              stroke="#2196f3"
              strokeWidth={2}
              name="Open Rate %"
            />
            <Line
              type="monotone"
              dataKey="click_rate"
              stroke="#ff9800"
              strokeWidth={2}
              name="CTR %"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <footer className="card-footer">
        <small>
          В демо данные синтетические. Реальный сервис будет забирать их из
          SendGrid Events API и аналитики Postgres/BigQuery.
        </small>
      </footer>
    </div>
  );
}

