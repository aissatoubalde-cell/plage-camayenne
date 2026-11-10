// Contenu des sections. Les clés `photo` correspondent aux fichiers public/img/photos/<photo>.jpg (+ .webp).

// Navigation de l’en-tête (ordinateur) : les sections principales de l’accueil
export const navDesktop = [
  { label: "Espaces", to: "/#espaces", id: "espaces" },
  { label: "Activités", to: "/#activites", id: "activites" },
  { label: "Entreprises", to: "/#entreprises", id: "entreprises" },
  { label: "Galerie", to: "/#galerie", id: "galerie" },
  { label: "Infos pratiques", to: "/#infos", id: "infos" },
];
// Panneau mobile : « Découvrir » puis « Organiser un événement »
export const navDiscover = [
  { label: "Mot du DG", to: "/#mot-du-dg" },
  { label: "Espaces de location", to: "/#espaces" },
  { label: "Activités", to: "/#activites" },
  { label: "Galerie", to: "/#galerie" },
  { label: "Infos pratiques", to: "/#infos" },
];
export const navOrganize = [
  { label: "Entreprises & institutions", to: "/#entreprises", icon: "briefcase" },
  { label: "Espace privé & familles", to: "/#prive", icon: "sparkles" },
];

export const stats = [
  { value: "13", label: "Espaces" },
  { value: "5", label: "Formules" },
  { value: "6", label: "Prestations" },
  { value: "2023", label: "Ouverture" },
];

export const heroCats = ["Plage", "Loisirs", "Séminaires", "Team building", "Réceptions", "Familles"];

export const espaces = [
  { n: "01", photo: "salle", alt: "Salle de conférence", title: "Salle de conférence",
    photos: [
      ["salle", "Salle de conférence"],
      ["salle-expo", "La salle aménagée pour une exposition-vente"],
      ["salle-reception", "La salle dressée pour un dîner de gala avec orchestre"],
    ],
    text: "Climatisée, mobilier de conférence, vidéoprojecteur et sonorisation. Réunions, formations, séminaires." },
  { n: "02", photo: "exterieur", alt: "Espaces extérieurs", title: "Espaces extérieurs",
    photos: [
      ["exterieur", "Espaces extérieurs"],
      ["exterieur-paillotes", "Paillotes et tables sur le sable, sous les palmiers"],
      ["exterieur-tables", "Tables sous les paillotes aux couleurs nationales"],
      ["exterieur-animee", "Les paillotes un jour d’affluence"],
      ["exterieur-cinema", "Écran géant installé pour une projection en plein air"],
    ], text: "Réceptions, cocktails et événements en plein air, à l’ombre des paillotes et des palmiers." },
  { n: "03", photo: "plage-vue", alt: "Espace plage", title: "Espace plage",
    photos: [
      ["plage-vue", "Vue aérienne de la plage et des terrains"],
      ["plage-guinee", "La plage et les lettres Guinée face à la mer"],
      ["plage-kiosques", "Les kiosques vus depuis la plage"],
      ["plage-jeux", "Aire de jeux sous les palmiers"],
      ["plage-facade", "Entrée de Camayenne Plage aux couleurs de la Guinée"],
      ["plage-entree", "Accueil et clôture décorée"],
      ["plage-palmier", "Voiles tricolores et palmiers le long de la clôture"],
      ["plage-cloture", "La clôture de la plage côté rue"],
      ["plage-rue", "La façade de Camayenne Plage depuis la rue"],
      ["plage-voiles", "Voiles tricolores le long du mur"],
      ["plage-jardin", "Allée et voiles tricolores dans le jardin"],
      ["plage-terrain", "Voile tricolore au-dessus du terrain"],
      ["plage-lumieres", "Guirlande lumineuse en soirée"],
    ], text: "Le sable et la mer pour la détente et les événements au bord de l’eau." },
  { n: "04", photo: "sport-equipes", alt: "Terrains de sport", title: "Terrains de sport",
    photos: [
      ["sport-equipes", "Deux équipes de beach soccer avant un match"],
      ["sport-basket", "Terrain de basketball et buvette"],
      ["sport-panier", "Panier de basketball vu d’en dessous"],
      ["plage-basket", "Terrain de basketball face à la mer"],
      ["plage-panier", "Le terrain de basketball de la plage"],
      ["sport-foot", "Football sur le sable au coucher du soleil"],
      ["lounge-billard", "Partie de billard"],
      ["lounge-babyfoot", "Partie de baby-foot entre amis"],
      ["lounge-airhockey", "Air hockey"],
    ],
    text: "Beach-volley, basketball et autres loisirs collectifs." },
  { n: "05", photo: "lounge-buffet", alt: "Espace lounge", title: "Espace lounge",
    photos: [
      ["lounge-buffet", "Buffet dressé avec plateaux et fleurs blanches"],
      ["lounge-cocktail", "Buffet cocktail de viennoiseries et mini-burgers"],
      ["lounge-diner", "Dîner entre invités sous un kiosque, le soir"],
      ["piloti-diner", "Table dressée face à la mer"],
      ["plage-lumieres", "Guirlande lumineuse en soirée"],
      ["lounge-coco", "Noix de coco fraîches"],
    ],
    text: "Pour les pauses, la convivialité et les rencontres informelles." },
  { n: "06", photo: "piloti", alt: "Espace piloti", title: "Espace piloti",
    photos: [
      ["piloti", "Les kiosques sur pilotis au-dessus de l’eau, en soirée"],
      ["piloti-diner", "Table dressée sous un kiosque, face à la mer"],
      ["piloti-ponton", "Ponton décoré menant à un kiosque"],
      ["piloti-kiosques", "Kiosques sur pilotis décorés aux couleurs nationales"],
      ["piloti-jour", "Deux kiosques reliés par une passerelle"],
      ["piloti-kiosque", "Entrée d’un kiosque sur pilotis"],
      ["piloti-plage", "Les kiosques vus depuis la plage"],
      ["piloti-piscine", "Les kiosques derrière la piscine"],
    ], text: "Un kiosque sur pilotis au-dessus de l’eau, pour un dîner ou une rencontre hors du commun." },
  { n: "07", photo: "enfants-pingpong", alt: "Espace enfants", title: "Espace enfants",
    photos: [
      ["enfants-pingpong", "Une enfant joue au ping-pong"],
      ["enfants-cubes", "Une petite fille joue avec des cubes en bois"],
      ["enfants-jeux", "Enfants autour d’une table de jeux de construction"],
      ["enfants-gonflable", "Une enfant joue devant la structure gonflable"],
      ["enfants-sourire", "Une enfant sourit au milieu du groupe"],
      ["enfants-groupe", "Un groupe d’enfants lors d’une journée à la plage"],
      ["enfants-toboggans", "L’aire de jeux et ses toboggans"],
      ["enfants-aire", "Toboggans et jeux sous les voiles tricolores"],
      ["enfants-gonflable-foot", "Structure gonflable sur le thème du football"],
      ["enfants-jaune", "Une petite fille sur le toboggan"],
      ["enfants-ballon", "Une petite fille avec son ballon"],
      ["enfants-escalade", "Un enfant grimpe sur l’aire de jeux"],
      ["enfants-animation", "Animation avec les enfants sur la plage"],
      ["g2", "Enfants sur le mur d’escalade gonflable"],
      ["gonflables", "Enfants dans la structure gonflable avec toboggan et piscine"],
      ["g5", "Goûter des enfants"],
      ["enfants", "L’aire de jeux avec toboggans et balançoires"],
    ], text: "Aire de jeux avec toboggans et balançoires, pensée pour les familles." },
];

export const activites = [
  { photo: "g2", alt: "Mur d’escalade gonflable", title: "Pour les enfants", text: "Structures gonflables avec toboggans et piscine, mur d’escalade, aire de jeux." },
  { photo: "sport", alt: "Match de beach-volley sur le sable", title: "Sport", text: "Beach-volley sur le sable, basketball et jeux collectifs." },
  { photo: "resto", alt: "Restauration le soir", title: "Restauration", text: "Un point de restauration sur la plage, ouvert jusqu’en soirée." },
  { photo: "securite", alt: "Agent de sécurité", title: "Sécurité & propreté", text: "Agents de sécurité et équipes d’entretien de la plage.", position: "center 20%" },
];

export const offres = [
  { photo: "seminaire", alt: "Conférence", title: "Séminaires & conférences", text: "Salle climatisée, équipement technique, aménagement sur mesure, accueil des participants." },
  { photo: "teambuilding", alt: "Team building", title: "Team building", text: "Beach-volley, basketball, jeux et challenges d’équipe, activités sur la plage." },
  { photo: "corporate", alt: "Réception d’entreprise", title: "Afterworks & corporate", text: "Cocktails, dîners d’entreprise, soirées de fin d’année. Privatisation partielle ou totale." },
  { photo: "branding", alt: "Activation de marque", title: "Visibilité & branding", text: "Habillage des espaces, panneaux, présentation de produits, activations de marque." },
  { photo: "traiteur", alt: "Service traiteur", title: "Restauration & traiteur", text: "Pause-café, cocktail dînatoire, déjeuner professionnel, dîner de gala." },
];

export const formules = [
  { tab: "Meeting", n: "Formule 1", title: "Business Meeting", use: "Pour les réunions et rencontres professionnelles.", items: ["Salle et mobilier de conférence", "Équipements techniques disponibles", "Aménagement de l’espace", "Pause-café possible"], spaces: ["Salle de conférence"] },
  { tab: "Business Day", n: "Formule 2", title: "Business Day", use: "Pour les séminaires et journées de travail.", items: ["Salle à la journée", "Installation technique et aménagement", "Accueil des participants", "Pause-café, déjeuner sur demande"], spaces: ["Salle de conférence", "Lounge"] },
  { tab: "Team Building", n: "Formule 3", title: "Team Building Experience", use: "Pour renforcer la cohésion et la motivation des équipes.", items: ["Espaces adaptés", "Activités sportives", "Jeux collectifs et activités de cohésion", "Espace détente, restauration possible"], spaces: ["Plage", "Terrains de sport", "Lounge"] },
  { tab: "Afterwork", n: "Formule 4", title: "Afterwork & Corporate Party", use: "Pour les soirées et réceptions professionnelles.", items: ["Espace retenu, aménagé et installé", "Espace lounge", "Restauration possible", "Branding et privatisation possibles"], spaces: ["Extérieurs", "Lounge", "Piloti"] },
  { tab: "Private", n: "Formule 5", title: "Private Experience", use: "Pour les événements privés et familiaux.", items: ["Mise à disposition de l’espace", "Installation selon l’événement", "Restauration et accompagnement", "Options de personnalisation"], spaces: ["Extérieurs", "Piloti", "Espace enfants"] },
];

export const privateItems = [
  "Mise à disposition et installation de l’espace",
  "Décoration, sonorisation et éclairage",
  "Restauration et service traiteur",
  "Photographe, animation musicale, maître de cérémonie",
];

export const galleryFilters = [
  { key: "all", label: "Tout" },
  { key: "plage", label: "Plage & espaces" },
  { key: "event", label: "Événements" },
  { key: "famille", label: "Familles & sport" },
];

export const galerie = [
  { photo: "hero", caption: "Vue aérienne de la plage", cat: "plage" },
  { photo: "piloti", caption: "Le kiosque sur pilotis", cat: "plage" },
  { photo: "plage", caption: "Les paillotes", cat: "plage" },
  { photo: "g1", caption: "Un jour d’affluence", cat: "plage" },
  { photo: "lounge", caption: "L’espace lounge", cat: "plage" },
  { photo: "salle", caption: "La salle de conférence", cat: "event" },
  { photo: "seminaire", caption: "Conférence de presse", cat: "event" },
  { photo: "corporate", caption: "Réception d’entreprise", cat: "event" },
  { photo: "prive", caption: "Dîner sous chapiteau", cat: "event" },
  { photo: "branding", caption: "Activation de marque", cat: "event" },
  { photo: "traiteur", caption: "Service traiteur", cat: "event" },
  { photo: "g4", caption: "Intervention en salle", cat: "event" },
  { photo: "soiree-feu", caption: "Cracheur de feu en soirée", cat: "event" },
  { photo: "soiree-ambiance", caption: "Ambiance de soirée", cat: "event" },
  { photo: "soiree-selfie", caption: "Souvenir de soirée", cat: "event" },
  { photo: "teambuilding", caption: "Team building sur la plage", cat: "famille" },
  { photo: "sport", caption: "Beach-volley", cat: "famille" },
  { photo: "basket", caption: "Basketball", cat: "famille" },
  { photo: "g3", caption: "Baby-foot", cat: "famille" },
  { photo: "affiche-kids-land", caption: "Simandou Kids Land : votre week-end en famille commence ici", cat: "famille" },
  { photo: "affiche-toboggans", caption: "Jeux gonflables et toboggans : le plaisir de bouger et de jouer", cat: "famille" },
];

export const faq = [
  { q: "Quels sont vos tarifs ?", a: "Chaque formule fait l’objet d’un devis personnalisé, selon le nombre de participants, la durée, les espaces choisis et les prestations complémentaires." },
  { q: "Peut-on privatiser le site ?", a: "Oui. La privatisation peut être partielle ou totale, selon vos besoins et les conditions convenues." },
  { q: "Proposez-vous la restauration ?", a: "Oui, sur demande : pause-café et rafraîchissements, cocktail dînatoire, déjeuner professionnel, dîner de gala, avec des menus adaptés à votre budget." },
  { q: "Peut-on visiter avant de réserver ?", a: "Oui, la visite du site fait partie de notre démarche de réservation. Elle permet de choisir les espaces les mieux adaptés." },
  { q: "Comment se passe une réservation ?", a: "Prise de contact, identification de vos besoins, visite du site, proposition commerciale et devis, validation de la réservation, préparation de l’événement, puis accueil et accompagnement le jour J." },
  { q: "Peut-on payer un acompte en ligne ?", a: "Oui. Une fois votre devis validé, vous pouvez régler l’acompte par Orange Money ou carte bancaire depuis la page « Payer un acompte »." },
  { q: "Y a-t-il un parking ?", a: "Oui, le site dispose d’un parking privé et d’un environnement sécurisé." },
];

export const eventTypes = ["Séminaire / réunion", "Team building", "Afterwork / soirée d’entreprise", "Réception privée", "Anniversaire", "Activation de marque", "Autre"];
export const durations = ["Demi-journée", "Journée", "Soirée", "Plusieurs jours"];
export const spaceOptions = [
  { value: "Salle de conférence", label: "Salle" }, { value: "Espaces extérieurs", label: "Extérieurs" }, { value: "Espace plage", label: "Plage" }, { value: "Terrains de sport", label: "Sport" },
  { value: "Espace lounge", label: "Lounge" }, { value: "Espace piloti", label: "Piloti" }, { value: "Espace enfants", label: "Enfants" }, { value: "Espace privé", label: "Espace privé" },
];
export const serviceOptions = [
  { value: "Restauration / traiteur", label: "Restauration" }, { value: "Décoration", label: "Décoration" }, { value: "Sonorisation et éclairage", label: "Son & lumière" }, { value: "Photo et vidéo", label: "Photo & vidéo" },
  { value: "Hôtesses / maître de cérémonie", label: "Accueil" }, { value: "Animation musicale", label: "Animation" }, { value: "Branding", label: "Branding" },
];
