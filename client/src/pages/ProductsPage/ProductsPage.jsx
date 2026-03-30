import { useEffect, useState } from 'react';
import { api } from '../../api';
import ProductsList from '../../components/ProductsList';
import ProductModal from '../../components/ProductModal';
import './ProductsPage.css';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

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
    setModalMode('create');
    setEditingProduct(null);
    setModalOpen(true);
  }

  function openEdit(product) {
    setModalMode('edit');
    setEditingProduct(product);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingProduct(null);
  }

  async function handleDelete(id) {
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
              <h2>Товары</h2>
              <button className="btn btn-primary" onClick={openCreate}>
                + Добавить
              </button>
            </div>
            {loading ? (
              <div className="loading">Загрузка...</div>
            ) : (
              <ProductsList products={products} onEdit={openEdit} onDelete={handleDelete} />
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
