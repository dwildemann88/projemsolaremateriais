import { MessageCircle, ShoppingBasket } from 'lucide-react';
import { openHelpWhatsapp } from '../services/cartService.js';

export default function Header({ cartCount, onOpenCart }) {
  return (
    <header className="site-header">
      <a className="brand" href="#topo" aria-label="Projem Materiais">
        <img src="/assets/img/logo-simbolo.png" alt="Projem Materiais" />
      </a>
      <nav className="main-nav" aria-label="Navegação principal">
        <a href="#materiais">Produtos</a>
        <a href="#como-funciona">Como funciona</a>
        <a href="#confianca">Confiança</a>
      </nav>
      <div className="header-actions">
        <button className="header-help" type="button" onClick={openHelpWhatsapp}>
          <MessageCircle size={18} />
          <span>Ajuda</span>
        </button>
        <button className="cart-button" type="button" onClick={onOpenCart}>
          <ShoppingBasket size={18} />
          <span>Lista</span>
          <strong>{cartCount}</strong>
        </button>
      </div>
    </header>
  );
}
