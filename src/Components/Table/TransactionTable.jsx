import React, { useState } from 'react';
import { getUser, getFamily } from '../../Utils/storage';

const TransactionTable = ({ transactions, onEdit, onDelete, currentUser, t }) => {
  const userRole = currentUser?.role;
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  // Yetkilendirme mantığı
  let filteredTransactions = [];

  const isInvestmentHidden = (tx) => {
    if (tx.category !== 'Investment') return false;
    const owner = getUser(tx.userId);
    return owner?.privateInvestments && currentUser?.id !== tx.userId;
  };

  if (userRole === 'Founder') {
    filteredTransactions = transactions.filter(tx => !isInvestmentHidden(tx));
  } else if (userRole === 'Master') {
    filteredTransactions = transactions.filter(tx => !isInvestmentHidden(tx));
  } else {
    // Member zaten sadece kendisini görüyor, ama kuralı burada da işletmek tutarlılık sağlar
    filteredTransactions = transactions.filter(tx => tx.userId === currentUser?.id);
  }

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let comparison = 0;
    if (sortConfig.key === 'amount') {
      comparison = a.amount - b.amount;
    } else if (sortConfig.key === 'category') {
      comparison = a.category.localeCompare(b.category);
    } else {
      comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
    }

    if (comparison !== 0) {
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    }

    // Tarihler veya seçili kriterler eşitse, gerçek oluşturulma zamanına (createdAt) göre en yeniyi en üstte tut
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (sortedTransactions.length === 0) {
    return <div className="transaction-empty">Aile için henüz işlem kaydı bulunmuyor.</div>;
  }

  const canEditTransaction = (tx) => {
    if (userRole === 'Founder' || userRole === 'Master') return true;
    return tx.userId === currentUser?.id;
  };

  const canDeleteTransaction = (tx) => {
    if (userRole === 'Founder') return true;
    if (tx.userId === currentUser?.id) return true; // Master ve Member kendi verisini silebilir
    return false;
  };

  return (
    <div className="transaction-table-wrapper">
      <table className="transaction-table">
        <thead>
          <tr>
            <th onClick={() => requestSort('date')} style={{cursor:'pointer'}}>{t.date} {sortConfig.key === 'date' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
            <th>{t.title}</th>
            <th onClick={() => requestSort('category')} style={{cursor:'pointer'}}>{t.category} {sortConfig.key === 'category' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
            <th onClick={() => requestSort('amount')} style={{cursor:'pointer'}}>{t.amount} {sortConfig.key === 'amount' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
            <th>{t.user}</th>
            <th>ℹ️</th>
            <th>{t.actions}</th>
          </tr>
        </thead>
        <tbody>
          {sortedTransactions.map((tx) => {
            const isOwnTransaction = tx.userId === currentUser?.id;
            const user = getUser(tx.userId);
            const userName = user?.displayName || tx.userId;
            const isAutomatic = tx.title?.startsWith('[Otomatik]');
            const categoryClass = `transaction-row--${tx.category.toLowerCase()}`;
            const autoClass = isAutomatic ? 'transaction-row--automatic' : '';

            return (
              <tr key={tx.id} className={`transaction-row ${categoryClass} ${autoClass}`}>
                <td>{new Date(tx.date).toLocaleDateString('tr-TR')}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isAutomatic && <span className="badge-auto">{t.auto}</span>}
                    <span>{isAutomatic ? tx.title.replace('[Otomatik] ', '') : tx.title || '-'}</span>
                  </div>
                  {tx.category === 'Investment' && tx.investmentType && (
                    <div className="transaction-investment-details">
                      {tx.investmentType} • {tx.quantity} Adet x {tx.price} ₺
                    </div>
                  )}
                </td>
                <td>
                  {tx.category === 'Income' ? '📥 ' : tx.category === 'Expense' ? '📤 ' : '📈 '}
                  {tx.category === 'Income' ? t.income : tx.category === 'Expense' ? t.expense : t.investment}
                </td>
                <td className="amount-cell">{tx.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
                <td>{userName}</td>
                <td className="transaction-history-cell">
                  {tx.history && tx.history.length > 0 ? (
                    <div className="history-bubble-trigger">
                      📜 ({tx.history.length})
                      <div className="history-bubble-content">
                        {tx.history.map((h, i) => (
                          <div key={i} className="history-item">
                            <small>{new Date(h.updatedAt).toLocaleString('tr-TR')}</small>
                            <p><strong>{h.updatedBy}:</strong> {h.changes}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : '-'}
                </td>
                <td className="transaction-actions-cell">
                  {canEditTransaction(tx) && (
                    <button className="transaction-action-button" onClick={() => onEdit(tx)}>
                      {t.edit}
                    </button>
                  )}
                  {canDeleteTransaction(tx) && (
                    <button className="transaction-action-button transaction-action-button--danger" onClick={() => onDelete(tx.id)}>
                      {t.delete}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;
