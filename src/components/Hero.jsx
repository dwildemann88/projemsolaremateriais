import { MessageCircle, Search } from 'lucide-react';
import { openHelpWhatsapp } from '../services/cartService.js';

export default function Hero() {
  return (
    <section className="hero-section" id="topo">
      <div className="hero-copy">
        <span className="eyebrow">Orçamento online Projem</span>
        <h1>Peça orçamento de materiais sem perder tempo.</h1>
        <p>Escolha os produtos da lista, envie para a loja e continue o atendimento pelo WhatsApp com a equipe Projem.</p>
        <div className="hero-actions">
          <a className="btn btn-primary" href="#materiais"><Search size={18} /> Ver produtos</a>
          <button className="btn btn-outline" type="button" onClick={openHelpWhatsapp}><MessageCircle size={18} /> Não encontrei o que preciso</button>
        </div>
      </div>
      <div className="hero-card">
        <img src="/assets/img/banners/1.png" alt="Campanha Hexa com a Projem" />
      </div>
    </section>
  );
}
