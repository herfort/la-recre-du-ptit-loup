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

async function voirAutorisation(id){


const { data, error } =
await supabaseClient
.from("shooting_inscriptions")
.select("*")
.eq("id", id)
.single();


if(error){

console.error(error);
alert("Erreur récupération inscription");
return;

}


// Récupération des infos shooting

const { data: parametres } =
await supabaseClient
.from("shooting_parametres")
.select("*")
.single();



const { jsPDF } =
window.jspdf;


const doc =
new jsPDF();






// ===============================
// En-tête
// ===============================

doc.setFontSize(20);
doc.text(
"La Récré Du P'tit Loup",
105,
20,
{
align:"center"
}
);


doc.setFontSize(14);

doc.text(
"Autorisation parentale",
105,
32,
{
align:"center"
}
);


doc.text(
"Shooting Photo",
105,
40,
{
align:"center"
}
);


// Ligne de séparation

doc.line(
20,
47,
190,
47
);


let y = 60;



// ===============================
// Informations photographe
// ===============================

doc.setFontSize(13);

doc.text(
"Informations photographe",
25,
y
);

y += 8;


// Cadre

doc.rect(
20,
y - 5,
170,
30
);


doc.setFontSize(11);

doc.text(
"Nom : " +
(parametres && parametres.nom_photographe ? parametres.nom_photographe : ""),
30,
y + 5
);


doc.text(
"Email : " +
(parametres && parametres.email_photographe ? parametres.email_photographe : ""),
30,
y + 13
);


doc.text(
"Facebook : " +
(parametres && parametres.facebook_photographe ? parametres.facebook_photographe : ""),
30,
y + 21
);

y += 45;

// ===============================
// Informations famille
// ===============================

doc.setFontSize(13);

doc.text(
"Responsable légal",
25,
y
);

y += 8;


doc.rect(
20,
y - 5,
170,
35
);


doc.setFontSize(11);


doc.text(
data.prenom_parent +
" " +
data.nom_parent,
30,
y + 7
);


doc.text(
"Téléphone : " +
data.telephone,
30,
y + 15
);


doc.text(
"Email : " +
data.email,
30,
y + 23
);


y += 50;
// Enfants

doc.setFontSize(13);

doc.text(
"Enfant(s)",
20,
y
);


y += 8;


doc.setFontSize(12);


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



// Séance

doc.setFontSize(13);

doc.text(
"Shooting",
20,
y
);


y += 8;


doc.setFontSize(12);


doc.text(
"Date : " +
(parametres?.date_shooting || ""),
20,
y
);


y += 8;


doc.text(
"Créneau : " +
data.creneau,
20,
y
);


y += 8;


doc.text(
"Type de photo : " +
data.type_photo,
20,
y
);



y += 20;


// Texte autorisation

doc.setFontSize(11);


const texte =
"J’autorise La Récré Du P’tit Loup et la photographe à réaliser des photographies de mon enfant dans le cadre du shooting photo organisé par l’association.\n\n" +
"J’autorise également la diffusion des photographies réalisées dans une galerie photo privée, accessible uniquement aux familles participantes au shooting, afin de permettre le partage et la consultation des images par les participants.\n\n" +
"Ces photographies ne seront pas utilisées à d’autres fins sans l’accord préalable des responsables légaux.";


const lignes =
doc.splitTextToSize(
texte,
165
);


doc.text(
lignes,
20,
y
);


// On descend automatiquement selon la hauteur du texte
y += (lignes.length * 6) + 15;


// ===============================
// Signature
// ===============================

if(y > 220){

  doc.addPage();

  y = 30;

}


doc.setFontSize(12);

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


y += 55;


doc.text(
"Date : ____________________",
20,
y
);
