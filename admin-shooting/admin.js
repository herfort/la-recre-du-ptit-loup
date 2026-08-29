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
              .map(enfant =>
                enfant.prenom +
                " " +
                enfant.nom
              )
              .join("<br>");


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
                  ? "✅ Autorisation signée"
                  : "⏳ En attente"
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

  const typePhoto =
    document.getElementById("adminTypePhoto").value;

  const enfants =
    document.querySelectorAll(
      "#adminListeEnfants .admin-enfant"
    );

  const nombreEnfants =
    enfants.length;


  if (nombreEnfants === 0) {
    return 0;
  }


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
