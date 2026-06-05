import { Plus, Eye } from 'lucide-react';
import { money } from '../services/cartService.js';

export default function ProductCard({ product, onAdd, onOpen }) {
  const price = Number(product.price || 0);

  function handleAdd(event) {
    event.stopPropagation();
    onAdd(product);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen?.(product);
    }
  }

  return (
    <article
      className="product-card"
      role="button"
      tabIndex="0"
      onClick={() => onOpen?.(product)}
      onKeyDown={handleKeyDown}
      aria-label={`Ver detalhes de ${product.name}`}
    >
      <figure className="product-photo">
        <img src={`/${product.image}`} alt={product.name} loading="lazy" />
      </figure>
      <div className="product-info">
        <span>{product.category || product.group_title || 'Produto'}</span>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <strong>{price ? money(price) : 'Sob consulta'}</strong>
        <small className="product-view-hint"><Eye size={13} /> Toque para ver detalhes</small>
      </div>
      <button type="button" className="btn btn-card" onClick={handleAdd}>
        <Plus size={17} /> Adicionar
      </button>
    </article>
  );
}
