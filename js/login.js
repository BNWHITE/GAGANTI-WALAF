document.addEventListener('DOMContentLoaded', async () => {
    // S'assurer que les dépendances Supabase sont chargées
    if (typeof sb === 'undefined') {
        console.error("Supabase client not loaded. Check script order.");
        return;
    }

    // Vérifier si l'utilisateur est déjà connecté et rediriger
    await checkAuth('/editeur.html');

    const form = document.getElementById('auth-form');
    const authTitle = document.getElementById('auth-title');
    const authButton = document.getElementById('auth-button');
    const toggleButton = document.getElementById('toggle-auth');
    const usernameGroup = document.getElementById('username-group');
    const usernameInput = document.getElementById('username');

    let isSigningUp = false;

    // Mise à jour de l'interface en mode Gagganti
    function updateUI() {
        if (isSigningUp) {
            authTitle.textContent = 'erircsnI\'S'; // S'inscrire
            authButton.textContent = 'erircsnI'; // S'inscrire
            toggleButton.textContent = 'retcennoC eS ?'; // Se connecter ?
            usernameGroup.style.display = 'block';
        } else {
            authTitle.textContent = 'retcennoC eS'; // Se connecter
            authButton.textContent = 'retcennoC'; // Se connecter
            toggleButton.textContent = 'tinuoC nU ?'; // Un compte ? (pour l'inscription)
            usernameGroup.style.display = 'none';
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
        const password = document.getElementById('password').value.trim();
        const username = usernameInput.value.trim();

        try {
            if (isSigningUp) {
                if (!username) throw new Error('elatam uw ruT tapp elatuL'); // Veuillez taper un nom d'utilisateur.
                
                const { data: { user }, error: signUpError } = await sb.auth.signUp({ email, password });
                
                if (signUpError) throw signUpError;
                
                if (user) {
                    // Si l'utilisateur est créé, insérer le username dans la table 'users'
                    const { error: insertError } = await sb.from('users').insert({ id: user.id, username: username });
                    if (insertError) throw insertError;
                }
                
                alert('eliamE ic noitacifiréV'); // Vérification dans l'email
                
            } else {
                const { error: signInError } = await sb.auth.signInWithPassword({ email, password });
                
                if (signInError) throw signInError;
                
                alert('etcennoC !'); // Connecté !
                window.location.href = '/editeur.html';

            }
        } catch (error) {
            console.error('Erreur Gagganti:', error.message);
            alert(`elraakaj na ppaj : ${error.message}`); // Erreur survenue
        }
    });

    updateUI(); // Initialisation
});
