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
// AFFICHER L'AUTORISATION PARENTALE
// Partie 1 / 4
// ======================================================

async function voirAutorisation(id){

// ===============================
// Récupération de l'inscription
// ===============================

const { data, error } =
await supabaseClient
.from("shooting_inscriptions")
.select("*")
.eq("id", id)
.single();

if(error || !data){

console.error(error);

alert(
"Impossible de récupérer l'inscription."
);

return;

}

// ===============================
// Récupération des paramètres
// ===============================

const {
data: parametres,
error: erreurParametres
}
=
await supabaseClient
.from("shooting_parametres")
.select("*")
.single();

if(erreurParametres){

console.error(erreurParametres);

alert(
"Impossible de récupérer les paramètres du shooting."
);

return;

}

// ===============================
// Création du PDF
// ===============================

const { jsPDF } =
window.jspdf;

const doc =
new jsPDF({

orientation:"portrait",
unit:"mm",
format:"a4"

});

const largeur = 210;

const marge = 15;

let y = 18;

// ===============================
// Couleurs
// ===============================

const vert =
[43,125,64];

const gris =
[110,110,110];

// ===============================
// Titre
// ===============================

doc.setTextColor(...vert);

doc.setFont(
"helvetica",
"bold"
);

doc.setFontSize(18);

doc.text(
"LA RÉCRÉ DU P'TIT LOUP",
largeur/2,
18,
{
align:"center"
}
);

doc.setTextColor(0);

doc.setFontSize(13);

doc.text(
"Autorisation parentale",
largeur/2,
27,
{
align:"center"
}
);

doc.setFontSize(11);

doc.setTextColor(...gris);

doc.text(
"Shooting Photo",
largeur/2,
34,
{
align:"center"
}
);

// Ligne

doc.setDrawColor(...vert);

doc.setLineWidth(0.6);

doc.line(
15,
39,
195,
39
);

y = 48;
  // ===============================
// Informations photographe
// ===============================

doc.setTextColor(...vert);

doc.setFont(
"helvetica",
"bold"
);

doc.setFontSize(12);

doc.text(
" PHOTOGRAPHE",
marge,
y
);

y += 5;

doc.setDrawColor(170);

doc.rect(
marge,
y,
180,
22
);

doc.setTextColor(0);

doc.setFont(
"helvetica",
"normal"
);

doc.setFontSize(10);

doc.text(
"Nom : " +
(parametres.nom_photographe || ""),
marge + 4,
y + 6
);

doc.text(
"Email : " +
(parametres.email_photographe || ""),
marge + 4,
y + 12
);

doc.text(
"Facebook : " +
(parametres.facebook_photographe || ""),
marge + 4,
y + 18
);

y += 30;


// ===============================
// Responsable légal
// ===============================

doc.setTextColor(...vert);

doc.setFont(
"helvetica",
"bold"
);

doc.setFontSize(12);

doc.text(
" RESPONSABLE LÉGAL",
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

doc.setFont(
"helvetica",
"normal"
);

doc.setFontSize(10);

doc.text(
"Nom : " +
data.prenom_parent +
" " +
data.nom_parent,
marge + 4,
y + 6
);

doc.text(
"Téléphone : " +
data.telephone,
marge + 4,
y + 12
);

doc.text(
"Email : " +
data.email,
marge + 4,
y + 18
);

y += 33;


// ===============================
// Enfant(s)
// ===============================

doc.setTextColor(...vert);

doc.setFont(
"helvetica",
"bold"
);

doc.setFontSize(12);

doc.text(
"ENFANT(S)",
marge,
y
);

y += 5;

doc.setDrawColor(170);

const hauteurEnfants =
Math.max(
18,
data.enfants.length * 6 + 6
);

doc.rect(
marge,
y,
180,
hauteurEnfants
);

doc.setTextColor(0);

doc.setFont(
"helvetica",
"normal"
);

doc.setFontSize(10);

let yy =
y + 6;

data.enfants.forEach(enfant=>{

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
  // ===============================
// Séance photo
// ===============================

doc.setTextColor(...vert);

doc.setFont(
"helvetica",
"bold"
);

doc.setFontSize(12);

doc.text(
" SÉANCE PHOTO",
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

doc.setFont(
"helvetica",
"normal"
);

doc.setFontSize(10);

doc.text(
"Date : " +
(parametres.date_shooting || ""),
marge + 4,
y + 6
);

doc.text(
"Créneau : " +
data.creneau,
marge + 4,
y + 12
);

doc.text(
"Type de photo : " +
data.type_photo,
95,
y + 12
);

doc.text(
"Durée : " +
data.duree +
" minutes",
marge + 4,
y + 18
);

y += 32;


// ===============================
// Autorisation
// ===============================

doc.setTextColor(...vert);

doc.setFont(
"helvetica",
"bold"
);

doc.setFontSize(12);

doc.text(
" AUTORISATION",
marge,
y
);

y += 5;

doc.setTextColor(0);

doc.setFont(
"helvetica",
"normal"
);

doc.setFontSize(10);

const texte =

"Je soussigné(e), responsable légal du ou des enfants désignés ci-dessus, autorise la réalisation de photographies dans le cadre du shooting photo organisé par l'association La Récré Du P'tit Loup.\n\n"

+

"J'autorise également la diffusion des photographies réalisées dans une galerie privée accessible uniquement aux familles participantes afin de permettre la consultation et le téléchargement des images.\n\n"

+

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
+
10;


// ===============================
// Signature
// ===============================

doc.setTextColor(...vert);

doc.setFont(
"helvetica",
"bold"
);

doc.setFontSize(12);

doc.text(
"✍ Signature du responsable légal",
marge,
y
);

y += 5;

doc.setDrawColor(120);

doc.rect(
marge,
y,
180,
32
);

y += 40;
  // ===============================
// Pied de page
// ===============================

doc.setDrawColor(180);

doc.line(
15,
282,
195,
282
);

doc.setFont(
"helvetica",
"bold"
);

doc.setFontSize(9);

doc.setTextColor(...vert);

doc.text(
"Association La Récré Du P'tit Loup",
105,
287,
{
align:"center"
}
);

doc.setFont(
"helvetica",
"normal"
);

doc.setTextColor(80);

doc.setFontSize(8);

doc.text(
"72 rue de la Planquette - 60290 Laigneville",
105,
291,
{
align:"center"
}
);

doc.text(
"06 62 37 46 38 - larecreduptitloup@gmail.com",
105,
295,
{
align:"center"
}
);

// ===============================
// Téléchargement
// ===============================

const nomFichier =
"Autorisation_" +
data.nom_parent.replace(/\s+/g,"_") +
".pdf";

doc.save(
nomFichier
);

}
