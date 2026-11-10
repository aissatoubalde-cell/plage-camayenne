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

/*
 * Onglet Tableau de bord, mis en page comme la maquette : cartes de chiffres, graphique, types, prochains événements.
 * Grille : colonnes de 95 px (B C, E F, H I, K L, N O) séparées par des gouttières de 14 px (D, G, J, M).
 * Les calculs intermédiaires (source du graphique, types, liste filtrée) sont dans les colonnes Q à AB, masquées.
 */
function preparerBord(classeur) {
  const f = onglet(classeur, ONGLET_BORD);
  if (f.getMaxColumns() < 30) f.insertColumnsAfter(f.getMaxColumns(), 30 - f.getMaxColumns());
  if (f.getMaxRows() < 60) f.insertRowsAfter(f.getMaxRows(), 60 - f.getMaxRows());
  const tout = f.getRange(1, 1, f.getMaxRows(), f.getMaxColumns());
  tout.breakApart();
  f.clear();
  f.getCharts().forEach((c) => f.removeChart(c));
  f.showColumns(1, f.getMaxColumns());
  f.setHiddenGridlines(true);

  const GRIS = "#5f6f69", FOND = "#f3f5f4", CARTE = "#ffffff", BORD = "#d9e0dc", TEXTE = "#1f2a26";
  tout.setBackground(FOND).setFontFamily("Manrope").setFontColor(TEXTE).setVerticalAlignment("middle");
  [20, 95, 95, 14, 95, 95, 14, 95, 95, 14, 95, 95, 14, 95, 95, 20].forEach((l, i) => f.setColumnWidth(i + 1, l));

  const D = ONGLET_DEMANDES + "!";
  const P = ONGLET_PAIEMENTS + "!";
  const debutMois = "(EOMONTH(TODAY(),-1)+1)";
  const MOIS = '"janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."';
  const MOIS_LONGS = '"janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"';
  // Fusionne une plage et met la valeur ou la formule dans sa première cellule seulement
  const fusion = (a1, contenu) => {
    const r = f.getRange(a1).merge();
    if (String(contenu).charAt(0) === "=") r.getCell(1, 1).setFormula(contenu); else r.getCell(1, 1).setValue(contenu);
    return r;
  };
  const carte = (a1) => f.getRange(a1).setBackground(CARTE).setBorder(true, true, true, true, false, false, BORD, SpreadsheetApp.BorderStyle.SOLID);

  // En-tête
  f.setRowHeight(1, 44);
  f.getRange("B1").setValue("Suivi Camayenne Plage").setFontSize(20).setFontWeight("bold");
  f.getRange("B2").setFormula("=UPPER(CHOOSE(MONTH(TODAY())," + MOIS_LONGS + ")&\" \"&YEAR(TODAY())&\" · au \"&DAY(TODAY())&\" \"&CHOOSE(MONTH(TODAY())," + MOIS_LONGS + "))")
    .setFontSize(9).setFontWeight("bold").setFontColor(GRIS);
  f.setRowHeight(3, 10);

  // Cartes de chiffres (lignes 4 et 5)
  const kpis = [
    ["B", "C", "Demandes reçues ce mois", "=COUNTIFS(" + D + "A2:A,\">=\"&" + debutMois + ")", "0"],
    ["E", "F", "En attente de réponse", "=COUNTIF(" + D + "M2:M,\"Nouvelle\")+COUNTIF(" + D + "M2:M,\"Contacté\")", "0"],
    ["H", "I", "Devis envoyés, sans réponse", "=COUNTIF(" + D + "M2:M,\"Devis envoyé\")", "0"],
    ["K", "L", "Événements confirmés ou avec acompte", "=COUNTIF(" + D + "M2:M,\"Confirmé\")+COUNTIF(" + D + "M2:M,\"Acompte reçu\")", "0"],
    ["N", "O", "Acomptes encaissés ce mois", "=SUMIFS(" + P + "D2:D," + P + "A2:A,\">=\"&" + debutMois + ")", "#,##0\" GNF\""],
  ];
  f.setRowHeight(4, 58);
  f.setRowHeight(5, 40);
  kpis.forEach(([c1, c2, libelle, formule, format], i) => {
    carte(c1 + "4:" + c2 + "5");
    fusion(c1 + "4:" + c2 + "4", formule).setNumberFormat(format)
      .setFontSize(i === 4 ? 17 : 28).setFontWeight("bold").setFontColor(i === 4 ? VERT : TEXTE)
      .setHorizontalAlignment("left").setVerticalAlignment("bottom");
    fusion(c1 + "5:" + c2 + "5", libelle)
      .setFontSize(10).setFontColor(GRIS).setWrap(true).setVerticalAlignment("top");
  });
  f.setRowHeight(6, 16);

  // Calculs masqués : demandes par mois (Q13:R19), source du graphique
  f.getRange("Q13:R13").setValues([["Mois", "Demandes"]]);
  for (let i = 0; i < 6; i++) {
    const r = 14 + i;
    const decalage = 5 - i;
    const debut = "(EOMONTH(TODAY()," + (-decalage - 1) + ")+1)";
    const fin = "(EOMONTH(TODAY()," + -decalage + ")+1)";
    f.getRange(r, 17).setFormula("=CHOOSE(MONTH(" + debut + ")," + MOIS + ")" + (decalage === 0 ? "&\" (en cours)\"" : ""));
    f.getRange(r, 18).setFormula("=COUNTIFS(" + D + "A2:A,\">=\"&" + debut + "," + D + "A2:A,\"<\"&" + fin + ")");
  }

  // Carte « Demandes par mois » (B7:I20) avec le graphique
  carte("B7:I20");
  f.setRowHeight(7, 34);
  fusion("B7:I7", "   Demandes par mois").setFontSize(12).setFontWeight("bold");
  const graphique = f.newChart().asColumnChart()
    .addRange(f.getRange("Q13:R19"))
    .setNumHeaders(1)
    .setHiddenDimensionStrategy(Charts.ChartHiddenDimensionStrategy.SHOW_BOTH)
    .setColors([VERT])
    .setLegendPosition(Charts.Position.NONE)
    .setOption("backgroundColor", CARTE)
    .setOption("vAxis.minValue", 0)
    .setOption("vAxis.format", "0")
    .setOption("vAxis.gridlines.color", "#e8edeb")
    .setOption("bar.groupWidth", "62%")
    .setOption("series", { 0: { dataLabel: "value" } })
    .setOption("width", 570).setOption("height", 268)
    .setPosition(8, 2, 8, 2)
    .build();
  f.insertChart(graphique);

  // Calculs masqués : types d'événement des 6 derniers mois (T1:U…)
  const debut6 = "(EOMONTH(TODAY(),-6)+1)";
  f.getRange("T1").setFormula(
    "=IFERROR(QUERY(" + D + "A2:F,\"select F, count(F) where A >= date '\"&YEAR(" + debut6 + ")&\"-\"&TEXT(MONTH(" + debut6 + "),\"00\")&\"-01' and F is not null group by F order by count(F) desc label F 'Type', count(F) 'Nb'\",0),\"\")",
  );

  // Carte « Par type d'événement » (K7:O20) : libellé, barre (SPARKLINE), nombre
  carte("K7:O20");
  fusion("K7:O7", "   Par type d'événement · 6 mois").setFontSize(12).setFontWeight("bold");
  for (let k = 1; k <= 7; k++) {
    const r = 8 + k;
    const type = "INDEX($T$2:$T," + k + ")";
    const nb = "INDEX($U$2:$U," + k + ")";
    fusion("K" + r + ":L" + r, "=IFERROR(\"   \"&" + type + ",\"\")").setFontSize(10);
    fusion("M" + r + ":N" + r, 
      "=IFERROR(SPARKLINE(" + nb + ",{\"charttype\",\"bar\";\"max\",MAX($U$2:$U);\"color1\",\"" + VERT + "\"}),\"\")",
    );
    f.getRange("O" + r).setFormula("=IFERROR(" + nb + ",\"\")").setFontWeight("bold").setHorizontalAlignment("center");
  }
  f.getRange("K9").setFormula("=IF($T$2=\"\",\"   Aucune demande pour l'instant\"," + "\"   \"&$T$2)");
  f.setRowHeight(21, 16);

  // Calculs masqués : prochains événements sur 30 jours, triés par date (W2:AB…)
  f.getRange("W2").setFormula(
    "=IFERROR(SORT(FILTER({" + D + "G2:G," + D + "B2:B," + D + "F2:F," + D + "H2:H," + D + "J2:J," + D + "M2:M}," +
      D + "G2:G>=TODAY()," + D + "G2:G<=TODAY()+30," + D + "M2:M<>\"Annulé\"),1,TRUE),\"\")",
  );

  // Carte « Prochains événements » (B22:O32)
  const NB_EVENEMENTS = 9;
  const fin = 23 + NB_EVENEMENTS;
  carte("B22:O" + fin);
  f.setRowHeight(22, 34);
  fusion("B22:O22", "   Prochains événements · 30 jours").setFontSize(12).setFontWeight("bold");
  const colonnes = [["B", "C", "Date"], ["D", "F", "Client"], ["G", "I", "Événement"], ["J", "L", "Participants · espaces"], ["M", "O", "Statut"]];
  colonnes.forEach(([c1, c2, titre]) => fusion(c1 + "23:" + c2 + "23", titre === "Date" ? "   Date" : titre)
    .setFontSize(9).setFontWeight("bold").setFontColor(GRIS));
  for (let k = 1; k <= NB_EVENEMENTS; k++) {
    const r = 23 + k;
    const val = (col) => "INDEX($" + col + "$2:$" + col + "," + k + ")";
    f.setRowHeight(r, 30);
    fusion("B" + r + ":C" + r, "=IFERROR(IF(" + val("W") + "=\"\",\"\"," + val("W") + "),\"\")").setNumberFormat("\"   \"ddd d mmm").setFontWeight("bold");
    fusion("D" + r + ":F" + r, "=IFERROR(" + val("X") + ",\"\")");
    fusion("G" + r + ":I" + r, "=IFERROR(" + val("Y") + ",\"\")").setFontColor(GRIS);
    fusion("J" + r + ":L" + r, "=IFERROR(IF(" + val("Z") + "=\"\",\"\"," + val("Z") + "&\" pers. · \"&" + val("AA") + "),\"\")").setFontColor(GRIS);
    fusion("M" + r + ":O" + r, "=IFERROR(" + val("AB") + ",\"\")").setHorizontalAlignment("center").setFontSize(10);
    if (k < NB_EVENEMENTS) f.getRange("B" + r + ":O" + r).setBorder(null, null, true, null, false, false, "#e8edeb", SpreadsheetApp.BorderStyle.SOLID);
  }
  f.getRange("B24").setFormula("=IF($W$2=\"\",\"   Aucun événement prévu dans les 30 jours\",$W$2)");

  // Pastilles de statut colorées
  const statuts = f.getRange("M24:O" + fin);
  f.setConditionalFormatRules(Object.keys(COULEURS_STATUT).map((s) =>
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(s)
      .setBackground(COULEURS_STATUT[s][0]).setFontColor(COULEURS_STATUT[s][1]).setBold(true).setRanges([statuts]).build()));

  // Masque les colonnes de calcul et les colonnes vides à droite
  f.hideColumns(17, f.getMaxColumns() - 16);

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
