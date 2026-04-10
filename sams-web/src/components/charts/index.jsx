import {
  BarChart as ReBar, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
  AreaChart, Area,
} from 'recharts'

const COLORS = ['#1a56db','#10b981','#f59e0b','#f43f5e','#8b5cf6','#0ea5e9']
const LO_COLORS = { Approaching:'#f59e0b', Meeting:'#1a56db', Exceeding:'#10b981' }

/* ─── Custom Tooltip ───────────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label, suffix = '%' }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-panel px-3 py-2">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color || p.fill }}>
          {p.name}: {p.value}{suffix}
        </p>
      ))}
    </div>
  )
}

/* ─── BarChartWidget ───────────────────────────────────────────────────── */
export function BarChartWidget({
  data, dataKey, xKey, color = '#1a56db', height = 220, suffix = '%', name = 'Value'
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReBar data={data} barSize={28}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
        <Tooltip content={<CustomTooltip suffix={suffix} />} cursor={{ fill: '#f8fafc' }} />
        <Bar dataKey={dataKey} name={name} fill={color} radius={[6, 6, 0, 0]} />
      </ReBar>
    </ResponsiveContainer>
  )
}

/* ─── MultiBarChart ────────────────────────────────────────────────────── */
export function MultiBarChart({ data, bars, xKey, height = 220 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReBar data={data} barSize={18}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {bars.map((b, i) => (
          <Bar key={b.key} dataKey={b.key} name={b.label} fill={COLORS[i]} radius={[4, 4, 0, 0]} />
        ))}
      </ReBar>
    </ResponsiveContainer>
  )
}

/* ─── DonutChart ───────────────────────────────────────────────────────── */
export function DonutChart({ data, height = 200 }) {
  // data: [{name, value, color?}]
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => [v, '']} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

/* ─── LineChartWidget ──────────────────────────────────────────────────── */
export function LineChartWidget({ data, dataKey, xKey, color = '#1a56db', height = 200, suffix = '%' }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.15} />
            <stop offset="95%" stopColor={color} stopOpacity={0}    />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={['auto','auto']} />
        <Tooltip content={<CustomTooltip suffix={suffix} />} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill="url(#areaGrad)" dot={{ r: 3, fill: color }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/* ─── LO Donut Preset ──────────────────────────────────────────────────── */
export function LODonut({ approaching, meeting, exceeding, height = 220 }) {
  const data = [
    { name: 'Approaching', value: approaching, color: '#f59e0b' },
    { name: 'Meeting',     value: meeting,     color: '#1a56db' },
    { name: 'Exceeding',   value: exceeding,   color: '#10b981' },
  ]
  return <DonutChart data={data} height={height} />
}
