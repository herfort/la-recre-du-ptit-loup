export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Méthode non autorisée"
    });
  }

  const {
    emails,
    date,
    creneau
  } = req.body;


  try {

    if (
      !Array.isArray(emails) ||
      emails.length === 0
    ) {

      return res.status(400).json({
        error: "Aucun destinataire"
      });

    }


    const destinataires =
      emails.map(email => ({
        email: email
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
              "Annulation de votre réservation Shooting Photo",


            htmlContent: `

              <h2>
                📸 Annulation Shooting Photo
              </h2>

              <p>
                Bonjour,
              </p>

              <p>
                Nous vous informons que votre réservation
                pour le shooting photo a été annulée.
              </p>

              <p>
                <b>Date :</b>
                ${date || ""}
              </p>

              <p>
                <b>Créneau :</b>
                ${creneau || ""}
              </p>

              <p>
                Cette annulation concerne l'ensemble
                de cette réservation.
              </p>

              <p>
                Merci de votre compréhension.
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

      return res
        .status(response.status)
        .json({
          error: "Erreur Brevo",
          details: data
        });

    }


    return res.status(200).json({
      success: true
    });

  }

  catch (err) {

    console.error(
      "Erreur mail annulation réservation :",
      err
    );

    return res.status(500).json({
      error: err.message
    });

  }

}
