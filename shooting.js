// ===============================
// Connexion à Supabase
// ===============================

const SUPABASE_URL = "https://jbialegbayusckjjajnq.supabase.co";
const SUPABASE_KEY =
"sb_publishable__buDYmorRpoNxxjFGq56Iw_28SaX6IG";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

console.log("✅ Connexion à Supabase réussie");

// ===============================
// Gestion des enfants
// ===============================

let compteurEnfant = 0;

const boutonAjouterEnfant = document.getElementById("ajouterEnfant");
const listeEnfants = document.getElementById("listeEnfants");


if (boutonAjouterEnfant && listeEnfants) {

  boutonAjouterEnfant.addEventListener("click", function() {

    compteurEnfant++;


    const bloc = document.createElement("div");

    bloc.className = "enfant";


    bloc.innerHTML = `
      <h3>👶 Enfant ${compteurEnfant}</h3>

      <label>Nom</label>
      <input type="text" name="nom_enfant_${compteurEnfant}">

      <label>Prénom</label>
      <input type="text" name="prenom_enfant_${compteurEnfant}">

      <button type="button" class="supprimerEnfant">
        ❌ Supprimer
      </button>

      <hr>
    `;


    listeEnfants.appendChild(bloc);


    bloc.querySelector(".supprimerEnfant")
      .addEventListener("click", function() {
        bloc.remove();
      });


  });

}
// ===============================
// Chargement paramètres shooting
// ===============================
// ===============================
// Calcul durée séance
// ===============================

function calculerDureeSeance() {

  const enfants = document.querySelectorAll(".enfant").length;

  const type = document.getElementById("typePhoto").value;


  let duree = 0;


  // Photos individuelles
  if (type === "individuel" || type === "les2") {
    duree += enfants * 5;
  }


  // Photo fratrie
  if (type === "fratrie" || type === "les2") {
    duree += 5;
  }


  return duree;
}
async function chargerParametresShooting() {

  const { data, error } = await supabaseClient
    .from("shooting_parametres")
    .select("*")
    .single();


  if (error) {
    console.error("❌ Erreur récupération paramètres :", error);
    return;
  }


  console.log("✅ Paramètres shooting :", data);


  // Affichage date
  const date = document.getElementById("dateEvenement");

  if (date && data.date_shooting) {
    date.textContent = data.date_shooting;
  }


  // Création des créneaux
  genererCreneaux(data);
}


// ===============================
// Génération des créneaux
// ===============================

function genererCreneaux(parametres) {

  const zone = document.getElementById("creneaux");

  if (!zone) return;


  zone.innerHTML = "";


  let dateBase = parametres.date_shooting;


  let debut = new Date(`${dateBase}T${parametres.heure_debut}`);
  let fin = new Date(`${dateBase}T${parametres.heure_fin}`);


  let pauseDebut = parametres.pause_debut
    ? new Date(`${dateBase}T${parametres.pause_debut}`)
    : null;


  let pauseFin = parametres.pause_fin
    ? new Date(`${dateBase}T${parametres.pause_fin}`)
    : null;



  while (debut < fin) {


    if (
      !pauseDebut ||
      !pauseFin ||
      debut < pauseDebut ||
      debut >= pauseFin
    ) {


      let heure = debut.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
      });


      zone.innerHTML += `
        <label>
          <input type="radio" name="creneau" value="${heure}">
          ${heure}
        </label><br>
      `;
    }


    debut.setMinutes(debut.getMinutes() + 5);
  }

}


// Lancement
chargerParametresShooting();
// ===============================
// Calcul durée séance
// ===============================

function calculerDureeSeance() {

  const nombreEnfants = document.querySelectorAll(".enfant").length;

  const type = document.getElementById("typePhoto").value;


  let duree = 0;


  if (type === "individuel" || type === "les2") {
    duree += nombreEnfants * 5;
  }


  if (type === "fratrie" || type === "les2") {
    duree += 5;
  }


  const affichage = document.getElementById("dureeSeance");


  if (affichage) {

    affichage.textContent =
      "Durée estimée : " + duree + " minutes";

  }


  return duree;
}
// Mise à jour durée quand on ajoute/supprime ou change le type

document.addEventListener("click", function(e){

  if(
    e.target.id === "ajouterEnfant" ||
    e.target.classList.contains("supprimerEnfant")
  ){
    setTimeout(calculerDureeSeance,100);
  }

});


const typePhoto = document.getElementById("typePhoto");

if(typePhoto){

  typePhoto.addEventListener(
    "change",
    calculerDureeSeance
  );

}
