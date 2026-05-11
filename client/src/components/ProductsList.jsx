import ProductItem from './ProductItem';

export default function ProductsList({ products, onEdit, onDelete, canEdit, canDelete }) {
  if (!products.length) {
    return <div className="empty-state">Товаров пока нет</div>;
  }

  return (
    <div className="products-grid">
      {products.map((product) => (
        <ProductItem
          key={product.id}
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ))}
    </div>
  );
}
