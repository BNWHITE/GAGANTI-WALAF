document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();

    const messagesEl = document.getElementById('messages');
    const inputEl = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-button');
    const mediaInput = document.getElementById('media-upload');
    const recordBtn = document.getElementById('record-btn');
    const usersListEl = document.getElementById('online-users-list');

    let currentUserId;
    let currentUser;
    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;

    const { data: { user } } = await sb.auth.getUser();
    currentUserId = user.id;

    // Charger les informations de l'utilisateur
    const { data: userData } = await sb.from('users').select('username, avatar_url').eq('id', currentUserId).single();
    currentUser = userData;

    // --- FONCTIONS UTILITAIRES ---
    
    /** * Simule la logique du chat de waxtaan.html pour l'affichage en Gagganti.
     * Pour les messages entrants, inverse les mots (mais pas les lignes)
     */
    function renderGaggantiMessage(text, senderId) {
        // Si c'est votre propre message, n'inversez rien.
        if (senderId === currentUserId) return text; 
        
        // Pour les autres, appliquez l'inversion des lettres dans les mots (Gagganti)
        return mirrorWordsOnly(text);
    }
    
    // Fonction pour afficher le message (HTML)
    function displayMessage(message, username) {
        const isSelf = message.user_id === currentUserId;
        const messageEl = document.createElement('div');
        messageEl.className = `message ${isSelf ? 'message-out' : 'message-in'} gagganti-text-flow`;
        
        let contentHTML;
        const gaggantiContent = renderGaggantiMessage(message.contenu, message.user_id);
        
        // Gestion des différents types de contenu
        if (message.type === 'text') {
            contentHTML = `<p class="message-text">${gaggantiContent}</p>`;
        } else if (message.type === 'image') {
            contentHTML = `<img src="${message.contenu}" alt="elgi" class="message-image">`;
        } else if (message.type === 'vocal') {
            contentHTML = `<audio controls src="${message.contenu}" class="message-audio"></audio>`;
        } else if (message.type === 'emoji') {
            contentHTML = `<span class="message-emoji">${message.contenu}</span>`;
        }

        messageEl.innerHTML = `
            <div class="message-header">
                <span class="message-sender">${username || 'rueta\'iP'}</span>
            </div>
            ${contentHTML}
            <div class="message-time">${new Date(message.created_at).toLocaleTimeString()}</div>
        `;
        messagesEl.appendChild(messageEl);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }
    
    // --- SUPABASE STORAGE: Téléchargement des Médias ---
    async function uploadMedia(file, type) {
        try {
            const fileExtension = file.name.split('.').pop();
            const filePath = `${currentUserId}/${Date.now()}_${type}.${fileExtension}`; 
            
            // 1. Uploader dans Storage
            const { error: uploadError } = await sb.storage
                .from('medias')
                .upload(filePath, file, { cacheControl: '3600', upsert: false });

            if (uploadError) throw uploadError;

            // 2. Obtenir l'URL publique
            const { data: urlData } = sb.storage
                .from('medias')
                .getPublicUrl(filePath);

            const publicUrl = urlData.publicUrl;
            
            // 3. Insérer le message dans la DB
            await sb.from('messages').insert([{ user_id: currentUserId, type: type, contenu: publicUrl }]);
            
        } catch (error) {
            console.error('Erreur lors de l\'envoi du média:', error);
            alert(`elraakaj na ppaj : ${error.message}`);
        }
    }

    // --- ENVOI DE MESSAGE ---
    async function sendMessage() {
        const text = inputEl.value.trim();
        
        if (!text) return;

        try {
            await sb.from('messages').insert([
                { 
                    user_id: currentUserId, 
                    type: 'text', 
                    contenu: text // Contenu brut stocké pour la cohérence
                }
            ]);
            inputEl.value = '';
            sendBtn.disabled = true;
        } catch (error) {
            console.error('Erreur lors de l\'envoi:', error);
            alert(`elraakaj na ppaj`);
        }
    }
    
    // --- GESTION DES MÉDIAS ---
    mediaInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                uploadMedia(file, 'image');
            } else {
                alert('aiden tuad lif'); // Média non supporté
            }
        }
    });
    
    // --- ENREGISTREMENT VOCAL ---
    recordBtn.addEventListener('click', async () => {
        if (isRecording) {
            // Arrêter l'enregistrement
            mediaRecorder.stop();
            isRecording = false;
            recordBtn.textContent = '🎤';
            recordBtn.style.backgroundColor = 'var(--vert-fonce)';
        } else {
            // Démarrer l'enregistrement
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                
                mediaRecorder.ondataavailable = (e) => {
                    audioChunks.push(e.data);
                };
                
                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
                    audioChunks = [];
                    const audioFile = new File([audioBlob], `vocal_${Date.now()}.mp3`, { type: 'audio/mp3' });
                    uploadMedia(audioFile, 'vocal');
                };
                
                mediaRecorder.start();
                isRecording = true;
                recordBtn.textContent = '🛑';
                recordBtn.style.backgroundColor = 'var(--terre)'; // Couleur d'enregistrement
            } catch (err) {
                console.error('Accès au microphone refusé:', err);
                alert('onohporcim ic secca el atuL'); // Veuillez autoriser l'accès au microphone
            }
        }
    });
    
    // --- SUPABASE REALTIME ET HISTORIQUE ---
    
    // 1. Charger l'historique
    async function loadHistory() {
        const { data: messages, error } = await sb
            .from('messages')
            .select(`
                *,
                users!inner(username)
            `)
            .order('created_at', { ascending: true })
            .limit(50);
            
        if (error) {
            console.error('Erreur chargement historique:', error);
            return;
        }

        messagesEl.innerHTML = '';
        messages.forEach(msg => displayMessage(msg, msg.users.username));
    }

    // 2. Écouter les nouveaux messages
    sb.channel('waxtaan_room')
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'messages' }, 
            async (payload) => {
                const newMessage = payload.new;
                
                // Récupérer le nom de l'expéditeur si non inclus (nécessaire car Realtime n'inclut pas les relations)
                const { data: sender } = await sb.from('users').select('username').eq('id', newMessage.user_id).single();
                
                displayMessage(newMessage, sender ? sender.username : 'rueta\'iP');
            }
        )
        // Vous pouvez ajouter des canaux pour les mises à jour des utilisateurs et des réactions
        .subscribe();
        
    // --- GESTION DES UTILISATEURS EN LIGNE (Simulé car Supabase n'offre pas cela nativement sans RLS complexe) ---
    // Nous utiliserons une implémentation simplifiée qui ne fait que lire la liste des users.
    async function loadUsers() {
        const { data: users } = await sb.from('users').select('username, avatar_url').neq('id', currentUserId);
        usersListEl.innerHTML = '';
        users.forEach(user => {
            const userEl = document.createElement('div');
            userEl.className = 'online-user';
            userEl.innerHTML = `
                <div class="online-user-avatar">${user.username.charAt(0).toUpperCase()}</div>
                <span class="online-user-name">${user.username}</span>
            `;
            usersListEl.appendChild(userEl);
        });
        document.querySelector('.online-count').textContent = users.length;
    }
    
    loadHistory();
    loadUsers();

    // --- ÉVÉNEMENTS DOM ---
    inputEl.addEventListener('input', () => {
        sendBtn.disabled = inputEl.value.trim() === '';
    });
    
    inputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);
});

// Fonction à appeler sur chaque champ de saisie Gagganti
function activateGaggantiInput(elementId) {
    const inputElement = document.getElementById(elementId);
    
    inputElement.addEventListener('input', (e) => {
        // Sauvegarder la position du curseur
        const cursorPos = inputElement.selectionStart;
        
        // Obtenir le texte brut tapé par l'utilisateur
        const originalText = e.target.value;
        
        // Appliquer la transformation Gagganti (inversion des lettres dans les mots)
        const transformedText = mirrorWordsOnly(originalText);
        
        // Stocker le texte BRUT dans un attribut de données
        inputElement.setAttribute('data-brut', originalText);
        
        // Afficher le texte Gagganti (inversé) dans le champ
        inputElement.value = transformedText;
        
        // Tenter de restaurer la position du curseur (peut être complexe avec RTL)
        inputElement.selectionStart = inputElement.selectionEnd = cursorPos;
    });
}
// Exemple d'utilisation dans auth.js : 
// activateGaggantiInput('username');
