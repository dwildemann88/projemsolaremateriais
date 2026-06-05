import { X, Plus, MessageCircle } from 'lucide-react';
import { money } from '../services/cartService.js';

export default function ProductModal({ product, open, onClose, onAdd, onHelp }) {
  if (!open || !product) return null;
  const price = Number(product.price || 0);
  const tags = Array.isArray(product.tags) ? product.tags : [];

  function handleAdd() {
    onAdd(product);
    onClose();
  }

  return (
    <div className="product-modal" onClick={onClose} role="presentation">
      <article className="product-modal-card" onClick={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Detalhes de ${product.name}`}>
        <button className="icon-btn product-modal-close" type="button" onClick={onClose} aria-label="Fechar detalhes">
          <X size={20} />
        </button>

        <figure className="product-modal-photo">
          <img src={`/${product.image}`} alt={product.name} />
        </figure>

        <div className="product-modal-info">
          <span className="product-modal-category">{product.category || product.group_title || 'Produto'}</span>
          <h2>{product.name}</h2>
          <p>{product.description || 'Produto disponível para orçamento com a equipe Projem.'}</p>

          {tags.length > 0 && (
            <div className="product-tags" aria-label="Características do produto">
              {tags.slice(0, 6).map(tag => <span key={tag}>{tag}</span>)}
            </div>
          )}

          <div className="product-modal-price">
            <span>Valor estimado</span>
            <strong>{price ? money(price) : 'Sob consulta'}</strong>
            <small>A equipe confirma disponibilidade, valor final e condições de retirada ou entrega.</small>
          </div>

          <div className="product-modal-actions">
            <button className="btn btn-primary" type="button" onClick={handleAdd}><Plus size={18} /> Adicionar à lista</button>
            <button className="btn btn-outline" type="button" onClick={onHelp}><MessageCircle size={18} /> Tirar dúvida</button>
          </div>
        </div>
      </article>
    </div>
  );
}
