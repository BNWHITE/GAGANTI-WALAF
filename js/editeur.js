document.addEventListener('DOMContentLoaded', async () => {
    // S'assurer que l'utilisateur est connecté
    await checkAuth();

    const editor = document.getElementById('editor');
    const charCountEl = document.querySelector('.character-count');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Logique Gagganti réutilisée de l'ancien index.html
    const insertAtCursor = (char) => {
      const cursorPos = editor.selectionStart;
      const text = editor.value;
      
      editor.value = text.substring(0, cursorPos) + char + text.substring(cursorPos);
      editor.selectionStart = editor.selectionEnd = cursorPos + char.length;
      updateCharacterCount();
      editor.focus();
    }

    const deleteChar = () => {
      const cursorPos = editor.selectionStart;
      const text = editor.value;
      
      if (cursorPos > 0) {
        editor.value = text.substring(0, cursorPos - 1) + text.substring(cursorPos);
        editor.selectionStart = editor.selectionEnd = cursorPos - 1;
        updateCharacterCount();
      }
      editor.focus();
    }

    const updateCharacterCount = () => {
      const count = editor.value.length;
      charCountEl.textContent = `${count} ttam`; // "mat" en Gagganti
    }

    // Affichage des fonctions du clavier
    document.querySelectorAll('.keyboard button').forEach(button => {
        const char = button.textContent;
        if (char.length === 1 || char === '␣') {
            button.onclick = () => insertAtCursor(char === '␣' ? ' ' : char);
        } else if (button.textContent === '↵') {
            button.onclick = () => insertAtCursor('\n');
        } else if (button.textContent.includes('backspace')) {
            button.onclick = deleteChar;
        }
    });

    editor.addEventListener('input', updateCharacterCount);
    updateCharacterCount();
    editor.focus();
    
    // Gestion de la Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            if (page) navigate(page);
        });
    });

    // --- NOUVELLE FONCTIONNALITÉ SUPABASE: Sauvegarder le Document ---
    document.getElementById('save-doc-btn').addEventListener('click', async () => {
        const titre = document.getElementById('doc-titre').value.trim();
        const contenuBrut = editor.value.trim();

        if (!titre || !contenuBrut) {
            alert('aradtic bindal et ertit el atuL'); // Veuillez taper le titre et écrire du texte.
            return;
        }

        const utilisateur = (await sb.auth.getUser()).data.user;
        if (!utilisateur) {
            alert('retcennoC eS tuad lif'); // Il faut se connecter.
            return;
        }

        try {
            // Transformation Gagganti
            const titreGagganti = mirrorWordsOnly(titre);
            const contenuGagganti = processGaggantiText(contenuBrut);

            const { error } = await sb
                .from('documents')
                .insert([
                    {
                        user_id: utilisateur.id,
                        titre: titreGagganti,
                        contenu_brut: contenuBrut,
                        contenu_gagganti: contenuGagganti,
                    },
                ]);
            
            if (error) throw error;

            alert('sax nàpp na !'); // Sauvegardé !
        } catch (error) {
            console.error("Erreur de sauvegarde:", error);
            alert(`elraakaj na ppaj : ${error.message}`);
        }
    });

    // --- NOUVELLE FONCTIONNALITÉ: Déconnexion ---
    document.getElementById('logout-btn').addEventListener('click', async () => {
        const { error } = await sb.auth.signOut();
        if (error) {
            alert('nuG na ppaj'); // Erreur à la déconnexion
        } else {
            navigate('/login.html');
        }
    });

    // NOTE: Les fonctions d'export (copyText, exportAsImage, etc.) du fichier original peuvent être réintégrées ici 
    // en utilisant les fonctions processGaggantiText et mirrorWordsOnly depuis supabase_client.js.
});
