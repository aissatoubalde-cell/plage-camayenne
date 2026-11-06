# Camayenne Plage – site web

Site de **Camayenne Plage**, complexe de loisirs et d’événementiel en bord de mer à Conakry (Guinée).

**React + Vite** pour la structure, **Tailwind CSS** pour les classes, **fonctions Netlify** (JavaScript) pour le paiement d’acompte. Design sombre « plage de nuit » fidèle à la maquette d’origine.

## Ce que contient le projet

| Besoin | Solution | Où |
|---|---|---|
| Structure | React 19 + Vite 7, React Router | `src/` |
| Styles | Tailwind CSS 4 (jetons de couleurs et polices dans `@theme`) | `src/index.css`, classes dans les composants |
| Formulaire de devis | Web3Forms (e-mail sans serveur), repli `mailto:` | `src/components/DevisForm.jsx` |
| Bouton WhatsApp flottant | lien `wa.me` avec message pré-rempli | `src/components/WhatsAppButton.jsx` |
| Carte | Google Maps intégrée (sans clé) + lien itinéraire | `src/components/Infos.jsx`, `src/config.js` |
| Vidéo | lecteur Facebook chargé au clic | `src/components/Video.jsx` |
| Paiement Orange Money / MTN MoMo | CinetPay | `netlify/functions/paiement-cinetpay*.mjs` |
| Paiement par carte | Stripe Checkout + webhook | `netlify/functions/paiement-stripe*.mjs` |
| SEO | balises Open Graph, `sitemap.xml`, `robots.txt`, Schema.org LocalBusiness | `index.html`, `public/` |
| Statistiques | Plausible (sans cookies) | `src/App.jsx` |
| Images | JPG + WebP, hero en deux tailles, chargement différé | `public/img`, `scripts/images.mjs` |
| Polices | Hanken Grotesk et Yellowtail hébergées avec le site | `public/fonts`, `src/index.css` |
| Hébergement | Netlify (site + fonctions), Git + GitHub | `netlify.toml` |

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

## Structure

```
index.html              page d’entrée Vite : balises SEO, Open Graph, Schema.org
src/main.jsx            démarrage React + React Router
src/App.jsx             routes : / (accueil), /paiement, /confirmation, 404
src/index.css           Tailwind, polices locales, jetons de design (@theme), styles de base
src/config.js           coordonnées, carte, vidéo, clés publiques (lues depuis .env)
src/data/content.js     textes : espaces, activités, offres, formules, galerie, FAQ, options du formulaire
src/components/         sections de l’accueil, formulaires, galerie, en-tête, pied de page, ui/ (boutons, champs…)
src/pages/              Home, Paiement, Confirmation, NotFound
public/img, public/fonts   photos (JPG + WebP), logo, icônes, polices
netlify/functions/      fonctions de paiement, servies sur /api/<nom>
netlify/lib/payments.mjs   logique CinetPay, Stripe, validation, enregistrement
scripts/images.mjs      génération des images
```

## Modifier le contenu

- **Coordonnées, carte, vidéo** : `src/config.js` (`mapQuery` pour la carte, `facebookVideo`).
- **Textes des sections** : `src/data/content.js`. Le mot du DG est dans `src/components/MotDuDG.jsx`.
- **Photos** : déposez le JPG dans `public/img/photos/`, lancez `npm run images`, puis utilisez le nom du fichier (sans `.jpg`) dans `content.js`.
- **Photo du DG** : remplacez le bloc « DG » dans `MotDuDG.jsx` par une balise `<img>`.
- **Couleurs et polices** : jetons `@theme` dans `src/index.css` (`--color-gold`, `--color-night`…), utilisés par les classes `text-gold`, `bg-night`, etc.
- **Domaine** : remplacez `https://www.camayenneplage.com` dans `index.html`, `public/sitemap.xml`, `public/robots.txt` et `.env`.

## Variables d’environnement

Copiez `.env.example` en `.env` (jamais versionné). Sur Netlify : *Site configuration → Environment variables*.

| Variable | Rôle | Où l’obtenir |
|---|---|---|
| `VITE_SITE_URL` | URL publique du site | votre nom de domaine |
| `VITE_WEB3FORMS_KEY` | envoi du formulaire de devis par e-mail | https://web3forms.com (gratuit), clé créée avec `camayenneplagejpc224@gmail.com`. Sans clé, le bouton ouvre la messagerie du visiteur. |
| `VITE_PLAUSIBLE_DOMAIN` | statistiques sans cookies | https://plausible.io, ex. `camayenneplage.com` |
| `VITE_FACEBOOK_VIDEO` | vidéo du lecteur intégré | adresse de la vidéo Facebook |
| `CINETPAY_API_KEY`, `CINETPAY_SITE_ID` | Orange Money et MTN Mobile Money | https://cinetpay.com, espace marchand → Intégration |
| `STRIPE_SECRET_KEY` | paiement par carte | https://dashboard.stripe.com/apikeys (`sk_test_…` pour tester) |
| `STRIPE_WEBHOOK_SECRET` | confirmation fiable des paiements carte | Stripe → Développeurs → Webhooks → `https://votre-domaine/api/paiement-stripe-webhook`, événement `checkout.session.completed` |
| `STRIPE_CURRENCY` | devise carte | `gnf` par défaut ; `eur` ou `usd` si votre compte Stripe refuse le GNF |
| `SITE_URL` | URL publique pour les retours de paiement | identique à `VITE_SITE_URL` |
| `WEB3FORMS_KEY` | e-mail « Acompte reçu » à l’équipe (facultatif) | même clé Web3Forms |

Tant que les clés de paiement sont vides, la page `/paiement` affiche « Le paiement en ligne arrive » avec les boutons WhatsApp et Appeler.

## Paiement d’un acompte

Page `/paiement` : le client saisit nom, e-mail, référence du devis et montant, puis choisit le moyen.

1. **Orange Money / MTN MoMo** : `POST /api/paiement-cinetpay` crée la transaction et redirige vers CinetPay. CinetPay prévient `/api/paiement-cinetpay-notify` ; la fonction **revérifie** la transaction auprès de CinetPay avant de l’enregistrer. Le client revient sur `/confirmation`.
2. **Carte bancaire** : `POST /api/paiement-stripe` crée une session Stripe Checkout. Le webhook `/api/paiement-stripe-webhook` confirme le paiement.

Chaque paiement confirmé est journalisé (Netlify → Logs → Functions) et, si `WEB3FORMS_KEY` est renseignée, un e-mail « Acompte reçu » part à l’équipe (`netlify/lib/payments.mjs`, fonction `recordPayment`, où brancher une base de données plus tard).

Montants acceptés : 50 000 à 500 000 000 GNF (10 à 50 000 en euros ou dollars), modifiables dans `netlify/lib/payments.mjs`. Test Stripe sans débit : clé `sk_test_…` et carte `4242 4242 4242 4242`.

## Mettre en ligne

### 1. Git et GitHub

Le dépôt Git est déjà initialisé avec un premier commit. Créez un dépôt vide sur GitHub, puis :

```bash
git remote add origin https://github.com/VOTRE-COMPTE/camayenne-plage.git
```

```bash
git push -u origin main
```

### 2. Netlify (gratuit pour un site vitrine)

1. Sur https://app.netlify.com : *Add new site → Import an existing project* → votre dépôt GitHub. Les réglages sont lus dans `netlify.toml` (build `npm run build`, dossier `dist`, fonctions).
2. Ajoutez les variables d’environnement (tableau ci-dessus).
3. Déployez. Chaque `git push` sur `main` met le site à jour.

### 3. Nom de domaine et HTTPS

Achetez le domaine (OVH, Namecheap, Hostinger…), puis Netlify → *Domain management → Add a domain*. Netlify indique les enregistrements DNS et active le HTTPS automatiquement. Mettez ensuite à jour `VITE_SITE_URL`, `SITE_URL` et le domaine dans `index.html`, `sitemap.xml`, `robots.txt`.

### 4. Après la mise en ligne

- Google Search Console : déclarez le site et envoyez `https://votre-domaine/sitemap.xml`.
- Stripe : créez le webhook avec l’URL de production et renseignez `STRIPE_WEBHOOK_SECRET`.
- Vérifiez la carte et la vidéo Facebook (si le lecteur reste vide, mettez dans `VITE_FACEBOOK_VIDEO` l’adresse complète de la vidéo, de la forme `https://www.facebook.com/<page>/videos/<id>/`).
