import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import '../ProductsPage/ProductsPage.css';

export default function ProductCardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [id]);

  async function loadProduct() {
    try {
      setLoading(true);
      const data = await api.getProductById(id);
      setProduct(data);
    } catch (error) {
      console.error(error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!product) return;
    if (!window.confirm('Удалить товар?')) return;
    try {
      await api.deleteProduct(product.id);
      navigate('/');
    } catch (error) {
      console.error(error);
      alert('Ошибка удаления');
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
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              ← Назад к товарам
            </button>
            {loading ? (
              <div className="loading">Загрузка...</div>
            ) : !product ? (
              <div className="empty-state">Товар не найден</div>
            ) : (
              <div className="product-detail__card">
                <h2 className="product-card__title">{product.name}</h2>
                <div className="product-card__category">{product.category}</div>
                <div className="product-card__price">
                  {new Intl.NumberFormat('ru-RU').format(product.price)} ₽
                </div>
                <div className={Number(product.stock) > 0 ? 'in-stock' : 'out-of-stock'}>
                  {Number(product.stock) > 0 ? `В наличии: ${product.stock} шт.` : 'Нет в наличии'}
                </div>
                <p className="product-card__description">{product.description}</p>
                <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>ID: {product.id}</div>
                <div className="product-card__actions">
                  <button className="btn btn-danger" onClick={handleDelete}>
                    Удалить товар
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
