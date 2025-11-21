// --- js/auth.js (SOLUTION FINALE RLS) ---

document.addEventListener('DOMContentLoaded', async () => {
    // S'assurer que les dépendances Supabase sont chargées
    if (typeof sb === 'undefined') {
        console.error("Supabase client not loaded. Check script order.");
        return;
    }
    
    // Fonction d'attente minimale (500ms) pour laisser la session RLS se stabiliser.
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Vérifier si l'utilisateur est déjà connecté et rediriger vers le réseau social
    await checkAuth('/fedde.html');

    const form = document.getElementById('auth-form');
    const authTitle = document.getElementById('auth-title');
    const authButton = document.getElementById('auth-button');
    const toggleButton = document.getElementById('toggle-auth');
    const usernameGroup = document.getElementById('username-group');
    const bioGroup = document.getElementById('bio-group');
    
    // Activer la saisie Gagganti sur tous les champs nécessaires
    activateGaggantiInput('username');
    activateGaggantiInput('password'); 
    activateGaggantiInput('bio');

    let isSigningUp = false;

    /**
     * Récupère la valeur BRUTE (non transformée) d'un champ de saisie Gagganti.
     * @param {string} id - L'ID de l'élément input/textarea.
     * @returns {string} La valeur brute.
     */
    const getBrutValue = (id) => document.getElementById(id).getAttribute('data-brut') || document.getElementById(id).value;

    /**
     * Met à jour l'interface (Connexion/Inscription).
     */
    function updateUI() {
        if (isSigningUp) {
            authTitle.textContent = 'etnuoC nu reérC'; // Créer un compte
            authButton.textContent = 'erircsnI\'S'; // S'inscrire
            toggleButton.textContent = 'retcennoC eS ?'; // Se connecter ?
            usernameGroup.style.display = 'block';
            bioGroup.style.display = 'block';
        } else {
            authTitle.textContent = 'retcennoC eS'; // Se connecter
            authButton.textContent = 'retcennoC'; // Se connecter
            toggleButton.textContent = 'tinuoC nU ?'; // Un compte ?
            usernameGroup.style.display = 'none';
            bioGroup.style.display = 'none';
        }
    }

    // Basculer entre connexion et inscription
    toggleButton.addEventListener('click', () => {
        isSigningUp = !isSigningUp;
        updateUI();
    });

    /**
     * Gère la soumission du formulaire (Connexion ou Inscription).
     */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Récupérer les valeurs BRUTES. CLÉ : Le mot de passe DOIT être brut.
        const email = document.getElementById('email').value.trim();
        const password = getBrutValue('password').trim(); 
        const username = getBrutValue('username').trim();
        const bioBrut = getBrutValue('bio').trim();

        try {
            if (isSigningUp) {
                // --- LOGIQUE INSCRIPTION (Utilise la méthode UPDATE sécurisée) ---
                if (!username || !bioBrut) throw new Error('elatam uw ruT tapp elatuL'); 
                
                // 1. Création de l'utilisateur Auth (Ceci crée la ligne dans 'users' via DEFAULT auth.uid())
                const { error: signUpError } = await sb.auth.signUp({ email, password });
                if (signUpError) throw signUpError;
                
                // 2. TEMPS D'ATTENTE SÉCURISÉ (CRITIQUE pour RLS)
                // Attend 500ms pour que la session PostgreSQL reconnaisse l'auth.uid()
                await sleep(500); 
                
                // 3. Récupérer l'utilisateur courant
                const { data: { user } } = await sb.auth.getUser();

                if (user) {
                    // 4. UTILISER UPDATE : Met à jour la ligne qui a été créée automatiquement
                    const { error: updateError } = await sb.from('users')
                        .update({ 
                            username: username, 
                            bio_gagganti: mirrorWordsOnly(bioBrut) // La bio est stockée en Gagganti
                        })
                        .eq('id', user.id); // Vise la ligne créée pour l'utilisateur

                    if (updateError) throw updateError;
                }
                
                alert('eliamE ic noitacifiréV : feddeF'); 
                
            } else {
                // --- LOGIQUE CONNEXION (Sign In) ---
                const { error: signInError } = await sb.auth.signInWithPassword({ email, password });
                
                if (signInError) throw signInError;
                
                alert('etcennoC ! feddeF ic sset'); 
                window.location.href = '/fedde.html';

            }
        } catch (error) {
            console.error('Erreur Supabase:', error);
            // Afficher l'erreur en Gagganti
            alert(`elraakaj na ppaj : ${error.message}`); 
        }
    });

    updateUI(); 
});
