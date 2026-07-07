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
console.log("Bouton enfant :", boutonAjouterEnfant);
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
calculerDureeSeance();

    bloc.querySelector(".supprimerEnfant")
      .addEventListener("click", function() {
        bloc.remove();
calculerDureeSeance();
      });


  });

}
// ===============================
// Chargement paramètres shooting
// ===============================
// ===============================
// Calcul durée séance
// ===============================


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

async function genererCreneaux(parametres) {

  const zone = document.getElementById("creneaux");

  if (!zone) return;
// Récupération des créneaux déjà réservés
const { data: inscriptions, error } = await supabaseClient
  .from("shooting_inscriptions")
  .select("creneau");


if (error) {
  console.error("Erreur récupération réservations :", error);
}


const creneauxPris = inscriptions
  ? inscriptions.map(i => i.creneau)
  : [];

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


     if (!creneauxPris.includes(heure)) {

  zone.innerHTML += `
  <label>
    <input type="radio" name="creneau" value="${heure}">
    ${heure}
  </label><br>
  `;

}
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


// ===============================
// Enregistrement de l'inscription
// ===============================

const formulaire = document.getElementById("formulaire");

if (formulaire) {

  formulaire.addEventListener("submit", async function (e) {

    e.preventDefault();


    const nom = document.getElementById("nom").value.trim();
    const prenom = document.getElementById("prenom").value.trim();
    const telephone = document.getElementById("telephone").value.trim();
    const email = document.getElementById("email").value.trim();


    const enfants = [];

    document.querySelectorAll(".enfant").forEach(bloc => {

      const nomEnfant =
      bloc.querySelector('input[name^="nom_enfant_"]').value.trim();

      const prenomEnfant =
      bloc.querySelector('input[name^="prenom_enfant_"]').value.trim();


      enfants.push({
        nom: nomEnfant,
        prenom: prenomEnfant
      });

    });


    const choixPhoto =
    document.getElementById("typePhoto").value;


    const creneau =
    document.querySelector('input[name="creneau"]:checked');


    if (!creneau) {
      alert("Veuillez sélectionner un créneau.");
      return;
    }


    const duree = calculerDureeSeance();


    const { error } = await supabaseClient
      .from("shooting_inscriptions")
      .insert([
        {
          nom_parent: nom,
          prenom_parent: prenom,
          telephone: telephone,
          email: email,
          enfants: enfants,
          type_photo: choixPhoto,
          creneau: creneau.value,
          duree: duree,
          autorisation: false,
          commentaire: ""
        }
      ]);


    if (error) {

      console.error("❌ Erreur inscription :", error);
      alert("Erreur lors de l'enregistrement.");

      return;
    }


    alert("✅ Inscription enregistrée avec succès !");


    formulaire.reset();

    document.getElementById("listeEnfants").innerHTML = "";

  });

}
