# SP Sentinel - Plateforme de Protection Contre les Arnaques SMS au Togo

SP Sentinel est un système de sécurité innovant de type "Souverainiste et Local" créé pour protéger les citoyens togolais contre les cyber-fraudes recensées (faux gains Moov Flooz, Togocom TMoney, phishing, fausses convocations de gendarmerie ou factures CEET fictives).

Ce système a été entièrement conçu et développé par l'équipe : **ANANIVI, RADJI, KPETO et EHE**.

---

## 🛠️ Organisation du Projet

Le projet est structuré de manière modulaire à la racine de l'espace de travail :
1. **`/mobile_agent/`** : L'unité de protection Android (écrite en Java natif). Elle intercepte les messages malveillants à la volée.
2. **`/serveur_central_python/`** : Le module haut de gamme d'analyse judiciaire et de Threat Intelligence (FastAPI & Scrapers CERT.TG/ANCY).
3. **`/serveur_dashboard_react/`** : Le moteur serveur d'administration locale, capable de relayer la télémétrie des agents et de gérer les configurations du SOC.
4. **`/src/`** : L'interface d'administration interactive (React/Vite/TS) représentant le tableau de bord du SOC central de Lomé.

---

## 🛡️ Fonctionnalités Majeures

### 📱 L'Agent Mobile Android (Sécurité Souveraine)
L'agent mobile s'installe via un binaire APK et protège l'usager sans nécessiter d'accès permanent à Internet :
* **Défense par signatures locales (Zéro-Trust)** : Gère une base intégrée contenant les numéros connus de fraudeurs et les liens de phishing. Blocage immédiat avec alerte rouge critique s'il y a correspondance.
* **Moteur d'Heuristique Comportementale (Privilège Offline)** : Si un expéditeur est inconnu, l'application évalue la structure sémantique en direct (recherche de l'appât du gain, de sentiment d'urgence ou d'usurpation d'autorité d'autres administrations togolaises). En cas de menace détectée, elle bloque temporairement et envoie une alerte.
* **Gestion Nuancée des Contacts Connus** : Pour ne pas froisser les liens familiaux ou amicaux, si une signature malveillante est interceptée depuis un **contact enregistré**, l'application ne va pas accuser l'expéditeur mais guider l'utilisateur avec bienveillance (ex: avertir que le proche s'est fait pirater ou a relayé le message par inadvertance, conseiller de l'appeler pour le prévenir).
* **Liste de Confiance (Liste Verte)** : L'usager peut ajouter un correspondant ou un groupe à sa Liste Verte pour désactiver l'analyse psychologique comportementale et éviter de faux signaux.
* **Zone de Déclaration Citoyenne Directe (Nouveau!)** : Intégration d'un module de signalement citoyen. Tout utilisateur peut directement déclarer un appel vocal suspect ou un SMS malveillant reçu, spécifier la catégorie de cybermenace (Flooz/TMoney, cadeaux, chantage/menace, harcèlement) et décrire l'escroquerie.
* **Alertes Vocales & Visuelles Éducatives (Nouveau!)** : En cas d'appel vocal suspect, l'agent affiche des avertissements vulgarisés et clairs en français pour guider le citoyen (ne pas décrocher, ne jamais effectuer de transfert Flooz/TMoney, préserver les codes secrets). Les écrans d'interception (Overlay) et de quarantaine sémantique adoptent une charte visuelle rouge sombre harmonisée (`#150404`).

### 💻 Le Tableau de bord d'Administration de Lomé (SOC)
* **Cartographie en Temps Réel** : Visualise directement la provenance des signaux d'arnaques remontés par les téléphones sur une carte du Togo (Lomé, Sokodé, Kara, Atakpamé, Kpalimé, Dapaong, etc.).
* **Téléphone Virtuel de Simulation** : Un onglet de supervision (Dashboard) intègre un smartphone de simulation interactif. Ce simulateur permet de tester le moteur de l'application, de simuler des SMS/WhatsApp suspects, de passer des appels frauduleux, et de tester la zone de déclaration citoyenne en direct.
* **Threat Intelligence & Scraping** : Le back-end scrape en continu les communiqués des sites gouvernementaux officiels **CERT.TG** et **ANCY (ancy.gouv.tg)**. L'IA Gemini extrait de manière structurée les adjectifs, numéros et liens malveillants pour mettre à jour la base noire d'un seul clic.
* **Inclusion Directe des Déclarations** : Les plaintes et déclarations soumises par les citoyens via le module de déclaration alimentent instantanément le registre de conformité et l'analyse judiciaire (Forensics) du SOC de Lomé.

---

## 🚀 Guide de Test Rapide & Simplifié pour le Jury

Pour simplifier au maximum l'évaluation par le jury, nous avons pré-configuré des **boutons d'action rapide (Presets)** dans l'application mobile et dans le code d'administration. Il n'est plus nécessaire de modifier manuellement le code pour basculer entre les configurations.

### 🌐 ALTERNATIVE A : Test 100% en Ligne (Recommandé, Ultra-Simple)
La plateforme administrative et l'acquisition des données SOC sont déjà déployées en production sur le cloud.

1. **La Console en Ligne** : Accédez à l'URL de production fournie (hébergée sur Render ou l'App de prévisualisation : `https://sp-sentinel-hq.onrender.com/`).
2. **L'Application Mobile** :
   * Ouvrez le projet `/mobile_agent/` dans Android Studio.
   * Compilez directement l'APK de test (`Build > Build Bundle(s) / APK(s) > Build APK(s)`).
   * Installez-la sur un émulateur ou sur votre téléphone de test.
   * **Raccordement Instantané** : Dans l'interface utilisateur de l'application mobile, cliquez sur le bouton vert **🌐 PROD LIGNE**. L'adresse de synchronisation `https://sp-sentinel-hq.onrender.com/` se configure automatiquement.
   * Appuyez sur **SAUVEGARDER L'ADRESSE**. L'application va immédiatement se synchroniser avec le serveur du SOC en ligne d'un simple geste.

---

### 💻 ALTERNATIVE B : Test 100% Local (Dashboard Local + Émulateur local)
Si le jury préfère faire tourner tout le système d'administration hors du cloud sur son propre ordinateur de développement.

1. **Lancement de l'Administration Locale** :
   * Ouvrez un terminal à la racine du projet local.
   * Installez les paquets de dépendances :
     ```bash
     npm install
     ```
   * Lancez le serveur d'administration et d'API en local :
     ```bash
     npm run dev
     ```
   * Le tableau de bord du SOC est désormais accessible sur : `http://localhost:3000`.
2. **Configuration du smartphone virtuel (Émulateur Android)** :
   * Lancez votre émulateur Android (AVD) de test depuis Android Studio.
   * Lancez l'application installée sur l'émulateur.
   * **Raccordement Local Auto** : Dans l'application, cliquez simplement sur le bouton gris **💻 TEST LOCAL**. L'adresse se configure instantanément sur `http://10.0.2.2:3000` (l'adresse IP loopback spéciale intégrée à Android pour cibler le protocole localhost de la machine hôte).
   * Appuyez sur **SAUVEGARDER L'ADRESSE**. L'émulateur est désormais lié en temps réel à votre serveur local de développement. Vous pouvez intercepter des notifications fictives et les observer se synchroniser instantanément sur votre tableau de bord local !

---

### 🔌 ALTERNATIVE C : Test Hybride (Dashboard Local + Téléphone Physique branché)
Si vous lancez l'administration en local sur votre PC mais que vous souhaitez utiliser un **vrai téléphone Android** connecté via câble USB ou sur le réseau sans fil local.

1. **Réseau Partagé** : Assurez-vous que votre PC de développement et votre téléphone Android de test sont connectés au **même réseau Wi-Fi** local.
2. **Lancer le serveur sur le PC** : Démarrez l'administration avec `npm run dev`.
3. **Trouver votre adresse IP** : Dans le terminal de votre PC, entrez la commande réseau :
   * Sur Windows : `ipconfig` (recherchez l'adresse IPv4 sous Wi-Fi, ex: `192.168.1.150`).
   * Sur macOS/Linux : `ifconfig` ou `ip a`.
4. **Configuration du Téléphone** :
   * Installez l'APK sur votre vrai téléphone.
   * Saisissez l'adresse de votre ordinateur suivie du port `:3000` (ex: `http://192.168.1.150:3000`) dans le champ de saisie de l'application.
   * Appuyez sur le bouton de sauvegarde pour recevoir les configurations et y faire remonter la télémétrie.

---

## ⚠️ Configuration cruciale d'Android pour le test de l'APK (Guide pas-à-pas)

Qu'importe l'alternative choisie, pour que l'application d'arrière-plan fonctionne parfaitement sans être censurée par le système d'exploitation commercial Android de test, effectuez ces quelques réglages simples :

### Étape 1 : Désactiver le Play Protect de Google
Le système Play Protect censure par défaut toutes les applications expérimentales compilées localement qui écoutent les notifications et les SMS de bas niveau.
1. Ouvrez l'application **Google Play Store** sur le smartphone de test.
2. Cliquez sur votre **Profil d'utilisateur** (en haut à droite de l'écran).
3. Cliquez sur **Play Protect**.
4. Appuyez sur l'icône d'**Engrenage (Paramètres)** en haut à droite.
5. Décochez et désactivez entièrement ces deux options :
   * *« Analyser les applications avec Play Protect »*.
   * *« Améliorer la détection des applications nocives »*.

### Étape 2 : Autoriser d'installer à partir de sources inconnues
1. Transférez le binaire `app-debug.apk` généré par Android Studio vers le téléphone (via câble USB, WhatsApp, ou Google Drive).
2. Lancez l'installation du fichier et acceptez de court-circuiter l'alerte d'accès des sources inconnues de votre navigateur ou gestionnaire de fichiers.

### Étape 3 : Donner l'Accès aux Notifications système (Très important)
1. Ouvrez l'application **SP_TG** fraîchement installée.
2. L'assistant intégré s'ouvre pour vous demander l'Accès aux Notifications de bas niveau.
3. Le téléphone vous redirige sur la page système "Accès aux notifications".
4. Faites défiler la liste des applications, cherchez **SP_TG**, et **activez l'interrupteur d'autorisation**.

### Étape 4 : Simuler une attaque et valider
* **Simulateur Intégré (Zéro matériel de rechange)** : Dans le Dashboard de la console d'administration, utilisez le smartphone de simulation à droite, saisissez un message d'arnaque (ex: coupure CEET imminente ou gain de 150.000F) et admirez l'interception et le traitement sémantique en direct.
* **Simulateur Physique (Vrai matériel)** : Envoyez un message frauduleux contenant des signatures répertoriées ou des techniques de manipulation (ex: *"Félicitations, vous êtes tiré au sort pour un gain de 100.000F Flooz. Saisissez votre code pour récupérer la somme"*) à l'appareil de test. L'application mobile interceptera la notification instantanément, affichera une alerte et l'enverra sur l'écran du SOC de Lomé.
