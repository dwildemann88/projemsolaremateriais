import { PROJEM_CONFIG as cfg } from './config.js';
import { onlyDigits, normalizeBRPhone, isValidCEP } from './validators.js';
import { buildCustomerMatchPayload, createEventId, trackEvent } from './analyticsService.js';

const nowIso = () => new Date().toISOString();

function cookie(name) {
  return document.cookie.split('; ').find(row => row.startsWith(name + '='))?.split('=')[1] || '';
}

export function hasValidCustomer(customer) {
  return Boolean(customer && String(customer.lead_id || '').trim() && String(customer.documento_normalizado || customer.document || customer.cpf_cnpj || '').trim());
}

export function getStoredCustomer() {
  try {
    const c = JSON.parse(localStorage.getItem(cfg.storageKeys.customer) || 'null');
    return hasValidCustomer(c) ? c : null;
  } catch {
    return null;
  }
}

export function saveCustomer(customer) {
  const normalized = normalizeCustomer(customer || {});
  if (!hasValidCustomer(normalized)) throw new Error('Cliente inválido: o Make precisa retornar lead_id e documento_normalizado antes de salvar.');
  localStorage.setItem(cfg.storageKeys.customer, JSON.stringify(normalized));
  return normalized;
}

export function clearCustomer() {
  localStorage.removeItem(cfg.storageKeys.customer);
}

function getUrlParams() {
  const p = new URLSearchParams(location.search || '');
  const pick = k => String(p.get(k) || '').trim();
  return {
    utm_source: pick('utm_source'),
    utm_medium: pick('utm_medium'),
    utm_campaign: pick('utm_campaign'),
    utm_content: pick('utm_content'),
    utm_term: pick('utm_term'),
    gclid: pick('gclid'),
    gbraid: pick('gbraid'),
    wbraid: pick('wbraid'),
    fbclid: pick('fbclid'),
    fbp: pick('fbp') || cookie('_fbp'),
    fbc: pick('fbc') || cookie('_fbc')
  };
}

function getStoredAttribution() {
  try { return JSON.parse(sessionStorage.getItem('projem_attribution_v1') || 'null') || {}; }
  catch { return {}; }
}

function saveAttribution(a) {
  try { sessionStorage.setItem('projem_attribution_v1', JSON.stringify(a)); } catch {}
  return a;
}

export function getAttribution() {
  const current = getUrlParams();
  const stored = getStoredAttribution();
  const merged = { ...stored };
  Object.entries(current).forEach(([k, v]) => { if (v) merged[k] = v; });
  if (!merged.first_page_url) merged.first_page_url = location.href;
  merged.page_url = location.href;
  merged.referrer = document.referrer || merged.referrer || '';
  merged.user_agent = navigator.userAgent || '';
  return saveAttribution(merged);
}

export function inferMediaOrigin(attribution = {}) {
  const source = String(attribution.utm_source || '').toLowerCase();
  const medium = String(attribution.utm_medium || '').toLowerCase();
  if (attribution.gclid || attribution.gbraid || attribution.wbraid) return 'google_ads';
  if (attribution.fbclid || attribution.fbp || attribution.fbc || ['facebook', 'fb', 'instagram', 'ig', 'meta'].includes(source)) return 'meta_ads';
  if (source || medium || attribution.utm_campaign) return 'campanha_nao_identificada';
  return 'organico';
}

export function formatAddress(customer = {}) {
  const street = customer.street || customer.rua || customer.endereco || '';
  const number = customer.number || customer.numero || '';
  const complement = customer.complement || customer.complemento || '';
  const district = customer.district || customer.bairro || '';
  const city = customer.city || customer.cidade || '';
  const state = customer.state || customer.uf || customer.estado || '';
  const cep = customer.cep || '';
  const streetLine = `${street}${number ? ', ' + number : ''}${complement ? ' - ' + complement : ''}`.trim();
  const districtLine = district ? ` - ${district}` : '';
  const cityLine = city || state ? ` - ${city || ''}/${state || ''}` : '';
  const cepLine = cep ? ` - CEP ${cep}` : '';
  return `${streetLine}${districtLine}${cityLine}${cepLine}`.replace(/^\s*-\s*/, '').trim();
}

export function normalizeCustomer(raw = {}) {
  const document = onlyDigits(raw.document || raw.cpf_cnpj || raw.cpf || raw.cnpj || raw.documento_normalizado);
  const phone = normalizeBRPhone(raw.phone || raw.telefone || raw.whatsapp || raw.telefone_normalizado);
  const attribution = { ...getAttribution(), ...(raw.attribution || {}) };
  const origem_midia = raw.origem_midia || inferMediaOrigin(attribution);
  const name = String(raw.name || raw.nome || '').trim();
  const state = String(raw.state || raw.uf || raw.estado || '').trim().toUpperCase().slice(0, 2);
  const street = String(raw.street || raw.rua || raw.logradouro || raw.endereco || '').trim();
  const number = String(raw.number || raw.numero || '').trim();
  const complement = String(raw.complement || raw.complemento || '').trim();
  const district = String(raw.district || raw.bairro || '').trim();
  const city = String(raw.city || raw.cidade || '').trim();
  const cep = onlyDigits(raw.cep);
  return {
    lead_id: String(raw.lead_id || '').trim(),
    customer_id: raw.customer_id || (document ? `doc_${document}` : ''),
    document,
    cpf_cnpj: document,
    documento_normalizado: document,
    document_type: document.length === 14 ? 'cnpj' : 'cpf',
    tipo_documento: document.length === 14 ? 'cnpj' : 'cpf',
    name,
    nome: name,
    email: String(raw.email || '').trim().toLowerCase(),
    phone,
    telefone: phone,
    telefone_normalizado: phone,
    cep,
    street,
    rua: street,
    endereco: street,
    number,
    numero: number,
    district,
    bairro: district,
    complement,
    complemento: complement,
    city,
    cidade: city,
    state,
    uf: state,
    estado: state,
    endereco_completo: raw.endereco_completo || formatAddress({ street, number, complement, district, city, state, cep }),
    registered_at: raw.registered_at || raw.cadastrado_em || raw.data_lead || nowIso(),
    data_lead: raw.data_lead || raw.registered_at || nowIso(),
    source: cfg.sourceSystem,
    sistema_origem: cfg.sourceSystem,
    origem_evento: cfg.sourceEvent,
    formulario_origem: raw.formulario_origem || 'catalogo_orcamento',
    tipo_registro: raw.tipo_registro || 'lead',
    status_lead: raw.status_lead || 'novo',
    origem_midia,
    attribution
  };
}

export function buildCustomerPayload(rawCustomer = {}) {
  const customer = normalizeCustomer(rawCustomer);
  const a = customer.attribution || getAttribution();
  const endereco = `${customer.street}, ${customer.number}${customer.complement ? ' - ' + customer.complement : ''}`.replace(/^,\s*/, '').trim();
  return {
    schema_version: cfg.schemaVersion,
    action: 'register_customer',
    tipo_registro: 'lead',
    sistema_origem: cfg.sourceSystem,
    origem_evento: cfg.sourceEvent,
    formulario_origem: 'catalogo_orcamento',
    data_lead: customer.data_lead,
    nome: customer.name,
    cpf_cnpj: customer.document,
    documento_normalizado: customer.documento_normalizado,
    tipo_documento: customer.tipo_documento,
    email: customer.email,
    telefone: customer.phone,
    telefone_normalizado: customer.telefone_normalizado,
    cep: customer.cep,
    endereco,
    rua: customer.street,
    numero: customer.number,
    complemento: customer.complement,
    bairro: customer.district,
    cidade: customer.city,
    estado: customer.state,
    uf: customer.state,
    endereco_completo: formatAddress(customer),
    origem_midia: customer.origem_midia,
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
    user_agent: a.user_agent || navigator.userAgent || '',
    status_lead: customer.status_lead || 'novo'
  };
}

export async function callMake(action, payload = {}) {
  const url = cfg.makeWebhookUrl;
  if (!url || url === 'COLE_AQUI_O_WEBHOOK_DO_MAKE') throw new Error('Webhook do Make não configurado.');
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...payload }) });
  let data = null;
  try { data = await response.json(); } catch { data = { success: response.ok }; }
  if (!response.ok) throw new Error(data?.message || 'Erro ao comunicar com o Make.');
  return data;
}

export async function lookupCustomer(document) {
  const normalizedDocument = onlyDigits(document);
  const a = getAttribution();
  const result = await callMake('lookup_customer', {
    schema_version: cfg.schemaVersion,
    tipo_registro: 'consulta_cadastro',
    sistema_origem: cfg.sourceSystem,
    origem_evento: cfg.sourceEvent,
    formulario_origem: 'catalogo_orcamento',
    cpf_cnpj: normalizedDocument,
    document: normalizedDocument,
    documento_normalizado: normalizedDocument,
    origem_midia: inferMediaOrigin(a),
    utm_source: a.utm_source || '',
    utm_medium: a.utm_medium || '',
    utm_campaign: a.utm_campaign || '',
    gclid: a.gclid || '',
    gbraid: a.gbraid || '',
    wbraid: a.wbraid || '',
    fbclid: a.fbclid || '',
    fbp: a.fbp || '',
    fbc: a.fbc || '',
    page_url: a.page_url || location.href
  });
  if (result?.exists === true || result?.found === true) {
    const raw = result.customer || result.data || {};
    const customer = normalizeCustomer({ ...raw, documento_normalizado: raw.documento_normalizado || normalizedDocument });
    if (!hasValidCustomer(customer)) {
      clearCustomer();
      throw new Error('O Make informou que o cadastro existe, mas não retornou lead_id. Corrija a rota lookup_customer.');
    }
    const saved = saveCustomer(customer);
    return { exists: true, customer: saved, source: 'make' };
  }
  clearCustomer();
  return { exists: false, customer: null, source: 'make' };
}

export async function registerCustomer(rawCustomer) {
  const base = normalizeCustomer(rawCustomer);
  const payload = buildCustomerPayload(base);
  const match = await buildCustomerMatchPayload(base);
  const registrationEventId = createEventId(cfg.events.generateLead);
  const registrationEventTime = Math.floor(Date.now() / 1000);

  const makeResult = await callMake('register_customer', {
    ...payload,
    event_payload: {
      event_name: cfg.events.generateLead,
      meta_event_name: 'CompleteRegistration',
      google_event_name: cfg.events.generateLead,
      event_id: registrationEventId,
      event_time: registrationEventTime,
      event_source_url: location.href,
      customer_id: base.customer_id,
      document_type: base.document_type,
      origem_evento: cfg.sourceEvent,
      origem_midia: base.origem_midia,
      fbp: payload.fbp,
      fbc: payload.fbc,
      fbclid: payload.fbclid,
      gclid: payload.gclid,
      gbraid: payload.gbraid,
      wbraid: payload.wbraid,
      ...match
    }
  });

  const returned = makeResult?.customer || makeResult?.data || {};
  const merged = normalizeCustomer({ ...base, ...returned, lead_id: returned.lead_id || makeResult?.lead_id || '' });
  if (!((makeResult?.registered === true || makeResult?.exists === true || makeResult?.success === true) && hasValidCustomer(merged))) {
    clearCustomer();
    throw new Error('O Make não confirmou o cadastro com lead_id. Não vou salvar cliente local nem abrir WhatsApp.');
  }

  const saved = saveCustomer(merged);
  trackEvent(cfg.events.generateLead, {
    event_id: registrationEventId,
    event_time: registrationEventTime,
    lead_id: saved.lead_id,
    customer_id: saved.customer_id,
    document_type: saved.document_type,
    method: 'customer_modal',
    origem_evento: cfg.sourceEvent,
    origem_midia: saved.origem_midia
  });
  return saved;
}

export async function fetchAddressByCEP(cep) {
  const clean = onlyDigits(cep);
  if (!isValidCEP(clean)) return null;
  const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
  const data = await r.json();
  if (data?.erro) return null;
  return { cep: clean, street: data.logradouro || '', district: data.bairro || '', city: data.localidade || '', state: data.uf || '' };
}
