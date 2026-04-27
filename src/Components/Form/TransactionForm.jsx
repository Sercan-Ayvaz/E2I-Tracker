import React, { useState, useEffect } from 'react';
import { Calendar, Tag, DollarSign, Repeat, ShieldCheck } from 'lucide-react';
import { createTransaction, updateTransaction, getCurrentUser, createRecurringTransaction, updateRecurringTransaction } from '../../Utils/storage.ts';

function TransactionForm({ isOpen, onClose, transaction, recurringPlan, defaultCategory, onSuccess, t }) {
  const user = getCurrentUser();
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Income',
    date: new Date().toISOString().split('T')[0],
    isPrivate: false,
    investmentType: '',
    price: '',
    quantity: '',
    isRecurring: false
  });

  useEffect(() => {
    if (transaction) {
      setFormData({
        ...transaction,
        amount: transaction.amount.toString(),
        date: new Date(transaction.date).toISOString().split('T')[0],
        price: transaction.price?.toString() || '',
        quantity: transaction.quantity?.toString() || '',
        isRecurring: false
      });
    } else if (recurringPlan) {
      const now = new Date();
      const dateStr = new Date(now.getFullYear(), now.getMonth(), recurringPlan.dayOfMonth).toISOString().split('T')[0];
      setFormData({
        title: recurringPlan.title,
        amount: recurringPlan.amount.toString(),
        category: recurringPlan.category,
        date: dateStr,
        isPrivate: false,
        investmentType: recurringPlan.investmentType || '',
        price: recurringPlan.price?.toString() || '',
        quantity: recurringPlan.quantity?.toString() || '',
        isRecurring: true
      });
    } else {
      setFormData(prev => ({ 
        ...prev, 
        category: defaultCategory,
        title: '',
        amount: '',
        investmentType: '',
        price: '',
        quantity: '',
        isRecurring: false 
      }));
    }
  }, [transaction, recurringPlan, defaultCategory, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    let finalAmount;
    if (formData.category === 'Investment') {
      const qty = parseFloat(formData.quantity);
      const prc = parseFloat(formData.price);
      if (isNaN(qty) || isNaN(prc)) {
        alert("Lütfen geçerli bir miktar ve birim fiyat giriniz.");
        return;
      }
      finalAmount = qty * prc;
    } else {
      const rawAmount = formData.amount.toString().replace(',', '.');
      finalAmount = parseFloat(rawAmount);
      if (isNaN(finalAmount)) {
        alert("Lütfen geçerli bir tutar giriniz.");
        return;
      }
    }

    if (recurringPlan) {
      const recData = {
        title: formData.title,
        amount: finalAmount,
        category: formData.category,
        dayOfMonth: new Date(formData.date).getDate(),
        investmentType: formData.investmentType,
        price: formData.category === 'Investment' ? parseFloat(formData.price) : undefined,
        quantity: formData.category === 'Investment' ? parseFloat(formData.quantity) : undefined,
      };
      updateRecurringTransaction(recurringPlan.id, recData);
      onSuccess();
      return;
    }

    const txData = {
      ...formData,
      amount: finalAmount,
      price: formData.category === 'Investment' ? parseFloat(formData.price) : undefined,
      quantity: formData.category === 'Investment' ? parseFloat(formData.quantity) : undefined,
      userId: user.id,
      familyId: user.familyId || '',
      updatedAt: new Date().toISOString(),
      createdAt: transaction ? transaction.createdAt : new Date().toISOString(),
      history: transaction?.history || []
    };

    if (transaction) {
      updateTransaction(transaction.id, txData);
    } else {
      createTransaction(txData);
      
      // Otomatik yinelenen işlem planı oluşturma
      if (formData.isRecurring) {
        const dateObj = new Date(formData.date);
        const dayOfMonth = dateObj.getDate();
        // İşlemin yapıldığı ayı "işlenmiş" olarak işaretle ki mükerrer kayıt olmasın
        const lastProcessedMonth = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

        createRecurringTransaction({
          userId: user.id,
          familyId: user.familyId || '',
          title: formData.title,
          amount: finalAmount,
          category: formData.category,
          dayOfMonth,
          investmentType: formData.investmentType,
          price: txData.price,
          lastProcessedMonth
        });
      }
    }

    onSuccess();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{transaction || recurringPlan ? t.edit : `${formData.category === 'Income' ? t.income : formData.category === 'Expense' ? t.expense : t.investment} ${t.add}`}</h2>
          <button className="modal-close-btn" onClick={onClose} title="Kapat">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {formData.category === 'Investment' && (
            <div className="form-row">
              <div className="form-group">
                <label className="modal-label">{t.assetType}</label>
                <select 
                  className="modal-field"
                  value={formData.investmentType}
                  onChange={e => setFormData({...formData, investmentType: e.target.value})}
                  required
                >
                  <option value="">{t.select}</option>
                  <option value="Stock">{t.stock}</option>
                  <option value="Crypto">{t.crypto}</option>
                  <option value="Gold">{t.gold}</option>
                  <option value="Fund">{t.fund}</option>
                </select>
              </div>
              <div className="form-group">
                <label className="modal-label">{t.platform}</label>
                <input 
                  type="text" 
                  className="modal-field" 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="Binance, Midas..."
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="modal-label">{t.title}</label>
            <input 
              type="text" 
              className="modal-field" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="Örn: Maaş Ödemesi"
              required 
            />
          </div>

          <div className="form-row">
            {formData.category === 'Investment' ? (
              <>
                <div className="form-group">
                  <label className="modal-label">{t.quantity}</label>
                  <input 
                    type="number" 
                    className="modal-field" 
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: e.target.value})}
                    placeholder="0.00"
                    step="0.0001"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="modal-label">{t.unitPrice}</label>
                  <input 
                    type="number" 
                    className="modal-field" 
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    placeholder="0.00"
                    step="0.01"
                    required 
                  />
                </div>
              </>
            ) : (
              <div className="form-group">
                <label className="modal-label">{t.amount} (₺)</label>
                <input 
                  type="number" 
                  className="modal-field" 
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  placeholder="0.00"
                  step="0.01"
                  required 
                />
              </div>
            )}
            <div className="form-group">
              <label className="modal-label">{t.date}</label>
              <input 
                type="date" 
                className="modal-field" 
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                required 
              />
            </div>
          </div>

          {!transaction && (
            <div className="recurring-checkbox-wrapper">
              <label className="recurring-label">
                <input 
                  type="checkbox" 
                  checked={formData.isRecurring}
                  onChange={e => setFormData({...formData, isRecurring: e.target.checked})}
                />
                <span className="checkbox-box"></span>
                <Repeat size={16} className="icon" />
                {t.recurring}
              </label>
              {formData.isRecurring && (
                <p className="recurring-note">{t.recurringNote}</p>
              )}
            </div>
          )}

          <button type="submit" className="modal-button modal-button--primary">
            {transaction || recurringPlan ? t.edit : t.add}
          </button>
        </form>
      </div>
    </div>
  );
}

export default TransactionForm;