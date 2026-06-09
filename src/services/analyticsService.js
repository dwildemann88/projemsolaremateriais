import { PROJEM_CONFIG as cfg } from './config.js';

function cleanPayload(payload = {}) {
  const copy = { ...payload };
  delete copy.cpf;
  delete copy.cnpj;
  delete copy.document;
  delete copy.email;
  delete copy.phone;
  return copy;
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
    document_hash: await sha256(String(customer.document || customer.documento_normalizado || '').replace(/\D/g, ''))
  };
}

export function trackEvent(name, payload = {}) {
  const safe = cleanPayload(payload);
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...safe });
  if (typeof window.gtag === 'function') window.gtag('event', name, safe);
  if (typeof window.fbq === 'function') {
    const metaMap = {
      [cfg.events.viewItem]: 'ViewContent',
      [cfg.events.addToCart]: 'AddToCart',
      [cfg.events.beginCheckout]: 'InitiateCheckout',
      [cfg.events.generateLead]: 'Lead',
      [cfg.events.metaLead]: 'Lead',
      [cfg.events.completeRegistration]: 'CompleteRegistration',
      [cfg.events.whatsappQuoteClick]: 'Contact'
    };
    window.fbq('track', metaMap[name] || name, safe);
  }
  window.dispatchEvent(new CustomEvent('projem:event', { detail: { name, payload: safe } }));
}
