import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import InventoryLedger from './pages/InventoryLedger';
import ItemDetail from './pages/ItemDetail';
import OrderConfirmation from './pages/OrderConfirmation';
import Insights from './pages/Insights';
import { LanguageProvider, useTranslation } from './context/LanguageContext';


function Header() {
  const { lang, toggleLanguage, t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const getLinkClass = (path) => {
    const base = "font-label-caps text-label-caps cursor-pointer tracking-widest transition-colors pb-1 ";
    const isActive = location.pathname === path;
    return base + (isActive ? "text-primary font-bold border-b-2 border-primary" : "text-on-surface-variant hover:text-primary");
  };

  const getMobileLinkClass = (path) => {
    const base = "font-label-caps text-label-caps py-2 min-h-[44px] flex items-center transition-colors ";
    const isActive = location.pathname === path;
    return base + (isActive ? "text-primary font-bold border-l-4 border-primary pl-3" : "text-on-surface-variant hover:text-primary");
  };

  return (
    <header className="bg-surface border-b border-outline-variant w-full flex items-center justify-between px-container-padding h-16 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu Toggle */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 -ml-2 text-primary hover:bg-surface-container-low rounded-full transition-colors flex items-center justify-center min-h-[44px] min-w-[44px]"
          aria-label="Toggle Menu"
        >
          <span className="material-symbols-outlined text-[24px]">
            {isMobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>

        <Link to="/" className="flex items-center gap-3">
          <img alt="StockSense Logo" className="h-8 w-auto" src="/favicon.svg" />
          <span className="font-display-sm text-[20px] md:text-display-sm text-primary tracking-tight font-semibold">StockSense</span>
        </Link>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className={getLinkClass('/')}>{t('dashboard')}</Link>
          <Link to="/inventory" className={getLinkClass('/inventory')}>{t('ledger')}</Link>
          <Link to="/insights" className={getLinkClass('/insights')}>{t('insights')}</Link>
          <Link to="/order-confirmation" className={getLinkClass('/order-confirmation')}>{t('orders')}</Link>
        </nav>
        
        {/* Desktop Language Switcher */}
        <button 
          onClick={toggleLanguage}
          className="hidden md:inline-block font-label-caps text-xs tracking-wider border border-outline-variant px-3 py-1.5 rounded hover:bg-surface-container-low transition-colors text-on-surface min-h-[44px] px-4"
        >
          {lang === 'en' ? 'हिन्दी' : 'English'}
        </button>

        <div className="h-9 w-9 bg-surface-container-highest rounded-full overflow-hidden border border-outline-variant flex-shrink-0">
          <img 
            alt="User Profile" 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4hC44xBOVVaeBP3i8cbuPLhIy0z4M9bYMNX1dS2thdtB-KhQr86FjJtDlfteKWxKPeAIqVrGYdT-ubK4TrmdYpevcwrpvaiZVSDXzAV8syaCQlprw2XJUEUcGPemIJGqna5gNonezA9MbOCcf8x27nNeDgF9BuQyKUHz8P_NDHlud7_gjgG1x1XrNJTic5xHDAVv2mvLgOqe5YbwOFIZyrEXPiZJXlMh_7WTrEIwhnYZ_lNfL1DESmdo72vMDrG2iJOcdBkn3YEU" 
          />
        </div>
      </div>

      {/* Mobile Menu Dropdown Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-surface border-b border-outline-variant shadow-lg z-50 flex flex-col p-container-padding gap-6 animate-fade-in">
          <nav className="flex flex-col gap-4">
            <Link 
              to="/" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={getMobileLinkClass('/')}
            >
              {t('dashboard')}
            </Link>
            <Link 
              to="/inventory" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={getMobileLinkClass('/inventory')}
            >
              {t('ledger')}
            </Link>
            <Link 
              to="/insights" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={getMobileLinkClass('/insights')}
            >
              {t('insights')}
            </Link>
            <Link 
              to="/order-confirmation" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={getMobileLinkClass('/order-confirmation')}
            >
              {t('orders')}
            </Link>
          </nav>
          
          <div className="border-t border-outline-variant pt-4 flex items-center justify-between">
            <span className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">Language</span>
            <button 
              onClick={() => {
                toggleLanguage();
                setIsMobileMenuOpen(false);
              }}
              className="font-label-caps text-xs tracking-wider border border-outline-variant px-4 py-2.5 rounded hover:bg-surface-container-low text-on-surface min-h-[44px]"
            >
              {lang === 'en' ? 'हिन्दी' : 'English'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}


export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <div className="app-container min-h-screen bg-background text-on-surface">
          <Header />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<InventoryLedger />} />
            <Route path="/items/:id" element={<ItemDetail />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/insights" element={<Insights />} />
          </Routes>
        </div>
      </BrowserRouter>
    </LanguageProvider>
  );
}


