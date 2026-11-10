# Camayenne Plage – site web

Site de **Camayenne Plage**, complexe de loisirs et d’événementiel en bord de mer à Conakry (Guinée).

**React + Vite** pour la structure, **Tailwind CSS** pour les classes, **fonctions Netlify** (JavaScript) pour le paiement d’acompte. Design sombre « plage de nuit » fidèle à la maquette d’origine.

## Ce que contient le projet

| Besoin | Solution | Où |
|---|---|---|
| Structure | React 19 + Vite 7, React Router | `src/` |
| Styles | Tailwind CSS 4 (jetons de couleurs et polices dans `@theme`) | `src/index.css`, classes dans les composants |
| Formulaire de devis | Web3Forms (e-mail sans serveur), repli `mailto:` | `src/components/DevisForm.jsx` |
| Administration (/admin) | Page réservée à l’équipe (mot de passe) : tableau de bord, demandes, statuts, acomptes. Demandes stockées dans une base PostgreSQL Neon rattachée à Vercel | `src/pages/Admin.jsx`, `netlify/functions/admin.mjs`, `netlify/functions/demande.mjs`, `netlify/lib/demandes.mjs` |
| Bouton WhatsApp flottant | lien `wa.me` avec message pré-rempli | `src/components/WhatsAppButton.jsx` |
| Carte | Google Maps intégrée (sans clé) + lien itinéraire | `src/components/Infos.jsx`, `src/config.js` |
| Vidéo | lecteur Facebook chargé au clic | `src/components/Video.jsx` |
| Paiement Orange Money (et carte si le compte le permet) | CinetPay, API v1 | `netlify/functions/paiement-cinetpay*.mjs`, `netlify/lib/payments.mjs` |
| SEO | balises Open Graph, `sitemap.xml`, `robots.txt`, Schema.org LocalBusiness | `index.html`, `public/` |
| Statistiques | Plausible (sans cookies) | `src/App.jsx` |
| Images | JPG + WebP, hero en deux tailles, chargement différé | `public/img`, `scripts/images.mjs` |
| Polices | Hanken Grotesk hébergée avec le site | `public/fonts`, `src/index.css` |
| Animations | Motion : apparitions, compteurs, menu, visionneuse, FAQ ; textes révélés au rythme du défilement | `src/components/motion.jsx`, `src/components/text.jsx` |
| Hébergement | Vercel (`vercel.json`, fonctions dans `api/`) ou Netlify (`netlify.toml`), Git + GitHub | racine du projet |

## Ouvrir dans VS Code et démarrer

Prérequis : Node.js 20 ou plus récent.

1. Décompressez l’archive, puis dans VS Code : *Fichier → Ouvrir le dossier…* → `camayenne-plage`.
2. Ouvrez le terminal de VS Code (*Terminal → Nouveau terminal*) et lancez :

```bash
npm install
```

```bash
npm run dev
```

3. Ouvrez http://localhost:5173. La page se recharge à chaque modification.

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement (site + fonctions de paiement sur `/api/…`) |
| `npm run build` | Compilation de production dans `dist/` |
| `npm run preview` | Aperçu de la version compilée sur http://localhost:4173 |
| `npm run images` | Régénère les WebP, le hero mobile et les icônes après ajout de photos |
| `VITE_ROUTER=hash npx vite build --base ./ --outDir dist-preview` | Version « aperçu » hébergeable sous un sous-chemin (routes par hachage) |

## Structure

```
index.html              page d’entrée Vite : balises SEO, Open Graph, Schema.org
src/main.jsx            démarrage React + React Router
src/App.jsx             routes : / (accueil), /devis, /paiement, /confirmation, 404
src/index.css           Tailwind, polices locales, jetons de design (@theme), styles de base
src/config.js           coordonnées, carte, vidéo, clés publiques (lues depuis .env)
src/data/content.js     textes : espaces, activités, offres, formules, galerie, FAQ, options du formulaire
src/components/         sections de l’accueil, formulaires, galerie, en-tête, pied de page, ui/ (boutons, champs…)
src/pages/              Home, Devis, Paiement, Confirmation, NotFound
public/img, public/fonts   photos (JPG + WebP), logo, icônes, polices
netlify/functions/      fonctions de paiement, servies sur /api/<nom>
netlify/lib/payments.mjs   logique CinetPay (Orange Money et carte), validation, enregistrement
api/                    mêmes fonctions pour Vercel (réutilisent netlify/functions via netlify/lib/node-adapter.mjs)
src/components/motion.jsx  briques d’animation (Reveal, Stagger, Counter)
scripts/images.mjs      génération des images
```

## Modifier le contenu

- **Coordonnées, carte, vidéo** : `src/config.js` (`mapQuery` pour la carte, `facebookVideo`).
- **Textes des sections** : `src/data/content.js`. Le mot du DG est dans `src/components/MotDuDG.jsx`.
- **Photos** : déposez le JPG dans `public/img/photos/`, lancez `npm run images`, puis utilisez le nom du fichier (sans `.jpg`) dans `content.js`.
- **Photo du DG** : remplacez le bloc « DG » dans `MotDuDG.jsx` par une balise `<img>`.
- **Couleurs et polices** : jetons `@theme` dans `src/index.css` (`--color-gold`, `--color-night`…), utilisés par les classes `text-gold`, `bg-night`, etc.
- **Domaine** : remplacez `https://www.camayenneplage.com` dans `index.html`, `public/sitemap.xml`, `public/robots.txt` et `.env`.

## Administration (/admin)

Adresse : `/admin` (pas de lien sur le site, page non indexée). Chaque demande envoyée par le formulaire de devis est enregistrée dans la base (en plus de l’e-mail Web3Forms) et apparaît dans la page.

- **Connexion** : mot de passe d’équipe `ADMIN_PASSWORD` (Vercel). 8 essais ratés au plus par quart d’heure et par adresse IP ; on reste connecté 30 jours. Changer le mot de passe dans Vercel puis redéployer déconnecte tout le monde.
- **Demandes** : statut, montant du devis, notes, suppression. Au passage à « Confirmé », deux boutons ouvrent un e-mail ou un message WhatsApp de confirmation déjà rédigé, envoyé depuis la messagerie de l’équipe.
- **Paiements** : saisie des acomptes reçus, case « Pointé » une fois vérifiés chez CinetPay ou Orange Money.
- **Base** : PostgreSQL Neon, créée depuis Vercel (*Storage*), qui fournit `DATABASE_URL`. Les tables se créent seules au premier appel. En local : `DATABASE_URL=pglite` lance une base embarquée en mémoire (vidée à chaque redémarrage).

## Variables d’environnement

Copiez `.env.example` en `.env` (jamais versionné). Sur Netlify : *Site configuration → Environment variables*.

| Variable | Rôle | Où l’obtenir |
|---|---|---|
| `VITE_SITE_URL` | URL publique du site | votre nom de domaine |
| `VITE_WEB3FORMS_KEY` | envoi du formulaire de devis par e-mail | https://web3forms.com (gratuit), clé créée avec `camayenneplagejpc224@gmail.com`. Sans clé, le bouton ouvre la messagerie du visiteur. |
| `VITE_PLAUSIBLE_DOMAIN` | statistiques sans cookies | https://plausible.io, ex. `camayenneplage.com` |
| `VITE_FACEBOOK_VIDEO` | vidéo du lecteur intégré | adresse de la vidéo Facebook |
| `VITE_FACEBOOK_PAGE`, `VITE_INSTAGRAM_PAGE`, `VITE_TIKTOK_PAGE` | icônes des réseaux dans le pied de page | adresses des pages officielles (icône masquée si vide) |
| `CINETPAY_API_KEY`, `CINETPAY_API_PASSWORD` | paiement en ligne (Orange Money, MTN) : clé `sk_live_…` et mot de passe API | tableau de bord marchand CinetPay (panel.cinetpay.net) ; une clé `sk_test_…` bascule sur le bac à sable |
| `CINETPAY_CARD` | `1` pour afficher l’option Carte bancaire, uniquement si CinetPay l’a activée sur le compte | à demander au commercial CinetPay |
| `VITE_ORANGE_MONEY_NUMBER` | numéro qui reçoit les acomptes Orange Money en mode manuel, tant que CinetPay n’est pas configuré | numéro Orange Money de l’entreprise, ex. `+224 620 613 554` |
| `SITE_URL` | URL publique pour les retours de paiement | identique à `VITE_SITE_URL` |
| `WEB3FORMS_KEY` | e-mail « Acompte reçu » à l’équipe (facultatif) | même clé Web3Forms |

Tant que les clés CinetPay sont vides, Orange Money fonctionne en mode manuel (transfert vers `VITE_ORANGE_MONEY_NUMBER` puis confirmation WhatsApp) et la carte bancaire est grisée « Bientôt disponible ». La carte reste grisée tant que `CINETPAY_CARD` ne vaut pas `1`.

## Paiement d’un acompte

Page `/paiement` : le client saisit nom, e-mail, référence du devis et montant, puis choisit le moyen.

1. **Orange Money** : `POST /api/paiement-cinetpay` se connecte à l’API CinetPay v1 (`/v1/oauth/login`, clé + mot de passe → jeton), crée la transaction (`/v1/payment`) et redirige le client vers la page de paiement CinetPay, où il valide sur son téléphone. CinetPay prévient `/api/paiement-cinetpay-notify` ; la fonction **revérifie** la transaction (`GET /v1/payment/{id}`) avant de l’enregistrer. Le client revient sur `/confirmation`, qui affiche l’état réel via `/api/paiement-statut`.
2. **Carte bancaire** : même page de paiement CinetPay. L’API v1 ne documente que le Mobile Money ; l’option n’apparaît sur le site que si `CINETPAY_CARD=1`, à activer après confirmation par CinetPay.

Chaque paiement confirmé est journalisé (Netlify → Logs → Functions) et, si `WEB3FORMS_KEY` est renseignée, un e-mail « Acompte reçu » part à l’équipe (`netlify/lib/payments.mjs`, fonction `recordPayment`, où brancher une base de données plus tard).

Montants acceptés : 50 000 à 500 000 000 GNF, modifiables dans `netlify/lib/payments.mjs` (CinetPay peut imposer son propre plafond par transaction). Pour tester sans débit, utilisez une clé `sk_test_…` : l’API bascule automatiquement sur le bac à sable.

## Mettre en ligne

### 1. Git et GitHub

Le dépôt Git est déjà initialisé avec un premier commit. Créez un dépôt vide sur GitHub, puis :

```bash
git remote add origin https://github.com/VOTRE-COMPTE/camayenne-plage.git
```

```bash
git push -u origin main
```

### 2. Vercel (gratuit pour un site vitrine)

1. Sur https://vercel.com/new, importez le dépôt GitHub : Vite est détecté, `vercel.json` gère le routage des pages et les en-têtes, les fonctions de paiement sont dans `api/`.
2. *Settings → Environment Variables* : ajoutez les variables du tableau ci-dessus (au moins `VITE_SITE_URL` et `SITE_URL` avec l’adresse `https://….vercel.app` ou votre domaine).
3. Déployez. Chaque `git push` sur `main` met le site à jour. Après un changement de variables, relancez un déploiement (*Deployments → Redeploy*).

### 2 bis. Netlify (alternative)

1. Sur https://app.netlify.com : *Add new site → Import an existing project* → votre dépôt GitHub. Les réglages sont lus dans `netlify.toml` (build `npm run build`, dossier `dist`, fonctions).
2. Ajoutez les variables d’environnement (tableau ci-dessus).
3. Déployez. Chaque `git push` sur `main` met le site à jour.

### 3. Nom de domaine et HTTPS

Achetez le domaine (OVH, Namecheap, Hostinger…), puis Vercel → *Settings → Domains* (ou Netlify → *Domain management*). L’hébergeur indique les enregistrements DNS et active le HTTPS automatiquement. Mettez ensuite à jour `VITE_SITE_URL`, `SITE_URL` et le domaine dans `index.html`, `sitemap.xml`, `robots.txt`.

### 4. Après la mise en ligne

- Google Search Console : déclarez le site et envoyez `https://votre-domaine/sitemap.xml`.
- CinetPay : faites un premier acompte réel au minimum (50 000 GNF) en Orange Money et en carte pour vérifier la chaîne complète, puis remboursez-le depuis l’espace marchand.
- Vérifiez la carte et la vidéo Facebook (si le lecteur reste vide, mettez dans `VITE_FACEBOOK_VIDEO` l’adresse complète de la vidéo, de la forme `https://www.facebook.com/<page>/videos/<id>/`).
