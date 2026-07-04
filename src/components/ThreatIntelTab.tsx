import React, { useState } from "react";
import { 
  Rss, 
  Cpu, 
  CheckCircle, 
  Sparkles, 
  Terminal, 
  FolderPlus, 
  AlertOctagon, 
  Trash2,
  Calendar,
  Filter,
  FileText,
  ChevronDown,
  Terminal as TerminalIcon,
  Layers,
  Search,
  Check,
  AlertTriangle
} from "lucide-react";
import { ScrapedArticle } from "../types";

interface Props {
  scrapedArticles: ScrapedArticle[];
  fetchingFeed: boolean;
  onRefreshFeeds: () => void;
  onAIAnalyzeArticle: (articleId: string) => Promise<any>;
  onAddIoCToDatabase: (type: string, value: string, severity: string, details: string) => void;
  onDeleteArticle?: (id: string) => void;
  totalDeletedCount?: number;
  onResetDeleted?: () => void;
  lastScrapLogs?: string[];
  lastScrapSummary?: {
    sourcesAnalyzed: number;
    articlesFound: number;
    newArticles: number;
    duplicatesIgnored: number;
  } | null;
}

export default function ThreatIntelTab({ 
  scrapedArticles, 
  fetchingFeed, 
  onRefreshFeeds, 
  onAIAnalyzeArticle,
  onAddIoCToDatabase,
  onDeleteArticle,
  totalDeletedCount = 0,
  onResetDeleted,
  lastScrapLogs = [],
  lastScrapSummary = null
}: Props) {
  
  // Loading state for scraping article actions
  const [processingArticles, setProcessingArticles] = useState<Record<string, boolean>>({});
  const [showConsole, setShowConsole] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Clean, proper date filtering state for intelligence feeds matching user request
  // Preset options: 'all', 'today', '7d', '30d', '90d', '1y', 'custom'
  const [datePreset, setDatePreset] = useState<"all" | "today" | "7d" | "30d" | "90d" | "1y" | "custom">("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const processArticle = async (id: string) => {
    setProcessingArticles(prev => ({ ...prev, [id]: true }));
    try {
      await onAIAnalyzeArticle(id);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingArticles(prev => ({ ...prev, [id]: false }));
    }
  };

  // Custom high-fidelity sifting logic for live exfiltrations matching exact requirements
  const filteredArticles = scrapedArticles.filter(article => {
    // Basic text search filter
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchText = `${article.title} ${article.snippet} ${article.source} ${article.fullText}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    const articleDate = new Date(article.date);
    const now = new Date();

    if (datePreset === "today") {
      // Compare calendar date
      const isToday = articleDate.toDateString() === now.toDateString();
      // Or fallback to last 24h
      const diffMs = now.getTime() - articleDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return isToday || diffHours <= 24;
    }
    if (datePreset === "7d") {
      const diffMs = now.getTime() - articleDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    }
    if (datePreset === "30d") {
      const diffMs = now.getTime() - articleDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays <= 30;
    }
    if (datePreset === "90d") {
      const diffMs = now.getTime() - articleDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays <= 90;
    }
    if (datePreset === "1y") {
      const diffMs = now.getTime() - articleDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays <= 365;
    }
    if (datePreset === "custom") {
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (articleDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (articleDate > end) return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6 leading-relaxed">
      
      {/* Exfiltration automatic engine (cert.tg, ancy.gouv.tg) */}
      <div className="space-y-6 animate-fade-in text-xs font-mono">
        <div className="bg-[#111827]/90 border border-white/5 rounded-xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#10B981]/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Rss className="w-4.5 h-4.5 text-[#10B981] animate-pulse" />
                EXFILTRATION CYBER AUTOMATISÉE EN DIRECT (CERT.TG &amp; ANCY)
              </h3>
              <p className="text-[11px] text-[#94A3B8] mt-1 font-sans">
                Détection en temps réel, exfiltration WordPress/HTML et extraction d&apos;IoCs (signatures de phishing, Tmoney, Flooz, banques).
              </p>
            </div>
          </div>

          {/* Temporal filter and Scrap action bar */}
          <div className="mt-5 p-4 bg-[#0B1020]/45 rounded-xl border border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Left: Date Preset Intervals matching user constraints */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest flex items-center gap-1.5 mr-1">
                <Filter className="w-3.5 h-3.5 text-[#10B981]" />
                INTERVALLE DE RECHERCHE :
              </span>
              
              <div className="flex flex-wrap bg-slate-900/95 rounded-lg p-0.5 border border-white/5">
                {[
                  { value: "all", label: "Toutes" },
                  { value: "today", label: "Aujourd'hui" },
                  { value: "7d", label: "7 jours" },
                  { value: "30d", label: "30 jours" },
                  { value: "90d", label: "90 jours" },
                  { value: "1y", label: "1 an" },
                  { value: "custom", label: "Perso 📅" }
                ].map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setDatePreset(preset.value as any)}
                    className={`px-2.5 py-1.5 rounded text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer ${
                      datePreset === preset.value 
                        ? "bg-[#10B981] text-white shadow-sm font-black" 
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Collapsible custom date bounds */}
              {datePreset === "custom" && (
                <div className="flex flex-wrap items-center gap-2 animate-fade-in">
                  <div className="flex items-center gap-2 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-white/5">
                    <span className="text-[9px] text-slate-500 uppercase">Du</span>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-transparent border-none text-white text-[11px] font-mono focus:outline-none w-28 [color-scheme:dark]"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-white/5">
                    <span className="text-[9px] text-slate-500 uppercase">Au</span>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-transparent border-none text-white text-[11px] font-mono focus:outline-none w-28 [color-scheme:dark]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right: Refresh action and live feedback count */}
            <div className="flex items-center justify-between lg:justify-end gap-4 w-full lg:w-auto mt-2 lg:mt-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-white/5">
              <div className="text-[10px] font-mono text-slate-400 shrink-0">
                Affiche <span className="text-white font-bold">{filteredArticles.length}</span> alertes
              </div>
              
              <button 
                onClick={onRefreshFeeds}
                disabled={fetchingFeed}
                className="px-4 py-2 bg-[#10B981] hover:bg-[#10B981]/90 active:bg-emerald-700 disabled:bg-slate-900 disabled:text-slate-500 text-white rounded-lg text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-2 shrink-0 transition cursor-pointer shadow-sm border border-white/5"
              >
                {fetchingFeed ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    EXFILTRATION EN COURS...
                  </>
                ) : (
                  <>
                    <Rss className="w-3.5 h-3.5" />
                    EXFILTRER EN DIRECT
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Scraper Terminal Console Visualizer (Requirement 10 & 11) */}
          {(fetchingFeed || lastScrapLogs.length > 0) && (
            <div className="mt-5 bg-slate-950/90 rounded-xl border border-slate-800/80 overflow-hidden shadow-2xl animate-fade-in">
              <div className="bg-[#0B1020] px-4 py-2.5 border-b border-slate-800/80 flex items-center justify-between">
                <span className="font-mono text-[10px] text-emerald-400 flex items-center gap-2 font-bold">
                  <TerminalIcon className="w-3.5 h-3.5 animate-pulse" />
                  SÉQUENCEUR DE COLLECTE CYBER (LOGS EN DIRECT)
                </span>
                <div className="flex items-center gap-2">
                  {lastScrapSummary && (
                    <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded uppercase font-bold">
                      EXFILTRATION TERMINÉE
                    </span>
                  )}
                  <button 
                    onClick={() => setShowConsole(!showConsole)}
                    className="text-slate-500 hover:text-white text-[9px] uppercase font-mono px-2 py-0.5 rounded hover:bg-white/5"
                  >
                    {showConsole ? "Masquer [X]" : "Afficher [O]"}
                  </button>
                </div>
              </div>

              {showConsole && (
                <div className="p-4 space-y-1.5 max-h-56 overflow-y-auto font-mono text-[10px] leading-relaxed text-slate-300 bg-[#020617]/95">
                  {fetchingFeed && lastScrapLogs.length === 0 ? (
                    <div className="text-slate-400 italic py-2 animate-pulse" key="loading-msg">
                      [INFO] Lancement de l&apos;exfiltration... Requête vers les serveurs gouvernementaux togolais...
                    </div>
                  ) : (
                    lastScrapLogs.map((log, index) => {
                      let logClass = "text-slate-400";
                      if (log.includes("[SUCCESS]")) logClass = "text-emerald-400 font-bold";
                      if (log.includes("[WARN]")) logClass = "text-amber-400";
                      if (log.includes("[ERROR]")) logClass = "text-rose-500 font-bold";
                      if (log.includes("[SUMMARY]")) logClass = "text-cyan-400 font-bold border-t border-slate-800/50 pt-1.5 mt-1.5";
                      
                      return (
                        <div key={`log-${index}`} className={logClass}>
                          {log}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* High-fidelity summary cards mapping Requirement 3 */}
              {lastScrapSummary && (
                <div className="grid grid-cols-2 md:grid-cols-4 border-t border-slate-800/80 bg-slate-950/50 text-center text-[10px] font-mono divide-x divide-slate-800/80">
                  <div className="p-3">
                    <span className="text-slate-500 uppercase block text-[8px]">Sources analysées</span>
                    <span className="text-white font-bold text-xs mt-0.5 block">{lastScrapSummary.sourcesAnalyzed}</span>
                  </div>
                  <div className="p-3">
                    <span className="text-slate-500 uppercase block text-[8px]">Articles identifiés</span>
                    <span className="text-white font-bold text-xs mt-0.5 block">{lastScrapSummary.articlesFound}</span>
                  </div>
                  <div className="p-3 bg-emerald-500/5">
                    <span className="text-emerald-500/80 uppercase block text-[8px] font-bold">Nouveaux articles</span>
                    <span className="text-emerald-400 font-black text-xs mt-0.5 block">+{lastScrapSummary.newArticles}</span>
                  </div>
                  <div className="p-3">
                    <span className="text-slate-500 uppercase block text-[8px]">Doublons ignorés</span>
                    <span className="text-slate-400 font-medium text-xs mt-0.5 block">{lastScrapSummary.duplicatesIgnored}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {totalDeletedCount > 0 && onResetDeleted && (
            <div className="mt-5 px-4 py-3 bg-red-500/10 border border-[#EF4444]/20 rounded-xl flex items-center justify-between text-xs text-slate-300">
              <span className="font-mono flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-[#EF4444]" />
                <span><strong>{totalDeletedCount}</strong> annonce{totalDeletedCount > 1 ? "s" : ""} masquée{totalDeletedCount > 1 ? "s" : ""} de l&apos;espace de travail actif.</span>
              </span>
              <button
                onClick={onResetDeleted}
                className="px-3 py-1.5 bg-[#10B981] hover:bg-[#10B981]/90 text-white rounded text-[10px] font-bold uppercase tracking-wider font-mono transition cursor-pointer"
              >
                Tout réafficher
              </button>
            </div>
          )}

          {/* Quick filter text box */}
          <div className="mt-4 flex items-center gap-2 bg-[#0B1020]/30 px-3 py-2 rounded-lg border border-white/5">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <input 
              type="text"
              placeholder="Filtrer par mot-clé (ex: tmoney, arcep, flooz, ceet)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-white border-none w-full focus:outline-none placeholder-slate-650 text-[11px] font-mono"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="text-slate-500 hover:text-white text-[9px] uppercase font-mono px-1 bg-white/5 rounded"
              >
                Vider
              </button>
            )}
          </div>

          {/* List of articles */}
          <div className="mt-6 grid grid-cols-1 gap-6">
            {filteredArticles.length === 0 ? (
              <div className="text-center p-12 border border-dashed border-white/5 bg-[#0B1020]/20 rounded-xl">
                <Calendar className="w-7 h-7 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 uppercase tracking-wide text-[11px] font-mono">Aucune annonce trouvée pour cet intervalle ou mot-clé</p>
                <p className="text-slate-600 text-[10px] mt-1 font-sans">Veuillez élargir votre sélection ou cliquer sur &quot;Exfiltrer en direct&quot;.</p>
              </div>
            ) : (
              filteredArticles.map((article) => (
                <div key={article.id} className="bg-[#0B1020]/45 border border-white/5 rounded-xl overflow-hidden shadow-sm grid grid-cols-1 xl:grid-cols-12 hover:border-white/10 transition">
                  
                  {/* Left Column: Article basic */}
                  <div className="p-5 xl:col-span-7 flex flex-col justify-between border-b xl:border-b-0 xl:border-r border-white/5">
                    <div>
                      <div className="flex items-center justify-between mb-3 gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-mono font-bold border ${
                            article.source === "CERT.TG" 
                              ? "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/25" 
                              : article.source === "ANCY.GOUV.TG"
                              ? "bg-slate-800 text-slate-300 border border-slate-700"
                              : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          }`}>
                            {article.source}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            {new Date(article.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        
                        {onDeleteArticle && (
                          <button
                            onClick={() => {
                              if (confirm("Voulez-vous masquer cette annonce de l'espace de travail ?")) {
                                onDeleteArticle(article.id);
                              }
                            }}
                            className="text-slate-500 hover:text-rose-500 transition-colors uppercase font-mono font-bold text-[9px] flex items-center gap-1.5 px-2 py-1 bg-red-500/5 hover:bg-red-500/10 rounded-md border border-white/5 cursor-pointer hover:border-rose-500/30"
                            title="Supprimer l'annonce"
                          >
                            <Trash2 className="w-3 h-3" />
                            Masquer
                          </button>
                        )}
                      </div>
                      
                      <h4 className="text-xs font-bold text-white tracking-wider mb-2 font-mono uppercase leading-relaxed">{article.title}</h4>
                      <p className="text-[11px] text-[#94A3B8] leading-relaxed font-sans">{article.snippet}</p>
 
                      {/* Associated downloaded PDFs matching Requirement 9 */}
                      {article.pdfUrl && (
                        <div className="mt-3.5 p-2.5 bg-[#EF4444]/5 border border-[#EF4444]/10 rounded-lg flex items-center justify-between">
                          <span className="text-[10px] text-slate-300 font-sans flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[#EF4444]" />
                            <span>Document officiel joint (PDF téléchargé localement)</span>
                          </span>
                          <a 
                            href={article.pdfUrl} 
                            target="_blank" 
                            referrerPolicy="no-referrer"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-white rounded text-[9px] font-mono font-black uppercase transition-all flex items-center gap-1"
                          >
                            Ouvrir le PDF
                          </a>
                        </div>
                      )}
                    </div>
 
                    <div className="mt-5 pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[10px] font-mono">
                      <span className="text-slate-500 truncate max-w-xs">{article.sourceUrl}</span>
                      
                      {/* Processing status or trigger button */}
                      {article.processed ? (
                        <span className="text-[#10B981] font-mono font-bold flex items-center gap-1.5 shrink-0 bg-[#10B981]/15 px-2 py-1 rounded border border-[#10B981]/25 uppercase text-[9px]">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Classifié par l&apos;IA du SOC
                        </span>
                      ) : (
                        <button 
                          onClick={() => processArticle(article.id)}
                          disabled={processingArticles[article.id]}
                          className="px-3 py-1.5 bg-[#10B981]/10 hover:bg-[#10B981] text-[#10B981] hover:text-white border border-[#10B981]/25 font-mono text-[10px] font-bold uppercase rounded transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          {processingArticles[article.id] ? (
                            <>
                              <span className="w-3 h-3 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin"></span>
                              Traitement...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 text-[#10B981]" />
                              Analyser par l&apos;IA
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
 
                  {/* Right Column: AI Extraction and action push to Database */}
                  <div className="p-5 xl:col-span-5 bg-[#0B1020]/25 flex flex-col justify-between">
                    {article.processed && article.analysis ? (
                      <div className="space-y-4 h-full flex flex-col justify-between">
                        <div>
                          <p className="text-[9px] font-mono text-slate-500 uppercase font-bold flex items-center gap-1">
                            <Cpu className="w-3.5 h-3.5 text-[#10B981]" />
                            INTELLIGENCE COGNITIVE DE MENACE (IoC)
                          </p>
                          
                          {/* Dynamic AI Briefing (proven exfiltration) */}
                          {article.analysis.briefing && (
                            <div className="mt-2.5 p-2.5 bg-[#10B981]/5 rounded-lg border border-[#10B981]/15">
                              <span className="text-[8px] font-bold text-[#10B981] font-mono flex items-center gap-1 uppercase">
                                <Sparkles className="w-3.5 h-3.5" /> RÉSUMÉ DÉLIBÉRÉ DE L&apos;IA :
                              </span>
                              <p className="text-[10px] text-slate-200 mt-1 font-sans leading-relaxed italic">
                                &ldquo;{article.analysis.briefing}&rdquo;
                              </p>
                            </div>
                          )}

                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-[#0B1020]/70 p-2 rounded border border-white/5">
                              <span className="text-[9px] text-slate-500 font-mono block uppercase">Catégorie</span>
                              <span className="text-white font-mono font-bold text-[10px] block mt-0.5">{article.analysis.category}</span>
                            </div>
                            <div className="bg-[#0B1020]/70 p-2 rounded border border-white/5 border-dashed">
                              <span className="text-[9px] text-slate-500 font-mono block uppercase">Pertinence Togo</span>
                              <span className="text-[#94A3B8] font-sans text-[9.5px] line-clamp-3 block leading-snug">{article.analysis.togoRelevance}</span>
                            </div>
                          </div>

                          {/* Actionable signature indicators or safe news badge (Requirement 13) */}
                          <div className="mt-3">
                            <span className="text-[9px] text-slate-500 font-mono font-bold uppercase block mb-2">Signatures identifiées par l&apos;IA :</span>
                            {article.analysis.detectedMaliciousIndicators.length > 0 ? (
                              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                {article.analysis.detectedMaliciousIndicators.map((ioc, idx) => (
                                  <div key={idx} className="bg-[#0B1020] border border-white/5 rounded p-2 flex items-center justify-between text-xs">
                                    <div className="font-mono flex items-center gap-2 truncate">
                                      <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold border ${ioc.type === "domain" ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20" : "bg-slate-800 text-slate-300 border border-slate-700"}`}>
                                        {ioc.type}
                                      </span>
                                      <span className="text-white truncate font-bold">{ioc.valeur}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className={`px-1 rounded text-[8px] uppercase font-bold ${ioc.severity === "Critical" ? "bg-red-950/40 text-red-300" : "bg-slate-800 text-slate-300"}`}>
                                        {ioc.severity}
                                      </span>
                                      <button 
                                        onClick={() => onAddIoCToDatabase(ioc.type, ioc.valeur, ioc.severity, `Signatures SOC issue du bulletin ${article.source}: ${ioc.description}`)}
                                        className="px-1.5 py-0.5 bg-[#10B981] hover:bg-[#10B981]/90 text-white font-mono text-[8px] font-bold uppercase rounded flex items-center gap-1 transition cursor-pointer"
                                        title="Ajouter immédiatement à la base active"
                                      >
                                        <FolderPlus className="w-2.5 h-2.5" />
                                        PUSH
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-center space-y-1">
                                <span className="text-[10px] font-mono font-black text-[#10B981] block uppercase">
                                  ✅ AUCUNE SIGNATURE MALVEILLANTE
                                </span>
                                <p className="text-[9px] text-slate-400 leading-normal font-sans">
                                  Cette annonce ne contient pas de marqueurs d&apos;attaque actifs (phishing ou faux numéros). Utile pour l&apos;information et la veille passive.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <span className="text-[9px] font-mono text-[#10B981] uppercase font-bold block mt-3">Prêt pour la synchronisation immédiate avec l&apos;application mobile</span>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <TerminalIcon className="w-7 h-7 text-slate-700 mb-2 animate-pulse" />
                        <span className="text-xs text-slate-500 font-mono uppercase">Attente de l&apos;analyse IA</span>
                        <p className="text-[10px] text-slate-600 font-mono mt-1 uppercase">Appuyez sur &quot;Analyser par l&apos;IA&quot; pour extraire les indicateurs de menace</p>
                      </div>
                    )}
                  </div>

                </div>
              )))}
          </div>
        </div>
      </div>

    </div>
  );
}
