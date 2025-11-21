// --- js/auth.js (CORRIGÉ POUR L'ERREUR RLS) ---

document.addEventListener('DOMContentLoaded', async () => {
    // S'assurer que les dépendances Supabase sont chargées
    if (typeof sb === 'undefined') {
        console.error("Supabase client not loaded. Check script order.");
        return;
    }

    // Vérifier si l'utilisateur est déjà connecté et rediriger
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

    // Fonction pour obtenir le texte brut (stocké par activateGaggantiInput)
    const getBrutValue = (id) => document.getElementById(id).getAttribute('data-brut') || document.getElementById(id).value;

    // Mise à jour de l'interface en mode Gagganti
    function updateUI() {
        if (isSigningUp) {
            authTitle.textContent = 'etnuoC nu reérC'; 
            authButton.textContent = 'erircsnI\'S'; 
            toggleButton.textContent = 'retcennoC eS ?'; 
            usernameGroup.style.display = 'block';
            bioGroup.style.display = 'block';
        } else {
            authTitle.textContent = 'retcennoC eS'; 
            authButton.textContent = 'retcennoC'; 
            toggleButton.textContent = 'tinuoC nU ?'; 
            usernameGroup.style.display = 'none';
            bioGroup.style.display = 'none';
        }
    }

    // Basculer entre connexion et inscription
    toggleButton.addEventListener('click', () => {
        isSigningUp = !isSigningUp;
        updateUI();
    });

    // Gestion de la soumission du formulaire
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = getBrutValue('password').trim(); 
        const username = getBrutValue('username').trim();
        const bioBrut = getBrutValue('bio').trim();

        try {
            if (isSigningUp) {
                // --- LOGIQUE INSCRIPTION ---
                if (!username || !bioBrut) throw new Error('elatam uw ruT tapp elatuL'); 
                
                // Première étape : création de l'utilisateur Auth
                const { data: { user }, error: signUpError } = await sb.auth.signUp({ email, password });
                
                if (signUpError) throw signUpError;
                
                if (user) {
                    const { error: insertError } = await sb.from('users').insert({ 
                        // id: user.id, <--- Assurez-vous que cette ligne est bien absente
                        username: username, 
                        bio_gagganti: mirrorWordsOnly(bioBrut) 
                    });
                    if (insertError) throw insertError;
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
            alert(`elraakaj na ppaj : ${error.message}`); 
        }
    });

    updateUI(); 
});
