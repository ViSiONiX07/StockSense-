import React, { useEffect, useState } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { API_URL } from '../config';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  PieChart, 
  Pie, 
  LineChart, 
  Line, 
  Legend 
} from 'recharts';

export default function Insights() {
  const { t, lang } = useTranslation();
  const [items, setItems] = useState([]);
  const [usageHistory, setUsageHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/items`).then(res => res.json()),
      fetch(`${API_URL}/api/usage-history`).then(res => res.json())
    ])
    .then(([itemsData, historyData]) => {
      setItems(itemsData);
      setUsageHistory(historyData);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-container-padding text-body-lg">{t('loading')}</div>;

  // 1. Total Inventory Valuation
  const totalValue = items.reduce((acc, curr) => acc + (curr.current_stock * (curr.price || 0)), 0);

  // 2. Top Movers (Fastest: sorted descending by daily usage)
  const fastestMovers = [...items]
    .filter(i => i.avgDailyUsage > 0)
    .sort((a, b) => b.avgDailyUsage - a.avgDailyUsage)
    .slice(0, 3);

  // 3. Top Movers (Slowest: sorted ascending by daily usage, excluding 0)
  const slowestMovers = [...items]
    .filter(i => i.avgDailyUsage > 0)
    .sort((a, b) => a.avgDailyUsage - b.avgDailyUsage)
    .slice(0, 3);

  // 4. Category Breakdown Data
  const categoriesList = ['Vegetables/Produce', 'Snacks', 'Grains & Pulses', 'Dairy', 'Beverages', 'Pantry'];
  const categoryChartData = categoriesList.map(cat => {
    const catItems = items.filter(i => i.category === cat);
    const val = catItems.reduce((acc, curr) => acc + (curr.current_stock * (curr.price || 0)), 0);
    return {
      name: cat,
      value: Math.round(val)
    };
  });

  // 5. Summary Stats
  const totalTracked = items.length;
  const criticalCount = items.filter(i => i.status === 'Critical').length;
  const lowSupplyCount = items.filter(i => i.status === 'Low Supply').length;
  const inStockCount = items.filter(i => i.status === 'In Stock').length;
  const wasteRiskCount = items.filter(i => i.wasteRisk).length;

  // Pie chart stock health data
  const stockHealthData = [
    { name: 'Critical', value: criticalCount, color: '#D25D47' },
    { name: 'Low Supply', value: lowSupplyCount, color: '#C29047' },
    { name: 'In Stock', value: inStockCount, color: '#7C8F76' },
  ].filter(d => d.value > 0);

  // Waste risk breakdown data
  const wasteBreakdownData = items
    .filter(i => i.wasteRisk && i.projectedLoss > 0)
    .map(i => ({
      name: i.name,
      loss: Math.round(i.projectedLoss || 0)
    }));

  // Historical usage trend over time
  const usageTrendData = usageHistory.map(log => {
    // format yyyy-mm-dd to mm/dd for clean axis ticks
    const parts = log.date ? log.date.split('-') : [];
    const dateLabel = parts.length >= 3 ? `${parts[1]}/${parts[2]}` : (log.date || '');
    return {
      date: dateLabel,
      usage: log.total_used
    };
  });

  const barColors = ['#C1521A', '#D9A066', '#4C6E4A', '#B5432B', '#8C9A86', '#A08070'];

  return (
    <main className="max-w-[1440px] mx-auto px-container-padding py-10 pb-32 bg-background text-on-surface">
      {/* Page Title */}
      <section className="mb-10">
        <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface leading-tight font-semibold">
          {t('insights')}
        </h1>
      </section>

      {/* Main Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-grid-gutter items-stretch">
        
        {/* Card 1: Valuation */}
        <section className="md:col-span-4 bg-surface border border-outline-variant rounded-xl p-6 md:p-8 flex flex-col justify-between">
          <div>
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block mb-4">{t('totalVal')}</span>
            <div className="font-data-tabular text-display-lg text-primary font-bold mb-2">
              {t('currency')}{totalValue.toLocaleString(lang === 'en' ? 'en-IN' : 'hi-IN')}
            </div>
            <p className="font-body-md text-on-surface-variant leading-relaxed opacity-75">
              Valuation compiled across {totalTracked} active inventory entries.
            </p>
          </div>
        </section>

        {/* Card 2: Summary Stats */}
        <section className="md:col-span-4 bg-surface border border-outline-variant rounded-xl p-6 md:p-8">
          <h2 className="font-display-sm text-[16px] text-primary uppercase font-label-caps tracking-wider mb-6">{t('summary')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] text-on-surface-variant block uppercase tracking-widest mb-1">{t('tracked')}</span>
              <span className="font-data-tabular text-headline-lg font-bold">{totalTracked}</span>
            </div>
            <div>
              <span className="text-[10px] text-on-surface-variant block uppercase tracking-widest mb-1">Waste Risk Items</span>
              <span className="font-data-tabular text-headline-lg font-bold text-plum">{wasteRiskCount}</span>
            </div>
            <div className="col-span-2 border-t border-outline-variant pt-4 flex gap-4 justify-between">
              <div>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1">Critical</span>
                <span className="font-data-tabular text-body-lg font-bold text-terracotta">{criticalCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1">Low Supply</span>
                <span className="font-data-tabular text-body-lg font-bold text-ochre">{lowSupplyCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1">In Stock</span>
                <span className="font-data-tabular text-body-lg font-bold text-sage">{inStockCount}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Card 3: Stock Health Donut */}
        <section className="md:col-span-4 bg-surface border border-outline-variant rounded-xl p-6 md:p-8 flex flex-col justify-between">
          <h2 className="font-display-sm text-[16px] text-primary uppercase font-label-caps tracking-wider mb-4">Stock Health Proportions</h2>
          <div className="w-full h-[120px] flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockHealthData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {stockHealthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#FAF6F0', borderColor: '#E8DFD3', fontFamily: 'Public Sans', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-[10px] text-on-surface-variant font-label-caps tracking-wider">
            {stockHealthData.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: d.color }}></span>
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </section>

        {/* Card 4: Top Movers */}
        <section className="md:col-span-6 bg-surface border border-outline-variant rounded-xl p-6 md:p-8 flex flex-col justify-between min-h-[360px]">
          <div>
            <h2 className="font-display-sm text-[20px] text-primary font-medium mb-6">{t('topMovers')}</h2>
            
            {/* Fastest Movers */}
            <div className="mb-6">
              <span className="font-label-caps text-xs tracking-wider text-sage font-bold block mb-3 uppercase">{t('fastest')}</span>
              <ul className="space-y-3">
                {fastestMovers.map((item, idx) => (
                  <li key={item.id} className="flex justify-between items-center text-body-md border-b border-outline-variant pb-2">
                    <span className="font-medium">{idx + 1}. {item.name}</span>
                    <span className="font-data-tabular text-on-surface-variant">{item.avgDailyUsage} {item.unit}/day</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Slowest Movers */}
            <div>
              <span className="font-label-caps text-xs tracking-wider text-ochre font-bold block mb-3 uppercase">{t('slowest')}</span>
              <ul className="space-y-3">
                {slowestMovers.map((item, idx) => (
                  <li key={item.id} className="flex justify-between items-center text-body-md border-b border-outline-variant pb-2">
                    <span className="font-medium">{idx + 1}. {item.name}</span>
                    <span className="font-data-tabular text-on-surface-variant">{item.avgDailyUsage} {item.unit}/day</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Card 5: Category Breakdown Bar Chart */}
        <section className="md:col-span-6 bg-surface border border-outline-variant rounded-xl p-6 md:p-8 min-h-[360px]">
          <h2 className="font-display-sm text-[20px] text-primary font-medium mb-6">{t('catBreakdown')} ({t('currency')})</h2>
          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#8C9A86', fontSize: 10 }}
                  tickFormatter={v => v.split('/')[0]} 
                />
                <YAxis tick={{ fill: '#8C9A86', fontSize: 10 }} />
                <Tooltip 
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Valuation']}
                  contentStyle={{ backgroundColor: '#FAF6F0', borderColor: '#E8DFD3', fontFamily: 'Public Sans' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Card 6: Usage Trend Over Time (Line Chart) */}
        <section className="md:col-span-8 bg-surface border border-outline-variant rounded-xl p-6 md:p-8 min-h-[360px]">
          <h2 className="font-display-sm text-[20px] text-primary font-medium mb-2">Aggregate Daily Usage (14 Days)</h2>
          <p className="text-body-sm text-on-surface-variant mb-6">Historical sales and consumption trend tracked across all units.</p>
          <div className="w-full h-[260px]">
            {usageTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usageTrendData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                  <XAxis dataKey="date" tick={{ fill: '#8C9A86', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#8C9A86', fontSize: 10 }} />
                  <Tooltip 
                    formatter={(value) => [`${value} units`, 'Usage']}
                    contentStyle={{ backgroundColor: '#FAF6F0', borderColor: '#E8DFD3', fontFamily: 'Public Sans' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="usage" 
                    stroke="#D25D47" 
                    strokeWidth={2.5} 
                    dot={{ fill: '#D25D47', r: 3 }} 
                    activeDot={{ r: 5 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-on-surface-variant italic">
                No historical usage data recorded yet.
              </div>
            )}
          </div>
        </section>

        {/* Card 7: Waste Risk Breakdown Bar Chart */}
        <section className="md:col-span-4 bg-surface border border-outline-variant rounded-xl p-6 md:p-8 min-h-[360px] flex flex-col justify-between">
          <div>
            <h2 className="font-display-sm text-[20px] text-primary font-medium mb-2">Waste Loss Valuation</h2>
            <p className="text-body-sm text-on-surface-variant mb-6">Projected waste impact (₹) by item.</p>
          </div>
          <div className="w-full h-[200px] flex-1">
            {wasteBreakdownData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wasteBreakdownData} layout="vertical" margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <XAxis type="number" tick={{ fill: '#8C9A86', fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#8C9A86', fontSize: 10 }} width={80} />
                  <Tooltip 
                    formatter={(value) => [`₹${value}`, 'Projected Loss']}
                    contentStyle={{ backgroundColor: '#FAF6F0', borderColor: '#E8DFD3', fontFamily: 'Public Sans' }}
                  />
                  <Bar dataKey="loss" fill="#A08070" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-on-surface-variant italic">
                No items are currently flagged with waste risk.
              </div>
            )}
          </div>
        </section>

      </div>
    </main>
  );
}
