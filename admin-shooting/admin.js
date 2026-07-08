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

async function voirAutorisation(id){


const { data, error } =
await supabaseClient
.from("shooting_inscriptions")
.select("*")
.eq("id", id)
.single();


if(error){

console.error(error);

alert(
"Erreur récupération inscription"
);

return;

}



const { jsPDF } =
window.jspdf;


const doc =
new jsPDF();



doc.setFontSize(18);

doc.text(
"La Récré Du P'tit Loup",
20,
20
);



doc.setFontSize(14);

doc.text(
"Autorisation parentale - Shooting Photo",
20,
35
);



doc.setFontSize(12);


let y = 55;


doc.text(
"Responsable : " +
data.prenom_parent +
" " +
data.nom_parent,
20,
y
);


y += 10;


doc.text(
"Téléphone : " +
data.telephone,
20,
y
);


y += 10;


doc.text(
"Email : " +
data.email,
20,
y
);


y += 15;


doc.text(
"Enfant(s) :",
20,
y
);


y += 10;


data.enfants.forEach(enfant=>{

doc.text(
"- " +
enfant.prenom +
" " +
enfant.nom,
25,
y
);

y += 8;

});


y += 10;


doc.text(
"Type de séance : " +
data.type_photo,
20,
y
);


y += 10;


doc.text(
"Créneau : " +
data.creneau,
20,
y
);


y += 20;


doc.text(
"Signature du responsable :",
20,
y
);


doc.rect(
20,
y + 5,
80,
35
);



doc.save(
"autorisation-" +
data.nom_parent +
".pdf"
);


}
