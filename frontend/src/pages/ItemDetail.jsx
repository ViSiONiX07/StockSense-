import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import UsageChart from '../components/UsageChart';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [usageHistory, setUsageHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Reorder Modal State
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [orderQty, setOrderQty] = useState('');

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editCurrentStock, setEditCurrentStock] = useState('');
  const [editReorderThreshold, setEditReorderThreshold] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editPrice, setEditPrice] = useState('');

  const { t, lang } = useTranslation();

  const fetchItemData = () => {
    fetch(`http://localhost:3000/api/items/${id}`)
      .then(res => res.json())
      .then(data => {
        setItem(data.item || data); // handle wrapped response
        setUsageHistory(data.usageHistory || []);
        setLoading(false);
        const initialQty = data.item ? (data.item.suggestedOrderQty || data.item.reorder_threshold) : (data.suggestedOrderQty || data.reorder_threshold);
        setOrderQty(initialQty || '');
      });
  };

  useEffect(() => {
    fetchItemData();
  }, [id]);

  if (loading) return <div className="p-container-padding text-body-lg">{t('loading')}</div>;

  const handleReorder = () => {
    setShowReorderModal(true);
  };

  const confirmReorder = () => {
    // Call server to record order log in db
    fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_id: item.id,
        item_name: item.name,
        quantity: orderQty,
        unit: item.unit
      })
    })
    .then(res => res.json())
    .then(() => {
      setShowReorderModal(false);
      navigate('/order-confirmation', {
        state: {
          item: item,
          qty: orderQty
        }
      });
    });
  };

  const handleOpenEdit = () => {
    setEditName(item.name);
    setEditCategory(item.category);
    setEditCurrentStock(item.current_stock);
    setEditReorderThreshold(item.reorder_threshold);
    setEditUnit(item.unit);
    setEditExpiryDate(item.expiry_date || '');
    setEditPrice(item.price || 0);
    setShowEditModal(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    fetch(`http://localhost:3000/api/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName,
        category: editCategory,
        current_stock: Number(editCurrentStock),
        reorder_threshold: Number(editReorderThreshold),
        unit: editUnit,
        expiry_date: editExpiryDate,
        price: Number(editPrice)
      })
    })
    .then(res => res.json())
    .then(() => {
      setShowEditModal(false);
      fetchItemData(); // refresh item view with new server calculations
    });
  };

  let statusColorClass = 'bg-sage';
  let textColorClass = 'text-sage';
  if (item.status === 'Critical') {
    statusColorClass = 'bg-plum';
    textColorClass = 'text-plum';
  } else if (item.status === 'Low Supply') {
    statusColorClass = 'bg-ochre';
    textColorClass = 'text-ochre';
  }

  return (
    <main className="max-w-[1440px] mx-auto px-container-padding py-12 pb-32">
      <div className="mb-8">
        <Link to="/inventory" className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2 min-h-[44px]">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span> {t('backLedger')}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-grid-gutter items-start">
        
        {/* Left Column: Details */}
        <section className="lg:col-span-6 bg-surface border border-outline-variant rounded-xl p-6 md:p-8 w-full flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className={`w-3.5 h-3.5 rounded-full ${statusColorClass}`}></span>
              <span className={`font-label-caps text-label-caps uppercase tracking-widest ${textColorClass}`}>
                {t(item.status === 'Critical' ? 'critical' : item.status === 'Low Supply' ? 'lowSupply' : 'inStock')}
              </span>
            </div>

            <h1 className="font-display-lg text-display-lg-mobile md:text-display-sm lg:text-headline-md xl:text-display-lg text-on-surface mb-6 font-semibold leading-tight break-words">
              {item.name}
            </h1>

            <div className="divide-y divide-outline-variant mb-8">
              <div className="py-4 flex justify-between gap-4">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest flex-shrink-0">{t('category')}</span>
                <span className="font-body-md text-on-surface font-medium text-right break-words">{item.category}</span>
              </div>
              <div className="py-4 flex justify-between gap-4">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest flex-shrink-0">{t('unitPrice')}</span>
                <span className="font-data-tabular text-body-md text-on-surface font-semibold text-right">{t('currency')}{item.price || 0} / {item.unit}</span>
              </div>
              <div className="py-4 flex justify-between gap-4">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest flex-shrink-0">{t('currentStock')}</span>
                <span className="font-data-tabular text-body-lg font-bold text-right">{item.current_stock} {item.unit}</span>
              </div>
              <div className="py-4 flex justify-between gap-4">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest flex-shrink-0">{t('reorderPoint')}</span>
                <span className="font-data-tabular text-body-md text-on-surface-variant text-right">{item.reorder_threshold} {item.unit}</span>
              </div>
              <div className="py-4 flex justify-between gap-4">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest flex-shrink-0">{t('expiry')}</span>
                <span className="font-body-md text-right font-medium" style={{ color: item.expiry_date && item.daysToExpiry >= 0 && item.daysToExpiry <= 7 ? '#B5432B' : 'inherit' }}>
                  {item.expiry_date ? (
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      <span className="font-data-tabular">
                        {new Date(item.expiry_date).toLocaleDateString(lang === 'en' ? 'en-US' : 'hi-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      {item.daysToExpiry >= 0 && item.daysToExpiry <= 7 && (
                        <span className="bg-error-container text-plum text-[11px] px-2.5 py-0.5 rounded font-label-caps font-bold">
                          {item.daysToExpiry === 0 ? t('expiresToday') : item.daysToExpiry === 1 ? t('expiresInOneDay') : t('expiresIn', { days: item.daysToExpiry })}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-on-surface-variant italic">{t('noExpiry')}</span>
                  )}
                </span>
              </div>
              <div className="py-4 flex justify-between gap-4">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest flex-shrink-0">{t('avgDaily')}</span>
                <span className="font-data-tabular text-body-md text-on-surface-variant text-right">{item.avgDailyUsage || 0} {item.unit}/day</span>
              </div>
              <div className="py-4 flex justify-between gap-4">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest flex-shrink-0">{t('estDays')}</span>
                <span className="font-body-md text-on-surface italic text-right">{item.daysLeft === 'Infinite' ? 'Infinite' : `${item.daysLeft} ${item.daysLeft === 1 ? t('dayRemaining') : t('daysRemaining')}`}</span>
              </div>
              <div className="py-4 flex flex-col gap-2">
                <div className="flex justify-between gap-4">
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest flex-shrink-0">{t('wasteRisk')}</span>
                  <span className="font-body-md font-medium text-on-surface text-right" style={{ color: item.wasteRisk ? '#B5432B' : 'inherit' }}>
                    {item.wasteRisk ? `${t('yes')} (${t('currency')}${item.projectedLoss})` : t('no')}
                  </span>
                </div>
                {item.wasteRisk ? (
                  <p className="text-xs text-plum bg-error-container p-3 rounded leading-relaxed mt-1">
                    {t('wasteRiskWarning', { days: item.daysToExpiry, qty: item.remainingStockAtExpiry, unit: item.unit.toLowerCase() })}
                  </p>
                ) : (
                  <p className="text-xs text-on-surface-variant italic mt-1 pl-1">
                    {t('noWasteRisk')}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleReorder}
              className="flex-grow bg-primary text-on-primary py-4 rounded-lg font-label-caps text-label-caps uppercase tracking-widest hover:opacity-90 transition-opacity active:scale-95 text-center min-h-[44px]"
            >
              {t('reorderBtn')} {item.suggestedOrderQty || item.reorder_threshold} {item.unit}
            </button>
            <button
              onClick={handleOpenEdit}
              className="px-6 border border-outline-variant hover:bg-surface-container-highest rounded-lg flex items-center justify-center transition-all active:scale-95 text-on-surface min-h-[44px]"
              title="Edit Item"
            >
              <span className="material-symbols-outlined font-light">edit</span>
            </button>
          </div>
        </section>

        {/* Right Column: Chart */}
        <section className="lg:col-span-6 bg-surface border border-outline-variant rounded-xl p-6 md:p-8 w-full">
          <h2 className="font-display-sm text-display-sm mb-6 text-primary font-medium">Usage Trend (Mon - Sun)</h2>
          {usageHistory.length > 0 ? (
            <div className="w-full">
              <UsageChart data={usageHistory} unit={item.unit} />
            </div>
          ) : (
            <div className="h-[240px] flex items-center justify-center border border-dashed border-outline-variant rounded-lg text-on-surface-variant italic">
              No recent usage logs available.
            </div>
          )}
        </section>
      </div>

      {/* Edit Item Modal */}
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-35 z-[100] animate-fade-in overflow-y-auto py-8">
          <div className="bg-surface p-6 md:p-8 rounded-xl w-full max-w-lg hairline shadow-2xl mx-4 my-auto max-h-[90vh] overflow-y-auto">
            <h2 className="font-display-sm text-display-sm mb-6 text-primary font-semibold">{t('editItem')}</h2>
            
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">{t('itemName')}</label>
                <input
                  type="text"
                  required
                  className="bg-surface-container-low border-0 border-b border-outline-variant focus:ring-0 focus:border-primary w-full py-2 px-1 text-body-md"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">{t('category')}</label>
                  <select
                    className="bg-surface-container-low border-0 border-b border-outline-variant focus:ring-0 focus:border-primary w-full py-2 px-1 text-body-md"
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value)}
                  >
                    <option value="Vegetables/Produce">Vegetables/Produce</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Grains & Pulses">Grains & Pulses</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Pantry">Pantry</option>
                  </select>
                </div>

                <div>
                  <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. kg, liters, packs"
                    className="bg-surface-container-low border-0 border-b border-outline-variant focus:ring-0 focus:border-primary w-full py-2 px-1 text-body-md"
                    value={editUnit}
                    onChange={e => setEditUnit(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">{t('currentStock')}</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step={editUnit && (editUnit.toLowerCase() === 'kg' || editUnit.toLowerCase() === 'liters' || editUnit.toLowerCase() === 'liter' || editUnit.toLowerCase() === 'l') ? "0.01" : "1"}
                    className="bg-surface-container-low border-0 border-b border-outline-variant focus:ring-0 focus:border-primary w-full py-2 px-1 text-data-tabular"
                    value={editCurrentStock}
                    onChange={e => setEditCurrentStock(e.target.value)}
                  />
                </div>

                <div>
                  <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">{t('reorderPoint')}</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step={editUnit && (editUnit.toLowerCase() === 'kg' || editUnit.toLowerCase() === 'liters' || editUnit.toLowerCase() === 'liter' || editUnit.toLowerCase() === 'l') ? "0.01" : "1"}
                    className="bg-surface-container-low border-0 border-b border-outline-variant focus:ring-0 focus:border-primary w-full py-2 px-1 text-data-tabular"
                    value={editReorderThreshold}
                    onChange={e => setEditReorderThreshold(e.target.value)}
                  />
                </div>

                <div>
                  <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">{t('unitPrice')} (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    className="bg-surface-container-low border-0 border-b border-outline-variant focus:ring-0 focus:border-primary w-full py-2 px-1 text-data-tabular"
                    value={editPrice}
                    onChange={e => setEditPrice(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">{t('expiry')}</label>
                <input
                  type="date"
                  className="bg-surface-container-low border-0 border-b border-outline-variant focus:ring-0 focus:border-primary w-full py-2 px-1 text-data-tabular"
                  value={editExpiryDate}
                  onChange={e => setEditExpiryDate(e.target.value)}
                />
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 border border-outline-variant text-on-surface font-label-caps text-xs tracking-wider rounded hover:bg-surface-container-low transition-colors min-h-[44px]"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary text-on-primary font-label-caps text-xs tracking-wider rounded hover:opacity-90 transition-opacity min-h-[44px]"
                >
                  {t('saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reorder Modal */}
      {showReorderModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-35 z-[100] animate-fade-in">
          <div className="bg-surface p-6 md:p-8 rounded-xl w-full max-w-md hairline shadow-2xl mx-4">
            <h2 className="font-display-sm text-display-sm mb-4">{t('confirmReorder')}</h2>
            <p className="font-body-md text-on-surface-variant mb-6">
              {t('reviewQty', { name: item.name })}
            </p>
            <div className="mb-6">
              <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">{t('quantity')} ({item.unit})</label>
              <input
                type="number"
                min={item.unit && (item.unit.toLowerCase() === 'kg' || item.unit.toLowerCase() === 'liters' || item.unit.toLowerCase() === 'liter' || item.unit.toLowerCase() === 'l') ? "0.01" : "1"}
                step={item.unit && (item.unit.toLowerCase() === 'kg' || item.unit.toLowerCase() === 'liters' || item.unit.toLowerCase() === 'liter' || item.unit.toLowerCase() === 'l') ? "0.01" : "1"}
                className="bg-surface-container-low border-0 border-b border-outline-variant focus:ring-0 focus:border-primary w-full py-3 px-1 text-data-tabular font-bold text-lg"
                value={orderQty}
                onChange={e => setOrderQty(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowReorderModal(false)}
                className="px-6 py-3 border border-outline-variant text-on-surface font-label-caps text-xs tracking-wider rounded hover:bg-surface-container-low transition-colors min-h-[44px]"
              >
                {t('cancel')}
              </button>
              <button
                onClick={confirmReorder}
                className="px-6 py-3 bg-primary text-on-primary font-label-caps text-xs tracking-wider rounded hover:opacity-90 transition-opacity min-h-[44px]"
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
