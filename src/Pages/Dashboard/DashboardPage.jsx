// src/Pages/Dashboard/DashboardPage.jsx

import React, { useState, useEffect } from 'react';
import FamilyModal from '../../Components/Family/FamilyModal.jsx';
import TransactionTable from '../../Components/Table/TransactionTable.jsx';
import TransactionForm from '../../Components/Form/TransactionForm.jsx';
import { 
  getCurrentUser, 
  getTransactionsByFamily, 
  getFamily, 
  getTransactionsByUser,
  setCurrentUser, 
  deleteTransaction, 
  getUser, 
  processRecurringTransactions, 
  getRecurringTransactions, 
  getRecurringTransactionsByUser,
  deleteRecurringTransaction, 
  updateRecurringTransaction, 
  updateUser 
} from '../../Utils/storage';
import { translations, languages } from '../../Utils/translations';

function DashboardPage({ onLogout }) {
  const user = getCurrentUser();
  const familyId = user?.familyId || '';
  const family = familyId ? getFamily(familyId) : null;
  const transactions = familyId ? getTransactionsByFamily(familyId) : getTransactionsByUser(user?.id);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedRecurring, setSelectedRecurring] = useState(null);
  const [defaultCategory, setDefaultCategory] = useState('Income');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [recurringPlans, setRecurringPlans] = useState([]);
  
  // Dil State'i
  const [lang, setLang] = useState(localStorage.getItem('e2i_lang') || 'tr');
  const t = translations[lang];

  // Otomatik işlemleri kontrol et
  useEffect(() => {
    processRecurringTransactions();
    const plans = familyId ? getRecurringTransactions(familyId) : getRecurringTransactionsByUser(user?.id);
    setRecurringPlans(plans);
  }, [refreshTrigger, familyId, user?.id]);

  // Filtreleme State'leri
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // Dinamik Yıl Listesi (İşlemlerdeki yıllara göre)
  const availableYears = [...new Set(transactions.map(t => new Date(t.date).getFullYear().toString()))].sort((a, b) => b - a);
  const familyMembers = family?.members?.map(id => getUser(id)).filter(Boolean) || [];

  // Gelişmiş Filtreleme Mantığı
  const filteredTransactions = transactions.filter(t => {
    const owner = getUser(t.userId);
    const tDate = new Date(t.date);
    const monthMatch = filterMonth === 'all' || (tDate.getMonth() + 1).toString() === filterMonth;
    const yearMatch = filterYear === 'all' || tDate.getFullYear().toString() === filterYear;
    const categoryMatch = filterCategory === 'all' || t.category === filterCategory;

    // ÖZEL YATIRIM GİZLİLİK KURALI
    // Eğer işlemin sahibi yatırımlarını gizlediyse ve o kişi ben değilsem; yatırımı görme.
    if (
      t.category === 'Investment' && 
      owner?.privateInvestments && 
      user?.id !== t.userId
    ) {
      return false;
    }
    
    // Rol bazlı temel kısıtlama + Kişi filtresi
    let userMatch = false;
    if (user?.role === 'Member') {
      userMatch = t.userId === user.id; // Üye sadece kendini görür
    } else {
      userMatch = filterUser === 'all' || t.userId === filterUser; // Diğerleri seçebilir
    }

    return monthMatch && yearMatch && userMatch && categoryMatch;
  });

  const totals = filteredTransactions.reduce(
    (acc, transaction) => {
      if (transaction.category === 'Income') acc.income += transaction.amount;
      if (transaction.category === 'Expense') acc.expense += transaction.amount;
      if (transaction.category === 'Investment') acc.investment += transaction.amount;
      return acc;
    },
    { income: 0, expense: 0, investment: 0 }
  );

  const balance = totals.income - (totals.expense + totals.investment);

  const handleLogout = () => {
    setCurrentUser(null);
    if (onLogout) onLogout();
  };

  const handleFamilyModalClose = () => {
    setIsFamilyModalOpen(false);
  };

  const handleFamilySuccess = () => {
    setIsFamilyModalOpen(false);
  };

  const handleOpenTransactionModal = (transaction = null, category = 'Income') => {
    setSelectedTransaction(transaction);
    setDefaultCategory(category);
    setIsTransactionModalOpen(true);
  };

  const handleCloseTransactionModal = () => {
    setSelectedTransaction(null);
    setSelectedRecurring(null);
    setIsTransactionModalOpen(false);
  };

  const handleTransactionSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    setSelectedTransaction(null);
    setSelectedRecurring(null);
    setIsTransactionModalOpen(false);
  };

  const handleLanguageChange = (e) => {
    setLang(e.target.value);
    localStorage.setItem('e2i_lang', e.target.value);
  };

  const handleTogglePrivateInvestments = (e) => {
    const checked = e.target.checked;
    updateUser(user.id, { privateInvestments: checked });
  };

  const handleOpenRecurringModal = (plan) => {
    setSelectedRecurring(plan);
    setIsTransactionModalOpen(true);
  };

  const handleDeleteRecurring = (id) => {
    if (window.confirm('Bu otomatik ödeme planını iptal etmek istediğinize emin misiniz?')) {
      deleteRecurringTransaction(id);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  return (
    <div className="dashboard-shell">
      <FamilyModal
        isOpen={isFamilyModalOpen}
        onClose={handleFamilyModalClose}
        onSuccess={handleFamilySuccess}
        t={t}
      />

      <div className="dashboard-grid-container">
        {/* Sol Panel - Profil */}
        <div className="dashboard-left-panel">
          <div className="dashboard-profile-card">
            <div className="profile-header">
              <div className="profile-avatar">👤</div>
              <div className="profile-info">
                  <h2>{user?.displayName || t.user}</h2>
                <p className="profile-username">@{user?.username || 'username'}</p>
                  <p className="profile-family-name">{t.family}: {family?.name || 'Kişisel Hesap'}</p>
                  <p className="profile-family-id">{familyId ? `${t.familyIdLabel}: ${familyId}` : 'Bağımsız Kullanıcı'}</p>
              </div>
            </div>

              {/* Yatırım Gizlilik Checkbox */}
              <div className="profile-privacy-toggle" style={{marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem'}}>
                <label className="recurring-label" style={{justifyContent: 'center', fontSize: '0.85rem'}}>
                  <input 
                    type="checkbox" 
                    checked={user?.privateInvestments || false}
                    onChange={handleTogglePrivateInvestments}
                  />
                  <span className="checkbox-box"></span>
                  <span>{t.privateInvestmentsLabel}</span>
                </label>
                <p style={{fontSize: '0.7rem', color: 'rgba(148,163,184,0.6)', marginTop: '0.5rem'}}>
                  {t.privateInvestmentsDesc}
                </p>
              </div>
          </div>
        </div>

        {/* Sağ Panel - Kartlar + Butonlar */}
        <div className="dashboard-right-panel">
          {/* Üst Bölüm - Action Butonları (Sağda) */}
          <div className="dashboard-header-bar">
            <div></div>
            <div className="dashboard-top-actions">
              <div className="language-selector">
                <select value={lang} onChange={handleLanguageChange}>
                  {languages.map(l => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <button className="dashboard-action-btn dashboard-action-btn--primary" onClick={() => setIsFamilyModalOpen(true)}>
                {t.family}
              </button>
              <button className="dashboard-action-btn dashboard-action-btn--logout" onClick={handleLogout}>
                {t.logout}
              </button>
            </div>
          </div>

          {/* Üst Satır - İlk 2 Card */}
          <div className="dashboard-cards-row">
            <article className="dashboard-card dashboard-card--income">
              <h3>{t.totalIncome}</h3>
              <p className="card-amount">{totals.income.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
            </article>
            <article className="dashboard-card dashboard-card--expense">
              <h3>{t.totalExpense}</h3>
              <p className="card-amount">{totals.expense.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
            </article>
          </div>

          {/* Ortası Satır - Yatırım ve Bakiye */}
          <div className="dashboard-cards-row">
            <article className="dashboard-card dashboard-card--investment">
              <h3>{t.totalInvestment}</h3>
              <p className="card-amount">{totals.investment.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
              <p className="card-hint">
                {totals.investment > 0 ? t.investmentGrow : t.noInvestment}
              </p>
            </article>
            <article className="dashboard-card dashboard-card--balance">
              <h3>{t.balance}</h3>
              <p className="card-amount balance-highlight">{balance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
            </article>
          </div>
        </div>
      </div>

      {/* Otomatik İşlem Planları Paneli */}
      {recurringPlans.length > 0 && (
        <section className="recurring-plans-section">
          <div className="section-header">
            <h3>🗓️ {t.activePlans}</h3>
            <p>{t.autoDesc}</p>
          </div>
          <div className="recurring-grid">
            {recurringPlans.map(plan => (
              <div key={plan.id} className={`recurring-mini-card recurring-mini-card--${plan.category.toLowerCase()}`}>
                <div className="plan-info">
                  <span className="plan-day">{t.everyMonth} {plan.dayOfMonth}</span>
                  <h4>{plan.title}</h4>
                  <p className="plan-amount">{plan.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="plan-edit-btn" 
                    onClick={() => handleOpenRecurringModal(plan)}
                    title={t.edit}
                  >
                    ✎
                  </button>
                  <button 
                    className="plan-delete-btn" 
                    onClick={() => handleDeleteRecurring(plan.id)}
                    title="Planı İptal Et"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Alt Seksiyon - 3 Kart */}
      <section className="dashboard-action-cards">
        <article className="action-card action-card--income">
          <div className="action-card-icon">📥</div>
          <h3>{t.income} {t.addEdit}</h3>
          <p>{t.income} {t.manageData}</p>
          <button className="action-card-btn" onClick={() => handleOpenTransactionModal(null, 'Income')}>{t.open}</button>
        </article>
        <article className="action-card action-card--expense">
          <div className="action-card-icon">📤</div>
          <h3>{t.expense} {t.addEdit}</h3>
          <p>{t.expense} {t.manageData}</p>
          <button className="action-card-btn" onClick={() => handleOpenTransactionModal(null, 'Expense')}>{t.open}</button>
        </article>
        <article className="action-card action-card--investment">
          <div className="action-card-icon">📈</div>
          <h3>{t.investment} {t.addEdit}</h3>
          <p>{t.investment} {t.manageData}</p>
          <button className="action-card-btn" onClick={() => handleOpenTransactionModal(null, 'Investment')}>{t.open}</button>
        </article>
      </section>

      <section className="dashboard-table-section">
        <div className="dashboard-table-header">
          <div>
              <h3>{t.history}</h3>
            <p className="dashboard-table-subtitle">Ailenizin gelir, gider ve yatırım kayıtları.</p>
          </div>
        </div>

        {/* Filtreleme Paneli */}
        <div className="dashboard-filters">
          <div className="filter-group">
            <label>{t.month}</label> {/* t.month kullanılıyor */}
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
              <option value="all">{t.allMonths}</option>
              {Object.entries(t.months).map(([value, name]) => (
                <option key={value} value={value}>{name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>{t.year}</label> {/* t.year kullanılıyor */}
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
              <option value="all">{t.allYears}</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>{t.category}</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="all">{t.allCategories || 'Tüm Kategoriler'}</option>
              <option value="Income">{t.income}</option>
              <option value="Expense">{t.expense}</option>
              <option value="Investment">{t.investment}</option>
            </select>
          </div>

          {(user?.role === 'Founder' || user?.role === 'Master') && (
            <div className="filter-group">
              <label>{t.person}</label>
              <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
                <option value="all">{t.allFamily}</option>
                {familyMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.displayName} {m.id === user.id ? `(${t.me})` : ''}</option>
                ))}
              </select>
            </div>
          )}

          <button 
            className="filter-reset-btn" 
            onClick={() => {
              setFilterMonth('all');
              setFilterYear('all');
              setFilterUser('all');
              setFilterCategory('all');
            }}
          >
            Filtreleri Sıfırla
          </button>
        </div>

        <TransactionTable
          transactions={filteredTransactions}
          t={t}
          onEdit={(transaction) => handleOpenTransactionModal(transaction, transaction.category)}
          onDelete={(id) => {
            if (window.confirm('Bu işlemi silmek istediğinize emin misiniz?')) {
              deleteTransaction(id);
              handleTransactionSuccess();
            }
          }}
          currentUser={user}
        />
      </section>

      <TransactionForm
        isOpen={isTransactionModalOpen}
        onClose={handleCloseTransactionModal}
        transaction={selectedTransaction}
        recurringPlan={selectedRecurring}
        defaultCategory={defaultCategory}
        t={t}
        onSuccess={handleTransactionSuccess}
      />
    </div>
  );
}

export default DashboardPage;
