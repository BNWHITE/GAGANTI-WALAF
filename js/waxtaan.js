// --- js/waxtaan.js (CORRIGÉ POUR BYPASS) ---
document.addEventListener('DOMContentLoaded', async () => {
    // Récupérer l'ID utilisateur (BYPASS ou réel)
    const currentUserId = await checkAuth(); 
    if (!currentUserId) return; 
    
    // Charger les données de l'utilisateur (optionnel mais bon pour le profil)
    const { data: userData } = await sb.from('users').select('*').eq('id', currentUserId).single();
    if (!userData) return;
    const currentUser = userData;


    const messagesEl = document.getElementById('messages');
    const inputEl = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-button');
    const recordBtn = document.getElementById('record-btn');
    const usersListEl = document.getElementById('online-users-list');
    
    activateGaggantiInput('message-input');

    // ... (Fonctions displayMessage, uploadMedia, sendMessage, loadHistory restent les mêmes mais utilisent currentUserId) ...
    function displayMessage(message, username) {
        const isSelf = message.user_id === currentUserId;
        const messageEl = document.createElement('div');
        messageEl.className = `message ${isSelf ? 'message-out' : 'message-in'} gagganti-text-flow`;
        
        let contentHTML;
        const messageContent = isSelf ? message.contenu : mirrorWordsOnly(message.contenu);
        
        if (message.type === 'text') {
            contentHTML = `<p class="message-text">${messageContent}</p>`;
        } else if (message.type === 'vocal') {
            contentHTML = `<audio controls src="${message.contenu}" class="message-audio"></audio>`;
        }

        messageEl.innerHTML = `
            <div class="message-header gagganti-text-flow">${username || 'rueta\'iP'}</div>
            ${contentHTML}
            <div class="message-time">${new Date(message.created_at).toLocaleTimeString()}</div>
        `;
        messagesEl.appendChild(messageEl);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }
    
    async function sendMessage() {
        const brutText = inputEl.getAttribute('data-brut').trim();
        
        if (!brutText) return;

        try {
            await sb.from('messages').insert([
                { 
                    user_id: currentUserId, // Utilise l'ID obtenu de checkAuth
                    type: 'text', 
                    contenu: brutText 
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
    
    async function loadHistory() {
        const { data: messages, error } = await sb
            .from('messages')
            .select(`*, users!inner(username)`)
            .order('created_at', { ascending: true })
            .limit(50);
        
        if (error) { console.error('Erreur chargement historique:', error); return; }

        messagesEl.innerHTML = '';
        messages.forEach(msg => displayMessage(msg, msg.users.username));
    }
    
    // Temps Réel
    sb.channel('waxtaan_room')
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'messages' }, 
            async (payload) => {
                const newMessage = payload.new;
                const { data: sender } = await sb.from('users').select('username').eq('id', newMessage.user_id).single();
                displayMessage(newMessage, sender ? sender.username : 'rueta\'iP');
            }
        )
        .subscribe();
        
    // Chargement de la liste des utilisateurs
    async function loadUsers() {
        const { data: users } = await sb.from('users').select('username, avatar_url').neq('id', currentUserId);
        usersListEl.innerHTML = '';
        users.forEach(user => {
            const userEl = document.createElement('div');
            userEl.className = 'online-user gagganti-text-flow';
            userEl.innerHTML = `
                <div class="online-user-avatar">${user.username.charAt(0).toUpperCase()}</div>
                <span class="online-user-name">${user.username}</span>
            `;
            usersListEl.appendChild(userEl);
        });
    }

    // Événements DOM
    inputEl.addEventListener('input', () => { sendBtn.disabled = inputEl.value.trim() === ''; });
    inputEl.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
    sendBtn.addEventListener('click', sendMessage);
    
    loadHistory();
    loadUsers();
});
