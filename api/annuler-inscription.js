import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {

  // ==========================================
  // RÉCUPÉRATION DES INFORMATIONS DU LIEN
  // ==========================================

  const { email, seance, token } = req.query;

  if (!email || !seance || !token) {
    return res.status(400).send(`
      <h2>❌ Lien d'annulation invalide</h2>
      <p>Les informations nécessaires sont manquantes.</p>
    `);
  }

  // ==========================================
  // VÉRIFICATION DU LIEN
  // ==========================================

  const secret = process.env.ANNULATION_SECRET;

  if (!secret) {
    console.error("ANNULATION_SECRET manquant");

    return res.status(500).send(`
      <h2>❌ Erreur</h2>
      <p>Le système d'annulation n'est pas correctement configuré.</p>
    `);
  }

  const tokenAttendu = crypto
    .createHmac("sha256", secret)
    .update(email.toLowerCase().trim() + "|" + seance)
    .digest("hex");

  const tokenValide =
    token.length === tokenAttendu.length &&
    crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(tokenAttendu)
    );

  if (!tokenValide) {
    return res.status(403).send(`
      <h2>❌ Lien d'annulation invalide</h2>
      <p>Ce lien n'est pas valide.</p>
    `);
  }

  // ==========================================
  // RECHERCHE DES INSCRIPTIONS
  // ==========================================

  const { data: inscriptions, error: erreurRecherche } =
    await supabase
      .from("inscriptions")
      .select("id, enfant, statut")
      .ilike("email", email)
      .eq("seance", seance);

  if (erreurRecherche) {

    console.error(erreurRecherche);

    return res.status(500).send(`
      <h2>❌ Erreur</h2>
      <p>Impossible de vérifier votre inscription.</p>
    `);
  }

  if (!inscriptions || inscriptions.length === 0) {

    return res.status(200).send(`
      <h2>ℹ️ Inscription introuvable</h2>
      <p>
        Cette inscription a peut-être déjà été annulée.
      </p>
    `);
  }

  // ==========================================
  // SUPPRESSION DE LA SÉANCE
  // ==========================================

  const { error: erreurSuppression } =
    await supabase
      .from("inscriptions")
      .delete()
      .ilike("email", email)
      .eq("seance", seance);

  if (erreurSuppression) {

    console.error(erreurSuppression);

    return res.status(500).send(`
      <h2>❌ Erreur</h2>
      <p>
        L'annulation n'a pas pu être effectuée.
      </p>
    `);
  }

  // ==========================================
  // CONFIRMATION
  // ==========================================

  const enfants =
    inscriptions
      .map(i => i.enfant)
      .filter(Boolean)
      .join(", ");

  const dateFr =
    new Date(seance + "T12:00:00")
      .toLocaleDateString(
        "fr-FR",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric"
        }
      );

  return res.status(200).send(`
    <!DOCTYPE html>

    <html lang="fr">

    <head>

      <meta charset="UTF-8">

      <meta
        name="viewport"
        content="width=device-width, initial-scale=1"
      >

      <title>Annulation</title>

      <style>

        body {
          font-family: Arial, sans-serif;
          background: #f4f7f4;
          padding: 30px;
          color: #333;
        }

        .carte {
          max-width: 550px;
          margin: auto;
          background: white;
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          text-align: center;
        }

        h1 {
          color: #46825a;
        }

        .date {
          font-size: 18px;
          font-weight: bold;
          margin: 20px 0;
        }

      </style>

    </head>

    <body>

      <div class="carte">

        <h1>✅ Votre venue est annulée</h1>

        <p>
          Votre inscription à la séance du
        </p>

        <div class="date">
          ${dateFr}
        </div>

        ${
          enfants
            ? `<p>👶 ${enfants}</p>`
            : ""
        }

        <p>
          a bien été annulée.
        </p>

        <p>
          Les places ont automatiquement été libérées.
        </p>

        <p>
          À bientôt !<br>
          <strong>La Récré Du P'tit Loup</strong>
        </p>

      </div>

    </body>

    </html>
  `);
}
