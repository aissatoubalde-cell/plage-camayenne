# Tableau de bord Camayenne Plage (Google Sheets)

Une feuille Google privée qui reçoit automatiquement chaque demande de devis du site, avec trois onglets :

| Onglet | Contenu | Qui le remplit |
|---|---|---|
| **Tableau de bord** | Indicateurs du mois, demandes par mois (graphique), types d'événements, prochains événements sur 30 jours | Calculé tout seul |
| **Demandes** | Une ligne par demande, la plus récente en haut | Colonnes vertes : le site. Colonnes jaunes (Statut, Devis, Notes) : le gérant |
| **Paiements** | Une ligne par acompte reçu, case « Pointé » | Le gérant, pour l'instant |

Gratuit : ni Make, ni abonnement Web3Forms. L'e-mail de chaque demande continue d'arriver comme avant ; la feuille en reçoit une copie.

## Installation (une seule fois, 10 minutes)

Tout se fait connecté au compte Google **camayenneplagejpc224@gmail.com**, pour que la feuille appartienne à Camayenne Plage.

1. Ouvrir https://sheets.new : une feuille vide se crée.
2. Menu **Extensions → Apps Script**. Un éditeur de code s'ouvre dans un nouvel onglet.
3. Effacer le contenu de `Code.gs`, puis y coller tout le fichier [`suivi.gs`](suivi.gs). Cliquer sur l'icône disquette (Enregistrer).
4. En haut, choisir la fonction **`installer`** dans la liste, puis cliquer sur **Exécuter**.
   - Google demande une autorisation : *Examiner les autorisations* → choisir le compte → *Paramètres avancés* → *Accéder au projet (non sécurisé)* → *Autoriser*. C'est normal pour un script personnel qui n'est pas publié sur le store Google.
5. Revenir sur la feuille : les trois onglets sont prêts.
6. Retour dans Apps Script : **Déployer → Nouveau déploiement**.
   - Roue dentée → **Application Web**.
   - *Exécuter en tant que* : **Moi**.
   - *Qui peut accéder* : **Tout le monde** (indispensable pour que le site puisse écrire ; la feuille elle-même reste privée).
   - **Déployer**, puis copier l'**URL de l'application Web** (elle finit par `/exec`).
7. Vérifier : coller cette URL dans un navigateur. La page doit afficher « Feuille de suivi Camayenne Plage : en service. »
8. Donner cette URL à l'équipe du site (ou l'ajouter vous-même dans Vercel, étape suivante).

## Brancher le site (Vercel)

1. Vercel → projet **plage-camayenne** → *Settings → Environment Variables*.
2. Ajouter `VITE_SHEET_URL` = l'URL `/exec` de l'étape 6, pour *Production* et *Preview*.
3. *Deployments* → dernier déploiement → **Redeploy** (les variables `VITE_` ne sont prises en compte qu'à la compilation).
4. Envoyer une demande de test depuis la page Devis du site : une ligne apparaît en haut de l'onglet **Demandes** en quelques secondes. Supprimer ensuite cette ligne.

Pour tester la feuille sans passer par le site : dans Apps Script, exécuter la fonction **`testerUneDemande`**.

## Partager avec le gérant et la direction

Bouton **Partager** de la feuille, en invitant chaque personne par son adresse Gmail :

- Gérant : **Éditeur** (il change les statuts, les montants, les notes, et remplit Paiements).
- Direction : **Lecteur**.
- Laisser *Accès général* sur **Limité** : le lien ne fonctionne que pour les personnes invitées.

Les colonnes remplies par le site et l'onglet Tableau de bord sont protégés : seul le propriétaire peut les modifier, le gérant ne peut pas les effacer par erreur. L'historique des versions (*Fichier → Historique des versions*) garde toutes les modifications.

## Donner l'accès à l'administrateur ou au gérant

1. Ouvrir la feuille avec le compte propriétaire, puis cliquer sur **Partager** (en haut à droite).
2. Saisir l'adresse Gmail de la personne, choisir **Éditeur**, puis **Envoyer**.
3. La personne reçoit un e-mail « … vous a partagé Suivi Camayenne Plage » : elle clique sur **Ouvrir**.
4. Ensuite, la feuille est dans son Google Drive, rubrique **Partagés avec moi**, et dans l'appli **Google Sheets** sur téléphone (même compte Google). Conseil : l'ajouter en favori (étoile à côté du titre).

Le lien de la feuille ne fonctionne que pour les personnes invitées ; laisser *Accès général* sur **Limité**.

## Au quotidien

- Nouvelle demande : elle arrive avec le statut **Nouvelle**. Le gérant le fait évoluer dans la liste déroulante : *Contacté → Devis envoyé → Acompte reçu → Confirmé*, ou *Annulé*.
- **Passer une demande à « Confirmé » envoie automatiquement un e-mail de confirmation au client** (événement, date, participants, espaces, montant du devis s'il est rempli). Une note apparaît sur la cellule Statut avec la date d'envoi ; repasser à « Confirmé » plus tard ne renvoie rien. L'e-mail part du compte Google propriétaire de la feuille, au nom de « Camayenne Plage », et les réponses du client arrivent sur camayenneplagejpc224@gmail.com. Pour voir l'e-mail sans l'envoyer à un client : dans Apps Script, exécuter **testerEmailConfirmation** (il arrive dans votre propre boîte).
- Acompte reçu : ajouter une ligne dans **Paiements** (date, client, référence, montant, moyen), puis cocher **Pointé** après vérification dans CinetPay ou Orange Money.
- Le **Tableau de bord** se met à jour tout seul.

## Si on modifie le script plus tard

Après toute modification de `suivi.gs` dans Apps Script : **Déployer → Gérer les déploiements → crayon → Version : Nouvelle version → Déployer**. L'URL reste la même, rien à changer côté site.

Relancer `installer` est sans risque : il remet en forme les onglets sans effacer les demandes ni les paiements.

## Sécurité

- L'URL `/exec` est visible dans le code du site : n'importe qui pourrait l'appeler. Le script refuse donc les envois sans nom ou sans e-mail valide, ignore les robots (piège du formulaire), coupe les textes trop longs, neutralise tout ce qui ressemble à une formule, et accepte au plus 30 demandes par heure.
- L'URL permet seulement d'**ajouter** une demande : elle ne donne accès ni à la lecture de la feuille, ni à sa modification.
