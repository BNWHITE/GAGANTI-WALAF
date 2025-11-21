// --- js/fedde.js (CORRIGÉ POUR BYPASS) ---
document.addEventListener('DOMContentLoaded', async () => {
    // Récupérer l'ID utilisateur (BYPASS ou réel)
    const currentUserId = await checkAuth(); 
    if (!currentUserId) return; // Si non connecté et pas en bypass, redirection déjà faite.

    // Charger les données complètes de l'utilisateur de la DB (Nécessaire en mode bypass car la session n'est pas complète)
    const { data: userData, error: userError } = await sb.from('users').select('*').eq('id', currentUserId).single();
    if (userError || !userData) {
        console.error("Erreur critique: Profil utilisateur non trouvé.", userError);
        alert(`elraakaj na ppaj : Profil utilisateur non trouvé pour ID ${currentUserId}`);
        return;
    }
    const currentUser = userData;


    const postInput = document.getElementById('post-input');
    const submitPostBtn = document.getElementById('submit-post-btn');
    const newsfeedEl = document.getElementById('newsfeed');
    const mediaInput = document.createElement('input'); 
    mediaInput.type = 'file';
    mediaInput.accept = 'image/*';
    
    activateGaggantiInput('post-input');

    // Déconnexion (La déconnexion standard Supabase est toujours utilisée même en bypass)
    document.getElementById('logout-btn').addEventListener('click', async () => {
        const { error } = await sb.auth.signOut();
        if (error) alert(`nuG na ppaj`);
        else navigate('/auth.html');
    });

    // ... (Logique pour attach-media-btn et mediaInput reste la même) ...
    document.getElementById('attach-media-btn').addEventListener('click', () => mediaInput.click());

    mediaInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            alert('eGamI etpècceP');
        }
    });

    // Envoi du Post
    submitPostBtn.addEventListener('click', async () => {
        const brutText = postInput.getAttribute('data-brut').trim();
        const file = mediaInput.files[0];

        if (!brutText && !file) {
            alert('aradtic bindal t el at eGamI');
            return;
        }

        try {
            let mediaUrl = null;
            let postType = 'text';

            if (file) {
                const filePath = `${currentUserId}/posts/${Date.now()}_${file.name}`;
                const { error: uploadError } = await sb.storage.from('medias').upload(filePath, file);
                if (uploadError) throw uploadError;

                const { data: urlData } = sb.storage.from('medias').getPublicUrl(filePath);
                mediaUrl = urlData.publicUrl;
                postType = 'image';
            }

            const postData = {
                user_id: currentUserId, // Utilise l'ID obtenu de checkAuth
                type: postType,
                contenu_brut: brutText,
                contenu_gagganti: brutText ? mirrorWordsOnly(brutText) : null,
                media_url: mediaUrl,
            };

            const { error: insertError } = await sb.from('posts').insert([postData]);
            if (insertError) throw insertError;
            
            postInput.value = '';
            postInput.setAttribute('data-brut', '');
            mediaInput.value = ''; 
            alert('etceS tsoP !');

        } catch (error) {
            console.error('Erreur de publication:', error);
            alert(`elraakaj na ppaj : ${error.message}`);
        }
    });

    // Affichage d'un Post
    function renderPost(post, username, avatarUrl) {
        const postEl = document.createElement('div');
        postEl.className = 'post-card gagganti-text-flow';
        
        const contentHtml = post.type === 'image' && post.media_url
            ? `<img src="${post.media_url}" class="post-media" alt="post-image">`
            : '';

        postEl.innerHTML = `
            <div class="post-header">
                <div class="post-avatar">${username.charAt(0).toUpperCase()}</div>
                <a href="#" class="username">${username}</a>
            </div>
            ${contentHtml}
            <div class="post-content">${post.contenu_gagganti || ''}</div>
            <div class="post-actions">
                <button class="action-btn like-btn" data-post-id="${post.id}"><i class="fas fa-heart"></i> ekiL</button>
                <button class="action-btn comment-btn"><i class="fas fa-comment"></i> retnemmoC</button>
            </div>
            <div class="post-time gagganti-text-flow" style="font-size: 0.7rem;">${new Date(post.created_at).toLocaleDateString()}</div>
        `;
        newsfeedEl.prepend(postEl); 
    }
    
    // Chargement du Fil d'Actualité
    async function loadNewsfeed() {
        const { data: posts, error } = await sb
            .from('posts')
            .select(`*, users!inner(username, avatar_url)`)
            .order('created_at', { ascending: false })
            .limit(20);
            
        if (error) { console.error('Erreur chargement posts:', error); return; }

        newsfeedEl.innerHTML = '';
        posts.forEach(post => renderPost(post, post.users.username, post.users.avatar_url));
    }

    // Temps Réel pour les nouveaux Posts
    sb.channel('fedde_posts')
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'posts' }, 
            async (payload) => {
                const newPost = payload.new;
                const { data: sender } = await sb.from('users').select('username, avatar_url').eq('id', newPost.user_id).single();
                if (sender) {
                    renderPost(newPost, sender.username, sender.avatar_url);
                }
            }
        )
        .subscribe();

    loadNewsfeed();
});
