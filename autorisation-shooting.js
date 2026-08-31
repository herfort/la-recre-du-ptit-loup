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


// ===============================
// Récupération du token
// ===============================

const params =
  new URLSearchParams(
    window.location.search
  );

const token =
  params.get("token");


// ===============================
// Éléments de la page
// ===============================

const zoneChargement =
  document.getElementById(
    "zoneChargement"
  );

const zoneAutorisation =
  document.getElementById(
    "zoneAutorisation"
  );

const nomEnfant =
  document.getElementById(
    "nomEnfant"
  );

const nomParent =
  document.getElementById(
    "nomParent"
  );

const boutonValider =
  document.getElementById(
    "validerAutorisation"
  );


// ===============================
// Signature électronique
// ===============================

const canvas =
  document.getElementById(
    "signaturePad"
  );

let signaturePad = null;

if (canvas) {

  signaturePad =
    new SignaturePad(
      canvas,
      {
        backgroundColor:
          "rgb(255,255,255)"
      }
    );

}

const boutonEffacer =
  document.getElementById(
    "effacerSignature"
  );

if (
  boutonEffacer &&
  signaturePad
) {

  boutonEffacer.addEventListener(
    "click",
    function() {

      signaturePad.clear();

    }
  );

}


// ===============================
// Chargement de l'autorisation
// ===============================

async function chargerAutorisation() {

  if (!token) {

    zoneChargement.textContent =
      "Lien d'autorisation invalide.";

    return;
  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "shooting_autorisations"
      )
      .select("*")
      .eq("token", token)
      .single();


  if (error || !data) {

    console.error(error);

    zoneChargement.textContent =
      "Impossible de trouver cette autorisation.";

    return;
  }
// Autorisation actuellement chargée
window.autorisationCourante = data;

  // Autorisation déjà signée
  if (data.autorisation_signee) {

   const listeEnfants =
  Array.isArray(data.enfants) &&
  data.enfants.length > 0
    ? data.enfants
        .map(enfant =>
          enfant.prenom + " " + enfant.nom
        )
        .join(", ")
    : data.prenom_enfant + " " + data.nom_enfant;


zoneChargement.innerHTML = `
  <h2>✅ Autorisation déjà signée</h2>

  <p>
    L'autorisation pour
    <strong>${listeEnfants}</strong>
    a déjà été validée.
  </p>
`;

    return;
  }


 // ===============================
// Affichage enfant(s)
// ===============================

if (
  Array.isArray(data.enfants) &&
  data.enfants.length > 0
) {

  nomEnfant.innerHTML =
    data.enfants
      .map(enfant =>
        "👶 " +
        enfant.prenom +
        " " +
        enfant.nom
      )
      .join("<br>");

} else {

  // Compatibilité avec les anciennes autorisations
  nomEnfant.textContent =
    data.prenom_enfant +
    " " +
    data.nom_enfant;

}


  nomParent.textContent =
    data.prenom_parent +
    " " +
    data.nom_parent;


  zoneChargement.style.display =
    "none";

  zoneAutorisation.style.display =
    "block";

}


// ===============================
// Validation de la signature
// ===============================

if (boutonValider) {

  boutonValider.addEventListener(
    "click",
    async function() {

      if (
        !signaturePad ||
        signaturePad.isEmpty()
      ) {

        alert(
          "Merci de signer l'autorisation."
        );

        return;
      }


      boutonValider.disabled = true;

      boutonValider.textContent =
        "Enregistrement...";


      const signature =
        signaturePad.toDataURL(
          "image/png"
        );


      const {
        error
      } =
        await supabaseClient
          .from(
            "shooting_autorisations"
          )
          .update({

            signature:
              signature,

            autorisation_signee:
              true,

            date_signature:
              new Date()
                .toISOString()

          })
          .eq(
            "token",
            token
          );


      if (error) {

        console.error(error);

        alert(
          "Erreur lors de l'enregistrement de l'autorisation."
        );

        boutonValider.disabled =
          false;

        boutonValider.textContent =
          "✅ Valider mon autorisation";

        return;
      }
// ==========================================
// CRÉATION DU PDF SIGNÉ
// ==========================================

try {

  const autorisation =
    window.autorisationCourante;


  // Récupération de l'inscription
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


  if (erreurInscription) {
    throw erreurInscription;
  }


  // Récupération des paramètres du shooting
  const {
    data: parametres,
    error: erreurParametres
  } =
    await supabaseClient
      .from("shooting_parametres")
      .select("*")
      .limit(1)
      .single();


  if (erreurParametres) {
    throw erreurParametres;
  }


  // Enfants concernés par CETTE autorisation
  const enfantsPDF =
    Array.isArray(autorisation.enfants) &&
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


  // Type de photo enregistré pour cette famille
  const typePhotoPDF =
    autorisation.type_photo ||
    inscription.type_photo ||
    "";


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
        signature

    });


  // PDF en Base64 pour l'envoi par email
  const pdfBase64 =
    pdf.output(
      "datauristring"
    ).split(",")[1];


  // ==========================================
  // ENVOI DU PDF AU PARENT
  // ==========================================

  const reponseEmail =
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


  if (!reponseEmail.ok) {

    console.error(
      "Le PDF a été créé mais l'email de confirmation n'a pas pu être envoyé."
    );

  }

}
catch (erreurPDF) {

  console.error(
    "Erreur création/envoi du PDF signé :",
    erreurPDF
  );

}

      zoneAutorisation.style.display =
        "none";

      zoneChargement.style.display =
        "block";

      zoneChargement.innerHTML = `
        <h2>
          ✅ Autorisation enregistrée
        </h2>

        <p>
          Merci, votre autorisation
          parentale a bien été enregistrée.
        </p>

        <p>
          Vous pouvez fermer cette page.
        </p>
      `;

    }
  );

}


// ===============================
// Démarrage
// ===============================

chargerAutorisation();
