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
    pdfBase64,

    typeInscription,
    duree,
    familles

  } = req.body;


  try {

    // ==========================================
    // CONTENU DU MAIL
    // ==========================================

    let contenuSupplementaire = "";

    // ===============================
    // ASSISTANTE MATERNELLE
    // ===============================

    if (typeInscription === "assistante") {

      let famillesHTML = "";

      if (
        Array.isArray(familles) &&
        familles.length > 0
      ) {

        let numeroFamille = 0;

        familles.forEach((famille, index) => {

          if (
            index === 0 ||
            famille.memeFamille !== true
          ) {

            numeroFamille++;

            let typeTexte =
              famille.typePhoto;

            if (typeTexte === "individuel") {
              typeTexte = "Photo individuelle";
            }
            else if (typeTexte === "fratrie") {
              typeTexte = "Photo fratrie";
            }
            else if (typeTexte === "les2") {
              typeTexte =
                "Photo individuelle + fratrie";
            }

            famillesHTML += `
              <p>
                <b>Famille ${numeroFamille}</b><br>
                ${famille.prenom} ${famille.nom}<br>
                Type : ${typeTexte}
              </p>
            `;

          }

          else {

            famillesHTML += `
              <p style="margin-left:20px;">
                + ${famille.prenom} ${famille.nom}
              </p>
            `;

          }

        });

      }

      contenuSupplementaire = `

        <p>
          <b>Détail des familles :</b>
        </p>

        ${famillesHTML}

        <p>
          <b>Durée totale :</b>
          ${duree} minutes
        </p>

        <p>
          Les autorisations parentales seront
          envoyées directement aux parents employeurs.
        </p>

      `;

    }


    // ===============================
    // PARENT
    // ===============================

   else if (typeInscription === "parent") {

  contenuSupplementaire = `

    <p>
      Vous trouverez en pièce jointe votre
      autorisation parentale signée.
    </p>

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

          subject:
            "Confirmation Shooting Photo",

          htmlContent: `

            <h2>📸 Shooting Photo confirmé</h2>

            <p>
              Bonjour ${prenom},
            </p>

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
            ${
  enfants
    .map(enfant => {
      if (typeof enfant === "string") {
        return enfant;
      }

      return "👶 " +
        (enfant.prenom || "") +
        " " +
        (enfant.nom || "");
    })
    .join("<br>")
}
            </p>

            <p>
              <b>Date :</b>
              ${date}
            </p>

            <p>
              <b>Créneau :</b>
              ${creneau}
            </p>

          ${
  typeInscription === "parent"
    ? `
      <p>
        <b>Type de séance :</b>
        ${
          typePhoto === "individuel"
            ? "Photo individuelle"
            : typePhoto === "fratrie"
              ? "Photo fratrie"
              : typePhoto === "les2"
                ? "Photo individuelle + fratrie"
                : typePhoto || ""
        }
      </p>
    `
    : ""
}

            ${contenuSupplementaire}

            <p>
              À bientôt 🐺
            </p>

          `,

         ...(typeInscription === "parent" && pdfBase64
  ? {
      attachment: [
        {
          name: "Autorisation_Shooting.pdf",
          content: pdfBase64
        }
      ]
    }
  : {})

        })
      }
    );


    const data =
      await response.json();


    console.log(
      "Réponse Brevo :",
      data
    );


    if (!response.ok) {

      return res
        .status(response.status)
        .json({
          error: "Erreur Brevo",
          details: data
        });

    }


    return res.status(200).json({
      success: true,
      message:
        "Email de confirmation envoyé"
    });


  } catch (err) {

    console.error(
      "Erreur envoi email :",
      err
    );

    return res.status(500).json({
      error: err.message
    });

  }

}
