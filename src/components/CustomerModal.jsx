import { useState } from 'react';
import { X } from 'lucide-react';
import { fetchAddressByCEP, lookupCustomer, registerCustomer } from '../services/customerService.js';
import { formatCEP, formatDocument, formatPhone, isValidCEP, isValidDocument, isValidEmail, isValidPhone, onlyDigits } from '../services/validators.js';

const initialForm = { document: '', name: '', phone: '', email: '', cep: '', street: '', number: '', complement: '', district: '', city: '', state: '', consent_data_use: true };

export default function CustomerModal({ open, onClose, onAuthenticated }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [checkedDocument, setCheckedDocument] = useState('');

  if (!open) return null;

  const setField = (name, value) => {
    let next = value;
    if (name === 'document') { next = formatDocument(value); setCheckedDocument(''); }
    if (name === 'phone') next = formatPhone(value);
    if (name === 'cep') next = formatCEP(value);
    if (name === 'state') next = value.toUpperCase().slice(0, 2);
    setForm(prev => ({ ...prev, [name]: next }));
  };

  const fail = message => { setError(message); setStatus(''); };
  const ok = message => { setStatus(message); setError(''); };

  async function handleDocument() {
    if (!isValidDocument(form.document)) return fail('Informe um CPF ou CNPJ válido.');
    setBusy(true); ok('Consultando cadastro...');
    try {
      const result = await lookupCustomer(form.document);
      if (result.exists) {
        ok('Cadastro encontrado. Enviando sua lista...');
        setTimeout(() => onAuthenticated(result.customer), 250);
        return;
      }
      setCheckedDocument(onlyDigits(form.document));
      ok('Cadastro não encontrado. Preencha os dados essenciais.');
      setStep(2);
    } catch (e) {
      fail(e.message || 'Não foi possível consultar. Tente novamente.');
    } finally { setBusy(false); }
  }

  async function handleCEPBlur() {
    if (!isValidCEP(form.cep)) return;
    ok('Buscando endereço...');
    try {
      const address = await fetchAddressByCEP(form.cep);
      if (!address) return fail('CEP não encontrado. Preencha o endereço manualmente.');
      setForm(prev => ({ ...prev, ...address, cep: formatCEP(address.cep) }));
      ok('Endereço preenchido. Confira o número.');
    } catch { fail('Não foi possível buscar o CEP. Preencha manualmente.'); }
  }

  function validateStep2() {
    if (String(form.name).trim().length < 3) return fail('Informe nome completo ou razão social.');
    if (!isValidPhone(form.phone)) return fail('Informe telefone com DDD.');
    if (!isValidEmail(form.email)) return fail('Informe um e-mail válido.');
    if (!isValidCEP(form.cep)) return fail('Informe um CEP válido.');
    if (!form.street || !form.number || !form.district || !form.city || !/^[A-Z]{2}$/i.test(form.state)) return fail('Complete endereço, número, bairro, cidade e UF.');
    setError(''); setStep(3);
  }

  async function finish() {
    if (checkedDocument !== onlyDigits(form.document)) { setStep(1); return fail('Confirme o CPF/CNPJ antes de continuar.'); }
    if (!form.consent_data_use) return fail('Confirme o uso dos dados para continuar.');
    setBusy(true); ok('Salvando cadastro...');
    try {
      const customer = await registerCustomer({ ...form, consent_data_use: true });
      ok('Cadastro finalizado. Enviando sua lista...');
      setTimeout(() => onAuthenticated(customer), 250);
    } catch (e) { fail(e.message || 'Erro ao salvar cadastro.'); }
    finally { setBusy(false); }
  }

  const input = (name, label, props = {}) => (
    <label>{label}
      <input value={form[name]} onChange={e => setField(name, e.target.value)} {...props} />
    </label>
  );

  return (
    <div className="modal is-open" aria-hidden="false" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="modal-card" onSubmit={e => e.preventDefault()}>
        <button className="icon-btn modal-close" type="button" onClick={onClose} aria-label="Fechar"><X size={20} /></button>
        <div className="modal-progress">
          {[1,2,3].map(n => <span key={n} className={`${step === n ? 'is-active' : ''} ${step > n ? 'is-done' : ''}`}>{n}</span>)}
        </div>

        {step === 1 && <section className="modal-step is-active">
          <span className="eyebrow">Identificação</span>
          <h2>Informe CPF ou CNPJ.</h2>
          <p>Usamos isso para consultar se você já tem cadastro de atendimento antes de registrar o orçamento.</p>
          {input('document', 'CPF/CNPJ', { inputMode: 'numeric', placeholder: '000.000.000-00', autoFocus: true })}
        </section>}

        {step === 2 && <section className="modal-step is-active">
          <span className="eyebrow">Dados essenciais</span>
          <h2>Confirme seus dados.</h2>
          <p>Essas informações são necessárias para atendimento, orçamento e retorno da equipe.</p>
          <div className="form-grid">
            {input('name', 'Nome completo ou razão social', { autoComplete: 'name' })}
            {input('phone', 'Telefone com DDD', { inputMode: 'tel', autoComplete: 'tel' })}
            {input('email', 'E-mail', { type: 'email', autoComplete: 'email' })}
            <label>CEP<input value={form.cep} onChange={e => setField('cep', e.target.value)} onBlur={handleCEPBlur} inputMode="numeric" autoComplete="postal-code" /></label>
            {input('street', 'Rua')}
            {input('number', 'Número')}
            {input('complement', 'Complemento')}
            {input('district', 'Bairro')}
            {input('city', 'Cidade')}
            {input('state', 'UF', { maxLength: 2 })}
          </div>
        </section>}

        {step === 3 && <section className="modal-step is-active">
          <span className="eyebrow">Revisão</span>
          <h2>Confira antes de enviar.</h2>
          <p>Depois da confirmação, sua lista será registrada e aberta no WhatsApp.</p>
          <div className="review-box">
            <div><strong>Nome</strong><span>{form.name || '-'}</span></div>
            <div><strong>Telefone</strong><span>{form.phone || '-'}</span></div>
            <div><strong>E-mail</strong><span>{form.email || '-'}</span></div>
            <div><strong>Endereço</strong><span>{`${form.street}, ${form.number}${form.complement ? ' - ' + form.complement : ''}`}</span></div>
            <div><strong>Cidade/UF</strong><span>{form.city}/{form.state}</span></div>
          </div>
          <label className="check-row"><input type="checkbox" checked={form.consent_data_use} onChange={e => setForm(prev => ({ ...prev, consent_data_use: e.target.checked }))} /><span>Confirmo o uso dos dados para atendimento, orçamento e contato pela Projem.</span></label>
        </section>}

        {status && <p className="modal-status">{status}</p>}
        {error && <p className="modal-status is-error">{error}</p>}

        <div className="modal-actions">
          {step > 1 && <button className="btn btn-outline" type="button" onClick={() => setStep(step - 1)} disabled={busy}>Voltar</button>}
          <button className="btn btn-primary" type="button" disabled={busy} onClick={step === 1 ? handleDocument : step === 2 ? validateStep2 : finish}>{step === 3 ? 'Confirmar e enviar' : 'Continuar'}</button>
        </div>
      </form>
    </div>
  );
}
