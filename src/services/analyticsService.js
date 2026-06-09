import { PROJEM_CONFIG as cfg } from './config.js';

function createEventId(name = 'event') {
  const cleanName = String(name || 'event').replace(/[^a-zA-Z0-9_]/g, '_');
  return `${cleanName}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function cleanPayload(payload = {}) {
  const copy = { ...payload };
  delete copy.cpf;
  delete copy.cnpj;
  delete copy.document;
  delete copy.email;
  delete copy.phone;
  delete copy.telefone;
  delete copy.cpf_cnpj;
  delete copy.documento_normalizado;
  return copy;
}

function getMetaEventName(name) {
  const metaMap = {
    [cfg.events.pageView]: 'PageView',
    [cfg.events.viewItem]: 'ViewContent',
    [cfg.events.addToCart]: 'AddToCart',
    [cfg.events.beginCheckout]: 'InitiateCheckout',
    [cfg.events.generateLead]: 'CompleteRegistration',
    [cfg.events.quoteRequested]: 'Lead',
    [cfg.events.metaLead]: 'Lead',
    [cfg.events.completeRegistration]: 'CompleteRegistration',
    [cfg.events.whatsappQuoteClick]: 'Contact'
  };
  return metaMap[name] || name;
}

export async function sha256(value) {
  if (!value || !window.crypto?.subtle) return '';
  const normalized = String(value).trim().toLowerCase();
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function buildCustomerMatchPayload(customer = {}) {
  return {
    email_hash: await sha256(customer.email || ''),
    phone_hash: await sha256(String(customer.phone || customer.telefone || '').replace(/\D/g, '')),
    document_hash: await sha256(String(customer.document || customer.documento_normalizado || customer.cpf_cnpj || '').replace(/\D/g, ''))
  };
}

export function buildProductEventPayload(product = {}, quantity = 1) {
  const price = Number(product.price || 0);
  const qty = Number(quantity || 1);
  return {
    item_id: product.id || '',
    item_name: product.name || '',
    item_category: product.category || product.group_title || product.group || '',
    value: price * qty,
    currency: 'BRL',
    quantity: qty,
    items: [{
      item_id: product.id || '',
      item_name: product.name || '',
      item_category: product.category || product.group_title || product.group || '',
      price,
      quantity: qty
    }]
  };
}

export function trackEvent(name, payload = {}) {
  const event_id = payload.event_id || payload.eventId || createEventId(name);
  const safe = { event_id, ...cleanPayload(payload) };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...safe });

  if (typeof window.gtag === 'function') {
    window.gtag('event', name, safe);
  }

  if (typeof window.fbq === 'function') {
    const metaEventName = getMetaEventName(name);
    const method = ['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Lead', 'CompleteRegistration', 'Contact'].includes(metaEventName)
      ? 'track'
      : 'trackCustom';
    window.fbq(method, metaEventName, safe, { eventID: event_id });
  }

  window.dispatchEvent(new CustomEvent('projem:event', { detail: { name, payload: safe } }));
  return safe;
}
