import React, { useState, useMemo, useEffect } from "react";
import { 
  Users, 
  Server, 
  Activity, 
  TrendingUp, 
  Search, 
  Filter, 
  ShieldAlert, 
  ShieldCheck,
  ShieldX,
  Wifi, 
  WifiOff, 
  CornerDownRight, 
  Cpu, 
  Send, 
  Radio, 
  Zap,
  Terminal,
  Clock,
  Smartphone,
  Shield,
  Bell,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  ChevronRight,
  Battery,
  AlertCircle,
  Info,
  Mail,
  Lock,
  Phone,
  FileText,
  User,
  Sliders,
  QrCode,
  Globe,
  HelpCircle,
  Play,
  File,
  Check,
  BookOpen
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
} from "recharts";
import { MobileAgent, MobileSignal, Threat, PhoneComplaint, ScamPhoneNumber } from "../types";

interface Props {
  threats: Threat[];
  agents: MobileAgent[];
  mobileSignals: MobileSignal[];
  complaints?: PhoneComplaint[];
  scams?: ScamPhoneNumber[];
  onTriggerFlashUpdate: () => Promise<any>;
  onRefreshData?: () => void;
}

export default function AgentSupervisionTab({ 
  threats,
  agents, 
  mobileSignals, 
  complaints = [],
  scams = [],
  onTriggerFlashUpdate,
  onRefreshData 
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Online" | "Offline">("All");
  const [isFlashing, setIsFlashing] = useState(false);
  const [flashLogs, setFlashLogs] = useState<Array<{ time: string; text: string; type: "info" | "success" | "warn" }>>([]);

  // --- MOBILE SIMULATOR STATE ---
  const [simLocalBlockedCount, setSimLocalBlockedCount] = useState(() => {
    try {
      const stored = localStorage.getItem("sp_tg_sim_blocked_count");
      return stored ? parseInt(stored, 10) : 12;
    } catch {
      return 12;
    }
  });
  
  const [phoneState, setPhoneState] = useState<"dashboard" | "receiving" | "quarantine" | "declarations">("dashboard");
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [customSender, setCustomSender] = useState("+228 99 12 04 85");
  const [customText, setCustomText] = useState("");
  const [activeMessageText, setActiveMessageText] = useState("");
  const [activeSender, setActiveSender] = useState("");
  const [isSimulatingApiCall, setIsSimulatingApiCall] = useState(false);

  // --- FOUR NAVIGATION TABS STATES ---
  const [phoneTab, setPhoneTab] = useState<"accueil" | "signaler" | "historique" | "profil">("accueil");
  
  // --- REPORT TAB STATES ---
  const [reportTarget, setReportTarget] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportType, setReportType] = useState<"appel" | "sms" | "whatsapp" | "email" | "lien" | "site" | "compte" | "autre">("sms");
  const [reportStatus, setReportStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  // --- PROFILE TAB STATES ---
  const [isOnlineMode, setIsOnlineMode] = useState(true);
  const [serverAddress, setServerAddress] = useState("https://sp-sentinel-hq.onrender.com");
  const [syncPeriod, setSyncPeriod] = useState("14"); // 14 jours
  const [userName, setUserName] = useState("Citoyen_Volontaire_Togo");
  const [isEditingUser, setIsEditingUser] = useState(false);

  // --- LOCAL HISTORY LIST STATE ---
  const [localHistory, setLocalHistory] = useState<Array<{
    id: string;
    type: "signalement" | "intercept";
    title: string;
    details: string;
    time: string;
    status: "sûr" | "danger" | "transmis";
  }>>([
    {
      id: "hist-1",
      type: "intercept",
      title: "Appel masqué bloqué",
      details: "Numéro suspect bloqué d'office (+228 92 88 12 34)",
      time: "Hier, 18:42",
      status: "danger"
    },
    {
      id: "hist-2",
      type: "intercept",
      title: "Tentative d'arnaque Moov",
      details: "SMS frauduleux bloqué automatiquement (+228 99 12 04 85)",
      time: "Hier, 14:15",
      status: "danger"
    },
    {
      id: "hist-3",
      type: "signalement",
      title: "Signalement d'arnaque envoyé",
      details: "Message d'escroquerie Flooz (+228 99120485)",
      time: "25 Juin, 10:30",
      status: "transmis"
    },
    {
      id: "hist-4",
      type: "signalement",
      title: "Numéro suspect déclaré",
      details: "+228 90 41 82 12 déclaré au centre",
      time: "24 Juin, 16:50",
      status: "transmis"
    }
  ]);

  // --- STATE FOR CITIZEN DECLARATIONS FORM ---
  const [declaringPhone, setDeclaringPhone] = useState("+228 99 ");
  const [declaringCategory, setDeclaringCategory] = useState("Vente pyramidale / Faux gains");
  const [declaringDesc, setDeclaringDesc] = useState("");
  const [declarationStatusMsg, setDeclarationStatusMsg] = useState("");
  const [isSubmittingDeclaration, setIsSubmittingDeclaration] = useState(false);

  // --- STATE FOR VOICE CALL SIMULATION ---
  const [simMode, setSimMode] = useState<"sms" | "call" | "declaration">("sms");
  const [incomingCallNumber, setIncomingCallNumber] = useState("+228 92 88 12 34");
  const [voiceCallState, setVoiceCallState] = useState<"idle" | "incoming" | "active" | "alert">("idle");
  const [isCallScam, setIsCallScam] = useState(false);
  const [callerName, setCallerName] = useState("Numéro Inconnu");

  // New real-time intercept overlay variables
  const [showInAppOverlayAlert, setShowInAppOverlayAlert] = useState(false);
  const [overlayAlertTitle, setOverlayAlertTitle] = useState("");
  const [overlayAlertMessage, setOverlayAlertMessage] = useState("");
  const [overlayAlertAction, setOverlayAlertAction] = useState("");
  const [overlayAlertType, setOverlayAlertType] = useState<"rule1" | "rule2" | "rule3" | "rule4">("rule1");
  
  // Local toggles
  const [isShieldActive, setIsShieldActive] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [phoneLocked, setPhoneLocked] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [connectionCheckResult, setConnectionCheckResult] = useState<string | null>(null);

  // --- EXTRA SHIELD OPTIONS AGAINST FALSE POSITIVES ---
  const [messageSourceType, setMessageSourceType] = useState<"unknown" | "contact" | "group">("unknown");
  const [contactIndex, setContactIndex] = useState(0);
  const [groupName, setGroupName] = useState("Famille & Voisins Lomé");
  const [trustedGroups, setTrustedGroups] = useState<string[]>([]);
  const [whitelistedCheckNotification, setWhitelistedCheckNotification] = useState(false);

  // Derive helper boolean for backward compatibility with existing component code
  const isGroupSource = messageSourceType === "group";
  const isRegisteredContact = messageSourceType === "contact";

  // Repertoires / contacts enregistres par l'utilisateur (Trusted Address Book)
  const registeredContacts = [
    { name: "Maman", phone: "+228 90 12 34 56" },
    { name: "Koffi Ami", phone: "+228 91 88 44 22" },
    { name: "Directeur OTR", phone: "+228 92 11 00 11" },
    { name: "Oncle Kossi", phone: "+228 93 45 67 89" }
  ];

  const addLog = (text: string, type: "info" | "success" | "warn" = "info") => {
    const time = new Date().toLocaleTimeString("fr-FR");
    setFlashLogs(prev => [...prev, { time, text, type }]);
  };

  // Predefined Togolese Phishing SMS/WhatsApp cases
  const simTemplates = [
    {
      title: "Gains Offre Moov/Flooz",
      sender: "+228 99 12 04 85",
      text: "[Flooz] Félicitations! Votre numéro a été tiré au sort pour la promotion de la fête nationale. Vous gagnez la somme de 300.000 FCFA. Appelez vite le 99120485 pour débloquer votre versement.",
      category: "Tentative de vol d'argent (Faux gains)",
      isSignature: true,
      heuristics: "Répertorié dans la base de données de sécurité nationale de Lomé. Bloqué d'office comme arnaque confirmée, même si reçu d'un ami."
    },
    {
      title: "Fausse Facture Courant CEET",
      sender: "+228 90 41 82 12",
      text: "CEET ALERTE: Facture non réglée. Votre électricité sera coupée sous 24 heures. Réglez d'urgence votre impayé sur: https://ceet-facturation-tmoney.com/",
      category: "Fausse menace de coupure CEET",
      isSignature: true,
      heuristics: "Le faux site 'ceet-facturation-tmoney.com' est enregistré dans la base de signatures suspectes. Bloqué immédiatement pour usurpation."
    },
    {
      title: "Fausse Subvention ANCY",
      sender: "+228 92 11 34 56",
      text: "Recrutement urgent ANCY: Subvention d'État disponible pour les citoyens étudiants et entrepreneurs du Togo (50.000F/mois). Inscrivez-vous vite: http://ancy.gouv.tg-subvention.net",
      category: "Fausse aide de l'État pour vol d'infos",
      isSignature: true,
      heuristics: "Le site 'ancy.gouv.tg-subvention.net' usurpe l'État et figure dans la base nationale de signalements."
    },
    {
      title: "Exemple : dépôt pressé (Base blanche)",
      sender: "+228 99 12 04 85",
      text: "consulte ton solde je viens de t'envoyer un dépôt fait vite je suis presser",
      category: "Technique de manipulation (Urgence factice)",
      isSignature: false,
      heuristics: "Non connu dans la base de données. Analyse en direct : l'alerte ne se déclenchera que si ce message est envoyé par un numéro inconnu. Aucun signalement si envoyé par vos contacts."
    },
    {
      title: "Vol de compte WhatsApp (Base blanche)",
      sender: "+228 97 88 55 22",
      text: "Salut, j'ai envoyé accidentellement un code d'activation SMS à 6 chiffres sur ton numéro par mégarde, s'il te plaît renvoie-le moi d'urgence pour me dépanner !",
      category: "Vol de compte par code secret",
      isSignature: false,
      heuristics: "Non connu dans la base. Analyse en direct : l'alerte détectera la demande suspecte de code secret sous prétexte d'urgence si l'expéditeur est inconnu."
    }
  ];

  // Sync state if template selection changes
  useEffect(() => {
    if (selectedTemplate !== -1 && simTemplates[selectedTemplate]) {
      // If we are simulating a registered contact, keep the contact phone, otherwise default template phone
      if (messageSourceType !== "contact") {
        setCustomSender(simTemplates[selectedTemplate].sender);
      }
      setCustomText(simTemplates[selectedTemplate].text);
    }
  }, [selectedTemplate, messageSourceType]);

  // Handle local counter store
  const incrementSimCounter = () => {
    setSimLocalBlockedCount(prev => {
      const next = prev + 1;
      try {
        localStorage.setItem("sp_tg_sim_blocked_count", next.toString());
      } catch (e) {}
      return next;
    });
  };

  // NLP psychological levers detection helper for local heuristic checking
  const hasHeuristicManipulations = useMemo(() => {
    const norm = customText.toLowerCase();
    const keywords = [
      "solde", "dépôt", "gagnez", "virement", "fête nationale", "fête", 
      "gratuit", "argent", "facture", "coupure", "code", "réclamez", 
      "somme", "reçoivent", "offre", "activation", "code d'activation", 
      "urgen", "presser", "cliquez", "moov", "flooz", "tmoney", "débloquer"
    ];
    return keywords.some(kw => norm.includes(kw));
  }, [customText]);

  // Perform a comparison match inside the loaded threats database (signatures check)
  const containsKnownSignature = useMemo(() => {
    const normalizedText = customText.toLowerCase();
    const normalizedSender = (customSender || "").toLowerCase().replace(/\s+/g, "");

    // 1. Match local/central database signatures
    const matchesDb = threats.some(t => {
      if (!t.value) return false;
      const val = t.value.toLowerCase().replace(/\s+/g, "").trim();
      if (val.length < 3) return false;
      return normalizedText.includes(val) || normalizedSender.includes(val);
    });

    if (matchesDb) return true;

    // 2. Hardcoded mock signature check for typical simulated templates to ensure accurate demonstration
    const mockSignatureFauxDoC = [
      "ancy.gouv.tg-subvention.net",
      "ceet-facturation-tmoney.com",
      "99120485",
      "300.000 fcfa",
      "300 000 fcfa"
    ];

    return mockSignatureFauxDoC.some(domain => normalizedText.includes(domain));
  }, [threats, customText, customSender]);

  const handleUnlockPhone = () => {
    setPhoneLocked(false);
    if (showNotification) {
      setShowNotification(false);
      setShowInAppOverlayAlert(true);
      addLog("🔓 Téléphone déverrouillé : L'alerte d'interception forcée s'ouvre automatiquement niveau plein écran.", "success");
    }
  };

  // Simulate receiving the SMS on SP_TG mobile
  const handleSimulateSMS = async () => {
    if (!customText.trim()) return;
    
    // Set message active on the virtual device
    let finalSender = customSender || "+228 90 00 00 00";
    if (messageSourceType === "contact") {
      finalSender = registeredContacts[contactIndex].phone;
    }
    setActiveSender(finalSender);
    setActiveMessageText(customText);
    
    // Reset notification and alert views
    setShowNotification(false);
    setWhitelistedCheckNotification(false);
    setShowInAppOverlayAlert(false);
    
    const isWhitelisted = trustedGroups.includes(groupName);

    // Skip all actions if group is whitelisted and not a direct central signature match!
    if (messageSourceType === "group" && isWhitelisted && !containsKnownSignature) {
      addLog(`🛡️ Garde-corps : Groupe répertorié dans votre Liste Verte ("${groupName}"). L'analyse de manipulation en direct a été évitée. Message délivré silencieusement.`, "success");
      setWhitelistedCheckNotification(true);
      return;
    }

    // Determine if it's a threat
    const isThreat = containsKnownSignature || hasHeuristicManipulations;

    if (!isThreat) {
      addLog(`🛡️ Garde-corps : Message reçu sain de "${finalSender}". Aucune menace détectée.`, "success");
      setPhoneState("dashboard");
      return;
    }

    // Identify if the sender's phone is blocklisted in the central SOC signatures DB
    const cleanSenderNum = finalSender.replace(/[\s\-\+\(\)]/g, "");
    const isSenderPhoneBlocklisted = threats.some(t => {
      if (t.type !== "phone") return false;
      const cleanDbVal = t.value.replace(/[\s\-\+\(\)]/g, "");
      return cleanDbVal.length >= 6 && (cleanSenderNum.includes(cleanDbVal) || cleanDbVal.includes(cleanSenderNum));
    }) || cleanSenderNum.includes("99120485");

    let titleText = "";
    let messageText = "";
    let actionText = "";
    let ruleMatched: "rule1" | "rule2" | "rule3" | "rule4" = "rule1";

    if (isSenderPhoneBlocklisted) {
      ruleMatched = "rule4";
      titleText = "🚨 EXPÉDITEUR TRAQUÉ D'OFFICE";
      messageText = `Le numéro : "${finalSender}" est signalé comme un numéro traqué par les forces de l'ordre pour tentative de fraude, cybercriminalité, redistribution de messages d'escroquerie.`;
      actionText = "Action : Bloquez définitivement cet expéditeur et effacez ce message.";
    } else if (messageSourceType === "contact" && containsKnownSignature) {
      ruleMatched = "rule3";
      titleText = "⚠️ COMPROMISSION COMPLÉMENTAIRE";
      const senderName = registeredContacts[contactIndex]?.name || "Mon Contact";
      
      const containsUrl = customText.toLowerCase().includes("http") || 
                          customText.toLowerCase().includes("ceet-facturation") ||
                          customText.toLowerCase().includes("ancy.gouv") ||
                          customText.toLowerCase().includes(".com") ||
                          customText.toLowerCase().includes(".net");
                          
      const containsInnerPhone = customText.replace(/[^0-9]/g, "").length >= 6 && 
                                 !customText.includes(cleanSenderNum);

      if (containsUrl) {
        messageText = `Propriétaire : "${senderName}" vient de vous envoyer un lien qui a été signalé comme une fraude par les forces de l'ordre.`;
      } else if (containsInnerPhone) {
        messageText = `Propriétaire : "${senderName}" vient de vous envoyer un texte contenant un numéro signalé comme une fraude par les forces de l'ordre.`;
      } else {
        messageText = `Propriétaire : "${senderName}" vient de vous envoyer un message qui a été signalé comme une fraude par les forces de l'ordre.`;
      }
      actionText = "Action : Votre proche n'est pas coupable. Il a pu être piraté ou a partagé ce message sans le savoir. Appelez-le directement pour l'avertir.";
    } else if (containsKnownSignature) {
      ruleMatched = "rule2";
      titleText = "🚨 ARNAQUE CONFIRMÉE - SOC";
      messageText = `Numéro : "${finalSender}" (Non connu de votre répertoire) vous a envoyé un message qui a été détecté comme une tentative très populaire d'escroquerie, d'arnaque qui a été détectée par les forces de l'ordre.`;
      actionText = "Action : Message hautement dangereux. Supprimez-le immédiatement.";
    } else {
      ruleMatched = "rule1";
      titleText = "⚠️ ALERTE VIGILANCE SÉMANTIQUE";
      messageText = `Numéro : "${finalSender}" (Non connu de votre répertoire) vous a envoyé un message qui ressemble à une tentative de fraude.`;
      actionText = "Action : Prudence recommandée. Ne répondez pas et ne cliquez sur aucun lien.";
    }

    // Set states to display the instant overlay
    if (isShieldActive) {
      setOverlayAlertTitle(titleText);
      setOverlayAlertMessage(messageText);
      setOverlayAlertAction(actionText);
      setOverlayAlertType(ruleMatched);
      
      if (phoneLocked) {
        setShowInAppOverlayAlert(false);
        setShowNotification(true);
        addLog(`📬 ÉCRAN SUSPENDU : ${titleText}. L'appareil est éteint/verrouillé : L'alerte est mise en attente. Une notification de sécurité s'affiche sur l'écran de verrouillage, et surgira dès le déverrouillage pour protéger l'utilisateur.`, "warn");
      } else {
        setShowInAppOverlayAlert(true);
        setShowNotification(false);
        addLog(`🚨 INTERCEPTION DIRECTE : ${titleText}. Le smartphone étant actif, la fenêtre d'alerte de cybermenace s'est ouverte instantanément en plein écran pour barrer la route à l'escroquerie.`, "warn");
      }
      
      // Increment blocked count & make background server submission
      incrementSimCounter();
      
      addLog(`🚨 INTERCEPTION TEMPS RÉEL : ${titleText}. Une fenêtre d'interruption s'est affichée à l'écran.`, "warn");
      
      // Auto-submit telemetry back to the SOC Express API
      setIsSimulatingApiCall(true);
      try {
        await fetch("/api/v1/report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-agent-code": "kfl-shield-simulation-device-token"
          },
          body: JSON.stringify({
            device_id: "SP-TG-SIMUL-PHONE",
            sender_phone: messageSourceType === "group" 
              ? `[Groupe: ${groupName}] ${finalSender}` 
              : messageSourceType === "contact"
                ? `[Contact: ${registeredContacts[contactIndex].name}] ${finalSender}`
                : finalSender,
            evidence_text: customText,
            location: "Lomé",
            meta_data: {
              detection_reason: ruleMatched === "rule1" ? "HEURISTIC_NLP_MATCH" : "CENTRAL_BLOCKLIST_MATCH",
              rule_matched: ruleMatched,
              simulated: true,
              sender_type: messageSourceType,
              timestamp_epoch: Date.now()
            }
          })
        });
        if (onRefreshData) {
          onRefreshData(); // Sync maps & graphs in realtime
        }
      } catch (e) {
        console.error("Failed background telemetry report simulation", e);
      } finally {
        setIsSimulatingApiCall(false);
      }
    } else {
      addLog(`⚠️ Garde-corps désactivé : Le message suspect s'est propagé sur le téléphone.`, "warn");
    }

    try {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } catch (e) {}
  };

  const handleAcknowledgeOverlayAlert = () => {
    setShowInAppOverlayAlert(false);
    setShowNotification(false);
    setPhoneState("dashboard");
  };

  const handleOpenAlertAndBlock = async () => {
    setShowNotification(false);
    setPhoneState("receiving");
    
    // Simulate short processing delay for NLP heuristic analysis on the device
    await new Promise(r => setTimeout(r, 800));
    
    if (isShieldActive) {
      setPhoneState("quarantine");

      // Only automatically submit and increment if not a mild group threat that needs choice!
      const isMildGroup = messageSourceType === "group" && !containsKnownSignature;
      
      if (!isMildGroup) {
        incrementSimCounter();
        
        // Phase 2: Transmit live telemetry packet to the Express server SOC (Real-time Integration!)
        setIsSimulatingApiCall(true);
        try {
          const response = await fetch("/api/v1/report", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-agent-code": "kfl-shield-simulation-device-token"
            },
            body: JSON.stringify({
              device_id: "SP-TG-SIMUL-PHONE",
              sender_phone: messageSourceType === "group" 
                ? `[Groupe: ${groupName}] ${activeSender}` 
                : messageSourceType === "contact"
                  ? `[Contact: ${registeredContacts[contactIndex].name}] ${activeSender}`
                  : activeSender,
              evidence_text: activeMessageText,
              location: "Lomé",
              meta_data: {
                detection_reason: containsKnownSignature ? "CENTRAL_BLOCKLIST_MATCH" : "HEURISTIC_NLP_MATCH",
                simulated: true,
                sender_type: messageSourceType,
                timestamp_epoch: Date.now()
              }
            })
          });
          const resJson = await response.json();
          
          if (resJson.success) {
            addLog(`Alerte envoyée : Interception sécurisée ! Le rapport de renseignements a été acheminé au centre administratif national.`, "success");
            if (onRefreshData) {
              onRefreshData(); // Trigger React refresh so the tables/graphs of the SOC update immediately!
            }
          }
        } catch (e) {
          console.error("Telemetry simulation error", e);
          addLog(`Simulation : Impossible d'envoyer l'alerte au poste central. Est-il connecté ?`, "warn");
        } finally {
          setIsSimulatingApiCall(false);
        }
      } else {
        addLog(`Garde-corps : Analyse d'un groupe en cours. Souhaitez-vous faire confiance à ce groupe pour arrêter les alertes de ce genre ?`, "info");
      }
    } else {
      setPhoneState("dashboard");
      addLog(`Danger : La protection du téléphone est coupée. Le message dangereux est arrivé sans être vérifié !`, "warn");
    }
  };

  const handleTrustGroup = () => {
    if (!trustedGroups.includes(groupName)) {
      setTrustedGroups(prev => [...prev, groupName]);
    }
    setPhoneState("dashboard");
    addLog(`Liste Verte : Vous avez ajouté le groupe "${groupName}" à votre liste verte locale. Les fausses alertes y sont désormais éteintes !`, "success");
  };

  const handleReportGroup = async () => {
    incrementSimCounter();
    setIsSimulatingApiCall(true);
    try {
      const response = await fetch("/api/v1/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-agent-code": "kfl-shield-simulation-device-token"
        },
        body: JSON.stringify({
          device_id: "SP-TG-SIMUL-PHONE",
          sender_phone: `[Groupe: ${groupName}] ${activeSender}`,
          evidence_text: activeMessageText,
          location: "Lomé",
          meta_data: {
            detection_reason: "USER_GROUP_REPORTED",
            simulated: true,
            timestamp_epoch: Date.now()
          }
        })
      });
      const resJson = await response.json();
      if (resJson.success) {
        addLog(`Signalement Groupe : Le message suspect dans "${groupName}" a été bloqué et signalé directement au poste central !`, "success");
        if (onRefreshData) {
          onRefreshData();
        }
      }
    } catch (e) {
      console.error("Telemetry simulation error", e);
      addLog(`Simulation : Erreur de transmission du signalement au poste central.`, "warn");
    } finally {
      setIsSimulatingApiCall(false);
      setPhoneState("dashboard");
    }
  };

  // Filter agents list
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      const matchesSearch = 
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.ipAddress.includes(searchTerm);
      const matchesStatus = 
        statusFilter === "All" || 
        (statusFilter === "Online" && agent.status === "Online") ||
        (statusFilter === "Offline" && agent.status === "Offline");
      return matchesSearch && matchesStatus;
    });
  }, [agents, searchTerm, statusFilter]);

  // Counts
  const stats = useMemo(() => {
    const total = agents.length;
    const online = agents.filter(a => a.status === "Online").length;
    const offline = total - online;
    const totalSignals = mobileSignals.length;
    return { total, online, offline, totalSignals };
  }, [agents, mobileSignals]);

  // Curve data: Compute simulated daily incoming signals timeline
  const timelineData = useMemo(() => {
    const data: Record<string, { date: string; Signatures: number; ActiveAgents: number }> = {};
    
    const baseDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    }).reverse();

    baseDays.forEach(day => {
      const formatted = day.split("-").slice(1).join("/");
      data[day] = { 
        date: formatted, 
        Signatures: 0, 
        ActiveAgents: agents.filter(a => a.status === "Online").length 
      };
    });

    if (mobileSignals.length > 0) {
      mobileSignals.forEach(sig => {
        const dayRaw = sig.timestamp.split("T")[0];
        if (data[dayRaw]) {
          data[dayRaw].Signatures += 1;
        }
      });
    } else {
      baseDays.forEach((day, idx) => {
        data[day].Signatures = Math.floor(Math.sin((idx + 1) * 0.8) * 4) + 6;
      });
    }

    return Object.values(data).sort((a, b) => a.date.localeCompare(b.date));
  }, [mobileSignals, agents]);

  // Execute flashing sequence
  const handleFlashUpdateClick = async () => {
    if (isFlashing) return;
    setIsFlashing(true);
    setFlashLogs([]);
    addLog("Initiation de la mise à jour d'urgence (FLASH BROADCAST)", "info");
    
    try {
      addLog("Analyse du parc de terminaux disponibles...", "info");
      await new Promise(r => setTimeout(r, 1000));
      addLog(`Réseau centralisé prêt. Ciblage de ${stats.online} agents en ligne.`, "success");
      
      const res = await onTriggerFlashUpdate();
      await new Promise(r => setTimeout(r, 1000));
      addLog("Génération des payloads de signatures de blocage cryptées...", "info");
      await new Promise(r => setTimeout(r, 1200));
      addLog("Broadcast de l'alerte hertzienne achevée avec succès.", "success");
      addLog("Les terminaux de l'appli SP_TG mobile forcent la mise à jour hertzienne.", "success");
      
      if (onRefreshData) onRefreshData();
    } catch (e) {
      addLog("Erreur de synchronisation radio de la passerelle.", "warn");
    } finally {
      setIsFlashing(false);
    }
  };

  return (
    <div className="space-y-6 leading-relaxed">
      
      {/* 1. Header Grid Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#10B981] animate-pulse" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">
              SUPERVISION ET CONFORMITÉ DE L&apos;APPLI MOBILE &laquo; SP_TG mobile &raquo;
            </h2>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1 font-mono">
            Contrôlez l&apos;état global des boucliers citoyens, suivez les signatures activées et testez l&apos;intercepteur heuristique.
          </p>
        </div>
        
        {/* Real-time sync button */}
        <button
          onClick={handleFlashUpdateClick}
          disabled={isFlashing}
          className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border transition duration-300 cursor-pointer ${isFlashing ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/25" : "bg-[#10B981] hover:bg-[#10B981]/80 text-white border-transparent"}`}
        >
          <Zap className={`w-4 h-4 ${isFlashing ? "animate-spin" : ""}`} />
          {isFlashing ? "BROADCAST EN COURS..." : "DIFFUSION DE SÉCURITÉ EN DIRECT (FLASH)"}
        </button>
      </div>

      {/* 2. Visual Enterprise Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Agents */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-5 relative overflow-hidden group shadow-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#10B981]/5 rounded-full blur-2xl pointer-events-none transition duration-300"></div>
          <span className="text-[10px] font-mono font-bold text-[#94A3B8] block uppercase tracking-wider">Citoyens Enrôlés</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-white font-mono tracking-tight">{stats.total}</span>
            <span className="text-xs text-[#94A3B8] font-sans">mobiles actifs</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
            <Server className="w-3.5 h-3.5" />
            <span>Base synchronisée Lomé SP</span>
          </div>
        </div>

        {/* Online State */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-5 relative overflow-hidden group shadow-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none transition duration-300"></div>
          <span className="text-[10px] font-mono font-bold text-[#10B981] block uppercase tracking-wider">Agents en écoute active</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-[#10B981] font-mono tracking-tight">{stats.online}</span>
            <span className="text-xs text-[#10B981]/80 font-mono">({stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0}%)</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-[#10B981]/80">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
            <span>Canaux radio connectés</span>
          </div>
        </div>

        {/* Offline State */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-5 relative overflow-hidden group shadow-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">En veille locale (sans Net)</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-[#E5E7EB] font-mono tracking-tight">{stats.offline}</span>
            <span className="text-xs text-[#94A3B8] font-sans">protection locale OK</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
            <span>Toujours protégés par l&apos;heuristique</span>
          </div>
        </div>

        {/* Received Signals count */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-5 relative overflow-hidden group shadow-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#10B981]/5 rounded-full blur-2xl pointer-events-none transition duration-300"></div>
          <span className="text-[10px] font-mono font-bold text-[#10B981] block uppercase tracking-wider">Incidents Bloqués à l&apos;échelle</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-[#10B981] font-mono tracking-tight">{stats.totalSignals}</span>
            <span className="text-xs text-[#10B981]/80 font-mono">alertes SOC</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-[#10B981]/80">
            <Activity className="w-3.5 h-3.5 text-[#10B981] animate-pulse" />
            <span>Moteur d&apos;analyse de Lomé en ligne</span>
          </div>
        </div>

      </div>

      {/* 3. MAIN WORKPLACE LAYOUT with integrated Live Mobile Simulator on the Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Realtime charts, terminal and directory list (Columns: 5/12) */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* Curve Visualization & Terminal Log Pair */}
          <div className="bg-[#121A2F] border border-white/5 rounded-xl p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Courbe chronologique de flux
                </h4>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">
                  Signatures d&apos;ingénierie active interceptées d&apos;urgence.
                </p>
              </div>
              <span className="text-[9px] font-mono text-[#06B6D4] font-bold uppercase py-0.5 px-2 bg-[#06B6D4]/10 border border-[#06B6D4]/25 rounded">
                Live Feed
              </span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ left: -25, top: 10, right: 10 }}>
                  <defs>
                    <linearGradient id="colorSignatures" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                  <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: 9, fontFamily: "monospace" }} />
                  <YAxis stroke="#64748b" style={{ fontSize: 9, fontFamily: "monospace" }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0B1226", borderColor: "rgba(59,130,246,0.2)", color: "#FFFFFF" }}
                    labelStyle={{ fontFamily: "monospace", color: "#64748b" }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Signatures" 
                    stroke="#06B6D4" 
                    strokeWidth={1.5} 
                    fillOpacity={1} 
                    fill="url(#colorSignatures)" 
                    name="Alertes Bloquées" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Flash Logs Mini Terminal */}
          <div className="bg-[#121A2F] border border-white/5 rounded-xl p-5 shadow-sm">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-white/5 pb-3 mb-3">
              <Terminal className="w-3.5 h-3.5 text-[#06B6D4]" />
              Console Hertzienne (Poste de Contrôle Lomé)
            </h4>

            <div className="space-y-2 bg-[#0B1020]/75 border border-white/5 p-3 rounded-lg h-36 overflow-y-auto font-mono text-[10px] leading-relaxed">
              {flashLogs.length === 0 ? (
                <div className="text-slate-550 italic p-1 uppercase">
                  📡 Prêt pour réception. Déclenchez le broadcast flash ou simulez un message sur le smartphone à droite pour charger des données réelles.
                </div>
              ) : (
                flashLogs.map((log, index) => (
                  <div key={index} className="flex gap-1.5 items-start">
                    <span className="text-slate-650 shrink-0 select-none">[{log.time}]</span>
                    <span className={log.type === "success" ? "text-emerald-400 font-bold" : log.type === "warn" ? "text-rose-450" : "text-[#CBD5E1]"}>
                      {log.text}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-2 text-[9px] text-slate-500 font-mono uppercase tracking-wide">
              * La transmission télémetrique s&apos;effectue de façon cryptée via protocole sécurisé.
            </div>
          </div>

          {/* Deployed Agents Directory */}
          <div className="bg-[#121A2F] border border-white/5 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-white/5 font-mono">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                RÉSEAU DES AGENTS ACTIFS ({filteredAgents.length})
              </h4>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filtrer..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="bg-[#0B1020] border border-white/5 rounded-lg pl-7 pr-3 py-1 text-[10px] text-white placeholder-slate-600 focus:outline-none focus:border-[#10B981]"
                  />
                  <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0B1020]/50 border-b border-[#1A2542] text-[9px] text-slate-500 uppercase">
                    <th className="py-2 px-2">Terminal</th>
                    <th className="py-2 px-2">Localisation</th>
                    <th className="py-2 px-2">Dernière Synchro</th>
                    <th className="py-2 px-2">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {filteredAgents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-550 italic uppercase">
                        Aucun agent actif.
                      </td>
                    </tr>
                  ) : (
                    filteredAgents.map(agent => (
                      <tr key={agent.id} className="hover:bg-[#0B1020]/25 transition text-[11px]">
                        <td className="py-2 px-2">
                          <div>
                            <span className="text-white font-bold block leading-tight">{agent.name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5 leading-none">
                              <span className="text-[9px] text-[#06B6D4] font-mono">v{agent.version}</span>
                              {agent.phone && (
                                <>
                                  <span className="text-slate-550 text-[8px]">•</span>
                                  <span className="text-[9px] text-slate-400 font-mono select-all">📞 {agent.phone}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-slate-400">
                          {agent.city}, TG
                        </td>
                        <td className="py-2 px-2 text-slate-400 text-[10px] font-mono select-all">
                          {agent.lastSync ? (
                            (() => {
                              try {
                                const d = new Date(agent.lastSync);
                                const day = String(d.getDate()).padStart(2, '0');
                                const month = String(d.getMonth() + 1).padStart(2, '0');
                                const h = String(d.getHours()).padStart(2, '0');
                                const m = String(d.getMinutes()).padStart(2, '0');
                                const s = String(d.getSeconds()).padStart(2, '0');
                                return `${day}/${month} à ${h}:${m}:${s}`;
                              } catch(e) {
                                return agent.lastSync;
                              }
                            })()
                          ) : (
                            "En attente"
                          )}
                        </td>
                        <td className="py-2 px-2">
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#10B981]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                            ACTIVE
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Side: HIGH CONTEXT HIGH FIDELITY SMARTPHONE PREVIEW (Columns: 7/12) */}
        <div className="xl:col-span-7 space-y-6">
          
          {/* SIMULATION EXPLANATORY CARD */}
          <div className="bg-[#111827] border border-[#10B981]/25 rounded-xl p-5 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/[0.02] rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex gap-3">
              <Smartphone className="w-8 h-8 text-[#10B981] shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  Démonstration Live Citoyenne
                </h3>
                <p className="text-[11px] text-[#94A3B8] mt-1 font-sans">
                  Voici le simulateur officiel de l&apos;application mobile citoyenne <strong className="text-white font-mono uppercase">SP_TG mobile</strong>. 
                  Sélectionnez un cas de cyber-arnaque togolaise classique ci-dessous, puis cliquez sur envoyer pour tester le comportement du téléphone et voir comment il vous protège en direct !
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start items-center justify-center gap-6 mt-4">
            
            {/* PHYSICAL SMARTPHONE CHASSIS */}
            <div className="w-[290px] h-[550px] bg-[#040814] rounded-[42px] border-4 border-slate-700 shadow-2xl relative overflow-hidden flex flex-col justify-between p-2.5 ring-8 ring-slate-900/40 shrink-0">
              
              {/* Speaker & notch cutout */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-center">
                <div className="w-12 h-1 bg-neutral-800 rounded-full"></div>
              </div>

              {/* Status bar (Mock Android UI) */}
               <div className="h-6 w-full px-4 pt-1 flex items-center justify-between text-[9px] font-mono text-slate-400 z-20 bg-black/60 font-medium">
                 <span>13:37</span>
                 <div className="flex items-center gap-1.5">
                   <span className="text-[8px] bg-sky-500/10 text-[#38BDF8] px-1 rounded uppercase tracking-widest leading-none font-bold">SP_TG Net</span>
                   <Wifi className="w-2.5 h-2.5 text-[#38BDF8]" />
                   <Battery className="w-3.5 h-3.5 text-[#38BDF8]" />
                 </div>
               </div>
 
              {/* VOICE CALL SIMULATION SCREEN OVERLAY */}
              {voiceCallState !== "idle" && (
                <div className="absolute inset-0 bg-gradient-to-b from-[#0A1128] to-[#121F42] z-45 p-5 flex flex-col justify-between pt-10 text-white select-none animate-fade-in text-center font-sans">
                  
                  {/* Status Bar inside calling Screen */}
                  <div className="absolute top-1 left-4 right-4 flex items-center justify-between text-[8px] font-mono text-slate-400 z-50 pt-2">
                    <span>Appel Sécurisé</span>
                    <span>Moov/Togo</span>
                  </div>

                  <div className="my-auto space-y-5 pt-8">
                    {/* Pulsing Avatar or call indicator */}
                    <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                      <div className="absolute inset-0 bg-red-500/10 rounded-full animate-ping duration-2000"></div>
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 shadow-xl ${isCallScam ? "bg-red-950/80 border-red-500 text-red-100" : "bg-[#1D2B4A]/60 border-blue-500 text-slate-100"}`}>
                        <Phone className="w-6 h-6 rotate-12 text-slate-200" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-mono font-bold tracking-widest text-[#38BDF8] block animate-pulse">
                        {voiceCallState === "incoming" ? "📟 Appel Entrant..." : "📞 En Conversation..."}
                      </span>
                      <h4 className="text-xs font-black text-white leading-tight break-all font-mono">
                        {callerName}
                      </h4>
                      <p className="text-[9.5px] font-mono text-slate-400 tracking-wider select-all">
                        {incomingCallNumber}
                      </p>
                    </div>

                    {/* RULES TRIGGER WARNING */}
                    <div className="mx-auto max-w-[210px] p-2.5 rounded-xl bg-black/60 border border-white/5 shadow leading-normal text-left">
                      {isCallScam ? (
                        <div className="space-y-1.5 text-slate-200">
                          <div className="text-red-500 font-sans font-black text-[9.5px] uppercase tracking-wider flex items-center gap-1 leading-none animate-pulse">
                            ⚠️ APPEL ARNAQUE !
                          </div>
                          <p className="text-[8.5px] text-red-300 leading-snug">
                            <strong>Menteur connu :</strong> Ce numéro de téléphone essaie de vous mentir pour voler votre argent.
                          </p>
                          <div className="text-[8px] bg-red-950/40 p-1.5 rounded-lg border border-red-900/20 text-red-100/90 space-y-1 leading-tight">
                            <div>• <strong>Ne répondez pas !</strong></div>
                            <div>• N&apos;envoyez pas de Flooz ou Tmoney.</div>
                            <div>• Ne donnez pas vos codes secrets.</div>
                          </div>
                        </div>
                      ) : incomingCallNumber.trim().match(/^[A-Za-z\s]+$/) ? (
                        <div className="space-y-1 text-center">
                          <div className="text-emerald-400 font-sans font-black text-[8.5px] uppercase tracking-wider flex items-center justify-center gap-1 leading-none">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> SERVICE ENREGISTRÉ SÛR
                          </div>
                          <p className="text-[8px] text-slate-300 leading-normal">
                            C&apos;est un service officiel du Togo (<strong>{incomingCallNumber}</strong>). Sûr à 100%.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1 text-center">
                          <div className="text-slate-400 font-sans font-bold text-[8.5px] uppercase tracking-wider leading-none">
                            👤 APPEL STANDARD
                          </div>
                          <p className="text-[8px] text-slate-400 leading-normal">
                            Numéro ordinaire. Pas de signalement d&apos;arnaque reçu.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CALL BUTTONS ROW */}
                  <div className="pb-4 pt-2 flex items-center justify-center gap-6 font-mono">
                    {voiceCallState === "incoming" ? (
                      <>
                        <button
                          onClick={() => {
                            setVoiceCallState("idle");
                            addLog(`❌ Appel décliné pour le numéro ${incomingCallNumber}.`, "info");
                          }}
                          className="w-10 h-10 bg-red-650 hover:bg-red-650 active:scale-90 rounded-full flex items-center justify-center text-white cursor-pointer transition shadow-lg shrink-0"
                          title="Décliner l'appel"
                        >
                          <Phone className="w-4 h-4 rotate-135 text-white" />
                        </button>
                        
                        <button
                          onClick={() => {
                            setVoiceCallState("active");
                            addLog(`📞 Conversation activée avec le numéro ${incomingCallNumber}. Soyez vigilant.`, "info");
                          }}
                          className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 active:scale-90 rounded-full flex items-center justify-center text-white cursor-pointer transition shadow-lg shrink-0 animate-bounce"
                          title="Répondre"
                        >
                          <Phone className="w-4 h-4 text-white" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setVoiceCallState("idle");
                          addLog(`⏹️ Fin d'appel vocal avec le numéro ${incomingCallNumber}.`, "info");
                        }}
                        className="py-1.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-full text-[9px] uppercase font-bold tracking-widest cursor-pointer transition shadow-lg duration-200"
                      >
                        ⏹️ RACCROCHER
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* LIVE SIMULATIVE PUSH NOTIFICATION POPUP */}
              {showNotification && (
                <div 
                  className={`absolute top-7 left-2 right-2 p-3 bg-slate-950/95 border rounded-xl text-[11px] text-white shadow-xl z-50 animate-bounce cursor-pointer ${
                    containsKnownSignature 
                      ? "border-red-500/40 shadow-red-500/5 hover:border-red-400/50" 
                      : "border-emerald-500/30 hover:border-emerald-400/50"
                  }`}
                  onClick={handleOpenAlertAndBlock}
                >
                  <div className={`flex items-center gap-2 mb-1.5 font-mono text-[9px] tracking-wider font-bold ${
                    containsKnownSignature ? "text-red-400" : "text-emerald-400"
                  }`}>
                    <Bell className="w-3 h-3 animate-pulse" />
                    <span>
                      {containsKnownSignature ? (
                        <span className="inline-flex items-center gap-1">
                          <AlertOctagon className="w-3.5 h-3.5 text-red-400 shrink-0" /> ARNAQUE CONFIRMÉE PAR LE CENTRE • SP_TG
                        </span>
                      ) : isGroupSource ? (
                        <span className="inline-flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" /> MESSAGE SUSPECT EN GROUPE • SP_TG
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" /> TENTATIVE D'ARNAQUE DÉTECTÉE • SP_TG
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className={`p-1 rounded shrink-0 ${
                      containsKnownSignature ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
                    }`}>
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <strong className="text-white text-[10px] block mb-0.5">
                        {isGroupSource 
                          ? `💬 ${groupName}` 
                          : isRegisteredContact 
                            ? `👤 ${registeredContacts[contactIndex]?.name || activeSender}` 
                            : activeSender
                        }
                      </strong>
                      <span className="text-slate-400 text-[8.5px] block font-mono mb-0.5">
                        {isGroupSource 
                          ? `Participant: ${activeSender}` 
                          : isRegisteredContact 
                            ? `Contact Enregistré: ${activeSender}` 
                            : "Numéro Inconnu (Direct)"
                        }
                      </span>
                      <p className="text-slate-300 font-sans line-clamp-2 text-[10px] leading-snug">{activeMessageText}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-[9px] font-mono text-center text-sky-400 border-t border-white/5 pt-1.5 font-bold uppercase tracking-wider flex items-center justify-center gap-1 animate-pulse">
                    <span>Cliquez ici pour vérifier et vous protéger !</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              )}

              {/* LIVE GREEN INFO POPUP FOR WHITELISTED GROUPS */}
              {whitelistedCheckNotification && (
                <div 
                  className="absolute top-7 left-2 right-2 p-3 bg-slate-950/95 border border-emerald-500/45 rounded-xl text-[11px] text-white shadow-xl z-50 cursor-pointer hover:border-emerald-450/60"
                  onClick={() => setWhitelistedCheckNotification(false)}
                >
                  <div className="flex items-center gap-2 mb-1.5 text-emerald-400 font-mono text-[9px] tracking-wider font-bold">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>💬 GROUPE AUTORISÉ (LISTE VERTE) • SP_TG</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="p-1 rounded bg-emerald-500/10 text-emerald-400 shrink-0">
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <strong className="text-white text-[10px] block mb-0.5">💬 {groupName}</strong>
                      <p className="text-slate-300 font-sans leading-relaxed text-[9.5px]">
                        L&apos;alerte d&apos;arnaque pour ce groupe a été bloquée car il est marqué comme fiable à 100%. Aucun faux positif généré !
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-[8px] font-mono text-center text-slate-500 border-t border-white/5 pt-1.5 uppercase font-bold tracking-wider">
                    Cliquez pour masquer cette notification
                  </div>
                </div>
              )}

              {/* SMARTPHONE VIRTUAL SCREEN */}
              <div className="flex-1 bg-[#050B1D] rounded-[32px] overflow-hidden flex flex-col justify-between relative p-4 text-xs select-none">
                
                {/* High fidelity StatusBar of simulated Smartphone */}
                <div className="h-5 w-full flex items-center justify-between px-1 text-slate-500 text-[8px] font-mono relative z-10 select-none border-b border-white/[0.03] pb-1 mb-1">
                  <div className="flex items-center gap-1 font-bold">
                    <span>TOGO CELL</span>
                    <Wifi className="w-2.5 h-2.5 text-emerald-500" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Battery className="w-3.5 h-3.5 text-emerald-500" />
                    <span>88%</span>
                    <span className="font-bold text-slate-300 ml-1">12:45</span>
                  </div>
                </div>

                {/* Visual backdrop watermark style */}
                <div className="absolute inset-0 bg-radial-[circle_at_top] from-blue-500/5 to-transparent pointer-events-none z-0"></div>

                {/* REAL-TIME INTERCEPT OVERLAY MODAL */}
                {showInAppOverlayAlert && (
                  <div className="absolute inset-x-2 top-8 bottom-8 bg-[#150404] border border-red-900/50 rounded-2xl z-50 flex flex-col justify-between p-3.5 shadow-2xl animate-fade-in text-slate-100 overflow-y-auto scrollbar-none text-left">
                    <div className="flex items-center justify-between border-b border-red-900/20 pb-2">
                      <div className="flex items-center gap-1.5 text-red-400">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        <span className="font-mono font-black text-[9.5px] uppercase tracking-wide">
                          Arnaque Bloquée !
                        </span>
                      </div>
                      
                      {isGroupSource ? (
                        <span className="bg-[#128C7E]/20 text-[#25D366] text-[8px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border border-[#128C7E]/40 uppercase flex items-center gap-1">
                          <Mail className="w-3 h-3 text-[#25D366]" /> Message WhatsApp
                        </span>
                      ) : (
                        <span className="bg-slate-800/80 text-slate-200 text-[8px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border border-slate-700/50 uppercase flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-300" /> Message SMS
                        </span>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between my-2 space-y-2">
                      <div className="pt-1 select-text">
                        <div className="text-[11px] font-bold text-red-200 leading-snug flex items-center gap-1">
                          {isGroupSource && !containsKnownSignature ? (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Message suspect à vérifier
                            </>
                          ) : isRegisteredContact ? (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Message suspect venant d&apos;un ami
                            </>
                          ) : (
                            <>
                              <AlertOctagon className="w-3.5 h-3.5 text-red-400 shrink-0 animate-pulse" /> Attention, tentative d&apos;arnaque !
                            </>
                          )}
                        </div>
                        <p className="text-[9px] text-red-300/80 leading-normal mt-1">
                          {isGroupSource && !containsKnownSignature ? (
                            "Un message suspect a été envoyé dans votre groupe. Prenez garde aux liens."
                          ) : isRegisteredContact ? (
                            `Votre contact (${registeredContacts[contactIndex]?.name || activeSender}) vous a envoyé un message dangereux. Son téléphone a peut-être été piraté, ou il a partagé ce piège sans le savoir.`
                          ) : (
                            "Une personne inconnue essaie de vous tromper pour vous voler de l'argent."
                          )}
                        </p>
                      </div>

                      <div className="bg-black/30 border border-white/5 p-2 rounded-lg space-y-1">
                        <span className="text-[7.5px] text-slate-400 font-mono block uppercase">
                          Message suspect intercepté :
                        </span>
                        <p className="text-[9px] text-slate-200 leading-relaxed italic">
                          &quot;{activeMessageText}&quot;
                        </p>
                      </div>

                      <div className="bg-red-950/15 border border-red-900/30 p-2.5 rounded-lg space-y-2 text-left">
                        <span className="text-[8px] text-red-300 uppercase font-black tracking-wider block">
                          Ce que vous devez faire :
                        </span>
                        <ul className="text-[8.5px] text-red-100/90 space-y-1.5 leading-normal">
                          <li className="flex items-start gap-1.5">
                            <span className="text-red-500 font-bold shrink-0">❌</span>
                            <span><strong>Ne cliquez sur aucun lien bleu</strong> dans ce message.</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-red-500 font-bold shrink-0">❌</span>
                            <span><strong>N'envoyez jamais d'argent</strong>, ni de transfert Flooz ou Tmoney.</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-red-500 font-bold shrink-0">❌</span>
                            <span><strong>Faites attention :</strong> ne donnez aucun code secret reçu par SMS.</span>
                          </li>
                          {isGroupSource ? (
                            <li className="flex items-start gap-1.5 border-t border-red-900/10 pt-1.5 mt-1.5">
                              <span className="text-emerald-400 font-bold shrink-0">💡</span>
                              <span>Quittez le groupe si des inconnus y partagent souvent des cadeaux ou des gains faciles.</span>
                            </li>
                          ) : isRegisteredContact ? (
                            <li className="flex items-start gap-1.5 border-t border-red-900/10 pt-1.5 mt-1.5">
                              <span className="text-emerald-400 font-bold shrink-0">📞</span>
                              <span className="text-emerald-200 font-bold">Appelez directement votre proche au téléphone pour l'avertir et vérifier.</span>
                            </li>
                          ) : (
                            <li className="flex items-start gap-1.5 border-t border-red-900/10 pt-1.5 mt-1.5">
                              <span className="text-red-400 font-bold shrink-0">🚫</span>
                              <span className="text-red-200 font-bold">Bloquez ce numéro immédiatement pour ne plus recevoir de messages de sa part.</span>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleAcknowledgeOverlayAlert}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 transition-colors text-white font-sans text-[9px] font-black uppercase tracking-wider rounded-xl cursor-pointer text-center flex items-center justify-center gap-1 shadow-lg shadow-emerald-950/20"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Compris, supprimer la menace
                      </button>
                      <p className="text-[6.8px] text-center text-slate-500 font-mono tracking-wide uppercase mt-2">
                        🛡️ Protégé par SP_TG • Sécurité Nationale du Togo
                      </p>
                    </div>
                  </div>
                )}

                {/* Simulated Screen Body according to active Phone State */}
                {phoneLocked ? (
                  /* BEAUTIFUL LOCKSCREEN FOR THE SMARTPHONE */
                  <div className="flex-1 flex flex-col justify-between z-10 pt-8 animate-fade-in text-slate-200">
                    <div className="flex flex-col items-center select-none">
                      {/* Locking status indicator */}
                      <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700/60 flex items-center justify-center mb-1 shadow-md animate-pulse">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      
                      {/* High fidelity Lockscreen Date Time in French Togolese vibe */}
                      <span className="text-[7.5px] uppercase tracking-widest font-bold text-slate-500 font-mono">Lomé, Togo</span>
                      <h3 className="text-3xl font-mono font-bold tracking-tight text-white leading-none mt-1">12:45</h3>
                      <span className="text-[7.5px] text-slate-400 font-sans tracking-wide block mt-1 font-medium">Vendredi 5 Juin</span>
                    </div>

                    {/* Central Notifications space inside the Lockscreen */}
                    <div className="my-auto px-1.5 py-4 w-full flex flex-col gap-2.5">
                      {showNotification ? (
                        <div 
                          onClick={handleUnlockPhone}
                          className="bg-slate-950/95 border border-red-500/40 p-2.5 rounded-xl text-left shadow-lg scale-[98%] hover:scale-[100%] transition-transform duration-205 cursor-pointer animate-pulse"
                        >
                          <div className="flex items-center justify-between border-b border-white/5 pb-1 mb-1.5 text-[7px] font-mono">
                            <span className="text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3 animate-bounce shrink-0" /> ALERTE CYBERGAD
                            </span>
                            <span className="text-slate-500 font-bold uppercase">À l&apos;instant</span>
                          </div>
                          <strong className="text-slate-100 text-[9.5px] font-bold block mt-1">Expéditeur suspect : {activeSender}</strong>
                          <p className="text-[8.2px] text-slate-350 line-clamp-2 mt-1 leading-snug">
                            &quot;{activeMessageText}&quot;
                          </p>
                          <div className="text-[7.2px] font-mono text-emerald-400 font-black mt-2 text-right border-t border-white/5 pt-1 uppercase tracking-wide">
                            👉 Cliquez pour déverrouiller et sécuriser
                          </div>
                        </div>
                      ) : (
                        <div className="text-center font-mono text-[7px] text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1 py-4">
                          <CheckCircle className="w-3 h-3 text-emerald-500/30" /> Aucun message suspect
                        </div>
                      )}
                    </div>

                    {/* Quick Swipe/Click to unlock simulator button */}
                    <button
                      onClick={handleUnlockPhone}
                      className="w-full py-2 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-mono text-[8px] font-bold uppercase tracking-widest rounded-xl transition cursor-pointer shadow-lg shadow-blue-500/10 active:scale-95 flex items-center justify-center gap-1"
                    >
                      <span>🔓 DÉVERROUILLER LE PROTOTYPE</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* TRANSIENT STATES (RECEIVING/SCANNING & QUARANTINE/INTERCEPT ALERT) */}
                    {phoneState === "receiving" && (
                      <div className="flex-1 flex flex-col justify-between z-10 pt-6 animate-pulse">
                        <div className="text-center my-auto space-y-3">
                          <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto flex items-center justify-center">
                            <Cpu className="w-5 h-5 text-emerald-500" />
                          </div>
                          <h4 className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-widest text-center">
                            RECHERCHE DE PIÈGES...
                          </h4>
                          <p className="text-[9px] text-slate-400 font-sans max-w-[180px] mx-auto leading-normal">
                            Votre garde du corps examine s&apos;il s&apos;agit d&apos;une tentative d&apos;arnaque ou d&apos;un vol d&apos;argent.
                          </p>
                        </div>
                      </div>
                    )}

                    {phoneState === "quarantine" && (
                      <div className="flex-1 flex flex-col justify-between z-10 pt-3 animate-fade-in text-slate-200">
                        <div className="flex flex-col flex-1 bg-[#150404] border border-red-900/40 rounded-2xl p-3 shadow-2xl justify-between overflow-y-auto max-h-[355px] scrollbar-none text-left">
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between border-b border-red-900/20 pb-2">
                              <div className="flex items-center gap-1.5 text-red-400">
                                <ShieldAlert className="w-4 h-4 shrink-0" />
                                <span className="font-mono font-black text-[9.5px] uppercase tracking-wide">
                                  Arnaque Bloquée
                                </span>
                              </div>
                              
                              {isGroupSource ? (
                                <span className="bg-[#128C7E]/20 text-[#25D366] text-[8px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border border-[#128C7E]/40 uppercase">
                                  WhatsApp
                                </span>
                              ) : (
                                <span className="bg-slate-800/80 text-slate-200 text-[8px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border border-slate-700/50 uppercase">
                                  SMS
                                </span>
                              )}
                            </div>

                            <div className="pt-1.5">
                              <h4 className="text-[11px] font-bold text-red-200 leading-snug font-sans">
                                {isGroupSource && !containsKnownSignature ? (
                                  "Message suspect à vérifier"
                                ) : isRegisteredContact ? (
                                  "Message suspect venant d'un ami"
                                ) : (
                                  "Attention, tentative d'arnaque !"
                                )}
                              </h4>
                              <p className="text-[9px] text-red-300/80 leading-normal mt-1 font-sans">
                                {isGroupSource && !containsKnownSignature ? (
                                  "Un message suspect a été détecté dans le groupe. Prenez garde aux liens."
                                ) : isRegisteredContact ? (
                                  `Votre contact (${registeredContacts[contactIndex]?.name || activeSender}) vous a partagé un contenu douteux sans le savoir.`
                                ) : (
                                  "Un numéro non enregistré tente de vous soutirer de l'argent ou des codes."
                                )}
                              </p>
                            </div>

                            <div className="bg-black/30 border border-white/5 p-2 rounded-lg space-y-1">
                              <span className="text-[7.5px] text-slate-400 font-mono block uppercase">
                                {isGroupSource 
                                  ? `Groupe : ${groupName} • Expéditeur : ${activeSender}`
                                  : `Expéditeur : ${isRegisteredContact ? (registeredContacts[contactIndex]?.name || activeSender) : activeSender}`
                                }
                              </span>
                              <p className="text-[9px] text-slate-200 leading-relaxed italic font-sans">
                                &quot;{activeMessageText}&quot;
                              </p>
                            </div>

                            <div className="bg-red-950/15 border border-red-900/30 p-2 rounded-lg space-y-1.5 font-sans">
                              <span className="text-[8px] text-red-300 uppercase font-black tracking-wider block">
                                Actions recommandées :
                              </span>
                              <ul className="text-[8px] text-red-100/90 space-y-1 leading-normal list-inside list-disc">
                                <li>Ne cliquez pas sur les liens.</li>
                                <li>N&apos;envoyez jamais d&apos;argent ni de code.</li>
                                <li>Bloquez et signalez le numéro.</li>
                              </ul>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-red-900/10 mt-3 space-y-2">
                            {isGroupSource && !containsKnownSignature ? (
                              <div className="grid grid-cols-2 gap-1.5 font-sans">
                                <button
                                  onClick={handleTrustGroup}
                                  className="py-1.5 bg-emerald-700 hover:bg-emerald-800 transition-colors text-white text-[8.5px] font-bold uppercase rounded-lg cursor-pointer flex items-center justify-center gap-1"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Confiance
                                </button>
                                <button
                                  onClick={handleReportGroup}
                                  className="py-1.5 bg-red-600 hover:bg-red-700 transition-colors text-white text-[8.5px] font-bold uppercase rounded-lg cursor-pointer flex items-center justify-center gap-1"
                                >
                                  Bloquer
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setPhoneState("dashboard")}
                                className="w-full py-2 bg-[#00C896] hover:bg-emerald-600 transition-colors text-black font-sans text-[9px] font-black uppercase tracking-wider rounded-xl cursor-pointer text-center flex items-center justify-center gap-1 shadow-lg shadow-emerald-950/20"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Fermer l&apos;alerte
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MAIN BOTTOM TABBED VIEWS */}
                    {phoneState === "dashboard" && (
                      <div className="flex-1 flex flex-col justify-between z-10 pt-2 animate-fade-in text-left overflow-hidden">
                        
                        {/* Tab Content Body */}
                        <div className="flex-1 overflow-y-auto pr-0.5 scrollbar-none pb-2 flex flex-col">
                          
                          {/* Tab 1: Accueil */}
                          {phoneTab === "accueil" && (
                            <div className="space-y-3 flex-1 flex flex-col justify-between">
                              {/* Reassuring header with SP SENTINEL branding */}
                              <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                                <div className="flex items-center gap-1.5">
                                  {/* Outlined capsule representing the uniform brand logo */}
                                  <div className="w-8 h-4 rounded-full bg-[#10B981] p-[1px] shrink-0">
                                    <div className="w-full h-full rounded-full bg-[#050B1D] flex items-center justify-center gap-[1px]">
                                      <span className="text-[#10B981] font-black text-[7px] leading-none">S</span>
                                      <span className="text-white font-black text-[7px] leading-none">P</span>
                                    </div>
                                  </div>
                                  <span className="text-white font-sans font-black text-[10px] tracking-wider uppercase">SP SENTINEL</span>
                                </div>
                                <div className="flex items-center gap-1 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 rounded-full px-1.5 py-0.5 text-[6.5px] font-sans font-extrabold tracking-wider uppercase">
                                  <span className="w-1 h-1 bg-[#10B981] rounded-full animate-ping"></span>
                                  Actif
                                </div>
                              </div>

                              {/* Big animated spinning wireframe globe */}
                              <div className="py-2 flex flex-col items-center justify-center text-center my-auto relative">
                                <div className="relative w-24 h-24 flex items-center justify-center mb-1.5">
                                  {/* Glow background */}
                                  <div className="absolute w-16 h-16 rounded-full bg-emerald-500/5 blur-xl pointer-events-none"></div>
                                  
                                  {/* Spinning wireframe globe */}
                                  <svg className="w-20 h-20 text-emerald-400 relative z-10" viewBox="0 0 100 100">
                                    <style>{`
                                      @keyframes globe-spin {
                                        0% { transform: rotate(0deg); }
                                        100% { transform: rotate(360deg); }
                                      }
                                      .animate-globe-custom {
                                        animation: globe-spin 15s linear infinite;
                                        transform-origin: 50px 50px;
                                      }
                                    `}</style>
                                    <g className="animate-globe-custom">
                                      {/* Outer dashed halo boundary */}
                                      <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" fill="none" opacity="0.3" />
                                      {/* Main sphere edge */}
                                      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.75" />
                                      {/* Longitude lines (Vertical Ellipses) */}
                                      <ellipse cx="50" cy="50" rx="26" ry="40" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.5" />
                                      <ellipse cx="50" cy="50" rx="13" ry="40" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.5" />
                                      <line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
                                      {/* Latitude lines (Horizontal Ellipses) */}
                                      <ellipse cx="50" cy="50" rx="40" ry="26" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.4" />
                                      <ellipse cx="50" cy="50" rx="40" ry="13" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.4" />
                                      <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
                                      
                                      {/* Decorative glowing dots representing threat intel locations on grid */}
                                      <circle cx="50" cy="10" r="1.5" fill="#10B981" />
                                      <circle cx="50" cy="90" r="1.5" fill="#10B981" />
                                      <circle cx="24" cy="30" r="2" fill="#EF4444" className="animate-pulse" />
                                      <circle cx="76" cy="70" r="2" fill="#EF4444" className="animate-pulse" />
                                      <circle cx="37" cy="63" r="1.5" fill="#10B981" />
                                      <circle cx="63" cy="37" r="1.5" fill="#10B981" />
                                      <circle cx="50" cy="50" r="2.5" fill="#10B981" />
                                    </g>
                                  </svg>
                                </div>

                                <h4 className="text-[9px] font-mono font-black uppercase tracking-widest text-[#10B981]">
                                  PROTECTION GLOBALE ACTIVÉE
                                </h4>
                                <p className="text-[7.2px] text-slate-400 font-sans mt-0.5 font-semibold">
                                  {isOnlineMode ? "Liaison cryptée active • Lomé, Togo" : "Analyse locale active • Autonome"}
                                </p>
                              </div>

                              {/* Stats / Metrics (3-column layout) */}
                              <div className="grid grid-cols-3 gap-1 bg-slate-950/60 p-2 border border-white/5 rounded-2xl relative">
                                <div className="text-center font-sans">
                                  <span className="text-[6.5px] text-slate-400 block uppercase font-bold tracking-tight">Signatures connues</span>
                                  <strong className="text-xs font-mono text-emerald-400 block mt-0.5">{threats.length}</strong>
                                </div>
                                <div className="text-center border-l border-white/5 font-sans">
                                  <span className="text-[6.5px] text-slate-400 block uppercase font-bold tracking-tight">Menaces détectées</span>
                                  <strong className="text-xs font-mono text-red-400 block mt-0.5">{mobileSignals.length > 0 ? mobileSignals.length : simLocalBlockedCount}</strong>
                                </div>
                                <div className="text-center border-l border-white/5 font-sans">
                                  <span className="text-[6.5px] text-slate-400 block uppercase font-bold tracking-tight">Contacts dangereux</span>
                                  <strong className="text-xs font-mono text-sky-400 block mt-0.5">{scams.length + complaints.length || 54}</strong>
                                </div>
                              </div>

                              {/* Connection Check / Server Liaison verification (to check if device has internet / server link) */}
                              <div className="space-y-1.5 pt-1">
                                <button 
                                  onClick={() => {
                                    setIsCheckingConnection(true);
                                    setConnectionCheckResult(null);
                                    addLog("Vérification de la connexion au serveur en cours...", "info");
                                    setTimeout(() => {
                                      setIsCheckingConnection(false);
                                      if (isOnlineMode) {
                                        setConnectionCheckResult("online");
                                        addLog("Connexion établie : Le terminal est synchronisé avec le serveur central de l'SOC.", "success");
                                      } else {
                                        setConnectionCheckResult("offline");
                                        addLog("Liaison SOC inactive ou configurée en local. Fonctionnement autonome.", "warn");
                                      }
                                    }, 1000);
                                  }}
                                  disabled={isCheckingConnection}
                                  className="w-full py-2 bg-gradient-to-r from-emerald-650 to-[#10B981] hover:from-emerald-700 hover:to-emerald-600 text-white font-sans text-[8.2px] font-extrabold uppercase tracking-widest rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-1 shadow-lg shadow-emerald-500/5 active:scale-95 disabled:opacity-80"
                                >
                                  {isCheckingConnection ? (
                                    <>
                                      <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                                      <span>Vérification en cours...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Radio className="w-3 h-3 text-white animate-pulse" />
                                      <span>Vérifier la Protection Active</span>
                                    </>
                                  )}
                                </button>

                                {connectionCheckResult === "online" && (
                                  <div className="bg-emerald-950/30 border border-emerald-500/20 p-2 rounded-xl text-[7.8px] text-emerald-300 flex items-start gap-1.5 animate-fade-in">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5 animate-bounce" />
                                    <p className="leading-snug">
                                      <strong>Liaison active !</strong> L&apos;appareil est correctement connecté en temps réel au serveur central de sécurité (SOC).
                                    </p>
                                  </div>
                                )}

                                {connectionCheckResult === "offline" && (
                                  <div className="bg-amber-950/30 border border-amber-500/20 p-2 rounded-xl text-[7.8px] text-amber-300 flex items-start gap-1.5 animate-fade-in">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                    <p className="leading-snug">
                                      <strong>Liaison locale active !</strong> Aucune liaison en ligne détectée. La base locale protège de façon autonome.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}



                          {/* Tab 3: Signaler */}
                          {phoneTab === "signaler" && (
                            <div className="space-y-2 flex-1 flex flex-col text-left">
                              <div className="pb-1 border-b border-white/5">
                                <h4 className="text-[10px] font-sans font-black text-slate-200 uppercase tracking-wide">Déclarer un incident</h4>
                                <p className="text-[7px] text-slate-400 font-sans">Moins d&apos;une minute pour signaler une arnaque</p>
                              </div>

                              {reportStatus === "success" ? (
                                <div className="flex-1 flex flex-col justify-center items-center text-center space-y-3 py-6 bg-slate-950/40 p-3 rounded-xl border border-white/5 animate-fade-in font-sans">
                                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <Check className="w-6 h-6 text-[#00C896]" />
                                  </div>
                                  <div className="space-y-1">
                                    <h5 className="text-[9.5px] font-bold text-slate-100">Transmis avec succès</h5>
                                    <p className="text-[8px] text-slate-300 leading-normal px-2">
                                      Votre déclaration a bien été reçue par le centre de sécurité central. Merci pour votre esprit citoyen !
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setReportStatus("idle");
                                      setReportTarget("");
                                      setReportDetails("");
                                    }}
                                    className="px-3 py-1 bg-slate-900 border border-white/5 hover:bg-slate-800 text-slate-200 text-[8px] font-bold uppercase rounded-lg cursor-pointer"
                                  >
                                    Nouveau signalement
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-2 flex-1 overflow-y-auto max-h-[310px] scrollbar-none">
                                  {/* Select Abuse Type */}
                                  <div className="space-y-1 font-sans">
                                    <label className="text-[7.5px] text-slate-400 block uppercase font-bold">Nature du contact suspect :</label>
                                    <select
                                      value={reportType}
                                      onChange={(e) => setReportType(e.target.value as any)}
                                      className="w-full bg-slate-900 border border-white/10 text-[8.5px] p-1.5 rounded text-white cursor-pointer font-sans"
                                    >
                                      <option value="appel">Appel vocal suspect (ex: faux agent)</option>
                                      <option value="sms">Message SMS suspect (ex: faux gain)</option>
                                      <option value="whatsapp">Message WhatsApp suspect</option>
                                      <option value="email">E-mail frauduleux</option>
                                      <option value="lien">Lien internet suspect</option>
                                      <option value="site">Faux site internet</option>
                                      <option value="compte">Faux compte ou profil</option>
                                      <option value="autre">Autre arnaque</option>
                                    </select>
                                  </div>

                                  {/* target phone or link */}
                                  <div className="space-y-1 font-sans">
                                    <label className="text-[7.5px] text-slate-400 block uppercase font-bold">Numéro ou adresse suspecte :</label>
                                    <input
                                      type="text"
                                      value={reportTarget}
                                      onChange={(e) => setReportTarget(e.target.value)}
                                      placeholder="Ex: +228 92 88 12 34 ou lien suspect"
                                      className="w-full bg-slate-900 border border-white/10 text-[9px] p-1.5 rounded text-white font-mono focus:outline-none focus:border-emerald-500"
                                    />
                                  </div>

                                  {/* description */}
                                  <div className="space-y-1 font-sans">
                                    <label className="text-[7.5px] text-slate-400 block uppercase font-bold">Détails (Que s&apos;est-il passé ?) :</label>
                                    <textarea
                                      rows={2}
                                      value={reportDetails}
                                      onChange={(e) => setReportDetails(e.target.value)}
                                      placeholder="Ex: Il m'a demandé de lui envoyer mon code secret Flooz..."
                                      className="w-full bg-slate-900 border border-white/10 text-[8.5px] p-1.5 rounded text-slate-200 resize-none leading-normal focus:outline-none focus:border-emerald-500"
                                    />
                                  </div>

                                  <button
                                    onClick={async () => {
                                      if (!reportTarget.trim()) return;
                                      setReportStatus("submitting");
                                      try {
                                        const response = await fetch("/api/complaints", {
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({
                                            phoneNumber: reportTarget,
                                            category: reportType === "appel" ? "Appel suspect" : reportType === "sms" ? "SMS suspect" : "Signalement citoyen",
                                            description: reportDetails,
                                            agentId: "CITIZEN_MOBILE",
                                            agentName: userName
                                          }),
                                          method: "POST"
                                        });
                                        if (response.ok) {
                                          setReportStatus("success");
                                          setLocalHistory(prev => [
                                            {
                                              id: `hist-${Date.now()}`,
                                              type: "signalement",
                                              title: `Signalement d'arnaque`,
                                              details: `${reportType.toUpperCase()} : ${reportTarget}`,
                                              time: "À l'instant",
                                              status: "transmis"
                                            },
                                            ...prev
                                          ]);
                                          addLog(`Signalement citoyen transmis : ${reportTarget}`, "success");
                                          onRefreshData?.();
                                        } else {
                                          setReportStatus("error");
                                        }
                                      } catch (e) {
                                        setReportStatus("error");
                                      }
                                    }}
                                    disabled={reportStatus === "submitting" || !reportTarget.trim()}
                                    className="w-full py-2 mt-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-sans text-[8.5px] font-extrabold uppercase tracking-wide rounded-lg cursor-pointer transition flex items-center justify-center gap-1 shadow-md shadow-red-500/10"
                                  >
                                    {reportStatus === "submitting" ? "Transmission..." : "Transmettre au SOC"}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Tab 4: Historique */}
                          {phoneTab === "historique" && (
                            <div className="space-y-2 flex-1 flex flex-col text-left">
                              <div className="pb-1 border-b border-white/5 flex justify-between items-center font-sans">
                                <div>
                                  <h4 className="text-[10px] font-sans font-black text-slate-200 uppercase tracking-wide">Journal de protection</h4>
                                  <p className="text-[7px] text-slate-400 font-sans">Historique des analyses et blocages</p>
                                </div>
                                <button
                                  onClick={() => {
                                    setLocalHistory([]);
                                    addLog("Historique de l'application vidé.", "info");
                                  }}
                                  className="text-[7px] text-slate-500 hover:text-slate-300 uppercase font-bold cursor-pointer"
                                >
                                  Effacer
                                </button>
                              </div>

                              <div className="flex-1 overflow-y-auto max-h-[305px] scrollbar-none space-y-1.5 pr-0.5">
                                {localHistory.length === 0 ? (
                                  <div className="text-center py-10 text-slate-500 text-[8px] font-sans">
                                    Aucune action récente enregistrée. Votre historique est vide.
                                  </div>
                                ) : (
                                  localHistory.map((hist) => (
                                    <div key={hist.id} className="bg-slate-950/40 border border-white/5 p-2 rounded-xl text-[8.2px] leading-snug flex items-start gap-2">
                                      <div className="shrink-0 mt-0.5">
                                        {hist.status === "danger" && <ShieldAlert className="w-3.5 h-3.5 text-red-400 animate-pulse" />}
                                        {hist.status === "sûr" && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                                        {hist.status === "transmis" && <FileText className="w-3.5 h-3.5 text-blue-400" />}
                                      </div>
                                      <div className="flex-1 min-w-0 font-sans">
                                        <div className="flex items-center justify-between text-[7px] font-mono text-slate-500">
                                          <span className="uppercase tracking-wide font-bold">{hist.type}</span>
                                          <span>{hist.time}</span>
                                        </div>
                                        <h5 className="font-bold text-slate-200 truncate mt-0.5">{hist.title}</h5>
                                        <p className="text-slate-400 truncate mt-0.5">{hist.details}</p>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}

                          {/* Tab 5: Profil */}
                          {phoneTab === "profil" && (
                            <div className="space-y-2 flex-1 flex flex-col text-left">
                              <div className="pb-1 border-b border-white/5">
                                <h4 className="text-[10px] font-sans font-black text-slate-200 uppercase tracking-wide">Paramètres de liaison</h4>
                                <p className="text-[7px] text-slate-400 font-sans">Liaison de souveraineté avec le serveur central SOC</p>
                              </div>

                              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[305px] scrollbar-none">
                                {/* Configuration Card matching the user's uploaded layout */}
                                <div className="bg-[#0b1329]/80 border border-blue-500/10 p-3 rounded-2xl space-y-2.5 shadow-xl relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl pointer-events-none"></div>
                                  
                                  <h5 className="text-[9.5px] font-sans font-extrabold text-slate-150 flex items-center gap-1.5 uppercase tracking-wider">
                                    ⚙️ CONFIGURATION DU SERVEUR SOC
                                  </h5>

                                  <div className="space-y-1">
                                    <label className="text-[7.5px] text-slate-400 font-sans block leading-none font-semibold uppercase">
                                      Adresse URL de connexion au SOC national :
                                    </label>
                                    <input
                                      type="text"
                                      value={serverAddress}
                                      onChange={(e) => setServerAddress(e.target.value)}
                                      placeholder="https://sp-sentinel-hq.onrender.com"
                                      className="w-full bg-[#030712]/90 border border-white/10 text-[8.5px] px-2.5 py-1.5 rounded-lg text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                  </div>

                                  {/* PROD LIGNE & TEST LOCAL toggles */}
                                  <div className="grid grid-cols-2 gap-1.5">
                                    <button
                                      onClick={() => {
                                        setIsOnlineMode(true);
                                        setServerAddress("https://sp-sentinel-hq.onrender.com");
                                        addLog("Liaison rétablie en PRODUCTION LIGNE avec le SOC central.", "success");
                                      }}
                                      className={`py-1.5 rounded-lg text-[8px] font-extrabold uppercase font-sans tracking-wide cursor-pointer transition-all border ${
                                        isOnlineMode 
                                          ? "bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-[0_0_10px_rgba(16,185,129,0.25)]" 
                                          : "bg-[#030712]/50 border-white/5 text-slate-450 hover:text-slate-300"
                                      }`}
                                    >
                                      PROD LIGNE
                                    </button>
                                    <button
                                      onClick={() => {
                                        setIsOnlineMode(false);
                                        addLog("Liaison commutée sur TEST LOCAL autonome.", "warn");
                                      }}
                                      className={`py-1.5 rounded-lg text-[8px] font-extrabold uppercase font-sans tracking-wide cursor-pointer transition-all border ${
                                        !isOnlineMode 
                                          ? "bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-[0_0_10px_rgba(16,185,129,0.25)]" 
                                          : "bg-[#030712]/50 border-white/5 text-slate-450 hover:text-slate-300"
                                      }`}
                                    >
                                      TEST LOCAL
                                    </button>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="space-y-1.5 pt-1">
                                    <button
                                      onClick={() => {
                                        addLog(`Adresse URL sauvegardée : ${serverAddress}`, "success");
                                      }}
                                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[8px] rounded-lg uppercase tracking-wider transition-colors shadow-md shadow-blue-950/50 cursor-pointer text-center"
                                    >
                                      SAUVEGARDER L&apos;ADRESSE
                                    </button>

                                    <button
                                      onClick={() => {
                                        setIsEditingUser(!isEditingUser);
                                      }}
                                      className="w-full py-1.5 bg-slate-900 hover:bg-slate-850 border border-white/10 text-slate-300 font-extrabold text-[8px] rounded-lg uppercase tracking-wider transition-colors cursor-pointer text-center"
                                    >
                                      👤 RE-MODIFIER L&apos;ENRÔLEMENT DE L&apos;AGENT
                                    </button>
                                  </div>

                                  {/* Enrollment edit form */}
                                  {isEditingUser && (
                                    <div className="pt-2 border-t border-white/5 space-y-1.5 animate-fade-in">
                                      <label className="text-[7.5px] text-slate-400 font-sans block leading-none font-semibold uppercase">
                                        Identité de l&apos;Agent :
                                      </label>
                                      <div className="flex gap-1">
                                        <input
                                          type="text"
                                          value={userName}
                                          onChange={(e) => setUserName(e.target.value)}
                                          className="bg-[#030712]/90 border border-white/15 text-[8.5px] px-2 py-1 rounded text-white font-mono flex-1 focus:outline-none focus:border-emerald-500"
                                        />
                                        <button
                                          onClick={() => {
                                            setIsEditingUser(false);
                                            addLog(`Identité d'agent configurée : ${userName}`, "success");
                                          }}
                                          className="bg-emerald-600 hover:bg-emerald-500 px-2.5 text-[8px] rounded text-white font-black uppercase cursor-pointer transition-colors"
                                        >
                                          Valider
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Reassurance and meta */}
                                <div className="space-y-1 py-1 font-sans">
                                  <div className="text-[7.5px] text-emerald-400 flex items-center gap-1 justify-center">
                                    <Check className="w-3 h-3 text-[#00C896] shrink-0" />
                                    <span>Fonctionne en toute sécurité sans consommer votre connexion internet.</span>
                                  </div>
                                  <div className="text-[7px] text-slate-500 text-center">
                                    Dernière mise à jour : 23/06/2026 16:20:37
                                  </div>
                                  <div className="text-[6.5px] text-slate-600 tracking-widest text-center uppercase font-mono pt-1">
                                    🛡️ SP_TG SENTINEL CODES
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                        </div>

                        {/* HIGH QUALITY BOTTOM NAVIGATION BAR */}
                        <div className="grid grid-cols-4 border-t border-white/5 bg-[#030712]/95 pt-1 pb-0.5 -mx-2.5 -mb-2.5 rounded-b-[38px] relative z-20 shrink-0 select-none">
                          <button
                            onClick={() => { setPhoneTab("accueil"); setPhoneState("dashboard"); }}
                            className={`flex flex-col items-center justify-center py-1 transition-colors duration-200 cursor-pointer ${phoneTab === "accueil" ? "text-emerald-400" : "text-slate-500 hover:text-slate-350"}`}
                          >
                            <Shield className="w-3.5 h-3.5" />
                            <span className="text-[7px] font-sans font-semibold mt-0.5 tracking-tighter">Accueil</span>
                          </button>

                          <button
                            onClick={() => { setPhoneTab("signaler"); setPhoneState("dashboard"); }}
                            className={`flex flex-col items-center justify-center py-1 transition-colors duration-200 cursor-pointer ${phoneTab === "signaler" ? "text-emerald-400" : "text-slate-500 hover:text-slate-350"}`}
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span className="text-[7px] font-sans font-semibold mt-0.5 tracking-tighter">Signaler</span>
                          </button>

                          <button
                            onClick={() => { setPhoneTab("historique"); setPhoneState("dashboard"); }}
                            className={`flex flex-col items-center justify-center py-1 transition-colors duration-200 cursor-pointer ${phoneTab === "historique" ? "text-emerald-400" : "text-slate-500 hover:text-slate-350"}`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-[7px] font-sans font-semibold mt-0.5 tracking-tighter">Historique</span>
                          </button>

                          <button
                            onClick={() => { setPhoneTab("profil"); setPhoneState("dashboard"); }}
                            className={`flex flex-col items-center justify-center py-1 transition-colors duration-200 cursor-pointer ${phoneTab === "profil" ? "text-emerald-400" : "text-slate-500 hover:text-slate-350"}`}
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span className="text-[7px] font-sans font-semibold mt-0.5 tracking-tighter">Paramètres</span>
                          </button>
                        </div>

                      </div>
                    )}

                  </>
                )}

                {/* Simulated physical Android Home / back button row */}
                <div className="h-6 w-full flex items-center justify-center gap-6 mt-4 pt-1.5 border-t border-white/5 bg-black/40 text-slate-600">
                  <span className="w-2.5 h-2.5 border border-slate-700 rounded-sm cursor-pointer rotate-45 hover:border-[#38BDF8]"></span>
                  <span className="w-2.5 h-2.5 border border-slate-700 rounded-full cursor-pointer hover:border-[#38BDF8]" onClick={() => setPhoneState("dashboard")}></span>
                  <span className="w-3 h-2 border border-slate-700 rounded-lg cursor-pointer hover:border-[#38BDF8]"></span>
                </div>

              </div>
            </div>

            {/* CONTROL PANEL FOR JURY AND DEVELOPER DEMONSTRATION */}
            <div className="w-[290px] bg-[#121A2F]/80 border border-white/5 rounded-2xl p-4 space-y-3 shadow-md font-mono text-xs shrink-0">
              <div className="flex items-center justify-center gap-1.5 border-b border-white/5 pb-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#10B981]" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider block text-center">
                  Simulateur d&apos;instructions
                </span>
              </div>

              {/* État du téléphone (Allumé/Éteint) selector */}
              <div className="space-y-1 bg-[#050B1D]/50 p-2 border border-white/5 rounded-xl">
                <label className="text-[8px] text-[#10B981] block uppercase font-bold tracking-wider mb-1.5">Statut initial du Téléphone :</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setPhoneLocked(false);
                      setShowInAppOverlayAlert(false);
                      setShowNotification(false);
                      setPhoneState("dashboard");
                      addLog("Téléphone configuré : Écran allumé & actif.", "info");
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[8px] border font-bold font-mono transition duration-200 cursor-pointer text-center select-none ${!phoneLocked ? "bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40" : "bg-transparent text-slate-500 border-white/5 hover:text-slate-350"}`}
                  >
                    ÉCRAN ALLUMÉ
                  </button>
                  <button
                    onClick={() => {
                      setPhoneLocked(true);
                      setShowInAppOverlayAlert(false);
                      setShowNotification(false);
                      setPhoneState("dashboard");
                      addLog("Téléphone configuré : Écran verrouillé (veille).", "info");
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[8px] border font-bold font-mono transition duration-200 cursor-pointer text-center select-none ${phoneLocked ? "bg-slate-800/50 text-slate-200 border-slate-600/50" : "bg-transparent text-slate-500 border-white/5 hover:text-slate-350"}`}
                  >
                    ÉCRAN VERROUILLÉ
                  </button>
                </div>
              </div>

              {/* PICKER BETWEEN SMS, CALLSIM, & CITIZEN DECLARATION */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-[#050B1D] border border-white/5 rounded-xl">
                <button
                  onClick={() => setSimMode("sms")}
                  className={`py-1 rounded-lg text-[8px] font-bold transition flex items-center justify-center gap-1 cursor-pointer select-none ${simMode === "sms" ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40" : "text-slate-400 hover:text-white bg-transparent border-0"}`}
                >
                  SMS / WA
                </button>
                <button
                  onClick={() => setSimMode("call")}
                  className={`py-1 rounded-lg text-[8px] font-bold transition flex items-center justify-center gap-1 cursor-pointer select-none ${simMode === "call" ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40" : "text-slate-400 hover:text-white bg-transparent border-0"}`}
                >
                  APPEL
                </button>
                <button
                  onClick={() => {
                    setSimMode("declaration");
                    setPhoneState("declarations");
                    setDeclarationStatusMsg("");
                  }}
                  className={`py-1 rounded-lg text-[8px] font-bold transition flex items-center justify-center gap-1 cursor-pointer select-none ${simMode === "declaration" ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40" : "text-slate-400 hover:text-white bg-transparent border-0"}`}
                >
                  SIGNALEMENT
                </button>
              </div>

              {simMode === "sms" && (
                <div className="space-y-3 animate-fade-in text-left">
                  {/* Provenance du message / Source selection */}
                  <div className="space-y-1">
                    <label className="text-[9px] text-[#10B981] block uppercase font-bold tracking-wider">Qui envoie le message ?</label>
                    <select
                      value={messageSourceType}
                      onChange={(e) => {
                        const val = e.target.value as "unknown" | "contact" | "group";
                        setMessageSourceType(val);
                        if (val === "contact") {
                          // Automatically update customSender with contact's phone
                          setCustomSender(registeredContacts[contactIndex].phone);
                        } else if (val === "unknown") {
                          setCustomSender("+228 99 12 04 85");
                        }
                      }}
                      className="w-full bg-[#0B1020] border border-[#10B981]/20 text-[10px] p-1.5 rounded focus:outline-none text-emerald-350 font-bold cursor-pointer text-white"
                    >
                      <option value="unknown" className="bg-[#0B1020]">Numéro inconnu (Non enregistré)</option>
                      <option value="contact" className="bg-[#0B1020]">Contact enregistré (Répertoire)</option>
                      <option value="group" className="bg-[#0B1020]">Message de groupe (WhatsApp)</option>
                    </select>
                  </div>

                  {/* Conditional Contact selection */}
                  {messageSourceType === "contact" && (
                    <div className="space-y-1 bg-slate-950/40 p-2 border border-white/5 rounded animate-fade-in">
                      <label className="text-[8.5px] text-slate-300 block uppercase font-bold">Choisir le contact :</label>
                      <select
                        value={contactIndex}
                        onChange={(e) => {
                          const idx = parseInt(e.target.value, 10);
                          setContactIndex(idx);
                          setCustomSender(registeredContacts[idx].phone);
                        }}
                        className="w-full bg-[#0B1020] border border-white/10 text-[10px] p-1 rounded text-white cursor-pointer"
                      >
                        {registeredContacts.map((c, i) => (
                          <option key={i} value={i}>{c.name} ({c.phone})</option>
                        ))}
                      </select>
                      <span className="text-[7.5px] text-slate-450 leading-normal block pt-1">
                        Info : Vos contacts enregistrés sont réputés sûrs par défaut. L&apos;analyse d&apos;ingénierie sociale (NLP) y est suspendue pour écarter les faux-positifs. Seul un piratage avéré (détecté par la base de signatures de Lomé) déclenchera l&apos;alerte.
                      </span>
                    </div>
                  )}

                  {/* Conditional Group Name input */}
                  {messageSourceType === "group" && (
                    <div className="space-y-1 bg-slate-950/40 p-2 border border-white/5 rounded animate-fade-in font-mono">
                      <label className="text-[8.5px] text-slate-300 block uppercase font-bold font-mono">Nom du groupe :</label>
                      <input
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="w-full bg-[#0B1020] border border-white/10 text-[10px] p-1.5 rounded text-white font-mono"
                      />
                      {trustedGroups.includes(groupName) ? (
                        <span className="text-[7.8px] text-emerald-400 font-bold block pt-1">
                          Approuvé : Ce groupe figure dans votre LISTE VERTE. Les alertes de détection de manipulation en direct y sont désactivées.
                        </span>
                      ) : (
                        <span className="text-[7.5px] text-slate-400 block pt-1 font-sans">
                          Info : Groupe absent de votre Liste Verte. Vos défenses analyseront d&apos;éventuelles techniques de manipulation en direct pour vous alerter.
                        </span>
                      )}
                    </div>
                  )}

                  {/* Template dropdown list */}
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 block uppercase">Choisir un SMS / Message type :</label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(parseInt(e.target.value, 10))}
                      className="w-full bg-[#0B1020] border border-white/10 text-[10px] p-1.5 rounded focus:outline-none text-slate-300 cursor-pointer text-[9.5px]"
                    >
                      <option value={-1}>Saisie personnalisée (Écrire vous-même)</option>
                      {simTemplates.map((tpl, i) => (
                        <option key={i} value={i}>
                          {tpl.title} {tpl.isSignature ? "• [Inscrit en base]" : "• [Hors base - NLP]"}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Custom sender number */}
                  <div className="grid grid-cols-1 gap-1.5">
                    {messageSourceType !== "contact" && (
                      <div>
                        <label className="text-[9px] text-slate-450 block uppercase">Numéro de l&apos;expéditeur :</label>
                        <input
                          type="text"
                          value={customSender}
                          onChange={(e) => {
                            setCustomSender(e.target.value);
                            setSelectedTemplate(-1);
                          }}
                          placeholder="+228..."
                          className="w-full bg-[#0B1020] border border-white/10 text-[10px] p-1 rounded font-mono text-white text-[9.5px]"
                        />
                      </div>
                    )}
                    
                    {/* Custom text body */}
                    <div>
                      <label className="text-[9px] text-slate-450 block uppercase">Texte du message à tester :</label>
                      <textarea
                        value={customText}
                        onChange={(e) => {
                          setCustomText(e.target.value);
                          setSelectedTemplate(-1);
                        }}
                        rows={3}
                        placeholder="Contenu du SMS à intercepter..."
                        className="w-full bg-[#0B1020] border border-white/10 text-[10px] p-1.5 rounded resize-none text-slate-200"
                      />
                      {containsKnownSignature && (
                        <div className="text-[8px] text-emerald-400 font-bold font-mono mt-1 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0"></span>
                          Signature connue détectée dans le registre central de Lomé.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ACTION TRIGGER BUTTON */}
                  <button
                    onClick={handleSimulateSMS}
                    disabled={!customText.trim()}
                    className="w-full py-2.5 bg-[#10B981] hover:bg-[#10B981]/90 disabled:bg-slate-800 disabled:text-slate-500 font-mono text-[9px] font-bold text-black rounded-xl uppercase transition tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-[98%]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Simuler l&apos;envoi du message
                  </button>

                  <div className="bg-slate-950/40 border border-white/5 p-2 rounded text-[8.5px] text-slate-400 leading-normal">
                    <span className="font-bold text-slate-200 block mb-1">Comportement de l&apos;interception :</span>
                    <ul className="text-left list-disc list-inside space-y-1 text-slate-400 font-sans">
                      <li><strong>Écran allumé :</strong> L&apos;alerte détaillée s&apos;ouvre immédiatement en plein écran pour faire barrière à l&apos;arnaque.</li>
                      <li><strong>Écran verrouillé :</strong> L&apos;interception attend le déverrouillage de l&apos;appareil pour surgir et sécuriser l&apos;utilisateur.</li>
                    </ul>
                  </div>
                </div>
              )}

              {simMode === "call" && (
                <div className="space-y-3 animate-fade-in text-left">
                  <div className="space-y-1">
                    <label className="text-[9px] text-[#10B981] block uppercase font-bold tracking-wider">
                      Numéro ou Nom de l&apos;Appelant :
                    </label>
                    <input
                      type="text"
                      value={incomingCallNumber}
                      onChange={(e) => setIncomingCallNumber(e.target.value)}
                      placeholder="Ex: +228 92 88 12 34 ou ORabank"
                      className="w-full bg-[#0B1020] border border-white/10 text-[10px] p-2 rounded font-mono text-white text-[10px]"
                    />
                    <div className="flex flex-wrap gap-1 mt-1 font-mono">
                      <button
                        onClick={() => setIncomingCallNumber("ORabank")}
                        className="p-1 px-1.5 bg-[#121A2F] border border-white/5 rounded text-[8px] text-slate-300 hover:text-white cursor-pointer font-sans"
                      >
                        ORabank (Service spécial)
                      </button>
                      <button
                        onClick={() => {
                          const scamNum = scams.length > 0 ? scams[0].phoneNumber : "+228 92 88 12 34";
                          setIncomingCallNumber(scamNum);
                        }}
                        className="p-1 px-1.5 bg-[#121A2F] border border-white/5 rounded text-[8px] text-emerald-400 hover:text-emerald-350 cursor-pointer font-sans"
                      >
                        Spammer (Liste Noire SOC)
                      </button>
                      <button
                        onClick={() => setIncomingCallNumber("+228 97 55 11 22")}
                        className="p-1 px-1.5 bg-[#121A2F] border border-white/5 rounded text-[8px] text-slate-300 hover:text-white cursor-pointer font-sans"
                      >
                        Inconnu standard
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-950/40 border border-white/5 p-2 rounded-xl text-[8.5px] leading-tight space-y-1.5 font-sans">
                    <span className="text-[7.8px] font-mono text-[#10B981] block uppercase font-bold">
                      Règles d&apos;évaluation de l&apos;appel :
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-slate-350">
                      <li>
                        <strong>Chaîne alphabétique (ex: ORabank) :</strong> Traité d&apos;office comme canal institutionnel légitime. Pas d&apos;alerte de fraude.
                      </li>
                      <li>
                        <strong>Présence en Liste Noire :</strong> Détection immédiate avec alerte rouge de blocage.
                      </li>
                      <li>
                        <strong>Numéro non répertorié :</strong> Appel normal acheminé sans perturbation.
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      // Check if the number is in scams database
                      const cleanPhone = incomingCallNumber.trim().replace(/\s+/g, "");
                      const isListed = scams.some(s => s.phoneNumber.trim().replace(/\s+/g, "") === cleanPhone);
                      
                      setIsCallScam(isListed);

                      // Check if alphabetical string
                      const isAlphabeticalOnly = /^[a-zA-Z\s]+$/.test(incomingCallNumber.trim());
                      if (isAlphabeticalOnly) {
                        setCallerName(incomingCallNumber);
                      } else {
                        // Check if in registered contacts list
                        const matchedContact = registeredContacts.find(rc => rc.phone.trim().replace(/\s+/g, "") === cleanPhone);
                        if (matchedContact) {
                          setCallerName(matchedContact.name);
                        } else {
                          setCallerName("Inconnu");
                        }
                      }

                      setVoiceCallState("incoming");
                      addLog(`Appel simulé de : ${incomingCallNumber} (${isAlphabeticalOnly ? "Service" : isListed ? "Escroc identifié" : "Normal"})`, isListed ? "warn" : "info");
                    }}
                    className="w-full py-2.5 bg-[#10B981] hover:bg-[#10B981]/90 font-mono text-[9px] font-bold text-black rounded-xl uppercase transition tracking-wider flex items-center justify-center gap-1 cursor-pointer shadow-lg active:scale-[98%]"
                  >
                    Simuler l&apos;appel entrant
                  </button>
                </div>
              )}

              {simMode === "declaration" && (
                <div className="space-y-3 animate-fade-in text-left">
                  <div className="bg-slate-950/40 border border-white/5 p-2.5 rounded-xl">
                    <span className="text-[10px] font-bold text-emerald-400 font-mono block uppercase">
                      Sécurité Citoyenne : Signaler un abus
                    </span>
                    <p className="text-[9px] text-slate-300 leading-normal mt-1">
                      Signalez un appel suspect pour enrichir en temps réel la base de signatures de Lomé Sûre.
                    </p>
                  </div>

                  <div className="space-y-2 bg-[#050B1D]/50 border border-white/5 p-3 rounded-xl">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 block uppercase font-bold">
                        Numéro suspect :
                      </label>
                      <input
                        type="text"
                        value={declaringPhone}
                        onChange={(e) => {
                          setDeclaringPhone(e.target.value);
                          setPhoneState("declarations");
                        }}
                        placeholder="Ex: +228 92 88 12 34"
                        className="w-full bg-[#0B1020] border border-white/10 text-[10px] p-2 rounded font-mono text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 block uppercase font-bold">
                        Type d&apos;arnaque :
                      </label>
                      <select
                        value={declaringCategory}
                        onChange={(e) => {
                          setDeclaringCategory(e.target.value);
                          setPhoneState("declarations");
                        }}
                        className="w-full bg-[#0B1020] border border-white/10 text-[10px] p-1.5 rounded focus:outline-none text-slate-300 cursor-pointer text-white"
                      >
                        <option value="Vente pyramidale / Faux gains">Faux gains / Loteries / Cadeaux</option>
                        <option value="Faux agents Moov / Togocom (Secours)">Faux agents (Tmoney ou Flooz)</option>
                        <option value="Chantage au téléphone / Menaces">Chantage, pressions ou menaces</option>
                        <option value="Harcèlement / Intrusions répétées">Harcèlement d&apos;appels</option>
                        <option value="Faux Positif (Testez la réputation)">Test de réputation ou erreur</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-450 block uppercase font-bold">
                        Description / Preuves de l&apos;appel :
                      </label>
                      <textarea
                        value={declaringDesc}
                        onChange={(e) => {
                          setDeclaringDesc(e.target.value);
                          setPhoneState("declarations");
                        }}
                        rows={3}
                        placeholder="Qu'est-ce que l'appelant vous a demandé ?"
                        className="w-full bg-[#0B1020] border border-white/10 text-[10px] p-2 rounded text-slate-200 resize-none leading-normal focus:outline-none focus:border-[#10B981]"
                      />
                    </div>

                    {declarationStatusMsg && (
                      <div className="text-[8.5px] font-mono p-2 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 leading-tight">
                        {declarationStatusMsg}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={isSubmittingDeclaration || !declaringPhone.trim()}
                      onClick={async () => {
                        setIsSubmittingDeclaration(true);
                        try {
                          const response = await fetch("/api/complaints", {
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              phoneNumber: declaringPhone,
                              category: declaringCategory,
                              description: declaringDesc,
                              agentId: agents[0]?.id || "UNKNOWN_AGENT",
                              agentName: agents[0]?.name || "Citoyen Volontaire"
                            }),
                            method: "POST"
                          });
                          if (response.ok) {
                            setDeclarationStatusMsg("Transmis. Traitement en cours par le SOC.");
                            setDeclaringPhone("+228 99 ");
                            setDeclaringDesc("");
                            onRefreshData?.();
                          } else {
                            setDeclarationStatusMsg("Erreur lors de la transmission.");
                          }
                        } catch (e) {
                          setDeclarationStatusMsg("Erreur de communication réseau.");
                        } finally {
                          setIsSubmittingDeclaration(false);
                        }
                      }}
                      className="w-full py-2 bg-[#10B981] hover:bg-[#10B981]/95 disabled:bg-slate-800 disabled:text-slate-500 font-mono text-[9px] font-bold text-black rounded-xl uppercase transition tracking-wider flex items-center justify-center gap-1 cursor-pointer shadow-lg"
                    >
                      {isSubmittingDeclaration ? "Envoi en cours..." : "Soumettre le signalement"}
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
