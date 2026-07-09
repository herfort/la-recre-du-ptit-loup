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
// Génération PDF autorisation complète
// ===============================

async function voirAutorisation(id) {

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


  if(typeof data.enfants === "string"){
    data.enfants = JSON.parse(data.enfants);
  }


  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();


  // ===============================
  // DONNEES
  // ===============================

  const enfants = Array.isArray(data.enfants)
    ? data.enfants
    : JSON.parse(data.enfants || "[]");


  const nomEnfants = enfants
    .map(e => `${e.prenom || ""} ${e.nom || ""}`)
    .join(", ");


  const nomFichier =
    `Autorisation_Shooting_${data.prenom_parent}_${data.nom_parent}_21-10-2026.pdf`
      .replace(/\s+/g, "_");


  // ===============================
  // STYLE GENERAL
  // ===============================

  const marge = 20;
  let y = 20;


  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(
    "LA RÉCRÉ DU P'TIT LOUP",
    105,
    y,
    { align:"center" }
  );


  y += 10;

  doc.setFontSize(14);
  doc.text(
    "Autorisation parentale - Shooting photo",
    105,
    y,
    { align:"center" }
  );


  y += 8;

  doc.setLineWidth(0.5);
  doc.line(marge, y, 190, y);


  y += 12;



  // ===============================
  // FONCTION ENCADRE
  // ===============================

  function encadre(titre, lignes) {

    const hauteur = lignes.length * 7 + 12;

    doc.roundedRect(
      marge,
      y,
      170,
      hauteur,
      3,
      3
    );

    doc.setFont("helvetica","bold");
    doc.setFontSize(11);
    doc.text(titre, marge + 5, y + 8);


    doc.setFont("helvetica","normal");
    doc.setFontSize(10);

    let ligneY = y + 16;

    lignes.forEach(l => {
      doc.text(l, marge + 5, ligneY);
      ligneY += 7;
    });


    y += hauteur + 8;
  }



  // ===============================
  // INFORMATIONS
  // ===============================


  encadre(
    "Photographe",
    [
      "Nom : Adonis Studio Photo",
      "Email : " + (data.email_photographe || "")
    ]
  );


  encadre(
    "Responsable légal",
    [
      "Nom : " + data.prenom_parent + " " + data.nom_parent,
      "Téléphone : " + data.telephone,
      "Email : " + data.email
    ]
  );


  encadre(
    "Enfant(s)",
    [
      nomEnfants
    ]
  );



  // ===============================
  // SEANCE
  // ===============================

  doc.setFont("helvetica","bold");
  doc.text("Séance :", marge, y);

  y += 7;

  doc.setFont("helvetica","normal");

  doc.text(
    `Date : 21/10/2026     Créneau : ${data.creneau}`,
    marge,
    y
  );

  y += 7;

  doc.text(
    `Type : ${data.type_photo}`,
    marge,
    y
  );


  y += 15;



  // ===============================
  // TEXTE AUTORISATION
  // ===============================


  const texte = `
Je soussigné(e), ${data.prenom_parent} ${data.nom_parent},
responsable légal de l'enfant indiqué ci-dessus, autorise
La Récré Du P'tit Loup ainsi que le photographe Adonis Studio Photo
à réaliser des photographies lors du shooting photo du 21 octobre 2026.

J'autorise l'utilisation des photographies réalisées dans le cadre
des activités de l'association La Récré Du P'tit Loup, conformément
aux besoins de communication de l'association.

Cette autorisation est accordée gratuitement et sans contrepartie.
`;



  doc.setFontSize(10);

  const lignes = doc.splitTextToSize(
    texte,
    170
  );


  doc.text(
    lignes,
    marge,
    y
  );


  y += lignes.length * 5 + 15;



  // ===============================
  // SIGNATURE
  // ===============================


  doc.roundedRect(
    marge,
    y,
    170,
    45,
    3,
    3
  );


  doc.setFont("helvetica","bold");
  doc.text(
    "Signature du responsable légal",
    marge + 5,
    y + 10
  );


  doc.setFont("helvetica","normal");

  doc.text(
    "Date : __________________",
    marge + 5,
    y + 22
  );


  doc.text(
    "Signature :",
    marge + 5,
    y + 34
  );



  // ===============================
  // PIED DE PAGE
  // ===============================

  doc.setFontSize(8);

  doc.text(
    "La Récré Du P'tit Loup - 72 rue de la Planquette - 60290 Laigneville",
    105,
    285,
    {align:"center"}
  );

  doc.text(
    "06 62 37 46 38 • larecreduptitloup@gmail.com",
    105,
    290,
    {align:"center"}
  );



  // ===============================
  // SAUVEGARDE
  // ===============================

  doc.save(nomFichier);

}
