import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';

export default function InventoryLedger() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const { t } = useTranslation();

  // Quick log states
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [quickLogItem, setQuickLogItem] = useState(null);
  const [quickLogType, setQuickLogType] = useState('sale'); // 'sale' or 'delivery'
  const [quickLogQty, setQuickLogQty] = useState(1);

  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Vegetables/Produce',
    current_stock: '',
    reorder_threshold: '',
    unit: 'kg',
    expiry_date: '',
    price: ''
  });

  const fetchItems = () => {
    fetch('http://localhost:3000/api/items')
      .then(res => res.json())
      .then(data => {
        setItems(data);
        setLoading(false);
      });
  };

  const handleQuickLogInstant = (item, type) => {
    const endpoint = type === 'sale' ? 'usage' : 'replenish';
    const body = type === 'sale' 
      ? { item_id: item.id, date: new Date().toISOString().split('T')[0], quantity_used: 1 }
      : { item_id: item.id, quantity: 1 };

    fetch(`http://localhost:3000/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    .then(res => res.json())
    .then(() => {
      fetchItems(); // refresh list with updated values & forecasting
    });
  };

  const handleOpenCustomLog = (item, type) => {
    setQuickLogItem(item);
    setQuickLogType(type);
    setQuickLogQty(1);
    setShowQuickLog(true);
  };

  const handleConfirmQuickLog = (e) => {
    e.preventDefault();
    if (!quickLogItem) return;

    const qty = Number(quickLogQty);
    if (qty <= 0) return;

    const endpoint = quickLogType === 'sale' ? 'usage' : 'replenish';
    const body = quickLogType === 'sale' 
      ? { item_id: quickLogItem.id, date: new Date().toISOString().split('T')[0], quantity_used: qty }
      : { item_id: quickLogItem.id, quantity: qty };

    fetch(`http://localhost:3000/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    .then(res => res.json())
    .then(() => {
      setShowQuickLog(false);
      fetchItems(); // refresh list with updated values & forecasting
    });
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAddItem = (e) => {
    e.preventDefault();
    fetch('http://localhost:3000/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newItem,
        current_stock: Number(newItem.current_stock),
        reorder_threshold: Number(newItem.reorder_threshold),
        price: Number(newItem.price || 0)
      })
    })
      .then(res => res.json())
      .then(() => {
        setIsPanelOpen(false);
        setNewItem({ ...newItem, name: '', current_stock: '', reorder_threshold: '', expiry_date: '', price: '' });
        fetchItems();
      });
  };

  if (loading) return <div className="p-container-padding text-body-lg">{t('loading')}</div>;

  const categories = ['Snacks', 'Vegetables/Produce', 'Dairy', 'Grains & Pulses', 'Beverages', 'Pantry'];

  return (
    <main className="max-w-[1280px] mx-auto px-container-padding py-10 mb-32 relative">
      {/* Dashboard Header Summary */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-grid-gutter mb-12">
        <div className="md:col-span-8">
          <h2 className="font-headline-md text-headline-md mb-2 font-medium">{t('stockLedger')}</h2>
          <p className="text-on-surface-variant font-body-md max-w-xl">
            {t('stockSub')}
          </p>
        </div>
        <div className="md:col-span-4 flex flex-col justify-end items-end">
          <div className="flex gap-4">
            <span className="flex items-center gap-2 font-label-caps text-label-caps text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-sage"></span> {t('inStock')}
            </span>
            <span className="flex items-center gap-2 font-label-caps text-label-caps text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-ochre"></span> {t('lowSupply')}
            </span>
            <span className="flex items-center gap-2 font-label-caps text-label-caps text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-plum"></span> {t('critical')}
            </span>
          </div>
        </div>
      </div>

      {categories.map(category => {
        const catItems = items.filter(i => i.category === category);
        if (catItems.length === 0) return null;

        return (
          <div key={category} className="mb-10">
            <h3 className="font-display-sm text-[24px] mb-4 text-primary font-medium">{category}</h3>
            
            <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
              {/* Table Header - Desktop Only */}
              <div className="hidden sm:grid grid-cols-12 px-6 py-4 border-b border-outline-variant bg-surface-container-low">
                <div className="col-span-6 md:col-span-7 font-label-caps text-label-caps text-on-surface-variant pl-4">{t('itemDesc')}</div>
                <div className="col-span-3 md:col-span-2 font-label-caps text-label-caps text-on-surface-variant text-right">{t('currentStock')}</div>
                <div className="col-span-3 md:col-span-3 font-label-caps text-label-caps text-on-surface-variant text-right">{t('estDays')}</div>
              </div>

              {/* Ledger Rows */}
              <div className="divide-y divide-outline-variant">
                {catItems.map(item => {
                  let statusColorClass = 'bg-sage';
                  let borderLeftClass = 'border-l-4 border-l-sage';
                  if (item.status === 'Critical') {
                    statusColorClass = 'bg-plum';
                    borderLeftClass = 'border-l-4 border-l-plum';
                  } else if (item.status === 'Low Supply') {
                    statusColorClass = 'bg-ochre';
                    borderLeftClass = 'border-l-4 border-l-ochre';
                  }

                  return (
                    <Link key={item.id} to={`/items/${item.id}`} className="block hover:bg-surface-container transition-colors">
                      {/* Desktop Row layout */}
                      <div className={`hidden sm:grid grid-cols-12 px-6 py-6 ledger-row items-center ${borderLeftClass}`}>
                        <div className="col-span-6 md:col-span-7 flex items-center gap-4 pl-4">
                          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusColorClass}`}></span>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-display-sm text-body-lg text-on-surface font-medium">{item.name} ({item.unit})</span>
                              {item.daysToExpiry >= 0 && item.daysToExpiry <= 7 && (
                                <span className="bg-error-container text-on-error-container text-[11px] px-2.5 py-0.5 rounded font-label-caps font-bold">
                                  {item.daysToExpiry === 0 ? t('expiresToday') : item.daysToExpiry === 1 ? t('expiresInOneDay') : t('expiresIn', { days: item.daysToExpiry })}
                                </span>
                              )}
                            </div>
                            <span className="font-data-tabular text-xs text-on-surface-variant">ID: {item.id}</span>
                          </div>
                        </div>
                        <div className="col-span-3 md:col-span-2 flex flex-col items-end gap-1">
                          <span className="font-data-tabular text-headline-md" style={{ color: item.status === 'Critical' ? '#B5432B' : item.status === 'Low Supply' ? '#C98A2C' : 'inherit' }}>
                            {item.current_stock}
                          </span>
                          <div className="flex gap-2 items-center">
                            <span className="text-xs text-on-surface-variant block uppercase tracking-widest">{item.unit}</span>
                            <div className="flex items-center gap-1 ml-1" onClick={(e) => e.preventDefault()}>
                              <button
                                onClick={(e) => { e.preventDefault(); handleQuickLogInstant(item, 'sale'); }}
                                className="w-6 h-6 rounded-full border border-outline-variant hover:bg-surface-container-highest flex items-center justify-center text-plum font-bold text-sm"
                                title="Log Sale (-1)"
                              >
                                <span>−</span>
                              </button>
                              <button
                                onClick={(e) => { e.preventDefault(); handleQuickLogInstant(item, 'delivery'); }}
                                className="w-6 h-6 rounded-full border border-outline-variant hover:bg-surface-container-highest flex items-center justify-center text-sage font-bold text-sm"
                                title="Log Delivery (+1)"
                              >
                                <span>+</span>
                              </button>
                              {item.unit && (item.unit.toLowerCase() === 'kg' || item.unit.toLowerCase() === 'liters' || item.unit.toLowerCase() === 'liter' || item.unit.toLowerCase() === 'l') && (
                                <button
                                  onClick={(e) => { e.preventDefault(); handleOpenCustomLog(item, 'sale'); }}
                                  className="w-6 h-6 rounded-full border border-outline-variant hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant text-[11px]"
                                  title="Log Custom Sale"
                                >
                                  <span className="material-symbols-outlined text-[13px] font-light">edit</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="col-span-3 md:col-span-3 text-right">
                          <span className="text-body-md text-on-surface-variant italic">
                            {item.daysLeft === 'Infinite' ? 'Infinite' : `${item.daysLeft} ${item.daysLeft === 1 ? t('dayLeft') : t('daysLeft')}`}
                          </span>
                        </div>
                      </div>

                      {/* Mobile Row layout */}
                      <div className={`sm:hidden flex flex-col p-5 gap-3 border-l-4 ${borderLeftClass}`}>
                        <div className="flex items-start gap-3">
                          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-2 ${statusColorClass}`}></span>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-display-sm text-body-lg text-on-surface font-medium leading-tight">{item.name} ({item.unit})</span>
                              {item.daysToExpiry >= 0 && item.daysToExpiry <= 7 && (
                                <span className="bg-error-container text-on-error-container text-[11px] px-2.5 py-0.5 rounded font-label-caps font-bold">
                                  {item.daysToExpiry === 0 ? t('expiresToday') : item.daysToExpiry === 1 ? t('expiresInOneDay') : t('expiresIn', { days: item.daysToExpiry })}
                                </span>
                              )}
                            </div>
                            <span className="font-data-tabular text-xs text-on-surface-variant mt-0.5">ID: {item.id}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm border-t border-outline-variant pt-3 mt-1">
                          <div>
                            <span className="text-xs text-on-surface-variant block uppercase tracking-wider mb-0.5">{t('currentStock')}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-data-tabular text-lg font-bold" style={{ color: item.status === 'Critical' ? '#B5432B' : item.status === 'Low Supply' ? '#C98A2C' : 'inherit' }}>
                                {item.current_stock}
                              </span>
                              <span className="text-xs text-on-surface-variant">{item.unit.toLowerCase()}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5" onClick={(e) => e.preventDefault()}>
                            <button
                              onClick={(e) => { e.preventDefault(); handleQuickLogInstant(item, 'sale'); }}
                              className="h-8 px-2 rounded border border-outline-variant hover:bg-surface-container-highest flex items-center justify-center text-plum text-[10px] font-label-caps font-bold transition-colors"
                              title="Log Sale (-1)"
                            >
                              <span>− SALE</span>
                            </button>
                            <button
                              onClick={(e) => { e.preventDefault(); handleQuickLogInstant(item, 'delivery'); }}
                              className="h-8 px-2 rounded border border-outline-variant hover:bg-surface-container-highest flex items-center justify-center text-sage text-[10px] font-label-caps font-bold transition-colors"
                              title="Log Delivery (+1)"
                            >
                              <span>+ DELIV</span>
                            </button>
                            {item.unit && (item.unit.toLowerCase() === 'kg' || item.unit.toLowerCase() === 'liters' || item.unit.toLowerCase() === 'liter' || item.unit.toLowerCase() === 'l') && (
                              <button
                                onClick={(e) => { e.preventDefault(); handleOpenCustomLog(item, 'sale'); }}
                                className="h-8 px-2 rounded border border-outline-variant hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant transition-colors"
                                title="Custom Sale"
                              >
                                <span className="material-symbols-outlined text-[16px] font-light">edit</span>
                              </button>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="text-xs text-on-surface-variant block uppercase tracking-wider mb-0.5">{t('estDays')}</span>
                            <span className="text-body-md text-on-surface font-medium italic">
                              {item.daysLeft === 'Infinite' ? 'Infinite' : `${item.daysLeft} ${item.daysLeft === 1 ? t('dayLeft') : t('daysLeft')}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      {/* FAB: Add Item */}
      <button 
        onClick={() => setIsPanelOpen(true)}
        className="fixed bottom-12 right-12 w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-xl hover:opacity-90 active:scale-95 transition-all z-[80]"
        title={t('addItem')}
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>

      {/* Panel Backdrop Scrim */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-[90] ${isPanelOpen ? 'opacity-20 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsPanelOpen(false)}
      ></div>

      <aside 
        className={`fixed top-0 right-0 h-full w-full sm:max-w-md bg-surface shadow-2xl z-[100] transition-transform duration-500 ease-out border-l border-outline-variant ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-container-padding flex flex-col h-full overflow-y-auto">
          <div className="flex justify-between items-center mb-12">
            <h3 className="font-display-sm text-display-sm text-primary font-medium">{t('addItem')}</h3>
            <button onClick={() => setIsPanelOpen(false)} className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">close</button>
          </div>
          <form className="flex-grow flex flex-col justify-between" onSubmit={handleAddItem}>
            <div className="space-y-8">
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">{t('itemName')}</label>
                <input 
                  required
                  className="bg-surface-container-low border-0 border-b border-outline-variant focus:ring-0 focus:border-primary px-0 py-3 text-body-lg font-headline-md placeholder:text-outline-variant placeholder:italic" 
                  placeholder="e.g. Organic Whole Milk" 
                  type="text"
                  value={newItem.name}
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">{t('category')}</label>
                <select 
                  className="bg-surface-container-low border-0 border-b border-outline-variant focus:ring-0 focus:border-primary px-0 py-3 text-body-md appearance-none"
                  value={newItem.category}
                  onChange={e => setNewItem({...newItem, category: e.target.value})}
                >
                  {categories.map(cat => <option key={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">{t('currentStock')}</label>
                <input 
                  required
                  className="bg-surface-container-low border-0 border-b border-outline-variant focus:ring-0 focus:border-primary px-0 py-3 text-data-tabular font-bold" 
                  placeholder="0" 
                  type="number"
                  min="0"
                  step={newItem.unit && (newItem.unit.toLowerCase() === 'kg' || newItem.unit.toLowerCase() === 'liters' || newItem.unit.toLowerCase() === 'liter' || newItem.unit.toLowerCase() === 'l') ? "0.01" : "1"}
                  value={newItem.current_stock}
                  onChange={e => setNewItem({...newItem, current_stock: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">{t('reorderPoint')}</label>
                <input 
                  required
                  className="bg-surface-container-low border-0 border-b border-outline-variant focus:ring-0 focus:border-primary px-0 py-3 text-data-tabular" 
                  placeholder="10" 
                  type="number"
                  min="0"
                  step={newItem.unit && (newItem.unit.toLowerCase() === 'kg' || newItem.unit.toLowerCase() === 'liters' || newItem.unit.toLowerCase() === 'liter' || newItem.unit.toLowerCase() === 'l') ? "0.01" : "1"}
                  value={newItem.reorder_threshold}
                  onChange={e => setNewItem({...newItem, reorder_threshold: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Unit</label>
                <input 
                  required
                  className="bg-surface-container-low border-0 border-b border-outline-variant focus:ring-0 focus:border-primary px-0 py-3 text-body-md" 
                  placeholder="e.g. kg, liters, packs" 
                  type="text"
                  value={newItem.unit}
                  onChange={e => setNewItem({...newItem, unit: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">{t('unitPrice')} (₹)</label>
                <input 
                  required
                  className="bg-surface-container-low border-0 border-b border-outline-variant focus:ring-0 focus:border-primary px-0 py-3 text-data-tabular" 
                  placeholder="₹0.00" 
                  type="number"
                  min="0"
                  step="any"
                  value={newItem.price}
                  onChange={e => setNewItem({...newItem, price: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">{t('expiry')}</label>
                <input 
                  className="bg-surface-container-low border-0 border-b border-outline-variant focus:ring-0 focus:border-primary px-0 py-3 text-data-tabular" 
                  type="date"
                  value={newItem.expiry_date}
                  onChange={e => setNewItem({...newItem, expiry_date: e.target.value})}
                />
              </div>
            </div>
            
            <div className="pt-8 flex flex-col gap-4">
              <button type="submit" className="w-full bg-primary text-on-primary py-4 font-label-caps text-label-caps uppercase tracking-widest hover:opacity-90 transition-opacity">{t('recordLedger')}</button>
              <button type="button" onClick={() => setIsPanelOpen(false)} className="w-full border border-outline-variant text-on-surface py-4 font-label-caps text-label-caps uppercase tracking-widest hover:bg-surface-container-low transition-colors">{t('cancel')}</button>
            </div>
          </form>
        </div>
      </aside>
      {/* Quick Log Modal */}
      {showQuickLog && quickLogItem && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-35 z-[120] animate-fade-in">
          <div className="bg-surface p-6 md:p-8 rounded-xl w-full max-w-sm hairline shadow-2xl mx-4">
            <h2 className="font-display-sm text-display-sm mb-4">
              {quickLogType === 'sale' ? t('logSale') : t('logDelivery')}
            </h2>
            <p className="font-body-md text-on-surface-variant mb-6">
              {quickLogItem.name} ({quickLogItem.unit})
            </p>
            <form onSubmit={handleConfirmQuickLog} className="space-y-6">
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">{t('quantity')}</label>
                <input
                  type="number"
                  min={quickLogItem.unit && (quickLogItem.unit.toLowerCase() === 'kg' || quickLogItem.unit.toLowerCase() === 'liters' || quickLogItem.unit.toLowerCase() === 'liter' || quickLogItem.unit.toLowerCase() === 'l') ? "0.01" : "1"}
                  step={quickLogItem.unit && (quickLogItem.unit.toLowerCase() === 'kg' || quickLogItem.unit.toLowerCase() === 'liters' || quickLogItem.unit.toLowerCase() === 'liter' || quickLogItem.unit.toLowerCase() === 'l') ? "0.01" : "1"}
                  required
                  className="bg-surface-container-low border-0 border-b border-outline-variant focus:ring-0 focus:border-primary w-full py-3 px-1 text-data-tabular font-bold text-lg"
                  value={quickLogQty}
                  onChange={e => setQuickLogQty(e.target.value)}
                />
              </div>
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowQuickLog(false)}
                  className="px-6 py-3 border border-outline-variant text-on-surface font-label-caps text-xs tracking-wider rounded hover:bg-surface-container-low transition-colors min-h-[44px]"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary text-on-primary font-label-caps text-xs tracking-wider rounded hover:opacity-90 transition-opacity min-h-[44px]"
                >
                  {t('log')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}


