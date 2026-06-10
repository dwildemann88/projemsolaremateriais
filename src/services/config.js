export const PROJEM_CONFIG = {
  makeWebhookUrl: 'https://hook.us2.make.com/7bpxb6ucj9tmc3aqotnnejftz9nnc9an',
  whatsappNumber: '55559145022',
  companyName: 'Projem Materiais',
  schemaVersion: 'orcamento_lead_v3',
  sourceSystem: 'catalogo_orcamento_projem',
  sourceEvent: 'pagina_orcamento',
  storageKeys: {
    customer: 'projem_customer_v4',
    cart: 'projem_cart_v2'
  },
  events: {
    pageView: 'page_view',
    viewItem: 'view_item',
    addToCart: 'add_to_cart',
    removeFromCart: 'remove_from_cart',
    beginCheckout: 'begin_checkout',
    generateLead: 'generate_lead',
    metaLead: 'Lead',
    completeRegistration: 'complete_registration',
    customerLogin: 'customer_login',
    quoteRequested: 'quote_requested',
    whatsappQuoteClick: 'whatsapp_quote_click',
    helpWhatsappClick: 'help_whatsapp_click'
  }
};
