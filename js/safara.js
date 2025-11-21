// --- js/safara.js (CORRIGÉ POUR BYPASS) ---
document.addEventListener('DOMContentLoaded', async () => {
    // Récupérer l'ID utilisateur (BYPASS ou réel)
    const currentUserId = await checkAuth(); 
    if (!currentUserId) return; 

    const profileForm = document.getElementById('profile-form');
    const passwordForm = document.getElementById('password-form');
    
    activateGaggantiInput('new-username');
    activateGaggantiInput('new-bio');

    // Charger le profil
    async function loadProfile() {
        const { data: profile } = await sb.from('users').select('*').eq('id', currentUserId).single();
        if (profile) {
            document.getElementById('current-username').textContent = profile.username;
            document.getElementById('current-bio').textContent = profile.bio_gagganti || mirrorWordsOnly("bio non définie");
            document.getElementById('current-avatar').src = profile.avatar_url || 'https://via.placeholder.com/120/FFC300/1A1A1A?text=G';
            
            document.getElementById('new-username').value = profile.username;
            document.getElementById('new-bio').value = profile.bio_gagganti ? mirrorWordsOnly(profile.bio_gagganti) : '';
            
            document.getElementById('new-username').setAttribute('data-brut', profile.username);
            document.getElementById('new-bio').setAttribute('data-brut', profile.bio_gagganti || '');
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
                const filePath = `${currentUserId}/avatar/${Date.now()}_${avatarFile.name}`;
                const { error: uploadError } = await sb.storage.from('medias').upload(filePath, avatarFile);
                if (uploadError) throw uploadError;

                const { data: urlData } = sb.storage.from('medias').getPublicUrl(filePath);
                newAvatarUrl = urlData.publicUrl;
            }

            const updates = { 
                username: newUsername,
                bio_gagganti: mirrorWordsOnly(newBioBrut) 
            };
            if (newAvatarUrl) {
                updates.avatar_url = newAvatarUrl;
            }

            const { error: updateError } = await sb.from('users').update(updates).eq('id', currentUserId);
            if (updateError) throw updateError;

            alert('sax nàpp na !'); 
            loadProfile(); 
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
            alert('ssap ed stom sel eretnè tnuo snos'); 
            return;
        }
        
        if (newPassword.length < 6) {
             alert('ssap ed tom el atuL'); 
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
