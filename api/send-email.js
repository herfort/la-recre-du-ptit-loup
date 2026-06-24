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
    dates
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

          subject: "Confirmation d'inscription",

          htmlContent: `
            <h2>Inscription confirmée</h2>

            <p>Bonjour,</p>

            <p>
              Votre inscription à La Récré Du P'tit Loup
              a bien été enregistrée.
            </p>

            <p>
              <b>Accompagnateur :</b>
              ${accompagnateur}
            </p>

            <p>
              <b>Enfants :</b>
              ${enfants.join(", ")}
            </p>

            <p>
              <b>Dates sélectionnées :</b><br>
              ${dates.join("<br>")}
            </p>

            <p>À bientôt ! 🐺</p>
          `
        })
      }
    );

    const data = await response.json();

    return res.status(200).json(data);

  } catch (err) {

    return res.status(500).json({
      error: err.message
    });

  }

}
