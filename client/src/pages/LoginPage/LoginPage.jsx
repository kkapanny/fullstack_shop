import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import '../ProductsPage/ProductsPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setLoading(true);
      await api.login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      navigate('/');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header>
        <h1>Aevum</h1>
        <p>Вход в систему</p>
      </header>
      <main>
        <div className="container">
          <section className="items">
            <div className="product-detail__card">
              <form className="modal__form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setField('email', event.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Пароль</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => setField('password', event.target.value)}
                    required
                  />
                </div>
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Вход...' : 'Войти'}
                </button>
              </form>
              <p style={{ marginTop: '0.5rem' }}>
                Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
