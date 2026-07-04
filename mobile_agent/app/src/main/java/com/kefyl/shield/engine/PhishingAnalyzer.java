package com.kefyl.shield.engine;

import android.content.Context;
import com.kefyl.shield.data.AppDatabase;
import com.kefyl.shield.data.Signature;
import com.kefyl.shield.data.SignatureDao;
import com.kefyl.shield.data.ContactStateDao;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class PhishingAnalyzer {

    private final SignatureDao signatureDao;
    private final ContactStateDao contactStateDao;

    public PhishingAnalyzer(Context context) {
        AppDatabase db = AppDatabase.getDatabase(context);
        this.signatureDao = db.signatureDao();
        this.contactStateDao = db.contactStateDao();
    }

    /**
     * Analyse le texte extrait de la notification (WhatsApp/SMS)
     * et le compare à tous les patterns malveillants répertoriés en base de données.
     * 
     * @param text Message entier capturé de la notification
     * @return La signature correspondante si compromission détectée, ou null
     */
    public Signature analyzeMessage(String text) {
        return analyzeMessage(text, null);
    }

    /**
     * Analyse le texte extrait de la notification (WhatsApp/SMS)
     * et le compare à tous les patterns malveillants répertoriés en base de données,
     * en prenant également en compte le numéro/identifiant de l'expéditeur.
     * 
     * @param text Message entier capturé de la notification
     * @param senderPhone Numéro de téléphone ou identifiant de l'expéditeur
     * @return La signature correspondante si compromission détectée, ou null
     */
    public Signature analyzeMessage(String text, String senderPhone) {
        if (text == null || text.trim().isEmpty()) {
            return null;
        }

        // Récupérer toutes les signatures actives de la base locale
        List<Signature> activeSignatures = signatureDao.getAllSignatures();
        if (activeSignatures == null || activeSignatures.isEmpty()) {
            return null;
        }

        String lowerText = text.toLowerCase().trim();

        // Nettoyage de la ponctuation et des accents étendus français pour le message
        String cleanTextAll = lowerText.replaceAll("[^a-z0-9àâäéèêëîïôöùûüç]", "");

        // Version dépouillée de protocole pour le message
        String textNoProtocol = lowerText
                .replace("https://", "")
                .replace("http://", "")
                .replace("www.", "");

        for (Signature signature : activeSignatures) {
            String patternStr = signature.getPattern().toLowerCase().trim();
            String type = signature.getType().toUpperCase().trim();

            // --- CAS A : COMPARAISON SOUPLE DE NUMÉRO (PHONE) ---
            if ("PHONE".equals(type)) {
                // 1. Comparaison avec le numéro de l'expéditeur
                if (senderPhone != null && !senderPhone.trim().isEmpty()) {
                    String cleanSender = senderPhone.toLowerCase().replaceAll("[^a-z0-9+]", "");
                    String cleanPattern = patternStr.replaceAll("[^a-z0-9+]", "");
                    
                    if (cleanSender.contains(cleanPattern) || cleanPattern.contains(cleanSender)) {
                        return signature;
                    }
                }
                
                // 2. Recherche du numéro suspect dans le corps du texte
                String digitsText = lowerText.replaceAll("[^0-9]", "");
                String digitsPattern = patternStr.replaceAll("[^0-9]", "");
                if (!digitsPattern.isEmpty() && digitsText.contains(digitsPattern)) {
                    return signature;
                }
                continue;
            }

            // --- CAS B : TOUTES AUTRES SIGNATURES (DOMAIN, URL, TEXT_PATTERN, EMAIL, IP, ETC.) ---
            // 1. Recherche par sous-chaîne exacte (Extrêmement efficace et universel)
            if (lowerText.contains(patternStr)) {
                return signature;
            }

            // 2. Recherche par suppression de protocoles (Utile si l'utilisateur a enregistré l'URL complète mais que le SMS a un format différent)
            String patternNoProtocol = patternStr
                    .replace("https://", "")
                    .replace("http://", "")
                    .replace("www.", "");
            if (!patternNoProtocol.isEmpty()) {
                if (textNoProtocol.contains(patternNoProtocol) || lowerText.contains(patternNoProtocol)) {
                    return signature;
                }
            }

            // 3. Recherche tolérante aux interponctions, espaces multiples, accents, etc. (Anti-obfuscation)
            String cleanPatternAll = patternStr.replaceAll("[^a-z0-9àâäéèêëîïôöùûüç]", "");
            if (!cleanPatternAll.isEmpty() && cleanTextAll.contains(cleanPatternAll)) {
                return signature;
            }
        }
        return null;
    }

    /**
     * Analyse psychologique d'ingénierie sociale (Heuristique/NLP de base).
     * Décèle les leviers d'urgence temporelle, appât du gain et d'usurpation.
     *
     * @param text Le contenu du message
     * @return La liste des leviers détectés
     */
    public List<String> detectSocialEngineeringLevers(String text) {
        List<String> levers = new ArrayList<>();
        if (text == null || text.trim().isEmpty()) {
            return levers;
        }

        String lowerText = text.toLowerCase();

        // 1. Levier de l'Urgence d'action
        String[] urgencyKeywords = {
            "immédiatement", "avant minuit", "suspendu", "bloqué", "re-vérifier", "désactivé",
            "vite", "sous 24h", "sous 48h", "urgence", "action requise", "bloquer", "clôturer", "perdre"
        };
        for (String word : urgencyKeywords) {
            if (lowerText.contains(word)) {
                levers.add("Urgence temporelle ou menace d'actions restrictives");
                break;
            }
        }

        // 2. Levier de l'Appât du gain ou Récompense
        String[] gainKeywords = {
            "gagné", "bonus", "tirage", "loterie", "cadeau", "félicitations", "million", "somme de",
            "gros lot", "remporter", "transfert reçu", "crédité", "crédit de", "participer", "réclamer",
            "flooz gratuit", "tmoney gratuit", "gagner", "récompense", "récompenses", "sélectionné", "sélectionnée"
        };
        for (String word : gainKeywords) {
            if (lowerText.contains(word)) {
                levers.add("Promesse de gain financier ou de récompense");
                break;
            }
        }

        // 3. Levier de l'Usurpation de posture autoritaire / Corporate
        String[] authorityKeywords = {
            "service client", "direction générale", "police", "gendarmerie", "banque", "orabank", "btci", "utb",
            "moov", "togocom", "support technique", "procureur", "chef de service", "administrateur", "conseiller",
            "flooz", "tmoney", "services fiscaux", "direction", "totalenergies", "total energies"
        };
        for (String word : authorityKeywords) {
            if (lowerText.contains(word)) {
                levers.add("Usurpation d'une autorité institutionnelle ou commerciale");
                break;
            }
        }

        return levers;
    }
}
