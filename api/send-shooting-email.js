export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Méthode non autorisée"
    });
  }

  const {
    email,
    nom,
    prenom,
    enfants,
    date,
    creneau,
    typePhoto,
    pdfBase64
  } = req.body;

  try {

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

          subject: "Confirmation Shooting Photo",

          htmlContent: `

            <h2>📸 Shooting Photo confirmé</h2>

            <p>Bonjour ${prenom},</p>

            <p>
              Votre réservation pour le shooting photo
              a bien été enregistrée.
            </p>

            <p>
              <b>Responsable :</b>
              ${nom} ${prenom}
            </p>

            <p>
              <b>Enfant(s) :</b><br>
              ${enfants.join("<br>")}
            </p>

            <p>
              <b>Date :</b>
              ${date}
            </p>

            <p>
              <b>Créneau :</b>
              ${creneau}
            </p>

            <p>
              <b>Type de séance :</b>
              ${typePhoto}
            </p>

            <p>
              Vous trouverez en pièce jointe votre
              autorisation parentale signée.
            </p>

            <p>
              À bientôt 🐺
            </p>

          `,

          attachments: pdfBase64
            ? [
                {
                  name: "Autorisation_Shooting.pdf",
                  content: pdfBase64
                }
              ]
            : []

        })
      }
    );

    const data = await response.json();

    console.log("Réponse Brevo :", data);

    if (!response.ok) {

      return res.status(response.status).json({
        error: "Erreur Brevo",
        details: data
      });

    }

    return res.status(200).json({
      success: true,
      message: "Email envoyé avec le PDF"
    });

  } catch (err) {

    console.error("Erreur envoi email :", err);

    return res.status(500).json({
      error: err.message
    });

  }

}
