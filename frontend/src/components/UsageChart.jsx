import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

export default function UsageChart({ data, unit }) {
  // Format the date for the X-axis (Mon, Tue, etc.)
  const formattedData = data.map(d => ({
    ...d,
    dayLabel: format(parseISO(d.date), 'EEE'), // Mon, Tue...
    dateLabel: format(parseISO(d.date), 'MMM d, yyyy')
  }));

  // Limit to last 7 days for the chart to match the requirement "Mon-Sun"
  const recentData = formattedData.slice(-7);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ backgroundColor: '#fff', padding: '8px 12px', border: '1px solid #e6e1e0', fontSize: '14px' }}>
          <p className="label-caps" style={{ margin: 0, marginBottom: '4px', color: '#6a6158' }}>{data.dateLabel}</p>
          <p className="mono" style={{ margin: 0 }}>{payload[0].value} {unit}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: '240px' }}>
      <ResponsiveContainer>
        <LineChart data={recentData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6e1e0" />
          <XAxis 
            dataKey="dayLabel" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6a6158', fontSize: 12, fontFamily: 'Public Sans' }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6a6158', fontSize: 12, fontFamily: 'IBM Plex Mono' }}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="quantity_used" 
            stroke="#1f1b16" 
            strokeWidth={2} 
            dot={{ fill: '#1f1b16', r: 3 }} 
            activeDot={{ r: 5 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
