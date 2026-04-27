// src/Components/Family/FamilyModal.jsx

import React, { useState, useEffect } from 'react';
import {
  createFamily,
  getCurrentUser,
  updateUser,
  getFamily,
  updateFamily,
  getUser,
  requestJoinFamily,
  approveJoinRequest,
  leaveFamily,
  deleteFamily,
  migrateTransactionsToFamily
} from '../../Utils/storage';

function FamilyModal({ isOpen, onClose, onSuccess, t }) {
  const user = getCurrentUser();
  const family = user?.familyId ? getFamily(user.familyId) : null;

  const [familyName, setFamilyName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [joinFamilyId, setJoinFamilyId] = useState('');

  const isFounder = family?.founderId === user?.id;
  const isMaster = user?.role === 'Master';
  const familyMembers = family?.members?.map(memberId => getUser(memberId)).filter(Boolean) || [];
  const pendingMembers = family?.pendingMembers?.map(memberId => getUser(memberId)).filter(Boolean) || [];

  // Modal açıldığında sadece bir kez başlangıç tab'ını ayarla
  useEffect(() => {
    if (isOpen) {
      const currentFamily = user?.familyId ? getFamily(user.familyId) : null;
      if (currentFamily) {
        setActiveTab('manage');
      } else {
        setActiveTab('create');
      }
      setFamilyName('');
      setJoinFamilyId('');
      setError('');
      setSuccess('');
    }
  }, [isOpen, family]); // family bağımlılığını ekledik

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!familyName.trim()) {
        throw new Error('Aile adı girin.');
      }

      if (!user) {
        throw new Error('Kullanıcı bulunamadı.');
      }

      if (user.familyId) {
        throw new Error('Zaten bir aileye üyesiniz. Önce mevcut aileden çıkın.');
      }

      const newFamily = createFamily({
        name: familyName.trim(),
        masterId: user.id,
        members: [user.id],
        pendingMembers: []
      });

      // Kullanıcının rolünü Founder olarak ayarla
      updateUser(user.id, {
        familyId: newFamily.id,
        role: 'Founder'
      });

      // Geçmiş kişisel işlemleri yeni aileye taşı
      migrateTransactionsToFamily(user.id, newFamily.id);

      setSuccess('Aile başarıyla oluşturuldu!');
      setTimeout(() => {
        if (onSuccess) onSuccess(newFamily);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Aile oluşturma hatası:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFamily = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!joinFamilyId.trim()) {
        throw new Error('Aile kodu girin.');
      }

      if (!user) {
        throw new Error('Kullanıcı bulunamadı.');
      }

      if (user.familyId) {
        throw new Error('Zaten bir aileye üyesiniz. Önce mevcut aileden çıkın.');
      }

      requestJoinFamily(joinFamilyId.trim(), user.id);
      setSuccess('Aileye katılma başvurunuz gönderildi. Kurucu onayladıktan sonra aileye katılabileceksiniz.');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Aile katılım hatası:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveFamily = () => {
    if (!user?.familyId) {
      setError('Aile üyeliği bulunamadı.');
      return;
    }

    if (isFounder) {
      setError('Kurucu aileden çıkamaz. Aileyi silmek için "Aileyi Sil" butonunu kullanın.');
      return;
    }

    if (window.confirm('Aileden çıkmak istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      try {
        leaveFamily(user.id);
        setSuccess('Aileden başarıyla çıktınız.');
        setTimeout(() => {
          if (onSuccess) onSuccess(null);
          onClose();
        }, 1000);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleApproveRequest = (memberId, approve) => {
    if (!isFounder) {
      setError('Sadece aile kurucusu başvuruları onaylayabilir.');
      return;
    }

    try {
      approveJoinRequest(family.id, memberId, approve);
      const action = approve ? 'onaylandı' : 'reddedildi';
      setSuccess(`Başvuru ${action}.`);
      setTimeout(() => setSuccess(''), 2000);
      if (onSuccess) onSuccess(getFamily(family.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRoleChange = (memberId, newRole) => {
    if (!isFounder) {
      setError('Sadece aile kurucusu rol verebilir.');
      return;
    }

    if (memberId === user.id) {
      setError('Kendi rolünüzü değiştiremezsiniz.');
      return;
    }

    updateUser(memberId, { role: newRole });
    const updatedFamily = getFamily(family.id);
    setSuccess('Rol başarıyla güncellendi.');
    setTimeout(() => setSuccess(''), 2000);
    if (onSuccess) onSuccess(updatedFamily);
  };

  const handleRemoveMember = (memberId) => {
    if (!isFounder) {
      setError('Sadece aile kurucusu üyeleri atabilir.');
      return;
    }
    if (memberId === user.id) {
      setError('Kendinizi aileden atamazsınız.');
      return;
    }
    if (window.confirm('Bu üyeyi aileden atmak istediğinizden emin misiniz?')) {
      leaveFamily(memberId);
      const updatedFamily = getFamily(family.id);
      if (onSuccess) onSuccess(updatedFamily);
    }
  };

  const handleDeleteFamily = () => {
    if (!isFounder) {
      setError('Sadece aile kurucusu aileyi silebilir.');
      return;
    }
    if (window.confirm('Aileyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm aile verileri silinecektir.')) {
      // Tüm üyelerin aile ID'sini ve rolünü sıfırla
      family.members.forEach(memberId => {
        updateUser(memberId, { familyId: '', role: 'Member' });
      });
      deleteFamily(family.id);
      onClose();
      // Sayfayı yenile
      window.location.reload();
    }
  };

  const handleCopyInviteCode = async () => {
    if (family?.id) {
      try {
        await navigator.clipboard.writeText(family.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        window.prompt('Davet kodunu kopyalayın:', family.id);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t.family}</h2>
          <button type="button" className="modal-close-btn" onClick={onClose} title="Kapat">
            ✕
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}
        {success && <div className="modal-success">{success}</div>}

        <div className="family-management">
          {/* Sekme navigasyonu */}
          <div className="modal-tabs">
            {!family && (
              <>
                <button
                  type="button"
                  className={`modal-tab ${activeTab === 'create' ? 'active' : ''}`}
                  onClick={() => setActiveTab('create')}
                >
                  {t.create}
                </button>
                <button
                  type="button"
                  className={`modal-tab ${activeTab === 'join' ? 'active' : ''}`}
                  onClick={() => setActiveTab('join')}
                >
                  {t.join}
                </button>
              </>
            )}
            {family && (
              <>
                <button
                  type="button"
                  className={`modal-tab ${activeTab === 'manage' ? 'active' : ''}`}
                  onClick={() => setActiveTab('manage')}
                >
                  {t.family}
                </button>
                <button
                  type="button"
                  className={`modal-tab ${activeTab === 'leave' ? 'active' : ''}`}
                  onClick={() => setActiveTab('leave')}
                >
                  {t.leave}
                </button>
              </>
            )}
          </div>

          {/* Aile oluşturma */}
          {activeTab === 'create' && !family && (
            <div className="create-family">
              <div className="setup-welcome">
                <h4 style={{color: '#38bdf8', marginBottom: '0.5rem'}}>{t.setupTitle}</h4>
                <p style={{fontSize: '0.9rem', opacity: 0.8}}>{t.setupDesc}</p>
              </div>
              <form onSubmit={handleCreateFamily} className="modal-form">
                <div className="input-group" style={{background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1rem'}}>
                  <label htmlFor="familyName" className="modal-label">{t.familyName}</label>
                  <input
                    type="text"
                    id="familyName"
                    className="modal-field modal-field--primary"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    placeholder="Örn: Yılmaz Ailesi Finans"
                    required
                  />
                  <div style={{marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem'}}>
                    <span>✨</span>
                    <span>{t.autoFamilyCodeNote}</span>
                  </div>
                </div>
                <button type="submit" className="modal-button modal-button--primary" disabled={loading}>
                  {loading ? '...' : t.create}
                </button>
              </form>
            </div>
          )}

          {/* Aileye katılma */}
          {activeTab === 'join' && !family && (
            <div className="join-family">
              <h4>{t.join}</h4>
              <form onSubmit={handleJoinFamily} className="modal-form">
                <div>
                  <label htmlFor="joinFamilyId" className="modal-label">{t.inviteCode}</label>
                  <input
                    type="text"
                    id="joinFamilyId"
                    className="modal-field"
                    value={joinFamilyId}
                    onChange={(e) => setJoinFamilyId(e.target.value)}
                    placeholder="Aile kodunu girin (örn: E2I-ABC-123)"
                    required
                  />
                </div>
                <button type="submit" className="modal-button" disabled={loading}>
                  {loading ? 'Başvuruluyor...' : 'Katılma Başvurusu Gönder'}
                </button>
              </form>
              <div className="modal-info">
                <p><strong>Not:</strong> Aileye katılmak için kurucunun başvurunuzu onaylaması gerekir.</p>
              </div>
            </div>
          )}

          {/* Aile yönetimi */}
          {activeTab === 'manage' && family && (
            <>
              <div className="family-info">
                <h3>{family.name}</h3>
                <p className="family-id">{t.familyIdLabel}: <code>{family.id}</code></p>
                {isFounder && (
                  <button
                    type="button"
                    className="modal-button modal-button--secondary"
                    onClick={handleCopyInviteCode}
                  >
                    {copied ? `✓ ${t.copied}` : `📋 ${t.inviteCode}`}
                  </button>
                )}
              </div>

              {/* Onay bekleyen başvurular */}
              {isFounder && pendingMembers.length > 0 && (
                <div className="pending-members">
                  <h4>{t.pendingRequests}</h4>
                  <div className="members-list">
                    {pendingMembers.map(member => (
                      <div key={member.id} className="member-item member-item--pending">
                        <div className="member-info">
                          <span className="member-name">{member.displayName}</span>
                          <span className="member-status">{t.statusPending}</span>
                        </div>
                        <div className="member-actions">
                          <button
                            type="button"
                            className="modal-button modal-button--success modal-button--small"
                            onClick={() => handleApproveRequest(member.id, true)}
                          >
                            ✓ {t.approve}
                          </button>
                          <button
                            type="button"
                            className="modal-button modal-button--danger modal-button--small"
                            onClick={() => handleApproveRequest(member.id, false)}
                          >
                            ✗ {t.reject}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Aile üyeleri */}
              <div className="family-members">
                <h4>{t.members} ({familyMembers.length})</h4>
                <div className="members-list">
                  {familyMembers.map(member => (
                    <div key={member.id} className={`member-item ${member.role === 'Master' ? 'member-item--master' : ''} ${member.role === 'Founder' ? 'member-item--founder' : ''}`}>
                      <div className="member-info">
                        <span className="member-name">{member.displayName}</span>
                        <span className="member-role">{member.role}</span>
                      </div>
                      <div className="member-actions">
                        {isFounder && member.id !== user.id && (
                          <>
                            <select
                              value={member.role}
                              onChange={(e) => handleRoleChange(member.id, e.target.value)}
                              className="modal-field modal-field--small"
                            >
                              <option value="Member">{t.member}</option>
                              <option value="Master">Master</option>
                            </select>
                            <button
                              type="button"
                              className="modal-button modal-button--danger modal-button--small"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              {t.kick}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tehlikeli bölge */}
              {isFounder && (
                <div className="family-danger-zone">
                  <h4>{t.dangerZone}</h4>
                  <button
                    type="button"
                    className="modal-button modal-button--danger"
                    onClick={handleDeleteFamily}
                  >
                    {t.deleteFamily}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Aileden çıkma */}
          {activeTab === 'leave' && family && (
            <div className="leave-family">
              <h4>{t.leave}</h4>
              <div className="modal-info">
                <p>{t.leaveWarning}</p>
              </div>
              {!isFounder && (
                <button
                  type="button"
                  className="modal-button modal-button--danger"
                  onClick={handleLeaveFamily}
                >
                  {t.leave}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FamilyModal;
