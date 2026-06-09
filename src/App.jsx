import { useEffect, useMemo, useState } from 'react';
import productsData from './data/products.json';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import TrustStrip from './components/TrustStrip.jsx';
import CampaignBanner from './components/CampaignBanner.jsx';
import BannerCarousel from './components/BannerCarousel.jsx';
import ProductCatalog from './components/ProductCatalog.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import CustomerModal from './components/CustomerModal.jsx';
import BottomBar from './components/BottomBar.jsx';
import ProductModal from './components/ProductModal.jsx';
import { PROJEM_CONFIG as cfg } from './services/config.js';
import { clearCustomer, getStoredCustomer, hasValidCustomer } from './services/customerService.js';
import { getCartCount, getCartTotal, openHelpWhatsapp, submitQuote } from './services/cartService.js';
import { trackEvent } from './services/analyticsService.js';
import './styles.css';

function loadCart() {
  try { return JSON.parse(localStorage.getItem(cfg.storageKeys.cart) || '[]'); }
  catch { return []; }
}

export default function App() {
  const [cart, setCart] = useState(loadCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState('todos');
  const [toast, setToast] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const products = useMemo(() => productsData.map(p => ({ ...p, image: p.image?.replace('assets/img/products/', 'assets/img/products/') })), []);
  const cartCount = getCartCount(cart);

  useEffect(() => { localStorage.setItem(cfg.storageKeys.cart, JSON.stringify(cart)); }, [cart]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 1800);
    return () => clearTimeout(timer);
  }, [toast]);

  function addProduct(product) {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      const next = existing ? prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i) : [...prev, { ...product, quantity: 1 }];
      return next;
    });
    setToast(`${product.name} adicionado à lista.`);
    trackEvent(cfg.events.addToCart, { item_id: product.id, item_name: product.name, item_category: product.category, value: Number(product.price || 0), currency: 'BRL', quantity: 1 });
  }

  function removeProduct(productId) {
    const item = cart.find(p => p.id === productId);
    setCart(prev => prev.filter(p => p.id !== productId));
    if (item) trackEvent(cfg.events.removeFromCart, { item_id: item.id, item_name: item.name, item_category: item.category, value: Number(item.price || 0), currency: 'BRL', quantity: item.quantity });
  }

  function updateQty(productId, quantity) {
    if (quantity <= 0) return removeProduct(productId);
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity: Math.max(1, Number(quantity || 1)) } : item));
  }

  function openProduct(product) {
    setSelectedProduct(product);
    trackEvent(cfg.events.viewItem, {
      item_id: product.id,
      item_name: product.name,
      item_category: product.category,
      value: Number(product.price || 0),
      currency: 'BRL'
    });
  }

  async function requestQuote() {
    if (!cart.length) { setToast('Adicione pelo menos um material.'); return; }
    const storedCustomer = getStoredCustomer();
    trackEvent(cfg.events.beginCheckout, {
      items_count: cartCount,
      value: getCartTotal(cart),
      currency: 'BRL',
      has_customer: Boolean(storedCustomer && hasValidCustomer(storedCustomer))
    });
    if (!hasValidCustomer(storedCustomer)) {
      clearCustomer();
      setCustomerOpen(true);
      return;
    }
    try { await submitQuote(storedCustomer, cart); }
    catch (error) { setToast(error.message || 'Não foi possível enviar.'); }
  }

  async function handleAuthenticated(customer) {
    setCustomerOpen(false);
    try { await submitQuote(customer, cart); }
    catch (error) { setToast(error.message || 'Não foi possível enviar.'); }
  }

  return (
    <>
      <Header cartCount={cartCount} onOpenCart={() => setCartOpen(true)} />
      <main>
        <Hero />
        <BannerCarousel />
        <TrustStrip />
        <CampaignBanner />
        <section className="section compact" id="como-funciona">
          <div className="section-title">
            <span className="eyebrow">Como funciona</span>
            <h2>Três passos, sem enrolação.</h2>
          </div>
          <div className="steps-grid">
            <article><strong>1</strong><h3>Escolha os itens</h3><p>Adicione materiais na lista de orçamento.</p></article>
            <article><strong>2</strong><h3>Confirme seus dados</h3><p>O cadastro é consultado ou criado antes do envio.</p></article>
            <article><strong>3</strong><h3>Envie pelo WhatsApp</h3><p>A equipe recebe sua lista e continua o atendimento.</p></article>
          </div>
        </section>
        <ProductCatalog products={products} query={query} setQuery={setQuery} activeGroup={activeGroup} setActiveGroup={setActiveGroup} onAdd={addProduct} onHelp={openHelpWhatsapp} onOpenProduct={openProduct} />
        <section className="privacy-note">
          <strong>Privacidade e LGPD</strong>
          <p>Os dados informados são usados para identificação do atendimento, envio do orçamento, contato comercial e melhoria da experiência. Recomenda-se publicar a política completa em uma rota separada, como <code>/privacidade</code>.</p>
        </section>
      </main>
      <CartDrawer open={cartOpen} cart={cart} onClose={() => setCartOpen(false)} onRemove={removeProduct} onUpdateQty={updateQty} onClear={() => setCart([])} onRequestQuote={requestQuote} />
      <CustomerModal open={customerOpen} onClose={() => setCustomerOpen(false)} onAuthenticated={handleAuthenticated} />
      <ProductModal product={selectedProduct} open={Boolean(selectedProduct)} onClose={() => setSelectedProduct(null)} onAdd={addProduct} onHelp={openHelpWhatsapp} />
      <BottomBar cartCount={cartCount} onOpenCart={() => setCartOpen(true)} onHelp={openHelpWhatsapp} />
      {toast && <div className="toast is-visible"><strong>{toast}</strong></div>}
    </>
  );
}
