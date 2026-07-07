// ===============================
// Connexion à Supabase
// ===============================

const SUPABASE_URL = "https://jbialegbayusckjjajnq.supabase.co";
const SUPABASE_KEY =
"sb_publishable__buDYmorRpoNxxjFGq56Iw_28SaX6IG";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

console.log("✅ Connexion à Supabase réussie");
// ===============================
// Chargement des paramètres shooting
// ===============================

async function chargerParametresShooting() {

  const { data, error } = await supabaseClient
    .from("shooting_parametres")
    .select("*")
    .single();


  if (error) {
    console.error("❌ Erreur récupération paramètres :", error);
    return;
  }


  console.log("✅ Paramètres shooting :", data);


  // Affichage de la date
  const date = document.getElementById("dateEvenement");

  if (date && data.date) {
    date.textContent = data.date;
  }

}


chargerParametresShooting();
// ===============================
// Génération des créneaux
// ===============================

function genererCreneaux(parametres) {

  const zone = document.getElementById("creneaux");

  if (!zone) return;

  zone.innerHTML = "";

  let debut = new Date(`2026-10-21T${parametres.heure_debut}`);
  let fin = new Date(`2026-10-21T${parametres.heure_fin}`);

  let pauseDebut = parametres.pause_debut
    ? new Date(`2026-10-21T${parametres.pause_debut}`)
    : null;

  let pauseFin = parametres.pause_fin
    ? new Date(`2026-10-21T${parametres.pause_fin}`)
    : null;


  while (debut < fin) {

    // Ignore la pause photographe
    if (
      !pauseDebut ||
      !pauseFin ||
      debut < pauseDebut ||
      debut >= pauseFin
    ) {

      let heure = debut.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
      });


      zone.innerHTML += `
        <label>
          <input type="radio" name="creneau" value="${heure}">
          ${heure}
        </label><br>
      `;
    }


    // Créneau de 5 minutes
    debut.setMinutes(debut.getMinutes() + 5);
  }
}
// ===============================
// Test lecture table shooting_parametres
// ===============================

async function chargerParametresShooting() {

  const { data, error } = await supabaseClient
    .from("shooting_parametres")
    .select("*");

  if (error) {
    console.error("❌ Erreur lecture shooting_parametres :", error);
    return;
  }

  console.log("✅ Données shooting_parametres récupérées :", data);
  genererCreneaux(data);
}

chargerParametresShooting();
