import { PROJEM_CONFIG as cfg } from './config.js';

const META_EVENT_MAP = {
  [cfg.events.viewItem]: 'ViewContent',
  [cfg.events.addToCart]: 'AddToCart',
  [cfg.events.beginCheckout]: 'InitiateCheckout',
  [cfg.events.generateLead]: 'CompleteRegistration',
  [cfg.events.completeRegistration]: 'CompleteRegistration',
  [cfg.events.quoteRequested]: 'Lead',
  [cfg.events.whatsappQuoteClick]: 'Contact',
  [cfg.events.helpWhatsappClick]: 'Contact'
};

const SENSITIVE_KEYS = new Set([
  'cpf',
  'cnpj',
  'document',
  'documento_normalizado',
  'cpf_cnpj',
  'email',
  'phone',
  'telefone',
  'telefone_normalizado'
]);

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizePhone(value) {
  return onlyDigits(value);
}

export function createEventId(prefix = 'event') {
  const safePrefix = String(prefix || 'event').replace(/[^a-z0-9_:-]/gi, '_').toLowerCase();
  const random = Math.random().toString(16).slice(2);
  return `${safePrefix}_${Date.now()}_${random}`;
}

function cleanPayload(payload = {}) {
  const copy = { ...payload };
  SENSITIVE_KEYS.forEach(key => delete copy[key]);
  return copy;
}

function getBasePayload(name, payload = {}) {
  const eventId = payload.event_id || createEventId(name);
  return {
    ...payload,
    event_id: eventId,
    event_time: payload.event_time || Math.floor(Date.now() / 1000),
    event_source_url: payload.event_source_url || window.location.href
  };
}

function pushDataLayer(name, safe = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...safe });
}

function sendGtag(name, safe = {}) {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', name, safe);
}

function sendMetaEvent(name, safe = {}, attempt = 0) {
  const metaName = META_EVENT_MAP[name];
  if (!metaName) return;

  if (typeof window.fbq !== 'function') {
    if (attempt < 3) {
      window.setTimeout(() => sendMetaEvent(name, safe, attempt + 1), 500);
    }
    return;
  }

  const { event_id: eventID, ...metaPayload } = safe;
  window.fbq('track', metaName, metaPayload, { eventID });
}

export async function sha256(value) {
  if (!value || !window.crypto?.subtle) return '';
  const normalized = String(value).trim().toLowerCase();
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function buildCustomerMatchPayload(customer = {}) {
  return {
    email_hash: await sha256(normalizeEmail(customer.email || '')),
    phone_hash: await sha256(normalizePhone(customer.phone || customer.telefone || customer.telefone_normalizado || '')),
    document_hash: await sha256(onlyDigits(customer.document || customer.documento_normalizado || customer.cpf_cnpj || ''))
  };
}

export function trackEvent(name, payload = {}) {
  const fullPayload = getBasePayload(name, payload);
  const safe = cleanPayload(fullPayload);

  pushDataLayer(name, safe);
  sendGtag(name, safe);
  sendMetaEvent(name, safe);

  window.dispatchEvent(new CustomEvent('projem:event', { detail: { name, payload: safe } }));
  return safe;
}
