// --- js/waxtaan.js ---
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();

    const messagesEl = document.getElementById('messages');
    const inputEl = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-button');
    const recordBtn = document.getElementById('record-btn');
    const usersListEl = document.getElementById('online-users-list');
    
    activateGaggantiInput('message-input');

    let currentUserId;
    const { data: { user } } = await sb.auth.getUser();
    currentUserId = user.id;

    // Fonction pour afficher le message (HTML)
    function displayMessage(message, username) {
        const isSelf = message.user_id === currentUserId;
        const messageEl = document.createElement('div');
        messageEl.className = `message ${isSelf ? 'message-out' : 'message-in'} gagganti-text-flow`;
        
        let contentHTML;
        const messageContent = isSelf ? message.contenu : mirrorWordsOnly(message.contenu);
        
        // Gestion des différents types de contenu (texte et vocal dans ce chat)
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
    
    // Envoi de Message
    async function sendMessage() {
        // Récupérer le texte brut stocké par GaggantiInput
        const brutText = inputEl.getAttribute('data-brut').trim();
        
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
    
    // --- SUPABASE REALTIME ET HISTORIQUE ---
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
        
    // Événements DOM
    inputEl.addEventListener('input', () => {
        sendBtn.disabled = inputEl.value.trim() === '';
    });
    inputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    sendBtn.addEventListener('click', sendMessage);
    
    loadHistory();
});
