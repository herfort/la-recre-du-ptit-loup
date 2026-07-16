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
// Génération PDF autorisation
// ===============================

async function voirAutorisation(id) {

  // ===============================
  // Récupération inscription
  // ===============================

  const { data, error } = await supabaseClient
    .from("shooting_inscriptions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    alert("Impossible de récupérer l'inscription");
    return;
  }

  // ===============================
  // Récupération paramètres
  // ===============================

  const { data: parametres, error: erreurParametres } =
    await supabaseClient
      .from("shooting_parametres")
      .select("*")
      .single();

  if (erreurParametres) {
    console.error(erreurParametres);
  }

  if (typeof data.enfants === "string") {
    data.enfants = JSON.parse(data.enfants);
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const marge = 18;
  let y = 18;

  // ===============================
  // Couleur principale
  // ===============================

  doc.setDrawColor(32, 97, 64);
  doc.setTextColor(32, 97, 64);

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

  doc.line(
    marge,
    y,
    192,
    y
  );

  y += 12;

  doc.setTextColor(0,0,0);

  // ===============================
  // Fonction encadré
  // ===============================

  function encadre(titre, lignes){

    let hauteur =
      16 + (lignes.length * 7);

    doc.roundedRect(
      marge,
      y,
      174,
      hauteur,
      4,
      4
    );

    doc.setFont("helvetica","bold");
    doc.setFontSize(11);

    doc.text(
      titre,
      marge + 5,
      y + 8
    );

    doc.setFont("helvetica","normal");
    doc.setFontSize(10);

    let yy = y + 16;

    lignes.forEach(ligne=>{

      doc.text(
        ligne,
        marge + 6,
        yy
      );

      yy += 7;

    });

    y += hauteur + 8;

  }

  // ===============================
  // Photographe
  // ===============================

  encadre(
    "📸 Photographe",
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
    "👨 Responsable légal",
    [
      "Nom : " + data.prenom_parent + " " + data.nom_parent,
      "Téléphone : " + data.telephone,
      "Email : " + data.email
    ]
  );

  // ===============================
  // Enfants
  // ===============================

  const listeEnfants = [];

  data.enfants.forEach(enfant=>{

    listeEnfants.push(
      "• " + enfant.prenom + " " + enfant.nom
    );

  });

  encadre(
    "👶 Enfant(s)",
    listeEnfants
  );
    // ===============================
  // Séance
  // ===============================

  let typePhoto = data.type_photo;

  switch(typePhoto){

    case "individuel":
      typePhoto = "Photo individuelle";
      break;

    case "fratrie":
      typePhoto = "Photo fratrie";
      break;

    case "les2":
      typePhoto = "Photo individuelle + Fratrie";
      break;

    default:
      typePhoto = data.type_photo;

  }

  doc.setFont("helvetica","bold");
  doc.setFontSize(12);

  doc.text(
    "📅 Séance photo",
    marge,
    y
  );

  y += 8;

  doc.setFont("helvetica","normal");
  doc.setFontSize(10);

  doc.text(
    "Date : " +
    (parametres?.date_shooting || "21/10/2026"),
    marge,
    y
  );

  doc.text(
    "Créneau : " + data.creneau,
    90,
    y
  );

  y += 7;

  doc.text(
    "Type de séance : " + typePhoto,
    marge,
    y
  );

  y += 14;

  // ===============================
  // Autorisation
  // ===============================

  doc.setFont("helvetica","bold");
  doc.setFontSize(12);

  doc.text(
    "Autorisation",
    marge,
    y
  );

  y += 8;

  doc.setFont("helvetica","normal");
  doc.setFontSize(10);

  const texte = `
Je soussigné(e), ${data.prenom_parent} ${data.nom_parent},
responsable légal de l'enfant (ou des enfants) mentionné(s)
dans le présent document, autorise la réalisation de
photographies dans le cadre du shooting photo organisé
par l'association La Récré Du P'tit Loup le 21 octobre 2026.

Les photographies seront réalisées par
${parametres?.nom_photographe || "Adonis Studio Photo"}.

Les clichés seront ensuite mis à disposition des familles
participantes via une galerie privée et sécurisée afin de
permettre leur consultation et, le cas échéant, la commande
de photographies.

La présente autorisation est valable uniquement pour la
séance photo du 21 octobre 2026 et ne vaut pas autorisation
de diffusion publique des images par l'association.

Toute utilisation des photographies à des fins de
communication fera l'objet d'une autorisation spécifique
du responsable légal.
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

  y += lignes.length * 5 + 12;
    // ===============================
  // Signature
  // ===============================

  if (y > 215) {
    doc.addPage();
    y = 25;
  }

  doc.setDrawColor(180);

  doc.roundedRect(
    marge,
    y,
    174,
    55,
    4,
    4
  );

  doc.setFont("helvetica","bold");
  doc.setFontSize(12);

  doc.text(
    "Signature du responsable légal",
    marge + 5,
    y + 10
  );

  doc.setFont("helvetica","normal");
  doc.setFontSize(10);

  doc.text(
    "Fait à : ..............................................................",
    marge + 5,
    y + 22
  );

  doc.text(
    "Le : ......... / ......... / .................",
    marge + 5,
    y + 32
  );

  doc.text(
    "Signature :",
    marge + 5,
    y + 44
  );

  // ===============================
  // Pied de page
  // ===============================

  doc.setFontSize(8);
  doc.setTextColor(110);

  doc.line(
    marge,
    274,
    192,
    274
  );

  doc.text(
    "La Récré Du P'tit Loup",
    105,
    279,
    { align: "center" }
  );

  doc.text(
    "72 rue de la Planquette - 60290 Laigneville",
    105,
    284,
    { align: "center" }
  );

  doc.text(
    "06 62 37 46 38 - larecreduptitloup@gmail.com",
    105,
    289,
    { align: "center" }
  );

  // ===============================
  // Nom du fichier
  // ===============================

  const nomFichier =
    `Autorisation_Shooting_${data.prenom_parent}_${data.nom_parent}_21-10-2026.pdf`
      .replace(/\s+/g, "_");

  doc.save(nomFichier);

}
