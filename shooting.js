// Connexion Supabase
const supabase = window.supabase.createClient(
    "https://jbialegbayusckjjajnq.supabase.co",
    "TA_CLE_PUBLISHABLE"
);

// Vérifie si les inscriptions sont ouvertes
async function verifierOuverture() {

    const { data, error } = await supabase
        .from("shooting_parametres")
        .select("*")
        .limit(1)
        .single();

    if (error) {
        console.error(error);
        return;
    }

    if (data.inscriptions_ouvertes) {
        afficherFormulaire(data);
    } else {
        afficherMessage(data);
    }
}

function afficherMessage(parametres) {

    document.getElementById("contenu").innerHTML = `
        <div class="info">
            <h2>🚧 Inscriptions bientôt disponibles</h2>

            <p>
                Les inscriptions au shooting photo du
                <strong>${parametres.date_shooting}</strong>
                ne sont pas encore ouvertes.
            </p>
        </div>
    `;
}

function afficherFormulaire(parametres) {

    document.getElementById("contenu").innerHTML = `
        <h2>📸 Inscriptions ouvertes</h2>

        <p>
            Le formulaire arrivera à l'étape suivante.
        </p>
    `;
}

verifierOuverture();
