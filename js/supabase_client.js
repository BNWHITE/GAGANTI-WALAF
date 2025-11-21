// Remplacez par votre URL de projet Supabase
const SUPABASE_URL = 'https://jxwumbkoikoyfhcmmocq.supabase.co';
// !!! REMPLACEZ PAR VOTRE CLÉ PUBLIQUE (Anon Key) !!!
const SUPABASE_ANON_KEY = 'VOTRE_CLE_PUBLIQUE_SUPABASE'; 

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Logique principale de transformation Gagganti. 
 * Inverse les lettres de chaque mot et l'ordre des lignes (pour la copie).
 * @param {string} text - Le texte brut à transformer.
 * @returns {string} Le texte transformé en Gagganti.
 */
function processGaggantiText(text) {
    if (!text || text.trim() === '') return '';
    
    // 1. Inverser les lettres dans chaque mot, tout en gardant l'ordre des mots dans la ligne
    const mirrorWordsOnly = (line) => line
        .split(/(\s+)/) // Séparer les mots en conservant les espaces
        .map(word => {
            if (word.trim() === '') return word; // Conserver les espaces
            return word.split('').reverse().join('');
        })
        .join('');

    // 2. Séparer les lignes et filtrer les vides
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    // 3. Inverser l'ordre des lignes ET transformer chaque ligne
    const transformedLines = lines.reverse().map(mirrorWordsOnly);
    
    // Joindre avec un retour à la ligne
    return transformedLines.join('\n');
}

/**
 * Fonction pour n'inverser que les lettres dans les mots (utile pour l'affichage en temps réel et pour les exports)
 * @param {string} text - Le texte brut à transformer.
 * @returns {string} Le texte avec les mots miroirs.
 */
function mirrorWordsOnly(text) {
    if (!text || text.trim() === '') return '';

    return text.split('\n')
        .map(line => 
            line.split(/(\s+)/) // Conserver les espaces
                .map(word => {
                    if (word.trim() === '') return word;
                    return word.split('').reverse().join('');
                })
                .join('')
        )
        .join('\n');
}

/**
 * Vérifie l'état d'authentification et redirige.
 * @param {string} redirectPath - Chemin vers lequel rediriger si connecté.
 */
async function checkAuth(redirectPath = '/editeur.html') {
    const { data: { session } } = await sb.auth.getSession();
    
    // S'assurer que le chemin d'accès est cohérent
    const currentPath = window.location.pathname;
    
    if (session) {
        if (currentPath.includes('login.html')) {
            window.location.href = redirectPath;
        }
    } else {
        if (!currentPath.includes('login.html')) {
            window.location.href = '/login.html';
        }
    }
}

// Fonction utilitaire pour la navigation
function navigate(page) {
    window.location.href = page;
}
