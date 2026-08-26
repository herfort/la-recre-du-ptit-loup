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

  <label>Nom de l'enfant</label>
  <input
    type="text"
    name="nom_enfant_${compteurEnfant}"
  >

  <label>Prénom de l'enfant</label>
  <input
    type="text"
    name="prenom_enfant_${compteurEnfant}"
  >

  <div class="infosParentEmployeur" style="display:none;">

    <h4>👨‍👩‍👧 Parent employeur / responsable légal</h4>

    <label>Nom du parent</label>
    <input
      type="text"
      name="nom_parent_enfant_${compteurEnfant}"
    >

    <label>Prénom du parent</label>
    <input
      type="text"
      name="prenom_parent_enfant_${compteurEnfant}"
    >
<label>Téléphone du parent</label>
<input
  type="tel"
  name="telephone_parent_enfant_${compteurEnfant}"
>
    <label>Email du parent</label>
    <input
      type="email"
      name="email_parent_enfant_${compteurEnfant}"
    >

  </div>

  <button type="button" class="supprimerEnfant">
    ❌ Supprimer
  </button>

  <hr>
`;


    listeEnfants.appendChild(bloc);
    if (
  document.querySelector(
    'input[name="typeInscription"]:checked'
  )?.value === "assistante"
) {
  bloc.querySelector(
    ".infosParentEmployeur"
  ).style.display = "block";
}
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
// Affichage parent employeur
// ===============================

document
  .querySelectorAll(
    'input[name="typeInscription"]'
  )
  .forEach(radio => {

    radio.addEventListener(
      "change",
      function() {

        const type =
          document.querySelector(
            'input[name="typeInscription"]:checked'
          )?.value;

        document
          .querySelectorAll(
            ".infosParentEmployeur"
          )
          .forEach(zone => {

            if(type === "assistante") {
              zone.style.display = "block";
            } else {
              zone.style.display = "none";
            }

          });

      }
    );

  });
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

const typeInscription =
  document.querySelector(
    'input[name="typeInscription"]:checked'
  )?.value || "parent";


document.querySelectorAll(".enfant").forEach(bloc => {

  const nomEnfant =
    bloc.querySelector(
      'input[name^="nom_enfant_"]'
    ).value.trim();

  const prenomEnfant =
    bloc.querySelector(
      'input[name^="prenom_enfant_"]'
    ).value.trim();


  const enfant = {
    nom: nomEnfant,
    prenom: prenomEnfant
  };


  // Si inscription par une assistante maternelle
  if (typeInscription === "assistante") {

    enfant.nom_parent =
      bloc.querySelector(
        'input[name^="nom_parent_enfant_"]'
      ).value.trim();

    enfant.prenom_parent =
      bloc.querySelector(
        'input[name^="prenom_parent_enfant_"]'
      ).value.trim();
enfant.telephone_parent =
  bloc.querySelector(
    'input[name^="telephone_parent_enfant_"]'
  ).value.trim();
    enfant.email_parent =
      bloc.querySelector(
        'input[name^="email_parent_enfant_"]'
      ).value.trim();

  }


  enfants.push(enfant);

});
// ===============================
// Vérification parents employeurs
// ===============================

if (typeInscription === "assistante") {

  if (enfants.length === 0) {

    alert("Merci d'ajouter au moins un enfant.");
    return;

  }

  for (const enfant of enfants) {

   if (
  !enfant.nom ||
  !enfant.prenom ||
  !enfant.nom_parent ||
  !enfant.prenom_parent ||
  !enfant.email_parent ||
  !enfant.telephone_parent
) {

      alert(
        "Merci de renseigner toutes les informations de l'enfant et de son parent employeur."
      );

      return;
    }

  }

}

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
  // ===============================
// Vérification de la signature
// ===============================




// Le parent doit signer directement
if (
  typeInscription === "parent" &&
  (!signaturePad || signaturePad.isEmpty())
) {

  alert("Merci de signer l'autorisation.");

  return;
}
 const {
  data: inscriptionCreee,
  error
} = await supabaseClient
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

      autorisation:
        typeInscription === "parent",

      signature:
        typeInscription === "parent" &&
        signaturePad &&
        !signaturePad.isEmpty()
          ? signaturePad.toDataURL("image/png")
          : null,

      commentaire: ""
    }
  ])
  .select("id")
  .single();


    if (error) {

      console.error("❌ Erreur inscription :", error);
      alert("Erreur lors de l'enregistrement.");

      return;
    }
// ===============================
// Autorisations des parents employeurs
// ===============================

if (typeInscription === "assistante") {

  const autorisations = enfants.map(enfant => {

    return {

      inscription_id: inscriptionCreee.id,

      nom_enfant: enfant.nom,
      prenom_enfant: enfant.prenom,

      nom_parent: enfant.nom_parent,
      prenom_parent: enfant.prenom_parent,
      telephone_parent: enfant.telephone_parent,
      email_parent: enfant.email_parent,

      token: crypto.randomUUID(),

      signature: null,
      autorisation_signee: false,
      date_signature: null

    };

  });


  const { error: erreurAutorisations } =
    await supabaseClient
      .from("shooting_autorisations")
      .insert(autorisations);


if (erreurAutorisations) {

  console.error(
    "❌ Erreur création autorisations :",
    erreurAutorisations
  );

  alert(
    "L'inscription a été enregistrée, mais les autorisations des parents n'ont pas pu être créées."
  );

  return;
}


// ===============================
// Envoi des mails aux parents
// ===============================

for (const autorisation of autorisations) {

  try {

    const reponseMail = await fetch(
      "/api/send-autorisation-parent",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          emailParent:
            autorisation.email_parent,

          prenomParent:
            autorisation.prenom_parent,

          prenomEnfant:
            autorisation.prenom_enfant,

          nomEnfant:
            autorisation.nom_enfant,

          token:
            autorisation.token

        })

      }
    );

    const resultatMail =
      await reponseMail.json();

    if (!reponseMail.ok) {

      console.error(
        "❌ Erreur mail parent :",
        resultatMail
      );

    }

  } catch (erreurMail) {

    console.error(
      "❌ Erreur envoi mail parent :",
      erreurMail
    );

  }

}

}
const pdfBase64 = await genererPDF();
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

      typePhoto: choixPhoto,
pdfBase64: pdfBase64
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

  const { data: parametres, error } =
    await supabaseClient
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

    return null;
  }


  const enfants = [];

  document.querySelectorAll(".enfant")
    .forEach(bloc => {

      const nom =
        bloc.querySelector(
          'input[name^="nom_enfant_"]'
        ).value.trim();

      const prenom =
        bloc.querySelector(
          'input[name^="prenom_enfant_"]'
        ).value.trim();

      enfants.push({
        nom,
        prenom
      });

    });


  const creneau =
    document.querySelector(
      'input[name="creneau"]:checked'
    );


  const signature =
    signaturePad &&
    !signaturePad.isEmpty()
      ? signaturePad.toDataURL("image/png")
      : null;


  const doc = creerPDFShooting({

    jsPDF: jsPDF,

    parametres: parametres,

    nomParent:
      document.getElementById("nom").value.trim(),

    prenomParent:
      document.getElementById("prenom").value.trim(),

    telephone:
      document.getElementById("telephone").value.trim(),

    email:
      document.getElementById("email").value.trim(),

    enfants: enfants,

    typePhoto:
      document.getElementById("typePhoto").value,

    creneau:
      creneau ? creneau.value : "",

    duree:
      calculerDureeSeance(),

    signature: signature

  });


  const pdfBase64 =
    doc.output("datauristring")
      .split(",")[1];


  return pdfBase64;
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
