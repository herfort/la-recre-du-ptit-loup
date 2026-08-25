// ==========================================
// PDF COMMUN - SHOOTING PHOTO
// La Récré Du P'tit Loup
// ==========================================

function creerPDFShooting({
  jsPDF,
  parametres,
  nomParent,
  prenomParent,
  telephone,
  email,
  enfants,
  typePhoto,
  creneau,
  duree,
  signature
}) {

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const largeur = 210;
  const marge = 15;

  let y = 18;

  const vert = [43, 125, 64];
  const gris = [110, 110, 110];


  // ==========================================
  // EN-TÊTE
  // ==========================================

  doc.setTextColor(...vert);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);

  doc.text(
    "LA RÉCRÉ DU P'TIT LOUP",
    largeur / 2,
    y,
    { align: "center" }
  );

  y += 9;

  doc.setTextColor(0);
  doc.setFontSize(13);

  doc.text(
    "Autorisation parentale",
    largeur / 2,
    y,
    { align: "center" }
  );

  y += 7;

  doc.setFontSize(11);
  doc.setTextColor(...gris);

  doc.text(
    "Shooting Photo",
    largeur / 2,
    y,
    { align: "center" }
  );

  y += 5;

  doc.setDrawColor(...vert);
  doc.setLineWidth(0.6);

  doc.line(
    marge,
    y,
    195,
    y
  );

  y += 9;


  // ==========================================
  // PHOTOGRAPHE
  // ==========================================

  doc.setTextColor(...vert);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);

  doc.text(
    "PHOTOGRAPHE",
    marge,
    y
  );

  y += 5;

  doc.setDrawColor(170);

  doc.rect(
    marge,
    y,
    180,
    28
  );

  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  doc.text(
    "Nom : " +
    (parametres.nom_photographe || ""),
    marge + 4,
    y + 6
  );

  doc.text(
    "Téléphone : " +
    (parametres.telephone_photographe || ""),
    marge + 4,
    y + 12
  );

  doc.text(
    "Email : " +
    (parametres.email_photographe || ""),
    marge + 4,
    y + 18
  );

  doc.text(
    "Facebook : " +
    (parametres.facebook_photographe || ""),
    marge + 4,
    y + 24
  );

  y += 36;


  // ==========================================
  // RESPONSABLE LÉGAL
  // ==========================================

  doc.setTextColor(...vert);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);

  doc.text(
    "RESPONSABLE LÉGAL",
    marge,
    y
  );

  y += 5;

  doc.setDrawColor(170);

  doc.rect(
    marge,
    y,
    180,
    25
  );

  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  doc.text(
    "Nom : " +
    prenomParent +
    " " +
    nomParent,
    marge + 4,
    y + 6
  );

  doc.text(
    "Téléphone : " +
    (telephone || ""),
    marge + 4,
    y + 12
  );

  doc.text(
    "Email : " +
    (email || ""),
    marge + 4,
    y + 18
  );

  y += 33;


  // ==========================================
  // ENFANTS
  // ==========================================

  doc.setTextColor(...vert);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);

  doc.text(
    "ENFANT(S)",
    marge,
    y
  );

  y += 5;

  const hauteurEnfants =
    Math.max(
      18,
      enfants.length * 6 + 6
    );

  doc.setDrawColor(170);

  doc.rect(
    marge,
    y,
    180,
    hauteurEnfants
  );

  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  let yy = y + 6;

  enfants.forEach(enfant => {

    doc.text(
      "• " +
      enfant.prenom +
      " " +
      enfant.nom,
      marge + 4,
      yy
    );

    yy += 6;

  });

  y += hauteurEnfants + 8;


  // ==========================================
  // TYPE DE PHOTO
  // ==========================================

  let typePhotoTexte = typePhoto;

  if (typePhoto === "individuel") {
    typePhotoTexte =
      "Photo individuelle";
  }

  else if (typePhoto === "fratrie") {
    typePhotoTexte =
      "Photo fratrie";
  }

  else if (typePhoto === "les2") {
    typePhotoTexte =
      "Photo individuelle + fratrie";
  }


  // ==========================================
  // SÉANCE
  // ==========================================

  doc.setTextColor(...vert);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);

  doc.text(
    "SÉANCE PHOTO",
    marge,
    y
  );

  y += 5;

  doc.setDrawColor(170);

  doc.rect(
    marge,
    y,
    180,
    24
  );

  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const dateFormatee =
    parametres.date_shooting
      ? new Date(
          parametres.date_shooting
        ).toLocaleDateString("fr-FR")
      : "";

  doc.text(
    "Date : " + dateFormatee,
    marge + 4,
    y + 6
  );

  doc.text(
    "Créneau : " + creneau,
    marge + 4,
    y + 12
  );

  doc.text(
    "Type de photo : " +
    typePhotoTexte,
    95,
    y + 12
  );

  doc.text(
    "Durée : " +
    duree +
    " minutes",
    marge + 4,
    y + 18
  );

  y += 32;


  // ==========================================
  // AUTORISATION
  // ==========================================

  doc.setTextColor(...vert);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);

  doc.text(
    "AUTORISATION",
    marge,
    y
  );

  y += 5;

  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const texte =
    "Je soussigné(e), responsable légal du ou des enfants désignés ci-dessus, autorise la réalisation de photographies dans le cadre du shooting photo organisé par l'association La Récré Du P'tit Loup.\n\n" +

    "J'autorise également la diffusion des photographies réalisées par " +
    (parametres.nom_photographe || "la photographe") +
    " dans une galerie privée accessible uniquement aux familles participantes afin de permettre la consultation et le téléchargement des images.\n\n" +

    "Ces photographies ne seront utilisées à aucune autre fin sans l'accord préalable des représentants légaux.";

  const lignes =
    doc.splitTextToSize(
      texte,
      176
    );

  doc.text(
    lignes,
    marge,
    y
  );

  y +=
    (lignes.length * 4.5)
    + 10;


  // ==========================================
  // SIGNATURE
  // ==========================================

  doc.setTextColor(...vert);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);

  doc.text(
    "Signature du responsable légal",
    marge,
    y
  );

  y += 5;

  doc.setDrawColor(120);

  doc.rect(
    marge,
    y,
    180,
    22
  );

  if (signature) {

    try {

      doc.addImage(
        signature,
        "PNG",
        marge + 5,
        y + 2,
        70,
        17
      );

    } catch (erreur) {

      console.error(
        "Erreur signature PDF :",
        erreur
      );

    }

  }

  y += 28;


  // ==========================================
  // PIED DE PAGE
  // ==========================================

  doc.setDrawColor(180);

  doc.line(
    marge,
    275,
    195,
    275
  );

  doc.setTextColor(...vert);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);

  doc.text(
    "Association La Récré Du P'tit Loup",
    largeur / 2,
    280,
    {
      align: "center"
    }
  );

  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  doc.setFontSize(8);

  doc.text(
    "72 rue de la Planquette - 60290 Laigneville",
    largeur / 2,
    284,
    {
      align: "center"
    }
  );

  doc.text(
    "06 62 37 46 38 - larecreduptitloup@gmail.com",
    largeur / 2,
    288,
    {
      align: "center"
    }
  );


  return doc;
}
