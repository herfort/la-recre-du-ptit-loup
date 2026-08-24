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
          autorisation: true,
signature: signaturePad.toDataURL("image/png"),
commentaire: ""
        }
      ]);


    if (error) {

      console.error("❌ Erreur inscription :", error);
      alert("Erreur lors de l'enregistrement.");

      return;
    }

await genererPDF();
    // ===============================
// Envoi email Brevo shooting
// ===============================

const enfantsMail = enfants.map(e =>
  e.prenom + " " + e.nom
);


await fetch(
  "/api/send-shooting-email",
  {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({

      email: email,

      nom: nom,

      prenom: prenom,

      enfants: enfantsMail,

      date: document.getElementById("dateEvenement").textContent,

      creneau: creneau.value,

      typePhoto: choixPhoto

    })

  }
);





await fetch(
  "/api/send-shooting-email",
  {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({

      email: email,

      nom: nom,

      prenom: prenom,

      enfants: enfantsMail,

      date: document.getElementById("dateEvenement").textContent,

      creneau: creneau.value,

      typePhoto: choixPhoto

    })

  }
);
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

const doc = new jsPDF({
  orientation: "portrait",
  unit: "mm",
  format: "a4"
});

// Récupération des paramètres du shooting
const { data: parametres, error } = await supabaseClient
  .from("shooting_parametres")
  .select("*")
  .single();

if (error || !parametres) {
  console.error(
    "Erreur récupération paramètres shooting :",
    error
  );

  alert(
    "Impossible de récupérer les informations du shooting."
  );

  return;
}

const pageWidth = 210;
const marge = 12;

let y = 15;

 // ===============================
// RESPONSABLE LÉGAL
// ===============================

doc.setTextColor(70, 130, 90);

doc.setFont(
  "helvetica",
  "bold"
);

doc.setFontSize(12);

doc.text(
  "RESPONSABLE LÉGAL",
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
  document.getElementById("prenom").value +
  " " +
  document.getElementById("nom").value,
  marge + 4,
  y + 6
);

doc.text(
  "Téléphone : " +
  document.getElementById("telephone").value,
  marge + 4,
  y + 12
);

doc.text(
  "Email : " +
  document.getElementById("email").value,
  marge + 4,
  y + 18
);

y += 33;


// ===============================
// ENFANT(S)
// ===============================

doc.setTextColor(70, 130, 90);

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

const blocsEnfants =
  document.querySelectorAll(".enfant");

const hauteurEnfants =
  Math.max(
    18,
    blocsEnfants.length * 6 + 6
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

let yy = y + 6;

blocsEnfants.forEach(bloc => {

  const nom =
    bloc.querySelector(
      'input[name^="nom_enfant_"]'
    ).value;

  const prenom =
    bloc.querySelector(
      'input[name^="prenom_enfant_"]'
    ).value;

  doc.text(
    "• " + prenom + " " + nom,
    marge + 4,
    yy
  );

  yy += 6;

});

y += hauteurEnfants + 8;
  // ===============================
// SÉANCE PHOTO
// ===============================

doc.setTextColor(70, 130, 90);

doc.setFont(
  "helvetica",
  "bold"
);

doc.setFontSize(12);

doc.text(
  "SÉANCE PHOTO",
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

// Date
doc.text(
  "Date : " +
  (
    parametres.date_shooting
      ? new Date(
          parametres.date_shooting
        ).toLocaleDateString("fr-FR")
      : ""
  ),
  marge + 4,
  y + 6
);

// Créneau
doc.text(
  "Créneau : " +
  (
    document.querySelector(
      'input[name="creneau"]:checked'
    )?.value || ""
  ),
  marge + 4,
  y + 12
);

// Type de photo
let typePhotoPDF =
  document.getElementById("typePhoto").value;

if (typePhotoPDF === "individuel") {

  typePhotoPDF =
    "Photo individuelle";

}
else if (typePhotoPDF === "fratrie") {

  typePhotoPDF =
    "Photo fratrie";

}
else if (typePhotoPDF === "les2") {

  typePhotoPDF =
    "Photo individuelle + fratrie";

}

doc.text(
  "Type de photo : " +
  typePhotoPDF,
  95,
  y + 12
);

// Durée
doc.text(
  "Durée : " +
  calculerDureeSeance() +
  " minutes",
  marge + 4,
  y + 18
);

y += 32;
  // ===============================
// AUTORISATION
// ===============================

doc.setTextColor(70, 130, 90);

doc.setFont(
  "helvetica",
  "bold"
);

doc.setFontSize(12);

doc.text(
  "AUTORISATION",
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

const texteAutorisation =

"Je soussigné(e), responsable légal du ou des enfants désignés ci-dessus, autorise la réalisation de photographies dans le cadre du shooting photo organisé par l'association La Récré Du P'tit Loup.\n\n"

+

"J'autorise également la diffusion des photographies réalisées par " +
(parametres.nom_photographe || "la photographe") +
" dans une galerie privée accessible uniquement aux familles participantes afin de permettre la consultation et le téléchargement des images.\n\n"

+

"Ces photographies ne seront utilisées à aucune autre fin sans l'accord préalable des représentants légaux.";

const lignesAutorisation =
doc.splitTextToSize(
  texteAutorisation,
  176
);

doc.text(
  lignesAutorisation,
  marge,
  y
);

y +=
  (lignesAutorisation.length * 4.5)
  + 10;
// ===============================
// SIGNATURE DU RESPONSABLE LÉGAL
// ===============================

doc.setTextColor(70, 130, 90);

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

// Cadre de signature
doc.setDrawColor(120);

doc.rect(
  marge,
  y,
  180,
  22
);

// Signature manuscrite
if (signaturePad && !signaturePad.isEmpty()) {

  const signatureImage =
    signaturePad.toDataURL("image/png");

  doc.addImage(
    signatureImage,
    "PNG",
    marge + 5,
    y + 2,
    70,
    17
  );

} else {

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(9);

  doc.text(
    "Signature non disponible",
    marge + 5,
    y + 12
  );

}

y += 28;
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
