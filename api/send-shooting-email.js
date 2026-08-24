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

    // ===============================
    // Préparation de la pièce jointe
    // ===============================

    const attachments = [];

    if (pdfBase64) {

      attachments.push({
        name: "Autorisation_Shooting.pdf",
        content: pdfBase64
      });

    }


    // ===============================
    // Envoi Brevo
    // ===============================

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

          subject:
            "📸 Confirmation de votre Shooting Photo",

          htmlContent: `

            <div style="
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            ">

              <h2 style="color:#46825a;">
                📸 Shooting Photo confirmé
              </h2>

              <p>
                Bonjour <strong>${prenom}</strong>,
              </p>

              <p>
                Votre réservation pour le shooting photo
                de <strong>La Récré Du P'tit Loup</strong>
                a bien été enregistrée.
              </p>

              <hr>

              <p>
                <strong>Responsable :</strong><br>
                ${prenom} ${nom}
              </p>

              <p>
                <strong>Enfant(s) :</strong><br>
                ${enfants.join("<br>")}
              </p>

              <p>
                <strong>Date :</strong>
                ${date}
              </p>

              <p>
                <strong>Créneau :</strong>
                ${creneau}
              </p>

              <p>
                <strong>Type de séance :</strong>
                ${typePhoto}
              </p>

              <hr>

              <p>
                Vous trouverez en pièce jointe votre
                <strong>autorisation parentale signée</strong>.
              </p>

              <p>
                Merci de la conserver précieusement.
              </p>

              <p>
                À bientôt 🐺
              </p>

              <p>
                <strong>
                  La Récré Du P'tit Loup
                </strong>
              </p>

            </div>

          `,

          attachments: attachments

        })

      }
    );


    const data = await response.json();


    if (!response.ok) {

      console.error(
        "❌ Erreur Brevo :",
        data
      );

      return res.status(response.status).json(data);

    }


    return res.status(200).json(data);


  } catch (err) {

    console.error(
      "❌ Erreur serveur :",
      err
    );

    return res.status(500).json({
      error: err.message
    });

  }

}
