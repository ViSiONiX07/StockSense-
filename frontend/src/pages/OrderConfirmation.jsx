import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import { API_URL } from '../config';

export default function OrderConfirmation() {
  const location = useLocation();
  const { item, qty } = location.state || {};
  const { t, lang } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Fallback to the latest order in the list if navigation state is empty
  const latestOrder = orders.length > 0 ? orders[0] : null;
  const name = item ? item.name : (latestOrder ? latestOrder.item_name : 'Tomatoes');
  const displayQty = qty || (latestOrder ? latestOrder.quantity : 15);
  const unit = item ? item.unit : (latestOrder ? latestOrder.unit : 'kg');

  // Generate a random but realistic transaction ID if not present
  const txnId = `TXN-${Math.floor(1000 + Math.random() * 9000)}-BM`;

  const handleReceiveOrder = (id) => {
    fetch(`${API_URL}/api/orders/${id}/receive`, {
      method: 'PUT'
    })
    .then(res => res.json())
    .then(() => {
      fetch(`${API_URL}/api/orders`)
        .then(res => res.json())
        .then(data => setOrders(data));
    })
    .catch(err => console.error(err));
  };

  useEffect(() => {
    fetch(`${API_URL}/api/orders`)
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoadingOrders(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingOrders(false);
      });
  }, [location.state]); // reload if state changes (e.g. new order confirmed)

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col bg-background text-on-surface select-none overflow-y-auto">
      <main className="max-w-4xl mx-auto w-full px-container-padding py-12 flex flex-col gap-12">
        
        {/* Success Confirmation Card */}
        <section className="flex flex-col items-center text-center">
          {/* Animated feedback container */}
          <div className="relative mb-8">
            {/* Subtle Sage Pulse Ring */}
            <div className="absolute inset-0 rounded-full border border-outline-variant animate-pulse-sage scale-150 opacity-20"></div>
            {/* Illustrative Icon (Thin-stroke crate/ledger) */}
            <div className="relative z-10 w-24 h-24 flex items-center justify-center bg-surface-container-low border border-outline-variant rounded-full animate-fade-in-up">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant font-light">inventory_2</span>
            </div>
          </div>

          {/* Success Message */}
          <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h1 className="font-headline-md text-headline-md text-on-surface max-w-md mx-auto italic">
              {t('orderSent', { qty: displayQty, unit: unit.toLowerCase(), name: name.toLowerCase() })}{' '}
              <span className="material-symbols-outlined align-middle text-[24px]" style={{ fontVariationSettings: "'wght' 200" }}>check</span>
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mx-auto leading-relaxed opacity-70">
              {t('orderSentSub')}
            </p>
          </div>

          {/* Action Section */}
          <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 px-8 h-touch-target bg-transparent border border-outline-variant hover:bg-surface-container-highest active:opacity-80 transition-all group"
            >
              <span className="material-symbols-outlined text-[18px] transition-transform group-hover:-translate-x-1">arrow_back</span>
              <span className="font-label-caps text-label-caps uppercase tracking-widest text-primary">{t('backDashboard')}</span>
            </Link>
          </div>

          {/* Minimalist Confirmation Details (Subtle Ledger feel) */}
          <div className="mt-8 w-full max-w-xs pt-6 border-t border-outline-variant animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant opacity-60">{t('idRef')}</span>
              <span className="font-data-tabular text-data-tabular">{txnId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-label-caps text-label-caps text-on-surface-variant opacity-60">{t('status')}</span>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-sage rounded-full"></div>
                <span className="font-body-md text-[14px] text-on-surface">{t('transmitted')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Orders Log Table */}
        <section className="bg-surface border border-outline-variant rounded-xl p-6 md:p-8 w-full animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <h2 className="font-display-sm text-headline-md mb-6 font-medium text-primary">{t('recentOrders')}</h2>
          
          {loadingOrders ? (
            <div className="py-8 text-center text-on-surface-variant italic font-body-md">{t('loading')}</div>
          ) : orders.length === 0 ? (
            <div className="py-8 text-center text-on-surface-variant italic font-body-md">{t('noOrders')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant text-[11px] font-label-caps tracking-widest text-on-surface-variant opacity-65">
                    <th className="pb-3">{t('status').toUpperCase()}</th>
                    <th className="pb-3">{t('item').toUpperCase()}</th>
                    <th className="pb-3 text-right">{t('quantity').toUpperCase()}</th>
                    <th className="pb-3 text-right">DATE</th>
                    <th className="pb-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {orders.map(order => (
                    <tr key={order.id} className="text-body-md text-on-surface hover:bg-surface-container-low transition-colors">
                      <td className="py-4">
                        {order.status === 'Received' ? (
                          <span className="inline-block px-2.5 py-1 rounded bg-[#EAF0EB] text-[#4C6E4A] font-label-caps text-[10px] uppercase font-semibold tracking-wider">
                            Received
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded bg-[#FAF0E6] text-[#C29047] font-label-caps text-[10px] uppercase font-semibold tracking-wider">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-4 font-medium">{order.item_name}</td>
                      <td className="py-4 text-right font-data-tabular">{order.quantity} {order.unit.toLowerCase()}</td>
                      <td className="py-4 text-right text-xs text-on-surface-variant font-data-tabular">
                        {new Date(order.timestamp).toLocaleDateString(lang === 'en' ? 'en-IN' : 'hi-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-4 text-right">
                        {order.status !== 'Received' ? (
                          <button
                            onClick={() => handleReceiveOrder(order.id)}
                            className="font-label-caps text-[10px] tracking-wider border border-outline-variant bg-white text-on-surface px-3 py-1.5 rounded hover:bg-[#7C8F76] hover:text-white transition-all uppercase"
                          >
                            Mark as Received
                          </button>
                        ) : (
                          <span className="text-xs text-on-surface-variant font-data-tabular italic">
                            Arrived {order.received_at ? new Date(order.received_at).toLocaleDateString(lang === 'en' ? 'en-IN' : 'hi-IN', { month: 'short', day: 'numeric' }) : ''}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>

      {/* Footer Visual Anchor */}
      <footer className="h-16 flex items-center justify-center mt-auto">
        <div className="h-[1px] w-12 bg-outline-variant opacity-40"></div>
      </footer>
    </div>
  );
}



