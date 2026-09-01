export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({
        error: "Méthode non autorisée"
      });
  }

  const {
    email,
    nom,
    prenom,
    date,
    ancienCreneau,
    nouveauCreneau
  } = req.body;


  if (!email) {
    return res
      .status(400)
      .json({
        error: "Email manquant"
      });
  }


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
                email: email,
                name:
                  `${prenom || ""} ${nom || ""}`.trim()
              }
            ],

            bcc: [
              {
                email:
                  "larecreduptitloup@gmail.com"
              }
            ],

            subject:
              "Modification de votre rendez-vous Shooting Photo",

            htmlContent: `
              <h2>
                📸 Modification de votre rendez-vous
              </h2>

              <p>
                Bonjour ${prenom || ""},
              </p>

              <p>
                Votre rendez-vous pour le shooting photo
                du <b>${date || ""}</b>
                a été déplacé.
              </p>

              <p>
                Ancien créneau :
                <b>${ancienCreneau}</b>
                <br>

                Nouveau créneau :
                <b>${nouveauCreneau}</b>
              </p>

              <p>
                ✅ Votre autorisation parentale
                déjà signée reste valable.
              </p>

              <p>
                Vous n'avez aucune nouvelle
                autorisation à signer.
              </p>

              <p>
                À bientôt,<br>
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
        data
      });

  }

  catch (err) {

    console.error(
      "Erreur envoi mail déplacement :",
      err
    );

    return res
      .status(500)
      .json({
        error: err.message
      });
  }

}
