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


  // Autorisation déjà signée
  if (data.autorisation_signee) {

    zoneChargement.innerHTML = `
      <h2>✅ Autorisation déjà signée</h2>

      <p>
        L'autorisation pour
        <strong>
          ${data.prenom_enfant}
          ${data.nom_enfant}
        </strong>
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
