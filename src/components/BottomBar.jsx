import { MessageCircle, ShoppingBasket } from 'lucide-react';

export default function BottomBar({ cartCount, onOpenCart, onHelp }) {
  return (
    <div className="bottom-bar">
      <button type="button" className="bottom-secondary" onClick={onHelp}><MessageCircle size={18} /> Ajuda</button>
      <button type="button" className="bottom-primary" onClick={onOpenCart}><ShoppingBasket size={18} /> Lista {cartCount > 0 && <strong>{cartCount}</strong>}</button>
    </div>
  );
}
