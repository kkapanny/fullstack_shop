import { useEffect, useState } from 'react';
import { api } from '../../api';
import ProductsList from '../../components/ProductsList';
import ProductModal from '../../components/ProductModal';
import UsersPage from '../UsersPage/UsersPage';
import './ProductsPage.css';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('products');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    loadMe();
    loadProducts();
  }, []);

  async function loadMe() {
    try {
      const me = await api.me();
      setUser(me);
    } catch (error) {
      console.error(error);
      api.clearTokens();
      window.location.href = '/login';
    }
  }

  async function loadProducts() {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      alert('Ошибка загрузки товаров');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    if (!['seller', 'admin'].includes(user?.role)) {
      alert('Создавать товары может только продавец или администратор');
      return;
    }
    setModalMode('create');
    setEditingProduct(null);
    setModalOpen(true);
  }

  function openEdit(product) {
    if (!['seller', 'admin'].includes(user?.role)) {
      alert('Редактировать товары может только продавец или администратор');
      return;
    }
    setModalMode('edit');
    setEditingProduct(product);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingProduct(null);
  }

  async function handleDelete(id) {
    if (!['seller', 'admin'].includes(user?.role)) {
      alert('Удалять товары может только продавец или администратор');
      return;
    }
    if (!window.confirm('Удалить товар?')) return;
    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error(error);
      alert('Ошибка удаления товара');
    }
  }

  async function handleSubmit(payload) {
    try {
      if (modalMode === 'create') {
        const created = await api.createProduct(payload);
        setProducts((prev) => [...prev, created.data]);
      } else {
        const updated = await api.updateProduct(payload.id, payload);
        setProducts((prev) =>
          prev.map((item) => (item.id === payload.id ? updated.data : item)),
        );
      }
      closeModal();
    } catch (error) {
      console.error(error);
      alert('Ошибка сохранения товара');
    }
  }

  function logout() {
    api.clearTokens();
    window.location.href = '/login';
  }

  return (
    <div className="page">
      <header>
        <h1>Aevum</h1>
        <p>Онлайн-магазин уходовой косметики</p>
      </header>
      <main>
        <div className="container">
          <section className="items">
            <div className="toolbar">
              <h2>{activeView === 'products' ? 'Товары' : 'Пользователи'}</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {activeView === 'products' && ['seller', 'admin'].includes(user?.role) && (
                  <button className="btn btn-primary" onClick={openCreate}>
                    + Добавить
                  </button>
                )}
                {user?.role === 'admin' && (
                  <button className="btn" onClick={() => setActiveView(activeView === 'products' ? 'users' : 'products')}>
                    {activeView === 'products' ? 'Пользователи' : 'Товары'}
                  </button>
                )}
                <button className="btn" onClick={logout}>Выйти</button>
              </div>
            </div>
            <div style={{ marginBottom: '0.5rem', color: '#666' }}>
              Пользователь: {user?.first_name} {user?.last_name} ({user?.role})
            </div>
            {activeView === 'products' ? (
              loading ? (
                <div className="loading">Загрузка...</div>
              ) : (
                <ProductsList
                  products={products}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  canEdit={['seller', 'admin'].includes(user?.role)}
                  canDelete={['seller', 'admin'].includes(user?.role)}
                />
              )
            ) : (
              user?.role === 'admin' ? <UsersPage /> : <div className="empty-state">Недостаточно прав</div>
            )}
          </section>
        </div>
      </main>
      <footer>
        <p>| http://localhost:5173 (React)</p>
        <p>API: http://localhost:3000/api/products</p>
      </footer>
      <ProductModal
        open={modalOpen}
        mode={modalMode}
        initialProduct={editingProduct}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
