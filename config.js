/**
 * Configuração do Mapa do Ciclo Amoroso
 * Altere preços e checkout sem mexer no resto do código.
 */
window.MAPA_CONFIG = {
  productName: "Mapa Completo do Ciclo Amoroso",
  price: 29.9,
  priceAnchor: 79.9, // null para esconder ancoragem
  showPriceAnchor: true,
  currency: "BRL",
  checkoutUrl: "https://checkout.perfectpay.com.br/pay/PPU38CQEJJH",
  // Order bump (Diário R$14,90) configurado no checkout PerfectPay — não pré-marcar
  orderBumpPrice: 14.9,
  // Upsell pós-compra (Plano 28 dias) — URL dedicada quando existir
  upsellPrice: 59.9,
  upsellCheckoutUrl: "",
  guaranteeDays: 7,
  // A/B e campanha (também lidos da URL)
  headlineVariant: "A", // A | B
  creativeId: "",
  campaignId: "",
  adsetId: "",
  // Supabase analytics
  supabaseUrl: "https://nrdwnrdbocivrcaujqey.supabase.co",
  supabaseAnonKey: "sb_publishable_RO2B7XCTosTdDTCPpMNAjA_iZP68utA",
  timezoneLabel: "America/Sao_Paulo",
  // Meta Pixel
  metaPixelId: "4427665624163520",
};

// Overrides por query string: ?price=19.90&headline=B&checkout=URL
(function applyUrlOverrides() {
  try {
    var p = new URLSearchParams(location.search);
    var c = window.MAPA_CONFIG;
    if (p.get("price")) c.price = parseFloat(p.get("price")) || c.price;
    if (p.get("anchor")) c.priceAnchor = parseFloat(p.get("anchor")) || c.priceAnchor;
    if (p.get("headline") === "B") c.headlineVariant = "B";
    if (p.get("checkout")) c.checkoutUrl = p.get("checkout");
    if (p.get("creative")) c.creativeId = p.get("creative");
    if (p.get("campaign")) c.campaignId = p.get("campaign");
    if (p.get("adset")) c.adsetId = p.get("adset");
    // Persist UTMs
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"].forEach(function (k) {
      if (p.get(k)) {
        try {
          sessionStorage.setItem("mapa_" + k, p.get(k));
          localStorage.setItem("mapa_" + k, p.get(k));
        } catch (e) {}
      }
    });
  } catch (e) {}
})();
