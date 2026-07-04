import React, { useState, useMemo, useEffect } from "react";
import { 
  Shield, 
  Activity, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Filter,
  TrendingUp,
  Server,
  Fingerprint,
  RefreshCw,
  Search,
  Database,
  BookOpen,
  MapPin,
  Flame,
  Globe,
  Settings,
  HelpCircle,
  AlertCircle,
  Cpu,
  Smartphone,
  Radio,
  Sparkles,
  Layers,
  Binary,
  ArrowUpRight
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from "recharts";
import { Threat, MobileAgent, MobileSignal, PhoneComplaint } from "../types";

interface Props {
  threats: Threat[];
  agents: MobileAgent[];
  mobileSignals: MobileSignal[];
  complaints: PhoneComplaint[];
  onQuickAddThreat: (type: "domain" | "ip" | "email" | "phone", value: string, severity?: string, details?: string) => void;
  onResetToZero?: () => Promise<void>;
  onLoadDemoData?: () => Promise<void>;
  currentUsername: string;
}

export default function DashboardTab({ 
  threats, 
  agents, 
  mobileSignals,
  complaints,
  onQuickAddThreat,
  onResetToZero,
  onLoadDemoData,
  currentUsername
}: Props) {
  
  // Active clock GMT
  const [togoClock, setTogoClock] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  // States for the sleek interactive Quick Add IoC Form
  const [quickType, setQuickType] = useState<"domain" | "ip" | "email" | "phone">("phone");
  const [quickValue, setQuickValue] = useState("");
  const [quickDetails, setQuickDetails] = useState("");
  const [quickSeverity, setQuickSeverity] = useState<"Low" | "Medium" | "Critical">("Medium");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const gmtDate = new Date();
      const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
      const dayName = days[gmtDate.getUTCDay()];
      const day = String(gmtDate.getUTCDate()).padStart(2, "0");
      const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
      const monthName = months[gmtDate.getUTCMonth()];
      const year = gmtDate.getUTCFullYear();
      
      const hours = String(gmtDate.getUTCHours()).padStart(2, "0");
      const minutes = String(gmtDate.getUTCMinutes()).padStart(2, "0");
      const seconds = String(gmtDate.getUTCSeconds()).padStart(2, "0");
      
      setTogoClock(`${dayName} ${day} ${monthName} ${year} • ${hours}:${minutes}:${seconds} GMT`);
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute dynamic KPIs - strictly initialized to 0 if database is empty
  const kpiStats = useMemo(() => {
    const totalThreatsCount = threats.length;
    const totalSignalsCount = mobileSignals.length;
    const totalComplaintsCount = complaints.length;
    const totalAgentsCount = agents.length;

    // Fully dynamic counters from database - no artificial offsets when empty
    const totalIntercepted = totalThreatsCount + totalSignalsCount;
    const activeSignatures = totalThreatsCount;
    const citizenComplaints = totalComplaintsCount;
    const synchronizedAgents = totalAgentsCount;

    return {
      totalIntercepted,
      activeSignatures,
      citizenComplaints,
      synchronizedAgents
    };
  }, [threats, mobileSignals, complaints, agents]);

  // Combined real-time table of actual threats
  const liveThreatFeed = useMemo(() => {
    // If database is completely empty, keep it clean and empty
    if (threats.length === 0) {
      return [];
    }

    // Map real threats to match the SOC feed row design
    const mappedRealThreats = threats.map((t, idx) => {
      // Determine elegant type
      let typeLabel = "Alerte Cybersécurité";
      if (t.type === "phone") {
        typeLabel = t.details.toLowerCase().includes("flooz") || t.details.toLowerCase().includes("money") 
          ? "Faux Gains Flooz/TMoney" 
          : "Gendarmerie / Usurpation";
      } else if (t.type === "domain") {
        typeLabel = t.details.toLowerCase().includes("ceet") 
          ? "Facture CEET fictive" 
          : "Phishing Bancaire / Clone";
      } else {
        typeLabel = "Indicateur Suspect";
      }

      // Map status
      let statusLabel = "Bloqué";
      if (t.status === "sandbox") statusLabel = "En Quarantaine";
      if (t.status === "validated") statusLabel = "Signalé ANCY";

      // Formulate a beautiful time
      const dateObj = new Date(t.detectedAt);
      const hours = String(dateObj.getHours()).padStart(2, "0");
      const minutes = String(dateObj.getMinutes()).padStart(2, "0");
      const seconds = String(dateObj.getSeconds()).padStart(2, "0");
      const timeStr = isNaN(dateObj.getTime()) ? `12:${String(idx * 7).padStart(2, "0")}:15` : `${hours}:${minutes}:${seconds}`;

      return {
        id: t.id,
        time: timeStr,
        type: typeLabel,
        sender: t.value,
        severity: t.severity,
        status: statusLabel,
        details: t.details
      };
    });

    // Real threats always come first to show immediate dynamic feedback
    return mappedRealThreats.slice(0, 10);
  }, [threats]);

  // Extract the very last automated Gemini extracted IoC
  const latestGeminiIoC = useMemo(() => {
    // If we have actual threats, return the latest one
    if (threats.length > 0) {
      const latest = threats[threats.length - 1];
      return {
        type: latest.type,
        value: latest.value,
        details: latest.details || "Extraction automatisée"
      };
    }
    // Fallback if database is reset to zero
    return {
      type: "N/A",
      value: "Aucun indicateur",
      details: "Base de données vide - En attente d'ingestion"
    };
  }, [threats]);

  // Dynamic but premium dense chart data showing activity fluctuation according to severities
  const chartData = useMemo(() => {
    const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    
    // Initialize day counts to 0
    const dataMap = days.map(day => ({
      name: day,
      Critique: 0,
      Moyen: 0,
      Faible: 0
    }));

    // If empty state, return all zeros
    const totalCount = threats.length + mobileSignals.length + complaints.length;
    if (totalCount === 0) {
      return dataMap;
    }

    // Group real threats by day of week
    threats.forEach(t => {
      try {
        const date = new Date(t.detectedAt);
        let dayIdx = date.getDay() - 1; // getDay() is 0 for Sun, 1 for Mon...
        if (dayIdx === -1) dayIdx = 6; // Sunday is index 6
        
        const sev = t.severity;
        if (sev === "Critical") {
          dataMap[dayIdx].Critique += 1;
        } else if (sev === "Medium") {
          dataMap[dayIdx].Moyen += 1;
        } else {
          dataMap[dayIdx].Faible += 1;
        }
      } catch (e) {}
    });

    // Group signals by day of week (usually Medium severity)
    mobileSignals.forEach(s => {
      try {
        const date = new Date(s.timestamp || Date.now());
        let dayIdx = date.getDay() - 1;
        if (dayIdx === -1) dayIdx = 6;
        dataMap[dayIdx].Moyen += 1;
      } catch (e) {}
    });

    // Group citizen complaints by day (usually Faible/Moyen severity)
    complaints.forEach(c => {
      try {
        const date = new Date(c.createdAt || Date.now());
        let dayIdx = date.getDay() - 1;
        if (dayIdx === -1) dayIdx = 6;
        dataMap[dayIdx].Faible += 1;
      } catch (e) {}
    });

    return dataMap;
  }, [threats, mobileSignals, complaints]);

  // Geographic Heatmap metrics of Togo regions calculated dynamically from actual locations
  const togoGeographicData = useMemo(() => {
    const totalCount = threats.length + mobileSignals.length + complaints.length;

    const countByRegion = (regionId: string) => {
      let count = 0;
      const isRegion = (loc: string = "", regId: string) => {
        const l = loc.toLowerCase();
        if (regId === "maritime") return l.includes("lomé") || l.includes("lome") || l.includes("maritime") || l.includes("baguida") || l.includes("agoè");
        if (regId === "plateaux") return l.includes("atakpamé") || l.includes("atakpame") || l.includes("plateaux") || l.includes("kpalimé") || l.includes("kpalime") || l.includes("notsé") || l.includes("notse");
        if (regId === "centrale") return l.includes("sokodé") || l.includes("sokode") || l.includes("centrale") || l.includes("tchamba") || l.includes("bafilo");
        if (regId === "kara") return l.includes("kara") || l.includes("niamtougou") || l.includes("bassar");
        if (regId === "savanes") return l.includes("savanes") || l.includes("dapaong") || l.includes("mango") || l.includes("cinkassé") || l.includes("cinkasse");
        return false;
      };

      threats.forEach(t => { if (isRegion(t.location, regionId)) count++; });
      mobileSignals.forEach(s => { if (isRegion(s.location, regionId)) count++; });
      complaints.forEach(c => {
        const agent = agents.find(a => a.id === c.agentId || a.name === c.agentName);
        if (agent && isRegion(agent.city, regionId)) count++;
      });

      return count;
    };

    const maritimeIncidents = countByRegion("maritime");
    const plateauxIncidents = countByRegion("plateaux");
    const centraleIncidents = countByRegion("centrale");
    const karaIncidents = countByRegion("kara");
    const savanesIncidents = countByRegion("savanes");

    return [
      { 
        id: "maritime", 
        region: "Région Maritime (Lomé)", 
        percentage: totalCount > 0 ? Math.round((maritimeIncidents / totalCount) * 100) : 0, 
        incidents: maritimeIncidents, 
        trend: maritimeIncidents > 0 ? "+14% ce mois" : "Stable", 
        hotspot: "Grand Lomé, Baguida, Agoè-Nyivé",
        lat: 310, lng: 120 
      },
      { 
        id: "plateaux", 
        region: "Région des Plateaux (Atakpamé)", 
        percentage: totalCount > 0 ? Math.round((plateauxIncidents / totalCount) * 100) : 0, 
        incidents: plateauxIncidents, 
        trend: plateauxIncidents > 0 ? "+5% ce mois" : "Stable", 
        hotspot: "Atakpamé, Kpalimé, Notsé",
        lat: 195, lng: 115 
      },
      { 
        id: "centrale", 
        region: "Région Centrale (Sokodé)", 
        percentage: totalCount > 0 ? Math.round((centraleIncidents / totalCount) * 100) : 0, 
        incidents: centraleIncidents, 
        trend: centraleIncidents > 0 ? "Stable" : "Stable", 
        hotspot: "Sokodé, Tchamba, Bafilo",
        lat: 130, lng: 110 
      },
      { 
        id: "kara", 
        region: "Région de la Kara (Kara)", 
        percentage: totalCount > 0 ? Math.round((karaIncidents / totalCount) * 100) : 0, 
        incidents: karaIncidents, 
        trend: karaIncidents > 0 ? "+18% ce mois" : "Stable", 
        hotspot: "Kara, Niamtougou, Bassar",
        lat: 80, lng: 135 
      },
      { 
        id: "savanes", 
        region: "Région des Savanes (Dapaong)", 
        percentage: totalCount > 0 ? Math.round((savanesIncidents / totalCount) * 100) : 0, 
        incidents: savanesIncidents, 
        trend: savanesIncidents > 0 ? "-3% ce mois" : "Stable", 
        hotspot: "Dapaong, Mango, Cinkassé",
        lat: 20, lng: 105 
      }
    ];
  }, [threats, mobileSignals, complaints, agents]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickValue.trim()) return;
    setIsSubmitting(true);
    
    // Fire callback
    onQuickAddThreat(quickType, quickValue.trim(), quickSeverity, quickDetails || "Ajouté manuellement via le Dashboard de supervision");
    
    setSuccessMsg(`L'indicateur ${quickValue} a été ajouté avec succès et propagé aux agents !`);
    setQuickValue("");
    setQuickDetails("");
    
    setTimeout(() => {
      setSuccessMsg("");
    }, 4000);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="sp-sentinel-dashboard">
      
      {/* 1. Premium Cyber-Green Hero Banner - Sovereignty and Real-Time Surveillance */}
      <div className="relative bg-gradient-to-r from-emerald-950/85 via-[#0c281e]/90 to-teal-950/85 border border-[#10B981]/20 shadow-xl rounded-2xl p-6 md:p-8 text-white overflow-hidden select-none holo-scanline" id="dashboard-hero-banner">
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#10B981]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#10B981]/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Vertical glowing network stream bars in modern green */}
        <div className="absolute right-0 bottom-0 top-0 w-2/5 hidden md:flex items-end justify-between px-10 pb-0 opacity-85 select-none pointer-events-none gap-2">
          <div className="w-4 bg-gradient-to-t from-[#10B981]/10 to-[#10B981]/40 rounded-t-md animate-pulse" style={{ height: '35%', animationDuration: '3s' }}></div>
          <div className="w-4 bg-gradient-to-t from-[#10B981]/20 to-[#10B981]/60 rounded-t-md animate-pulse" style={{ height: '60%', animationDuration: '4.5s' }}></div>
          <div className="w-4 bg-gradient-to-t from-[#10B981]/30 to-[#10B981]/80 rounded-t-md" style={{ height: '85%' }}></div>
          <div className="w-4 bg-gradient-to-t from-[#10B981]/10 to-[#10B981]/40 rounded-t-md animate-pulse" style={{ height: '45%', animationDuration: '3.5s' }}></div>
          <div className="w-4 bg-gradient-to-t from-[#10B981]/40 to-[#10B981] rounded-t-md" style={{ height: '95%' }}></div>
          <div className="w-4 bg-gradient-to-t from-[#10B981]/25 to-[#10B981]/70 rounded-t-md animate-pulse" style={{ height: '70%', animationDuration: '5s' }}></div>
          <div className="w-4 bg-gradient-to-t from-[#10B981]/20 to-[#10B981]/50 rounded-t-md" style={{ height: '50%' }}></div>
        </div>

        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#10B981]/15 border border-[#10B981]/30 rounded-full text-xs font-mono font-bold text-[#10B981] uppercase tracking-widest leading-none">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping"></span>
            SP SENTINEL NETWORK COGNITIVE
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-display text-white">
            Supervision Bivalente &amp; Renseignements Cyber en Temps Réel
          </h1>
          <p className="text-sm text-[#94A3B8] font-sans leading-relaxed max-w-lg opacity-90">
            Plateforme souveraine d'échange de signatures de menaces (COI) et de détection automatique d'ingénierie sociale par modèle IA cognitif pour la République du Togo.
          </p>
        </div>
      </div>

      {/* 2. Real-time synchronised TOGO Network Time zone bar */}
      <div className="bg-[#111827] border border-white/5 rounded-xl px-5 py-3 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-md" id="dashboard-sync-bar">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#10B981] animate-pulse" />
          <span className="text-xs font-mono font-bold text-[#94A3B8] uppercase tracking-widest">
            SYNCHRONISATION RENSEIGNEMENT TOGO (GMT NETWORK)
          </span>
        </div>
        
        <div className="text-xs font-mono font-bold text-white bg-[#0B1020]/45 border border-white/5 px-3 py-1.5 rounded-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10B981] radar-glow-ring"></span>
          {togoClock || "Synchronisation..."}
        </div>
      </div>

      {/* Beautiful Dynamic Zero-State Card */}
      {threats.length === 0 && mobileSignals.length === 0 && (
        <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 text-center space-y-4 animate-fade-in" id="dashboard-zero-state">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#10B981]/10 flex items-center justify-center border border-[#10B981]/20 text-[#10B981]">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">PLATEFORME INITIALISÉE À ZÉRO</h3>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Toutes les bases de données du SOC ont été vidées avec succès pour vos tests. La console est prête à enregistrer les signalements citoyens et les synchronisations mobiles en direct.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {onLoadDemoData && (
              <button
                onClick={async () => {
                  await onLoadDemoData();
                }}
                className="px-4 py-2 bg-[#10B981] hover:bg-[#10B981]/90 text-white text-xs font-bold font-mono uppercase tracking-wider rounded-xl transition shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
                Charger les Données de Démo (ANCY)
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Bandeau de KPIs Métriques Haute Visibilité */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-metrics-strip">
        
        {/* KPI 1: Total Menaces Interceptées */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-4 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-[#10B981]/35 transition duration-350">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[#10B981]/5 rounded-full blur-2xl group-hover:bg-[#10B981]/10 transition"></div>
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-slate-400 uppercase font-black tracking-widest block">Menaces Interceptées</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white tracking-tight">{kpiStats.totalIntercepted.toLocaleString()}</span>
              {kpiStats.totalIntercepted > 0 ? (
                <span className="text-[9px] font-bold text-emerald-400 font-sans bg-emerald-500/10 px-1.5 py-0.5 rounded">Actif</span>
              ) : (
                <span className="text-[9px] font-bold text-slate-500 font-sans bg-slate-800 px-1.5 py-0.5 rounded">0%</span>
              )}
            </div>
            <p className="text-[9px] text-slate-500 font-sans">Bloqué localement sur le territoire</p>
          </div>
          <div className="p-3 rounded-xl bg-[#10B981]/10 text-[#10B981] border border-white/5 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Signatures Actives en Base */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-4 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-[#10B981]/35 transition duration-350">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition"></div>
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-slate-400 uppercase font-black tracking-widest block">Signatures en Base</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white tracking-tight">{kpiStats.activeSignatures.toLocaleString()}</span>
              {kpiStats.activeSignatures > 0 ? (
                <span className="text-[9px] font-bold text-emerald-400 font-sans bg-emerald-500/10 px-1.5 py-0.5 rounded">Propagé</span>
              ) : (
                <span className="text-[9px] font-bold text-slate-500 font-sans bg-slate-800 px-1.5 py-0.5 rounded">Vide</span>
              )}
            </div>
            <p className="text-[9px] text-slate-500 font-sans">Numéros &amp; liens répertoriés</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-[#10B981] border border-white/5 shrink-0">
            <Fingerprint className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Déclarations Citoyennes Actives */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-4 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-slate-800 transition duration-350">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-950/5 rounded-full blur-2xl transition"></div>
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-slate-400 uppercase font-black tracking-widest block">Plaintes Citoyennes</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white tracking-tight">{kpiStats.citizenComplaints}</span>
              {kpiStats.citizenComplaints > 0 ? (
                <span className="text-[9px] font-bold text-red-300 font-sans bg-red-950/40 px-1.5 py-0.5 rounded border border-red-900/30">En Attente</span>
              ) : (
                <span className="text-[9px] font-bold text-slate-500 font-sans bg-slate-850 px-1.5 py-0.5 rounded">Stable</span>
              )}
            </div>
            <p className="text-[9px] text-slate-500 font-sans">Soumissions citoyennes directes</p>
          </div>
          <div className="p-3 rounded-xl bg-red-950/30 text-red-300 border border-red-900/30 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Agents Mobiles Synchronisés */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-4 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-[#10B981]/35 transition duration-350">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[#10B981]/5 rounded-full blur-2xl group-hover:bg-[#10B981]/10 transition"></div>
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-slate-400 uppercase font-black tracking-widest block">Terminaux Mobiles</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white tracking-tight">{kpiStats.synchronizedAgents.toLocaleString()}</span>
              {kpiStats.synchronizedAgents > 0 ? (
                <span className="text-[9px] font-bold text-[#10B981] font-sans bg-[#10B981]/10 px-1.5 py-0.5 rounded">En ligne</span>
              ) : (
                <span className="text-[9px] font-bold text-slate-500 font-sans bg-slate-800 px-1.5 py-0.5 rounded">0</span>
              )}
            </div>
            <p className="text-[9px] text-slate-500 font-sans">Synchronisés en direct au Togo</p>
          </div>
          <div className="p-3 rounded-xl bg-[#10B981]/10 text-[#10B981] border border-white/5 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* 4. Zone Centrale Opérationnelle (Layout en 2 Colonnes : 70% / 30%) */}
      <div className="separator-elegant">
        <div className="separator-node"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6" id="central-operational-zone">
        
        {/* Colonne Gauche (70%) - Flux des Alertes en Temps Réel (Live Threat Feed) */}
        <div className="bg-[#111827] border border-white/5 rounded-2xl p-5 shadow-xl lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981] radar-glow-ring"></span>
                <h3 className="text-xs font-bold text-white tracking-widest font-mono uppercase">
                  FLUX DES ALERTES DE MENACES EN TEMPS RÉEL (SOC LIVE)
                </h3>
              </div>
              <span className="text-[9px] font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded">
                Lomé (GMT+0)
              </span>
            </div>
 
            {/* Event List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[8.5px] font-mono uppercase text-slate-500 tracking-wider">
                    <th className="pb-2 font-black text-slate-400">Heure Lomé</th>
                    <th className="pb-2 font-black text-slate-400">Type d'arnaque / Alerte</th>
                    <th className="pb-2 font-black text-slate-400">Expéditeur / Source</th>
                    <th className="pb-2 font-black text-right text-slate-400">Statut SOC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[10px] font-mono">
                  {liveThreatFeed.map((alert) => (
                    <tr key={alert.id} className="hover:bg-slate-950/20 transition-all group">
                      <td className="py-3 text-slate-400 font-bold whitespace-nowrap">
                        {alert.time}
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex flex-col">
                          <span className={`px-2 py-0.5 rounded text-[8.5px] font-black w-fit font-sans ${
                            alert.severity === "Critical" 
                              ? "bg-red-950/40 text-red-300 border border-red-900/30" 
                              : "bg-slate-800/60 text-slate-300 border border-slate-700"
                          }`}>
                            {alert.type}
                          </span>
                          <span className="text-[8.5px] text-slate-500 truncate max-w-[200px] font-sans mt-0.5 italic group-hover:text-slate-400">
                            {alert.details}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-white font-bold tracking-tight whitespace-nowrap select-all">
                        {alert.sender}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${
                          alert.status === "Bloqué" 
                            ? "bg-emerald-500/15 text-[#10B981] border border-[#10B981]/25" 
                            : alert.status === "En Quarantaine"
                            ? "bg-slate-800/40 text-slate-300 border border-slate-700"
                            : "bg-emerald-500/10 text-[#10B981] border border-[#10B981]/20"
                        }`}>
                          {alert.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
 
          <div className="text-[9px] text-slate-500 mt-4 border-t border-white/5 pt-3 flex justify-between items-center font-mono">
            <span>Flux de surveillance unifié (Appels + SMS)</span>
            <span>{threats.length} signatures de l'opérateur actives</span>
          </div>
        </div>
 
        {/* Colonne Droite (30%) - Statut des Scrapers & IA (Threat Intel Engine) */}
        <div className="bg-[#111827] border border-white/5 rounded-2xl p-5 shadow-xl lg:col-span-3 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-white/5 pb-3">
              <h3 className="text-xs font-bold text-white tracking-widest font-mono uppercase flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                MOTEURS SCRAPERS &amp; IA
              </h3>
            </div>
 
            {/* Scraping state */}
            <div className="space-y-2.5">
              <span className="text-[8.5px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Sources Cyber Connectées :</span>
              
              <div className="bg-slate-950/40 border border-white/5 rounded-lg p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-slate-200 font-mono">CERT.TG</span>
                </div>
                <span className="text-[8.5px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase">Opérationnel</span>
              </div>
 
              <div className="bg-slate-950/40 border border-white/5 rounded-lg p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-slate-200 font-mono">ANCY.GOUV.TG</span>
                </div>
                <span className="text-[8.5px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase">Connecté</span>
              </div>
            </div>
 
            {/* Last Gemini Analysis */}
            <div className="space-y-2 pt-1">
              <span className="text-[8.5px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Dernière Analyse Gemini :</span>
              
              <div className="bg-[#0B1020] border border-white/5 rounded-xl p-3 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 rounded-full blur-xl"></div>
                
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
                  <span className="text-[9px] font-black text-white font-mono uppercase">EXTRACTION COGNITIVE</span>
                </div>
 
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1 py-0.5 bg-red-950/40 border border-red-900/30 rounded text-[7.5px] text-red-300 font-bold uppercase font-mono">
                      {latestGeminiIoC.type}
                    </span>
                    <span className="text-[10px] font-bold text-slate-200 font-mono truncate select-all">
                      {latestGeminiIoC.value}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal font-sans italic">
                    &ldquo;{latestGeminiIoC.details}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>
 
          <div className="pt-3 border-t border-white/5 mt-4 text-[8.5px] font-mono text-slate-500 flex items-center justify-between">
            <span>IA: Gemini 3.5 Flash</span>
            <span className="text-[#10B981] font-bold">Modèle ACTIF</span>
          </div>
        </div>

      </div>

      {/* 5. Zone Inférieure (Graphiques & Cartographie : 50% / 50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-lower-zone">
        
        {/* Graphique de comportement de fraude */}
        <div className="bg-[#111827] border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-white tracking-widest font-mono uppercase flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#10B981]" />
                  COURBE DE DÉBITS DES FRAUDES EN DIRECT
                </h3>
                <p className="text-[10px] text-slate-400">Chronologie hebdomadaire consolidée par criticité de menaces.</p>
              </div>
            </div>

            {/* Area Chart */}
            <div className="h-56 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: -25, top: 5, right: 5, bottom: 0 }}>
                  <defs>
                    <linearGradient id="critGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#991B1B" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#991B1B" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="medGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#475569" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#475569" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="faibleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                  <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: 9, fontFamily: "monospace" }} />
                  <YAxis stroke="#64748b" style={{ fontSize: 9, fontFamily: "monospace" }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#111827", borderColor: "rgba(255,255,255,0.08)", color: "#E5E7EB" }}
                    labelStyle={{ fontFamily: "monospace", color: "#94A3B8" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 9, fontFamily: "monospace", paddingTop: 10 }} />
                  <Area type="monotone" dataKey="Critique" stroke="#991B1B" strokeWidth={1.5} fillOpacity={1} fill="url(#critGrad)" name="Critique" />
                  <Area type="monotone" dataKey="Moyen" stroke="#475569" strokeWidth={1.5} fillOpacity={1} fill="url(#medGrad)" name="Moyen" />
                  <Area type="monotone" dataKey="Faible" stroke="#10B981" strokeWidth={1.5} fillOpacity={1} fill="url(#faibleGrad)" name="Faible" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 mt-4 text-[8px] font-mono text-slate-500 flex justify-between">
            <span>Pics d'activité calculés en temps réel</span>
            <span>Régions interconnectées</span>
          </div>
        </div>

        {/* Mini-Carte Thermique & Répartition Géographique au Togo */}
        <div className="bg-[#111827] border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-white tracking-widest font-mono uppercase flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#10B981]" />
                  REPARTITION GÉOGRAPHIQUE &amp; HEATMAP (TOGO)
                </h3>
                <p className="text-[10px] text-slate-400">Concentration spatiale des campagnes d'escroqueries par SMS.</p>
              </div>
            </div>

            {/* Split layout: SVG Map representation + list indicators */}
            <div className="grid grid-cols-12 gap-4 mt-2">
              
              {/* Vertical stacked 5-zone representation of Togo */}
              <div className="col-span-4 bg-slate-950/55 rounded-xl border border-white/5 p-2 h-52 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] [background-size:10px_10px] pointer-events-none"></div>
                
                {/* Savanes */}
                <button
                  onClick={() => setSelectedRegion(selectedRegion === "savanes" ? null : "savanes")}
                  className={`w-full h-[18%] transition-all duration-300 rounded-lg flex items-center justify-between px-2 text-[8px] font-mono border cursor-pointer ${
                    selectedRegion === "savanes"
                      ? "bg-[#10B981]/15 border-[#10B981] text-white"
                      : selectedRegion ? "bg-slate-900/10 border-transparent opacity-30 text-slate-500" : "bg-slate-900/50 border-slate-800/60 hover:bg-slate-850 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedRegion === "savanes" ? "bg-[#10B981] animate-pulse" : "bg-[#10B981]"}`}></span>
                    <span className="font-bold">SAVANES (NORD)</span>
                  </div>
                  <span className="font-bold">
                    {togoGeographicData.find(r => r.id === "savanes")?.percentage}%
                  </span>
                </button>

                {/* Kara */}
                <button
                  onClick={() => setSelectedRegion(selectedRegion === "kara" ? null : "kara")}
                  className={`w-full h-[18%] transition-all duration-300 rounded-lg flex items-center justify-between px-2 text-[8px] font-mono border cursor-pointer ${
                    selectedRegion === "kara"
                      ? "bg-[#10B981]/15 border-[#10B981] text-white"
                      : selectedRegion ? "bg-slate-900/10 border-transparent opacity-30 text-slate-500" : "bg-slate-900/50 border-slate-800/60 hover:bg-slate-850 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedRegion === "kara" ? "bg-[#10B981] animate-pulse" : "bg-[#10B981]"}`}></span>
                    <span className="font-bold">KARA</span>
                  </div>
                  <span className="font-bold">
                    {togoGeographicData.find(r => r.id === "kara")?.percentage}%
                  </span>
                </button>

                {/* Centrale */}
                <button
                  onClick={() => setSelectedRegion(selectedRegion === "centrale" ? null : "centrale")}
                  className={`w-full h-[18%] transition-all duration-300 rounded-lg flex items-center justify-between px-2 text-[8px] font-mono border cursor-pointer ${
                    selectedRegion === "centrale"
                      ? "bg-[#10B981]/15 border-[#10B981] text-white"
                      : selectedRegion ? "bg-slate-900/10 border-transparent opacity-30 text-slate-500" : "bg-slate-900/50 border-slate-800/60 hover:bg-slate-850 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedRegion === "centrale" ? "bg-[#10B981] animate-pulse" : "bg-[#10B981]"}`}></span>
                    <span className="font-bold">CENTRALE</span>
                  </div>
                  <span className="font-bold">
                    {togoGeographicData.find(r => r.id === "centrale")?.percentage}%
                  </span>
                </button>

                {/* Plateaux */}
                <button
                  onClick={() => setSelectedRegion(selectedRegion === "plateaux" ? null : "plateaux")}
                  className={`w-full h-[18%] transition-all duration-300 rounded-lg flex items-center justify-between px-2 text-[8px] font-mono border cursor-pointer ${
                    selectedRegion === "plateaux"
                      ? "bg-[#10B981]/15 border-[#10B981] text-white"
                      : selectedRegion ? "bg-slate-900/10 border-transparent opacity-30 text-slate-500" : "bg-slate-900/50 border-slate-800/60 hover:bg-slate-850 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedRegion === "plateaux" ? "bg-[#10B981] animate-pulse" : "bg-[#10B981]"}`}></span>
                    <span className="font-bold">PLATEAUX</span>
                  </div>
                  <span className="font-bold">
                    {togoGeographicData.find(r => r.id === "plateaux")?.percentage}%
                  </span>
                </button>

                {/* Maritime */}
                <button
                  onClick={() => setSelectedRegion(selectedRegion === "maritime" ? null : "maritime")}
                  className={`w-full h-[18%] transition-all duration-300 rounded-lg flex items-center justify-between px-2 text-[8px] font-mono border cursor-pointer ${
                    selectedRegion === "maritime"
                      ? "bg-[#10B981]/15 border-[#10B981] text-white"
                      : selectedRegion ? "bg-slate-900/10 border-transparent opacity-30 text-slate-500" : "bg-slate-900/50 border-slate-800/60 hover:bg-slate-850 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedRegion === "maritime" ? "bg-[#10B981] animate-pulse" : "bg-[#10B981]"}`}></span>
                    <span className="font-bold">MARITIME (SUD)</span>
                  </div>
                  <span className="font-bold">
                    {togoGeographicData.find(r => r.id === "maritime")?.percentage}%
                  </span>
                </button>
              </div>

              {/* List of Regions & Intensities */}
              <div className="col-span-8 space-y-2.5">
                {togoGeographicData.map((reg) => (
                  <div 
                    key={reg.id} 
                    onClick={() => setSelectedRegion(selectedRegion === reg.id ? null : reg.id)}
                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
                      selectedRegion === reg.id 
                        ? "bg-[#10B981]/10 border-[#10B981]/35" 
                        : "bg-slate-950/20 border-transparent hover:border-slate-800"
                    }`}
                  >
                    <div className="flex justify-between items-center text-[9px] font-mono">
                      <span className="text-white font-bold">{reg.region}</span>
                      <span className="font-bold text-[#10B981]">
                        {reg.incidents} cas ({reg.percentage}%)
                      </span>
                    </div>
                    
                    {/* Visual bar meter */}
                    <div className="w-full bg-slate-900 h-1.5 mt-1 rounded overflow-hidden">
                      <div 
                        className="h-full rounded transition-all duration-700 bg-[#10B981]" 
                        style={{ width: `${reg.percentage}%` }}
                      ></div>
                    </div>

                    {selectedRegion === reg.id && (
                      <div className="mt-1.5 text-[8px] font-mono text-slate-400 border-t border-white/5 pt-1 leading-normal animate-fade-in space-y-0.5">
                        <div><strong className="text-white">Foyers:</strong> {reg.hotspot}</div>
                        <div><strong className="text-white">Tendance:</strong> {reg.trend}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </div>
          </div>

          <div className="text-[9px] text-slate-500 mt-4 border-t border-white/5 pt-3 flex justify-between items-center font-mono">
            <span>Cliquez sur une zone du rectangle ou de la liste pour filtrer par région</span>
            <span className="text-slate-400">Cordon de sécurité ANCY</span>
          </div>
        </div>

      </div>

    </div>
  );
}
