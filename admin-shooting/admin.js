// ===============================
// Connexion Supabase
// ===============================

const SUPABASE_URL =
"https://jbialegbayusckjjajnq.supabase.co";

const SUPABASE_KEY =
"sb_publishable__buDYmorRpoNxxjFGq56Iw_28SaX6IG";

const supabaseClient =
window.supabase.createClient(
SUPABASE_URL,
SUPABASE_KEY
);

console.log("✅ Administration connectée à Supabase");

// ===============================
// Chargement des inscriptions
// ===============================

async function chargerInscriptions(){

const { data, error } =
await supabaseClient
.from("shooting_inscriptions")
.select("*")
.order("creneau");

if(error){

console.error(error);
return;

}

console.log(data);

afficherInscriptions(data);

}

// ===============================
// Affichage du tableau
// ===============================

function afficherInscriptions(data){

const tbody =
document.getElementById(
"listeInscriptions"
);

tbody.innerHTML = "";

if(data.length === 0){

tbody.innerHTML = `
<tr>
<td colspan="5">
Aucune inscription
</td>
</tr>
`;

return;

}
// ===============================
// Statistiques
// ===============================

let nbEnfants = 0;
let tempsReserve = 0;

data.forEach(inscription => {

  nbEnfants += inscription.enfants.length;
  tempsReserve += inscription.duree;

});

document.getElementById("nbFamilles").textContent =
data.length;

document.getElementById("nbEnfants").textContent =
nbEnfants;

const heures =
Math.floor(tempsReserve / 60);

const minutes =
tempsReserve % 60;

document.getElementById("tempsReserve").textContent =
heures + " h " + minutes + " min";
data.forEach(inscription=>{

const enfants =
inscription.enfants
.map(e=>e.prenom+" "+e.nom)
.join("<br>");

tbody.innerHTML += `

<tr>

<td>${inscription.creneau}</td>

<td>
${inscription.prenom_parent}
${inscription.nom_parent}
</td>

<td>${enfants}</td>

<td>${inscription.type_photo}</td>
<td>${inscription.duree} min</td>

<td>

<button 
onclick="voirAutorisation(${inscription.id})">
📄 PDF
</button>

<button
onclick="supprimerInscription(${inscription.id})">
❌
</button>

</td>

</tr>


`;

});

}
// ===============================
// Calcul des vrais créneaux libres
// ===============================

async function calculerCreneauxLibres(){

const { data: parametres, error } =
await supabaseClient
.from("shooting_parametres")
.select("*")
.single();


if(error || !parametres){
console.error(error);
return;
}


const { data: inscriptions } =
await supabaseClient
.from("shooting_inscriptions")
.select("creneau,duree");



const dateBase =
parametres.date_shooting;


let heure =
new Date(
`${dateBase}T${parametres.heure_debut}`
);


const finJournee =
new Date(
`${dateBase}T${parametres.heure_fin}`
);


const pauseDebut =
parametres.pause_debut
?
new Date(
`${dateBase}T${parametres.pause_debut}`
)
:null;


const pauseFin =
parametres.pause_fin
?
new Date(
`${dateBase}T${parametres.pause_fin}`
)
:null;



let libres = 0;



while(heure < finJournee){


let disponible = true;



const finCreneau =
new Date(heure);

finCreneau.setMinutes(
finCreneau.getMinutes()+5
);



// Pause photographe

if(
pauseDebut &&
pauseFin &&
heure < pauseFin &&
finCreneau > pauseDebut
){

disponible = false;

}



// Réservations

inscriptions.forEach(reservation=>{


const debutReservation =
new Date(
`${dateBase}T${reservation.creneau}`
);


const finReservation =
new Date(debutReservation);


finReservation.setMinutes(
finReservation.getMinutes()+reservation.duree
);



if(
heure < finReservation &&
finCreneau > debutReservation
){

disponible = false;

}


});



if(disponible){

libres++;

}



heure.setMinutes(
heure.getMinutes()+5
);


}



document.getElementById("nbCreneaux").textContent =
libres;


}

chargerInscriptions();
calculerCreneauxLibres();
// ===============================
// Suppression inscription
// ===============================

async function supprimerInscription(id){

const confirmation = confirm(
"Êtes-vous sûr de vouloir supprimer cette réservation ?"
);


if(!confirmation){
return;
}


const { error } =
await supabaseClient
.from("shooting_inscriptions")
.delete()
.eq("id", id);



if(error){

console.error(error);

alert(
"Erreur lors de la suppression"
);

return;

}


alert(
"✅ Inscription supprimée"
);


// Actualisation

location.reload();

}
// ===============================
// Génération du PDF Autorisation
// ===============================

async function voirAutorisation(id) {

  // ===============================
  // Récupération de l'inscription
  // ===============================

  const { data, error } = await supabaseClient
    .from("shooting_inscriptions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    alert("Impossible de récupérer l'inscription.");
    return;
  }

  // ===============================
  // Récupération des paramètres
  // ===============================

  const {
    data: parametres,
    error: erreurParametres
  } = await supabaseClient
    .from("shooting_parametres")
    .select("*")
    .single();

  if (erreurParametres) {
    console.error(erreurParametres);
  }

  // Conversion JSON enfants

  if (typeof data.enfants === "string") {
    data.enfants = JSON.parse(data.enfants);
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("portrait", "mm", "a4");

  const marge = 18;
  let y = 18;

  // ===============================
  // Couleurs
  // ===============================

  const vert = [36, 94, 58];

  // ===============================
  // Date française
  // ===============================

  const dateAffichee =
    new Date(parametres.date_shooting)
      .toLocaleDateString("fr-FR");

  // ===============================
  // Type photo
  // ===============================

  let typePhoto = data.type_photo;

  switch (typePhoto) {

    case "individuel":
      typePhoto = "Photo individuelle";
      break;

    case "fratrie":
      typePhoto = "Photo de fratrie";
      break;

    case "les2":
      typePhoto = "Photo individuelle + Fratrie";
      break;

  }

  // ===============================
  // Nom du fichier
  // ===============================

  const nomFichier =
    `Autorisation_Shooting_${data.prenom_parent}_${data.nom_parent}_${dateAffichee}`
      .replace(/\//g, "-")
      .replace(/\s+/g, "_");

  // ===============================
  // En-tête
  // ===============================

  doc.setTextColor(...vert);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);

  doc.text(
    "LA RÉCRÉ DU P'TIT LOUP",
    105,
    y,
    { align: "center" }
  );

  y += 10;

  doc.setFontSize(14);

  doc.text(
    "Autorisation parentale - Shooting photo",
    105,
    y,
    { align: "center" }
  );

  y += 7;

  doc.setDrawColor(...vert);

  doc.line(
    marge,
    y,
    192,
    y
  );

  y += 10;

  doc.setTextColor(0);

  // ===============================
  // Fonction Encadré
  // ===============================

  function encadre(titre, lignes) {

    const hauteur =
      13 + (lignes.length * 5);

    doc.setDrawColor(...vert);

    doc.roundedRect(
      marge,
      y,
      174,
      hauteur,
      3,
      3
    );

    doc.setTextColor(...vert);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);

    doc.text(
      titre,
      marge + 5,
      y + 7
    );

    doc.setTextColor(0);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    let yy = y + 12;

    lignes.forEach(ligne => {

      doc.text(
        ligne,
        marge + 5,
        yy
      );

      yy += 5;

    });

    y += hauteur + 3;

  }

  // ===============================
  // Photographe
  // ===============================

  encadre(
    "Photographe",
    [
      "Nom : " + (parametres?.nom_photographe || ""),
      "Téléphone : " + (parametres?.telephone_photographe || ""),
      "Email : " + (parametres?.email_photographe || "")
    ]
  );

  // ===============================
  // Responsable légal
  // ===============================

  encadre(
    "Responsable légal",
    [
      "Nom : " + data.prenom_parent + " " + data.nom_parent,
      "Téléphone : " + data.telephone,
      "Email : " + data.email
    ]
  );

  // ===============================
  // Enfant(s)
  // ===============================

  const listeEnfants = [];

  data.enfants.forEach(enfant => {

    listeEnfants.push(
      "• " +
      enfant.prenom +
      " " +
      enfant.nom
    );

  });

  encadre(
    "Enfant(s)",
    listeEnfants
  );
    // ===============================
  // Séance photo
  // ===============================

  doc.setTextColor(...vert);
  doc.setFont("helvetica","bold");
  doc.setFontSize(12);

  doc.text(
    "Séance photo",
    marge,
    y
  );

  y += 8;

  doc.setDrawColor(180);

  doc.roundedRect(
    marge,
    y,
    174,
    18,
    2,
    2
  );

  doc.setTextColor(0);
  doc.setFont("helvetica","normal");
  doc.setFontSize(10);

  doc.text(
    "Date : " + dateAffichee,
    marge + 5,
    y + 7
  );

  doc.text(
    "Créneau : " + data.creneau,
    92,
    y + 7
  );

  doc.text(
    "Type : " + typePhoto,
    marge + 5,
    y + 14
  );

  y += 28;

  // ===============================
  // Autorisation
  // ===============================

  doc.setTextColor(...vert);
  doc.setFont("helvetica","bold");
  doc.setFontSize(12);

  doc.text(
    "Autorisation parentale",
    marge,
    y
  );

  y += 8;

  doc.setTextColor(0);
  doc.setFont("helvetica","normal");
  doc.setFontSize(10);

const texte = `
Je soussigné(e), ${data.prenom_parent} ${data.nom_parent},
responsable légal de l'enfant (ou des enfants) désigné(s)
ci-dessus, autorise la réalisation de photographies lors
du shooting photo organisé par La Récré Du P'tit Loup
le ${dateAffichee}.

Les photographies seront réalisées par
${parametres?.nom_photographe || "la photographe"}.

Les clichés seront mis à disposition des familles via
une galerie privée et sécurisée afin de permettre leur
consultation et, si elles le souhaitent, leur commande.

Cette autorisation est valable uniquement pour cette
séance photo.
`;
  const lignes = doc.splitTextToSize(
    texte,
    172
  );

  doc.text(
    lignes,
    marge,
    y
  );

  y += (lignes.length * 5) + 10;
    // ===============================
  // Signature
  // ===============================

  if (y > 270) {
    doc.addPage();
    y = 20;
  }

  doc.setTextColor(...vert);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);

  doc.text(
    "Signature du responsable légal",
    marge,
    y
  );

  y += 6;

  doc.setDrawColor(180);

  doc.line(
    marge,
    y,
    192,
    y
  );

  y += 12;

  doc.setTextColor(0);
  doc.setFont("helvetica","normal");
  doc.setFontSize(10);

  doc.text(
    "Fait à : __________________________________________",
    marge,
    y
  );

  y += 10;

  doc.text(
    "Le : ______ / ______ / __________",
    marge,
    y
  );

  y += 12;

  doc.text(
    "Signature :",
    marge,
    y
  );

  y += 14;

 doc.line(
    marge + 28,
    y,
    175,
    y
);

  // ===============================
  // Pied de page
  // ===============================

  doc.setDrawColor(...vert);

  doc.line(
    marge,
    277,
    192,
    277
  );

  doc.setTextColor(90);
  doc.setFontSize(8);
  doc.setFont("helvetica","normal");

  doc.text(
    "La Récré Du P'tit Loup",
    105,
    282,
    { align: "center" }
  );

  doc.text(
    "72 rue de la Planquette - 60290 Laigneville",
    105,
    286,
    { align: "center" }
  );

  doc.text(
    "06 62 37 46 38 - larecreduptitloup@gmail.com",
    105,
    290,
    { align: "center" }
  );

  // ===============================
  // Enregistrement
  // ===============================

  doc.save(nomFichier);

}
