import { MapPin, MessageCircle, ShieldCheck, Store } from 'lucide-react';

const items = [
  { icon: Store, title: 'Loja física', text: 'Atendimento direto com a Projem Materiais.' },
  { icon: MessageCircle, title: 'WhatsApp', text: 'Sua lista vai pronta para a equipe.' },
  { icon: ShieldCheck, title: 'Dados protegidos', text: 'Uso apenas para orçamento e atendimento.' },
  { icon: MapPin, title: 'Santa Rosa/RS', text: 'Materiais elétricos e hidráulicos.' }
];

export default function TrustStrip() {
  return (
    <section className="trust-strip" id="confianca">
      {items.map(({ icon: Icon, title, text }) => (
        <article key={title}>
          <Icon size={22} />
          <strong>{title}</strong>
          <span>{text}</span>
        </article>
      ))}
    </section>
  );
}
