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

  // ===============================
  // Inscriptions shooting
  // ===============================

  const { data, error } =
    await supabaseClient
      .from("shooting_inscriptions")
      .select("*")
      .order("creneau");

  if(error){

    console.error(error);
    return;

  }


  // ===============================
  // Autorisations parentales
  // ===============================

  const {
    data: autorisations,
    error: erreurAutorisations
  } =
    await supabaseClient
     .from("shooting_autorisations")
.select(
  "id, inscription_id, nom_enfant, prenom_enfant, enfants, nom_parent, prenom_parent, telephone_parent, email_parent, type_photo, signature, autorisation_signee, date_signature"
);


  if(erreurAutorisations){

    console.error(
      "Erreur chargement autorisations :",
      erreurAutorisations
    );

  }
// ===============================
// COMPTEUR DES AUTORISATIONS
// ===============================

const listeAutorisations =
  autorisations || [];

const nombreSignees =
  listeAutorisations.filter(
    autorisation =>
      autorisation.autorisation_signee === true
  ).length;

const nombreEnAttente =
  listeAutorisations.filter(
    autorisation =>
      autorisation.autorisation_signee !== true
  ).length;


const compteurSignees =
  document.getElementById(
    "nbAutorisationsSignees"
  );

const compteurAttente =
  document.getElementById(
    "nbAutorisationsAttente"
  );


if (compteurSignees) {
  compteurSignees.textContent =
    nombreSignees;
}

if (compteurAttente) {
  compteurAttente.textContent =
    nombreEnAttente;
}

  // ===============================
  // Ajout des autorisations
  // aux inscriptions
  // ===============================

  data.forEach(inscription => {

    inscription.autorisations =
      (autorisations || []).filter(
        autorisation =>
          Number(autorisation.inscription_id) ===
          Number(inscription.id)
      );

  });


  console.log(
    "Inscriptions + autorisations :",
    data
  );


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
        <td colspan="7">
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

let nbFamilles = 0;
let nbAutorisationsSignees = 0;
let nbAutorisationsAttente = 0;


data.forEach(inscription => {

  // Nombre d'enfants
  nbEnfants +=
    Array.isArray(inscription.enfants)
      ? inscription.enfants.length
      : 0;


  // Temps réservé
  tempsReserve +=
    Number(inscription.duree) || 0;


  const autorisations =
    inscription.autorisations || [];


  // ======================================
  // AUTORISATIONS PAR FAMILLE
  // ======================================

  if (autorisations.length > 0) {

    // Une autorisation = une famille
    nbFamilles += autorisations.length;


    autorisations.forEach(
      autorisation => {

        if (
          autorisation.autorisation_signee === true
        ) {

          nbAutorisationsSignees++;

        } else {

          nbAutorisationsAttente++;

        }

      }
    );

  }

  else {

    // Parent inscrit directement :
    // une réservation = une famille
    nbFamilles++;


    if (
      inscription.autorisation === true ||
      inscription.signature
    ) {

      nbAutorisationsSignees++;

    } else {

      nbAutorisationsAttente++;

    }

  }

});


document
  .getElementById("nbFamilles")
  .textContent =
    nbFamilles;


document
  .getElementById("nbEnfants")
  .textContent =
    nbEnfants;


document
  .getElementById(
    "nbAutorisationsSignees"
  )
  .textContent =
    nbAutorisationsSignees;


document
  .getElementById(
    "nbAutorisationsAttente"
  )
  .textContent =
    nbAutorisationsAttente;

  const heures =
    Math.floor(tempsReserve / 60);

  const minutes =
    tempsReserve % 60;

  document.getElementById("tempsReserve").textContent =
    heures + " h " + minutes + " min";


  // ===============================
  // Affichage inscriptions
  // ===============================

  data.forEach(inscription => {

    const autorisations =
      inscription.autorisations || [];

    let contenuEnfants = "";
    let contenuType = "";
    let contenuAutorisation = "";
    let boutonsPDF = "";


    // ==========================================
    // INSCRIPTION ASSISTANTE MATERNELLE
    // ==========================================

    if (autorisations.length > 0) {

      autorisations.forEach(
        (autorisation, index) => {

          const enfantsFamille =
            Array.isArray(autorisation.enfants) &&
            autorisation.enfants.length > 0
              ? autorisation.enfants
              : [
                  {
                    prenom:
                      autorisation.prenom_enfant || "",
                    nom:
                      autorisation.nom_enfant || ""
                  }
                ];


        const listeEnfants =
  enfantsFamille
    .map(
      (enfant, indexEnfant) => `
        <div class="enfant-admin-ligne">

          <span>
            👶 ${enfant.prenom || ""}
            ${enfant.nom || ""}
          </span>

          <button
            type="button"
            class="bouton-annuler-enfant"
            onclick="annulerEnfantAssistante(
              ${inscription.id},
              ${autorisation.id},
              ${indexEnfant}
            )"
          >
            ❌ Annuler
          </button>

        </div>
      `
    )
    .join("");


          const typePhoto =
            autorisation.type_photo ||
            autorisation.typePhoto ||
            "—";


          let typeTexte = typePhoto;

          if (typePhoto === "individuel") {
            typeTexte = "Photo individuelle";
          }

          else if (typePhoto === "fratrie") {
            typeTexte = "Photo fratrie";
          }

          else if (typePhoto === "les2") {
            typeTexte =
              "Individuelle + fratrie";
          }


          contenuEnfants += `
            <div class="famille-admin">
              <strong>
                👨‍👩‍👧‍👦 Famille ${index + 1}
              </strong>

              <div class="famille-enfants">
                ${listeEnfants}
              </div>
            </div>
          `;


          contenuType += `
            <div class="famille-admin">
              📸 ${typeTexte}
            </div>
          `;


       contenuAutorisation += `
  <div class="famille-admin">

    ${
      autorisation.autorisation_signee
        ? `
          ✅ Autorisation signée

          <br><br>

          <button
            type="button"
            onclick="renvoyerConfirmationParent(${autorisation.id})"
          >
            📩 Renvoyer la confirmation + PDF
          </button>
        `
        : `
          ⏳ En attente

          <br><br>

          <button
            type="button"
            onclick="renvoyerMailSignature(${autorisation.id})"
          >
            📧 Renvoyer le mail de signature
          </button>
        `
    }

  </div>
`;


          const nomBouton =
            enfantsFamille
              .map(enfant =>
                enfant.prenom
              )
              .join(" / ");


          boutonsPDF += `
            <button
              onclick="voirAutorisationEnfant(
                ${autorisation.id},
                ${inscription.id}
              )"
            >
              📄 PDF ${nomBouton}
            </button>
          `;

        }
      );

    }


    // ==========================================
    // INSCRIPTION DIRECTE PAR UN PARENT
    // ==========================================

    else {

      contenuEnfants =
        inscription.enfants
          .map(enfant =>
            enfant.prenom +
            " " +
            enfant.nom
          )
          .join("<br>");


      let typeTexte =
        inscription.type_photo;

      if (typeTexte === "individuel") {
        typeTexte = "Photo individuelle";
      }

      else if (typeTexte === "fratrie") {
        typeTexte = "Photo fratrie";
      }

      else if (typeTexte === "les2") {
        typeTexte =
          "Individuelle + fratrie";
      }

      contenuType =
        typeTexte;


      contenuAutorisation =
        inscription.autorisation
          ? "✅ Autorisation signée"
          : "—";


      boutonsPDF = `
        <button
          onclick="voirAutorisation(
            ${inscription.id}
          )"
        >
          📄 PDF
        </button>
      `;

    }


    // ==========================================
    // TABLEAU
    // ==========================================

    tbody.innerHTML += `

      <tr>

        <td>
          ${inscription.creneau}
        </td>

        <td>
          ${inscription.prenom_parent}
          ${inscription.nom_parent}
        </td>

        <td>
          ${contenuEnfants}
        </td>

        <td>
          ${contenuType}
        </td>

        <td>
          ${contenuAutorisation}
        </td>

        <td>
          <strong>
            ${inscription.duree} min
          </strong>
        </td>

        <td>

          ${boutonsPDF}

          <button
            onclick="supprimerInscription(
              ${inscription.id}
            )"
          >
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

async function voirAutorisation(id) {

  // ===============================
  // Récupération de l'inscription
  // ===============================

  const { data, error } =
    await supabaseClient
      .from("shooting_inscriptions")
      .select("*")
      .eq("id", id)
      .single();

  if (error || !data) {

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
  } =
    await supabaseClient
      .from("shooting_parametres")
      .select("*")
      .single();

  if (erreurParametres || !parametres) {

    console.error(erreurParametres);

    alert(
      "Impossible de récupérer les paramètres du shooting."
    );

    return;
  }


  // ===============================
  // Création du PDF commun
  // ===============================

  const { jsPDF } =
    window.jspdf;

  const doc =
    creerPDFShooting({

      jsPDF: jsPDF,

      parametres: parametres,

      nomParent:
        data.nom_parent || "",

      prenomParent:
        data.prenom_parent || "",

      telephone:
        data.telephone || "",

      email:
        data.email || "",

      enfants:
        data.enfants || [],

      typePhoto:
        data.type_photo || "",

      creneau:
        data.creneau || "",

      duree:
        data.duree || 0,

      signature:
        data.signature || null

    });


  // ===============================
  // Nom du fichier
  // ===============================

  const nomFichier =
    "Autorisation_" +
    (data.nom_parent || "Shooting")
      .replace(/\s+/g, "_") +
    ".pdf";


  // ===============================
  // Téléchargement
  // ===============================

  doc.save(nomFichier);

}
// ======================================================
// PDF INDIVIDUEL PAR ENFANT
// ======================================================

async function voirAutorisationEnfant(
  autorisationId,
  inscriptionId
) {

  // ===============================
  // Autorisation de l'enfant
  // ===============================

  const {
    data: autorisation,
    error: erreurAutorisation
  } =
    await supabaseClient
      .from("shooting_autorisations")
      .select("*")
      .eq("id", autorisationId)
      .single();


  if (
    erreurAutorisation ||
    !autorisation
  ) {

    console.error(
      erreurAutorisation
    );

    alert(
      "Impossible de récupérer l'autorisation de cet enfant."
    );

    return;
  }


  // ===============================
  // Inscription shooting
  // ===============================

  const {
    data: inscription,
    error: erreurInscription
  } =
    await supabaseClient
      .from("shooting_inscriptions")
      .select("*")
      .eq("id", inscriptionId)
      .single();


  if (
    erreurInscription ||
    !inscription
  ) {

    console.error(
      erreurInscription
    );

    alert(
      "Impossible de récupérer l'inscription."
    );

    return;
  }


  // ===============================
  // Paramètres shooting
  // ===============================

  const {
    data: parametres,
    error: erreurParametres
  } =
    await supabaseClient
      .from("shooting_parametres")
      .select("*")
      .single();


  if (
    erreurParametres ||
    !parametres
  ) {

    console.error(
      erreurParametres
    );

    alert(
      "Impossible de récupérer les paramètres du shooting."
    );

    return;
  }


  // ===============================
  // Vérification signature
  // ===============================

  if (
    !autorisation.autorisation_signee ||
    !autorisation.signature
  ) {

    alert(
      "Cette autorisation n'a pas encore été signée par le parent."
    );

    return;
  }


  // ===============================
  // Création PDF
  // ===============================

  const { jsPDF } =
    window.jspdf;


  const doc =
    creerPDFShooting({

      jsPDF: jsPDF,

      parametres: parametres,

      // VRAI parent responsable légal
      nomParent:
        autorisation.nom_parent || "",

      prenomParent:
        autorisation.prenom_parent || "",

      // L'assistante reste celle qui a donné
      // le téléphone dans l'inscription
    telephone:
  autorisation.telephone_parent || "",

      // Email du vrai parent
      email:
        autorisation.email_parent || "",

      // UN SEUL enfant
    enfants:
  Array.isArray(autorisation.enfants) &&
  autorisation.enfants.length > 0
    ? autorisation.enfants
    : [
        {
          nom: autorisation.nom_enfant || "",
          prenom: autorisation.prenom_enfant || ""
        }
      ],

      typePhoto:
        inscription.type_photo || "",

      creneau:
        inscription.creneau || "",

      duree:
        inscription.duree || 0,

      // Signature du vrai parent
      signature:
        autorisation.signature || null

    });


  // ===============================
  // Nom du fichier
  // ===============================

  const nomFichier =
    "Autorisation_" +
    (autorisation.prenom_enfant || "Enfant")
      .replace(/\s+/g, "_") +
    "_" +
    (autorisation.nom_enfant || "")
      .replace(/\s+/g, "_") +
    ".pdf";


  // ===============================
  // Téléchargement
  // ===============================

  doc.save(
    nomFichier
  );

}
// ======================================================
// IMPRIMER TOUTES LES AUTORISATIONS
// ======================================================

document
  .getElementById("imprimerToutesAutorisations")
  .addEventListener(
    "click",
    imprimerToutesAutorisations
  );


async function imprimerToutesAutorisations() {

  const bouton =
    document.getElementById(
      "imprimerToutesAutorisations"
    );

  bouton.disabled = true;
  bouton.textContent =
    "⏳ Création du PDF...";


  try {

    // ==========================================
    // PARAMÈTRES DU SHOOTING
    // ==========================================

    const {
      data: parametres,
      error: erreurParametres
    } =
      await supabaseClient
        .from("shooting_parametres")
        .select("*")
        .single();


    if (
      erreurParametres ||
      !parametres
    ) {

      throw new Error(
        "Impossible de récupérer les paramètres du shooting."
      );

    }


    // ==========================================
    // TOUTES LES INSCRIPTIONS
    // ==========================================

    const {
      data: inscriptions,
      error: erreurInscriptions
    } =
      await supabaseClient
        .from("shooting_inscriptions")
        .select("*")
        .order("creneau");


    if (erreurInscriptions) {

      throw erreurInscriptions;

    }


    // ==========================================
    // AUTORISATIONS DES ASSISTANTES
    // ==========================================

    const {
      data: autorisations,
      error: erreurAutorisations
    } =
      await supabaseClient
        .from("shooting_autorisations")
        .select("*");


    if (erreurAutorisations) {

      throw erreurAutorisations;

    }


    // ==========================================
    // CRÉATION DU PDF GLOBAL
    // ==========================================

    const {
      PDFDocument
    } =
      PDFLib;


    const pdfGlobal =
      await PDFDocument.create();


    const { jsPDF } =
      window.jspdf;


    let nombreAutorisations = 0;


    // ==========================================
    // PARCOURS DES INSCRIPTIONS
    // ==========================================

    for (
      const inscription
      of inscriptions
    ) {

      const autorisationsInscription =
        (autorisations || [])
          .filter(
            autorisation =>
              Number(
                autorisation.inscription_id
              ) ===
              Number(
                inscription.id
              )
          );


      // ========================================
      // ASSISTANTE MATERNELLE
      // ========================================

      if (
        autorisationsInscription.length > 0
      ) {

        for (
          const autorisation
          of autorisationsInscription
        ) {

          // On imprime uniquement
          // les autorisations signées

          if (
            !autorisation.autorisation_signee ||
            !autorisation.signature
          ) {

            continue;

          }


          const enfantsFamille =

            Array.isArray(
              autorisation.enfants
            ) &&

            autorisation.enfants.length > 0

              ? autorisation.enfants

              : [
                  {
                    nom:
                      autorisation.nom_enfant ||
                      "",

                    prenom:
                      autorisation.prenom_enfant ||
                      ""
                  }
                ];


          const doc =
            creerPDFShooting({

              jsPDF: jsPDF,

              parametres:
                parametres,

              nomParent:
                autorisation.nom_parent ||
                "",

              prenomParent:
                autorisation.prenom_parent ||
                "",

              telephone:
                autorisation.telephone_parent ||
                "",

              email:
                autorisation.email_parent ||
                "",

              enfants:
                enfantsFamille,

              typePhoto:
                autorisation.type_photo ||
                "",

              creneau:
                inscription.creneau ||
                "",

              duree:
                inscription.duree ||
                0,

              signature:
                autorisation.signature ||
                null

            });


          const pdfBytes =
            doc.output(
              "arraybuffer"
            );


          const pdfTemporaire =
            await PDFDocument.load(
              pdfBytes
            );


          const pages =
            await pdfGlobal.copyPages(
              pdfTemporaire,
              pdfTemporaire.getPageIndices()
            );


          pages.forEach(
            page =>
              pdfGlobal.addPage(page)
          );


          nombreAutorisations++;

        }

      }


      // ========================================
      // INSCRIPTION DIRECTE D'UN PARENT
      // ========================================

      else {

        if (
          !inscription.autorisation ||
          !inscription.signature
        ) {

          continue;

        }


        const doc =
          creerPDFShooting({

            jsPDF: jsPDF,

            parametres:
              parametres,

            nomParent:
              inscription.nom_parent ||
              "",

            prenomParent:
              inscription.prenom_parent ||
              "",

            telephone:
              inscription.telephone ||
              "",

            email:
              inscription.email ||
              "",

            enfants:
              inscription.enfants ||
              [],

            typePhoto:
              inscription.type_photo ||
              "",

            creneau:
              inscription.creneau ||
              "",

            duree:
              inscription.duree ||
              0,

            signature:
              inscription.signature ||
              null

          });


        const pdfBytes =
          doc.output(
            "arraybuffer"
          );


        const pdfTemporaire =
          await PDFDocument.load(
            pdfBytes
          );


        const pages =
          await pdfGlobal.copyPages(
            pdfTemporaire,
            pdfTemporaire.getPageIndices()
          );


        pages.forEach(
          page =>
            pdfGlobal.addPage(page)
        );


        nombreAutorisations++;

      }

    }


    // ==========================================
    // AUCUNE AUTORISATION
    // ==========================================

    if (
      nombreAutorisations === 0
    ) {

      alert(
        "Aucune autorisation signée à imprimer."
      );

      return;

    }


    // ==========================================
    // CRÉATION DU FICHIER FINAL
    // ==========================================

    const pdfFinal =
      await pdfGlobal.save();


    const blob =
      new Blob(
        [pdfFinal],
        {
          type:
            "application/pdf"
        }
      );


    const url =
      URL.createObjectURL(
        blob
      );


    // ==========================================
    // OUVERTURE DU PDF
    // ==========================================

    window.open(
      url,
      "_blank"
    );


    alert(
      "✅ " +
      nombreAutorisations +
      " autorisation(s) regroupée(s) dans le PDF."
    );


  }

  catch (erreur) {

    console.error(
      "Erreur PDF global :",
      erreur
    );

    alert(
      "❌ Une erreur est survenue lors de la création du PDF."
    );

  }

  finally {

    bouton.disabled = false;

    bouton.textContent =
      "🖨️ Imprimer toutes les autorisations";

  }

}
// ======================================================
// PLANNING PDF PHOTOGRAPHE
// ======================================================

document
  .getElementById("telechargerPlanningPhotographe")
  .addEventListener(
    "click",
    telechargerPlanningPhotographe
  );


async function telechargerPlanningPhotographe() {

  const bouton =
    document.getElementById(
      "telechargerPlanningPhotographe"
    );

  bouton.disabled = true;
  bouton.textContent = "⏳ Création du planning...";

  try {

    // ==========================================
    // PARAMÈTRES
    // ==========================================

    const {
      data: parametres,
      error: erreurParametres
    } =
      await supabaseClient
        .from("shooting_parametres")
        .select("*")
        .single();

    if (erreurParametres || !parametres) {
      throw new Error(
        "Impossible de récupérer les paramètres."
      );
    }


    // ==========================================
    // INSCRIPTIONS
    // ==========================================

    const {
      data: inscriptions,
      error: erreurInscriptions
    } =
      await supabaseClient
        .from("shooting_inscriptions")
        .select("*")
        .order("creneau");

    if (erreurInscriptions) {
      throw erreurInscriptions;
    }


    // ==========================================
    // AUTORISATIONS / FAMILLES
    // ==========================================

    const {
      data: autorisations,
      error: erreurAutorisations
    } =
      await supabaseClient
        .from("shooting_autorisations")
        .select("*");

    if (erreurAutorisations) {
      throw erreurAutorisations;
    }


    if (!inscriptions || inscriptions.length === 0) {

      alert(
        "Aucune réservation dans le planning."
      );

      return;
    }


    // ==========================================
    // PDF
    // ==========================================

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const marge = 12;
    let y = 14;


    // ==========================================
    // TITRE
    // ==========================================

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);

    doc.text(
      "LA RÉCRÉ DU P'TIT LOUP",
      105,
      y,
      { align: "center" }
    );

    y += 7;

    doc.setFontSize(12);

    doc.text(
      "Planning Shooting Photo",
      105,
      y,
      { align: "center" }
    );

    y += 5;


    // ==========================================
    // DATE
    // ==========================================

    let dateTexte = "";

    if (parametres.date_shooting) {

      dateTexte =
        new Date(
          parametres.date_shooting +
          "T12:00:00"
        ).toLocaleDateString(
          "fr-FR",
          {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
          }
        );
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    doc.text(
      dateTexte,
      105,
      y,
      { align: "center" }
    );

    y += 8;


    // ==========================================
    // NOM DU TYPE DE PHOTO
    // ==========================================

    function nomTypePhoto(type) {

      if (type === "individuel") {
        return "Individuelle";
      }

      if (type === "fratrie") {
        return "Fratrie";
      }

      if (type === "les2") {
        return "Individuelle + fratrie";
      }

      return type || "—";
    }

// ==========================================
// REGROUPEMENT PAR ACCOMPAGNANT
// ==========================================

function heureEnMinutes(heure) {

  if (!heure) {
    return 0;
  }

  const parties =
    heure.split(":");

  return (
    Number(parties[0]) * 60 +
    Number(parties[1])
  );
}


function cleAccompagnant(inscription) {

  const email =
    (inscription.email || "")
      .trim()
      .toLowerCase();

  if (email) {
    return "email:" + email;
  }


  const telephone =
    (inscription.telephone || "")
      .replace(/\D/g, "");

  if (telephone) {
    return "tel:" + telephone;
  }


  return (
    (inscription.prenom_parent || "") +
    "|" +
    (inscription.nom_parent || "")
  )
    .trim()
    .toLowerCase();
}


const planningRegroupe = [];


planningRegroupe.forEach(inscription => {

  const autorisationsInscription =
    inscription.autorisationsPlanning || [];


  const entree = {

    ...inscription,

    duree:
      Number(inscription.duree) || 0,

    enfants:
      Array.isArray(inscription.enfants)
        ? [...inscription.enfants]
        : [],

    autorisationsPlanning:
      autorisationsInscription,

    cleAccompagnant:
      cleAccompagnant(inscription)

  };


  const precedent =
    planningRegroupe[
      planningRegroupe.length - 1
    ];


  if (precedent) {

    const finPrecedent =
      heureEnMinutes(
        precedent.creneau
      ) +
      Number(
        precedent.duree || 0
      );

    const debutActuel =
      heureEnMinutes(
        entree.creneau
      );


    const memeAccompagnant =
      precedent.cleAccompagnant ===
      entree.cleAccompagnant;


    const creneauxQuiSeSuivent =
      finPrecedent ===
      debutActuel;


    if (
      memeAccompagnant &&
      creneauxQuiSeSuivent
    ) {

      precedent.duree +=
        entree.duree;


      precedent.enfants.push(
        ...entree.enfants
      );


      precedent.autorisationsPlanning.push(
        ...entree.autorisationsPlanning
      );


      return;
    }

  }


  planningRegroupe.push(
    entree
  );

});
    // ==========================================
    // RÉSERVATIONS
    // ==========================================

    inscriptions.forEach(inscription => {

      const autorisationsInscription =
        (autorisations || []).filter(
          autorisation =>
            Number(
              autorisation.inscription_id
            ) ===
            Number(
              inscription.id
            )
        );


      // ========================================
      // CALCUL HAUTEUR DU BLOC
      // ========================================

      let nombreLignes = 1;

      if (
        autorisationsInscription.length > 0
      ) {

        autorisationsInscription.forEach(
          autorisation => {

            nombreLignes += 1;

            const enfants =
              Array.isArray(
                autorisation.enfants
              ) &&
              autorisation.enfants.length > 0
                ? autorisation.enfants.length
                : 1;

            nombreLignes += enfants;

          }
        );

      }

      else {

        nombreLignes += 1;

        nombreLignes +=
          (inscription.enfants || []).length;

      }


      const hauteurBloc =
        6 + (nombreLignes * 4);


      // ========================================
      // NOUVELLE PAGE
      // ========================================

      if (y + hauteurBloc > 280) {

        doc.addPage();

        y = 12;

      }


      // ========================================
      // CADRE
      // ========================================

      doc.setDrawColor(205);
      doc.setFillColor(
        248,
        249,
        248
      );

      doc.roundedRect(
        marge,
        y,
        186,
        hauteurBloc,
        1.5,
        1.5,
        "FD"
      );


      // ========================================
      // PREMIÈRE LIGNE
      // ========================================

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(10);

      doc.text(
        inscription.creneau || "",
        marge + 4,
        y + 5
      );


      doc.setFontSize(9);

      doc.text(
        (
          inscription.prenom_parent ||
          ""
        ) +
        " " +
        (
          inscription.nom_parent ||
          ""
        ),
        marge + 27,
        y + 5
      );


      doc.text(
        (
          inscription.duree ||
          0
        ) +
        " min",
        194,
        y + 5,
        {
          align: "right"
        }
      );


      let ligneY =
        y + 10;


      // ========================================
      // ASSISTANTE MATERNELLE
      // ========================================

      if (
        autorisationsInscription.length > 0
      ) {

        autorisationsInscription.forEach(
          (autorisation, index) => {

            const enfantsFamille =

              Array.isArray(
                autorisation.enfants
              ) &&

              autorisation.enfants.length > 0

                ? autorisation.enfants

                : [
                    {
                      prenom:
                        autorisation.prenom_enfant ||
                        "",

                      nom:
                        autorisation.nom_enfant ||
                        ""
                    }
                  ];


            doc.setFont(
              "helvetica",
              "bold"
            );

            doc.setFontSize(8.5);

            doc.text(
              "Famille " +
              (index + 1) +
              " — " +
              nomTypePhoto(
                autorisation.type_photo
              ),
              marge + 7,
              ligneY
            );

            ligneY += 4;


            doc.setFont(
              "helvetica",
              "normal"
            );

            doc.setFontSize(8.5);


            enfantsFamille.forEach(
              enfant => {

                doc.text(
                  "• " +
                  (
                    enfant.prenom ||
                    ""
                  ) +
                  " " +
                  (
                    enfant.nom ||
                    ""
                  ),
                  marge + 12,
                  ligneY
                );

                ligneY += 4;

              }
            );

          }
        );

      }


      // ========================================
      // PARENT DIRECT
      // ========================================

      else {

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(8.5);

        doc.text(
          nomTypePhoto(
            inscription.type_photo
          ),
          marge + 7,
          ligneY
        );

        ligneY += 4;


        doc.setFont(
          "helvetica",
          "normal"
        );


        (
          inscription.enfants ||
          []
        ).forEach(
          enfant => {

            doc.text(
              "• " +
              (
                enfant.prenom ||
                ""
              ) +
              " " +
              (
                enfant.nom ||
                ""
              ),
              marge + 12,
              ligneY
            );

            ligneY += 4;

          }
        );

      }


      // Seulement 2 mm entre les réservations
      y += hauteurBloc + 2;

    });


    // ==========================================
    // NUMÉROS DE PAGE
    // ==========================================

    const totalPages =
      doc.internal.getNumberOfPages();

    for (
      let page = 1;
      page <= totalPages;
      page++
    ) {

      doc.setPage(page);

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(7);

      doc.text(
        "La Récré Du P'tit Loup — " +
        page +
        " / " +
        totalPages,
        105,
        291,
        {
          align: "center"
        }
      );

    }


    // ==========================================
    // TÉLÉCHARGEMENT
    // ==========================================

    doc.save(
      "Planning_Photographe.pdf"
    );

  }

  catch (erreur) {

    console.error(
      "Erreur planning photographe :",
      erreur
    );

    alert(
      "❌ Impossible de créer le planning photographe."
    );

  }

  finally {

    bouton.disabled = false;

    bouton.textContent =
      "📅 Télécharger le planning photographe";

  }

}
// ======================================================
// OUVRIR / FERMER LE FORMULAIRE ADMIN
// ======================================================

const boutonAjouterReservation =
  document.getElementById("ajouterReservationAdmin");

const formulaireReservationAdmin =
  document.getElementById("formulaireReservationAdmin");

const boutonAnnulerReservation =
  document.getElementById("adminAnnulerReservation");


boutonAjouterReservation.addEventListener(
  "click",
  () => {

    const estCache =
      formulaireReservationAdmin.style.display === "none";

    formulaireReservationAdmin.style.display =
      estCache
        ? "block"
        : "none";


    if (estCache) {
      chargerCreneauxAdmin();
    }

  }
);

boutonAnnulerReservation.addEventListener(
  "click",
  () => {

    formulaireReservationAdmin.style.display = "none";

  }
);
// ======================================================
// AJOUTER DES ENFANTS DANS LE FORMULAIRE ADMIN
// ======================================================

const adminListeEnfants =
  document.getElementById("adminListeEnfants");

const adminAjouterEnfant =
  document.getElementById("adminAjouterEnfant");

let compteurEnfantAdmin = 0;


function ajouterEnfantAdmin() {

  compteurEnfantAdmin++;

  const bloc =
    document.createElement("div");

  bloc.className = "admin-enfant";

 bloc.innerHTML = `

  <h4>👶 Enfant ${compteurEnfantAdmin}</h4>

  <div class="admin-form-grid">

    <div>
      <label>Nom de l'enfant</label>
      <input
        type="text"
        class="adminEnfantNom"
      >
    </div>

    <div>
      <label>Prénom de l'enfant</label>
      <input
        type="text"
        class="adminEnfantPrenom"
      >
    </div>

  </div>


  <!-- INFORMATIONS PARENT EMPLOYEUR -->
  <div
    class="adminParentEmployeur"
    style="display:none;"
  >

    <h4>
      👨‍👩‍👧 Parent employeur / responsable légal
    </h4>

    <label
      class="adminOptionMemeFamille"
      style="${
        compteurEnfantAdmin === 1
          ? "display:none;"
          : "display:block;"
      }"
    >

      <input
        type="checkbox"
        class="adminMemeFamille"
      >

      👨‍👩‍👧‍👦 Même famille que l'enfant précédent

    </label>


    <div class="admin-form-grid">

      <div>
        <label>Nom du parent</label>
        <input
          type="text"
          class="adminNomParentEnfant"
        >
      </div>

      <div>
        <label>Prénom du parent</label>
        <input
          type="text"
          class="adminPrenomParentEnfant"
        >
      </div>

      <div>
        <label>Téléphone du parent</label>
        <input
          type="tel"
          class="adminTelephoneParentEnfant"
        >
      </div>

      <div>
        <label>Email du parent</label>
        <input
          type="email"
          class="adminEmailParentEnfant"
        >
      </div>

    </div>


    <label>
      Type de photo pour cette famille
    </label>

    <select class="adminTypePhotoFamille">

      <option value="individuel">
        Photo individuelle
      </option>

      <option value="fratrie">
        Photo fratrie
      </option>

      <option value="les2">
        Individuelle + fratrie
      </option>

    </select>

  </div>


  <button
    type="button"
    class="adminSupprimerEnfant"
  >
    🗑️ Supprimer cet enfant
  </button>

`;


  adminListeEnfants.appendChild(bloc);
gererTypeInscriptionAdmin();
// ==========================================
// MÊME FAMILLE QUE L'ENFANT PRÉCÉDENT
// ==========================================

const caseMemeFamille =
  bloc.querySelector(".adminMemeFamille");

if (caseMemeFamille) {

  caseMemeFamille.addEventListener(
    "change",
    () => {

      if (!caseMemeFamille.checked) {
        return;
      }

      const tousLesEnfants =
        Array.from(
          document.querySelectorAll(
            "#adminListeEnfants .admin-enfant"
          )
        );

      const position =
        tousLesEnfants.indexOf(bloc);

      if (position <= 0) {
        return;
      }

      const blocPrecedent =
        tousLesEnfants[position - 1];


      // Coordonnées du parent
      bloc.querySelector(
        ".adminNomParentEnfant"
      ).value =
        blocPrecedent.querySelector(
          ".adminNomParentEnfant"
        )?.value || "";


      bloc.querySelector(
        ".adminPrenomParentEnfant"
      ).value =
        blocPrecedent.querySelector(
          ".adminPrenomParentEnfant"
        )?.value || "";


      bloc.querySelector(
        ".adminTelephoneParentEnfant"
      ).value =
        blocPrecedent.querySelector(
          ".adminTelephoneParentEnfant"
        )?.value || "";


      bloc.querySelector(
        ".adminEmailParentEnfant"
      ).value =
        blocPrecedent.querySelector(
          ".adminEmailParentEnfant"
        )?.value || "";


      // Même type de photo
      bloc.querySelector(
        ".adminTypePhotoFamille"
      ).value =
        blocPrecedent.querySelector(
          ".adminTypePhotoFamille"
        )?.value || "individuel";


      // Recalcul des créneaux
      chargerCreneauxAdmin();

    }
  );

}
  bloc
    .querySelector(".adminSupprimerEnfant")
    .addEventListener(
      "click",
      () => {

        bloc.remove();

      }
    );

}


adminAjouterEnfant.addEventListener(
  "click",
  ajouterEnfantAdmin
);


// Ajouter automatiquement un premier enfant
ajouterEnfantAdmin();
// ======================================================
// CHARGER LES CRÉNEAUX DISPONIBLES DANS LE FORMULAIRE ADMIN
// ======================================================

async function chargerCreneauxAdmin() {

  const selectCreneau =
    document.getElementById("adminCreneau");

  selectCreneau.innerHTML = `
    <option value="">
      Choisir un créneau
    </option>
  `;


  const {
    data: parametres,
    error: erreurParametres
  } =
    await supabaseClient
      .from("shooting_parametres")
      .select("*")
      .single();


  if (erreurParametres || !parametres) {

    console.error(erreurParametres);
    return;

  }


  const {
    data: inscriptions,
    error: erreurInscriptions
  } =
    await supabaseClient
      .from("shooting_inscriptions")
      .select("creneau,duree");


  if (erreurInscriptions) {

    console.error(erreurInscriptions);
    return;

  }


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
      ? new Date(
          `${dateBase}T${parametres.pause_debut}`
        )
      : null;


  const pauseFin =
    parametres.pause_fin
      ? new Date(
          `${dateBase}T${parametres.pause_fin}`
        )
      : null;


  while (heure < finJournee) {

   const dureeNecessaire =
  calculerDureeAdmin();

const finCreneau =
  new Date(heure);

finCreneau.setMinutes(
  finCreneau.getMinutes() +
  dureeNecessaire
);


    let disponible = true;


    // Pause photographe
    if (
      pauseDebut &&
      pauseFin &&
      heure < pauseFin &&
      finCreneau > pauseDebut
    ) {

      disponible = false;

    }


    // Réservations existantes
    (inscriptions || []).forEach(
      reservation => {

        const debutReservation =
          new Date(
            `${dateBase}T${reservation.creneau}`
          );


        const finReservation =
          new Date(debutReservation);


        finReservation.setMinutes(
          finReservation.getMinutes() +
          Number(reservation.duree || 0)
        );


        if (
          heure < finReservation &&
          finCreneau > debutReservation
        ) {

          disponible = false;

        }

      }
    );


    if (disponible) {

      const heures =
        String(
          heure.getHours()
        ).padStart(2, "0");


      const minutes =
        String(
          heure.getMinutes()
        ).padStart(2, "0");


      const valeur =
        `${heures}:${minutes}`;


      const option =
        document.createElement("option");


      option.value = valeur;
      option.textContent = valeur;


      selectCreneau.appendChild(option);

    }


    heure.setMinutes(
      heure.getMinutes() + 5
    );

  }

}
// ======================================================
// CALCUL DE LA DURÉE DE LA RÉSERVATION ADMIN
// ======================================================

function calculerDureeAdmin() {

  const typeInscription =
    document.querySelector(
      'input[name="typeInscriptionAdmin"]:checked'
    )?.value;

  const blocsEnfants =
    Array.from(
      document.querySelectorAll(
        "#adminListeEnfants .admin-enfant"
      )
    );


  if (blocsEnfants.length === 0) {
    return 0;
  }


  // ==========================================
  // PARENT
  // ==========================================

  if (typeInscription === "parent") {

    const typePhoto =
      document.getElementById(
        "adminTypePhoto"
      ).value;

    const nombreEnfants =
      blocsEnfants.length;


    if (typePhoto === "individuel") {
      return nombreEnfants * 5;
    }

    if (typePhoto === "fratrie") {
      return 5;
    }

    if (typePhoto === "les2") {
      return (nombreEnfants * 5) + 5;
    }

    return 0;
  }


  // ==========================================
  // ASSISTANTE MATERNELLE
  // ==========================================

  let dureeTotale = 0;
  let familleActuelle = null;


  blocsEnfants.forEach(
    (bloc, index) => {

      const memeFamille =
        bloc.querySelector(
          ".adminMemeFamille"
        )?.checked || false;


      // Nouvelle famille
      if (
        index === 0 ||
        !memeFamille
      ) {

        familleActuelle = {
          nombreEnfants: 1,
          typePhoto:
            bloc.querySelector(
              ".adminTypePhotoFamille"
            )?.value || "individuel"
        };

        // On calcule cette famille ensuite
        dureeTotale +=
          calculerDureeFamilleAdmin(
            familleActuelle.nombreEnfants,
            familleActuelle.typePhoto
          );

      }

      // Enfant supplémentaire de la même famille
      else {

        // Retirer l'ancien calcul
        dureeTotale -=
          calculerDureeFamilleAdmin(
            familleActuelle.nombreEnfants,
            familleActuelle.typePhoto
          );

        familleActuelle.nombreEnfants++;

        // Recalcul avec l'enfant supplémentaire
        dureeTotale +=
          calculerDureeFamilleAdmin(
            familleActuelle.nombreEnfants,
            familleActuelle.typePhoto
          );

      }

    }
  );


  return dureeTotale;

}


// ======================================================
// DURÉE D'UNE FAMILLE
// ======================================================

function calculerDureeFamilleAdmin(
  nombreEnfants,
  typePhoto
) {

  if (typePhoto === "individuel") {
    return nombreEnfants * 5;
  }

  if (typePhoto === "fratrie") {
    return 5;
  }

  if (typePhoto === "les2") {
    return (nombreEnfants * 5) + 5;
  }

  return 0;
}
document
  .getElementById("adminTypePhoto")
  .addEventListener(
    "change",
    chargerCreneauxAdmin
  );

document
  .getElementById("adminAjouterEnfant")
  .addEventListener(
    "click",
    () => {
      setTimeout(
        chargerCreneauxAdmin,
        0
      );
    }
  );
// ======================================================
// AFFICHAGE PARENT EMPLOYEUR - FORMULAIRE ADMIN
// ======================================================

function gererTypeInscriptionAdmin() {

  const typeInscription =
    document.querySelector(
      'input[name="typeInscriptionAdmin"]:checked'
    )?.value;


  document
    .querySelectorAll(".adminParentEmployeur")
    .forEach(bloc => {

      bloc.style.display =
        typeInscription === "assistante"
          ? "block"
          : "none";

    });


  // Pour une assistante maternelle,
  // le type de photo général n'est pas utilisé
  const typePhotoGeneral =
    document.getElementById("adminTypePhoto");

  if (typePhotoGeneral) {

    const titre =
      typePhotoGeneral.previousElementSibling;

    if (typeInscription === "assistante") {

      typePhotoGeneral.style.display = "none";

      if (titre) {
        titre.style.display = "none";
      }

    }

    else {

      typePhotoGeneral.style.display = "block";

      if (titre) {
        titre.style.display = "block";
      }

    }

  }

}


// Quand Parent / Assistante change
document
  .querySelectorAll(
    'input[name="typeInscriptionAdmin"]'
  )
  .forEach(radio => {

    radio.addEventListener(
      "change",
      () => {

        gererTypeInscriptionAdmin();
        chargerCreneauxAdmin();

      }
    );

  });


// État au chargement
gererTypeInscriptionAdmin();
// ======================================================
// ENREGISTRER UNE RÉSERVATION DEPUIS L'ADMIN
// ======================================================

document
  .getElementById("adminEnregistrerReservation")
  .addEventListener(
    "click",
    enregistrerReservationAdmin
  );


async function enregistrerReservationAdmin() {

  const bouton =
    document.getElementById(
      "adminEnregistrerReservation"
    );

  bouton.disabled = true;
  bouton.textContent = "⏳ Enregistrement...";


  try {

    // ==========================================
    // TYPE D'INSCRIPTION
    // ==========================================

    const typeInscription =
      document.querySelector(
        'input[name="typeInscriptionAdmin"]:checked'
      )?.value;


    // ==========================================
    // RESPONSABLE
    // ==========================================

    const nom =
      document.getElementById("adminNom")
        .value.trim();

    const prenom =
      document.getElementById("adminPrenom")
        .value.trim();

    const telephone =
      document.getElementById("adminTelephone")
        .value.trim();

    const email =
      document.getElementById("adminEmail")
        .value.trim();

    const creneau =
      document.getElementById("adminCreneau")
        .value;


    if (
      !nom ||
      !prenom ||
      !telephone ||
      !email ||
      !creneau
    ) {

      alert(
        "Merci de remplir les coordonnées du responsable et de choisir un créneau."
      );

      return;
    }


    // ==========================================
    // ENFANTS
    // ==========================================

    const blocsEnfants =
      Array.from(
        document.querySelectorAll(
          "#adminListeEnfants .admin-enfant"
        )
      );


    if (blocsEnfants.length === 0) {

      alert(
        "Ajoutez au moins un enfant."
      );

      return;
    }


    const enfants = [];


    for (
      const bloc
      of blocsEnfants
    ) {

      const nomEnfant =
        bloc.querySelector(
          ".adminEnfantNom"
        )?.value.trim();

      const prenomEnfant =
        bloc.querySelector(
          ".adminEnfantPrenom"
        )?.value.trim();


      if (
        !nomEnfant ||
        !prenomEnfant
      ) {

        alert(
          "Merci de renseigner le nom et le prénom de chaque enfant."
        );

        return;
      }


      const enfant = {

        nom:
          nomEnfant,

        prenom:
          prenomEnfant,

        meme_famille:
          bloc.querySelector(
            ".adminMemeFamille"
          )?.checked || false

      };


      // ========================================
      // ASSISTANTE MATERNELLE
      // ========================================

      if (
        typeInscription === "assistante"
      ) {

        enfant.nom_parent =
          bloc.querySelector(
            ".adminNomParentEnfant"
          )?.value.trim() || "";

        enfant.prenom_parent =
          bloc.querySelector(
            ".adminPrenomParentEnfant"
          )?.value.trim() || "";

        enfant.telephone_parent =
          bloc.querySelector(
            ".adminTelephoneParentEnfant"
          )?.value.trim() || "";

        enfant.email_parent =
          bloc.querySelector(
            ".adminEmailParentEnfant"
          )?.value.trim() || "";

        enfant.type_photo =
          bloc.querySelector(
            ".adminTypePhotoFamille"
          )?.value || "individuel";


        if (
          !enfant.nom_parent ||
          !enfant.prenom_parent ||
          !enfant.email_parent
        ) {

          alert(
            "Merci de renseigner les coordonnées du parent employeur pour chaque famille."
          );

          return;
        }

      }


      enfants.push(
        enfant
      );

    }


    // ==========================================
    // DURÉE
    // ==========================================

    const duree =
      calculerDureeAdmin();


    if (duree <= 0) {

      alert(
        "Impossible de calculer la durée de la réservation."
      );

      return;
    }


    // ==========================================
    // TYPE PHOTO PRINCIPAL
    // ==========================================

    const typePhoto =
      typeInscription === "parent"
        ? document.getElementById(
            "adminTypePhoto"
          ).value
        : null;


    // ==========================================
    // CRÉATION DE L'INSCRIPTION
    // ==========================================

    const {
      data: inscriptionCreee,
      error: erreurInscription
    } =
      await supabaseClient
        .from("shooting_inscriptions")
        .insert({

          nom_parent:
            nom,

          prenom_parent:
            prenom,

          telephone:
            telephone,

          email:
            email,

          enfants:
            enfants,

          type_photo:
            typePhoto,

          creneau:
            creneau,

          duree:
            duree,

          autorisation:
            false,

          signature:
            null,

          commentaire:
            "Inscription ajoutée depuis l'administration"

        })
        .select()
        .single();


    if (
      erreurInscription ||
      !inscriptionCreee
    ) {

      console.error(
        erreurInscription
      );

      throw new Error(
        "Impossible d'enregistrer la réservation."
      );

    }


    // ==========================================
    // AUTORISATIONS À CRÉER
    // ==========================================

    const autorisations = [];


    // ==========================================
    // PARENT
    // Une seule autorisation pour tous ses enfants
    // ==========================================

    if (
      typeInscription === "parent"
    ) {

      autorisations.push({

        inscription_id:
          inscriptionCreee.id,

        nom_enfant:
          enfants[0].nom,

        prenom_enfant:
          enfants[0].prenom,

        enfants:
          enfants.map(
            enfant => ({
              nom:
                enfant.nom,

              prenom:
                enfant.prenom
            })
          ),

        nom_parent:
          nom,

        prenom_parent:
          prenom,

        telephone_parent:
          telephone,

        email_parent:
          email,

        type_photo:
          typePhoto,

        token:
          crypto.randomUUID(),

        signature:
          null,

        autorisation_signee:
          false,

        date_signature:
          null

      });

    }


    // ==========================================
    // ASSISTANTE MATERNELLE
    // Une autorisation par famille
    // ==========================================

    else {

      for (
        let i = 0;
        i < enfants.length;
        i++
      ) {

        const enfant =
          enfants[i];


        // Même famille que l'enfant précédent
        if (
          enfant.meme_famille === true &&
          autorisations.length > 0
        ) {

          autorisations[
            autorisations.length - 1
          ].enfants.push({

            nom:
              enfant.nom,

            prenom:
              enfant.prenom

          });

          continue;

        }


        // Nouvelle famille
        autorisations.push({

          inscription_id:
            inscriptionCreee.id,

          nom_enfant:
            enfant.nom,

          prenom_enfant:
            enfant.prenom,

          enfants: [
            {
              nom:
                enfant.nom,

              prenom:
                enfant.prenom
            }
          ],

          nom_parent:
            enfant.nom_parent,

          prenom_parent:
            enfant.prenom_parent,

          telephone_parent:
            enfant.telephone_parent,

          email_parent:
            enfant.email_parent,

          type_photo:
            enfant.type_photo,

          token:
            crypto.randomUUID(),

          signature:
            null,

          autorisation_signee:
            false,

          date_signature:
            null

        });

      }

    }


    // ==========================================
    // ENREGISTREMENT DES AUTORISATIONS
    // ==========================================

    const {
      error: erreurAutorisations
    } =
      await supabaseClient
        .from("shooting_autorisations")
        .insert(
          autorisations
        );


    if (erreurAutorisations) {

      console.error(
        erreurAutorisations
      );

      throw new Error(
        "La réservation a été créée mais les autorisations n'ont pas pu être enregistrées."
      );

    }


    // ==========================================
    // ENVOI DES EMAILS DE SIGNATURE
    // ==========================================

    for (
      const autorisation
      of autorisations
    ) {

      const reponse =
        await fetch(
          "/api/send-autorisation-parent",
          {

            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({

                emailParent:
                  autorisation.email_parent,

                prenomParent:
                  autorisation.prenom_parent,

                enfants:
                  autorisation.enfants,

                token:
                  autorisation.token

              })

          }
        );


      if (!reponse.ok) {

        console.error(
          "Erreur email autorisation pour :",
          autorisation.email_parent
        );

      }

    }


    // ==========================================
    // TERMINÉ
    // ==========================================

    alert(
      "✅ Réservation enregistrée.\n\nLe ou les parents ont reçu leur lien pour signer l'autorisation."
    );


    location.reload();

  }

  catch (erreur) {

    console.error(
      "Erreur réservation admin :",
      erreur
    );

    alert(
      "❌ Une erreur est survenue : " +
      erreur.message
    );

  }

  finally {

    bouton.disabled = false;

    bouton.textContent =
      "✅ Enregistrer la réservation";

  }

}
// ==========================================
// RENVOYER LE MAIL DE SIGNATURE
// ==========================================

async function renvoyerMailSignature(
  autorisationId
) {

  try {

    const {
      data: autorisation,
      error
    } =
      await supabaseClient
        .from(
          "shooting_autorisations"
        )
        .select("*")
        .eq(
          "id",
          autorisationId
        )
        .single();


    if (
      error ||
      !autorisation
    ) {

      console.error(error);

      alert(
        "Impossible de retrouver cette autorisation."
      );

      return;
    }


    if (
      autorisation.autorisation_signee
    ) {

      alert(
        "Cette autorisation est déjà signée."
      );

      return;
    }


    const reponse =
      await fetch(
        "/api/send-autorisation-parent",
        {

          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({

              emailParent:
                autorisation.email_parent,

              prenomParent:
                autorisation.prenom_parent,

              enfants:
                autorisation.enfants,

              token:
                autorisation.token

            })

        }
      );


    if (!reponse.ok) {

      throw new Error(
        "L'email n'a pas pu être envoyé."
      );

    }


    alert(
      "✅ Le mail de signature a bien été renvoyé."
    );

  }

  catch (erreur) {

    console.error(
      "Erreur renvoi mail signature :",
      erreur
    );

    alert(
      "❌ Erreur lors du renvoi du mail de signature."
    );

  }

}
// ==========================================
// RENVOYER LA CONFIRMATION + PDF SIGNÉ
// ==========================================

async function renvoyerConfirmationParent(
  autorisationId
) {

  try {

    // ======================================
    // AUTORISATION
    // ======================================

    const {
      data: autorisation,
      error: erreurAutorisation
    } =
      await supabaseClient
        .from("shooting_autorisations")
        .select("*")
        .eq(
          "id",
          autorisationId
        )
        .single();


    if (
      erreurAutorisation ||
      !autorisation
    ) {

      console.error(
        erreurAutorisation
      );

      alert(
        "Impossible de retrouver cette autorisation."
      );

      return;
    }


    if (
      !autorisation.autorisation_signee ||
      !autorisation.signature
    ) {

      alert(
        "Cette autorisation n'est pas encore signée."
      );

      return;
    }


    // ======================================
    // INSCRIPTION
    // ======================================

    const {
      data: inscription,
      error: erreurInscription
    } =
      await supabaseClient
        .from("shooting_inscriptions")
        .select("*")
        .eq(
          "id",
          autorisation.inscription_id
        )
        .single();


    if (
      erreurInscription ||
      !inscription
    ) {

      console.error(
        erreurInscription
      );

      alert(
        "Impossible de retrouver la réservation."
      );

      return;
    }


    // ======================================
    // PARAMÈTRES DU SHOOTING
    // ======================================

    const {
      data: parametres,
      error: erreurParametres
    } =
      await supabaseClient
        .from("shooting_parametres")
        .select("*")
        .limit(1)
        .single();


    if (
      erreurParametres ||
      !parametres
    ) {

      console.error(
        erreurParametres
      );

      alert(
        "Impossible de récupérer les paramètres du shooting."
      );

      return;
    }


    // ======================================
    // ENFANTS DE CETTE AUTORISATION
    // ======================================

    const enfantsPDF =
      Array.isArray(
        autorisation.enfants
      ) &&
      autorisation.enfants.length > 0

        ? autorisation.enfants

        : [
            {
              nom:
                autorisation.nom_enfant,

              prenom:
                autorisation.prenom_enfant
            }
          ];


    // ======================================
    // TYPE DE PHOTO
    // ======================================

    const typePhotoPDF =
      autorisation.type_photo ||
      inscription.type_photo ||
      "";


    // ======================================
    // CRÉATION DU PDF
    // ======================================

    const { jsPDF } =
      window.jspdf;


    const pdf =
      creerPDFShooting({

        jsPDF:
          jsPDF,

        parametres:
          parametres,

        nomParent:
          autorisation.nom_parent,

        prenomParent:
          autorisation.prenom_parent,

        telephone:
          autorisation.telephone_parent || "",

        email:
          autorisation.email_parent || "",

        enfants:
          enfantsPDF,

        typePhoto:
          typePhotoPDF,

        creneau:
          inscription.creneau,

        duree:
          inscription.duree,

        signature:
          autorisation.signature

      });


    const pdfBase64 =
      pdf.output(
        "datauristring"
      ).split(",")[1];


    // ======================================
    // ENVOI DU MAIL
    // ======================================

    const reponse =
      await fetch(
        "/api/send-shooting-email",
        {

          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({

              email:
                autorisation.email_parent,

              nom:
                autorisation.nom_parent,

              prenom:
                autorisation.prenom_parent,

              enfants:
                enfantsPDF,

              date:
                parametres.date_shooting,

              creneau:
                inscription.creneau,

              typePhoto:
                typePhotoPDF,

              pdfBase64:
                pdfBase64,

              typeInscription:
                "parent",

              duree:
                inscription.duree

            })

        }
      );


    if (!reponse.ok) {

      throw new Error(
        "L'email n'a pas pu être envoyé."
      );

    }


    alert(
      "✅ La confirmation et le PDF signé ont bien été renvoyés."
    );

  }

  catch (erreur) {

    console.error(
      "Erreur renvoi confirmation :",
      erreur
    );

    alert(
      "❌ Erreur lors du renvoi de la confirmation."
    );

  }

}
// ======================================================
// ANNULER UN ENFANT D'UNE ASSISTANTE MATERNELLE
// ======================================================

async function annulerEnfantAssistante(
  inscriptionId,
  autorisationId,
  indexEnfant
) {

  try {

    // ==========================================
    // RÉCUPÉRER L'AUTORISATION / FAMILLE
    // ==========================================

    const {
      data: autorisation,
      error: erreurAutorisation
    } =
      await supabaseClient
        .from("shooting_autorisations")
        .select("*")
        .eq("id", autorisationId)
        .single();


    if (
      erreurAutorisation ||
      !autorisation
    ) {

      console.error(erreurAutorisation);

      alert(
        "Impossible de retrouver cet enfant."
      );

      return;
    }


    const enfantsFamille =
      Array.isArray(autorisation.enfants)
        ? [...autorisation.enfants]
        : [];


    const enfant =
      enfantsFamille[indexEnfant];


    if (!enfant) {

      alert(
        "Impossible de retrouver cet enfant."
      );

      return;
    }


    // ==========================================
    // CONFIRMATION
    // ==========================================

    const confirmation =
      confirm(
        "Annuler uniquement la réservation de " +
        (enfant.prenom || "") +
        " " +
        (enfant.nom || "") +
        " ?"
      );


    if (!confirmation) {
      return;
    }


    // ==========================================
    // RÉCUPÉRER L'INSCRIPTION COMPLÈTE
    // ==========================================

    const {
      data: inscription,
      error: erreurInscription
    } =
      await supabaseClient
        .from("shooting_inscriptions")
        .select("*")
        .eq("id", inscriptionId)
        .single();


    if (
      erreurInscription ||
      !inscription
    ) {

      console.error(erreurInscription);

      alert(
        "Impossible de retrouver la réservation."
      );

      return;
    }


    // ==========================================
    // RETIRER L'ENFANT DE SA FAMILLE
    // ==========================================

    enfantsFamille.splice(
      indexEnfant,
      1
    );


    // ==========================================
    // RETIRER AUSSI L'ENFANT
    // DE L'INSCRIPTION GÉNÉRALE
    // ==========================================

    const enfantsInscription =
      Array.isArray(inscription.enfants)
        ? [...inscription.enfants]
        : [];


    const positionEnfant =
      enfantsInscription.findIndex(
        enfantInscription =>
          (
            enfantInscription.prenom || ""
          ).trim().toLowerCase() ===
          (
            enfant.prenom || ""
          ).trim().toLowerCase()
          &&
          (
            enfantInscription.nom || ""
          ).trim().toLowerCase() ===
          (
            enfant.nom || ""
          ).trim().toLowerCase()
      );


    if (positionEnfant !== -1) {

      enfantsInscription.splice(
        positionEnfant,
        1
      );

    }


    // ==========================================
    // SI PLUS AUCUN ENFANT DANS CETTE FAMILLE
    // ON SUPPRIME L'AUTORISATION
    // ==========================================

    if (enfantsFamille.length === 0) {

      const {
        error: erreurSuppression
      } =
        await supabaseClient
          .from("shooting_autorisations")
          .delete()
          .eq("id", autorisationId);


      if (erreurSuppression) {

        console.error(
          erreurSuppression
        );

        alert(
          "Erreur lors de la suppression de la famille."
        );

        return;
      }

    }

    else {

      // ==========================================
      // SINON ON MET À JOUR LA FAMILLE
      // ==========================================

      const {
        error: erreurMiseAJour
      } =
        await supabaseClient
          .from("shooting_autorisations")
          .update({
            enfants:
              enfantsFamille
          })
          .eq(
            "id",
            autorisationId
          );


      if (erreurMiseAJour) {

        console.error(
          erreurMiseAJour
        );

        alert(
          "Erreur lors de la mise à jour de la famille."
        );

        return;
      }

    }


    // ==========================================
    // RÉCUPÉRER LES FAMILLES RESTANTES
    // ==========================================

    const {
      data: famillesRestantes,
      error: erreurFamilles
    } =
      await supabaseClient
        .from("shooting_autorisations")
        .select("*")
        .eq(
          "inscription_id",
          inscriptionId
        );


    if (erreurFamilles) {

      console.error(
        erreurFamilles
      );

      alert(
        "Erreur lors du recalcul de la réservation."
      );

      return;
    }


    // ==========================================
    // PLUS AUCUN ENFANT :
    // SUPPRIMER LA RÉSERVATION COMPLÈTE
    // ==========================================

    if (enfantsInscription.length === 0) {

      const {
        error: erreurSuppressionInscription
      } =
        await supabaseClient
          .from("shooting_inscriptions")
          .delete()
          .eq(
            "id",
            inscriptionId
          );


      if (
        erreurSuppressionInscription
      ) {

        console.error(
          erreurSuppressionInscription
        );

        alert(
          "Erreur lors de la suppression de la réservation."
        );

        return;
      }


      alert(
        "✅ Dernier enfant annulé : la réservation complète a été supprimée."
      );

      location.reload();

      return;
    }


    // ==========================================
    // RECALCUL DE LA DURÉE
    // ==========================================

    let nouvelleDuree = 0;


    (famillesRestantes || [])
      .forEach(
        famille => {

          const enfants =
            Array.isArray(
              famille.enfants
            )
              ? famille.enfants
              : [];


          const nombreEnfants =
            enfants.length;


          const typePhoto =
            famille.type_photo ||
            "individuel";


          if (
            typePhoto ===
            "individuel"
          ) {

            nouvelleDuree +=
              nombreEnfants * 5;

          }

          else if (
            typePhoto ===
            "fratrie"
          ) {

            nouvelleDuree += 5;

          }

          else if (
            typePhoto ===
            "les2"
          ) {

            nouvelleDuree +=
              (nombreEnfants * 5) +
              5;

          }

        }
      );


    // ==========================================
    // METTRE À JOUR L'INSCRIPTION
    // ==========================================

    const {
      error: erreurMajInscription
    } =
      await supabaseClient
        .from("shooting_inscriptions")
        .update({
          enfants:
            enfantsInscription,

          duree:
            nouvelleDuree
        })
        .eq(
          "id",
          inscriptionId
        );


    if (
      erreurMajInscription
    ) {

      console.error(
        erreurMajInscription
      );

      alert(
        "Erreur lors de la mise à jour de la réservation."
      );

      return;
    }


    alert(
      "✅ " +
      (enfant.prenom || "L'enfant") +
      " a bien été annulé."
    );


    location.reload();

  }

  catch (erreur) {

    console.error(
      "Erreur annulation enfant :",
      erreur
    );

    alert(
      "❌ Une erreur est survenue lors de l'annulation."
    );

  }

}
