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
}

chargerParametresShooting();
