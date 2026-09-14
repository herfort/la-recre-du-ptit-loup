import crypto from "crypto";

export default async function handler(req, res) {

  // ==========================================
  // MÉTHODE AUTORISÉE
  // ==========================================

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Méthode non autorisée"
    });
  }


  try {

    const {
      token,
      action
    } = req.body || {};


    // ==========================================
    // VÉRIFICATIONS DE BASE
    // ==========================================

    if (!token) {
      return res.status(400).json({
        error: "Lien invalide."
      });
    }


    if (
      action !== "accepter" &&
      action !== "refuser"
    ) {
      return res.status(400).json({
        error: "Réponse invalide."
      });
    }


    if (
      !process.env.SUPABASE_URL ||
      !process.env.SUPABASE_SECRET_KEY
    ) {
      console.error(
        "Variables Supabase manquantes"
      );

      return res.status(500).json({
        error:
        "Configuration du serveur incomplète."
      });
    }


    // ==========================================
    // VÉRIFICATION DU TOKEN
    // ==========================================

    const parties =
    token.split(".");


    if (parties.length !== 2) {

      return res.status(400).json({
        error:
        "Ce lien est invalide."
      });

    }


    const [
      payloadBase64,
      signatureRecue
    ] = parties;


    const signatureAttendue =
    crypto
    .createHmac(
      "sha256",
      process.env.SUPABASE_SECRET_KEY
    )
    .update(payloadBase64)
    .digest("base64url");


    const bufferRecu =
    Buffer.from(signatureRecue);

    const bufferAttendu =
    Buffer.from(signatureAttendue);


    if (
      bufferRecu.length !==
      bufferAttendu.length
    ) {

      return res.status(403).json({
        error:
        "Ce lien n'est pas valide."
      });

    }


    const signatureValide =
    crypto.timingSafeEqual(
      bufferRecu,
      bufferAttendu
    );


    if (!signatureValide) {

      return res.status(403).json({
        error:
        "Ce lien n'est pas valide."
      });

    }


    let payload;


    try {

      payload =
      JSON.parse(
        Buffer
        .from(
          payloadBase64,
          "base64url"
        )
        .toString("utf8")
      );

    }
    catch {

      return res.status(400).json({
        error:
        "Lien impossible à lire."
      });

    }


    const {
      ids,
      dateInitiale,
      dateProposee,
      expiration
    } = payload;


    if (
      !Array.isArray(ids) ||
      ids.length === 0 ||
      !dateInitiale ||
      !dateProposee ||
      !expiration
    ) {

      return res.status(400).json({
        error:
        "Informations de proposition incomplètes."
      });

    }


    // ==========================================
    // EXPIRATION DU LIEN
    // ==========================================

    if (
      Date.now() >
      Number(expiration)
    ) {

      return res.status(410).json({
        error:
        "Ce lien a expiré."
      });

    }


    // ==========================================
    // OUTIL DE COMMUNICATION AVEC SUPABASE
    // ==========================================

    const supabaseFetch =
    async (
      chemin,
      options = {}
    ) => {

      const response =
      await fetch(
        process.env.SUPABASE_URL +
        "/rest/v1/" +
        chemin,
        {

          ...options,

          headers: {

            apikey:
            process.env.SUPABASE_SECRET_KEY,

            Authorization:
            "Bearer " +
            process.env.SUPABASE_SECRET_KEY,

            "Content-Type":
            "application/json",

            ...(options.headers || {})

          }

        }
      );


      const texte =
      await response.text();


      let data = null;


      if (texte) {

        try {
          data =
          JSON.parse(texte);
        }
        catch {
          data =
          texte;
        }

      }


      if (!response.ok) {

        console.error(
          "Erreur Supabase :",
          data
        );

        throw new Error(
          "Erreur lors de l'accès aux inscriptions."
        );

      }


      return data;

    };


    // ==========================================
    // RÉCUPÉRER LA DEMANDE ORIGINALE
    // ==========================================

    const idsUniques =
    [...new Set(ids)];


    const filtreIds =
    idsUniques.join(",");


    const demande =
    await supabaseFetch(

      "inscriptions" +
      "?select=*" +
      "&id=in.(" +
      filtreIds +
      ")"

    );


    if (
      !Array.isArray(demande) ||
      demande.length !==
      idsUniques.length
    ) {

      return res.status(404).json({
        error:
        "Cette demande n'existe plus."
      });

    }


    // ==========================================
    // VÉRIFIER QUE LA DEMANDE EST TOUJOURS
    // EN ATTENTE SUR LA DATE D'ORIGINE
    // ==========================================

    const demandeToujoursValide =
    demande.every(
      ligne =>
      ligne.statut ===
      "En attente"
      &&
      ligne.seance ===
      dateInitiale
    );


    if (!demandeToujoursValide) {

      return res.status(409).json({
        error:
        "Cette proposition a déjà été traitée ou l'inscription a été modifiée."
      });

    }


    const nombreEnfants =
    demande.length;

    const premiereLigne =
    demande[0];

    const email =
    premiereLigne.email;

    const typeParticipant =
    premiereLigne.type_participant;


    // ==========================================
    // SI ELLE REFUSE
    // ==========================================

    if (action === "refuser") {

      return res.status(200).json({
        success: true,
        message:
        "La proposition a été refusée. La demande initiale reste en attente."
      });

    }


    // ==========================================
    // À PARTIR D'ICI :
    // ELLE ACCEPTE LA NOUVELLE DATE
    // ==========================================


    // ==========================================
    // VÉRIFIER QUE LA SÉANCE EXISTE
    // ==========================================

    const seance =
    await supabaseFetch(

      "seances" +
      "?select=date" +
      "&date=eq." +
      encodeURIComponent(
        dateProposee
      )

    );


    if (
      !Array.isArray(seance) ||
      seance.length === 0
    ) {

      return res.status(409).json({
        error:
        "Cette séance n'est plus disponible."
      });

    }


    // ==========================================
    // VÉRIFIER QU'ELLE N'EST PAS ANNULÉE
    // ==========================================

    const annulation =
    await supabaseFetch(

      "dates_annulees" +
      "?select=date" +
      "&date=eq." +
      encodeURIComponent(
        dateProposee
      )

    );


    if (
      Array.isArray(annulation) &&
      annulation.length > 0
    ) {

      return res.status(409).json({
        error:
        "Cette séance a été annulée."
      });

    }


    // ==========================================
    // RÉCUPÉRER LES INSCRIPTIONS
    // DE LA NOUVELLE DATE
    // ==========================================

    const inscriptionsDate =
    await supabaseFetch(

      "inscriptions" +
      "?select=id,statut,type_participant,email" +
      "&seance=eq." +
      encodeURIComponent(
        dateProposee
      )

    );


    const inscriptionsConfirmees =
    (
      Array.isArray(
        inscriptionsDate
      )
      ?
      inscriptionsDate
      :
      []
    )
    .filter(
      ligne =>
      ligne.statut !==
      "En attente"
    );


    // ==========================================
    // CONTRÔLE DES 30 PLACES
    // ==========================================

    const placesRestantes =
    30 -
    inscriptionsConfirmees.length;


    if (
      placesRestantes <
      nombreEnfants
    ) {

      return res.status(409).json({

        error:
        "Cette séance s'est remplie entre-temps. Il ne reste que " +
        Math.max(
          0,
          placesRestantes
        ) +
        " place(s)."

      });

    }


    // ==========================================
    // CONTRÔLE DU QUOTA AM 20
    // LUNDI ET JEUDI UNIQUEMENT
    // ==========================================

    const jour =
    new Date(
      dateProposee +
      "T12:00:00"
    ).getDay();


    if (
      typeParticipant ===
      "assistante_maternelle"
      &&
      (
        jour === 1 ||
        jour === 4
      )
    ) {

      const enfantsAMConfirmes =
      inscriptionsConfirmees
      .filter(
        ligne =>
        ligne.type_participant ===
        "assistante_maternelle"
      )
      .length;


      const placesAM =
      20 -
      enfantsAMConfirmes;


      if (
        placesAM <
        nombreEnfants
      ) {

        return res.status(409).json({

          error:
          "Le quota des 20 enfants d'assistantes maternelles est désormais atteint pour cette séance."

        });

      }

    }


    // ==========================================
    // VÉRIFIER QUE L'AM N'A PAS DÉJÀ
    // UNE AUTRE SÉANCE CONFIRMÉE
    // DANS CETTE MÊME SEMAINE
    // ==========================================

    if (
      typeParticipant ===
      "assistante_maternelle"
      &&
      email
    ) {

      const inscriptionsAM =
      await supabaseFetch(

        "inscriptions" +
        "?select=id,seance,statut" +
        "&email=eq." +
        encodeURIComponent(email) +
        "&type_participant=eq.assistante_maternelle"

      );


      function lundiDeLaSemaine(
        dateISO
      ) {

        const date =
        new Date(
          dateISO +
          "T12:00:00"
        );

        const numeroJour =
        date.getDay();

        const decalage =
        numeroJour === 0
        ? -6
        : 1 - numeroJour;

        date.setDate(
          date.getDate() +
          decalage
        );

        return (
          date.getFullYear() +
          "-" +
          String(
            date.getMonth() + 1
          ).padStart(2,"0") +
          "-" +
          String(
            date.getDate()
          ).padStart(2,"0")
        );

      }


      const semaineProposee =
      lundiDeLaSemaine(
        dateProposee
      );


      const idsActuels =
      new Set(
        idsUniques.map(
          String
        )
      );


      const autreSeanceConfirmee =
      (
        Array.isArray(
          inscriptionsAM
        )
        ?
        inscriptionsAM
        :
        []
      )
      .some(
        ligne => {

          if (
            idsActuels.has(
              String(
                ligne.id
              )
            )
          ) {
            return false;
          }


          if (
            ligne.statut ===
            "En attente"
          ) {
            return false;
          }


          return (
            lundiDeLaSemaine(
              ligne.seance
            )
            ===
            semaineProposee
          );

        }
      );


      if (
        autreSeanceConfirmee
      ) {

        return res.status(409).json({

          error:
          "Vous avez déjà une séance confirmée pour cette semaine."

        });

      }

    }


    // ==========================================
    // DÉPLACEMENT DE L'INSCRIPTION
    // ==========================================

    const inscriptionModifiee =
    await supabaseFetch(

      "inscriptions" +
      "?id=in.(" +
      filtreIds +
      ")",

      {

        method: "PATCH",

        headers: {
          Prefer:
          "return=representation"
        },

        body:
        JSON.stringify({

          seance:
          dateProposee,

          statut:
          "Inscrit"

        })

      }

    );


    if (
      !Array.isArray(
        inscriptionModifiee
      )
      ||
      inscriptionModifiee.length !==
      idsUniques.length
    ) {

      throw new Error(
        "Le déplacement de l'inscription n'a pas pu être confirmé."
      );

    }


    // ==========================================
    // SUCCÈS
    // ==========================================

    return res.status(200).json({

      success: true,

      date:
      dateProposee,

      message:
      "Votre inscription a bien été déplacée."

    });

  }
  catch (erreur) {

    console.error(
      "Erreur reponse-proposition :",
      erreur
    );


    return res.status(500).json({

      error:
      "Une erreur est survenue. Merci de contacter La Récré Du P'tit Loup."

    });

  }

}
