import crypto from "crypto";
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
  dates,
  statut,
  dateInitiale,
  dateProposee,
  ids
} = req.body;

  // ==========================================
  // FORMATAGE DES ENFANTS
  // ==========================================

const listeEnfants =
(enfants || [])
.map(enfant => {
  const prenom =
    typeof enfant === "string"
      ? enfant
      : (enfant.prenom || enfant.nom || enfant.enfant || "");

  return `• ${prenom}`;
})
.filter(ligne => ligne !== "• ")
.join("<br>");


  // ==========================================
  // FORMATAGE DES DATES
  // ==========================================

  const listeDates =
  (dates || [])
  .map(date => {

    return new Date(
      date + "T12:00:00"
    ).toLocaleDateString(
      "fr-FR",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    );

  })
  .join("<br>");


  let sujet = "";

  let contenu = "";
// ==========================================
// LIEN SÉCURISÉ D'ANNULATION
// ==========================================

const annulationSecret =
  process.env.ANNULATION_SECRET;

// ====================================
// LIENS D'ANNULATION PAR SÉANCE
// ====================================

const listeDatesAvecAnnulation =
  (dates || [])
    .map(date => {

      const donneesAnnulation =
        JSON.stringify({
          email,
          seance: date
        });

      const tokenAnnulation =
        Buffer.from(donneesAnnulation)
          .toString("base64url");

      const signatureAnnulation =
        crypto
          .createHmac(
            "sha256",
            annulationSecret
          )
          .update(tokenAnnulation)
          .digest("hex");

      const lienAnnulation =
        `https://${req.headers.host}/api/annuler-inscription?email=${encodeURIComponent(email)}&seance=${encodeURIComponent(date)}&token=${encodeURIComponent(tokenAnnulation)}&signature=${encodeURIComponent(signatureAnnulation)}`;

      const dateFormatee =
        new Date(
          date + "T12:00:00"
        ).toLocaleDateString(
          "fr-FR",
          {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
          }
        );

      return {
        date,
        dateFormatee,
        lienAnnulation
      };

    });
  // ==========================================
  // DEMANDE EN ATTENTE
  // ==========================================

  if (statut === "En attente") {

    sujet =
    "Demande d'inscription en attente";

    contenu = `
      <h2>
        🕐 Demande en attente
      </h2>

      <p>
        Bonjour ${accompagnateur},
      </p>

      <p>
        Votre demande d'inscription aux ateliers
        de <strong>La Récré Du P'tit Loup</strong>
        a bien été enregistrée.
      </p>

      <p>
        Vous avez bénéficié d'une séance
        la semaine précédente.
      </p>

      <p>
        Afin de permettre un roulement équitable
        entre les assistantes maternelles,
        votre nouvelle demande est
        <strong>en attente de validation
        par l'association</strong>.
      </p>

      <p>
        <strong>Cette demande n'est donc pas encore
        une confirmation d'inscription.</strong>
      </p>

      <h3>👶 Enfant(s)</h3>

      <p>
        ${listeEnfants}
      </p>

      <h3>📅 Séance(s) demandée(s)</h3>

      <p>
        ${listeDates}
      </p>

      <p>
        Vous recevrez un nouvel e-mail
        dès que votre demande aura été
        acceptée ou refusée.
      </p>

      <p>
        À bientôt,<br>
        <strong>
          La Récré Du P'tit Loup
        </strong>
      </p>
    `;

  }


  // ==========================================
  // DEMANDE REFUSÉE
  // ==========================================
else if (statut === "Proposition autre date") {
const expiration =
Date.now() + (7 * 24 * 60 * 60 * 1000);

const payload = {
  ids,
  dateInitiale,
  dateProposee,
  expiration
};

const payloadBase64 =
Buffer.from(
  JSON.stringify(payload)
).toString("base64url");

const signature =
crypto
.createHmac(
  "sha256",
  process.env.SUPABASE_SECRET_KEY
)
.update(payloadBase64)
.digest("base64url");

const token =
payloadBase64 +
"." +
signature;

const baseUrl =
"https://la-recre-du-ptit-loup-git-main-larecreduptitloup.vercel.app";

const lienReponse =
baseUrl +
"/reponse-proposition.html?token=" +
encodeURIComponent(token) +
"&date=" +
encodeURIComponent(dateProposee);
  sujet =
  "Proposition d'une autre séance";

  const dateInitialeFR =
  new Date(
    dateInitiale + "T12:00:00"
  ).toLocaleDateString(
    "fr-FR",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  );

  const dateProposeeFR =
  new Date(
    dateProposee + "T12:00:00"
  ).toLocaleDateString(
    "fr-FR",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  );

  contenu = `
    <h2>
      🔄 Proposition d'une autre séance
    </h2>

    <p>
      Bonjour ${accompagnateur},
    </p>

    <p>
      Nous revenons vers vous concernant
      votre demande d'inscription aux ateliers
      de <strong>La Récré Du P'tit Loup</strong>.
    </p>

    <p>
      La séance que vous aviez demandée :
    </p>

    <p>
      ❌ <strong>${dateInitialeFR}</strong>
    </p>

    <p>
      ne peut malheureusement pas être validée
      en raison du nombre de places disponibles.
    </p>

    <p>
      Nous pouvons cependant vous proposer :
    </p>

    <p style="
      font-size:18px;
      font-weight:bold;
    ">
      ✅ ${dateProposeeFR}
    </p>

    <h3>👶 Enfant(s)</h3>

    <p>
      ${listeEnfants}
    </p>

    <p>
      Pour le moment, votre inscription initiale
      reste en attente.
    </p>

   <p>
  Merci de nous indiquer si cette nouvelle
  date vous convient.
</p>

<p style="margin-top:25px;">

  <a
    href="${lienReponse}"
    style="
      display:inline-block;
      background:#4CAF50;
      color:white;
      text-decoration:none;
      padding:12px 18px;
      border-radius:7px;
      margin-right:10px;
      font-weight:bold;
    "
  >
    ✅ Répondre à la proposition
  </a>

</p>

<p style="
  font-size:13px;
  color:#777;
">
  Ce lien est valable pendant 7 jours.
</p>

    <p>
      À bientôt,<br>
      <strong>La Récré Du P'tit Loup</strong>
    </p>
  `;
}
  else if (statut === "Refusé") {

    sujet =
    "Réponse à votre demande d'inscription";

    contenu = `
      <h2>
        ❌ Demande non retenue
      </h2>

      <p>
        Bonjour ${accompagnateur},
      </p>

      <p>
        Nous revenons vers vous concernant
        votre demande d'inscription aux ateliers
        de <strong>La Récré Du P'tit Loup</strong>.
      </p>

      <p>
        Afin de permettre à un maximum
        d'assistantes maternelles de bénéficier
        des ateliers et de respecter le système
        de roulement,
        <strong>nous ne pouvons malheureusement
        pas valider cette demande.</strong>
      </p>

      <h3>👶 Enfant(s)</h3>

      <p>
        ${listeEnfants}
      </p>

      <h3>📅 Séance concernée</h3>

      <p>
        ${listeDates}
      </p>

      <p>
        Vous pourrez bien entendu effectuer
        une nouvelle demande pour une prochaine
        semaine.
      </p>

      <p>
        Merci de votre compréhension.
      </p>

      <p>
        À bientôt,<br>
        <strong>
          La Récré Du P'tit Loup
        </strong>
      </p>
    `;

  }


  // ==========================================
  // INSCRIPTION CONFIRMÉE
  // ==========================================

  else {

    sujet =
    "Confirmation d'inscription";

    contenu = `
      <h2>
        ✅ Inscription confirmée
      </h2>

      <p>
        Bonjour ${accompagnateur},
      </p>

      <p>
        Votre inscription aux ateliers
        de <strong>La Récré Du P'tit Loup</strong>
        est bien confirmée.
      </p>

      <h3>👶 Enfant(s)</h3>

      <p>
        ${listeEnfants}
      </p>

      <h3>📅 Séance(s)</h3>

      <p>
        ${listeDates}
      </p>

      <p>
        Nous avons hâte de vous retrouver
        avec les enfants !
      </p>
<p style="margin-top:25px;">
  Si vous ne pouvez finalement plus venir, vous pouvez annuler votre inscription jusqu'au dernier moment :
</p>

${listeDatesAvecAnnulation.map(item => `
  <div style="
    margin:15px 0;
    padding:15px;
    background:#f7f7f7;
    border-radius:8px;
    text-align:center;
  ">

    <strong>
      📅 ${item.dateFormatee}
    </strong>

    <br><br>

    <a
      href="${item.lienAnnulation}"
      style="
        display:inline-block;
        background:#d9534f;
        color:white;
        padding:10px 18px;
        text-decoration:none;
        border-radius:6px;
        font-weight:bold;
      "
    >
      ❌ Annuler cette séance
    </a>

  </div>
`).join("")}
<p style="font-size:13px; color:#666;">
  Cette annulation libérera automatiquement les places réservées pour vos enfants.
</p>
      <p>
        À bientôt,<br>
        <strong>
          La Récré Du P'tit Loup
        </strong>
      </p>
    `;

  }


  // ==========================================
  // ENVOI AVEC BREVO
  // ==========================================

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
              email: email
            }
          ],

          bcc: [
            {
              email:
              "larecreduptitloup@gmail.com"
            }
          ],

          subject:
          sujet,

          htmlContent:
          contenu

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

      return res.status(
        response.status
      ).json(data);

    }


    return res.status(200).json(data);

  }

  catch (error) {

    console.error(
      "Erreur envoi email :",
      error
    );

    return res.status(500).json({

      error:
      error.message

    });

  }

}
