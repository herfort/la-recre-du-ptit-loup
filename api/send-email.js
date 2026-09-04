export default async function handler(req, res) {

  if (req.method !== "POST") {

    return res.status(405).json({
      error: "Méthode non autorisée"
    });

  }


  const {
    email,
    accompagnateur,
    enfants,
    dates,
    statut
  } = req.body;


  // ==========================================
  // FORMATAGE DES ENFANTS
  // ==========================================

  const listeEnfants =
  (enfants || [])
  .map(enfant => `• ${enfant}`)
  .join("<br>");


  // ==========================================
  // FORMATAGE DES DATES
  // ==========================================

  const listeDates =
  (dates || [])
  .map(date => {

    return new Date(
      date + "T12:00:00"
    ).toLocaleDateString(
      "fr-FR",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    );

  })
  .join("<br>");


  let sujet = "";

  let contenu = "";


  // ==========================================
  // DEMANDE EN ATTENTE
  // ==========================================

  if (statut === "En attente") {

    sujet =
    "Demande d'inscription en attente";

    contenu = `
      <h2>
        🕐 Demande en attente
      </h2>

      <p>
        Bonjour ${accompagnateur},
      </p>

      <p>
        Votre demande d'inscription aux ateliers
        de <strong>La Récré Du P'tit Loup</strong>
        a bien été enregistrée.
      </p>

      <p>
        Vous avez bénéficié d'une séance
        la semaine précédente.
      </p>

      <p>
        Afin de permettre un roulement équitable
        entre les assistantes maternelles,
        votre nouvelle demande est
        <strong>en attente de validation
        par l'association</strong>.
      </p>

      <p>
        <strong>Cette demande n'est donc pas encore
        une confirmation d'inscription.</strong>
      </p>

      <h3>👶 Enfant(s)</h3>

      <p>
        ${listeEnfants}
      </p>

      <h3>📅 Séance(s) demandée(s)</h3>

      <p>
        ${listeDates}
      </p>

      <p>
        Vous recevrez un nouvel e-mail
        dès que votre demande aura été
        acceptée ou refusée.
      </p>

      <p>
        À bientôt,<br>
        <strong>
          La Récré Du P'tit Loup
        </strong>
      </p>
    `;

  }


  // ==========================================
  // DEMANDE REFUSÉE
  // ==========================================

  else if (statut === "Refusé") {

    sujet =
    "Réponse à votre demande d'inscription";

    contenu = `
      <h2>
        ❌ Demande non retenue
      </h2>

      <p>
        Bonjour ${accompagnateur},
      </p>

      <p>
        Nous revenons vers vous concernant
        votre demande d'inscription aux ateliers
        de <strong>La Récré Du P'tit Loup</strong>.
      </p>

      <p>
        Afin de permettre à un maximum
        d'assistantes maternelles de bénéficier
        des ateliers et de respecter le système
        de roulement,
        <strong>nous ne pouvons malheureusement
        pas valider cette demande.</strong>
      </p>

      <h3>👶 Enfant(s)</h3>

      <p>
        ${listeEnfants}
      </p>

      <h3>📅 Séance concernée</h3>

      <p>
        ${listeDates}
      </p>

      <p>
        Vous pourrez bien entendu effectuer
        une nouvelle demande pour une prochaine
        semaine.
      </p>

      <p>
        Merci de votre compréhension.
      </p>

      <p>
        À bientôt,<br>
        <strong>
          La Récré Du P'tit Loup
        </strong>
      </p>
    `;

  }


  // ==========================================
  // INSCRIPTION CONFIRMÉE
  // ==========================================

  else {

    sujet =
    "Confirmation d'inscription";

    contenu = `
      <h2>
        ✅ Inscription confirmée
      </h2>

      <p>
        Bonjour ${accompagnateur},
      </p>

      <p>
        Votre inscription aux ateliers
        de <strong>La Récré Du P'tit Loup</strong>
        est bien confirmée.
      </p>

      <h3>👶 Enfant(s)</h3>

      <p>
        ${listeEnfants}
      </p>

      <h3>📅 Séance(s)</h3>

      <p>
        ${listeDates}
      </p>

      <p>
        Nous avons hâte de vous retrouver
        avec les enfants !
      </p>

      <p>
        À bientôt,<br>
        <strong>
          La Récré Du P'tit Loup
        </strong>
      </p>
    `;

  }


  // ==========================================
  // ENVOI AVEC BREVO
  // ==========================================

  try {

    const response =
    await fetch(
      "https://api.brevo.com/v3/smtp/email",
      {

        method: "POST",

        headers: {

          "Content-Type":
          "application/json",

          "api-key":
          process.env.BREVO_API_KEY

        },

        body: JSON.stringify({

          sender: {
            name:
            "La Récré Du P'tit Loup",

            email:
            "larecreduptitloup@gmail.com"
          },

          to: [
            {
              email: email
            }
          ],

          bcc: [
            {
              email:
              "larecreduptitloup@gmail.com"
            }
          ],

          subject:
          sujet,

          htmlContent:
          contenu

        })

      }
    );


    const data =
    await response.json();


    if (!response.ok) {

      console.error(
        "Erreur Brevo :",
        data
      );

      return res.status(
        response.status
      ).json(data);

    }


    return res.status(200).json(data);

  }

  catch (error) {

    console.error(
      "Erreur envoi email :",
      error
    );

    return res.status(500).json({

      error:
      error.message

    });

  }

}
