// --- js/supabase_client.js (AVEC MODE BYPASS) ---

// REMPLACER LES VALEURS CI-DESSOUS
const SUPABASE_URL = 'https://jxwumbkoikoyfhcmmocq.supabase.co';
const SUPABASE_ANON_KEY = 'VOTRE_CLE_PUBLIQUE_SUPABASE'; // <<< VÉRIFIEZ CETTE VALEUR

// ==========================================================
// *** MODE BYPASS POUR LE DÉVELOPPEMENT ***
// Mettez à 'false' pour réactiver l'authentification
const BYPASS_AUTH = true; 
// ID de l'utilisateur 'mouhamedsy01@gmail.com'
const TEST_USER_ID = '684d59af-2f0a-48f9-8194-3c48337c16f7'; 
// ==========================================================

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fonction essentielle : Inverse les lettres dans chaque mot.
 * Utilisée pour la saisie clavier en temps réel et l'affichage des posts/messages.
 */
function mirrorWordsOnly(text) {
    if (!text || text.trim() === '') return '';

    return text.split(/(\s+)/) // Séparer les mots en conservant les espaces
        .map(word => {
            if (word.trim() === '') return word; // Conserver les espaces
            return word.split('').reverse().join('');
        })
        .join('');
}

function processGaggantiText(text) {
    return mirrorWordsOnly(text); 
}

/**
 * Active la saisie Gagganti en temps réel sur les champs.
 * Stocke le texte BRUT (non-Gagganti) dans l'attribut data-brut.
 */
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

/**
 * Vérifie l'état d'authentification et redirige (Modifié pour le bypass).
 * @param {string} redirectPath - Chemin vers lequel rediriger si connecté.
 * @returns {string | null} L'ID utilisateur réel ou l'ID de test.
 */
async function checkAuth(redirectPath = '/fedde.html') {
    if (BYPASS_AUTH) {
        console.warn("ATTENTION: Le mode BYPASS_AUTH est ACTIF. Redirection désactivée sur les pages protégées.");
        
        const currentPath = window.location.pathname;
        if (currentPath.includes('auth.html') || currentPath.endsWith('index.html') || currentPath.endsWith('/')) {
            window.location.href = redirectPath; // Rediriger l'auth.html vers fedde.html
        }
        return TEST_USER_ID; 
    }
    
    // Logique standard Supabase (si BYPASS_AUTH est false)
    const { data: { session } } = await sb.auth.getSession();
    const currentPath = window.location.pathname;
    
    if (session) {
        if (currentPath.includes('auth.html') || currentPath.endsWith('index.html') || currentPath.endsWith('/')) {
            window.location.href = redirectPath;
        }
        return session.user.id;
    } else {
        if (!currentPath.includes('auth.html') && !currentPath.endsWith('index.html') && !currentPath.endsWith('/')) {
            window.location.href = '/auth.html';
        }
        return null;
    }
}

function navigate(page) {
    window.location.href = page;
}
