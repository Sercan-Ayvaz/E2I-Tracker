// src/Components/Family/FamilySetup.jsx

import React, { useState } from 'react';
import { createFamily, getCurrentUser, setCurrentUser } from '../../Utils/storage.ts';

function FamilySetup() {
  const [familyName, setFamilyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!familyName.trim()) {
        throw new Error('Aile adı girin.');
      }

      const user = getCurrentUser();
      if (!user) {
        throw new Error('Kullanıcı bulunamadı.');
      }

      const family = createFamily({
        name: familyName.trim(),
        members: [user.id],
        createdBy: user.id,
        createdAt: new Date().toISOString(),
      });

      // Kullanıcıyı aileye ekle
      const updatedUser = { ...user, familyId: family.id };
      setCurrentUser(updatedUser);

      alert(`Aile "${family.name}" oluşturuldu!`);
      // Burada dashboard'a yönlendirilebilir
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-panel-left">
          <div className="auth-stack">
            <div>
              <h1 className="auth-brand">E2I Tracker</h1>
              <p>Ailenizi oluşturun</p>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleCreateFamily} className="auth-form">
              <div>
                <label className="auth-label">Aile Adı</label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="Örnek: Jordan Ailesi"
                  className="auth-field"
                  required
                />
              </div>

              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? 'Oluşturuluyor...' : 'Aile Oluştur'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FamilySetup;