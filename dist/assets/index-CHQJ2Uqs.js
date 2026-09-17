import{D as me}from"./dexie-BoEa_wtx.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))t(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const r of i.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&t(r)}).observe(document,{childList:!0,subtree:!0});function s(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function t(n){if(n.ep)return;n.ep=!0;const i=s(n);fetch(n.href,i)}})();class ge{routes={};currentRoute="";constructor(){window.addEventListener("hashchange",()=>this.handleHashChange())}addRoute(e,s){this.routes[e]=s}navigate(e){window.location.hash=e}init(){this.handleHashChange()}handleHashChange(){const e=window.location.hash||"#/pointage";this.currentRoute=e;const[s,t]=e.split("?"),n={};t&&new URLSearchParams(t).forEach((c,o)=>{n[o]=c});const i=this.routes[s];if(i)i(s,n);else{const r=this.routes["#/pointage"];r&&r("#/pointage",n)}}getCurrentRoute(){return this.currentRoute}}const h={appName:"Prise de Présences",appSubtitle:"Application PWA hors ligne",nav:{pointage:"Pointage",jour:"Aujourd'hui",eleves:"Élèves",historique:"Historique",parametres:"Paramètres"},types:{presence:"Entraînement",course:"Course"},header:{dateWarning:"Attention : pointage sur une date passée !",resetFilters:"Réinitialiser",searchPlaceholder:"Rechercher par prénom ou nom...",allYears:"Toutes",allLetters:"Toutes",activeOnly:"Actifs uniquement",includeInactive:"Inclure inactifs"},actions:{add:"Ajouter",addStudent:"Ajouter un élève",edit:"Modifier",delete:"Désactiver",save:"Enregistrer",cancel:"Annuler",close:"Fermer",confirm:"Confirmer",syncNow:"Synchroniser maintenant",exportExcel:"Exporter (.xlsx)",importExcel:"Importer (.xlsx, .csv)",downloadTemplate:"Gabarit d'import",backupJson:"Sauvegarder (.json)",restoreJson:"Restaurer (.json)",copySummary:"Copier le résumé",copiedSuccess:"Résumé copié dans le presse-papier !",updateApp:"Mettre à jour l'application",downloadLog:"Journal des événements"},student:{lastName:"Nom",firstName:"Prénom",gender:"Sexe",female:"Fille (F)",male:"Garçon (M)",year:"Année scolaire / Classe",activeStatus:"Statut",active:"Actif",inactive:"Inactif",notes:"Remarques / Notes",presencesCount:"Entraînements",coursesCount:"Courses",totalCount:"Total participations",lastSeen:"Dernière venue",never:"Aucune",duplicateWarning:"Attention : un élève similaire existe déjà (même nom, prénom et année)."},stats:{total:"Total",girls:"Filles",boys:"Garçons",breakdownByYear:"Répartition par année",noAttendanceToday:"Aucun pointage pour cette journée.",longPressHint:"Appui long pour annuler un pointage.",tabByStudent:"Par élève",tabByDate:"Par date",periodAll:"Tout",periodMonth:"Ce mois",periodSchoolYear:"Cette année scolaire"},sync:{synced:"Synchronisé",pending:"Modifications en attente ({count})",offline:"Hors ligne",lastSync:"Dernière synchronisation :",syncUrl:"URL Google Apps Script",syncToken:"Jeton de sécurité (Token)",deviceName:"Nom de l'appareil",syncSuccess:"Synchronisation réussie !",syncError:"Échec de la synchronisation.",configureFirst:"Veuillez configurer l'URL et le jeton dans les Paramètres."},import:{title:"Import d'élèves depuis Excel / CSV",step1:"1. Sélection du fichier",step2:"2. Correspondance des colonnes",step3:"3. Aperçu et gestion des doublons",step4:"4. Confirmation et rapport",dropZone:"Glissez un fichier .xlsx, .xls ou .csv ici, ou cliquez pour parcourir",strategyIgnore:"Ignorer les doublons",strategyUpdate:"Mettre à jour l'année et le sexe",createdCount:"Élèves créés :",updatedCount:"Élèves mis à jour :",skippedCount:"Lignes ignorées :",errorCount:"Lignes en erreur :"},pwa:{updateAvailable:"Une nouvelle version de l'application est disponible.",offlineReady:"L'application est prête à fonctionner hors ligne."}},se="Europe/Brussels";function T(){return be(new Date)}function be(a){const e=new Date(a),t=new Intl.DateTimeFormat("fr-BE",{timeZone:se,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(e),n=t.find(c=>c.type==="day")?.value||"01",i=t.find(c=>c.type==="month")?.value||"01";return`${t.find(c=>c.type==="year")?.value||"2026"}-${i}-${n}`}function _(a){const e=new Date(a);return new Intl.DateTimeFormat("fr-BE",{timeZone:se,hour:"2-digit",minute:"2-digit",hour12:!1}).format(e)}function D(a){if(!a)return"";const[e,s,t]=a.split("-").map(Number),n=new Date(Date.UTC(e,s-1,t,12,0,0));return new Intl.DateTimeFormat("fr-BE",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(n)}function xe(a){const e=parseInt(a.substring(0,4),10),s=parseInt(a.substring(5,7),10);let t=e;return s<9&&(t=e-1),{start:`${t}-09-01`,end:`${t+1}-08-31`}}function we(a){const e=parseInt(a.substring(0,4),10),s=parseInt(a.substring(5,7),10),t=new Date(e,s,0).getDate(),n=s.toString().padStart(2,"0"),i=t.toString().padStart(2,"0");return{start:`${e}-${n}-01`,end:`${e}-${n}-${i}`}}function ae(a){const e=document.documentElement;a==="presence"?(e.style.setProperty("--accent-active","var(--accent-presence)"),e.style.setProperty("--accent-active-light","var(--accent-presence-light)"),e.style.setProperty("--accent-active-glow","var(--accent-presence-glow)")):(e.style.setProperty("--accent-active","var(--accent-course)"),e.style.setProperty("--accent-active-light","var(--accent-course-light)"),e.style.setProperty("--accent-active-glow","var(--accent-course-glow)"))}function Se(a){ae(a.type);const e=T(),s=a.date<e;let t=h.sync.synced,n="synced";a.syncStatus==="pending"?(t=h.sync.pending.replace("{count}",a.pendingCount.toString()),n="pending"):a.syncStatus==="offline"&&(t=h.sync.offline,n="offline");const i=a.daySummary||{total:0,girls:0,boys:0,internals:0};return`
    <header class="app-header">
      ${s&&a.showTopo?`<div class="past-date-banner">${h.header.dateWarning}</div>`:""}

      <div class="header-top" style="${a.showTopo?"":"margin-bottom: 0;"}">
        <div class="header-title">
          <span>${h.appName}</span>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <button class="sync-indicator ${n}" id="header-sync-btn" title="État de la synchronisation">
            <span class="sync-dot"></span>
            <span>${t}</span>
          </button>

          <button class="btn btn-secondary" id="header-settings-btn" style="min-height: 38px; padding: 0 10px;" aria-label="${h.nav.parametres}">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>
          </button>
        </div>
      </div>

      ${a.showTopo?`
      <!-- Ligne Date réduite + Topo Total, G, F, I (Prise de présences uniquement) -->
      <div style="display: flex; gap: 8px; align-items: center; justify-content: space-between; margin-top: 4px;">
        <input type="date" id="header-date-input" value="${a.date}" class="search-input" style="width: 130px; min-height: 38px; padding: 2px 8px; font-size: 0.85rem;" />
        
        <div id="header-summary-badge" style="flex: 1; display: flex; align-items: center; justify-content: space-around; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 6px 8px; font-size: 0.8rem; font-weight: 600; white-space: nowrap; gap: 4px;">
          <span style="color: var(--accent-active); font-size: 0.88rem; font-weight: 800;">Tot: ${i.total}</span>
          <span style="color: var(--text-secondary);">G: <strong style="color: #0284c7;">${i.boys}</strong></span>
          <span style="color: var(--text-secondary);">F: <strong style="color: #db2777;">${i.girls}</strong></span>
          <span style="color: var(--text-secondary);">I: <strong style="color: #10b981;">${i.internals}</strong></span>
        </div>
      </div>
      `:""}
    </header>
  `}function $e(a,e,s,t){const n=a.querySelector("#header-date-input");n&&n.addEventListener("change",()=>{n.value&&e(n.value)});const i=a.querySelector("#header-sync-btn");i&&i.addEventListener("click",s);const r=a.querySelector("#header-settings-btn");r&&r.addEventListener("click",t)}function Le(a){const e=a==="#/pointage"||a===""||a==="#/",s=a.startsWith("#/jour"),t=a.startsWith("#/eleves"),n=a.startsWith("#/historique");return`
    <nav class="app-navbar" aria-label="Navigation principale">
      <button class="nav-item ${e?"active":""}" data-route="#/pointage" aria-label="${h.nav.pointage}">
        <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        <span>${h.nav.pointage}</span>
      </button>

      <button class="nav-item ${s?"active":""}" data-route="#/jour" aria-label="${h.nav.jour}">
        <svg viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/></svg>
        <span>${h.nav.jour}</span>
      </button>

      <button class="nav-item ${t?"active":""}" data-route="#/eleves" aria-label="${h.nav.eleves}">
        <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
        <span>${h.nav.eleves}</span>
      </button>

      <button class="nav-item ${n?"active":""}" data-route="#/historique" aria-label="${h.nav.historique}">
        <svg viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.25 2.52.77-1.28-3.52-2.09V8z"/></svg>
        <span>${h.nav.historique}</span>
      </button>
    </nav>
  `}function Ae(a,e){a.querySelectorAll(".nav-item").forEach(t=>{t.addEventListener("click",()=>{const n=t.dataset.route;n&&e(n)})})}function Ee(){if(typeof navigator<"u"&&"vibrate"in navigator)try{navigator.vibrate(40)}catch{}}let z=null;function ke(){return z||(z=document.createElement("div"),z.className="toast-container",document.body.appendChild(z)),z}function x(a,e=3e3){const s=ke(),t=document.createElement("div");t.className="toast",t.textContent=a,s.appendChild(t),setTimeout(()=>{t.style.opacity="0",t.style.transition="opacity 200ms ease-out",setTimeout(()=>{t.remove()},200)},e)}class Ie extends me{students;attendances;meta;importLog;constructor(){super("PresencesDB"),this.version(1).stores({students:"id, lastName, firstName, year, gender, active, isInternal, dirty, searchKey",attendances:"id, studentId, date, type, [date+type], [studentId+date], dirty",meta:"key",importLog:"id, date"})}}const y=new Ie;function W(){return typeof crypto<"u"&&crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,a=>{const e=Math.random()*16|0;return(a==="x"?e:e&3|8).toString(16)})}function ie(a,e,s){return`${a}_${e}_${s}`}function Ne(){return`android-device-${Math.floor(1e3+Math.random()*9e3)}`}async function k(a,e){const s=await y.meta.get(a);return!s||s.value===void 0||s.value===null?e:s.value}async function I(a,e){await y.meta.put({key:a,value:e})}async function M(){let a=await k("deviceId",null);return a||(a=Ne(),await I("deviceId",a)),a}async function C(){return await k("years",["1A","1B","2A","2B","3A","3B","4A","4B","5A","5B","6A","6B"])}async function q(a){await I("years",a)}async function Ce(a){const e=await C(),s=a.trim();return s&&!e.includes(s)&&(e.push(s),await q(e)),e}function $(a){return a?a.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," "):""}function G(a,e){const s=$(a),t=$(e);return`${s} ${t} ${t} ${s}`}async function Q(a){const e=Date.now(),s=W(),t=a.firstName.trim(),n=a.lastName.trim(),i={id:s,firstName:t,lastName:n,gender:a.gender,year:a.year.trim(),active:a.active!==void 0?a.active:!0,isInternal:a.isInternal!==void 0?a.isInternal:!1,notes:(a.notes||"").trim(),createdAt:new Date(e).toISOString(),updatedAt:e,dirty:1,searchKey:G(t,n)};return await y.students.put(i),i}async function re(a){const e=await y.students.get(a.id);if(!e)throw new Error(`Élève introuvable pour l'identifiant ${a.id}`);const s=Date.now(),t=a.firstName!==void 0?a.firstName.trim():e.firstName,n=a.lastName!==void 0?a.lastName.trim():e.lastName,i={...e,firstName:t,lastName:n,gender:a.gender!==void 0?a.gender:e.gender,year:a.year!==void 0?a.year.trim():e.year,isInternal:a.isInternal!==void 0?a.isInternal:e.isInternal||!1,notes:a.notes!==void 0?a.notes.trim():e.notes,active:a.active!==void 0?a.active:e.active,updatedAt:s,dirty:1,searchKey:G(t,n)};return await y.students.put(i),i}async function oe(a){await y.transaction("rw",[y.students,y.attendances],async()=>{await y.students.delete(a),await y.attendances.where("studentId").equals(a).delete()})}async function ze(){await y.transaction("rw",[y.students,y.attendances,y.importLog],async()=>{await y.students.clear(),await y.attendances.clear(),await y.importLog.clear()})}async function ce(a){return await y.students.get(a)}async function F(){return await y.students.toArray()}async function A(a={}){let e=await y.students.toArray();if(a.onlyActive&&(e=e.filter(s=>s.active)),a.years&&a.years.length>0&&!a.years.includes("all")){const s=a.years;e=e.filter(t=>{const n=t.year.trim();return s.some(i=>n===i||n.startsWith(i))})}if(a.query&&a.query.trim()){const s=$(a.query);e=e.filter(t=>t.searchKey.includes(s))}if(a.initialLetter&&a.initialLetter!=="ALL"){const s=a.initialLetter.toUpperCase();e=e.filter(t=>{const n=$(t.firstName).toUpperCase(),i=$(t.lastName).toUpperCase();return n.startsWith(s)||i.startsWith(s)})}return e.sort((s,t)=>{const n=s.firstName.localeCompare(t.firstName,"fr",{sensitivity:"base"});return n!==0?n:s.lastName.localeCompare(t.lastName,"fr",{sensitivity:"base"})})}async function qe(a,e,s,t){const n=$(a),i=$(e),r=s.trim();return(await y.students.toArray()).some(o=>t&&o.id===t?!1:$(o.firstName)===n&&$(o.lastName)===i&&o.year.trim()===r)}async function X(){return await y.students.where("dirty").equals(1).toArray()}async function K(a){await y.transaction("rw",y.students,async()=>{for(const e of a)await y.students.update(e,{dirty:0})})}async function Y(a,e,s,t){const n=ie(a,e,s),i=await y.attendances.get(n),r=Date.now(),c=await M(),o=t!==void 0?t:i?!i.present:!0,l={id:n,studentId:a,date:e,type:s,present:o,markedAt:r,deviceId:c,updatedAt:r,dirty:1};return await y.attendances.put(l),l}async function J(a,e){return await y.attendances.where("[date+type]").equals([a,e]).toArray()}async function De(a){return await y.attendances.where("studentId").equals(a).toArray()}async function le(){return await y.attendances.toArray()}async function ee(){return await y.attendances.where("dirty").equals(1).toArray()}async function te(a){await y.transaction("rw",y.attendances,async()=>{for(const e of a)await y.attendances.update(e,{dirty:0})})}async function Te(){await y.attendances.clear()}async function Re(a,e,s,t,n){const i={action:"push",token:e,deviceId:s,students:t,attendances:n};try{const r=await fetch(a,{method:"POST",redirect:"follow",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(i)});if(!r.ok)throw new Error(`Erreur réseau HTTP ${r.status}`);const c=await r.text();let o;try{o=JSON.parse(c)}catch{throw new Error(`Réponse invalide reçue de Google Apps Script. Vérifiez que l'accès Web App est configuré sur "Tout le monde" (Anyone).`)}if(!o.ok)throw o.error==="unauthorized"?new Error("Jeton de sécurité (Token) incorrect."):new Error(o.error||"Erreur lors du push serveur");return o}catch(r){throw r.message&&(r.message.includes("fetch")||r.message.includes("Network")||r.message.includes("Failed"))?new Error(`Impossible de contacter Google Sheets. Vérifiez que l'accès au déploiement Apps Script est réglé sur "Tout le monde" (Anyone) et que l'URL se termine par /exec.`):r}}async function He(a,e,s){const t={action:"pull",token:e,since:s};try{const n=await fetch(a,{method:"POST",redirect:"follow",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(t)});if(!n.ok)throw new Error(`Erreur réseau HTTP ${n.status}`);const i=await n.text();let r;try{r=JSON.parse(i)}catch{throw new Error(`Réponse invalide reçue de Google Apps Script. Vérifiez que l'accès Web App est configuré sur "Tout le monde" (Anyone).`)}if(!r.ok)throw r.error==="unauthorized"?new Error("Jeton de sécurité (Token) incorrect."):new Error(r.error||"Erreur lors du pull serveur");return r}catch(n){throw n.message&&(n.message.includes("fetch")||n.message.includes("Network")||n.message.includes("Failed"))?new Error(`Impossible de contacter Google Sheets. Vérifiez que l'accès au déploiement Apps Script est réglé sur "Tout le monde" (Anyone) et que l'URL se termine par /exec.`):n}}class E{static instance;isSyncing=!1;debounceTimer=null;listeners=new Set;retryDelayMs=3e4;isOnline=typeof navigator<"u"?navigator.onLine:!0;constructor(){typeof window<"u"&&(window.addEventListener("online",()=>{this.isOnline=!0,this.triggerSync("online_event")}),window.addEventListener("offline",()=>{this.isOnline=!1,this.notifyListeners()}),document.addEventListener("visibilitychange",()=>{document.visibilityState==="visible"&&this.triggerSync("visibility_change")}))}static getInstance(){return E.instance||(E.instance=new E),E.instance}subscribe(e){return this.listeners.add(e),this.notifyListeners(),()=>{this.listeners.delete(e)}}scheduleDebouncedSync(e=1e4){this.notifyListeners(),this.debounceTimer&&clearTimeout(this.debounceTimer),this.debounceTimer=setTimeout(()=>{this.triggerSync("debounced_auto")},e)}async getPendingCount(){const e=await X(),s=await ee();return e.length+s.length}async notifyListeners(){const e=await this.getPendingCount();let s="synced";this.isOnline?e>0&&(s="pending"):s="offline";for(const t of this.listeners)t(s,e)}async triggerSync(e="manual"){if(this.isSyncing)return{success:!1,message:"Synchronisation déjà en cours."};if(!this.isOnline)return this.notifyListeners(),{success:!1,message:"Appareil hors ligne."};const s=await k("syncUrl",""),t=await k("syncToken","");if(!s||!t)return this.notifyListeners(),{success:!1,message:"URL ou jeton de synchronisation non configuré."};this.isSyncing=!0;try{const n=await M(),i=await X(),r=await ee();if(i.length>0||r.length>0){const l=i.slice(0,500),u=r.slice(0,500),f=await Re(s,t,n,l,u);if(f.accepted){const v=new Set(f.accepted),m=l.filter(p=>v.has(p.id)).map(p=>p.id),d=u.filter(p=>v.has(p.id)).map(p=>p.id);await K(m),await te(d)}if(f.rejected){const v=new Set(f.rejected),m=l.filter(p=>v.has(p.id)).map(p=>p.id),d=u.filter(p=>v.has(p.id)).map(p=>p.id);await K(m),await te(d)}}const c=await k("lastPullCursor",0),o=await He(s,t,c);return(o.students||o.attendances)&&await y.transaction("rw",[y.students,y.attendances,y.meta],async()=>{if(o.students)for(const l of o.students){const u=await y.students.get(l.id);(!u||l.updatedAt>u.updatedAt)&&await y.students.put({...l,dirty:0})}if(o.attendances)for(const l of o.attendances){const u=await y.attendances.get(l.id);(!u||l.updatedAt>u.updatedAt)&&await y.attendances.put({...l,dirty:0})}o.cursor!==void 0&&await I("lastPullCursor",o.cursor),await I("lastSyncAt",Date.now())}),this.retryDelayMs=3e4,await this.notifyListeners(),{success:!0}}catch(n){return console.error(`[Sync Engine Error (${e})]:`,n),this.retryDelayMs<6e5&&(this.retryDelayMs*=4),this.notifyListeners(),{success:!1,message:n?.message||"Erreur inconnue lors de la synchronisation."}}finally{this.isSyncing=!1}}}function de(a,e,s){let t=0,n=0,i=0,r=0;const c={};for(const o of a){if(!o.present||s&&o.type!==s)continue;const l=e.get(o.studentId);if(!l)continue;t++,l.gender==="F"?n++:l.gender==="M"&&i++,l.isInternal&&r++;const u=l.year||"Non spécifiée";c[u]||(c[u]={girls:0,boys:0,internals:0,total:0}),c[u].total++,l.gender==="F"?c[u].girls++:l.gender==="M"&&c[u].boys++,l.isInternal&&c[u].internals++}return{total:t,girls:n,boys:i,internals:r,byYear:c}}function Me(a){const e=new Map;for(const s of a){if(!s.present)continue;let t=e.get(s.studentId);t||(t={studentId:s.studentId,presences:0,courses:0,total:0,lastSeen:null},e.set(s.studentId,t)),s.type==="presence"?t.presences++:s.type==="course"&&t.courses++,t.total++,(!t.lastSeen||s.date>t.lastSeen)&&(t.lastSeen=s.date)}return e}function Be(a){const e=new Set;for(const s of a){const t=s.trim();if(!t)continue;const n=t.match(/^(\d+|\D+)/),i=n?n[1]:t;e.add(i)}return Array.from(e).sort((s,t)=>{const n=parseInt(s,10),i=parseInt(t,10);return!isNaN(n)&&!isNaN(i)?n-i:s.localeCompare(t)})}function ue(a,e){const s=Be(a),t=e.length===0||e.includes("all"),n=`
    <button type="button" class="chip ${t?"active":""}" data-year="all">
      ${h.header.allYears}
    </button>
  `,i=s.map(r=>`
      <button type="button" class="chip ${!t&&e.includes(r)?"active":""}" data-year="${r}">
        ${r}
      </button>
    `).join("");return`
    <div class="chips-scroll" aria-label="Filtre par année scolaire">
      ${n}
      ${i}
    </div>
  `}function pe(a,e,s){const t=a.querySelector(".chips-scroll");if(!t)return;const n=t.querySelectorAll(".chip");n.forEach(i=>{i.addEventListener("click",r=>{r.preventDefault();const c=i.dataset.year;if(!c)return;const o=e();let l;c==="all"?l=["all"]:(l=o.filter(f=>f!=="all"),l.includes(c)?l=l.filter(f=>f!==c):l.push(c),l.length===0&&(l=["all"]));const u=l.includes("all");n.forEach(f=>{const v=f.dataset.year;v==="all"?f.classList.toggle("active",u):v&&f.classList.toggle("active",!u&&l.includes(v))}),s(l)})})}const Pe="ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");function B(a){const e=new Set;for(const s of a){const t=$(s.firstName),n=$(s.lastName);if(t.length>0){const i=t.charAt(0).toUpperCase();i>="A"&&i<="Z"&&e.add(i)}if(n.length>0){const i=n.charAt(0).toUpperCase();i>="A"&&i<="Z"&&e.add(i)}}return e}function P(a,e){const s=Pe.map(n=>{const i=a.has(n),r=e===n;let c="az-letter";return r&&(c+=" active"),i?c+=" available":c+=" disabled",`
      <button type="button" class="${c}" data-letter="${n}" ${!i&&!r?"disabled":""}>
        ${n}
      </button>
    `}).join("");return`
    <div class="az-bar" aria-label="Filtre par initiale">
      <button type="button" class="az-letter ${e==="ALL"||!e?"active":"available"}" data-letter="ALL">
        Tous
      </button>
      ${s}
    </div>
  `}function j(a,e){const s=a.querySelector(".az-bar");if(!s)return;const t=s.querySelectorAll(".az-letter");t.forEach(n=>{n.addEventListener("click",i=>{i.preventDefault();const r=n.dataset.letter||"ALL";t.forEach(c=>{c.classList.toggle("active",(c.dataset.letter||"ALL")===r)}),e(r)})})}function O(a,e,s=""){const t=a.map(n=>`
    <button type="button" class="segmented-option ${n.value===e?"active":""}" data-value="${n.value}">
      ${n.label}
    </button>
  `).join("");return`
    <div class="segmented-control ${s}">
      ${t}
    </div>
  `}function U(a,e){const s=a.querySelectorAll(".segmented-option");s.forEach(t=>{t.addEventListener("click",n=>{n.preventDefault(),n.stopPropagation();const i=t.dataset.value;i&&(s.forEach(r=>r.classList.remove("active")),t.classList.add("active"),e(i))})})}class je{container;options;searchQuery="";selectedYears=["all"];selectedLetter="ALL";students=[];allActiveStudents=[];attendanceMap=new Map;yearsList=[];constructor(e,s){this.container=e,this.options=s}async updateOptions(e){this.options=e,await this.loadDataAndRender()}async render(){await this.loadDataAndRender()}async loadDataAndRender(){ae(this.options.type),this.yearsList=await C();const e=await J(this.options.date,this.options.type);this.attendanceMap.clear();for(const n of e)n.present&&this.attendanceMap.set(n.studentId,!0);this.allActiveStudents=await A({onlyActive:!0}),this.students=await A({query:this.searchQuery,years:this.selectedYears,onlyActive:!0,initialLetter:this.selectedLetter});const s=O([{value:"presence",label:h.types.presence},{value:"course",label:h.types.course}],this.options.type),t=B(this.selectedYears.includes("all")?this.allActiveStudents:this.allActiveStudents.filter(n=>{const i=n.year.trim();return this.selectedYears.some(r=>i===r||i.startsWith(r))}));this.container.innerHTML=`
      <div style="padding: 12px 16px;">
        <div style="margin-bottom: 12px;">
          ${s}
        </div>

        <div class="filter-section">
          <div class="search-bar">
            <svg class="search-icon" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 14z"/></svg>
            <input type="text" id="pointage-search" class="search-input" placeholder="${h.header.searchPlaceholder}" value="${this.escapeHtml(this.searchQuery)}" />
            <button type="button" class="clear-search-btn" id="pointage-clear-search" style="display: ${this.searchQuery?"flex":"none"};">✕</button>
          </div>

          <div id="pointage-year-chips">${ue(this.yearsList,this.selectedYears)}</div>

          <div id="pointage-az-bar">${P(t,this.selectedLetter)}</div>
        </div>

        <div class="student-list" id="pointage-student-list" style="margin-top: 12px; padding: 0;">
          ${this.renderStudentListHtml()}
        </div>
      </div>
    `,this.attachEvents()}renderStudentListHtml(){return this.students.length===0?`
        <div style="text-align: center; padding: 32px 16px; color: var(--text-muted);">
          <p>Aucun élève ne correspond aux critères de recherche.</p>
          ${this.searchQuery.trim().length>0?`
            <button type="button" class="btn btn-primary" id="pointage-add-quick" style="margin-top: 16px;">
              ${h.actions.addStudent} « ${this.escapeHtml(this.searchQuery.trim())} »
            </button>
          `:""}
        </div>
      `:this.students.map(e=>{const s=this.attendanceMap.get(e.id)||!1;return`
          <div class="student-card ${s?"marked-present":""}" data-student-id="${e.id}">
            <div class="student-info">
              <div class="student-name">${this.escapeHtml(e.firstName)} ${this.escapeHtml(e.lastName)}</div>
              <div class="student-meta">
                <span class="badge-year">${this.escapeHtml(e.year)}</span>
                <span class="badge-gender ${e.gender}">${e.gender==="F"?"Fille":"Garçon"}</span>
                ${e.isInternal?'<span style="background: var(--bg-surface-hover); padding: 2px 6px; border-radius: var(--radius-sm); font-size: 0.7rem; font-weight: 600;">🏠 Interne</span>':""}
              </div>
            </div>
            <div class="check-indicator">
              ${s?'<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>':""}
            </div>
          </div>
        `}).join("")}async updateFilteredListOnly(){this.students=await A({query:this.searchQuery,years:this.selectedYears,onlyActive:!0,initialLetter:this.selectedLetter});const e=this.container.querySelector("#pointage-student-list");e&&(e.innerHTML=this.renderStudentListHtml(),this.attachCardEventsOnly());const s=this.container.querySelector("#pointage-clear-search");s&&(s.style.display=this.searchQuery?"flex":"none");const t=this.container.querySelector("#pointage-az-bar");if(t){const n=B(this.selectedYears.includes("all")?this.allActiveStudents:this.allActiveStudents.filter(i=>{const r=i.year.trim();return this.selectedYears.some(c=>r===c||r.startsWith(c))}));t.innerHTML=P(n,this.selectedLetter),j(this.container,i=>{this.selectedLetter=i,this.updateFilteredListOnly()})}}attachCardEventsOnly(){this.container.querySelectorAll("#pointage-student-list .student-card").forEach(t=>{t.addEventListener("click",async()=>{const n=t.dataset.studentId;if(!n)return;Ee();const i=await Y(n,this.options.date,this.options.type);if(this.attendanceMap.set(n,i.present),i.present){t.classList.add("marked-present");const r=t.querySelector(".check-indicator");r&&(r.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>')}else{t.classList.remove("marked-present");const r=t.querySelector(".check-indicator");r&&(r.innerHTML="")}this.options.onRefreshNeeded()})});const s=this.container.querySelector("#pointage-add-quick");s&&s.addEventListener("click",async()=>{const t=this.searchQuery.trim(),n=t.split(" "),i=n[0]||t,r=n.slice(1).join(" ")||"Élève",c=this.yearsList[0]||"1A",o=await Q({firstName:i,lastName:r,gender:"F",year:c,active:!0});await Y(o.id,this.options.date,this.options.type,!0),x(`Élève ${i} créé et marqué présent !`),this.searchQuery="",await this.loadDataAndRender(),this.options.onRefreshNeeded()})}attachEvents(){U(this.container,t=>{const n=t;this.options.type=n,this.options.onTypeChange&&this.options.onTypeChange(n),this.loadDataAndRender(),this.options.onRefreshNeeded()});const e=this.container.querySelector("#pointage-search");e&&e.addEventListener("input",()=>{this.searchQuery=e.value,this.updateFilteredListOnly()});const s=this.container.querySelector("#pointage-clear-search");s&&s.addEventListener("click",()=>{this.searchQuery="",e&&(e.value=""),this.updateFilteredListOnly()}),pe(this.container,()=>this.selectedYears,t=>{this.selectedYears=t,this.updateFilteredListOnly()}),j(this.container,t=>{this.selectedLetter=t,this.updateFilteredListOnly()}),this.attachCardEventsOnly()}escapeHtml(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}}class Fe{container;options;activeTab;constructor(e,s){this.container=e,this.options=s,this.activeTab=s.type}async render(){await this.loadDataAndRender()}async loadDataAndRender(){const s=(await J(this.options.date,this.activeTab)).filter(l=>l.present),t=await F(),n=new Map(t.map(l=>[l.id,l])),i=de(s,new Map(t.map(l=>[l.id,l])),this.activeTab),r=s.map(l=>({attendance:l,student:n.get(l.studentId)})).filter(l=>!!l.student).sort((l,u)=>u.attendance.markedAt-l.attendance.markedAt),c=O([{value:"presence",label:h.types.presence},{value:"course",label:h.types.course}],this.activeTab),o=Object.entries(i.byYear).sort(([l],[u])=>l.localeCompare(u)).map(([l,u])=>`
        <tr>
          <td><strong>${this.escapeHtml(l)}</strong></td>
          <td>${u.girls}</td>
          <td>${u.boys}</td>
          <td>${u.internals}</td>
          <td><strong>${u.total}</strong></td>
        </tr>
      `).join("");this.container.innerHTML=`
      <div style="padding: 16px; display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h2>${D(this.options.date)}</h2>
          <button class="btn btn-secondary" id="jour-copy-summary-btn" style="min-height: 38px; padding: 0 12px;">
            ${h.actions.copySummary}
          </button>
        </div>

        <div>${c}</div>

        <!-- Carte de résumé -->
        <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px; display: flex; flex-direction: column; gap: 12px; box-shadow: var(--shadow-sm);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: var(--font-size-base); font-weight: 700; color: var(--text-primary);">
              Résumé — ${this.activeTab==="presence"?h.types.presence:h.types.course}
            </span>
            <span style="font-size: var(--font-size-xl); font-weight: 800; color: var(--accent-active);">
              ${i.total} élève(s)
            </span>
          </div>

          <div style="display: flex; gap: 16px; font-size: var(--font-size-sm); color: var(--text-secondary); flex-wrap: wrap;">
            <div>Filles : <strong style="color: #db2777;">${i.girls}</strong></div>
            <div>Garçons : <strong style="color: #0284c7;">${i.boys}</strong></div>
            <div>Internes : <strong style="color: #10b981;">${i.internals}</strong></div>
          </div>

          ${Object.keys(i.byYear).length>0?`
            <table class="data-table" style="margin-top: 8px;">
              <thead>
                <tr>
                  <th>Année</th>
                  <th>Filles</th>
                  <th>Garçons</th>
                  <th>Internes</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${o}
              </tbody>
            </table>
          `:'<p style="font-size: 0.85rem; color: var(--text-muted);">Aucune répartition disponible.</p>'}
        </div>

        <!-- Liste des élèves présent(e)s -->
        <div>
          <h3 style="margin-bottom: 8px; font-size: var(--font-size-base);">${h.nav.jour} (${r.length})</h3>
          <p style="font-size: var(--font-size-xs); color: var(--text-muted); margin-bottom: 8px;">${h.stats.longPressHint}</p>

          ${r.length===0?`
            <div style="text-align: center; padding: 24px; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              ${h.stats.noAttendanceToday}
            </div>
          `:`
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${r.map(l=>`
                <div class="student-card" data-student-id="${l.student.id}" data-attendance-id="${l.attendance.id}">
                  <div class="student-info">
                    <div class="student-name">${this.escapeHtml(l.student.firstName)} ${this.escapeHtml(l.student.lastName)}</div>
                    <div class="student-meta">
                      <span class="badge-year">${this.escapeHtml(l.student.year)}</span>
                      <span class="badge-gender ${l.student.gender}">${l.student.gender==="F"?"Fille":"Garçon"}</span>
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: var(--font-size-xs); color: var(--text-muted); font-weight: 500;">
                      ${_(l.attendance.markedAt)}
                    </span>
                    <button class="btn btn-danger jour-cancel-btn" style="min-height: 36px; padding: 0 10px; font-size: 0.75rem;" title="Annuler ce pointage">
                      Annuler
                    </button>
                  </div>
                </div>
              `).join("")}
            </div>
          `}
        </div>
      </div>
    `,this.attachEvents(i)}attachEvents(e){U(this.container,n=>{this.activeTab=n,this.loadDataAndRender()});const s=this.container.querySelector("#jour-copy-summary-btn");s&&s.addEventListener("click",()=>{let n=`Résumé des ${this.activeTab==="presence"?"présences":"courses"} — ${D(this.options.date)}
`;n+=`Total: ${e.total} (Filles: ${e.girls}, Garçons: ${e.boys}, Internes: ${e.internals})

`,n+=`Répartition par année:
`;for(const[i,r]of Object.entries(e.byYear))n+=`- ${i}: ${r.total} (F: ${r.girls}, G: ${r.boys}, I: ${r.internals})
`;navigator.clipboard.writeText(n),x(h.actions.copiedSuccess)}),this.container.querySelectorAll(".student-card").forEach(n=>{const i=n.dataset.studentId;if(!i)return;const r=n.querySelector(".jour-cancel-btn");r&&r.addEventListener("click",async c=>{c.stopPropagation(),await Y(i,this.options.date,this.activeTab,!1),x("Pointage annulé"),this.loadDataAndRender(),this.options.onRefreshNeeded()}),n.addEventListener("click",()=>{this.options.onStudentCardClick(i)})})}escapeHtml(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}}const Oe="modulepreload",Ue=function(a,e){return new URL(a,e).href},ne={},he=function(e,s,t){let n=Promise.resolve();if(s&&s.length>0){let r=function(u){return Promise.all(u.map(f=>Promise.resolve(f).then(v=>({status:"fulfilled",value:v}),v=>({status:"rejected",reason:v}))))};const c=document.getElementsByTagName("link"),o=document.querySelector("meta[property=csp-nonce]"),l=o?.nonce||o?.getAttribute("nonce");n=r(s.map(u=>{if(u=Ue(u,t),u in ne)return;ne[u]=!0;const f=u.endsWith(".css"),v=f?'[rel="stylesheet"]':"";if(!!t)for(let p=c.length-1;p>=0;p--){const w=c[p];if(w.href===u&&(!f||w.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${u}"]${v}`))return;const d=document.createElement("link");if(d.rel=f?"stylesheet":Oe,f||(d.as="script"),d.crossOrigin="",d.href=u,l&&d.setAttribute("nonce",l),document.head.appendChild(d),f)return new Promise((p,w)=>{d.addEventListener("load",p),d.addEventListener("error",()=>w(new Error(`Unable to preload CSS for ${u}`)))})}))}function i(r){const c=new Event("vite:preloadError",{cancelable:!0});if(c.payload=r,window.dispatchEvent(c),!c.defaultPrevented)throw r}return n.then(r=>{for(const c of r||[])c.status==="rejected"&&i(c.reason);return e().catch(i)})};async function Ve(a,e,s,t){const n={id:W(),date:new Date().toISOString(),fileName:a,created:e,updated:s,skipped:t};return await y.importLog.put(n),n}async function Z(){return await he(()=>import("./sheetjs-DGuHH-KN.js"),[],import.meta.url)}function Ye(a,e){const s=a.utils.sheet_to_json(e,{header:1,defval:""});if(!s||s.length===0)return{headers:[],dataRows:[]};let t=0;for(let o=0;o<Math.min(s.length,10);o++)if(s[o].filter(f=>String(f??"").trim().length>0).length>=2){t=o;break}const n=s[t]||[],i=[],r=new Map;for(let o=0;o<n.length;o++){let l=String(n[o]??"").trim();l||(l=`Colonne ${o+1}`);const u=r.get(l)||0;r.set(l,u+1),u>0?i.push(`${l} (${u+1})`):i.push(l)}const c=[];for(let o=t+1;o<s.length;o++){const l=s[o];if(!l||l.every(f=>String(f??"").trim()===""))continue;const u={};for(let f=0;f<i.length;f++)u[i[f]]=l[f]!==void 0?l[f]:"";c.push(u)}return{headers:i,dataRows:c}}function _e(a){let e="",s="",t="",n="",i="",r="";for(const c of a){const o=$(c);["nom","nom de famille","last name","lastname","nom famille"].includes(o)&&!e?e=c:["prenom","first name","firstname"].includes(o)&&!s?s=c:["sexe","genre","f/m","g/f","gender","s"].includes(o)&&!t?t=c:["annee","classe","niveau","year","groupe","section","degre","degre/annee"].includes(o)&&!n?n=c:["interne","estinterne","est interne","pensionnaire","regime","internat"].includes(o)&&!i?i=c:["remarque","notes","commentaire","remark","observation"].includes(o)&&!r&&(r=c)}return e||(e=a.find(c=>$(c).includes("nom")&&!$(c).includes("prenom"))||a[0]||""),s||(s=a.find(c=>$(c).includes("prenom"))||(a.length>1?a[1]:"")||""),t||(t=a.find(c=>["sexe","genre"].some(o=>$(c).includes(o)))||""),n||(n=a.find(c=>["annee","classe","niveau"].some(o=>$(c).includes(o)))||""),i||(i=a.find(c=>["interne","pension"].some(o=>$(c).includes(o)))||""),{lastNameCol:e,firstNameCol:s,genderCol:t,yearCol:n,isInternalCol:i,notesCol:r}}function We(a){if(a==null||a==="")return"F";const e=$(String(a));return["f","fille","feminin","féminin","female","2"].includes(e)?"F":["m","g","garcon","garçon","masculin","male","1","h","homme"].includes(e)?"M":"F"}function Ge(a){if(a==null||a==="")return!1;if(typeof a=="boolean")return a;const e=$(String(a));return["oui","true","1","x","o","y","interne","vrai","pensionnaire"].includes(e)}async function Qe(a,e,s,t){const n=new Map;for(const r of t){const c=`${$(r.lastName)}_${$(r.firstName)}`;n.set(c,r)}const i=[];for(let r=0;r<a.length;r++){const c=a[r];let o=e.lastNameCol?String(c[e.lastNameCol]??"").trim():"",l=e.firstNameCol?String(c[e.firstNameCol]??"").trim():"";const u=e.genderCol?c[e.genderCol]:null;let f=e.yearCol?String(c[e.yearCol]??"").trim():"";const v=e.isInternalCol?c[e.isInternalCol]:null,m=e.notesCol?String(c[e.notesCol]??"").trim():"";if(!o&&!l&&!f)continue;if(!l&&o){const S=o.split(/\s+/);S.length>1?(o=S[0],l=S.slice(1).join(" ")):(l=o,o="Élève")}else!o&&l&&(o="Élève");const d=We(u);f||(f="1A");const p=Ge(v),w=`${$(o)}_${$(l)}`,g=n.get(w);g?i.push({rowIndex:r+2,lastName:o,firstName:l,gender:d,year:f,isInternal:p,notes:m,status:"skip",errorReason:"Doublon existant (ignoré).",existingId:g.id}):i.push({rowIndex:r+2,lastName:o,firstName:l,gender:d,year:f,isInternal:p,notes:m,status:"create"})}return i}async function Je(a,e){const s=Date.now();let t=0,n=0,i=0;const r=await C(),c=new Set(r);for(const o of a)o.year&&o.year.trim()&&c.add(o.year.trim());return await q(Array.from(c)),await y.transaction("rw",[y.students,y.importLog,y.meta],async()=>{for(const o of a){if(o.status==="skip"||o.status==="error"){i++;continue}if(o.status==="create"){const u={id:W(),firstName:o.firstName,lastName:o.lastName,gender:o.gender,year:o.year,active:!0,isInternal:o.isInternal,notes:o.notes,createdAt:new Date(s).toISOString(),updatedAt:s,dirty:1,searchKey:G(o.firstName,o.lastName)};await y.students.put(u),t++}else if(o.status==="update"&&o.existingId){const l=await y.students.get(o.existingId);if(l){const u={...l,gender:o.gender,year:o.year,isInternal:o.isInternal,notes:o.notes||l.notes,updatedAt:s,dirty:1};await y.students.put(u),n++}}}await Ve(e,t,n,i)}),{created:t,updated:n,skipped:i}}async function Ze(){const a=await Z(),e=[{Nom:"DUPONT",Prénom:"Alice",Sexe:"F",Année:"1A",EstInterne:"Oui",Remarque:"Exemple"},{Nom:"MARTIN",Prénom:"Lucas",Sexe:"M",Année:"2B",EstInterne:"Non",Remarque:"Exemple"}],s=a.utils.json_to_sheet(e),t=a.utils.book_new();a.utils.book_append_sheet(t,s,"Élèves"),a.writeFile(t,"modele_import_eleves.xlsx")}async function fe(a){const e=document.createElement("div");e.className="modal-overlay",document.body.appendChild(e);const s=()=>{e.remove(),a.onClose()};try{x("Lecture du fichier Excel...");const t=await Z(),n=await a.file.arrayBuffer(),i=t.read(n,{type:"array"}),r=i.SheetNames[0],c=i.Sheets[r],{headers:o,dataRows:l}=Ye(t,c);if(o.length===0||l.length===0){x("Fichier Excel vide ou aucune donnée trouvée."),s();return}let u=_e(o);const f=()=>{const m=(g,S=!1)=>{let L=`<option value="" ${g?"":"selected"}>${S?"-- Choisir une colonne --":"(Aucune / Non renseigné)"}</option>`;return L+=o.map(b=>`
          <option value="${N(b)}" ${g===b?"selected":""}>${N(b)}</option>
        `).join(""),L};e.innerHTML=`
        <div class="modal-content" style="max-width: 580px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <h3 style="font-size: var(--font-size-lg); font-weight: 700;">
              Correspondance des colonnes (${N(a.file.name)})
            </h3>
            <button class="btn btn-secondary" id="import-close-btn" style="min-height: 36px; padding: 0 10px;">✕</button>
          </div>

          <p style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-bottom: 16px;">
            ${o.length} colonnes et ${l.length} lignes détectées. Associez les colonnes de votre fichier aux champs de l'application :
          </p>

          <form id="import-mapping-form" style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 700; display: block; margin-bottom: 4px;">
                1. Colonne pour le NOM de famille *
              </label>
              <select id="map-lastname" class="search-input" style="appearance: auto;" required>
                ${m(u.lastNameCol,!0)}
              </select>
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 700; display: block; margin-bottom: 4px;">
                2. Colonne pour le PRÉNOM
              </label>
              <select id="map-firstname" class="search-input" style="appearance: auto;">
                ${m(u.firstNameCol,!1)}
              </select>
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 700; display: block; margin-bottom: 4px;">
                3. Colonne pour la CLASSE / ANNÉE
              </label>
              <select id="map-year" class="search-input" style="appearance: auto;">
                ${m(u.yearCol,!1)}
              </select>
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 700; display: block; margin-bottom: 4px;">
                4. Colonne pour le SEXE (F / M)
              </label>
              <select id="map-gender" class="search-input" style="appearance: auto;">
                ${m(u.genderCol,!1)}
              </select>
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 700; display: block; margin-bottom: 4px;">
                5. Colonne pour le statut INTERNE (EstInterne)
              </label>
              <select id="map-internal" class="search-input" style="appearance: auto;">
                ${m(u.isInternalCol,!1)}
              </select>
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 700; display: block; margin-bottom: 4px;">
                6. Colonne pour les REMARQUES / NOTES
              </label>
              <select id="map-notes" class="search-input" style="appearance: auto;">
                ${m(u.notesCol,!1)}
              </select>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 16px;">
              <button type="button" class="btn btn-secondary" id="import-cancel-btn" style="flex: 1;">
                ${h.actions.cancel}
              </button>
              <button type="submit" class="btn btn-primary" style="flex: 1.5;">
                Valider et afficher l'aperçu →
              </button>
            </div>
          </form>
        </div>
      `;const d=e.querySelector("#import-close-btn");d&&d.addEventListener("click",s);const p=e.querySelector("#import-cancel-btn");p&&p.addEventListener("click",s);const w=e.querySelector("#import-mapping-form");w&&w.addEventListener("submit",async g=>{g.preventDefault();const S=(e.querySelector("#map-lastname")?.value||"").trim(),L=(e.querySelector("#map-firstname")?.value||"").trim(),b=(e.querySelector("#map-year")?.value||"").trim(),R=(e.querySelector("#map-gender")?.value||"").trim(),H=(e.querySelector("#map-internal")?.value||"").trim(),V=(e.querySelector("#map-notes")?.value||"").trim();u={lastNameCol:S,firstNameCol:L,genderCol:R,yearCol:b,isInternalCol:H,notesCol:V};const ye=await A(),ve=await Qe(l,u,"ignore",ye);v(ve)})},v=m=>{const d=m.filter(b=>b.status==="create").length,p=m.filter(b=>b.status==="skip").length,w=m.slice(0,8);e.innerHTML=`
        <div class="modal-content" style="max-width: 620px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <h3 style="font-size: var(--font-size-lg); font-weight: 700;">
              Aperçu de l'import (${d} à créer)
            </h3>
            <button class="btn btn-secondary" id="import-close-btn2" style="min-height: 36px; padding: 0 10px;">✕</button>
          </div>

          <div style="font-size: var(--font-size-xs); display: flex; gap: 14px; margin-bottom: 12px; background: var(--bg-surface-hover); padding: 8px 12px; border-radius: var(--radius-sm);">
            <span style="color: var(--color-success);">Nouveaux élèves à créer : <strong>${d}</strong></span>
            <span style="color: var(--text-muted);">Doublons déjà en base : <strong>${p}</strong></span>
          </div>

          <div style="overflow-x: auto; max-height: 250px; margin-bottom: 16px;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Classe</th>
                  <th>Sexe</th>
                  <th>Interne</th>
                </tr>
              </thead>
              <tbody>
                ${w.length===0?`
                  <tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Aucune ligne valide à importer.</td></tr>
                `:w.map(b=>`
                  <tr style="${b.status==="skip"?"opacity: 0.5;":""}">
                    <td><strong>${N(b.lastName)}</strong></td>
                    <td>${N(b.firstName)}</td>
                    <td><span class="badge-year">${N(b.year)}</span></td>
                    <td>${b.gender}</td>
                    <td>${b.isInternal?"Oui":"Non"}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
            ${m.length>8?`<p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 6px; text-align: center;">... et ${m.length-8} autres élèves.</p>`:""}
          </div>

          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" id="import-back-mapping-btn" style="flex: 1;">
              ← Modifier les colonnes
            </button>
            <button class="btn btn-primary" id="import-confirm-btn" style="flex: 1.5;" ${d===0?"disabled":""}>
              Confirmer l'importation (${d})
            </button>
          </div>
        </div>
      `;const g=e.querySelector("#import-close-btn2");g&&g.addEventListener("click",s);const S=e.querySelector("#import-back-mapping-btn");S&&S.addEventListener("click",f);const L=e.querySelector("#import-confirm-btn");L&&L.addEventListener("click",async()=>{L.disabled=!0,L.textContent="Importation en cours...";try{const b=await Je(m,a.file.name);x(`Importation réussie : ${b.created} élève(s) ajouté(s) !`),s(),a.onSuccess()}catch(b){console.error("[Import Error]:",b),x(`Erreur lors de l'enregistrement : ${b?.message||"Transaction échouée"}`),L.disabled=!1,L.textContent=`Confirmer l'importation (${d})`}})};f()}catch(t){console.error(t),x("Erreur lors de la lecture du fichier Excel."),s()}}function N(a){return a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}class Xe{container;options;searchQuery="";selectedYears=["all"];selectedLetter="ALL";showInactive=!1;students=[];allStudents=[];yearsList=[];constructor(e,s){this.container=e,this.options=s}async render(){await this.loadDataAndRender()}async loadDataAndRender(){this.yearsList=await C(),this.allStudents=await A({onlyActive:!this.showInactive}),this.students=await A({query:this.searchQuery,years:this.selectedYears,onlyActive:!this.showInactive,initialLetter:this.selectedLetter});const e=B(this.selectedYears.includes("all")?this.allStudents:this.allStudents.filter(s=>{const t=s.year.trim();return this.selectedYears.some(n=>t===n||t.startsWith(n))}));this.container.innerHTML=`
      <div style="padding: 12px 16px; position: relative; min-height: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 8px; flex-wrap: wrap;">
          <h2 id="eleves-title">${h.nav.eleves} (${this.students.length})</h2>
          <div style="display: flex; gap: 8px;">
            <label class="btn btn-secondary" style="min-height: 38px; padding: 0 10px; font-size: 0.8rem; cursor: pointer;">
              📂 Importer Excel
              <input type="file" id="eleves-import-file" accept=".xlsx, .xls, .csv" style="display: none;" />
            </label>
            <button class="btn btn-primary" id="eleves-add-btn" style="min-height: 38px; padding: 0 12px; font-size: 0.8rem;">
              + ${h.actions.add}
            </button>
          </div>
        </div>

        <div class="filter-section">
          <div class="search-bar">
            <svg class="search-icon" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 14z"/></svg>
            <input type="text" id="eleves-search" class="search-input" placeholder="${h.header.searchPlaceholder}" value="${this.escapeHtml(this.searchQuery)}" />
            <button class="clear-search-btn" id="eleves-clear-search" style="display: ${this.searchQuery?"flex":"none"};">✕</button>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px; gap: 8px;">
            <div id="eleves-year-chips" style="flex: 1; overflow: hidden;">${ue(this.yearsList,this.selectedYears)}</div>
            <label style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; cursor: pointer; white-space: nowrap;">
              <input type="checkbox" id="eleves-show-inactive" ${this.showInactive?"checked":""} />
              ${h.header.includeInactive}
            </label>
          </div>

          <div id="eleves-az-bar">${P(e,this.selectedLetter)}</div>
        </div>

        <div class="student-list" id="eleves-student-list" style="margin-top: 12px; padding: 0;">
          ${this.renderStudentListHtml()}
        </div>
      </div>

      <div id="eleves-modal-container"></div>
    `,this.attachEvents()}renderStudentListHtml(){return this.students.length===0?`
        <div style="text-align: center; padding: 32px; color: var(--text-muted);">
          Aucun élève trouvé.
        </div>
      `:this.students.map(e=>`
      <div class="student-card" data-student-id="${e.id}">
        <div class="student-info">
          <div class="student-name" style="${e.active?"":"text-decoration: line-through; opacity: 0.6;"}">
            ${this.escapeHtml(e.firstName)} ${this.escapeHtml(e.lastName)}
            ${e.active?"":' <span style="font-size: 0.75rem; color: var(--color-danger);">(Inactif)</span>'}
          </div>
          <div class="student-meta">
            <span class="badge-year">${this.escapeHtml(e.year)}</span>
            <span class="badge-gender ${e.gender}">${e.gender==="F"?"Fille":"Garçon"}</span>
            ${e.isInternal?'<span style="background: var(--bg-surface-hover); padding: 2px 6px; border-radius: var(--radius-sm); font-size: 0.7rem; font-weight: 600;">🏠 Interne</span>':""}
            ${e.notes?`<span style="color: var(--text-muted); font-size: 0.75rem;">📝 ${this.escapeHtml(e.notes)}</span>`:""}
          </div>
        </div>
        <button class="btn btn-secondary eleves-edit-btn" data-student-id="${e.id}" style="min-height: 38px; padding: 0 10px; font-size: 0.8rem;">
          ${h.actions.edit}
        </button>
      </div>
    `).join("")}async updateFilteredListOnly(){this.allStudents=await A({onlyActive:!this.showInactive}),this.students=await A({query:this.searchQuery,years:this.selectedYears,onlyActive:!this.showInactive,initialLetter:this.selectedLetter});const e=this.container.querySelector("#eleves-student-list");e&&(e.innerHTML=this.renderStudentListHtml(),this.attachCardEventsOnly());const s=this.container.querySelector("#eleves-title");s&&(s.textContent=`${h.nav.eleves} (${this.students.length})`);const t=this.container.querySelector("#eleves-clear-search");t&&(t.style.display=this.searchQuery?"flex":"none");const n=this.container.querySelector("#eleves-az-bar");if(n){const i=B(this.selectedYears.includes("all")?this.allStudents:this.allStudents.filter(r=>{const c=r.year.trim();return this.selectedYears.some(o=>c===o||c.startsWith(o))}));n.innerHTML=P(i,this.selectedLetter),j(this.container,r=>{this.selectedLetter=r,this.updateFilteredListOnly()})}}attachCardEventsOnly(){this.container.querySelectorAll(".eleves-edit-btn").forEach(t=>{t.addEventListener("click",async n=>{n.stopPropagation();const i=t.dataset.studentId;if(i){const r=await ce(i);r&&this.openStudentModal(r)}})}),this.container.querySelectorAll(".student-card").forEach(t=>{t.addEventListener("click",()=>{const n=t.dataset.studentId;n&&this.options.onStudentCardClick(n)})})}attachEvents(){const e=this.container.querySelector("#eleves-search");e&&e.addEventListener("input",()=>{this.searchQuery=e.value,this.updateFilteredListOnly()});const s=this.container.querySelector("#eleves-clear-search");s&&s.addEventListener("click",()=>{this.searchQuery="",e&&(e.value=""),this.updateFilteredListOnly()});const t=this.container.querySelector("#eleves-show-inactive");t&&t.addEventListener("change",()=>{this.showInactive=t.checked,this.updateFilteredListOnly()}),pe(this.container,()=>this.selectedYears,r=>{this.selectedYears=r,this.updateFilteredListOnly()}),j(this.container,r=>{this.selectedLetter=r,this.updateFilteredListOnly()});const n=this.container.querySelector("#eleves-add-btn");n&&n.addEventListener("click",()=>{this.openStudentModal()});const i=this.container.querySelector("#eleves-import-file");i&&i.addEventListener("change",()=>{const r=i.files?.[0];r&&fe({file:r,onSuccess:async()=>{this.searchQuery="",this.selectedYears=["all"],this.selectedLetter="ALL",await this.loadDataAndRender(),this.options.onRefreshNeeded()},onClose:()=>{i.value=""}})}),this.attachCardEventsOnly()}async openStudentModal(e){const s=!!e,t=this.container.querySelector("#eleves-modal-container");if(!t)return;let n=e?e.gender:"F";t.innerHTML=`
      <div class="modal-overlay" id="eleves-modal-overlay">
        <div class="modal-content">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: var(--font-size-lg); font-weight: 700;">
              ${s?h.actions.edit:h.actions.addStudent}
            </h3>
            <button type="button" class="btn btn-secondary" id="modal-close-btn" style="min-height: 36px; padding: 0 10px;">✕</button>
          </div>

          <form id="student-form" style="display: flex; flex-direction: column; gap: 14px;">
            <div id="duplicate-warning-banner" class="past-date-banner" style="display: none;">
              ${h.student.duplicateWarning}
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${h.student.firstName} *
              </label>
              <input type="text" id="form-first-name" class="search-input" value="${e?this.escapeHtml(e.firstName):""}" required />
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${h.student.lastName} *
              </label>
              <input type="text" id="form-last-name" class="search-input" value="${e?this.escapeHtml(e.lastName):""}" required />
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${h.student.gender} *
              </label>
              <div id="form-gender-toggle">
                ${O([{value:"F",label:h.student.female},{value:"M",label:h.student.male}],n)}
              </div>
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${h.student.year} *
              </label>
              <select id="form-year-select" class="search-input" style="appearance: auto;">
                ${this.yearsList.map(g=>`
                  <option value="${g}" ${e&&e.year===g?"selected":""}>${g}</option>
                `).join("")}
              </select>
            </div>

            <div style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="form-internal-checkbox" ${e?.isInternal?"checked":""} />
              <label for="form-internal-checkbox" style="font-size: var(--font-size-sm); font-weight: 600;">
                Élève Interne (EstInterne)
              </label>
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${h.student.notes}
              </label>
              <textarea id="form-notes" class="search-input" style="min-height: 70px; resize: vertical;">${e?this.escapeHtml(e.notes):""}</textarea>
            </div>

            ${s?`
              <div style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" id="form-active-checkbox" ${e?.active?"checked":""} />
                <label for="form-active-checkbox" style="font-size: var(--font-size-sm); font-weight: 600;">
                  ${h.student.active}
                </label>
              </div>
            `:""}

            <div style="display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap;">
              ${s?`
                <button type="button" class="btn btn-danger" id="form-delete-student-btn" style="flex: 1; min-height: 42px;">
                  🗑️ Supprimer
                </button>
              `:""}
              <button type="button" class="btn btn-secondary" id="form-cancel-btn" style="flex: 1; min-height: 42px;">
                ${h.actions.cancel}
              </button>
              <button type="submit" class="btn btn-primary" style="flex: 1.5; min-height: 42px;">
                ${h.actions.save}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;const i=()=>{t.innerHTML=""},r=t.querySelector("#eleves-modal-overlay");r&&r.addEventListener("click",g=>{g.target===r&&i()});const c=t.querySelector("#modal-close-btn");c&&c.addEventListener("click",i);const o=t.querySelector("#form-cancel-btn");o&&o.addEventListener("click",i);const l=t.querySelector("#form-delete-student-btn");l&&e&&l.addEventListener("click",async()=>{confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'élève ${e.firstName} ${e.lastName} ainsi que tous ses pointages ?`)&&(await oe(e.id),x(`Élève ${e.firstName} ${e.lastName} supprimé.`),i(),await this.loadDataAndRender(),this.options.onRefreshNeeded())});const u=t.querySelector("#form-gender-toggle");u&&U(u,g=>{n=g});const f=t.querySelector("#form-first-name"),v=t.querySelector("#form-last-name"),m=t.querySelector("#form-year-select"),d=t.querySelector("#duplicate-warning-banner"),p=async()=>{if(!f||!v||!m||!d)return;const g=f.value,S=v.value,L=m.value;if(g.trim()&&S.trim()){const b=await qe(g,S,L,e?.id);d.style.display=b?"block":"none"}};f&&f.addEventListener("input",p),v&&v.addEventListener("input",p),m&&m.addEventListener("change",p);const w=t.querySelector("#student-form");w&&w.addEventListener("submit",async g=>{if(g.preventDefault(),!f||!v||!m)return;const S=f.value.trim(),L=v.value.trim(),b=m.value.trim(),R=t.querySelector("#form-internal-checkbox")?.checked??!1,H=(t.querySelector("#form-notes")?.value||"").trim(),V=s?t.querySelector("#form-active-checkbox")?.checked??!0:!0;if(!S||!L||!b){x("Veuillez remplir les champs obligatoires.");return}await Ce(b),s&&e?(await re({id:e.id,firstName:S,lastName:L,gender:n,year:b,isInternal:R,notes:H,active:V}),x("Élève mis à jour.")):(await Q({firstName:S,lastName:L,gender:n,year:b,isInternal:R,notes:H,active:!0}),x("Élève créé.")),i(),await this.loadDataAndRender(),this.options.onRefreshNeeded()})}escapeHtml(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}}class Ke{container;options;student=null;typeFilter="all";constructor(e,s){this.container=e,this.options=s}async render(){await this.loadDataAndRender()}async loadDataAndRender(){const e=await ce(this.options.studentId);if(!e){this.container.innerHTML=`
        <div style="padding: 24px; text-align: center;">
          <p>Élève introuvable.</p>
          <button class="btn btn-secondary" id="fiche-back-btn" style="margin-top: 16px;">Retour</button>
        </div>
      `;const o=this.container.querySelector("#fiche-back-btn");o&&o.addEventListener("click",this.options.onBack);return}this.student=e;const t=(await De(e.id)).filter(o=>o.present);let n=0,i=0,r=null;for(const o of t)o.type==="presence"?n++:o.type==="course"&&i++,(!r||o.date>r)&&(r=o.date);let c=t;this.typeFilter!=="all"&&(c=c.filter(o=>o.type===this.typeFilter)),c.sort((o,l)=>l.markedAt-o.markedAt),this.container.innerHTML=`
      <div style="padding: 16px; display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; items-center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
          <button class="btn btn-secondary" id="fiche-back-btn" style="min-height: 38px; padding: 0 12px;">
            ← Retour
          </button>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary" id="fiche-toggle-active-btn" style="min-height: 38px; padding: 0 10px; font-size: 0.8rem;">
              ${e.active?"Désactiver":"Réactiver"}
            </button>
            <button class="btn btn-danger" id="fiche-delete-btn" style="min-height: 38px; padding: 0 10px; font-size: 0.8rem;">
              🗑️ Supprimer
            </button>
          </div>
        </div>

        <!-- En-tête Identité -->
        <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px; box-shadow: var(--shadow-sm);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h2 style="font-size: var(--font-size-xl); font-weight: 700;">
                ${this.escapeHtml(e.firstName)} ${this.escapeHtml(e.lastName)}
              </h2>
              <div style="display: flex; gap: 8px; margin-top: 6px; align-items: center; flex-wrap: wrap;">
                <span class="badge-year">${this.escapeHtml(e.year)}</span>
                <span class="badge-gender ${e.gender}">${e.gender==="F"?"Fille":"Garçon"}</span>
                ${e.isInternal?'<span style="background: var(--bg-surface-hover); padding: 2px 6px; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 600;">🏠 Interne</span>':""}
                <span style="font-size: var(--font-size-xs); font-weight: 600; color: ${e.active?"var(--color-success)":"var(--color-danger)"}">
                  ${e.active?"• Actif":"• Inactif"}
                </span>
              </div>
              ${e.notes?`
                <div style="margin-top: 10px; font-size: var(--font-size-sm); color: var(--text-secondary); background: var(--bg-surface-hover); padding: 8px 12px; border-radius: var(--radius-sm);">
                  📝 ${this.escapeHtml(e.notes)}
                </div>
              `:""}
            </div>
          </div>

          <!-- Grille des compteurs -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 16px; text-align: center;">
            <div style="background: var(--accent-presence-light); padding: 10px 4px; border-radius: var(--radius-md);">
              <div style="font-size: var(--font-size-xl); font-weight: 800; color: var(--accent-presence);">${n}</div>
              <div style="font-size: var(--font-size-xs); font-weight: 600; color: var(--accent-presence);">${h.types.presence}s</div>
            </div>

            <div style="background: var(--accent-course-light); padding: 10px 4px; border-radius: var(--radius-md);">
              <div style="font-size: var(--font-size-xl); font-weight: 800; color: var(--accent-course);">${i}</div>
              <div style="font-size: var(--font-size-xs); font-weight: 600; color: var(--accent-course);">${h.types.course}s</div>
            </div>

            <div style="background: var(--bg-surface-hover); padding: 10px 4px; border-radius: var(--radius-md);">
              <div style="font-size: var(--font-size-xl); font-weight: 800; color: var(--text-primary);">${n+i}</div>
              <div style="font-size: var(--font-size-xs); font-weight: 600; color: var(--text-secondary);">${h.stats.total}</div>
            </div>
          </div>

          <div style="margin-top: 12px; font-size: var(--font-size-xs); color: var(--text-muted); text-align: center;">
            ${h.student.lastSeen} : <strong>${r?D(r):h.student.never}</strong>
          </div>
        </div>

        <!-- Historique chronologique -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h3 style="font-size: var(--font-size-base);">${h.nav.historique} (${c.length})</h3>
            <select id="fiche-type-filter" class="search-input" style="width: auto; min-height: 36px; padding: 0 8px; font-size: 0.8rem;">
              <option value="all" ${this.typeFilter==="all"?"selected":""}>Tous les types</option>
              <option value="presence" ${this.typeFilter==="presence"?"selected":""}>Entraînements</option>
              <option value="course" ${this.typeFilter==="course"?"selected":""}>Courses</option>
            </select>
          </div>

          ${c.length===0?`
            <div style="text-align: center; padding: 24px; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              Aucun pointage enregistré pour cet élève.
            </div>
          `:`
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${c.map(o=>{const l=o.type==="presence",u=l?"var(--accent-presence)":"var(--accent-course)",f=l?"var(--accent-presence-light)":"var(--accent-course-light)";return`
                  <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px 14px; display: flex; align-items: center; justify-content: space-between;">
                    <div>
                      <div style="font-size: var(--font-size-sm); font-weight: 600;">${D(o.date)}</div>
                      <div style="font-size: var(--font-size-xs); color: var(--text-muted); margin-top: 2px;">Heure : ${_(o.markedAt)}</div>
                    </div>
                    <span style="background: ${f}; color: ${u}; padding: 4px 10px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 700;">
                      ${l?h.types.presence:h.types.course}
                    </span>
                  </div>
                `}).join("")}
            </div>
          `}
        </div>
      </div>
    `,this.attachEvents()}attachEvents(){const e=this.container.querySelector("#fiche-back-btn");e&&e.addEventListener("click",this.options.onBack);const s=this.container.querySelector("#fiche-toggle-active-btn");s&&this.student&&s.addEventListener("click",async()=>{if(!this.student)return;const i=!this.student.active;await re({id:this.student.id,active:i}),x(i?"Élève réactivé.":"Élève désactivé."),await this.loadDataAndRender(),this.options.onRefreshNeeded()});const t=this.container.querySelector("#fiche-delete-btn");t&&this.student&&t.addEventListener("click",async()=>{this.student&&confirm(`Êtes-vous sûr de vouloir supprimer définitivement ${this.student.firstName} ${this.student.lastName} ainsi que tous ses pointages ?`)&&(await oe(this.student.id),x(`Élève ${this.student.firstName} ${this.student.lastName} supprimé.`),this.options.onBack(),this.options.onRefreshNeeded())});const n=this.container.querySelector("#fiche-type-filter");n&&n.addEventListener("change",()=>{this.typeFilter=n.value,this.loadDataAndRender()})}escapeHtml(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}}async function et(a,e,s){const t=await Z(),n=T(),i=new Map(a.map(d=>[d.id,d])),r=a.map(d=>({ID:d.id,Nom:d.lastName,Prénom:d.firstName,Sexe:d.gender,Année:d.year,Actif:d.active?"Oui":"Non",Notes:d.notes,"Date Création":d.createdAt})),c=e.filter(d=>d.present);c.sort((d,p)=>p.markedAt-d.markedAt);const o=c.map(d=>{const p=i.get(d.studentId);return{Date:d.date,Type:d.type==="presence"?"Présence":"Course",Nom:p?p.lastName:"Inconnu",Prénom:p?p.firstName:"Inconnu",Année:p?p.year:"",Sexe:p?p.gender:"",Heure:_(d.markedAt),Appareil:d.deviceId}}),l=a.map(d=>{const p=s.get(d.id)||{presences:0,courses:0,total:0,lastSeen:null,studentId:d.id};return{Nom:d.lastName,Prénom:d.firstName,Année:d.year,Sexe:d.gender,Actif:d.active?"Oui":"Non",Présences:p.presences,Courses:p.courses,Total:p.total,"Dernière venue":p.lastSeen||"Aucune"}}),u=t.utils.book_new(),f=t.utils.json_to_sheet(r),v=t.utils.json_to_sheet(o),m=t.utils.json_to_sheet(l);t.utils.book_append_sheet(u,f,"Élèves"),t.utils.book_append_sheet(u,v,"Présences"),t.utils.book_append_sheet(u,m,"Synthèse"),t.writeFile(u,`presences_${n}.xlsx`)}class tt{container;options;activeTab="students";periodPreset="all";startDate="";endDate="";yearFilter="all";typeFilter="all";includeInactive=!1;sortField="lastName";sortOrder="asc";students=[];attendances=[];yearsList=[];constructor(e,s){this.container=e,this.options=s}async render(){await this.loadDataAndRender()}async loadDataAndRender(){this.yearsList=await C(),this.students=await F(),this.attendances=await le();let e=this.attendances.filter(n=>n.present);this.startDate&&(e=e.filter(n=>n.date>=this.startDate)),this.endDate&&(e=e.filter(n=>n.date<=this.endDate)),this.typeFilter!=="all"&&(e=e.filter(n=>n.type===this.typeFilter));let s=this.students;this.includeInactive||(s=s.filter(n=>n.active)),this.yearFilter!=="all"&&(s=s.filter(n=>n.year===this.yearFilter));const t=Me(e);this.container.innerHTML=`
      <div style="padding: 16px; display: flex; flex-direction: column; gap: 14px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h2>${h.nav.historique}</h2>
          <button class="btn btn-primary" id="historique-export-btn" style="min-height: 38px; padding: 0 12px; font-size: 0.8rem;">
            ${h.actions.exportExcel}
          </button>
        </div>

        <div>
          ${O([{value:"students",label:h.stats.tabByStudent},{value:"dates",label:h.stats.tabByDate}],this.activeTab)}
        </div>

        <!-- Filtres généraux -->
        <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px; display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
            <label style="font-size: var(--font-size-xs); font-weight: 600;">Période :</label>
            <button class="chip ${this.periodPreset==="all"?"active":""}" id="preset-all">Tout</button>
            <button class="chip ${this.periodPreset==="month"?"active":""}" id="preset-month">Ce mois</button>
            <button class="chip ${this.periodPreset==="schoolyear"?"active":""}" id="preset-schoolyear">Année scolaire</button>
          </div>

          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <input type="date" id="historique-start-date" value="${this.startDate}" class="search-input" style="min-height: 36px; padding: 4px; font-size: 0.75rem; flex: 1;" />
            <span style="font-size: var(--font-size-xs);">à</span>
            <input type="date" id="historique-end-date" value="${this.endDate}" class="search-input" style="min-height: 36px; padding: 4px; font-size: 0.75rem; flex: 1;" />

            <select id="historique-year-filter" class="search-input" style="min-height: 36px; padding: 4px; font-size: 0.75rem; flex: 1;">
              <option value="all">Toutes les années</option>
              ${this.yearsList.map(n=>`<option value="${n}" ${this.yearFilter===n?"selected":""}>${n}</option>`).join("")}
            </select>

            <label style="display: flex; align-items: center; gap: 4px; font-size: 0.75rem; white-space: nowrap;">
              <input type="checkbox" id="historique-inactive-chk" ${this.includeInactive?"checked":""} />
              Inactifs
            </label>
          </div>
        </div>

        <!-- Vue contenu par Élève ou par Date -->
        ${this.activeTab==="students"?this.renderStudentsTableHtml(s,t):this.renderDatesListHtml(e)}
      </div>
    `,this.attachEvents(t)}renderStudentsTableHtml(e,s){const t=e.map(i=>{const r=s.get(i.id)||{presences:0,courses:0,total:0,lastSeen:null,studentId:i.id};return{student:i,stat:r}});t.sort((i,r)=>{let c=0;return this.sortField==="lastName"?c=i.student.lastName.localeCompare(r.student.lastName,"fr"):this.sortField==="firstName"?c=i.student.firstName.localeCompare(r.student.firstName,"fr"):this.sortField==="year"?c=i.student.year.localeCompare(r.student.year,"fr"):this.sortField==="presences"?c=i.stat.presences-r.stat.presences:this.sortField==="courses"?c=i.stat.courses-r.stat.courses:this.sortField==="total"&&(c=i.stat.total-r.stat.total),this.sortOrder==="asc"?c:-c});const n=i=>this.sortField!==i?"":this.sortOrder==="asc"?" ▲":" ▼";return`
      <div style="overflow-x: auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th data-sort="lastName">Nom${n("lastName")}</th>
              <th data-sort="firstName">Prénom${n("firstName")}</th>
              <th data-sort="year">Année${n("year")}</th>
              <th data-sort="presences">Prés.${n("presences")}</th>
              <th data-sort="courses">Cour.${n("courses")}</th>
              <th data-sort="total">Total${n("total")}</th>
            </tr>
          </thead>
          <tbody>
            ${t.length===0?`
              <tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Aucune donnée disponible.</td></tr>
            `:t.map(i=>`
              <tr class="historique-student-row" data-student-id="${i.student.id}" style="cursor: pointer;">
                <td><strong>${this.escapeHtml(i.student.lastName)}</strong></td>
                <td>${this.escapeHtml(i.student.firstName)}</td>
                <td><span class="badge-year">${this.escapeHtml(i.student.year)}</span></td>
                <td><strong style="color: var(--accent-presence);">${i.stat.presences}</strong></td>
                <td><strong style="color: var(--accent-course);">${i.stat.courses}</strong></td>
                <td><strong>${i.stat.total}</strong></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `}renderDatesListHtml(e){const s=new Map;for(const n of e){let i=s.get(n.date);i||(i={presences:0,courses:0},s.set(n.date,i)),n.type==="presence"?i.presences++:n.type==="course"&&i.courses++}const t=Array.from(s.keys()).sort().reverse();return`
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${t.length===0?`
          <div style="text-align: center; padding: 24px; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--radius-md);">
            Aucun pointage trouvé pour cette période.
          </div>
        `:t.map(n=>{const i=s.get(n);return`
            <div class="historique-date-card" data-date="${n}" style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
              <div>
                <div style="font-size: var(--font-size-base); font-weight: 600;">${D(n)}</div>
                <div style="font-size: var(--font-size-xs); color: var(--text-muted); margin-top: 2px;">${n}</div>
              </div>
              <div style="display: flex; gap: 12px; font-size: var(--font-size-sm); font-weight: 700;">
                <span style="color: var(--accent-presence);">Prés. ${i.presences}</span>
                <span style="color: var(--accent-course);">Cour. ${i.courses}</span>
              </div>
            </div>
          `}).join("")}
      </div>
    `}attachEvents(e){U(this.container,d=>{this.activeTab=d,this.loadDataAndRender()});const s=this.container.querySelector("#historique-export-btn");s&&s.addEventListener("click",async()=>{try{x("Génération du fichier Excel en cours..."),await et(this.students,this.attendances,e),x("Exportation Excel réussie !")}catch(d){console.error(d),x("Erreur lors de l'exportation Excel.")}});const t=T(),n=this.container.querySelector("#preset-all");n&&n.addEventListener("click",()=>{this.periodPreset="all",this.startDate="",this.endDate="",this.loadDataAndRender()});const i=this.container.querySelector("#preset-month");i&&i.addEventListener("click",()=>{this.periodPreset="month";const d=we(t);this.startDate=d.start,this.endDate=d.end,this.loadDataAndRender()});const r=this.container.querySelector("#preset-schoolyear");r&&r.addEventListener("click",()=>{this.periodPreset="schoolyear";const d=xe(t);this.startDate=d.start,this.endDate=d.end,this.loadDataAndRender()});const c=this.container.querySelector("#historique-start-date");c&&c.addEventListener("change",()=>{this.periodPreset="custom",this.startDate=c.value,this.loadDataAndRender()});const o=this.container.querySelector("#historique-end-date");o&&o.addEventListener("change",()=>{this.periodPreset="custom",this.endDate=o.value,this.loadDataAndRender()});const l=this.container.querySelector("#historique-year-filter");l&&l.addEventListener("change",()=>{this.yearFilter=l.value,this.loadDataAndRender()});const u=this.container.querySelector("#historique-inactive-chk");u&&u.addEventListener("change",()=>{this.includeInactive=u.checked,this.loadDataAndRender()}),this.container.querySelectorAll("th[data-sort]").forEach(d=>{d.addEventListener("click",()=>{const p=d.dataset.sort;this.sortField===p?this.sortOrder=this.sortOrder==="asc"?"desc":"asc":(this.sortField=p,this.sortOrder="asc"),this.loadDataAndRender()})}),this.container.querySelectorAll(".historique-student-row").forEach(d=>{d.addEventListener("click",()=>{const p=d.dataset.studentId;p&&this.options.onStudentCardClick(p)})}),this.container.querySelectorAll(".historique-date-card").forEach(d=>{d.addEventListener("click",()=>{const p=d.dataset.date;p&&this.options.onInspectDateClick(p)})})}escapeHtml(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}}class nt{container;options;constructor(e,s){this.container=e,this.options=s}async render(){await this.loadDataAndRender()}async loadDataAndRender(){const e=await k("syncUrl",""),s=await k("syncToken",""),t=await M(),n=await k("lastSyncAt",null),i=await C(),c=await E.getInstance().getPendingCount(),o=n?new Date(n).toLocaleString("fr-BE"):"Jamais";this.container.innerHTML=`
      <div style="padding: 16px; display: flex; flex-direction: column; gap: 20px;">
        <h2>${h.nav.parametres}</h2>

        <!-- Synchronisation Google Sheets -->
        <section style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 12px;">
          <h3 style="font-size: var(--font-size-base); font-weight: 700;">Synchronisation Google Sheets</h3>
          
          <div>
            <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
              ${h.sync.syncUrl}
            </label>
            <input type="text" id="param-sync-url" class="search-input" value="${this.escapeHtml(e)}" placeholder="https://script.google.com/macros/s/.../exec" />
          </div>

          <div>
            <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
              ${h.sync.syncToken}
            </label>
            <input type="password" id="param-sync-token" class="search-input" value="${this.escapeHtml(s)}" placeholder="Votre jeton de sécurité" />
          </div>

          <div>
            <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
              ${h.sync.deviceName}
            </label>
            <input type="text" id="param-device-name" class="search-input" value="${this.escapeHtml(t)}" />
          </div>

          <div style="font-size: var(--font-size-xs); color: var(--text-secondary); display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
            <span>${h.sync.lastSync} <strong>${o}</strong></span>
            <span>En attente : <strong>${c}</strong></span>
          </div>

          <div style="display: flex; gap: 10px; margin-top: 8px;">
            <button class="btn btn-secondary" id="param-save-sync-btn" style="flex: 1;">
              Enregistrer
            </button>
            <button class="btn btn-primary" id="param-sync-now-btn" style="flex: 1;">
              ${h.actions.syncNow}
            </button>
          </div>
        </section>

        <!-- Import / Export Excel -->
        <section style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 12px;">
          <h3 style="font-size: var(--font-size-base); font-weight: 700;">Import & Export des données</h3>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label class="btn btn-secondary" style="cursor: pointer; width: 100%;">
              📂 ${h.actions.importExcel}
              <input type="file" id="param-import-file" accept=".xlsx, .xls, .csv" style="display: none;" />
            </label>

            <button class="btn btn-secondary" id="param-download-template-btn">
              📄 ${h.actions.downloadTemplate}
            </button>
          </div>
        </section>

        <!-- Gestion des Années Scolaires -->
        <section style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 12px;">
          <h3 style="font-size: var(--font-size-base); font-weight: 700;">Liste des Années / Classes</h3>

          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${i.map(l=>`
              <span class="chip" style="cursor: default;">
                ${this.escapeHtml(l)}
                <button class="param-delete-year-btn" data-year="${this.escapeHtml(l)}" style="background: none; border: none; margin-left: 6px; cursor: pointer; color: var(--color-danger); font-weight: bold;">✕</button>
              </span>
            `).join("")}
          </div>

          <div style="display: flex; gap: 8px; margin-top: 4px;">
            <input type="text" id="param-add-year-input" class="search-input" placeholder="Ex: 5C" style="min-height: 40px; padding: 0 10px;" />
            <button class="btn btn-secondary" id="param-add-year-btn" style="min-height: 40px;">Ajouter</button>
          </div>
        </section>

        <!-- Sauvegarde Locale et Restauration -->
        <section style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 12px;">
          <h3 style="font-size: var(--font-size-base); font-weight: 700;">Sauvegarde & Restauration (.json)</h3>

          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" id="param-backup-json-btn" style="flex: 1;">
              📥 ${h.actions.backupJson}
            </button>
            <label class="btn btn-secondary" style="flex: 1; cursor: pointer;">
              📤 ${h.actions.restoreJson}
              <input type="file" id="param-restore-file" accept=".json" style="display: none;" />
            </label>
          </div>
        </section>

        <!-- Démonstration & Application -->
        <section style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 12px;">
          <h3 style="font-size: var(--font-size-base); font-weight: 700;">Application & Démonstration</h3>
          <p style="font-size: var(--font-size-xs); color: var(--text-secondary);">Version : 1.0.0 (PWA Standalone)</p>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button class="btn btn-secondary" id="param-seed-demo-btn" style="background-color: var(--accent-presence-light); color: var(--accent-presence);">
              🌱 Générer un jeu de démonstration (200 élèves, 3 mois d'historique)
            </button>
            <button class="btn btn-secondary" id="param-update-app-btn">
              🔄 ${h.actions.updateApp}
            </button>
          </div>
        </section>

        <!-- Zone de Danger : Remise à zéro et nouvelle année scolaire -->
        <section style="background: var(--bg-surface); border: 1px solid var(--color-danger); border-radius: var(--radius-lg); padding: 16px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 12px;">
          <h3 style="font-size: var(--font-size-base); font-weight: 700; color: var(--color-danger);">
            ⚠️ Zone de Danger (Nouvelle année scolaire / Nettoyage)
          </h3>
          <p style="font-size: var(--font-size-xs); color: var(--text-secondary);">
            Ces actions effacent définitivement les données locales de votre appareil :
          </p>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            <button class="btn btn-secondary" id="param-clear-attendances-btn" style="border-color: var(--color-warning); color: var(--color-warning);">
              🗑️ Effacer tous les pointages (Garder les élèves)
            </button>
            <button class="btn btn-danger" id="param-clear-all-btn">
              💥 Réinitialiser TOUTE la base de données (Élèves & Présences)
            </button>
          </div>
        </section>
      </div>
    `,this.attachEvents(i)}attachEvents(e){const s=this.container.querySelector("#param-save-sync-btn");s&&s.addEventListener("click",async()=>{const p=this.container.querySelector("#param-sync-url"),w=this.container.querySelector("#param-sync-token"),g=this.container.querySelector("#param-device-name");p&&await I("syncUrl",p.value.trim()),w&&await I("syncToken",w.value.trim()),g&&g.value.trim()&&await I("deviceId",g.value.trim()),x("Paramètres de synchronisation enregistrés."),this.options.onRefreshNeeded()});const t=this.container.querySelector("#param-sync-now-btn");t&&t.addEventListener("click",async()=>{x("Synchronisation en cours...");const p=await E.getInstance().triggerSync("manual");p.success?(x(h.sync.syncSuccess),await this.loadDataAndRender()):x(p.message||h.sync.syncError)});const n=this.container.querySelector("#param-download-template-btn");n&&n.addEventListener("click",async()=>{await Ze()});const i=this.container.querySelector("#param-import-file");i&&i.addEventListener("change",()=>{const p=i.files?.[0];p&&fe({file:p,onSuccess:async()=>{await this.loadDataAndRender(),this.options.onRefreshNeeded()},onClose:()=>{i.value=""}})}),this.container.querySelectorAll(".param-delete-year-btn").forEach(p=>{p.addEventListener("click",async()=>{const w=p.dataset.year;if(w){const g=e.filter(S=>S!==w);await q(g),await this.loadDataAndRender()}})});const c=this.container.querySelector("#param-add-year-btn"),o=this.container.querySelector("#param-add-year-input");c&&o&&c.addEventListener("click",async()=>{const p=o.value.trim();p&&!e.includes(p)&&(e.push(p),await q(e),await this.loadDataAndRender())});const l=this.container.querySelector("#param-backup-json-btn");l&&l.addEventListener("click",async()=>{const p=await F(),w=await le(),g={version:1,date:new Date().toISOString(),students:p,attendances:w},S=new Blob([JSON.stringify(g,null,2)],{type:"application/json"}),L=URL.createObjectURL(S),b=document.createElement("a");b.href=L,b.download=`sauvegarde_presences_${T()}.json`,b.click(),URL.revokeObjectURL(L),x("Sauvegarde JSON générée.")});const u=this.container.querySelector("#param-restore-file");u&&u.addEventListener("change",async()=>{const p=u.files?.[0];if(!p)return;const w=await p.text();try{const g=JSON.parse(w);g.students&&Array.isArray(g.students)&&(await y.transaction("rw",[y.students,y.attendances],async()=>{for(const S of g.students)await y.students.put({...S,dirty:1});if(g.attendances&&Array.isArray(g.attendances))for(const S of g.attendances)await y.attendances.put({...S,dirty:1})}),x("Restauration des données réussie !"),this.options.onRefreshNeeded())}catch{x("Fichier de sauvegarde invalide.")}});const f=this.container.querySelector("#param-seed-demo-btn");f&&f.addEventListener("click",async()=>{x("Génération de 200 élèves et 3 mois d'historique..."),await this.generateDemoData(),x("Jeu de démonstration créé avec succès !"),this.options.onRefreshNeeded()});const v=this.container.querySelector("#param-update-app-btn");v&&v.addEventListener("click",()=>{this.options.onUpdateAppClick()});const m=this.container.querySelector("#param-clear-attendances-btn");m&&m.addEventListener("click",async()=>{confirm("Voulez-vous vraiment effacer TOUS les pointages de présence et de course ? Les élèves seront conservés.")&&(await Te(),x("Tous les pointages ont été effacés."),this.options.onRefreshNeeded())});const d=this.container.querySelector("#param-clear-all-btn");d&&d.addEventListener("click",async()=>{confirm("ATTENTION : Voulez-vous vraiment TOUT réinitialiser (effacer TOUS les élèves et TOUS les pointages) ?")&&confirm("Confirmation finale : cette action est irréversible. Continuer ?")&&(await ze(),x("La base de données a été totalement réinitialisée."),await this.loadDataAndRender(),this.options.onRefreshNeeded())})}async generateDemoData(){const e=["1A","1B","2A","2B","3A","3B","4A","4B","5A","5B","6A","6B"];await q(e);const s=["Emma","Jade","Louise","Alice","Chloé","Lina","Léa","Rose","Mia","Anna","Manon","Julia","Inès","Camille","Sarah","Zoé","Eva","Lola","Victoire","Mathilde"],t=["Gabriel","Léo","Raphaël","Maël","Louis","Noah","Jules","Adam","Lucas","Hugo","Arthur","Liam","Ethan","Paul","Tom","Sacha","Théo","Mathis","Antoine","Victor"],n=["Martin","Bernard","Thomas","Petit","Robert","Richard","Durand","Dubois","Moreau","Laurent","Simon","Michel","Lefebvre","Leroy","Roux","David","Bertrand","Morel","Fournier","Girard"],i=Date.now(),r=[];await y.transaction("rw",y.students,async()=>{for(let l=0;l<200;l++){const u=l%2===0?"F":"M",f=u==="F"?s:t,v=f[Math.floor(Math.random()*f.length)]+(l>40?` ${l}`:""),m=n[Math.floor(Math.random()*n.length)],d=e[l%e.length],p=await Q({firstName:v,lastName:m,gender:u,year:d,isInternal:l%4===0,active:!0});r.push(p)}});const c=new Date,o=await M();await y.transaction("rw",y.attendances,async()=>{for(let l=0;l<90;l+=3){const u=new Date(c);u.setDate(c.getDate()-l);const f=u.toISOString().substring(0,10);for(let v=0;v<40;v++){const m=r[Math.floor(Math.random()*r.length)],d=Math.random()>.3?"presence":"course",p=u.getTime()+Math.floor(Math.random()*288e5),w=ie(m.id,f,d);await y.attendances.put({id:w,studentId:m.id,date:f,type:d,present:!0,markedAt:p,deviceId:o,updatedAt:i,dirty:1})}}})}escapeHtml(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}}function st(a={}){const{immediate:e=!1,onNeedRefresh:s,onOfflineReady:t,onRegistered:n,onRegisteredSW:i,onRegisterError:r}=a;let c,o,l;const u=async(v=!0)=>{await o,l?.()};async function f(){if("serviceWorker"in navigator){if(c=await he(async()=>{const{Workbox:v}=await import("./workbox-window.prod.es5-BBnX5xw4.js");return{Workbox:v}},[],import.meta.url).then(({Workbox:v})=>new v("./sw.js",{scope:"./",type:"classic"})).catch(v=>{r?.(v)}),!c)return;l=()=>{c?.messageSkipWaiting()};{let v=!1;const m=()=>{v=!0,c?.addEventListener("controlling",d=>{d.isUpdate&&window.location.reload()}),s?.()};c.addEventListener("installed",d=>{typeof d.isUpdate>"u"?typeof d.isExternal<"u"&&d.isExternal?m():!v&&t?.():d.isUpdate||t?.()}),c.addEventListener("waiting",m)}c.register({immediate:e}).then(v=>{i?i("./sw.js",v):n?.(v)}).catch(v=>{r?.(v)})}}return o=f(),u}class at{appElement;router;syncEngine;headerState={date:T(),type:"presence",syncStatus:"synced",pendingCount:0,daySummary:{total:0,girls:0,boys:0,internals:0}};activeViewInstance=null;updateSWHandler=null;constructor(){const e=document.getElementById("app");if(!e)throw new Error("Élément #app introuvable");this.appElement=e,this.router=new ge,this.syncEngine=E.getInstance()}async updateDaySummaryHeader(){try{const[e,s]=await Promise.all([J(this.headerState.date,this.headerState.type),F()]),t=new Map(s.map(i=>[i.id,i])),n=de(e,t,this.headerState.type);this.headerState.daySummary={total:n.total,girls:n.girls,boys:n.boys,internals:n.internals},this.renderHeaderUI()}catch(e){console.warn("Erreur lors de la mise à jour du résumé journalier:",e)}}async init(){if(typeof navigator<"u"&&navigator.storage&&navigator.storage.persist)try{await navigator.storage.persist()}catch(e){console.warn("Persistance de stockage non accordée:",e)}this.appElement.innerHTML=`
      <div id="header-container"></div>
      <main class="app-content" id="view-container"></main>
      <div id="navbar-container"></div>
      <div id="sw-update-banner" style="display: none; position: fixed; top: 0; left: 0; right: 0; background: var(--color-warning); color: #fff; padding: 8px 16px; text-align: center; font-size: 0.85rem; z-index: 1000; font-weight: 600; justify-content: space-between; align-items: center;">
        <span>Mise à jour disponible !</span>
        <button id="sw-update-btn" class="btn btn-secondary" style="min-height: 32px; padding: 0 10px; font-size: 0.75rem;">
          Mettre à jour
        </button>
      </div>
    `,this.syncEngine.subscribe((e,s)=>{this.headerState.syncStatus=e,this.headerState.pendingCount=s,this.renderHeaderUI()}),this.setupRoutes(),await this.updateDaySummaryHeader(),this.initServiceWorker(),this.syncEngine.triggerSync("app_init")}renderHeaderUI(){const e=document.getElementById("header-container");e&&(e.innerHTML=Se(this.headerState),$e(e,async s=>{this.headerState.date=s,await this.updateDaySummaryHeader(),this.activeViewInstance&&typeof this.activeViewInstance.updateOptions=="function"?this.activeViewInstance.updateOptions({...this.activeViewInstance.options,date:s}):this.activeViewInstance&&typeof this.activeViewInstance.render=="function"&&this.activeViewInstance.render()},()=>{x("Synchronisation en cours..."),this.syncEngine.triggerSync("header_button")},()=>{this.router.navigate("#/parametres")}))}renderNavbarUI(e){const s=document.getElementById("navbar-container");s&&(s.innerHTML=Le(e),Ae(s,t=>{this.router.navigate(t)}))}setupRoutes(){const e=document.getElementById("view-container");if(!e)return;const s=async()=>{this.syncEngine.scheduleDebouncedSync(1e4),this.syncEngine.notifyListeners(),await this.updateDaySummaryHeader()};this.router.addRoute("#/pointage",async()=>{this.headerState.showTopo=!0,await this.updateDaySummaryHeader(),this.renderNavbarUI("#/pointage");const t=new je(e,{date:this.headerState.date,type:this.headerState.type,onStudentCardClick:n=>{this.router.navigate(`#/fiche?id=${n}`)},onRefreshNeeded:s,onTypeChange:async n=>{this.headerState.type=n,await this.updateDaySummaryHeader()}});this.activeViewInstance=t,t.render()}),this.router.addRoute("#/jour",async()=>{this.headerState.showTopo=!1,this.renderHeaderUI(),this.renderNavbarUI("#/jour");const t=new Fe(e,{date:this.headerState.date,type:this.headerState.type,onStudentCardClick:n=>{this.router.navigate(`#/fiche?id=${n}`)},onRefreshNeeded:s});this.activeViewInstance=t,t.render()}),this.router.addRoute("#/eleves",async()=>{this.headerState.showTopo=!1,this.renderHeaderUI(),this.renderNavbarUI("#/eleves");const t=new Xe(e,{onStudentCardClick:n=>{this.router.navigate(`#/fiche?id=${n}`)},onRefreshNeeded:s});this.activeViewInstance=t,t.render()}),this.router.addRoute("#/fiche",async(t,n)=>{this.headerState.showTopo=!1,this.renderHeaderUI(),this.renderNavbarUI("#/eleves");const i=n.id||"",r=new Ke(e,{studentId:i,onBack:()=>{window.history.back()},onRefreshNeeded:s});this.activeViewInstance=r,r.render()}),this.router.addRoute("#/historique",async()=>{this.headerState.showTopo=!1,this.renderHeaderUI(),this.renderNavbarUI("#/historique");const t=new tt(e,{onStudentCardClick:n=>{this.router.navigate(`#/fiche?id=${n}`)},onInspectDateClick:async n=>{this.headerState.date=n,this.router.navigate("#/jour")}});this.activeViewInstance=t,t.render()}),this.router.addRoute("#/parametres",async()=>{this.headerState.showTopo=!1,this.renderHeaderUI(),this.renderNavbarUI("#/parametres");const t=new nt(e,{onRefreshNeeded:s,onUpdateAppClick:()=>{this.updateSWHandler?this.updateSWHandler():x("L'application est déjà à jour.")}});this.activeViewInstance=t,t.render()}),this.router.init()}initServiceWorker(){if("serviceWorker"in navigator){const e=st({onNeedRefresh:()=>{const s=document.getElementById("sw-update-banner"),t=document.getElementById("sw-update-btn");s&&(s.style.display="flex"),this.updateSWHandler=()=>{e(!0)},t&&t.addEventListener("click",this.updateSWHandler)},onOfflineReady:()=>{x(h.pwa.offlineReady)}})}}}document.addEventListener("DOMContentLoaded",()=>{new at().init()});
