// src/Components/Auth/AuthEntry.jsx

import React, { useState } from 'react';
import { createUser, loginUser } from '../../Utils/storage';

function AuthEntry({ onAuthSuccess }) {
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { firstName, lastName, age, gender, email, username, password, confirmPassword } = formData;
      if (!firstName || !lastName || !age || !gender || !email || !username || !password || !confirmPassword) {
        throw new Error('Tüm zorunlu alanları doldurun.');
      }

      // E-posta doğrulama
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Geçerli bir e-posta adresi girin.');
      }

      if (password !== confirmPassword) {
        throw new Error('Şifreler eşleşmiyor.');
      }

      // Güçlü şifre kontrolü
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])[\S]{8,}$/;
      if (!passwordRegex.test(password)) {
        throw new Error('Şifre en az 8 karakter, büyük harf, küçük harf, rakam ve özel karakter içermelidir. Boşluk kullanmayınız.');
      }

      await createUser({
        displayName: `${firstName} ${lastName}`,
        role: 'Master',
        familyId: '',
        firstName,
        lastName,
        age: parseInt(age, 10),
        gender,
        email,
        username,
        password,
      });

      setSuccess('Hesabınız başarıyla oluşturuldu. Giriş yapabilirsiniz.');
      setActiveTab('login');
      setFormData({
        firstName: '',
        lastName: '',
        age: '',
        gender: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err.message);
      setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { username, password } = formData;
      if (!username || !password) {
        throw new Error('Kullanıcı adı ve şifre girin.');
      }

      const user = await loginUser(username, password);
      if (!user) {
        throw new Error('Geçersiz kullanıcı adı veya şifre.');
      }

      setSuccess(`Hoş geldiniz, ${user.displayName}!`);
      setTimeout(() => {
        if (onAuthSuccess) onAuthSuccess();
      }, 1000); // Kısa bir gecikme ile yönlendirme
      setFormData({
        firstName: '',
        lastName: '',
        age: '',
        gender: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err.message);
      setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setError('');
    setSuccess('');
    setFormData({
      firstName: '',
      lastName: '',
      age: '',
      gender: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <div className="auth-shell" style={{ backgroundColor: '#A9ACB6' }}>
      <div className="auth-card" style={{ borderRadius: '2rem', border: '1px solid #E1B7CE' }}>
        <div className="auth-panel-left">
          <div className="auth-stack">
            <div>
              <h1 className="auth-brand" style={{ color: '#055FF0' }}>E2I Tracker</h1>
            </div>

            <div className="auth-toggle">
              <button
                type="button"
                onClick={() => switchTab('login')}
                className={`auth-tab ${activeTab === 'login' ? 'auth-tab--active' : ''}`}
                // Inline style removed, managed by CSS class
              >
                Giriş Yap
              </button>
              <button
                type="button"
                onClick={() => switchTab('signup')}
                className={`auth-tab ${activeTab === 'signup' ? 'auth-tab--active' : ''}`}
                // Inline style removed, managed by CSS class
              >
                Kayıt Ol
              </button>
            </div>

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="auth-form">
                <div>
                  <label className="auth-label" style={{ color: '#8279B9' }}>Kullanıcı Adı veya E-Posta</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="alexjordan veya alex@example.com"
                    className="auth-field"
                    // Inline style removed, managed by CSS class
                    required
                  />
                </div>
                <div>
                  <label className="auth-label" style={{ color: '#8279B9' }}>Şifre</label>
                  <div className="password-field">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      onCopy={(e) => e.preventDefault()}
                      onPaste={(e) => e.preventDefault()}
                      placeholder="Şifreniz"
                      className="auth-field"
                      // Inline style removed, managed by CSS class
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle"
                      style={{ color: '#8279B9' }}
                    >
                      {showPassword ? 'Gizle' : 'Göster'}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="auth-button">
                  {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                </button>
              </form>
            )}

            {activeTab === 'signup' && (
              <form onSubmit={handleSignUp} className="auth-form">
                <div className="form-row">
                  <div>
                    <label className="auth-label">Ad</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Alex"
                      className="auth-field"
                      // Inline style removed, managed by CSS class
                      required
                    />
                  </div>
                  <div>
                    <label className="auth-label">Soyad</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Johnson"
                      className="auth-field"
                      // Inline style removed, managed by CSS class
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div>
                    <label className="auth-label">Yaş</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      placeholder="30"
                      className="auth-field"
                      // Inline style removed, managed by CSS class
                      required
                    />
                  </div>
                  <div>
                    <label className="auth-label">Cinsiyet</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="auth-field"
                      // Inline style removed, managed by CSS class
                      required
                    >
                      <option value="">Seçin</option>
                      <option value="Male">Erkek</option>
                      <option value="Female">Kadın</option>
                      <option value="Other">Diğer</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="auth-label">E-posta</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="alex.johnson@example.com"
                    className="auth-field"
                    // Inline style removed, managed by CSS class
                    required
                  />
                </div>
                <div>
                  <label className="auth-label">Kullanıcı Adı</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="alexjordan"
                    className="auth-field"
                    // Inline style removed, managed by CSS class
                    required
                  />
                </div>
                <div>
                  <label className="auth-label">Şifre</label>
                  <div className="password-field">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      onCopy={(e) => e.preventDefault()}
                      onPaste={(e) => e.preventDefault()}
                      placeholder="Şifreniz"
                      className="auth-field"
                      // Inline style removed, managed by CSS class
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle"
                      style={{ color: '#8279B9' }}
                    >
                      {showPassword ? 'Gizle' : 'Göster'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="auth-label">Şifreyi Onayla</label>
                  <div className="password-field">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      onCopy={(e) => e.preventDefault()}
                      onPaste={(e) => e.preventDefault()}
                      placeholder="Şifrenizi tekrar girin"
                      className="auth-field"
                      // Inline style removed, managed by CSS class
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="password-toggle"
                      style={{ color: '#8279B9' }}
                    >
                      {showConfirmPassword ? 'Gizle' : 'Göster'}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="auth-button">
                  {loading ? 'Kayıt ediliyor...' : 'Kayıt Ol'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthEntry;