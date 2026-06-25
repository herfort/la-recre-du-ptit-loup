export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Méthode non autorisée"
    });
  }

  const {
    emails,
    date
  } = req.body;

  try {

    const destinataires =
    emails.map(email => ({
      email
    }));

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
            email:
            "larecreduptitloup@gmail.com"
          },

          to: destinataires,

          subject:
          "Annulation d'une séance",

          htmlContent: `

          <h2>Information importante</h2>

          <p>Bonjour,</p>

          <p>
          Nous vous informons que la séance du
          <b>${date}</b>
          est annulée.
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

    return res
    .status(200)
    .json(data);

  } catch (err) {

    return res
    .status(500)
    .json({
      error: err.message
    });

  }

}
