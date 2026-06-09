import { PROJEM_CONFIG as cfg } from './config.js';
import { normalizeCustomer, hasValidCustomer, clearCustomer, getAttribution, inferMediaOrigin, formatAddress } from './customerService.js';
import { trackEvent } from './analyticsService.js';

export const money = value => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const nowIso = () => new Date().toISOString();

export function normalizeQuoteItems(cart = []) {
  return cart.map((item, index) => {
    const valor_unitario = Number(item.price || 0);
    const quantidade = Number(item.quantity || 1);
    const subtotal = valor_unitario * quantidade;
    return {
      ordem: index + 1,
      item_id: item.id || '',
      nome: item.name || '',
      categoria: item.category || '',
      grupo: item.group || '',
      quantidade,
      valor_unitario,
      subtotal,
      observacao: valor_unitario ? '' : 'sob consulta'
    };
  });
}

export function buildQuoteItemsText(items = []) {
  return items.map(item => {
    const priceText = item.valor_unitario ? `${money(item.valor_unitario)} un. | subtotal ${money(item.subtotal)}` : 'sob consulta';
    return `${item.ordem}. ${item.quantidade}x ${item.nome}\n   Valor estimado: ${priceText}`;
  }).join('\n');
}

export function buildQuoteText(customer, cart = []) {
  const c = normalizeCustomer(customer || {});
  return [
    `Olá, Me chamo ${c.name || '-'}. Quero solicitar um orçamento. `,
    `LISTA DE MATERIAIS`,
    buildQuoteItemsText(normalizeQuoteItems(cart)),
    ``,
    ``,
    `Aguardo confirmação de disponibilidade, valores finais e prazo de entrega/retirada.`
  ].join('\n');
}

export function getCartCount(cart = []) {
  return cart.reduce((t, i) => t + Number(i.quantity || 1), 0);
}

export function getCartTotal(cart = []) {
  return cart.reduce((t, i) => t + (Number(i.price || 0) * Number(i.quantity || 1)), 0);
}

export function buildQuotePayload(customer, cart = []) {
  const c = normalizeCustomer(customer || {});
  const a = getAttribution();
  const items = normalizeQuoteItems(cart);
  const data_orcamento = nowIso();
  return {
    schema_version: cfg.schemaVersion,
    action: 'quote_requested',
    tipo_registro: 'orcamento',
    sistema_origem: cfg.sourceSystem,
    origem_evento: cfg.sourceEvent,
    formulario_origem: 'catalogo_orcamento',
    data_orcamento,
    orcamento_id: `orc_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    lead_id: c.lead_id,
    customer_id: c.customer_id,
    nome: c.name,
    cpf_cnpj: c.document,
    documento_normalizado: c.documento_normalizado,
    tipo_documento: c.tipo_documento,
    email: c.email,
    telefone: c.phone,
    telefone_normalizado: c.telefone_normalizado,
    cep: c.cep,
    endereco: `${c.street}, ${c.number}${c.complement ? ' - ' + c.complement : ''}`.replace(/^,\s*/, '').trim(),
    rua: c.street,
    numero: c.number,
    complemento: c.complement,
    bairro: c.district,
    cidade: c.city,
    estado: c.state,
    uf: c.state,
    endereco_completo: formatAddress(c),
    itens: items,
    itens_json: JSON.stringify(items),
    itens_texto: buildQuoteItemsText(items),
    quantidade_itens: getCartCount(cart),
    valor_estimado: getCartTotal(cart),
    moeda: 'BRL',
    status_orcamento: 'orcamento_solicitado',
    origem_midia: c.origem_midia || inferMediaOrigin(a),
    utm_source: a.utm_source || '',
    utm_medium: a.utm_medium || '',
    utm_campaign: a.utm_campaign || '',
    utm_content: a.utm_content || '',
    utm_term: a.utm_term || '',
    gclid: a.gclid || '',
    gbraid: a.gbraid || '',
    wbraid: a.wbraid || '',
    fbclid: a.fbclid || '',
    fbp: a.fbp || '',
    fbc: a.fbc || '',
    first_page_url: a.first_page_url || '',
    page_url: a.page_url || location.href,
    referrer: a.referrer || document.referrer || '',
    user_agent: a.user_agent || navigator.userAgent || ''
  };
}

export async function submitQuote(customer, cart = []) {
  if (!cart.length) throw new Error('Adicione pelo menos um material antes de solicitar o orçamento.');
  if (!hasValidCustomer(customer)) {
    clearCustomer();
    throw new Error('Confirme seu cadastro antes de enviar o orçamento.');
  }
  const payload = buildQuotePayload(customer, cart);
  if (!payload.lead_id) throw new Error('Orçamento bloqueado: lead_id ausente.');
  const url = cfg.makeWebhookUrl;
  if (url && url !== 'COLE_AQUI_O_WEBHOOK_DO_MAKE') {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    let result = null;
    try { result = await response.json(); } catch { result = { success: response.ok }; }
    if (!response.ok || result?.success === false) throw new Error(result?.message || 'Não foi possível registrar o orçamento no Make.');
  }
  trackEvent(cfg.events.quoteRequested, {
    lead_id: payload.lead_id,
    customer_id: payload.customer_id,
    value: payload.valor_estimado,
    currency: 'BRL',
    items_count: payload.quantidade_itens,
    origem_evento: payload.origem_evento,
    origem_midia: payload.origem_midia
  });
  const text = encodeURIComponent(buildQuoteText(normalizeCustomer(customer || {}), cart));
  const whatsappUrl = `https://wa.me/${cfg.whatsappNumber}?text=${text}`;
  trackEvent(cfg.events.whatsappQuoteClick, {
    lead_id: payload.lead_id,
    customer_id: payload.customer_id,
    value: payload.valor_estimado,
    currency: 'BRL',
    origem_evento: payload.origem_evento,
    origem_midia: payload.origem_midia
  });
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  return payload;
}

export function openHelpWhatsapp() {
  const text = encodeURIComponent('Olá, não encontrei o material que preciso no catálogo. Pode me ajudar?');
  window.open(`https://wa.me/${cfg.whatsappNumber}?text=${text}`, '_blank', 'noopener,noreferrer');
}
