import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, 
  FileText, 
  Phone, 
  Search, 
  Gavel, 
  FileSignature, 
  Download, 
  Cpu, 
  RefreshCw,
  Database,
  AlertOctagon,
  Link as LinkIcon,
  Check,
  Smartphone,
  ShieldAlert,
  Radio,
  X,
  Eye
} from "lucide-react";
import { Threat, Campaign, MobileAgent, ForensicsData, MobileSignal, PhoneComplaint, ScamPhoneNumber } from "../types";

interface ForensicsTabProps {
  forensicsData: ForensicsData | null;
  threats: Threat[];
  campaigns: Campaign[];
  agents: MobileAgent[];
  mobileSignals: MobileSignal[];
  complaints?: PhoneComplaint[];
  scams?: ScamPhoneNumber[];
  onRefreshData?: () => void;
}

interface GroupedDossier {
  key: string;            // The grouping value (e.g. phone number or link)
  type: "phone" | "link" | "email" | "text_pattern";
  signals: MobileSignal[];
  status: "pending_alerts" | "false_positive" | "closed_added";
  redundantCount: number;
}

export default function ForensicsTab({
  forensicsData,
  threats,
  campaigns,
  agents,
  mobileSignals,
  complaints = [],
  scams = [],
  onRefreshData
}: ForensicsTabProps) {
  
  const [activeSubTab, setActiveSubTab] = useState<"history" | "correlation" | "complaints">("history");
  
  // Complaints and scams management states
  const [complaintSearchQuery, setComplaintSearchQuery] = useState("");
  const [complaintFilter, setComplaintFilter] = useState<"all" | "pending" | "confirmed_scam" | "dismissed">("all");
  const [sensitizingNumber, setSensitizingNumber] = useState<string | null>(null);
  const [sensitizationLogsArr, setSensitizationLogsArr] = useState<string[]>([]);
  const [isSensitizationRunning, setIsSensitizationRunning] = useState(false);

  const handleConfirmComplaint = async (id: string) => {
    try {
      const res = await fetch(`/api/complaints/${id}/confirm`, { method: "POST" });
      if (res.ok) {
        onRefreshData?.();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDismissComplaint = async (id: string) => {
    try {
      const res = await fetch(`/api/complaints/${id}/dismiss`, { method: "POST" });
      if (res.ok) {
        onRefreshData?.();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteComplaint = async (id: string) => {
    if (!window.confirm("Supprimer définitivement ce signalement ?")) return;
    try {
      const res = await fetch(`/api/complaints/${id}`, { method: "DELETE" });
      if (res.ok) {
        onRefreshData?.();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerMassSensitization = (phone: string) => {
    setSensitizingNumber(phone);
  };

  const handleExecuteMassSensitization = () => {
    if (!sensitizingNumber) return;
    setIsSensitizationRunning(true);
    setTimeout(() => {
      const formattedLog = `${new Date().toLocaleTimeString("fr-FR")} - [ALERTE NATIONALE] SMS d'alerte et de sensibilisation de masse envoyé pour le suspect ${sensitizingNumber} à l'ensemble du réseau Moov / Togocom avec succès.`;
      setSensitizationLogsArr(prev => [formattedLog, ...prev]);
      alert(`Sensibilisation de masse activée avec succès contre le numéro ${sensitizingNumber} !`);
      setIsSensitizationRunning(false);
      setSensitizingNumber(null);
    }, 1500);
  };
  
  const [redundancyThreshold, setRedundancyThreshold] = useState<number>(() => {
    const saved = localStorage.getItem("kelashield_redundancy_threshold");
    return saved ? parseInt(saved, 10) : 5;
  });

  useEffect(() => {
    localStorage.setItem("kelashield_redundancy_threshold", redundancyThreshold.toString());
  }, [redundancyThreshold]);

  // Active filters and selectors for correlations
  const [groupingKey, setGroupingKey] = useState<"phone" | "link" | "email" | "text_pattern">("phone");
  const [selectedDossier, setSelectedDossier] = useState<GroupedDossier | null>(null);
  
  // Selected alert state inside the raw chronological list (triggers a dedicated modal)
  const [selectedHistoryAlert, setSelectedHistoryAlert] = useState<MobileSignal | null>(null);
  
  // State for the sub-alert being focused inside the active Correlation dossier modal
  const [activeSignalId, setActiveSignalId] = useState<string | null>(null);
  
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  
  // Persistent tracking for statuses of individual history alerts
  const [signalStatuses, setSignalStatuses] = useState<Record<string, "pending" | "false_positive" | "approved">>(() => {
    try {
      const saved = localStorage.getItem("kelashield_signal_statuses");
      return saved ? JSON.parse(saved) : {};
    } catch (_) {
      return {};
    }
  });

  // Persistent tracking for statuses of grouped correlation dossiers
  const [dossierStatuses, setDossierStatuses] = useState<Record<string, "pending_alerts" | "false_positive" | "closed_added">>(() => {
    try {
      const saved = localStorage.getItem("kelashield_dossier_statuses");
      return saved ? JSON.parse(saved) : {};
    } catch (_) {
      return {};
    }
  });

  const updateDossierStatus = (keyStr: string, status: "pending_alerts" | "false_positive" | "closed_added") => {
    const next = { ...dossierStatuses, [keyStr]: status };
    setDossierStatuses(next);
    localStorage.setItem("kelashield_dossier_statuses", JSON.stringify(next));
    if (selectedDossier && selectedDossier.key === keyStr) {
      setSelectedDossier(prev => prev ? { ...prev, status } : null);
    }
  };

  const updateSignalStatus = (sigId: string, status: "pending" | "false_positive" | "approved") => {
    const next = { ...signalStatuses, [sigId]: status };
    setSignalStatuses(next);
    localStorage.setItem("kelashield_signal_statuses", JSON.stringify(next));
    if (selectedHistoryAlert && selectedHistoryAlert.id === sigId) {
      setSelectedHistoryAlert(prev => prev ? { ...prev, status } : null);
    }
  };

  const [allSignals, setAllSignals] = useState<MobileSignal[]>([]);
  const [showHistoryReport, setShowHistoryReport] = useState(false);
  const [showDossierReport, setShowDossierReport] = useState(false);

  useEffect(() => {
    const baseSignals = [...mobileSignals];
    baseSignals.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setAllSignals(baseSignals);
  }, [mobileSignals]);

  // Report variables for correlation dossiers
  const [reportText, setReportText] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [addSuccessMessage, setAddSuccessMessage] = useState("");
  const [isAddingSignature, setIsAddingSignature] = useState(false);
  
  // Report variables for history individual alerts
  const [historyReportText, setHistoryReportText] = useState("");
  const [historyReportTitle, setHistoryReportTitle] = useState("");
  const [historyAddStatus, setHistoryAddStatus] = useState("");
  const [isAddingHistorySignature, setIsAddingHistorySignature] = useState(false);

  // Correlation calculator grouping engine
  const computeGroupedDossiers = (): GroupedDossier[] => {
    const groups: Record<string, MobileSignal[]> = {};
    const groupType: Record<string, "phone" | "link" | "email" | "text_pattern"> = {};

    allSignals.forEach(sig => {
      let keyStr = "";
      
      if (groupingKey === "phone") {
        keyStr = sig.senderPhone.trim();
        groupType[keyStr] = "phone";
      } 
      else if (groupingKey === "link") {
        const match = sig.evidenceText.match(/(https?:\/\/[^\s\n\r"']+)/i);
        keyStr = match ? match[1].split('?')[0].trim() : "";
        if (!keyStr) {
          const dbMatch = sig.evidenceText.match(/([a-zA-Z0-9-]+\.(?:com|org|net|tg|info))/i);
          keyStr = dbMatch ? dbMatch[1].trim() : "Aucun lien de phishing";
        }
        groupType[keyStr] = "link";
      } 
      else if (groupingKey === "email") {
        const match = sig.evidenceText.match(/([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})/i);
        keyStr = match ? match[1].trim() : "Aucun e-mail détecté";
        groupType[keyStr] = "email";
      } 
      else if (groupingKey === "text_pattern") {
        const txt = sig.evidenceText.toLowerCase();
        if (txt.includes("ceet") || txt.includes("électricité") || txt.includes("compteur")) {
          keyStr = "Gabarit CEET (Urgence Compteur)";
        } else if (txt.includes("moov") || txt.includes("lotto") || txt.includes("gagné") || txt.includes("virement")) {
          keyStr = "Gabarit Moov (Faux Gain/Loto)";
        } else if (txt.includes("tmoney") || txt.includes("togocom") || txt.includes("suspension") || txt.includes("solde")) {
          keyStr = "Gabarit Togocom/TMoney (Suspension de compte)";
        } else if (txt.includes("recrutement") || txt.includes("postulez") || txt.includes("embauche")) {
          keyStr = "Gabarit Recrutement (Fraude administrative)";
        } else {
          keyStr = "Textes sémantiques divers";
        }
        groupType[keyStr] = "text_pattern";
      }

      if (keyStr) {
        if (!groups[keyStr]) groups[keyStr] = [];
        groups[keyStr].push(sig);
      }
    });

    const parsed: GroupedDossier[] = Object.keys(groups).map(key => {
      const type = groupType[key];
      const status = dossierStatuses[key] || "pending_alerts";
      return {
        key,
        type,
        signals: groups[key],
        status,
        redundantCount: groups[key].length
      };
    });

    return parsed.sort((a, b) => b.signals.length - a.signals.length);
  };

  const groupedDossiers = computeGroupedDossiers();

  const handleGroupingKeyChange = (key: "phone" | "link" | "email" | "text_pattern") => {
    setGroupingKey(key);
  };

  // Helper to open a selected Correlation folder/dossier in a modal workspace
  const openDossierModal = (dossier: GroupedDossier) => {
    setSelectedDossier(dossier);
    setActiveSignalId(dossier.signals[0]?.id || null);
    
    const today = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
    const operator = dossier.key.startsWith("+228 90") || dossier.key.startsWith("+228 91") || dossier.key.startsWith("+228 92") || dossier.key.startsWith("+228 70")
      ? "TOGOCOM"
      : dossier.key.startsWith("+228 99") ? "MOOV AFRICA TOGO" : "MUTULÉ / TRANS-RESEAUX";

    const report = `===========================================================
RAPPORT EXCLUSIF DE CYBER INVESTIGATION JUDICIAIRE (ANCY TOGO)
RÉFÉRENCE DOSSIER : ANCY-DOS-${dossier.type.toUpperCase()}-${Math.floor(100+Math.random()*900)}
DATE : Lomé, le ${today}
-----------------------------------------------------------

I. CORRÉLATION DE SÉCURITÉ :
- Paramètre ciblé : ${dossier.key}
- Canaux impactés : ${dossier.type === "phone" ? "Numéro Émetteur" : dossier.type === "link" ? "Ressource de redirection (URL)" : dossier.type === "email" ? "Identifiant mail" : "Structure de message type"}
- Nombre de terminaux interceptés : ${new Set(dossier.signals.map(s => s.deviceId)).size} appareil(s)
- Niveau global d'impact : ${dossier.signals.length} interceptions capturées sur le territoire

II. RAPPORT COMPORTEMENTAL :
- Détecteur : Double moteur SOC (Heuristique comportementale & Signatures exactes)
- Opérateur d'infrastructure : ${operator}
- Zones d'alertes : ${Array.from(new Set(dossier.signals.map(s => s.location))).join(", ") || "Lomé"}

III. DÉVELOPPEMENTS ADMINISTRATIFS :
Le niveau de parallélisme suggère une campagne hostile programmée. Il est requis d'injecter immédiatement cette signature à la liste noire et d'émettre l'avis de coupure correspondant auprès de l'opérateur national.

Cyber Expert Certifié - SOC ANCY - République Togolaise.
===========================================================`;
    
    setReportTitle(`Rapport Judiciaire - ${dossier.key.substring(0, 24)}`);
    setReportText(report);
    setAddSuccessMessage("");
  };

  // Helper to open a raw history alert in a dedicated full detail pop-up modal workspace
  const openHistoryAlertModal = (sig: MobileSignal) => {
    setSelectedHistoryAlert(sig);
    setHistoryAddStatus("");
    
    // Guess signature parameters
    let discoveredType = "Numéro d'appel suspect";
    let discoveredValue = sig.senderPhone;
    const urlMatch = sig.evidenceText.match(/(https?:\/\/[^\s\n\r"']+)/i);
    const emailMatch = sig.evidenceText.match(/([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})/i);
    
    if (urlMatch) {
      discoveredType = "Lien Hypertexte Phishing (URL)";
      discoveredValue = urlMatch[1].split('?')[0].trim();
    } else if (emailMatch) {
      discoveredType = "Scam E-mail officiel";
      discoveredValue = emailMatch[1].trim();
    } else if (sig.evidenceText.toLowerCase().includes("ceet") || sig.evidenceText.toLowerCase().includes("compteur")) {
      discoveredType = "Gabarit CEET sémantique";
      discoveredValue = "Type CEET Suspension";
    }

    const today = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
    const report = `===========================================================
PROCES-VERBAL D'AUDIT TECHNIQUE INDIVIDUEL (ANCY TOGO)
RÉFÉRENCE CONSTATATION : ANCY-PV-SIG-${sig.id.toUpperCase()}-${Math.floor(100+Math.random()*900)}
DATE : Lomé, le ${today}
-----------------------------------------------------------

I. CONSTATATIONS FORENSIQUES DIRECTES :
- Identifiant Sonde Émettrice : ${sig.agentName || sig.deviceId}
- Numéro Expéditeur de l'infraction : ${sig.senderPhone}
- Vecteur : Interception SMS Mobile
- Localité de Capture : ${sig.location || "Lomé (Togo)"}

II. SIGNATURE TECHNIQUE EXTRAITE :
- Marqueur de danger détecté : ${discoveredType}
- Valeur Signature : ${discoveredValue}

III. VERBATIM DU CORPS DU MESSAGE CAPTURÉ :
"${sig.evidenceText}"

IV. RECOMMANDATIONS SOC :
Cette alerte nécessite un examen direct et minutieux. En cas de non-légitimité confirmée, la signature sera poussée vers la liste noire pour interdiction automatique à l'échelle nationale.

Cyber Expert Certifié - SOC ANCY - République Togolaise.
===========================================================`;

    setHistoryReportTitle(`PV d'Analyse - ${sig.senderPhone}`);
    setHistoryReportText(report);
  };

  // Push signature to central backend from a Correlation dossier
  const handlePropagateSignature = async (dossier: GroupedDossier) => {
    setIsAddingSignature(true);
    setAddSuccessMessage("");

    let finalType: "phone" | "domain" | "email" | "text_pattern" = "text_pattern";
    if (dossier.type === "phone") finalType = "phone";
    if (dossier.type === "link") finalType = "domain";
    if (dossier.type === "email") finalType = "email";
    if (dossier.type === "text_pattern") finalType = "text_pattern";

    try {
      const response = await fetch("/api/threats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: finalType,
          value: dossier.key,
          severity: dossier.signals.length >= redundancyThreshold ? "Critical" : "Medium",
          details: `Propagé depuis l'unité d'analyse des corrélations (Redondance x${dossier.signals.length})`,
          location: dossier.signals[0]?.location || "Lomé",
          status: "validated"
        })
      });

      if (response.ok) {
        updateDossierStatus(dossier.key, "closed_added");
        setAddSuccessMessage("Signature de sécurité propagée ! Inscription validée dans la base de signatures nationale.");
        if (onRefreshData) onRefreshData();
      } else {
        const err = await response.json();
        if (err.error && err.error.includes("existe déjà")) {
          updateDossierStatus(dossier.key, "closed_added");
          setAddSuccessMessage("Information : Cette signature existe déjà dans l'index de blocage fédéré.");
        } else {
          setAddSuccessMessage(`Incident technique : ${err.error || "Erreur de réponse"}`);
        }
      }
    } catch (e: any) {
      setAddSuccessMessage(`Panne d'interconnexion : ${e?.message || e}`);
    } finally {
      setIsAddingSignature(false);
    }
  };

  // Push single baseline history card signature to database
  const handlePropagateIndividualSignature = async (sig: MobileSignal) => {
    setIsAddingHistorySignature(true);
    setHistoryAddStatus("");

    let discoveredType: "phone" | "domain" | "email" | "text_pattern" = "phone";
    let discoveredValue = sig.senderPhone;

    const urlMatch = sig.evidenceText.match(/(https?:\/\/[^\s\n\r"']+)/i);
    const emailMatch = sig.evidenceText.match(/([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})/i);

    if (urlMatch) {
      discoveredType = "domain";
      discoveredValue = urlMatch[1].split('?')[0].trim();
    } else if (emailMatch) {
      discoveredType = "email";
      discoveredValue = emailMatch[1].trim();
    }

    try {
      const response = await fetch("/api/threats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: discoveredType,
          value: discoveredValue,
          severity: "Medium",
          details: `Extraite individuellement de la sonde mobile : ${sig.agentName || sig.deviceId}`,
          location: sig.location || "Lomé",
          status: "validated"
        })
      });

      if (response.ok) {
        updateSignalStatus(sig.id, "approved");
        setHistoryAddStatus(`Signature (${discoveredValue}) ajoutée avec succès !`);
        if (onRefreshData) onRefreshData();
      } else {
        const err = await response.json();
        if (err.error && err.error.includes("existe déjà")) {
          updateSignalStatus(sig.id, "approved");
          setHistoryAddStatus("Information : Cet indicateur est déjà référencé dans notre base de signatures.");
        } else {
          setHistoryAddStatus(`Erreur : ${err.error || "Traitement impossible"}`);
        }
      }
    } catch (e: any) {
      setHistoryAddStatus(`Incident de liaison : ${e?.message || e}`);
    } finally {
      setIsAddingHistorySignature(false);
    }
  };

  const handleDownloadDossierReport = () => {
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const linkElement = document.createElement("a");
    linkElement.href = url;
    linkElement.download = `rapport_investigation_${selectedDossier?.key.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
    linkElement.click();
  };

  const handleDownloadHistoryReport = () => {
    const blob = new Blob([historyReportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const linkElement = document.createElement("a");
    linkElement.href = url;
    linkElement.download = `pv_analyse_${selectedHistoryAlert?.id}.txt`;
    linkElement.click();
  };

  const activeSignal = allSignals.find(s => s.id === activeSignalId);

  const filteredHistorySignals = allSignals.filter(sig => {
    const query = historySearchQuery.toLowerCase();
    return (
      sig.deviceId.toLowerCase().includes(query) ||
      (sig.agentName || "").toLowerCase().includes(query) ||
      sig.senderPhone.toLowerCase().includes(query) ||
      sig.evidenceText.toLowerCase().includes(query) ||
      (sig.location || "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* PROFESSIONAL SLATE CONTROL HEADER */}
      <div className="bg-[#0B1020]/45 border border-white/5 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/5 pb-3 mb-3">
          <div className="text-xs font-mono font-bold text-[#10B981] tracking-widest uppercase flex items-center gap-2">
            <Gavel className="w-4 h-4 text-[#10B981]" />
            Centre d&apos;Investigation Forensique (SOC ANCY)
          </div>
          <button
            onClick={onRefreshData}
            className="px-4 py-1.5 bg-[#121A2F]/80 border border-white/5 hover:border-white/10 hover:bg-[#121A2F] text-white rounded-xl text-xs font-mono flex items-center gap-2 cursor-pointer transition shadow-sm self-start sm:self-auto shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#10B981]" />
            SYNCHRONISER LES PREUVES
          </button>
        </div>

        {/* CUSTOM PROFESSIONAL SUB-NAV SELECTORS (THREE DISTINCT COLUMN VIEWS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <button
            onClick={() => { setActiveSubTab("history"); setSelectedDossier(null); }}
            className={`py-3 text-xs uppercase font-mono font-bold tracking-wider transition cursor-pointer relative flex items-center justify-center w-full text-center rounded-xl border ${
              activeSubTab === "history" 
                ? "text-white bg-[#10B981]/10 border-[#10B981]/30 shadow-[0_0_12px_rgba(16,185,129,0.06)]" 
                : "text-slate-400 border-transparent hover:text-white hover:bg-[#121A2F]/45"
            }`}
          >
            <span>📂 Alertes SMS/WA</span>
          </button>

          <button
            onClick={() => { setActiveSubTab("correlation"); setSelectedHistoryAlert(null); }}
            className={`py-3 text-xs uppercase font-mono font-bold tracking-wider transition cursor-pointer relative flex items-center justify-center gap-1.5 w-full text-center rounded-xl border ${
              activeSubTab === "correlation" 
                ? "text-white bg-[#10B981]/10 border-[#10B981]/30 shadow-[0_0_12px_rgba(16,185,129,0.06)]" 
                : "text-slate-400 border-transparent hover:text-white hover:bg-[#121A2F]/45"
            }`}
          >
            <span>🔍 Corrélation SMS/WA</span>
            {groupedDossiers.some(d => d.signals.length >= redundancyThreshold && d.status === "pending_alerts") && (
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => { setActiveSubTab("complaints"); setSelectedHistoryAlert(null); setSelectedDossier(null); }}
            className={`py-3 text-xs uppercase font-mono font-bold tracking-wider transition cursor-pointer relative flex items-center justify-center gap-1.5 w-full text-center rounded-xl border ${
              activeSubTab === "complaints" 
                ? "text-white bg-[#EF4444]/10 border-[#EF4444]/30 shadow-[0_0_12px_rgba(239,68,68,0.06)]" 
                : "text-slate-400 border-transparent hover:text-white hover:bg-[#121A2F]/45"
            }`}
          >
            <span>✍️ Plaintes d&apos;Appels</span>
            {complaints.filter(c => c.status === "pending").length > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500/10 text-[#EF4444] border border-red-500/25 font-mono text-[8.5px] font-black leading-none rounded animate-pulse">
                {complaints.filter(c => c.status === "pending").length} RECOUS
              </span>
            )}
          </button>
        </div>
      </div>

      {/* RENDER DYNAMIC VIEWS */}
      <AnimatePresence mode="wait">
        
        {/* SUBTAB 1 : CHRONOLOGICAL ALERTS HISTORY */}
        {activeSubTab === "history" && (
          <motion.div
            key="history-sub-tab"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-4"
          >
            <div className="bg-[#0B1020]/45 border border-white/5 rounded-2xl p-5 space-y-4">
              
              {/* Search Bar / Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Journaux d&apos;interceptions en direct
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Liste complète des alertes transmises. Cliquez sur une ligne pour ouvrir un dossier d&apos;analyse individuel.
                  </p>
                </div>

                <div className="relative min-w-[240px]">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    className="w-full bg-[#121A2F]/80 border border-white/5 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#10B981]"
                    placeholder="Filtrer par sonde, numéro, texte..."
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Signals Table */}
              <div className="overflow-x-auto select-none rounded-xl">
                <table className="w-full text-left text-xs text-slate-350 font-sans border-collapse">
                  <thead>
                    <tr className="bg-[#121A2F]/50 border-b border-white/5 text-[9px] text-slate-400 font-mono uppercase tracking-wider">
                      <th className="py-3 px-4">ID Expéditeur (Sonde)</th>
                      <th className="py-3 px-4">Ligne Concernée (Numéro)</th>
                      <th className="py-3 px-4">Évaluation de Signature</th>
                      <th className="py-3 px-4">Filtre/Statut</th>
                      <th className="py-3 px-4">Localisation/Date</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/2 bg-[#121A2F]/10">
                    {filteredHistorySignals.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-16 text-slate-500 font-mono text-xs">
                          Aucun signalement d&apos;expédition ne correspond à vos critères
                        </td>
                      </tr>
                    ) : (
                      filteredHistorySignals.map((sig) => {
                        const hasUrl = sig.evidenceText.includes("http") || sig.evidenceText.includes(".org") || sig.evidenceText.includes(".com");
                        const hasEmail = sig.evidenceText.includes("@");
                        
                        const curStatus = signalStatuses[sig.id] || "pending";

                        return (
                          <tr 
                            key={sig.id} 
                            onClick={() => openHistoryAlertModal(sig)}
                            className="cursor-pointer hover:bg-slate-800/40 transition group"
                          >
                            <td className="py-3.5 px-4 font-mono font-bold text-white text-[11px] min-w-[170px]">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  curStatus === "approved" ? "bg-emerald-500" : curStatus === "false_positive" ? "bg-red-500" : "bg-[#10B981]"
                                }`}></span>
                                {sig.agentName || sig.deviceId}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-200 font-semibold">
                              {sig.senderPhone}
                            </td>
                            <td className="py-3.5 px-4">
                              {hasUrl ? (
                                <span className="text-[9px] bg-slate-800 text-slate-300 border border-white/5 px-2.5 py-0.5 rounded font-mono">Lien URL Phishing</span>
                              ) : hasEmail ? (
                                <span className="text-[9px] bg-slate-800 text-slate-300 border border-white/5 px-2.5 py-0.5 rounded font-mono">E-mail suspect</span>
                              ) : (
                                <span className="text-[9px] bg-slate-800 text-slate-300 border border-white/5 px-2.5 py-0.5 rounded font-mono">Numéro SMS / Gabarit</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              {curStatus === "approved" ? (
                                <span className="text-[9px] text-emerald-400 font-mono">🟢 Signé</span>
                              ) : curStatus === "false_positive" ? (
                                <span className="text-[9px] text-slate-500 font-mono">⚪ Faux Positif</span>
                              ) : (
                                <span className="text-[9px] text-amber-400 font-mono">🟡 À auditer</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400">
                              {sig.location} • {new Date(sig.timestamp).toLocaleDateString("fr-FR", {day: "2-digit", month: "2-digit", year: "numeric"})} à {new Date(sig.timestamp).toLocaleTimeString("fr-FR", {hour: '2-digit', minute:'2-digit'})}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="text-[10px] font-mono font-bold text-[#10B981] opacity-80 group-hover:opacity-100 group-hover:underline transition">
                                Ouvrir le dossier →
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </motion.div>
        )}

        {/* SUBTAB 2 : ALERTS CORRELATOR & CAMPAIGN INQUEST DOSSIERS */}
        {activeSubTab === "correlation" && (
          <motion.div
            key="correlation-sub-tab"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-6"
          >
            
            {/* CORRELATION SETTINGS / METADATA ROW */}
            <div className="bg-[#0B1020]/45 border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Regroupement Intelligent &amp; Redondances
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Notre moteur regroupe automatiquement les interceptions de smishing s&apos;appuyant sur des indicateurs identiques.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-300 font-mono">Trigger Seuil Critique :</span>
                  <select
                    value={redundancyThreshold}
                    onChange={(e) => setRedundancyThreshold(parseInt(e.target.value, 10))}
                    className="bg-[#121A2F]/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none"
                  >
                    {[2, 3, 4, 5, 7, 10].map(val => (
                      <option key={val} value={val}>{val} interceptions</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grouping Filter Selector options */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Moteur d&apos;analyse :
                </span>
                
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "phone", label: "Par Numéro Expéditeur", icon: Phone },
                    { key: "link", label: "Par Lien Hypertexte", icon: LinkIcon },
                    { key: "email", label: "Par E-mail", icon: FileText },
                    { key: "text_pattern", label: "Par Gabarit sémantique", icon: Cpu }
                  ].map((btn) => {
                    const Icon = btn.icon;
                    const isSelected = groupingKey === btn.key;
                    return (
                      <button
                        key={btn.key}
                        type="button"
                        onClick={() => handleGroupingKeyChange(btn.key as any)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                          isSelected 
                            ? "bg-[#10B981] text-white border-[#10B981]"
                            : "bg-[#121A2F]/60 text-slate-400 border-white/5 hover:text-white"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {btn.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* THE FOLDERS / DOSSIERS BENTO GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {groupedDossiers.length === 0 ? (
                <div className="col-span-full text-center py-16 border border-dashed border-white/5 rounded-2xl text-slate-500 font-mono text-xs">
                  Aucun dossier n&apos;est actuellement identifié sous cette méthode.
                </div>
              ) : (
                groupedDossiers.map((dossier, idx) => {
                  const hits = dossier.signals.length;
                  const isCritical = hits >= redundancyThreshold;
                  
                  return (
                    <div 
                      key={idx}
                      className="bg-[#0B1020]/45 border border-white/5 rounded-2xl p-5 flex flex-col justify-between hover:border-white/10 transition-all space-y-4 relative overflow-hidden group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                            {dossier.type === "phone" ? "Téléphonique" : dossier.type === "link" ? "Ressource URL" : dossier.type === "email" ? "Ressource Mail" : "Sémantique"}
                          </span>

                          <div className="flex items-center gap-1">
                            <span className="text-xs font-black font-mono text-white">x{hits}</span>
                            <span className="text-[8px] text-slate-400 uppercase">Alertes</span>
                          </div>
                        </div>

                        <div className="text-xs font-mono font-black text-white truncate break-all pt-1 select-all">
                          {dossier.key}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-3">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isCritical && dossier.status === "pending_alerts" ? (
                            <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/10 px-1.5 py-0.5 rounded font-black uppercase font-mono tracking-tight shrink-0">
                              ⚠️ SEUIL CRITIQUE
                            </span>
                          ) : dossier.status === "closed_added" ? (
                            <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase font-mono tracking-tight shrink-0">
                              🟢 Signé
                            </span>
                          ) : dossier.status === "false_positive" ? (
                            <span className="text-[8px] bg-slate-500/10 text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase font-mono tracking-tight shrink-0">
                              ⚪ Faux Positif
                            </span>
                          ) : (
                            <span className="text-[8px] bg-[#121A2F]/80 text-[#10B981] px-1.5 py-0.5 rounded font-bold uppercase font-mono tracking-tight shrink-0">
                              Surveillé
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => openDossierModal(dossier)}
                          className="text-[10px] font-mono font-black text-[#10B981] group-hover:text-emerald-400 transition cursor-pointer flex items-center gap-1"
                        >
                          Ouvrir le dossier →
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </motion.div>
        )}

        {activeSubTab === "complaints" && (
          <motion.div
            key="complaints-sub-tab"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-6"
          >
            {/* COMPLAINTS ANALYTICS STATS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#121A2F]/30 border border-white/5 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">TOTAL PLAINTE CITOYENNES</span>
                  <strong className="text-xl font-mono text-white block mt-1">{complaints.length}</strong>
                </div>
                <div className="p-2.5 bg-white/5 rounded-lg text-slate-400">
                  <FileText className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-[#121A2F]/30 border border-white/5 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">EN ATTENTE D'AUDIT</span>
                  <strong className="text-xl font-mono text-white block mt-1">
                    {complaints.filter(c => c.status === "pending").length}
                  </strong>
                </div>
                <div className="p-2.5 bg-white/5 rounded-lg text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
                </div>
              </div>

              <div className="bg-[#121A2F]/30 border border-white/5 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">NUMÉROS BLOQUÉS (BASE SYNC)</span>
                  <strong className="text-xl font-mono text-white block mt-1">{scams.length}</strong>
                </div>
                <div className="p-2.5 bg-white/5 rounded-lg text-slate-400">
                  <Shield className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-[#121A2F]/30 border border-white/5 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">RÉPUTATIONS NETTES</span>
                  <strong className="text-xl font-mono text-white block mt-1">
                    {complaints.filter(c => c.status === "dismissed").length}
                  </strong>
                </div>
                <div className="p-2.5 bg-white/5 rounded-lg text-slate-400">
                  <Check className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* MAIN COMPLAINTS TABLE CONTAINER */}
            <div className="bg-[#0B1020]/45 border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider font-mono">
                    Zone d&apos;Investigation des Déclarations d&apos;Appels Suspects
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal max-w-xl">
                    Registre souverain de réception des rapports d&apos;escroqueries vocales. Identifiez les récurrences, filtrez les faux positifs pour préserver les honnêtes citoyens, et déclenchez d&apos;urgence la sensibilisation massive de l&apos;ANCY pour neutraliser les vagues d&apos;appels.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Rechercher plainte..."
                      value={complaintSearchQuery}
                      onChange={(e) => setComplaintSearchQuery(e.target.value)}
                      className="bg-[#121A2F]/90 border border-white/5 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#EF4444] font-mono"
                    />
                  </div>
                  
                  <select
                    value={complaintFilter}
                    onChange={(e: any) => setComplaintFilter(e.target.value)}
                    className="bg-[#121A2F]/90 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none cursor-pointer"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="pending">En attente</option>
                    <option value="confirmed_scam">Escrocs Confirmés</option>
                    <option value="dismissed">Faux Positifs</option>
                  </select>
                </div>
              </div>

              {/* TABLE AREA */}
              <div className="overflow-x-auto select-none rounded-xl">
                <table className="w-full text-left text-xs text-slate-300 font-sans border-collapse">
                  <thead>
                    <tr className="bg-[#121A2F]/50 border-b border-white/5 text-[9px] text-slate-400 font-mono uppercase tracking-wider">
                      <th className="py-3 px-4">Citoyen / Source</th>
                      <th className="py-3 px-4">Numéro Suspect</th>
                      <th className="py-3 px-4">Motif de Déclaration</th>
                      <th className="py-3 px-4">Statut d&apos;Audit</th>
                      <th className="py-3 px-4">Fréquence du suspect</th>
                      <th className="py-3 px-4 text-right">Actions de traitement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/2 bg-[#121A2F]/10">
                    {(() => {
                      const filtered = complaints.filter(c => {
                        const q = complaintSearchQuery.toLowerCase();
                        const matchQuery = 
                          (c.phoneNumber && c.phoneNumber.toLowerCase().includes(q)) ||
                          (c.category && c.category.toLowerCase().includes(q)) ||
                          (c.description && c.description.toLowerCase().includes(q)) ||
                          (c.agentName && c.agentName.toLowerCase().includes(q));
                        
                        if (complaintFilter === "all") return matchQuery;
                        return c.status === complaintFilter && matchQuery;
                      });

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="text-center py-16 text-slate-500 font-mono text-xs uppercase italic">
                              Aucune déclaration enregistrée dans ce registre pour le moment
                            </td>
                          </tr>
                        );
                      }

                      return filtered.map((c) => {
                        // Count how many complaints are linked to this phone number
                        const cleanPhone = c.phoneNumber.trim().replace(/\s+/g, "");
                        const citizenReports = complaints.filter(comp => comp.phoneNumber.trim().replace(/\s+/g, "") === cleanPhone);
                        const duplicateCount = citizenReports.length;
                        
                        // Check if reported by different agents
                        const differentAgents = Array.from(new Set(citizenReports.map(cr => cr.agentId))).length;
                        const isHighFrequency = duplicateCount >= 2;

                        return (
                          <tr key={c.id} className="hover:bg-white/[0.01] transition group text-slate-300">
                            <td className="py-3.5 px-4 font-mono text-white text-[11px] min-w-[150px]">
                              <div>
                                <span className="font-bold block leading-tight">{c.agentName || "Citoyen"}</span>
                                <span className="text-[9px] text-slate-500 block font-mono">{c.agentId.substring(0, 15)}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-200 text-[11px] select-all">
                              {c.phoneNumber}
                            </td>
                            <td className="py-3.5 px-4 max-w-xs">
                              <div>
                                <span className="text-[10px] font-mono font-extrabold text-slate-300 block leading-tight uppercase">
                                  {c.category}
                                </span>
                                {c.description && (
                                  <p className="text-[9.5px] text-slate-400 mt-1 italic font-sans leading-relaxed">
                                    &quot;{c.description}&quot;
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              {c.status === "confirmed_scam" ? (
                                <span className="px-2 py-0.5 bg-red-950/20 text-red-400 border border-red-500/20 text-[8.5px] font-mono font-bold uppercase tracking-wide rounded">
                                  Bloqué (Escroc)
                                </span>
                              ) : c.status === "dismissed" ? (
                                <span className="px-2 py-0.5 bg-emerald-950/20 text-emerald-400 border border-emerald-500/20 text-[8.5px] font-mono font-bold uppercase tracking-wide rounded">
                                  Faux Positif (Sûr)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-slate-900/50 text-slate-400 border border-white/5 text-[8.5px] font-mono font-bold uppercase tracking-wide rounded">
                                  À investiguer
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[10.5px]">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${isHighFrequency ? "bg-amber-500" : "bg-slate-700"}`}></span>
                                <strong className="text-white">{duplicateCount}</strong>
                                <span className="text-slate-500 text-[8.5px]">Plainte(s)</span>
                              </div>
                              {differentAgents >= 2 && (
                                <span className="text-[8px] bg-red-950/35 text-red-400 px-1 py-0.5 border border-red-500/10 rounded uppercase font-bold mt-1 block">
                                  Multi-agents ({differentAgents})
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {c.status === "pending" && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleConfirmComplaint(c.id)}
                                      title="Valider et bloquer à l'échelle nationale"
                                      className="px-2 py-1 bg-red-950/20 hover:bg-red-900/30 border border-red-500/30 text-red-400 rounded text-[9px] font-mono font-bold uppercase tracking-wide flex items-center gap-1 cursor-pointer transition shadow"
                                    >
                                      <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Bloquer
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDismissComplaint(c.id)}
                                      title="Classer comme faux positif"
                                      className="px-2 py-1 bg-[#121A2F]/80 hover:bg-[#1E293B] border border-white/5 text-slate-300 rounded text-[9px] font-mono font-bold uppercase tracking-wide flex items-center gap-1 cursor-pointer transition"
                                    >
                                      Classer RAS
                                    </button>
                                  </>
                                )}
                                
                                {isHighFrequency && (
                                  <button
                                    type="button"
                                    onClick={() => handleTriggerMassSensitization(c.phoneNumber)}
                                    title="Déclencher de toute urgence une campagne de sensibilisation massive (SMS/Moov/Togo)"
                                    className="px-2 py-1 bg-amber-950/20 hover:bg-amber-900/30 border border-amber-500/30 text-amber-400 rounded text-[9px] font-mono font-bold uppercase tracking-wide flex items-center gap-1 cursor-pointer transition shadow"
                                  >
                                    <Radio className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Sensibiliser
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDeleteComplaint(c.id)}
                                  title="Supprimer la fiche"
                                  className="p-1 px-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded transition cursor-pointer text-xs leading-none"
                                >
                                  ×
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              {/* SENSITIZATION FEED TERMINAL */}
              <div className="mt-6 border-t border-white/5 pt-5">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block font-mono">
                    <Radio className="w-3.5 h-3.5 text-slate-400 inline-block mr-1 align-middle animate-pulse" /> Console de Sensibilisation Publique Massive (Broadcasts ANCY)
                  </span>
                  <span className="text-[8px] font-mono text-emerald-405 font-bold uppercase bg-emerald-500/10 px-2 py-0.5 rounded leading-none">
                    Liaison Moov-Togocom Active
                  </span>
                </div>
                <div className="bg-black/90 p-4 rounded-xl border border-white/5 h-28 overflow-y-auto font-mono text-[9.5px] leading-relaxed text-slate-300 space-y-1.5">
                  {sensitizationLogsArr.length === 0 ? (
                    <p className="text-slate-500 italic p-1">
                      Aucun broadcast de sensibilisation n&apos;est actuellement diffusé. Si le même numéro d&apos;arnaqueur réapparaît dans plusieurs plaintes d&apos;utilisateurs différents, un bouton d&apos;urgence du SOC &quot;Sensibiliser&quot; s&apos;activera pour diffuser l&apos;alerte SOS.
                    </p>
                  ) : (
                    sensitizationLogsArr.map((logStr, idx) => (
                      <p key={idx} className="text-amber-400 font-semibold animate-fade-in">
                        {logStr}
                      </p>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* CONFIRM SENSITIZATION BROADCAST OVERLAY MODAL */}
            {sensitizingNumber && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/8 w-full h-full backdrop-blur-sm" onClick={() => setSensitizingNumber(null)} />
                <div className="relative w-full max-w-md bg-[#0C1224] border border-amber-500/30 rounded-2xl p-6 shadow-2xl z-10 text-left space-y-4 animate-fade-in">
                  <div className="flex gap-3 text-amber-500">
                    <AlertOctagon className="w-8 h-8 shrink-0 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-mono font-black uppercase tracking-wider text-amber-400">
                        BROADCAST DE SENSIBILISATION MASSIVE
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-1 font-sans leading-relaxed">
                        Le numéro de suspect <strong className="text-white font-mono select-all font-black">{sensitizingNumber}</strong> a accumulé plusieurs plaintes de citoyens. Souhaitez-vous diffuser instantanément une notification SMS d&apos;alerte SOS d&apos;urgence à toute la population Moov et Togocom ?
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-xl font-mono text-[9px] text-amber-400 leading-relaxed">
                    <strong>Contenu du message qui sera envoyé :</strong>
                    <p className="mt-1.5 text-slate-300 italic">
                      &quot;ALERTE CYBERCON-ANCY : Le numéro de téléphone {sensitizingNumber} est identifié comme auteur de multiples escroqueries Flooz/Tmoney en cours au Togo. Redoublez de vigilance, ne transmettez aucun code secret.&quot;
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setSensitizingNumber(null)}
                      className="px-3.5 py-1.5 bg-[#121A2F]/85 hover:bg-[#1E293B] text-slate-350 hover:text-white rounded-lg text-xs font-mono uppercase cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      disabled={isSensitizationRunning}
                      onClick={handleExecuteMassSensitization}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 text-black font-bold text-xs font-mono uppercase tracking-wide rounded-lg cursor-pointer transform active:scale-95 transition"
                    >
                      {isSensitizationRunning ? "Envoi du Broadcast..." : "🚨 DIFFUSER L'ALERTE"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 1 : DEDICATED INDIVIDUAL ALERT EXPERT DOSSIER OVERLAY (SUBTAB 1) */}
      <AnimatePresence>
        {selectedHistoryAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop black-blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedHistoryAlert(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Inner Dialog Box window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-4xl bg-[#060B18] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] z-10"
            >
              
              {/* Header */}
              <div className="bg-[#0B1020] border-b border-white/5 p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-[#10B981] uppercase tracking-widest">
                    <Shield className="w-3.5 h-3.5" />
                    Chambre d&apos;Investigation criminelle souveraine (ANCY)
                  </div>
                  <h3 className="text-sm font-mono font-black text-white">
                    Audit unitaire d&apos;alerte : Sonde {selectedHistoryAlert.agentName || selectedHistoryAlert.deviceId}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedHistoryAlert(null)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin scrollbar-thumb-white/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Column : Metadata & SMS text */}
                  <div className="space-y-4">
                    <div className="bg-[#121A2F]/30 border border-white/5 rounded-xl p-4 space-y-3">
                      <span className="text-[9px] font-mono font-bold text-slate-405 uppercase tracking-widest block">
                        Métadonnées forensiques
                      </span>

                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex justify-between items-center py-2 border-b border-white/3">
                          <span className="text-slate-400">Identifiant Client :</span>
                          <span className="text-white font-bold select-all">{selectedHistoryAlert.deviceId}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/3">
                          <span className="text-slate-400">Ligne Émettrice concernée :</span>
                          <span className="text-white font-bold select-all">{selectedHistoryAlert.senderPhone}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/3">
                          <span className="text-slate-400">Géolocalisation d&apos;Alerte :</span>
                          <span className="text-white font-bold">{selectedHistoryAlert.location || "Lomé (Togo)"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-slate-400">Horodatage de Capture :</span>
                          <span className="text-white font-bold">{new Date(selectedHistoryAlert.timestamp).toLocaleString("fr-FR")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#121A2F]/30 border border-white/5 rounded-xl p-4 space-y-2">
                      <span className="text-[9px] font-mono font-bold text-slate-405 uppercase tracking-widest block">
                        Message capturé à analyser :
                      </span>
                      <div className="bg-black/50 border border-white/5 p-4 rounded-xl text-xs text-slate-200 font-mono italic leading-relaxed select-all">
                        &quot;{selectedHistoryAlert.evidenceText}&quot;
                      </div>
                    </div>

                    {/* Dynamic Action Buttons for Status (Replaces the select element) */}
                    <div className="bg-[#121A2F]/30 border border-white/5 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                          Modifier le Statut d&apos;Alerte
                        </span>
                        <span className="text-[9px] font-bold text-white font-mono bg-white/5 px-2 py-0.5 rounded uppercase">
                          {(signalStatuses[selectedHistoryAlert.id] || "pending") === "approved" ? "Signé" : (signalStatuses[selectedHistoryAlert.id] || "pending") === "false_positive" ? "Faux Positif" : "En attente"}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => updateSignalStatus(selectedHistoryAlert.id, "pending")}
                          className={`py-2 px-1 rounded-xl text-[10px] font-mono font-bold border transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                            (signalStatuses[selectedHistoryAlert.id] || "pending") === "pending"
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.1)] animate-pulse"
                              : "bg-[#121A2F]/50 text-slate-400 border-white/5 hover:text-white hover:bg-slate-800"
                          }`}
                        >
                          <AlertOctagon className="w-4 h-4 text-amber-500" />
                          <span>En attente</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => updateSignalStatus(selectedHistoryAlert.id, "false_positive")}
                          className={`py-2 px-1 rounded-xl text-[10px] font-mono font-bold border transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                            (signalStatuses[selectedHistoryAlert.id] || "pending") === "false_positive"
                              ? "bg-slate-700/40 text-slate-200 border-slate-600 shadow-[0_0_12px_rgba(255,255,255,0.05)]"
                              : "bg-[#121A2F]/50 text-slate-400 border-white/5 hover:text-white hover:bg-slate-800"
                          }`}
                        >
                          <X className="w-4 h-4 text-slate-400" />
                          <span>Faux Positif</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => updateSignalStatus(selectedHistoryAlert.id, "approved")}
                          className={`py-2 px-1 rounded-xl text-[10px] font-mono font-bold border transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                            (signalStatuses[selectedHistoryAlert.id] || "pending") === "approved"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
                              : "bg-[#121A2F]/50 text-slate-400 border-white/5 hover:text-white hover:bg-slate-800"
                          }`}
                        >
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Approuvé</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column : DECISIVE Action buttons & Optional Report Selector */}
                  <div className="space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      
                      {/* DECISIVE SECURITY BLOCKED BUTTONS */}
                      <div className="bg-[#121A2F]/30 border border-white/5 rounded-xl p-4 space-y-3">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                          Actions d&apos;Infrastructure Nationales
                        </span>
                        
                        <div className="space-y-2.5">
                          <button
                            type="button"
                            onClick={() => handlePropagateIndividualSignature(selectedHistoryAlert)}
                            disabled={isAddingHistorySignature}
                            className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:bg-[#121A2F] text-white rounded-xl text-xs font-mono font-bold uppercase transition flex items-center justify-center gap-2 border border-white/5 cursor-pointer shadow-[0_0_15px_rgba(220,38,38,0.15)] group"
                          >
                            {isAddingHistorySignature ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Indexation et Blocage en cours...
                              </>
                            ) : (
                              <>
                                <Database className="w-4 h-4 text-white group-hover:scale-110 transition" />
                                AJOUTER &amp; PROPAGER À LA LISTE NOIRE
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              updateSignalStatus(selectedHistoryAlert.id, "false_positive");
                              setHistoryAddStatus("Signalement reclassé comme légitime (Faux Positif).");
                            }}
                            className="w-full py-2 bg-[#121A2F] hover:bg-[#1E293B] text-slate-300 rounded-xl text-xs font-mono uppercase transition flex items-center justify-center gap-1.5 border border-white/5 cursor-pointer"
                          >
                            <AlertOctagon className="w-3.5 h-3.5 text-slate-400" />
                            CLASSIFIER COMME FAUX POSITIF
                          </button>
                        </div>
                      </div>

                      {/* OPTIONAL REPORT ACTION */}
                      <div className="bg-[#121A2F]/10 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-white font-mono">Procès-Verbal de l&apos;Incident</span>
                          <p className="text-[9px] text-slate-400">Rapport administratif pour l&apos;ANCY (Optionnel)</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowHistoryReport(!showHistoryReport)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold border transition cursor-pointer ${
                            showHistoryReport 
                              ? "bg-[#10B981]/20 text-[#10B981] border-[#10B981]/50"
                              : "bg-transparent text-slate-400 border-white/5 hover:text-white"
                          }`}
                        >
                          {showHistoryReport ? "Masquer rédacteur" : "Rédiger / Télécharger"}
                        </button>
                      </div>

                      {/* CONDITIONAL REPORT ZONE */}
                      {showHistoryReport && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-[#121A2F]/20 border border-white/5 rounded-xl p-4 space-y-3 overflow-hidden"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono font-bold text-slate-405 uppercase tracking-widest">
                              Procès-Verbal Judiciaire
                            </span>
                            
                            <button
                              type="button"
                              onClick={handleDownloadHistoryReport}
                              className="text-[9px] font-mono text-[#10B981] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Download className="w-3 h-3" />
                              Télécharger PV (TXT)
                            </button>
                          </div>

                          <div className="space-y-2">
                            <input
                              type="text"
                              className="w-full bg-[#121A2F]/80 border border-white/5 rounded-xl px-3 py-1 text-xs text-white font-mono focus:outline-none"
                              value={historyReportTitle}
                              onChange={(e) => setHistoryReportTitle(e.target.value)}
                            />

                            <textarea
                              rows={5}
                              className="w-full bg-black/60 border border-white/5 rounded-xl p-3 text-slate-300 font-mono text-[9px] leading-relaxed focus:outline-none"
                              value={historyReportText}
                              onChange={(e) => setHistoryReportText(e.target.value)}
                            />
                          </div>
                        </motion.div>
                      )}

                    </div>

                    <div className="space-y-2.5 pt-4 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => setSelectedHistoryAlert(null)}
                        className="w-full py-2 bg-[#121A2F] hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-mono uppercase transition cursor-pointer"
                      >
                        Terminer l&apos;Analyse
                      </button>

                      {historyAddStatus && (
                        <div className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg text-emerald-400 font-mono text-center">
                          {historyAddStatus}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2 : DYNAMIC CORRELATION DOSSIER OVERLAY (SUBTAB 2) */}
      <AnimatePresence>
        {selectedDossier && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop black-blur background */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDossier(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Inner dialogue window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-5xl bg-[#060B18] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] z-10"
            >
              
              {/* Modal Header */}
              <div className="bg-[#0B1020] border-b border-white/5 p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-[#10B981] uppercase tracking-widest">
                    <Shield className="w-3.5 h-3.5" />
                    Chambre d&apos;Investigation criminelle souveraine (ANCY)
                  </div>
                  <h3 className="text-sm font-mono font-black text-white break-all">
                    Dossier de corrélation : {selectedDossier.key}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDossier(null)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Grid Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin scrollbar-thumb-white/10">
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* LEFT PANE Inside Modal : Member alerts constituent checklist (5 Columns) */}
                  <div className="md:col-span-5 space-y-4">
                    <div className="bg-[#121A2F]/30 border border-white/5 rounded-xl p-4 space-y-3">
                      
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                          Alertes liées ({selectedDossier.signals.length})
                        </span>
                        <span className="text-[8px] bg-white/5 text-slate-350 font-mono px-2 py-0.5 rounded">
                          {new Set(selectedDossier.signals.map(s => s.deviceId)).size} Appareil(s)
                        </span>
                      </div>

                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                        {selectedDossier.signals.map((sig) => {
                          const isCurrentActive = activeSignalId === sig.id;
                          return (
                            <div
                              key={sig.id}
                              onClick={() => setActiveSignalId(sig.id)}
                              className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                                isCurrentActive 
                                  ? "bg-[#1C2542] border-[#10B981]/50" 
                                  : "bg-[#121A2F]/40 border-white/3 hover:border-white/10"
                              }`}
                            >
                              <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                                <span className="font-bold text-white truncate max-w-[120px]">{sig.agentName || sig.deviceId}</span>
                                <span>{new Date(sig.timestamp).toLocaleDateString("fr-FR", {day: "2-digit", month: "2-digit", year: "numeric"})} à {new Date(sig.timestamp).toLocaleTimeString("fr-FR", {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>
                              <div className="text-[10px] text-slate-300 mt-1.5 truncate">
                                {sig.evidenceText}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  </div>

                  {/* RIGHT PANE Inside Modal : Message Visualizer, dossier context  (7 Columns) */}
                  <div className="md:col-span-7 space-y-4">
                    
                    {/* Visual SMS Box container */}
                    <AnimatePresence mode="wait">
                      {activeSignal ? (
                        <motion.div
                          key={activeSignal.id}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          className="bg-black/50 border border-white/5 rounded-xl p-4 space-y-2.5"
                        >
                          <div className="flex items-center justify-between border-b border-white/5 pb-2 text-[9px] font-mono text-slate-500">
                            <span className="flex items-center gap-1">
                              <Smartphone className="w-3.5 h-3.5 text-[#10B981]" />
                              Copie de l&apos;interception : {activeSignal.agentName || activeSignal.deviceId}
                            </span>
                            <span>Localisation : {activeSignal.location}</span>
                          </div>
                          
                          <div className="text-xs text-slate-200 leading-relaxed font-mono bg-white/2 p-3 rounded-lg border-l-2 border-[#E11D48] select-all italic">
                            &quot;{activeSignal.evidenceText}&quot;
                          </div>

                          <div className="flex justify-between text-[9px] text-[#A1A1AA] pt-1">
                            <span>Sonde : GPS-SOUVERAIN TR-228</span>
                            <span>Signature suspecte détectée</span>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="text-center py-6 text-slate-500 text-xs font-mono">
                          Sélectionnez une alerte à gauche pour voir son verbatim
                        </div>
                      )}
                    </AnimatePresence>

                    {/* Dossier status controller */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Dynamic Action Buttons for Dossier Status */}
                      <div className="bg-[#121A2F]/30 border border-white/5 p-4 rounded-xl space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                            Modifier le statut du dossier
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateDossierStatus(selectedDossier.key, "pending_alerts")}
                            className={`py-1.5 px-1 rounded-lg text-[9px] font-mono font-bold border transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                              selectedDossier.status === "pending_alerts"
                                ? "bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.08)]"
                                : "bg-[#121A2F]/50 text-slate-400 border-white/5 hover:text-white"
                            }`}
                          >
                            <span>🟡</span>
                            <span>En attente</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => updateDossierStatus(selectedDossier.key, "false_positive")}
                            className={`py-1.5 px-1 rounded-lg text-[9px] font-mono font-bold border transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                              selectedDossier.status === "false_positive"
                                ? "bg-slate-700/40 text-slate-200 border-slate-600 shadow-[0_0_10px_rgba(255,255,255,0.03)]"
                                : "bg-[#121A2F]/50 text-slate-400 border-white/5 hover:text-white"
                            }`}
                          >
                            <span>⚪</span>
                            <span>Faux Positif</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => updateDossierStatus(selectedDossier.key, "closed_added")}
                            className={`py-1.5 px-1 rounded-lg text-[9px] font-mono font-bold border transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                              selectedDossier.status === "closed_added"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.08)]"
                                : "bg-[#121A2F]/50 text-slate-405 border-white/5 hover:text-white"
                            }`}
                          >
                            <span>🟢</span>
                            <span>Clôturé</span>
                          </button>
                        </div>
                      </div>

                      <div className="bg-[#121A2F]/30 border border-white/5 p-4 rounded-xl flex flex-col justify-center">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
                          Taux de coïncidences :
                        </span>
                        <div className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                          {selectedDossier.signals.length} occurrences
                          {selectedDossier.signals.length >= redundancyThreshold && (
                            <span className="text-[8px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded font-black uppercase">
                              Critique
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CORE STRATEGIC ACTIONS AREA UNDER DOSSIER */}
                    <div className="bg-[#121A2F]/40 border border-white/5 p-4 rounded-xl space-y-3.5">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                        Actions Fédérées de Sécurité Nationale
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => handlePropagateSignature(selectedDossier)}
                          disabled={isAddingSignature || selectedDossier.status === "closed_added"}
                          className="py-3 px-4 bg-red-600 hover:bg-red-500 disabled:bg-[#121A2F] disabled:text-slate-500 text-white rounded-xl text-xs font-mono font-bold uppercase transition flex items-center justify-center gap-2 border border-white/5 cursor-pointer shadow-[0_0_15px_rgba(220,38,38,0.1)] group text-center"
                        >
                          {isAddingSignature ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                              Propagation...
                            </>
                          ) : selectedDossier.status === "closed_added" ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-400" />
                              Signature enregistrée
                            </>
                          ) : (
                            <>
                              <Database className="w-4 h-4 text-white group-hover:scale-110 transition shrink-0" />
                              ENREGISTRER &amp; PROPAGER
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            updateDossierStatus(selectedDossier.key, "false_positive");
                            setAddSuccessMessage("Groupe entier marqué d'une clause d'exemption Faux Positif.");
                          }}
                          className="py-3 px-4 bg-[#121A2F] hover:bg-[#1E293B] text-slate-300 rounded-xl text-xs font-mono uppercase transition flex items-center justify-center gap-1.5 border border-white/5 cursor-pointer text-center"
                        >
                          <AlertOctagon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          FAUX POSITIF GLOBAL
                        </button>
                      </div>

                      {addSuccessMessage && (
                        <div className="text-[10px] bg-emerald-500/10 border border-[#10B981]/20 p-2.5 rounded-lg text-emerald-400 font-mono text-center">
                          {addSuccessMessage}
                        </div>
                      )}
                    </div>

                    {/* OPTIONAL DOSSIER REPORT DRAWER */}
                    <div className="bg-[#121A2F]/10 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-white font-mono">Formalisation PV de Corrélation</span>
                        <p className="text-[9px] text-slate-400">Dossier technique d&apos;analyse (Optionnel)</p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setShowDossierReport(!showDossierReport)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold border transition cursor-pointer ${
                          showDossierReport 
                            ? "bg-[#10B981]/20 text-[#10B981] border-[#10B981]/50"
                            : "bg-transparent text-slate-400 border-white/5 hover:text-white"
                        }`}
                      >
                        {showDossierReport ? "Masquer PV" : "Rédiger / Télécharger"}
                      </button>
                    </div>

                  </div>

                </div>

                {/* CONDITIONAL INVESTIGATION REPORT ZONE FOR DOSSIER */}
                {showDossierReport && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-[#121A2F]/20 border border-white/5 rounded-xl p-5 space-y-4 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold text-slate-350 uppercase tracking-widest flex items-center gap-1">
                        <FileSignature className="w-3.5 h-3.5 text-[#10B981]" />
                        Procès-verbal de Corrélation
                      </span>

                      <button
                        type="button"
                        onClick={handleDownloadDossierReport}
                        className="text-[9px] font-mono text-[#10B981] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        Télécharger le rapport d&apos;activité (TXT)
                      </button>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="text"
                        className="w-full bg-[#121A2F]/80 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none"
                        value={reportTitle}
                        onChange={(e) => setReportTitle(e.target.value)}
                        placeholder="Titre de l&apos;enquête administrative"
                      />

                      <textarea
                        rows={5}
                        className="w-full bg-black/60 border border-white/5 rounded-xl p-3 text-slate-300 font-mono text-[9px] leading-relaxed focus:outline-none"
                        value={reportText}
                        onChange={(e) => setReportText(e.target.value)}
                      />
                    </div>
                  </motion.div>
                )}

                {/* CLOSE PANEL BUTTONS ROW */}
                <div className="flex justify-end pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setSelectedDossier(null)}
                    className="px-5 py-2.5 bg-[#121A2F] text-slate-300 hover:text-white rounded-xl text-xs font-mono transition cursor-pointer hover:bg-slate-800"
                  >
                    Fermer le dossier
                  </button>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
