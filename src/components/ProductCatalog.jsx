import { Search } from 'lucide-react';
import ProductCard from './ProductCard.jsx';

const groupMeta = {
  eletrica: { title: 'Elétrica', description: 'Entradas de energia, cabos, iluminação e medição.' },
  hidraulica: { title: 'Hidráulica', description: 'Tubos, muretas, torneiras e conexões.' },
  iluminacao: { title: 'Iluminação', description: 'Lâmpadas e refletores.' },
  manutencao: { title: 'Ferramentas', description: 'Ferramentas e itens de manutenção.' },
  dia_a_dia: { title: 'Dia a dia', description: 'Produtos úteis para casa, banho, piscina e rotina.' },
  obra: { title: 'Obra e acabamento', description: 'Materiais para vedação, acabamento e construção.' },
  seguranca: { title: 'EPI e segurança', description: 'Itens de proteção e segurança para trabalho.' },
  outros: { title: 'Outros materiais', description: 'Itens diversos para orçamento.' }
};

const groupOrder = ['eletrica', 'hidraulica', 'iluminacao', 'manutencao', 'dia_a_dia', 'obra', 'seguranca', 'outros'];

function normalizeGroup(product) {
  const text = [product.name, product.category, product.description, product.tags?.join(' ')].join(' ').toLowerCase();
  if (/lâmpada|lampada|refletor|ilumina/.test(text)) return 'iluminacao';
  if (product.group && groupMeta[product.group]) return product.group;
  if (/botina|epi|segurança|seguranca/.test(text)) return 'seguranca';
  return product.group || 'outros';
}

function grouped(list) {
  const map = new Map();
  list.forEach(product => {
    const key = normalizeGroup(product);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push({ ...product, group: key, group_title: groupMeta[key]?.title || groupMeta.outros.title });
  });
  return [...map.entries()].sort((a, b) => {
    const ia = groupOrder.indexOf(a[0]);
    const ib = groupOrder.indexOf(b[0]);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
}

export default function ProductCatalog({ products, query, setQuery, activeGroup, setActiveGroup, onAdd, onHelp, onOpenProduct }) {
  const allGroups = grouped(products);
  const filteredByText = products.filter(product => [product.name, product.category, product.description, product.group, product.tags?.join(' ')].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
  const filtered =
  activeGroup === 'todos'
    ? filteredByText
    : activeGroup === 'promocoes'
      ? filteredByText.filter(product => product.isPromotion === true)
      : filteredByText.filter(product => normalizeGroup(product) === activeGroup);
  const groupedFiltered = grouped(filtered);

  return (
    <section className="section products-section" id="materiais">
      <div className="section-title">
        <span className="eyebrow">Catálogo</span>
        <h2>Escolha os materiais para orçamento.</h2>
        <p>Os valores podem variar. A equipe confirma disponibilidade, preço final e condições de compra.</p>
      </div>

      <div className="search-panel">
        <Search size={20} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar produto, marca ou uso: cabo, tubo, chuveiro..." />
      </div>

      <div className="category-tabs" aria-label="Categorias">
        <button
  className={activeGroup === 'todos' ? 'is-active' : ''}
  onClick={() => setActiveGroup('todos')}
>
  Todos <small>{products.length}</small>
</button>

<button
  className={activeGroup === 'promocoes' ? 'is-active' : ''}
  onClick={() => setActiveGroup('promocoes')}
>
  Promoções <small>{products.filter(product => product.isPromotion === true).length}</small>
</button>

{allGroups.map(([key, items]) => (
          <button key={key} className={activeGroup === key ? 'is-active' : ''} onClick={() => setActiveGroup(key)}>
            {groupMeta[key]?.title || 'Outros'} <small>{items.length}</small>
          </button>
        ))}
      </div>

      {!filtered.length ? (
        <div className="empty-state">
          <h3>Nenhum material encontrado.</h3>
          <p>Isso não significa que a loja não tenha o item. Chame a equipe e envie o que você precisa.</p>
          <button className="btn btn-primary" onClick={onHelp}>Pedir ajuda no WhatsApp</button>
        </div>
      ) : groupedFiltered.map(([key, items]) => (
        <section className="product-group" key={key}>
          <header className="product-group-header">
            <div>
              <h3>{groupMeta[key]?.title || 'Outros materiais'}</h3>
              <p>{groupMeta[key]?.description || 'Itens diversos para orçamento.'}</p>
            </div>
            <span>{items.length} {items.length === 1 ? 'item' : 'itens'}</span>
          </header>
          <div className="products-grid">
            {items.map(product => <ProductCard key={product.id} product={product} onAdd={onAdd} onOpen={onOpenProduct} />)}
          </div>
        </section>
      ))}
    </section>
  );
}
