export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({
        error: "Méthode non autorisée"
      });
  }

  const {
    emails,
    minutes
  } = req.body;


  if (
    !Array.isArray(emails) ||
    emails.length === 0
  ) {

    return res
      .status(400)
      .json({
        error: "Aucun destinataire"
      });

  }


  if (
    !minutes ||
    minutes <= 0
  ) {

    return res
      .status(400)
      .json({
        error: "Retard invalide"
      });

  }


  try {

    const destinataires =
      [...new Set(emails)]
        .filter(Boolean)
        .map(email => ({
          email
        }));


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

            to:
              destinataires,

            bcc: [
              {
                email:
                  "larecreduptitloup@gmail.com"
              }
            ],

            subject:
              "📸 Shooting photo – Retard en cours",

            htmlContent: `
              <h2>
                📸 Shooting photo – Retard en cours
              </h2>

              <p>
                Bonjour,
              </p>

              <p>
                Nous vous informons qu'un retard
                d'environ <b>${minutes} minutes</b>
                est actuellement à prévoir sur le
                shooting photo.
              </p>

              <p>
                Merci d'en tenir compte pour votre venue.
              </p>

              <p>
                Ce retard est donné à titre indicatif
                et peut évoluer au cours de la journée.
              </p>

              <p>
                Merci pour votre compréhension.
              </p>

              <p>
                La Récré Du P'tit Loup 🐺
              </p>
            `
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

      return res
        .status(response.status)
        .json(data);
    }


    return res
      .status(200)
      .json({
        success: true,
        destinataires:
          destinataires.length
      });

  }

  catch (err) {

    console.error(
      "Erreur envoi retard :",
      err
    );

    return res
      .status(500)
      .json({
        error: err.message
      });

  }

}
