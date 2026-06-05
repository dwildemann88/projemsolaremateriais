import { Minus, Plus, X } from 'lucide-react';
import { money, getCartTotal } from '../services/cartService.js';

export default function CartDrawer({ open, cart, onClose, onRemove, onUpdateQty, onClear, onRequestQuote }) {
  return (
    <aside className={`cart-drawer ${open ? 'is-open' : ''}`} aria-hidden={!open} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="drawer-panel">
        <header className="drawer-head">
          <div>
            <span className="eyebrow">Orçamento</span>
            <h2>Sua lista</h2>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Fechar"><X size={22} /></button>
        </header>

        <div className="cart-list">
          {!cart.length ? <p className="empty">Sua lista está vazia.</p> : cart.map(item => (
            <article className="cart-item" key={item.id}>
              <div className="cart-main">
                <strong>{item.name}</strong>
                <button className="icon-btn small" type="button" onClick={() => onRemove(item.id)} aria-label={`Remover ${item.name}`}><X size={16} /></button>
              </div>
              <div className="cart-meta">
                <span>{Number(item.price || 0) ? money(item.price) : 'Sob consulta'}</span>
                <span className="qty-row">
                  <button type="button" onClick={() => onUpdateQty(item.id, item.quantity - 1)}><Minus size={14} /></button>
                  <strong>{item.quantity}</strong>
                  <button type="button" onClick={() => onUpdateQty(item.id, item.quantity + 1)}><Plus size={14} /></button>
                </span>
              </div>
            </article>
          ))}
        </div>

        <footer className="drawer-actions">
          <div className="cart-total">
            <span>Valor estimado</span>
            <strong>{money(getCartTotal(cart))}</strong>
          </div>
          <div className="drawer-buttons">
            <button type="button" className="btn btn-outline" onClick={onClear}>Limpar</button>
            <button type="button" className="btn btn-primary" onClick={onRequestQuote}>Solicitar orçamento</button>
          </div>
        </footer>
      </div>
    </aside>
  );
}
