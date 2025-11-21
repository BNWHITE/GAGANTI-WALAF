// --- js/safara.js ---
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();

    const currentUserId = (await sb.auth.getUser()).data.user.id;
    const profileForm = document.getElementById('profile-form');
    const passwordForm = document.getElementById('password-form');
    
    activateGaggantiInput('new-username');
    activateGaggantiInput('new-bio');

    // Charger le profil
    async function loadProfile() {
        const { data: profile } = await sb.from('users').select('*').eq('id', currentUserId).single();
        if (profile) {
            document.getElementById('current-username').textContent = profile.username;
            document.getElementById('current-bio').textContent = profile.bio_gagganti;
            document.getElementById('current-avatar').src = profile.avatar_url || './images/default_avatar.jpg';
            
            // Initialiser les champs de modification avec le brut original si on peut le récupérer (ici, on utilise le Gagganti pour l'affichage initial)
            document.getElementById('new-username').value = profile.username; // Le username est stocké en brut
            document.getElementById('new-bio').value = profile.bio_gagganti ? mirrorWordsOnly(profile.bio_gagganti) : '';
            
            // Assurer que le champ Gagganti a sa valeur brut stockée
            document.getElementById('new-username').setAttribute('data-brut', profile.username);
            document.getElementById('new-bio').setAttribute('data-brut', profile.bio_gagganti ? mirrorWordsOnly(profile.bio_gagganti) : '');
        }
    }
    
    // Modification du Profil (Username/Bio/Avatar)
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newUsername = document.getElementById('new-username').getAttribute('data-brut').trim();
        const newBioBrut = document.getElementById('new-bio').getAttribute('data-brut').trim();
        const avatarFile = document.getElementById('avatar-upload').files[0];
        
        let newAvatarUrl = null;

        try {
            if (avatarFile) {
                // 1. Uploader l'image
                const filePath = `${currentUserId}/avatar/${Date.now()}_${avatarFile.name}`;
                const { error: uploadError } = await sb.storage.from('medias').upload(filePath, avatarFile);
                if (uploadError) throw uploadError;

                const { data: urlData } = sb.storage.from('medias').getPublicUrl(filePath);
                newAvatarUrl = urlData.publicUrl;
            }

            // 2. Mettre à jour la DB
            const updates = { 
                username: newUsername,
                bio_gagganti: mirrorWordsOnly(newBioBrut) 
            };
            if (newAvatarUrl) {
                updates.avatar_url = newAvatarUrl;
            }

            const { error: updateError } = await sb.from('users').update(updates).eq('id', currentUserId);
            if (updateError) throw updateError;

            alert('sax nàpp na !'); // Sauvegardé !
            loadProfile(); // Recharger le profil
        } catch (error) {
            console.error("Erreur de sauvegarde:", error);
            alert(`elraakaj na ppaj : ${error.message}`);
        }
    });

    // Modification du Mot de Passe
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            alert('ssap ed stom sel eretnè tnuo snos'); // Les mots de passe ne correspondent pas
            return;
        }
        
        if (newPassword.length < 6) {
             alert('ssap ed tom el atuL'); // Mot de passe trop court (min 6)
            return;
        }

        const { error } = await sb.auth.updateUser({ password: newPassword });
        if (error) {
            alert(`elraakaj na ppaj : ${error.message}`);
        } else {
            alert('sax nàpp na !');
            passwordForm.reset();
        }
    });

    loadProfile();
});
