// --- DÉBUT FICHIER script1.js ---

// ==========================================================
// === CORE LOGIC & CONFIGURATION ===
// ==========================================================
const ENTRY_FILE_NAME = 'index1.html'; // Utilisez 'fedde.html' si vous préférez
// CONFIGURATION (À Remplacer)
const SUPABASE_URL = 'https://jxwumbkoikoyfhcmmocq.supabase.co';
const SUPABASE_ANON_KEY = 'VOTRE_CLE_PUBLIQUE_SUPABASE'; // <<< CLÉ CRITIQUE : REMPLACEZ CETTE VALEUR >>>

// MODE DÉVELOPPEMENT (Bypass Actif pour faciliter le test)
const BYPASS_AUTH = true; 
const TEST_USER_ID = '684d59af-2f0a-48f9-8194-3c48337c16f7'; // ID de l'utilisateur de test

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let activeRealtimeChannels = {};

// --- UTILS GAGANTI ---
/**
 * Inverse les lettres dans chaque mot (Cœur de l'écriture Gagganti).
 */
function mirrorWordsOnly(text) {
    if (!text || text.trim() === '') return '';
    return text.split(/(\s+)/).map(word => {
        if (word.trim() === '') return word; 
        return word.split('').reverse().join('');
    }).join('');
}

function processGaggantiText(text) { return mirrorWordsOnly(text); }

/** Récupère la valeur BRUTE du champ (stockée par le Gagganti Input). */
const getBrutValue = (id) => document.getElementById(id)?.getAttribute('data-brut') || document.getElementById(id)?.value || '';

/** Active la saisie Gagganti en temps réel sur l'élément. */
function activateGaggantiInput(elementId) {
    const inputElement = document.getElementById(elementId);
    if (!inputElement) return;
    inputElement.setAttribute('data-brut', inputElement.value);

    inputElement.addEventListener('input', (e) => {
        const originalText = e.target.value;
        const cursorPos = inputElement.selectionStart;
        const transformedText = mirrorWordsOnly(originalText);
        
        inputElement.setAttribute('data-brut', originalText);
        inputElement.value = transformedText;
        
        inputElement.selectionStart = inputElement.selectionEnd = cursorPos;
    });
}

// --- UTILS ROUTAGE ET ASYNCHRONE ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const sanitizeText = (text) => text?.replace(/</g, "&lt;").replace(/>/g, "&gt;") || '';

/** Définit la vue active et gère les canaux Realtime */
function renderView(viewName) {
    document.querySelectorAll('.view').forEach(view => { view.style.display = 'none'; });
    
    const targetView = document.getElementById(`view-${viewName}`);
    if (!targetView) return false;
    
    // Met à jour la classe active et gère la navigation
    document.querySelectorAll('#main-nav a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-view') === viewName) {
            link.classList.add('active');
        }
    });

    // Gère les canaux Realtime
    Object.keys(activeRealtimeChannels).forEach(channel => {
        if (channel !== viewName && activeRealtimeChannels[channel]) { 
            sb.removeChannel(activeRealtimeChannels[channel]);
            delete activeRealtimeChannels[channel];
        }
    });
    
    targetView.style.display = viewName === 'auth' ? 'flex' : 'grid';
    window.location.hash = `#${viewName}`;
    return true;
}

/** Vérifie l'auth et retourne l'ID utilisateur (Bypass inclus) */
async function checkAuth(redirectPath = 'fedde') {
    if (BYPASS_AUTH) {
        const currentHash = window.location.hash.replace('#', '');
        if (currentHash === 'auth' || currentHash === '') { window.location.hash = `#${redirectPath}`; }
        return TEST_USER_ID; 
    }
    
    const { data: { session } } = await sb.auth.getSession();
    const currentHash = window.location.hash.replace('#', '');
    
    if (session) {
        if (currentHash === 'auth' || currentHash === '') { window.location.hash = `#${redirectPath}`; }
        return session.user.id;
    } else {
        if (currentHash !== 'auth') { window.location.hash = '#auth'; }
        return null;
    }
}

/** Gestion de la déconnexion */
const handleLogout = async () => {
    const { error } = await sb.auth.signOut();
    if (error) alert(`nuG na ppaj`);
    else renderView('auth');
};

/** Attache les écouteurs de déconnexion et de navigation */
function attachLogoutListener() {
    document.getElementById('logout-btn-nav')?.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
    });
    document.querySelectorAll('.col-nav a[data-view]').forEach(link => {
        link.onclick = (e) => { 
            e.preventDefault(); 
            const targetView = link.getAttribute('data-view');
            if (targetView === 'logout') handleLogout();
            else renderView(targetView);
        };
    });
}


// ==========================================================
// === VUE : AUTHENTIFICATION (initAuth) ===
// ==========================================================
async function initAuth() {
    if (await checkAuth() !== TEST_USER_ID) return;
    
    const form = document.getElementById('auth-form');
    const authTitle = document.getElementById('auth-title');
    const toggleButton = document.getElementById('toggle-auth');
    const usernameGroup = document.getElementById('username-group');
    const bioGroup = document.getElementById('bio-group');
    
    activateGaggantiInput('username');
    activateGaggantiInput('password'); 
    activateGaggantiInput('bio');

    let isSigningUp = false;

    function updateUI() {
        if (isSigningUp) {
            authTitle.textContent = 'etnuoC nu reérC'; 
            toggleButton.textContent = 'retcennoC eS ?'; 
        } else {
            authTitle.textContent = 'retcennoC eS'; 
            toggleButton.textContent = 'tinuoC nU ?'; 
        }
        document.getElementById('auth-button').textContent = isSigningUp ? 'erircsnI\'S' : 'retcennoC';
        usernameGroup.style.display = isSigningUp ? 'block' : 'none';
        bioGroup.style.display = isSigningUp ? 'block' : 'none';
    }

    toggleButton.addEventListener('click', () => { isSigningUp = !isSigningUp; updateUI(); });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = getBrutValue('password').trim(); 
        const username = getBrutValue('username').trim();
        const bioBrut = getBrutValue('bio').trim();

        try {
            if (isSigningUp) {
                if (!username || !bioBrut) throw new Error('elatam uw ruT tapp elatuL'); 
                
                const { error: signUpError } = await sb.auth.signUp({ email, password });
                if (signUpError) throw signUpError;
                
                // RLS Fix (attente + update)
                await sleep(500); 
                const { data: { user } } = await sb.auth.getUser();

                if (user) {
                    const { error: updateError } = await sb.from('users')
                        .update({ username: username, bio_gagganti: mirrorWordsOnly(bioBrut) })
                        .eq('id', user.id);
                    if (updateError) throw updateError;
                }
                
                alert('eliamE ic noitacifiréV : feddeF'); 
                
            } else {
                const { error: signInError } = await sb.auth.signInWithPassword({ email, password });
                if (signInError) throw signInError;
                
                alert('etcennoC ! feddeF ic sset'); 
                renderView('fedde');
            }
        } catch (error) {
            console.error('Erreur Supabase:', error);
            alert(`elraakaj na ppaj : ${error.message}`); 
        }
    });
    updateUI();
}

// ==========================================================
// === VUE : FIL D'ACTUALITÉ (initFedde) ===
// ==========================================================
async function initFedde() {
    const currentUserId = await checkAuth(); 
    if (!currentUserId) return;
    attachLogoutListener();

    const newsfeedEl = document.getElementById('newsfeed');
    const postInput = document.getElementById('post-input');
    const submitPostBtn = document.getElementById('submit-post-btn');
    const mediaInput = document.createElement('input'); mediaInput.type = 'file'; mediaInput.accept = 'image/*';
    
    activateGaggantiInput('post-input');
    
    // --- Fonctions Fedde ---
    function createPostElement(postData, username, avatarUrl) {
        let html = `<div class="post-card gagganti-text-flow" style="position: relative; z-index: 1;">`;
        html += `<div class="post-header">`;
        html += `<div class="post-avatar" style="background-image: url('${avatarUrl || './images/pp5.jpg'}'); background-size:cover;">${username.charAt(0).toUpperCase()}</div>`;
        html += `<a href="#" class="username">${sanitizeText(username)}</a>`;
        html += `</div>`;
        
        if (postData.type === 'image' && postData.media_url) {
            html += `<img src="${postData.media_url}" class="post-media" alt="post-image">`;
        }

        html += `<div class="post-content">${sanitizeText(postData.contenu_gagganti || '')}</div>`;
        html += `<div class="post-actions" style="direction: ltr;">`;
        html += `<button class="action-btn like-btn" data-post-id="${postData.id}"><i class="fas fa-heart"></i> ekiL</button>`;
        html += `<button class="action-btn comment-btn"><i class="fas fa-comment"></i> retnemmoC</button>`;
        html += `</div>`;
        html += `<div class="post-time gagganti-text-flow" style="font-size: 0.7rem;">${new Date(postData.created_at).toLocaleDateString()}</div>`;
        html += `</div>`;
        return html;
    }
    
    async function loadNewsfeed() {
        const { data: posts, error } = await sb.from('posts').select(`*, users!inner(username, avatar_url)`).order('created_at', { ascending: false }).limit(20);
        if (error) { console.error('Erreur chargement posts:', error); return; }
        newsfeedEl.innerHTML = '';
        posts.forEach(post => {
            const username = post.users.username;
            const avatarUrl = post.users.avatar_url;
            newsfeedEl.innerHTML += createPostElement(post, username, avatarUrl);
        });
    }
    
    // Listeners
    document.getElementById('attach-media-btn')?.addEventListener('click', () => mediaInput.click());
    
    submitPostBtn?.addEventListener('click', async () => {
        const brutText = getBrutValue('post-input').trim();
        const file = mediaInput.files[0];
        if (!brutText && !file) { alert('aradtic bindal t el at eGamI'); return; }
        
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
                user_id: currentUserId, 
                type: postType,
                contenu_brut: brutText,
                contenu_gagganti: brutText ? mirrorWordsOnly(brutText) : null,
                media_url: mediaUrl,
            };

            const { error: insertError } = await sb.from('posts').insert([postData]);
            if (insertError) throw insertError;
            
            postInput.value = ''; postInput.setAttribute('data-brut', ''); mediaInput.value = ''; 
            alert('etceS tsoP !');
            await loadNewsfeed(); // Recharger après publication
        } catch (error) {
            console.error('Erreur de publication:', error);
            alert(`elraakaj na ppaj : ${error.message}`);
        }
    });
    
    // Realtime (à laisser actif)
    if (!activeRealtimeChannels['fedde']) {
         const channel = sb.channel('fedde_posts')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload) => {
                const newPost = payload.new;
                const { data: sender } = await sb.from('users').select('username, avatar_url').eq('id', newPost.user_id).single();
                if (sender) { newsfeedEl.innerHTML = createPostElement(newPost, sender.username, sender.avatar_url) + newsfeedEl.innerHTML; }
            })
            .subscribe();
        activeRealtimeChannels['fedde'] = channel;
    }

    await loadNewsfeed();
}


// ==========================================================
// === VUE : WAXTAAN (initWaxtaan) ===
// ==========================================================
async function initWaxtaan() { 
    const currentUserId = await checkAuth(); 
    if (!currentUserId) return;
    attachLogoutListener();

    const messagesEl = document.getElementById('messages');
    const inputEl = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-button');
    const usersListEl = document.getElementById('online-users-list');
    const recordBtn = document.getElementById('record-btn');
    
    // Assure que la saisie Gagganti est active
    activateGaggantiInput('message-input');
    
    // --- Fonction d'affichage des messages ---
    function displayMessage(message, username) {
        const isSelf = message.user_id === currentUserId;
        const messageEl = document.createElement('div');
        messageEl.className = `message ${isSelf ? 'message-out' : 'message-in'} gagganti-text-flow`;
        
        let contentHTML;
        // Le texte Gagganti des autres doit être inversé pour être lu "normalement"
        const messageContent = isSelf ? message.contenu : mirrorWordsOnly(message.contenu);
        
        // Gestion des types de contenu (texte et vocal)
        if (message.type === 'text') {
            contentHTML = `<p class="message-text">${messageContent}</p>`;
        } else if (message.type === 'vocal') {
            contentHTML = `<audio controls src="${message.contenu}" class="message-audio"></audio>`;
        } else {
            contentHTML = `<p class="message-text">${messageContent}</p>`;
        }

        messageEl.innerHTML = `
            <div class="message-header gagganti-text-flow">${username || 'rueta\'iP'}</div>
            ${contentHTML}
            <div class="message-time">${new Date(message.created_at).toLocaleTimeString()}</div>
        `;
        messagesEl.prepend(messageEl); // Ajouter en haut pour que le scroll s'ajuste
        // messagesEl.scrollTop = messagesEl.scrollHeight; // À utiliser si on affiche en ordre inverse
    }
    
    // --- Chargement de l'historique ---
    async function loadHistory() {
        const { data: messages, error } = await sb
            .from('messages')
            .select(`*, users!inner(username)`)
            .order('created_at', { ascending: false }) // Afficher le plus récent en haut de l'historique
            .limit(50);
        
        if (error) { console.error('Erreur chargement historique:', error); return; }

        messagesEl.innerHTML = '';
        // Afficher les messages dans l'ordre de création (chrono)
        messages.reverse().forEach(msg => displayMessage(msg, msg.users.username));
    }
    
    // --- Chargement des utilisateurs en ligne (simplifié) ---
    async function loadUsers() {
        // Sélectionne tous les utilisateurs sauf soi-même
        const { data: users } = await sb.from('users').select('username, avatar_url').neq('id', currentUserId);
        usersListEl.innerHTML = '';
        users.forEach(user => {
            const userEl = document.createElement('div');
            userEl.className = 'online-user gagganti-text-flow';
            userEl.innerHTML = `
                <div class="post-avatar" style="background-image: url('${user.avatar_url || './images/pp5.jpg'}'); background-size:cover;">${user.username.charAt(0).toUpperCase()}</div>
                <span class="online-user-name">${user.username}</span>
            `;
            usersListEl.appendChild(userEl);
        });
    }

    // --- Envoi de Message ---
    async function sendMessage() {
        const brutText = getBrutValue('message-input').trim();
        
        if (!brutText) return;

        try {
            await sb.from('messages').insert([
                { 
                    user_id: currentUserId, 
                    type: 'text', 
                    contenu: brutText // Stocker le brut pour la cohérence
                }
            ]);
            inputEl.value = '';
            inputEl.setAttribute('data-brut', '');
            sendBtn.disabled = true;
        } catch (error) {
            console.error('Erreur lors de l\'envoi:', error);
            alert(`elraakaj na ppaj`);
        }
    }

    // --- Listeners WAXTAAN ---
    
    // Realtime (à laisser actif)
    if (!activeRealtimeChannels['waxtaan']) {
         const channel = sb.channel('waxtaan_room')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
                const newMessage = payload.new;
                const { data: sender } = await sb.from('users').select('username').eq('id', newMessage.user_id).single();
                displayMessage(newMessage, sender ? sender.username : 'rueta\'iP');
            })
            .subscribe();
        activeRealtimeChannels['waxtaan'] = channel;
    }
    
    // Événements DOM
    inputEl.addEventListener('input', () => { sendBtn.disabled = inputEl.value.trim() === ''; });
    inputEl.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
    sendBtn.addEventListener('click', sendMessage);
    recordBtn.addEventListener('click', () => alert(mirrorWordsOnly("Fonction vocal non implémentée mais possible !"))); // Placeholder

    await loadHistory();
    await loadUsers();
}


### 2. VUE : PARAMÈTRES ET PROFIL (`initSafara`)

Cette fonction gère le chargement et la modification du profil et du mot de passe.

```javascript
// ==========================================================
// === VUE : SAFARA (initSafara) ===
// ==========================================================
async function initSafara() { 
    const currentUserId = await checkAuth(); 
    if (!currentUserId) return;
    attachLogoutListener();

    const profileForm = document.getElementById('profile-form');
    const passwordForm = document.getElementById('password-form');
    const avatarInput = document.getElementById('avatar-upload');

    // Assure que la saisie Gagganti est active pour les champs de profil
    activateGaggantiInput('new-username');
    activateGaggantiInput('new-bio');

    // --- Chargement du profil ---
    async function loadProfile() {
        const { data: profile } = await sb.from('users').select('*').eq('id', currentUserId).single();
        if (profile) {
            document.getElementById('current-username-display').textContent = profile.username;
            document.getElementById('current-bio').textContent = profile.bio_gagganti || mirrorWordsOnly("Bio non définie");
            
            // Affichage de l'avatar avec un fallback
            const avatarUrl = profile.avatar_url || '[https://via.placeholder.com/120/FFC300/1A1A1A?text=G](https://via.placeholder.com/120/FFC300/1A1A1A?text=G)';
            document.getElementById('current-avatar').src = avatarUrl;
            
            // Initialisation des champs de modification
            document.getElementById('new-username').value = profile.username;
            document.getElementById('new-bio').value = profile.bio_gagganti ? mirrorWordsOnly(profile.bio_gagganti) : '';
            
            document.getElementById('new-username').setAttribute('data-brut', profile.username);
            document.getElementById('new-bio').setAttribute('data-brut', profile.bio_gagganti || '');
        }
    }
    
    // --- Soumission du formulaire de profil ---
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newUsername = getBrutValue('new-username').trim();
        const newBioBrut = getBrutValue('new-bio').trim();
        const avatarFile = avatarInput.files[0];
        
        let newAvatarUrl = null;

        try {
            if (avatarFile) {
                // Upload vers Supabase Storage
                const filePath = `${currentUserId}/avatar/${Date.now()}_${avatarFile.name}`;
                const { error: uploadError } = await sb.storage.from('medias').upload(filePath, avatarFile);
                if (uploadError) throw uploadError;

                const { data: urlData } = sb.storage.from('medias').getPublicUrl(filePath);
                newAvatarUrl = urlData.publicUrl;
            }

            // Mise à jour de la DB
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
            avatarInput.value = '';
            await loadProfile(); 
        } catch (error) {
            console.error("Erreur de sauvegarde:", error);
            alert(`elraakaj na ppaj : ${error.message}`);
        }
    });

    // --- Soumission du formulaire de mot de passe ---
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

    await loadProfile();
}


### 3. VUE : RECHERCHE ET FOLLOW (`initYeex`)

Cette fonction gère la recherche d'autres membres et les interactions (Follow/DM).

```javascript
// ==========================================================
// === VUE : YEEX (initYeex) ===
// ==========================================================
async function initYeex() { 
    const currentUserId = await checkAuth(); 
    if (!currentUserId) return;
    attachLogoutListener();

    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const resultsEl = document.getElementById('search-results');
    
    activateGaggantiInput('search-input');

    // --- Rendu d'un résultat utilisateur ---
    function renderUserResult(user, isFollowing) {
        const userEl = document.createElement('div');
        userEl.className = 'card gagganti-text-flow';
        userEl.style.display = 'flex';
        userEl.style.justifyContent = 'space-between';
        userEl.style.alignItems = 'center';
        userEl.style.padding = '1rem';

        const bioContent = user.bio_gagganti || mirrorWordsOnly('Bio non définie');
        
        userEl.innerHTML = `
            <div style="flex: 1; direction: rtl;">
                <h3 style="color: var(--accent-secondaire);">${user.username}</h3>
                <p style="font-size: 0.9rem;">${bioContent}</p>
            </div>
            <div style="display: flex; gap: 0.5rem; direction: ltr;">
                <button class="button follow-btn" data-user-id="${user.id}" data-is-following="${isFollowing}">
                    <i class="fas fa-${isFollowing ? 'user-minus' : 'user-plus'}"></i> ${isFollowing ? 'tnèG' : 'eruivS'}
                </button>
                <button class="button secondary dm-btn" data-user-id="${user.id}">
                    <i class="fas fa-paper-plane"></i> reyoV
                </button>
            </div>
        `;
        resultsEl.appendChild(userEl);
    }

    // --- Fonction de recherche ---
    async function searchUsers() {
        const brutSearch = getBrutValue('search-input').trim();
        resultsEl.innerHTML = '';

        if (!brutSearch) {
            // Afficher tous les utilisateurs si la recherche est vide
             resultsEl.innerHTML = '<p class="gagganti-text-flow" style="padding:1rem;">serbmeM seT suoT</p>';
        }

        const { data: users } = await sb.from('users')
            .select('id, username, bio_gagganti')
            .ilike('username', `%${brutSearch}%`) // Recherche par nom d'utilisateur (brut)
            .neq('id', currentUserId)
            .limit(10);
            
        if (!users || users.length === 0) {
            resultsEl.innerHTML = '<p class="gagganti-text-flow" style="padding:1rem;">kén snaS</p>';
            return;
        }
        
        // Vérifier qui est déjà suivi
        const { data: followedUsers } = await sb.from('follows').select('followed_id').eq('follower_id', currentUserId);
        const followedIds = new Set(followedUsers.map(f => f.followed_id));

        users.forEach(user => {
            const isFollowing = followedIds.has(user.id);
            renderUserResult(user, isFollowing);
        });
    }

    // --- Gestion du Follow/Unfollow ---
    resultsEl.addEventListener('click', async (e) => {
        const btn = e.target.closest('.follow-btn');
        if (!btn) return;

        const userIdToFollow = btn.dataset.userId;
        const isFollowing = btn.dataset.isFollowing === 'true';

        try {
            if (isFollowing) {
                // Unfollow
                await sb.from('follows').delete().eq('follower_id', currentUserId).eq('followed_id', userIdToFollow);
            } else {
                // Follow
                await sb.from('follows').insert([{ follower_id: currentUserId, followed_id: userIdToFollow }]);
            }
            searchUsers(); // Recharger les résultats
        } catch (error) {
            alert(`elraakaj na ppaj : ${error.message}`);
        }
    });
    
    // --- Listeners YEEX ---
    searchBtn.addEventListener('click', searchUsers);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchUsers();
    });
    
    // Charge les utilisateurs par défaut au chargement
    await searchUsers();
}


// ==========================================================
// === ROUTER PRINCIPAL (Le moteur de la SPA) ===
// ==========================================================
async function router() {
    let view = window.location.hash.replace('#', '');
    
    if (!view || view === 'auth' || view === 'logout') {
        const userId = await checkAuth(); 
        view = userId ? 'fedde' : 'auth';
    }

    if (renderView(view)) {
        switch (view) {
            case 'auth': await initAuth(); break;
            case 'fedde': await initFedde(); break;
            case 'waxtaan': await initWaxtaan(); break;
            case 'safara': await initSafara(); break;
            case 'yeex': await initYeex(); break;
            default: renderView('fedde'); await initFedde(); break;
        }
        
        // Mettre à jour les listeners de navigation une fois que la nav est rendue
        document.querySelectorAll('#main-nav a').forEach(link => {
            link.onclick = (e) => { 
                e.preventDefault(); 
                const targetView = link.getAttribute('data-view');
                if (targetView === 'logout') handleLogout();
                else renderView(targetView);
            };
        });
    } else {
        renderView('auth'); await initAuth();
    }
}

// Événements de chargement et de hash change
window.addEventListener('load', router);
window.addEventListener('hashchange', router);

// --- FIN FICHIER script1.js ---
