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
