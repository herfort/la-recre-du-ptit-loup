export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Méthode non autorisée"
    });
  }

  const {
    emailParent,
    prenomParent,
    enfants,
    token
  } = req.body;

  if (
    !emailParent ||
    !Array.isArray(enfants) ||
    enfants.length === 0 ||
    !token
  ) {
    return res.status(400).json({
      error: "Informations manquantes"
    });
  }

  try {

    const lienSignature =
      "https://project-y73gh.vercel.app/autorisation-shooting.html?token=" +
      encodeURIComponent(token);

    const listeEnfantsHTML =
      enfants
        .map(enfant =>
          `<strong>${enfant.prenom} ${enfant.nom}</strong>`
        )
        .join("<br>");

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
              email: emailParent
            }
          ],

          bcc: [
            {
              email: "larecreduptitloup@gmail.com"
            }
          ],

          subject:
            "📸 Autorisation parentale - Shooting Photo",

          htmlContent: `

            <div style="
              font-family:Arial,sans-serif;
              line-height:1.6;
              color:#333;
            ">

              <h2 style="color:#46825a;">
                📸 Autorisation parentale
              </h2>

              <p>
                Bonjour ${prenomParent || ""},
              </p>

              <p>
                Une réservation au shooting photo
                de <strong>La Récré Du P'tit Loup</strong>
                a été effectuée pour :
              </p>

              <p style="font-size:18px;">
                ${listeEnfantsHTML}
              </p>

              <p>
                L'inscription a été réalisée par leur
                assistante maternelle.
              </p>

              <p>
                Afin de finaliser l'inscription,
                nous avons besoin de votre autorisation
                parentale.
              </p>

              <p style="margin:30px 0;text-align:center;">

                <a
                  href="${lienSignature}"
                  style="
                    background:#46825a;
                    color:white;
                    padding:14px 22px;
                    text-decoration:none;
                    border-radius:8px;
                    font-weight:bold;
                  "
                >
                  ✍️ Signer l'autorisation
                </a>

              </p>

              <p>
                Ce lien est personnel et concerne
                uniquement l'autorisation des enfants
                indiqués ci-dessus.
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
          `
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {

      console.error(
        "Erreur Brevo :",
        data
      );

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

  } catch (err) {

    console.error(
      "Erreur envoi autorisation :",
      err
    );

    return res.status(500).json({
      error: err.message
    });
  }
}
