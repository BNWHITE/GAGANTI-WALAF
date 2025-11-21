// --- js/yeex.js (CORRIGÉ POUR BYPASS) ---
document.addEventListener('DOMContentLoaded', async () => {
    // Récupérer l'ID utilisateur (BYPASS ou réel)
    const currentUserId = await checkAuth(); 
    if (!currentUserId) return; 

    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const resultsEl = document.getElementById('search-results');
    
    activateGaggantiInput('search-input');

    // Afficher les résultats
    function renderUserResult(user, isFollowing) {
        const userEl = document.createElement('div');
        userEl.className = 'card gagganti-text-flow';
        userEl.style.display = 'flex';
        userEl.style.justifyContent = 'space-between';
        userEl.style.alignItems = 'center';

        const bioContent = user.bio_gagganti || mirrorWordsOnly('bio non définie');
        
        userEl.innerHTML = `
            <div style="flex: 1;">
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

    // Fonction de recherche
    async function searchUsers() {
        const brutSearch = searchInput.getAttribute('data-brut').trim();
        resultsEl.innerHTML = '';

        if (!brutSearch) {
            resultsEl.innerHTML = '<p class="gagganti-text-flow">ehcrcheR ci tur ruT tapp elatuL</p>';
            return;
        }

        const { data: users } = await sb.from('users')
            .select('id, username, bio_gagganti')
            .ilike('username', `%${brutSearch}%`) 
            .neq('id', currentUserId)
            .limit(10);
            
        if (!users || users.length === 0) {
            resultsEl.innerHTML = '<p class="gagganti-text-flow">kén snaS</p>';
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

    // Gestion du Follow
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
    
    // Événements
    searchBtn.addEventListener('click', searchUsers);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchUsers();
    });
    
    // Charger tous les utilisateurs par défaut au chargement de la page
    searchUsers(); 
});
