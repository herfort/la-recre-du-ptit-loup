export default async function handler(req, res) {

  if (req.method !== "POST") {

    return res.status(405).json({
      error: "Méthode non autorisée"
    });

  }


  const {
    emailParent,
    prenomParent,
    nomParent,
    prenomEnfant,
    nomEnfant,
    date,
    creneau
  } = req.body;


  try {

    // ==========================================
    // VÉRIFICATIONS
    // ==========================================

    if (!emailParent) {

      return res.status(400).json({
        error: "Email du parent manquant"
      });

    }


    // ==========================================
    // ENVOI BREVO
    // ==========================================

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
                email:
                  emailParent
              }
            ],


            bcc: [
              {
                email:
                  "larecreduptitloup@gmail.com"
              }
            ],


            subject:
              "Annulation Shooting Photo",


            htmlContent: `

              <h2>
                📸 Annulation Shooting Photo
              </h2>


              <p>
                Bonjour ${prenomParent || ""},
              </p>


              <p>
                Nous vous informons que la réservation
                au shooting photo de :
              </p>


              <p>
                <strong>
                  👶 ${prenomEnfant || ""}
                  ${nomEnfant || ""}
                </strong>
              </p>


              <p>
                a été annulée.
              </p>


              <p>
                <b>Date :</b>
                ${date || ""}
              </p>


              <p>
                <b>Créneau initial :</b>
                ${creneau || ""}
              </p>


              <p>
                Cette annulation concerne uniquement
                cet enfant.
              </p>


              <p>
                Si d'autres enfants de votre famille
                restent inscrits, leur réservation
                reste bien active.
              </p>


              <p>
                À bientôt 🐺
              </p>

            `

          })

        }
      );


    const data =
      await response.json();


    console.log(
      "Réponse Brevo annulation :",
      data
    );


    if (!response.ok) {

      return res
        .status(response.status)
        .json({

          error:
            "Erreur Brevo",

          details:
            data

        });

    }


    return res.status(200).json({

      success: true,

      message:
        "Email d'annulation envoyé"

    });


  }

  catch (err) {

    console.error(
      "Erreur envoi annulation :",
      err
    );


    return res.status(500).json({

      error:
        err.message

    });

  }

}
