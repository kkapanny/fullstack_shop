import { useNavigate } from 'react-router-dom';

export default function ProductItem({ product, onEdit, onDelete }) {
  const hasStock = Number(product.stock) > 0;
  const navigate = useNavigate();

  return (
    <div className="product-card product-card--clickable" onClick={() => navigate(`/product/${product.id}`)}>
      <h3 className="product-card__title">{product.name}</h3>
      <div className="product-card__category">{product.category}</div>
      <div className="product-card__price">
        {new Intl.NumberFormat('ru-RU').format(product.price)} ₽
      </div>
      <div className={hasStock ? 'in-stock' : 'out-of-stock'}>
        На складе: {product.stock} шт.
      </div>
      <p className="product-card__description">{product.description}</p>
      <div className="product-card__actions" onClick={(event) => event.stopPropagation()}>
        <button className="btn btn-primary btn-small" onClick={() => onEdit(product)}>
          Изменить
        </button>
        <button className="btn btn-danger btn-small" onClick={() => onDelete(product.id)}>
          Удалить
        </button>
      </div>
    </div>
  );
}
