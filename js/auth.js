// --- js/auth.js ---

document.addEventListener('DOMContentLoaded', async () => {
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

    // Fonction pour obtenir le texte brut (stocké par activateGaggantiInput)
    const getBrutValue = (id) => document.getElementById(id).getAttribute('data-brut') || document.getElementById(id).value;


    // Mise à jour de l'interface en mode Gagganti
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

    // Gestion de la soumission du formulaire
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Récupérer les valeurs BRUTES
        const email = document.getElementById('email').value.trim();
        // IMPORTANT : Récupérer le mot de passe et le nom d'utilisateur en brut
        const password = document.getElementById('password').value.trim();
        const username = getBrutValue('username').trim();
        const bioBrut = getBrutValue('bio').trim();

        try {
            if (isSigningUp) {
                if (!username || !bioBrut) throw new Error('elatam uw ruT tapp elatuL'); // Veuillez taper un nom d'utilisateur.
                
                const { data: { user }, error: signUpError } = await sb.auth.signUp({ email, password });
                
                if (signUpError) throw signUpError;
                
                if (user) {
                    // Insérer le username et la bio Gagganti dans la table 'users' après l'inscription
                    const { error: insertError } = await sb.from('users').insert({ 
                        id: user.id, 
                        username: username, // Stocker le nom d'utilisateur en brut pour la recherche
                        bio_gagganti: mirrorWordsOnly(bioBrut) // Stocker la bio en Gagganti
                    });
                    if (insertError) throw insertError;
                }
                
                alert('eliamE ic noitacifiréV : feddeF'); // Vérification dans l'email
                
            } else {
                const { error: signInError } = await sb.auth.signInWithPassword({ email, password });
                
                if (signInError) throw signInError;
                
                // Connexion réussie, redirection vers le fil d'actualité
                alert('etcennoC ! feddeF ic sset'); 
                window.location.href = '/fedde.html';

            }
        } catch (error) {
            console.error('Erreur Supabase:', error);
            // Afficher l'erreur en Gagganti
            alert(`elraakaj na ppaj : ${error.message}`); 
        }
    });

    updateUI(); // Initialisation
});
