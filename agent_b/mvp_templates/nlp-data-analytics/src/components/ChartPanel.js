import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  PieChart,
  ScatterChart,
  Line,
  Bar,
  Pie,
  Scatter,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#06b6d4'];

export default function ChartPanel({ data }) {
  if (!data || !data.data || data.data.length === 0) {
    return <p style={{ color: '#94a3b8' }}>Нет данных для графика</p>;
  }

  const chartType = data.type || 'bar';

  // Pie chart
  if (chartType === 'pie') {
    return (
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data.data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey={data.yKey || 'value'}
            >
              {data.data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#f8fafc'
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Scatter chart
  if (chartType === 'scatter') {
    return (
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <ScatterChart data={data.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              type="number"
              dataKey={data.xKey || 'x'} 
              stroke="#94a3b8"
              style={{ fontSize: 12 }}
            />
            <YAxis 
              type="number"
              dataKey={data.yKey || 'y'}
              stroke="#94a3b8"
              style={{ fontSize: 12 }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#f8fafc'
              }}
            />
            <Scatter 
              dataKey={data.yKey || 'y'} 
              fill="#6366f1"
              fillOpacity={0.6}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Line and Bar charts
  const ChartComponent = chartType === 'line' ? LineChart : BarChart;
  const DataComponent = chartType === 'line' ? Line : Bar;

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <ChartComponent data={data.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey={data.xKey || 'date'} 
            stroke="#94a3b8"
            style={{ fontSize: 12 }}
          />
          <YAxis 
            stroke="#94a3b8"
            style={{ fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              color: '#f8fafc'
            }}
          />
          <Legend />
          <DataComponent
            type="monotone"
            dataKey={data.yKey || 'value'}
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.6}
          />
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}

