import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import '../ProductsPage/ProductsPage.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'buyer',
  });
  const [loading, setLoading] = useState(false);

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setLoading(true);
      await api.register(form);
      await api.login({ email: form.email, password: form.password });
      navigate('/');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header>
        <h1>Aevum</h1>
        <p>Регистрация</p>
      </header>
      <main>
        <div className="container">
          <section className="items">
            <div className="product-detail__card">
              <form className="modal__form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={(event) => setField('email', event.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Имя</label>
                  <input value={form.first_name} onChange={(event) => setField('first_name', event.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Фамилия</label>
                  <input value={form.last_name} onChange={(event) => setField('last_name', event.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Пароль</label>
                  <input type="password" value={form.password} onChange={(event) => setField('password', event.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Роль (для тестов)</label>
                  <select value={form.role} onChange={(event) => setField('role', event.target.value)}>
                    <option value="buyer">Покупатель</option>
                    <option value="seller">Продавец</option>
                    <option value="admin">Администратор</option>
                  </select>
                </div>
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Создание...' : 'Создать аккаунт'}
                </button>
              </form>
              <p style={{ marginTop: '0.5rem' }}>
                Уже есть аккаунт? <Link to="/login">Войти</Link>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
