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
// ======================================================
// AFFICHER L'AUTORISATION PARENTALE (Partie 1/3)
// ======================================================

async function voirAutorisation(id) {

  const { data, error } = await supabase
    .from("shooting_inscription")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    alert("Impossible de récupérer l'inscription.");
    return;
  }

  const doc = new jspdf.jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = 210;
  const marge = 12;
  let y = 12;

  // -----------------------------
  // Titre
  // -----------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("AUTORISATION PARENTALE", pageWidth / 2, y, {
    align: "center"
  });

  y += 7;

  doc.setFontSize(11);
  doc.text("Droit à l'image - Shooting Photo", pageWidth / 2, y, {
    align: "center"
  });

  y += 8;

  // -----------------------------
  // Coordonnées photographe
  // -----------------------------
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Photographe :", marge, y);

  doc.setFont("helvetica", "normal");
  doc.text(parametresShooting.nom_photographe || "", 48, y);

  y += 5;

  doc.setFont("helvetica", "bold");
  doc.text("Email :", marge, y);

  doc.setFont("helvetica", "normal");
  doc.text(parametresShooting.email_photographe || "", 48, y);

  y += 5;

  doc.setFont("helvetica", "bold");
  doc.text("Date du shooting :", marge, y);

  doc.setFont("helvetica", "normal");
  doc.text(
    new Date(parametresShooting.date_shooting).toLocaleDateString("fr-FR"),
    48,
    y
  );

  y += 8;

  // -----------------------------
  // Parent
  // -----------------------------
  doc.setFont("helvetica", "bold");
  doc.text("Responsable légal", marge, y);

  y += 6;

  doc.setFont("helvetica", "normal");
  doc.text(
    `Nom : ${data.nom_parent} ${data.prenom_parent}`,
    marge,
    y
  );

  y += 5;

  doc.text(`Téléphone : ${data.telephone}`, marge, y);

  y += 5;

  doc.text(`Email : ${data.email}`, marge, y);

  y += 8;
    // -----------------------------
  // Enfants
  // -----------------------------
  doc.setFont("helvetica", "bold");
  doc.text("Enfant(s) concerné(s)", marge, y);

  y += 6;

  doc.setFont("helvetica", "normal");

  if (data.enfants && data.enfants.length > 0) {

    data.enfants.forEach((enfant, index) => {

      const ligne =
        `${index + 1}. ${enfant.prenom} ${enfant.nom}  -  ` +
        `${enfant.age || ""}`;

      doc.text(ligne, marge + 2, y);
      y += 5;

    });

  } else {

    doc.text("Aucun enfant renseigné.", marge + 2, y);
    y += 5;

  }

  y += 3;

  // -----------------------------
  // Type de photo
  // -----------------------------
  doc.setFont("helvetica", "bold");
  doc.text("Type de séance :", marge, y);

  doc.setFont("helvetica", "normal");
  doc.text(data.type_photo || "-", 50, y);

  y += 5;

  doc.setFont("helvetica", "bold");
  doc.text("Créneau :", marge, y);

  doc.setFont("helvetica", "normal");
  doc.text(data.creneau || "-", 50, y);

  y += 5;

  doc.setFont("helvetica", "bold");
  doc.text("Durée prévue :", marge, y);

  doc.setFont("helvetica", "normal");
  doc.text(`${data.duree || 0} minutes`, 50, y);

  y += 8;

  // -----------------------------
  // Texte d'autorisation
  // -----------------------------
  doc.setFont("helvetica", "bold");
  doc.text("Autorisation", marge, y);

  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const texte = `Je soussigné(e), responsable légal du ou des enfants mentionnés ci-dessus, autorise la réalisation de photographies lors du shooting organisé par l'association La Récré Du P'tit Loup.

Ces photographies sont exclusivement destinées à un usage privé et à la remise aux familles. Aucune diffusion publique ne sera effectuée sans une autorisation complémentaire écrite.`;

  const lignes = doc.splitTextToSize(texte, 185);

  doc.text(lignes, marge, y);

  y += lignes.length * 4 + 8;
    // -----------------------------
  // Signatures
  // -----------------------------
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");

  doc.text("Signature du responsable légal :", marge, y);
  doc.text("Signature de la photographe :", 120, y);

  y += 20;

  doc.setFont("helvetica", "normal");

  doc.line(marge, y, 90, y);
  doc.line(120, y, 198, y);

  y += 8;

  // -----------------------------
  // Pied de page
  // -----------------------------
  doc.setDrawColor(180);
  doc.line(marge, 285, 198, 285);

  doc.setFontSize(8);

  doc.text(
    "Association La Récré Du P'tit Loup",
    pageWidth / 2,
    289,
    { align: "center" }
  );

  doc.text(
    "72 rue de la Planquette - 60290 Laigneville",
    pageWidth / 2,
    293,
    { align: "center" }
  );

  doc.text(
    "06 62 37 46 38 - larecreduptitloup@gmail.com",
    pageWidth / 2,
    297,
    { align: "center" }
  );

  // -----------------------------
  // Affichage du PDF
  // -----------------------------
  window.open(doc.output("bloburl"), "_blank");

}
