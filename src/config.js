// Réglages publics (variables VITE_* de .env, visibles dans le navigateur : jamais de secret ici).
export const site = {
  name: "Camayenne Plage",
  url: (import.meta.env.VITE_SITE_URL || "https://www.camayenneplage.com").replace(/\/$/, ""),
  phone: "+224 620 613 554",
  phoneE164: "+224620613554",
  whatsapp: "224620613554",
  email: "camayenneplagejpc224@gmail.com",
  address: "Camayenne, Conakry – Guinée",
  mapQuery: "Camayenne Plage, Dixinn, Conakry, Guinée",
  facebookVideo: import.meta.env.VITE_FACEBOOK_VIDEO || "https://www.facebook.com/share/v/1D1iJD4rRG/",
  // Pages officielles : les icônes du pied de page n’apparaissent que si l’adresse est renseignée.
  social: {
    facebook: import.meta.env.VITE_FACEBOOK_PAGE || "",
    instagram: import.meta.env.VITE_INSTAGRAM_PAGE || "",
    tiktok: import.meta.env.VITE_TIKTOK_PAGE || "",
  },
  web3formsKey: import.meta.env.VITE_WEB3FORMS_KEY || "",
  plausibleDomain: import.meta.env.VITE_PLAUSIBLE_DOMAIN || "",
  paymentApi: "/api",
  // VITE_PAYMENT_DEMO=1 : la page Paiement affiche le formulaire complet et simule le paiement, sans clé ni débit.
  paymentDemo: import.meta.env.VITE_PAYMENT_DEMO === "1",
};

export const whatsappLink = (text) => `https://wa.me/${site.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
export const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(site.mapQuery)}&z=15&output=embed`;
export const mapDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(site.mapQuery)}`;
