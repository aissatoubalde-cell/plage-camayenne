/**
 * Camayenne Plage · feuille de suivi des demandes et des acomptes (Google Sheets + Apps Script).
 *
 * À coller dans Extensions → Apps Script d'une feuille Google vide, sur le compte camayenneplagejpc224@gmail.com.
 * Mode d'emploi complet : tableau-de-bord/LISEZMOI.md dans le dépôt du site.
 *
 * - installer() : crée les onglets Tableau de bord, Demandes et Paiements (en-têtes, listes déroulantes,
 *   couleurs, formules, graphique, protections). À lancer une seule fois ; le relancer ne supprime aucune donnée.
 * - doPost(e) : reçoit chaque demande envoyée par le formulaire « Demander un devis » du site et l'ajoute
 *   en haut de l'onglet Demandes.
 *
 * Les formules sont écrites en syntaxe anglaise (virgules) : c'est ce qu'attend Apps Script,
 * Google Sheets les affiche ensuite en français.
 */

const ONGLET_BORD = "Tableau de bord";
const ONGLET_DEMANDES = "Demandes";
const ONGLET_PAIEMENTS = "Paiements";

const STATUTS = ["Nouvelle", "Contacté", "Devis envoyé", "Acompte reçu", "Confirmé", "Annulé"];
const COULEURS_STATUT = {
  "Nouvelle": ["#dfe9fb", "#1d5fb5"],
  "Contacté": ["#fff1c2", "#9a6700"],
  "Devis envoyé": ["#fff1c2", "#9a6700"],
  "Acompte reçu": ["#dff3e6", "#1e7e46"],
  "Confirmé": ["#dff3e6", "#1e7e46"],
  "Annulé": ["#f9dedc", "#b3261e"],
};
const MOYENS = ["Orange Money", "Carte bancaire", "Espèces", "Virement"];

// Colonnes de l'onglet Demandes. Les 12 premières sont remplies par le site, les 3 dernières par le gérant.
const COLONNES_DEMANDES = [
  "Reçue le", "Client", "E-mail", "Organisation", "Téléphone", "Événement", "Date souhaitée",
  "Pers.", "Durée", "Espaces", "Services", "Message", "Statut", "Devis (GNF)", "Notes",
];
const NB_AUTO = 12;
const COL_STATUT = 13;
const COLONNES_PAIEMENTS = ["Date", "Client", "Référence du devis", "Montant (GNF)", "Moyen", "Statut prestataire", "Pointé", "Notes"];

const VERT = "#188038";
const FOND_AUTO = "#f1f7f3";
const FOND_MANUEL = "#fff8e6";
const FOND_ENTETE = "#f3f5f4";

// Limites anti-abus : l'adresse du script est visible dans le code du site.
const MAX_PAR_HEURE = 30;
const MAX_LONGUEUR = 3000;

/* ======================================================================
 * Réception des demandes du site
 * ==================================================================== */

function doPost(e) {
  const verrou = LockService.getScriptLock();
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    // Piège à robots du formulaire, et champs minimum
    if (d.botcheck) return repondre({ ok: true });
    const nom = texte(d.nom, 120);
    const email = texte(d.email, 160);
    if (!nom || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return repondre({ ok: false, erreur: "champs" });

    // Plafond horaire, pour qu'un robot ne puisse pas remplir la feuille
    const cache = CacheService.getScriptCache();
    const cle = "envois-" + Utilities.formatDate(new Date(), "GMT", "yyyyMMddHH");
    const deja = Number(cache.get(cle) || 0);
    if (deja >= MAX_PAR_HEURE) return repondre({ ok: false, erreur: "limite" });
    cache.put(cle, String(deja + 1), 3700);

    const ligne = [
      new Date(),
      nom,
      email,
      texte(d.org, 160),
      texte(d.tel, 30),
      texte(d.type, 80),
      dateIso(d.date),
      nombre(d.nb),
      texte(d.duree, 40),
      liste(d.espaces),
      liste(d.services),
      texte(d.msg, MAX_LONGUEUR),
      "Nouvelle",
    ];

    verrou.waitLock(20000);
    const feuille = SpreadsheetApp.getActive().getSheetByName(ONGLET_DEMANDES);
    feuille.insertRowBefore(2);
    feuille.getRange(2, 1, 1, ligne.length).setValues([ligne]);
    formaterLigneDemande(feuille, 2);
    return repondre({ ok: true });
  } catch (err) {
    console.error(err);
    return repondre({ ok: false, erreur: "serveur" });
  } finally {
    if (verrou.hasLock()) verrou.releaseLock();
  }
}

/** Ouvrir l'adresse du script dans un navigateur affiche ce message : utile pour vérifier le déploiement. */
function doGet() {
  return ContentService.createTextOutput("Feuille de suivi Camayenne Plage : en service.");
}

function repondre(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Une cellule qui commence par = + - @ serait lue comme une formule : on la neutralise.
function texte(v, max) {
  let s = String(v == null ? "" : v).trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function liste(v) {
  return texte(Array.isArray(v) ? v.join(", ") : v, 400);
}

function nombre(v) {
  const n = parseInt(v, 10);
  return n > 0 && n < 100000 ? n : "";
}

function dateIso(v) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v || ""));
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : "";
}

function formaterLigneDemande(feuille, ligne) {
  feuille.getRange(ligne, 1, 1, NB_AUTO).setBackground(FOND_AUTO).setFontWeight("normal").setFontColor("#1f2a26");
  feuille.getRange(ligne, NB_AUTO + 1, 1, COLONNES_DEMANDES.length - NB_AUTO).setBackground(FOND_MANUEL).setFontWeight("normal").setFontColor("#1f2a26");
  feuille.getRange(ligne, 1).setNumberFormat("dd/mm/yyyy hh:mm");
  feuille.getRange(ligne, 7).setNumberFormat("dd/mm/yyyy");
  feuille.getRange(ligne, 14).setNumberFormat("#,##0");
  feuille.getRange(ligne, COL_STATUT).setDataValidation(regleListe(STATUTS));
}

/* ======================================================================
 * Installation de la feuille (à lancer une fois)
 * ==================================================================== */

function installer() {
  const classeur = SpreadsheetApp.getActive();
  // Les formules sont écrites avec des virgules : la feuille passe en anglais le temps de les poser,
  // puis revient en français (Google convertit alors les virgules en points-virgules à l'affichage).
  classeur.setSpreadsheetLocale("en_US");
  SpreadsheetApp.flush();
  classeur.setSpreadsheetTimeZone("Africa/Conakry");
  if (/^(Feuille sans titre|Feuille de calcul sans titre|Untitled spreadsheet)/.test(classeur.getName())) {
    classeur.rename("Suivi Camayenne Plage · demandes et acomptes");
  }

  const demandes = preparerDemandes(classeur);
  const paiements = preparerPaiements(classeur);
  const bord = preparerBord(classeur);

  // Ordre des onglets, et suppression de la « Feuille 1 » vide créée par Google
  classeur.setActiveSheet(bord); classeur.moveActiveSheet(1);
  classeur.setActiveSheet(demandes); classeur.moveActiveSheet(2);
  classeur.setActiveSheet(paiements); classeur.moveActiveSheet(3);
  classeur.getSheets().forEach((f) => {
    if ([ONGLET_BORD, ONGLET_DEMANDES, ONGLET_PAIEMENTS].indexOf(f.getName()) < 0 && f.getLastRow() === 0) classeur.deleteSheet(f);
  });
  classeur.setActiveSheet(bord);
  SpreadsheetApp.flush();
  classeur.setSpreadsheetLocale("fr_FR");

  // Le message ne peut s'afficher que si la feuille est ouverte dans le même compte ; sinon, il va dans le journal.
  const texteFin = "Les onglets Tableau de bord, Demandes et Paiements sont prêts. Étape suivante : Déployer → Nouveau déploiement → Application Web (voir LISEZMOI.md).";
  try {
    SpreadsheetApp.getUi().alert("Feuille installée", texteFin, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) {
    console.log("Feuille installée. " + texteFin);
  }
}

function onglet(classeur, nom) {
  return classeur.getSheetByName(nom) || classeur.insertSheet(nom);
}

function regleListe(valeurs) {
  return SpreadsheetApp.newDataValidation().requireValueInList(valeurs, true).setAllowInvalid(false).build();
}

function enTete(feuille, titres) {
  feuille.getRange(1, 1, 1, titres.length).setValues([titres])
    .setFontWeight("bold").setFontColor("#5f6f69").setBackground(FOND_ENTETE).setVerticalAlignment("middle");
  feuille.setFrozenRows(1);
  feuille.setRowHeight(1, 30);
}

function preparerDemandes(classeur) {
  const f = onglet(classeur, ONGLET_DEMANDES);
  enTete(f, COLONNES_DEMANDES);
  [130, 160, 190, 150, 130, 160, 110, 60, 110, 180, 200, 260, 130, 110, 220].forEach((l, i) => f.setColumnWidth(i + 1, l));
  f.getRange(1, 1).setNote("Colonnes vertes : remplies automatiquement par le formulaire du site. Colonnes jaunes : à remplir par le gérant.");

  const lignes = Math.max(f.getMaxRows() - 1, 1);
  f.getRange(2, 1, lignes, NB_AUTO).setBackground(FOND_AUTO);
  f.getRange(2, NB_AUTO + 1, lignes, COLONNES_DEMANDES.length - NB_AUTO).setBackground(FOND_MANUEL);
  f.getRange(2, 1, lignes, 1).setNumberFormat("dd/mm/yyyy hh:mm");
  f.getRange(2, 7, lignes, 1).setNumberFormat("dd/mm/yyyy");
  f.getRange(2, 14, lignes, 1).setNumberFormat("#,##0");
  f.getRange(2, 12, lignes, 1).setWrap(false);
  f.getRange(2, COL_STATUT, lignes, 1).setDataValidation(regleListe(STATUTS));

  // Couleur de la cellule Statut selon sa valeur
  const plage = f.getRange(2, COL_STATUT, lignes, 1);
  const regles = f.getConditionalFormatRules().filter((r) => !r.getRanges().some((p) => p.getColumn() === COL_STATUT));
  Object.keys(COULEURS_STATUT).forEach((s) => {
    regles.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(s)
      .setBackground(COULEURS_STATUT[s][0]).setFontColor(COULEURS_STATUT[s][1]).setBold(true).setRanges([plage]).build());
  });
  f.setConditionalFormatRules(regles);

  if (!f.getFilter()) f.getRange(1, 1, f.getMaxRows(), COLONNES_DEMANDES.length).createFilter();
  proteger(f, f.getRange(1, 1, f.getMaxRows(), NB_AUTO), "Colonnes remplies par le site");
  return f;
}

function preparerPaiements(classeur) {
  const f = onglet(classeur, ONGLET_PAIEMENTS);
  enTete(f, COLONNES_PAIEMENTS);
  [110, 170, 150, 130, 140, 150, 80, 240].forEach((l, i) => f.setColumnWidth(i + 1, l));
  f.getRange(1, 1).setNote("Une ligne par acompte reçu. Le détail de chaque transaction reste chez CinetPay ou Orange Money, qui font foi. Cochez « Pointé » une fois le paiement vérifié.");

  const lignes = Math.max(f.getMaxRows() - 1, 1);
  f.getRange(2, 1, lignes, COLONNES_PAIEMENTS.length).setBackground(FOND_MANUEL);
  f.getRange(2, 1, lignes, 1).setNumberFormat("dd/mm/yyyy");
  f.getRange(2, 4, lignes, 1).setNumberFormat("#,##0");
  f.getRange(2, 5, lignes, 1).setDataValidation(regleListe(MOYENS));
  f.getRange(2, 6, lignes, 1).setDataValidation(regleListe(["Confirmé", "En attente", "Refusé", "Remboursé"]));
  f.getRange(2, 7, lignes, 1).insertCheckboxes();
  return f;
}

function preparerBord(classeur) {
  const f = onglet(classeur, ONGLET_BORD);
  f.clear();
  f.getCharts().forEach((c) => f.removeChart(c));
  f.setHiddenGridlines(true);
  [24, 250, 150, 24, 110, 220, 170, 90, 150, 140].forEach((l, i) => f.setColumnWidth(i + 1, l));

  const debutMois = "EOMONTH(TODAY(),-1)+1";
  const MOIS = '"janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."';
  const D = ONGLET_DEMANDES + "!";
  const P = ONGLET_PAIEMENTS + "!";

  f.getRange("B1").setValue("Suivi Camayenne Plage").setFontSize(18).setFontWeight("bold");
  // Dates mises en texte sans code de format (« dd/mm/yyyy » ne se lit pas pareil selon la langue de la feuille)
  f.getRange("B2").setFormula('="Mois en cours · au "&TEXT(DAY(TODAY()),"00")&"/"&TEXT(MONTH(TODAY()),"00")&"/"&YEAR(TODAY())').setFontColor("#5f6f69");

  // Indicateurs du mois
  const kpis = [
    ["Demandes reçues ce mois", "=COUNTIFS(" + D + "A2:A,\">=\"&" + debutMois + ")"],
    ["En attente de réponse", "=COUNTIF(" + D + "M2:M,\"Nouvelle\")+COUNTIF(" + D + "M2:M,\"Contacté\")"],
    ["Devis envoyés, sans réponse", "=COUNTIF(" + D + "M2:M,\"Devis envoyé\")"],
    ["Confirmés ou avec acompte", "=COUNTIF(" + D + "M2:M,\"Confirmé\")+COUNTIF(" + D + "M2:M,\"Acompte reçu\")"],
    ["Acomptes encaissés ce mois (GNF)", "=SUMIFS(" + P + "D2:D," + P + "A2:A,\">=\"&" + debutMois + ")"],
  ];
  f.getRange("B4").setValue("Indicateurs").setFontWeight("bold").setFontColor(VERT);
  kpis.forEach((k, i) => {
    const r = 5 + i;
    f.getRange(r, 2).setValue(k[0]).setFontColor("#5f6f69");
    f.getRange(r, 3).setFormula(k[1]).setFontSize(16).setFontWeight("bold").setHorizontalAlignment("right").setNumberFormat("#,##0");
  });
  f.getRange(9, 3).setFontColor(VERT);
  f.getRange("B5:C9").setBorder(null, null, true, null, null, true, "#e8edeb", SpreadsheetApp.BorderStyle.SOLID);

  // Demandes par mois, sur 6 mois (alimente le graphique)
  f.getRange("B12").setValue("Demandes par mois").setFontWeight("bold").setFontColor(VERT);
  f.getRange("B13:C13").setValues([["Mois", "Demandes"]]).setFontWeight("bold").setBackground(FOND_ENTETE);
  for (let i = 0; i < 6; i++) {
    const r = 14 + i;
    const decalage = 5 - i;
    const debut = "(EOMONTH(TODAY()," + (-decalage - 1) + ")+1)";
    const fin = "(EOMONTH(TODAY()," + -decalage + ")+1)";
    // Libellé en texte (« nov. 2026 ») pour que le graphique affiche une barre par mois
    f.getRange(r, 2).setFormula("=CHOOSE(MONTH(" + debut + ")," + MOIS + ")&\" \"&YEAR(" + debut + ")");
    f.getRange(r, 3).setFormula("=COUNTIFS(" + D + "A2:A,\">=\"&" + debut + "," + D + "A2:A,\"<\"&" + fin + ")");
  }
  const graphique = f.newChart().asColumnChart()
    .addRange(f.getRange("B13:C19"))
    .setNumHeaders(1)
    .setColors([VERT])
    .setLegendPosition(Charts.Position.NONE)
    .setOption("title", "Demandes reçues par mois")
    .setOption("vAxis.minValue", 0)
    .setOption("vAxis.format", "0")
    .setOption("width", 520).setOption("height", 260)
    .setPosition(21, 2, 0, 0)
    .build();
  f.insertChart(graphique);

  // Par type d'événement, 6 derniers mois
  f.getRange("B36").setValue("Par type d'événement · 6 derniers mois").setFontWeight("bold").setFontColor(VERT);
  f.getRange("B37").setFormula(
    "=IFERROR(QUERY(" + D + "A2:F,\"select F, count(F) where A >= date '\"&YEAR(EOMONTH(TODAY(),-6)+1)&\"-\"&TEXT(MONTH(EOMONTH(TODAY(),-6)+1),\"00\")&\"-01' and F is not null group by F order by count(F) desc label F 'Événement', count(F) 'Demandes'\",0),\"Aucune demande\")",
  );
  f.getRange("B37:C37").setFontWeight("bold").setBackground(FOND_ENTETE);

  // Prochains événements, 30 jours
  f.getRange("E4").setValue("Prochains événements · 30 jours").setFontWeight("bold").setFontColor(VERT);
  f.getRange("E5:J5").setValues([["Date", "Client", "Événement", "Pers.", "Espaces", "Statut"]]).setFontWeight("bold").setBackground(FOND_ENTETE);
  f.getRange("E6").setFormula(
    "=IFERROR(SORT(FILTER({" + D + "G2:G," + D + "B2:B," + D + "F2:F," + D + "H2:H," + D + "J2:J," + D + "M2:M}," +
      D + "G2:G>=TODAY()," + D + "G2:G<=TODAY()+30," + D + "M2:M<>\"Annulé\"),1,TRUE),\"Aucun événement prévu dans les 30 jours\")",
  );
  f.getRange("E6:E40").setNumberFormat("ddd dd/mm");
  f.getRange("E6:J40").setVerticalAlignment("top");
  const statuts = f.getRange("J6:J40");
  f.setConditionalFormatRules(Object.keys(COULEURS_STATUT).map((s) =>
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(s)
      .setBackground(COULEURS_STATUT[s][0]).setFontColor(COULEURS_STATUT[s][1]).setBold(true).setRanges([statuts]).build()));

  proteger(f, f.getRange(1, 1, f.getMaxRows(), f.getMaxColumns()), "Tableau de bord calculé");
  return f;
}

/** Seul le propriétaire (et donc le script) peut modifier la plage ; les éditeurs invités la voient sans pouvoir l'abîmer. */
function proteger(feuille, plage, description) {
  feuille.getProtections(SpreadsheetApp.ProtectionType.RANGE)
    .filter((p) => p.getDescription() === description)
    .forEach((p) => p.remove());
  const p = plage.protect().setDescription(description);
  p.removeEditors(p.getEditors().filter((u) => u.getEmail() !== Session.getEffectiveUser().getEmail()));
  if (p.canDomainEdit()) p.setDomainEdit(false);
}

/** Ajoute une demande fictive pour tester la feuille sans passer par le site (à supprimer ensuite). */
function testerUneDemande() {
  const reponse = doPost({ postData: { contents: JSON.stringify({
    nom: "Test Camayenne", email: "test@exemple.com", org: "Essai", tel: "+224 600 00 00 00",
    type: "Séminaire / réunion", date: Utilities.formatDate(new Date(Date.now() + 7 * 864e5), "GMT", "yyyy-MM-dd"),
    nb: "50", duree: "Journée", espaces: ["Salle de conférence"], services: ["Restauration / traiteur"], msg: "Ligne de test, à supprimer.",
  }) } });
  console.log(reponse.getContent());
}
