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
let parametresShooting = null;
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
    if(parametresShooting){
  genererCreneaux(parametresShooting);
}
calculerDureeSeance();

    bloc.querySelector(".supprimerEnfant")
      .addEventListener("click", function() {
        bloc.remove();
        if(parametresShooting){
  genererCreneaux(parametresShooting);
}
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
 parametresShooting = data;
genererCreneaux(parametresShooting);
}


// ===============================
// Génération des créneaux
// ===============================

async function genererCreneaux(parametres) {

  const zone = document.getElementById("creneaux");

  if (!zone) return;

  zone.innerHTML = "";

  // Durée de la séance
  const duree = calculerDureeSeance() || 5;

  // Horaires
  const dateBase = parametres.date_shooting;

  const debutJournee = new Date(`${dateBase}T${parametres.heure_debut}`);
  const finJournee = new Date(`${dateBase}T${parametres.heure_fin}`);

  const pauseDebut = parametres.pause_debut
    ? new Date(`${dateBase}T${parametres.pause_debut}`)
    : null;

  const pauseFin = parametres.pause_fin
    ? new Date(`${dateBase}T${parametres.pause_fin}`)
    : null;

  // Réservations existantes
  const { data: inscriptions, error } = await supabaseClient
    .from("shooting_inscriptions")
    .select("creneau,duree");

  if (error) {
    console.error(error);
    return;
  }

  let heureCourante = new Date(debutJournee);

  while (heureCourante < finJournee) {

    const finSeance = new Date(heureCourante);
    finSeance.setMinutes(finSeance.getMinutes() + duree);

    // Dépasse la fin de journée
    if (finSeance > finJournee) {
      break;
    }

    // Passe dans la pause
    if (
      pauseDebut &&
      pauseFin &&
      heureCourante < pauseFin &&
      finSeance > pauseDebut
    ) {
      heureCourante.setMinutes(heureCourante.getMinutes() + 5);
      continue;
    }

    let disponible = true;

    // Vérifie toutes les réservations
    for (const reservation of inscriptions) {

      const debutReservation = new Date(
        `${dateBase}T${reservation.creneau}`
      );

      const finReservation = new Date(debutReservation);
      finReservation.setMinutes(
        finReservation.getMinutes() + reservation.duree
      );

      // Chevauchement ?
      if (
        heureCourante < finReservation &&
        finSeance > debutReservation
      ) {
        disponible = false;
        break;
      }

    }

    if (disponible) {

      const heure = heureCourante.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
      });

      zone.innerHTML += `
        <label>
          <input
            type="radio"
            name="creneau"
            value="${heure}">
          ${heure}
        </label><br>
      `;

    }

    heureCourante.setMinutes(
      heureCourante.getMinutes() + 5
    );

  }

}
chargerParametresShooting();
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

console.log("Durée calculée :", duree);
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

 typePhoto.addEventListener("change", function () {

  calculerDureeSeance();

  if (parametresShooting) {
    genererCreneaux(parametresShooting);
  }

});

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

const dureeNecessaire = calculerDureeSeance() || 5;

// ===============================
// Vérification du créneau
// ===============================

const { data: reservationsExistantes, error: erreurControle } =
  await supabaseClient
    .from("shooting_inscriptions")
    .select("creneau,duree");

if (erreurControle) {
  console.error(erreurControle);
  alert("Impossible de vérifier les disponibilités.");
  return;
}

let creneauOccupe = false;

const debutChoisi = new Date(`2000-01-01T${creneau.value}`);

const finChoisie = new Date(debutChoisi);
finChoisie.setMinutes(
  finChoisie.getMinutes() + dureeNecessaire
);

for (const reservation of reservationsExistantes) {

  const debutReservation =
    new Date(`2000-01-01T${reservation.creneau}`);

  const finReservation =
    new Date(debutReservation);

  finReservation.setMinutes(
    finReservation.getMinutes() + reservation.duree
  );

  if (
    debutChoisi < finReservation &&
    finChoisie > debutReservation
  ) {
    creneauOccupe = true;
    break;
  }

}

if (creneauOccupe) {
  alert("❌ Ce créneau vient d'être réservé. Merci d'en choisir un autre.");

  if (parametresShooting) {
    genererCreneaux(parametresShooting);
  }

  return;
}
    // Vérification de la signature

if (signaturePad.isEmpty()) {

  alert("Merci de signer l'autorisation.");

  return;

}
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
          duree: dureeNecessaire,
          autorisation: false,
          commentaire: ""
        }
      ]);


    if (error) {

      console.error("❌ Erreur inscription :", error);
      alert("Erreur lors de l'enregistrement.");

      return;
    }

await genererPDF();
    alert("✅ Inscription enregistrée avec succès !");


    formulaire.reset();

    document.getElementById("listeEnfants").innerHTML = "";

  });

}
// ===============================
// Génération du PDF
// ===============================

async function genererPDF() {

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF();

  let y = 20;

  doc.setFontSize(18);
  doc.text("La Récré Du P'tit Loup", 20, y);

  y += 10;

  doc.setFontSize(14);
  doc.text("Autorisation Shooting Photo", 20, y);

  y += 15;

  doc.setFontSize(11);

  doc.text("Responsable", 20, y);

  y += 8;
  doc.text("Nom : " + document.getElementById("nom").value, 20, y);

  y += 7;
  doc.text("Prénom : " + document.getElementById("prenom").value, 20, y);

  y += 7;
  doc.text("Téléphone : " + document.getElementById("telephone").value, 20, y);

  y += 7;
  doc.text("Email : " + document.getElementById("email").value, 20, y);

  y += 15;

  doc.text("Enfants :", 20, y);

  document.querySelectorAll(".enfant").forEach(bloc => {

    const nom =
      bloc.querySelector('input[name^="nom_enfant_"]').value;

    const prenom =
      bloc.querySelector('input[name^="prenom_enfant_"]').value;

    y += 7;

    doc.text("- " + prenom + " " + nom, 25, y);

  });

  y += 12;

  doc.text(
    "Type de photo : " +
    document.getElementById("typePhoto").value,
    20,
    y
  );

  y += 7;

  const creneau =
    document.querySelector('input[name="creneau"]:checked');

  doc.text(
    "Créneau : " + creneau.value,
    20,
    y
  );

  y += 15;

  doc.setFontSize(10);

  doc.text(
    "Je soussigné(e), responsable légal, autorise la réalisation",
    20,
    y
  );

  y += 6;

  doc.text(
    "des photographies de mon (mes) enfant(s).",
    20,
    y
  );

  y += 20;


  doc.text("Signature du responsable :", 20, y);

y += 10;


// Ajout de la signature

if (signaturePad && !signaturePad.isEmpty()) {

  const signatureImage = signaturePad.toDataURL("image/png");

  doc.addImage(
    signatureImage,
    "PNG",
    20,
    y,
    80,
    40
  );

  y += 50;

} else {

  doc.line(20, y + 20, 90, y + 20);

}

  doc.save("Autorisation_Shooting.pdf");

}
// ===============================
// Signature électronique
// ===============================

const canvas = document.getElementById("signaturePad");

let signaturePad = null;

if (canvas) {

  signaturePad = new SignaturePad(canvas, {
    backgroundColor: "rgb(255,255,255)"
  });

}

const boutonEffacer = document.getElementById("effacerSignature");

if (boutonEffacer && signaturePad) {

  boutonEffacer.addEventListener("click", function () {

    signaturePad.clear();

  });

}
