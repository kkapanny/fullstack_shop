import { useEffect, useState } from 'react';

const INITIAL_STATE = {
  title: '',
  category: 'Очищение',
  description: '',
  price: '',
  stock: '',
};

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
  const [form, setForm] = useState(INITIAL_STATE);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initialProduct) {
      setForm({
        title: initialProduct.title || initialProduct.name || '',
        category: initialProduct.category || 'Очищение',
        description: initialProduct.description || '',
        price: String(initialProduct.price ?? ''),
        stock: String(initialProduct.stock ?? ''),
      });
      return;
    }
    setForm(INITIAL_STATE);
  }, [open, mode, initialProduct]);

  if (!open) return null;

  const title = mode === 'edit' ? 'Редактировать товар' : 'Добавить товар';

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (!form.title.trim()) return alert('Введите название');
    if (!form.category.trim()) return alert('Введите категорию');
    if (!form.description.trim()) return alert('Введите описание');
    if (!Number.isFinite(price) || price <= 0) return alert('Цена должна быть больше 0');
    if (!Number.isInteger(stock) || stock < 0) return alert('Количество на складе должно быть >= 0');

    onSubmit({
      id: initialProduct?.id,
      title: form.title.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      price,
      stock,
    });
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal__header">
          <h3>{title}</h3>
          <button className="btn btn-small" onClick={onClose}>
            Закрыть
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal__form">
          <div className="form-group">
            <label>Название</label>
            <input value={form.title} onChange={(event) => setField('title', event.target.value)} />
          </div>
          <div className="form-group">
            <label>Категория</label>
            <input value={form.category} onChange={(event) => setField('category', event.target.value)} />
          </div>
          <div className="form-group">
            <label>Описание</label>
            <textarea value={form.description} onChange={(event) => setField('description', event.target.value)} />
          </div>
          <div className="form-group">
            <label>Цена (₽)</label>
            <input
              type="number"
              value={form.price}
              onChange={(event) => setField('price', event.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Количество на складе</label>
            <input
              type="number"
              value={form.stock}
              onChange={(event) => setField('stock', event.target.value)}
            />
          </div>
          <div className="modal__actions">
            <button className="btn btn-primary" type="submit">
              {mode === 'edit' ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
