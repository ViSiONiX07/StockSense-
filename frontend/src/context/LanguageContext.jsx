import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    currency: '₹',
    greeting: "Good morning — here's what needs your attention",
    criticalRisk: "CRITICAL RISK",
    lowSupplyWarning: "LOW SUPPLY WARNING",
    tomatoesLeft: "Tomatoes — {days} days left",
    daysLeft: "days left",
    dayLeft: "day left",
    reorderBtn: "Reorder",
    potentialWaste: "Potential Waste",
    acrossPerishables: "Across {count} perishables",
    ordersPending: "Orders Pending",
    awaitingFulfillment: "Awaiting fulfillment",
    riskLedger: "Inventory Risk Ledger",
    viewAll: "VIEW ALL",
    status: "STATUS",
    item: "ITEM",
    stock: "STOCK",
    expiry: "EXPIRY",
    supplierNote: "Supplier Note",
    supplierMsg: "Sourced from Valley Green Farms — restock recommended before Friday.",
    contactSupplier: "CONTACT SUPPLIER",
    confirmReorder: "Confirm Reorder",
    reviewQty: "Review order quantity for {name} before sending.",
    quantity: "Quantity",
    cancel: "Cancel",
    confirmOrder: "Confirm Order",
    dashboard: "Dashboard",
    ledger: "Ledger",
    orders: "Orders",
    stockLedger: "Stock Ledger",
    stockSub: "Track stock levels and get restock alerts before you run out.",
    inStock: "In Stock",
    lowSupply: "Low Supply",
    critical: "Critical",
    itemDesc: "Item Description",
    estDays: "Estimated Days",
    addItem: "Add Item",
    itemName: "Item Name",
    category: "Category",
    reorderPoint: "Reorder Point",
    recordLedger: "Record in Ledger",
    backLedger: "BACK TO LEDGER",
    avgDaily: "Average Daily Usage",
    daysRemaining: "days remaining",
    dayRemaining: "day remaining",
    wasteRisk: "Waste Risk",
    yes: "Yes (High Expiry Risk)",
    no: "No",
    orderSent: "Order sent for {qty} {unit} {name}",
    orderSentSub: "Your request has been logged in the digital ledger. The store staff will verify availability shortly.",
    backDashboard: "Back to Dashboard",
    idRef: "ID REF",
    transmitted: "Transmitted",
    loading: "Loading...",
    // Expiry and Waste additions
    expiresIn: "Expires in {days} days",
    expiresInOneDay: "Expires in 1 day",
    expiresToday: "Expires today",
    expired: "Expired",
    wasteRiskWarning: "This item expires in {days} days, but at your current usage rate you'll still have {qty} {unit} left — consider a promotion or reducing your next order.",
    noWasteRisk: "No waste risk.",
    recentOrders: "Recent Orders",
    noOrders: "No orders recorded yet.",
    editItem: "Edit Item",
    unitPrice: "Unit Price",
    saveChanges: "Save Changes",
    noExpiry: "No expiry set",
    logSale: "Log Sale",
    logDelivery: "Log Delivery",
    log: "Log",
    insights: "Insights",
    totalVal: "Total Inventory Value",
    topMovers: "Top Movers",
    fastest: "Fastest-Moving",
    slowest: "Slowest-Moving",
    catBreakdown: "Category Breakdown",
    tracked: "Tracked Items",
    activeWasteRisk: "At Waste Risk",
    summary: "At-a-Glance Summary"
  },
  hi: {
    currency: '₹',
    greeting: "शुभ प्रभात — यहाँ वह है जिस पर आपका ध्यान देने की आवश्यकता है",
    criticalRisk: "गंभीर जोखिम",
    lowSupplyWarning: "कम आपूर्ति की चेतावनी",
    tomatoesLeft: "टमाटर — {days} दिन बचे हैं",
    daysLeft: "दिन बचे हैं",
    dayLeft: "दिन बचा है",
    reorderBtn: "पुनः ऑर्डर करें",
    potentialWaste: "संभावित बर्बादी",
    acrossPerishables: "{count} खराब होने वाली वस्तुओं में",
    ordersPending: "लंबित ऑर्डर",
    awaitingFulfillment: "पूर्ति की प्रतीक्षा में",
    riskLedger: "इन्वेंटरी जोखिम बही",
    viewAll: "सभी देखें",
    status: "स्थिति",
    item: "वस्तु",
    stock: "स्टॉक",
    expiry: "समाप्ति",
    supplierNote: "आपूर्तिकर्ता नोट",
    supplierMsg: "वैली ग्रीन फार्म से प्राप्त — शुक्रवार से पहले पुनः स्टॉक करने की सिफारिश की जाती है।",
    contactSupplier: "आपूर्तिकर्ता से संपर्क करें",
    confirmReorder: "पुनः ऑर्डर की पुष्टि करें",
    reviewQty: "भेजने से पहले {name} के लिए ऑर्डर मात्रा की समीक्षा करें।",
    quantity: "मात्रा",
    cancel: "रद्द करें",
    confirmOrder: "ऑर्डर की पुष्टि करें",
    dashboard: "डैशबोर्ड",
    ledger: "बही",
    orders: "ऑर्डर",
    stockLedger: "स्टॉक बही",
    stockSub: "स्टॉक स्तर को ट्रैक करें और समाप्त होने से पहले पुनः स्टॉक अलर्ट प्राप्त करें।",
    inStock: "स्टॉक में",
    lowSupply: "कम आपूर्ति",
    critical: "गंभीर",
    itemDesc: "वस्तु का विवरण",
    estDays: "अनुमानित दिन",
    addItem: "वस्तु जोड़ें",
    itemName: "वस्तु का नाम",
    category: "श्रेणी",
    reorderPoint: "पुनः ऑर्डर बिंदु",
    recordLedger: "बही में दर्ज करें",
    backLedger: "बही पर वापस जाएं",
    avgDaily: "औसत दैनिक उपयोग",
    daysRemaining: "दिन शेष",
    dayRemaining: "दिन शेष",
    wasteRisk: "बर्बादी का जोखिम",
    yes: "हाँ (उच्च समाप्ति जोखिम)",
    no: "नहीं",
    orderSent: "{qty} {unit} {name} के लिए ऑर्डर भेजा गया",
    orderSentSub: "आपका अनुरोध डिजिटल बही में दर्ज कर लिया गया है। स्टोर कर्मचारी जल्द ही उपलब्धता की पुष्टि करेंगे।",
    backDashboard: "डैशबोर्ड पर वापस जाएं",
    idRef: "आईडी संदर्भ",
    transmitted: "प्रेषित",
    loading: "लोड हो रहा है...",
    // Expiry and Waste additions
    expiresIn: "{days} दिनों में समाप्त",
    expiresInOneDay: "1 दिन में समाप्त",
    expiresToday: "आज समाप्त हो रहा है",
    expired: "समाप्त हो गया",
    wasteRiskWarning: "यह वस्तु {days} दिनों में समाप्त हो रही है, लेकिन आपके वर्तमान उपयोग की दर पर आपके पास अभी भी {qty} {unit} शेष रहेगा — प्रचार या अगले ऑर्डर को कम करने पर विचार करें।",
    noWasteRisk: "कोई बर्बादी का जोखिम नहीं।",
    recentOrders: "हालिया ऑर्डर",
    noOrders: "अभी तक कोई ऑर्डर दर्ज नहीं किया गया है।",
    editItem: "वस्तु संपादित करें",
    unitPrice: "इकाई मूल्य",
    saveChanges: "बदलाव सहेजें",
    noExpiry: "कोई समाप्ति तिथि नहीं",
    logSale: "बिक्री दर्ज करें",
    logDelivery: "डिलिवरी दर्ज करें",
    log: "दर्ज करें",
    insights: "विश्लेषण",
    totalVal: "कुल इन्वेंटरी मूल्य",
    topMovers: "शीर्ष गतिशील वस्तुएं",
    fastest: "सबसे तेज़ गतिशील",
    slowest: "सबसे धीमी गतिशील",
    catBreakdown: "श्रेणीवार विश्लेषण",
    tracked: "ट्रैक की गई वस्तुएं",
    activeWasteRisk: "बर्बादी के जोखिम में",
    summary: "एक नज़र में सारांश"
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('stocksense_lang') || 'en';
  });

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'hi' : 'en';
    setLang(nextLang);
    localStorage.setItem('stocksense_lang', nextLang);
  };

  const t = (key, replacements = {}) => {
    let text = translations[lang]?.[key] || translations['en']?.[key] || key;
    Object.keys(replacements).forEach(r => {
      text = text.replace(`{${r}}`, replacements[r]);
    });
    return text;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
