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

  try {

    // ==========================================
    // TYPE D'E-MAIL
    // ==========================================

    const enAttente =
      statut === "En attente";

    let sujet = "";
    let contenu = "";


    // ==========================================
    // DEMANDE EN ATTENTE
    // ==========================================

    if (enAttente) {

      sujet =
      "Demande d'inscription en attente";

      contenu = `
        <h2>Demande d'inscription en attente</h2>

        <p>Bonjour,</p>

        <p>
          Votre demande d'inscription à
          <b>La Récré Du P'tit Loup</b>
          a bien été enregistrée.
        </p>

        <p>
          Vous avez déjà bénéficié d'une séance
          la semaine précédente.
        </p>

        <p>
          Afin de permettre un roulement équitable
          entre les assistantes maternelles,
          votre nouvelle demande est donc
          <b>en attente de validation</b>.
        </p>

        <p>
          Vous recevrez un nouvel e-mail
          lorsque votre demande aura été
          acceptée ou refusée.
        </p>

        <p>
          <b>Accompagnateur :</b><br>
          ${accompagnateur}
        </p>

        <p>
          <b>Enfants :</b><br>
          ${enfants.join(", ")}
        </p>

        <p>
          <b>Date(s) demandée(s) :</b><br>
          ${dates.join("<br>")}
        </p>

        <p>
          ⚠️ Cette demande ne vaut pas encore
          confirmation de participation.
        </p>

        <p>À bientôt ! 🐺</p>
      `;

    }

    // ==========================================
    // INSCRIPTION NORMALE
    // ==========================================

    else {

      sujet =
      "Confirmation d'inscription";

      contenu = `
        <h2>Inscription confirmée</h2>

        <p>Bonjour,</p>

        <p>
          Votre inscription à
          <b>La Récré Du P'tit Loup</b>
          a bien été enregistrée.
        </p>

        <p>
          <b>Accompagnateur :</b><br>
          ${accompagnateur}
        </p>

        <p>
          <b>Enfants :</b><br>
          ${enfants.join(", ")}
        </p>

        <p>
          <b>Dates sélectionnées :</b><br>
          ${dates.join("<br>")}
        </p>

        <p>À bientôt ! 🐺</p>
      `;

    }


    // ==========================================
    // ENVOI BREVO
    // ==========================================

    const response = await fetch(
      "https://api.brevo.com/v3/smtp/email",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.BREVO_API_KEY
        },

        body: JSON.stringify({

          sender: {
            name: "La Récré Du P'tit Loup",
            email: "larecreduptitloup@gmail.com"
          },

          to: [
            {
              email: email
            }
          ],

          bcc: [
            {
              email: "larecreduptitloup@gmail.com"
            }
          ],

          subject: sujet,

          htmlContent: contenu

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

  catch (err) {

    console.error(err);

    return res.status(500).json({
      error: err.message
    });

  }

}
