// Chemin d’un fichier de public/ qui respecte la base de déploiement ("/" en production, "./" pour un aperçu sous un sous-chemin).
export const asset = (p) => import.meta.env.BASE_URL + String(p).replace(/^\//, "");
