import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [activity, setActivity] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderItem, setReorderItem] = useState(null);
  const [orderQty, setOrderQty] = useState('');
  const navigate = useNavigate();
  const { t, lang } = useTranslation();

  useEffect(() => {
    fetch('http://localhost:3000/api/items')
      .then(res => res.json())
      .then(data => {
        setItems(data);
      });

    fetch('http://localhost:3000/api/activity')
      .then(res => res.json())
      .then(data => {
        setActivity(data);
      });

    fetch('http://localhost:3000/api/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data);
      });

    fetch('http://localhost:3000/api/smart-recommendation')
      .then(res => res.json())
      .then(data => {
        setRecommendation(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-container-padding text-body-lg">{t('loading')}</div>;

  // Find the most urgent item (Critical or Low Supply, lowest days left)
  const urgentItem = [...items]
    .filter(i => i.status === 'Critical' || i.status === 'Low Supply')
    .sort((a, b) => {
      const aDays = a.daysLeft === 'Infinite' ? 9999 : a.daysLeft;
      const bDays = b.daysLeft === 'Infinite' ? 9999 : b.daysLeft;
      return aDays - bDays;
    })[0] || items[0];

  const ordersNeeded = orders.filter(o => o.status !== 'Received').length;
  const wasteRiskItems = items.filter(i => i.wasteRisk);
  const wasteRiskValue = wasteRiskItems.reduce((acc, curr) => acc + (curr.projectedLoss || 0), 0);

  const handleOpenReorder = (item) => {
    setReorderItem(item);
    setOrderQty(item.suggestedOrderQty || 15);
    setShowReorderModal(true);
  };

  const handleConfirmReorder = () => {
    if (!reorderItem) return;
    
    // Call server to record order log in db
    fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_id: reorderItem.id,
        item_name: reorderItem.name,
        quantity: orderQty,
        unit: reorderItem.unit
      })
    })
    .then(res => res.json())
    .then(() => {
      setShowReorderModal(false);
      navigate('/order-confirmation', {
        state: {
          item: reorderItem,
          qty: orderQty
        }
      });
    });
  };

  const fastestItem = [...items]
    .filter(i => i.avgDailyUsage > 0)
    .sort((a, b) => b.avgDailyUsage - a.avgDailyUsage)[0];

  return (
    <main className="max-w-[1440px] mx-auto px-container-padding py-10 pb-32">
      {/* Header Greeting */}
      <section className="mb-10">
        <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface leading-tight font-semibold">
          {t('greeting')}
        </h1>
      </section>

      {/* Asymmetric Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-grid-gutter">
        
        {/* Hero Card: Urgent Item (Critical Risk) */}
        {urgentItem && (
          <div className={`md:col-span-8 rounded-xl p-8 flex flex-col justify-between min-h-[380px] transition-all duration-300 ${
            urgentItem.status === 'Critical' 
              ? 'bg-[#F7E4DE] border-l-4 border-l-terracotta border-t border-r border-b border-outline-variant' 
              : urgentItem.status === 'Low Supply'
                ? 'bg-[#FAF0E6] border-l-4 border-l-[#C29047] border-t border-r border-b border-[#EADFCB]'
                : 'bg-surface hairline'
          }`}>
            <div>
              <span className={`inline-block font-label-caps text-[10px] uppercase tracking-widest mb-4 px-2.5 py-1 rounded-md font-semibold ${
                urgentItem.status === 'Critical' 
                  ? 'bg-terracotta/10 text-terracotta' 
                  : 'bg-[#C29047]/10 text-[#C29047]'
              }`}>
                {urgentItem.status === 'Critical' ? t('criticalRisk') : t('lowSupplyWarning')}
              </span>
              
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h2 className="font-display-sm text-display-sm mb-2 text-on-surface">
                    {urgentItem.name} — {urgentItem.daysLeft} {urgentItem.daysLeft === 1 ? t('dayLeft') : t('daysLeft')}
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
                    Stock level is critically low. Projected depletion based on current average daily usage.
                  </p>
                </div>
                
                {/* SVG Sparkline indicating stock depletion */}
                <div className="hidden sm:block mt-2">
                  <svg className="w-48 h-10 opacity-75" viewBox="0 0 160 40" aria-label="Stock depletion trend">
                    <defs>
                      <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={urgentItem.status === 'Critical' ? '#D25D47' : '#C29047'} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={urgentItem.status === 'Critical' ? '#D25D47' : '#C29047'} stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,5 C30,7 60,18 90,20 C120,22 130,35 160,38"
                      fill="none"
                      stroke={urgentItem.status === 'Critical' ? '#D25D47' : '#C29047'}
                      strokeWidth="2"
                    />
                    <path
                      d="M0,5 C30,7 60,18 90,20 C120,22 130,35 160,38 L160,40 L0,40 Z"
                      fill="url(#sparklineGrad)"
                    />
                    <circle cx="160" cy="38" r="3" fill={urgentItem.status === 'Critical' ? '#D25D47' : '#C29047'} />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mt-8">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-display-lg text-6xl sm:text-7xl md:text-[110px] leading-none text-on-surface font-semibold">
                  {urgentItem.daysLeft === 'Infinite' ? '∞' : urgentItem.daysLeft}
                </span>
                <span className="font-headline-md text-headline-md text-on-surface mb-2">
                  {urgentItem.daysLeft === 1 ? t('dayLeft') : t('daysLeft')}
                </span>
              </div>
              <button 
                onClick={() => handleOpenReorder(urgentItem)}
                className="bg-terracotta text-white px-8 py-4 rounded-lg font-label-caps text-label-caps uppercase tracking-widest hover:opacity-90 transition-opacity active:scale-95 w-full sm:w-auto text-center min-h-[44px]"
              >
                {t('reorderBtn')} {urgentItem.suggestedOrderQty} {urgentItem.unit}
              </button>
            </div>
          </div>
        )}
 
        {/* Smaller Stacked Cards */}
        <div className="md:col-span-4 flex flex-col gap-grid-gutter">
          <div className={`rounded-xl p-7 flex flex-col justify-center flex-1 transition-all duration-300 ${
            wasteRiskValue > 0 
              ? 'bg-[#FCF8F2] border-l-4 border-l-[#C29047] border-t border-r border-b border-[#EADFCB]' 
              : 'bg-surface hairline'
          }`}>
            <div className="flex justify-between items-start mb-3">
              <span className="font-label-caps text-label-caps text-on-surface-variant tracking-widest block uppercase">
                {t('potentialWaste')}
              </span>
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant/70 font-light">payments</span>
            </div>
            <span className="font-display-sm text-display-sm text-on-surface font-medium">
              {t('currency')}{wasteRiskValue.toFixed(2)}
            </span>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              {t('acrossPerishables', { count: wasteRiskItems.length })}
            </p>
          </div>
          
          <div className={`rounded-xl p-7 flex flex-col justify-center flex-1 transition-all duration-300 ${
            ordersNeeded > 0 
              ? 'bg-[#FDF9F7] border-l-4 border-l-terracotta border-t border-r border-b border-outline-variant' 
              : 'bg-surface hairline'
          }`}>
            <div className="flex justify-between items-start mb-3">
              <span className="font-label-caps text-label-caps text-on-surface-variant tracking-widest block uppercase">
                {t('ordersPending')}
              </span>
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant/70 font-light">pending_actions</span>
            </div>
            <span className="font-display-sm text-display-sm text-on-surface font-medium">
              {ordersNeeded}
            </span>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              {t('awaitingFulfillment')}
            </p>
          </div>
        </div>

        {/* Risk Table */}
        <div className="md:col-span-12 bg-white hairline rounded-xl mt-4 overflow-hidden">
          <div className="px-8 py-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
            <h3 className="font-headline-md text-headline-md font-medium">{t('riskLedger')}</h3>
            <Link to="/inventory" className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-2 hover:text-primary transition-colors">
              {t('viewAll')} <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-lowest">
                  <th className="px-8 py-4 font-label-caps text-label-caps text-on-surface-variant">{t('status')}</th>
                  <th className="px-8 py-4 font-label-caps text-label-caps text-on-surface-variant">{t('item')}</th>
                  <th className="px-8 py-4 font-label-caps text-label-caps text-on-surface-variant">{t('stock')}</th>
                  <th className="px-8 py-4 font-label-caps text-label-caps text-on-surface-variant">{t('expiry')}</th>
                  <th className="px-8 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {items.filter(i => i.status !== 'In Stock' || i.wasteRisk).slice(0, 5).map(item => (
                  <tr key={item.id} className="ledger-row border-b border-outline-variant hover:bg-surface-container-low transition-colors group">
                    <td className="px-8 py-6">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.status === 'Critical' ? 'bg-plum' : 'bg-ochre'}`}></div>
                    </td>
                    <td className="px-8 py-6 font-body-lg text-body-lg font-medium">
                      <Link to={`/items/${item.id}`} className="hover:underline">{item.name}</Link>
                    </td>
                    <td className="px-8 py-6 font-data-tabular text-data-tabular text-on-surface-variant">
                      {item.current_stock} {item.unit}
                    </td>
                    <td className="px-8 py-6 font-data-tabular text-data-tabular text-on-surface-variant">
                      {item.wasteRisk && item.daysToExpiry >= 0 ? (
                        <span className="text-plum font-semibold">
                          {item.daysToExpiry === 1 ? t('expiresInOneDay') : t('expiresIn', { days: item.daysToExpiry })}
                        </span>
                      ) : (
                        item.daysLeft === 'Infinite' ? 'Infinite' : `${item.daysLeft} ${item.daysLeft === 1 ? t('dayLeft') : t('daysLeft')}`
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handleOpenReorder(item)}
                        className="font-label-caps text-xs tracking-wider border border-outline-variant px-3 py-1.5 rounded hover:bg-primary hover:text-white transition-all"
                      >
                        {t('reorderBtn').toUpperCase()}
                      </button>
                    </td>
                  </tr>
                ))}
                {items.filter(i => i.status !== 'In Stock' || i.wasteRisk).length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-8 py-12 text-center font-body-md text-on-surface-variant italic">
                      No high risk items currently in ledger. All levels healthy.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Smart Recommendation Bento Box */}
        <div className="md:col-span-5 bg-[#F1EDE8] hairline rounded-xl p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary text-[20px] font-light">lightbulb</span>
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block">Smart Recommendations</span>
            </div>
            
            {Array.isArray(recommendation) && recommendation.length > 0 ? (
              <div className="space-y-6">
                {recommendation.map((rec, idx) => (
                  <div key={rec.id + '-' + idx} className={`${idx > 0 ? 'border-t border-outline-variant pt-5' : ''}`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-display-lg text-display-lg text-primary font-bold">{rec.stat}</span>
                      <span className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-wider">{rec.statLabel}</span>
                    </div>
                    <p className="font-body-md text-on-surface mb-3 leading-relaxed">
                      {rec.message}
                    </p>
                    <Link 
                      to={`/items/${rec.id}`} 
                      className="inline-flex items-center gap-1.5 font-label-caps text-[10px] text-on-surface font-semibold hover:text-primary transition-colors uppercase tracking-wider"
                    >
                      View {rec.name} <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-body-md text-on-surface-variant italic">
                Calculating live metrics...
              </p>
            )}
          </div>
          <div className="mt-8 font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase opacity-75">
            Data-driven Insights
          </div>
        </div>
        
        {/* Activity & Top Movers Bento Box */}
        <div className="md:col-span-7 bg-white border border-outline-variant rounded-xl p-8 flex flex-col justify-between">
          <div>
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mb-4 block">Recent Activity</span>
            <div className="space-y-3.5 mb-6">
              {activity.map(act => (
                <div key={act.id + '-' + act.type} className="flex justify-between items-center text-body-md border-b border-outline-variant pb-2">
                  <span className="font-medium text-on-surface">
                    {act.type === 'reorder' ? 'Reordered' : act.type === 'received' ? 'Received' : 'Sold'} {act.quantity} {act.unit} of {act.item_name}
                  </span>
                  <span className="font-data-tabular text-xs text-on-surface-variant italic">
                    {act.type === 'reorder' ? 'confirmed' : act.type === 'received' ? 'arrived' : 'logged'}
                  </span>
                </div>
              ))}
              {activity.length === 0 && (
                <div className="text-on-surface-variant text-body-md italic">No recent system activity.</div>
              )}
            </div>
          </div>

          {fastestItem && (
            <div className="border-t border-outline-variant pt-5 mt-2 flex justify-between items-center">
              <div>
                <span className="text-[11px] text-on-surface-variant uppercase tracking-wider block mb-1">Fastest Moving Item</span>
                <span className="font-display-sm text-body-lg text-primary font-semibold">{fastestItem.name}</span>
                <span className="font-data-tabular text-xs text-on-surface-variant block mt-0.5">{fastestItem.avgDailyUsage} {fastestItem.unit}/day</span>
              </div>
              <Link to="/insights" className="font-label-caps text-xs text-on-surface underline underline-offset-4 hover:text-primary transition-colors">
                View Full Insights
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Reorder Modal */}
      {showReorderModal && reorderItem && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-35 z-[100] animate-fade-in">
          <div className="bg-surface p-8 rounded-xl w-full max-w-md hairline shadow-2xl">
            <h2 className="font-display-sm text-display-sm mb-4">{t('confirmReorder')}</h2>
            <p className="font-body-md text-on-surface-variant mb-6">
              {t('reviewQty', { name: reorderItem.name })}
            </p>
            <div className="mb-6">
              <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">{t('quantity')} ({reorderItem.unit})</label>
              <input
                type="number"
                min={reorderItem.unit && (reorderItem.unit.toLowerCase() === 'kg' || reorderItem.unit.toLowerCase() === 'liters' || reorderItem.unit.toLowerCase() === 'liter' || reorderItem.unit.toLowerCase() === 'l') ? "0.01" : "1"}
                step={reorderItem.unit && (reorderItem.unit.toLowerCase() === 'kg' || reorderItem.unit.toLowerCase() === 'liters' || reorderItem.unit.toLowerCase() === 'liter' || reorderItem.unit.toLowerCase() === 'l') ? "0.01" : "1"}
                className="bg-surface-container-low border-0 border-b border-outline-variant focus:ring-0 focus:border-primary w-full py-3 px-1 text-data-tabular font-bold text-lg"
                value={orderQty}
                onChange={e => setOrderQty(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowReorderModal(false)}
                className="px-6 py-3 border border-outline-variant text-on-surface font-label-caps text-xs tracking-wider rounded hover:bg-surface-container-low transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleConfirmReorder}
                className="px-6 py-3 bg-primary text-on-primary font-label-caps text-xs tracking-wider rounded hover:opacity-90 transition-opacity"
              >
                {t('confirmOrder')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
