import { useNavigate } from 'react-router-dom';

export default function ProductItem({ product, onEdit, onDelete, canEdit, canDelete }) {
  const hasStock = Number(product.stock) > 0;
  const navigate = useNavigate();

  return (
    <div className="product-card product-card--clickable" onClick={() => navigate(`/product/${product.id}`)}>
      <h3 className="product-card__title">{product.title || product.name}</h3>
      <div className="product-card__category">{product.category}</div>
      <div className="product-card__price">
        {new Intl.NumberFormat('ru-RU').format(product.price)} ₽
      </div>
      <div className={hasStock ? 'in-stock' : 'out-of-stock'}>
        В наличии: {product.stock} шт.
      </div>
      <p className="product-card__description">{product.description}</p>
      {(canEdit || canDelete) && (
        <div className="product-card__actions" onClick={(event) => event.stopPropagation()}>
          {canEdit && (
            <button className="btn btn-primary btn-small" onClick={() => onEdit(product)}>
              Изменить
            </button>
          )}
          {canDelete && (
            <button className="btn btn-danger btn-small" onClick={() => onDelete(product.id)}>
              Удалить
            </button>
          )}
        </div>
      )}
    </div>
  );
}
