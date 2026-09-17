import{D as me}from"./dexie-BoEa_wtx.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))t(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const i of r.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&t(i)}).observe(document,{childList:!0,subtree:!0});function n(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function t(s){if(s.ep)return;s.ep=!0;const r=n(s);fetch(s.href,r)}})();class ge{routes={};currentRoute="";constructor(){window.addEventListener("hashchange",()=>this.handleHashChange())}addRoute(e,n){this.routes[e]=n}navigate(e){window.location.hash=e}init(){this.handleHashChange()}handleHashChange(){const e=window.location.hash||"#/pointage";this.currentRoute=e;const[n,t]=e.split("?"),s={};t&&new URLSearchParams(t).forEach((o,d)=>{s[d]=o});const r=this.routes[n];if(r)r(n,s);else{const i=this.routes["#/pointage"];i&&i("#/pointage",s)}}getCurrentRoute(){return this.currentRoute}}const u={appName:"Prise de Présences",nav:{pointage:"Pointage",jour:"Aujourd'hui",eleves:"Élèves",historique:"Historique",parametres:"Paramètres"},types:{presence:"Présence",course:"Course"},header:{dateWarning:"Attention : pointage sur une date passée !",resetFilters:"Réinitialiser",searchPlaceholder:"Rechercher par prénom ou nom...",allYears:"Toutes",includeInactive:"Inclure inactifs"},actions:{addStudent:"Ajouter un élève",edit:"Modifier",save:"Enregistrer",cancel:"Annuler",syncNow:"Synchroniser maintenant",exportExcel:"Exporter (.xlsx)",importExcel:"Importer (.xlsx, .csv)",downloadTemplate:"Gabarit d'import",backupJson:"Sauvegarder (.json)",restoreJson:"Restaurer (.json)",copySummary:"Copier le résumé",copiedSuccess:"Résumé copié dans le presse-papier !",updateApp:"Mettre à jour l'application"},student:{lastName:"Nom",firstName:"Prénom",gender:"Sexe",female:"Fille (F)",male:"Garçon (M)",year:"Année scolaire / Classe",active:"Actif",notes:"Remarques / Notes",lastSeen:"Dernière venue",never:"Aucune",duplicateWarning:"Attention : un élève similaire existe déjà (même nom, prénom et année)."},stats:{total:"Total",noAttendanceToday:"Aucun pointage pour cette journée.",longPressHint:"Appui long pour annuler un pointage.",tabByStudent:"Par élève",tabByDate:"Par date"},sync:{synced:"Synchronisé",pending:"Modifications en attente ({count})",offline:"Hors ligne",lastSync:"Dernière synchronisation :",syncUrl:"URL Google Apps Script",syncToken:"Jeton de sécurité (Token)",deviceName:"Nom de l'appareil",syncSuccess:"Synchronisation réussie !",syncError:"Échec de la synchronisation."},pwa:{offlineReady:"L'application est prête à fonctionner hors ligne."}};function j(a,e,n=""){const t=a.map(s=>`
    <button class="segmented-option ${s.value===e?"active":""}" data-value="${s.value}">
      ${s.label}
    </button>
  `).join("");return`
    <div class="segmented-control ${n}">
      ${t}
    </div>
  `}function B(a,e){a.querySelectorAll(".segmented-option").forEach(t=>{t.addEventListener("click",()=>{const s=t.dataset.value;s&&e(s)})})}const te="Europe/Brussels";function D(){return be(new Date)}function be(a){const e=new Date(a),t=new Intl.DateTimeFormat("fr-BE",{timeZone:te,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(e),s=t.find(o=>o.type==="day")?.value||"01",r=t.find(o=>o.type==="month")?.value||"01";return`${t.find(o=>o.type==="year")?.value||"2026"}-${r}-${s}`}function V(a){const e=new Date(a);return new Intl.DateTimeFormat("fr-BE",{timeZone:te,hour:"2-digit",minute:"2-digit",hour12:!1}).format(e)}function I(a){if(!a)return"";const[e,n,t]=a.split("-").map(Number),s=new Date(Date.UTC(e,n-1,t,12,0,0));return new Intl.DateTimeFormat("fr-BE",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(s)}function xe(a){const e=parseInt(a.substring(0,4),10),n=parseInt(a.substring(5,7),10);let t=e;return n<9&&(t=e-1),{start:`${t}-09-01`,end:`${t+1}-08-31`}}function we(a){const e=parseInt(a.substring(0,4),10),n=parseInt(a.substring(5,7),10),t=new Date(e,n,0).getDate(),s=n.toString().padStart(2,"0"),r=t.toString().padStart(2,"0");return{start:`${e}-${s}-01`,end:`${e}-${s}-${r}`}}function Se(a){const e=document.documentElement;a==="presence"?(e.style.setProperty("--accent-active","var(--accent-presence)"),e.style.setProperty("--accent-active-light","var(--accent-presence-light)"),e.style.setProperty("--accent-active-glow","var(--accent-presence-glow)")):(e.style.setProperty("--accent-active","var(--accent-course)"),e.style.setProperty("--accent-active-light","var(--accent-course-light)"),e.style.setProperty("--accent-active-glow","var(--accent-course-glow)"))}function $e(a){Se(a.type);const e=D(),n=a.date<e;let t=u.sync.synced,s="synced";a.syncStatus==="pending"?(t=u.sync.pending.replace("{count}",a.pendingCount.toString()),s="pending"):a.syncStatus==="offline"&&(t=u.sync.offline,s="offline");const r=j([{value:"presence",label:u.types.presence},{value:"course",label:u.types.course}],a.type);return`
    <header class="app-header">
      ${n?`<div class="past-date-banner">${u.header.dateWarning}</div>`:""}

      <div class="header-top">
        <div class="header-title">
          <span>${u.appName}</span>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <button class="sync-indicator ${s}" id="header-sync-btn" title="État de la synchronisation">
            <span class="sync-dot"></span>
            <span>${t}</span>
          </button>

          <button class="btn btn-secondary" id="header-settings-btn" style="min-height: 38px; padding: 0 10px;" aria-label="${u.nav.parametres}">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>
          </button>
        </div>
      </div>

      <div style="display: flex; gap: 10px; align-items: center; margin-top: 4px;">
        <input type="date" id="header-date-input" value="${a.date}" class="search-input" style="min-height: 42px; padding: 4px 10px; width: auto; flex: 1;" />
        <div style="flex: 1.5;">${r}</div>
      </div>
    </header>
  `}function Ae(a,e,n,t,s){const r=a.querySelector("#header-date-input");r&&r.addEventListener("change",()=>{r.value&&e(r.value)}),B(a,d=>{n(d)});const i=a.querySelector("#header-sync-btn");i&&i.addEventListener("click",t);const o=a.querySelector("#header-settings-btn");o&&o.addEventListener("click",s)}function Le(a){const e=a==="#/pointage"||a===""||a==="#/",n=a.startsWith("#/jour"),t=a.startsWith("#/eleves"),s=a.startsWith("#/historique");return`
    <nav class="app-navbar" aria-label="Navigation principale">
      <button class="nav-item ${e?"active":""}" data-route="#/pointage" aria-label="${u.nav.pointage}">
        <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        <span>${u.nav.pointage}</span>
      </button>

      <button class="nav-item ${n?"active":""}" data-route="#/jour" aria-label="${u.nav.jour}">
        <svg viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/></svg>
        <span>${u.nav.jour}</span>
      </button>

      <button class="nav-item ${t?"active":""}" data-route="#/eleves" aria-label="${u.nav.eleves}">
        <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
        <span>${u.nav.eleves}</span>
      </button>

      <button class="nav-item ${s?"active":""}" data-route="#/historique" aria-label="${u.nav.historique}">
        <svg viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.25 2.52.77-1.28-3.52-2.09V8z"/></svg>
        <span>${u.nav.historique}</span>
      </button>
    </nav>
  `}function ke(a,e){a.querySelectorAll(".nav-item").forEach(t=>{t.addEventListener("click",()=>{const s=t.dataset.route;s&&e(s)})})}function Ee(){if(typeof navigator<"u"&&"vibrate"in navigator)try{navigator.vibrate(40)}catch{}}let N=null;function Ne(){return N||(N=document.createElement("div"),N.className="toast-container",document.body.appendChild(N)),N}function b(a,e=3e3){const n=Ne(),t=document.createElement("div");t.className="toast",t.textContent=a,n.appendChild(t),setTimeout(()=>{t.style.opacity="0",t.style.transition="opacity 200ms ease-out",setTimeout(()=>{t.remove()},200)},e)}class Ie extends me{students;attendances;meta;importLog;constructor(){super("PresencesDB"),this.version(1).stores({students:"id, lastName, firstName, year, gender, active, dirty, searchKey",attendances:"id, studentId, date, type, [date+type], [studentId+date], dirty",meta:"key",importLog:"id, date"})}}const y=new Ie;function U(){return typeof crypto<"u"&&crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,a=>{const e=Math.random()*16|0;return(a==="x"?e:e&3|8).toString(16)})}function ne(a,e,n){return`${a}_${e}_${n}`}function De(){return`android-device-${Math.floor(1e3+Math.random()*9e3)}`}async function k(a,e){const n=await y.meta.get(a);return!n||n.value===void 0||n.value===null?e:n.value}async function E(a,e){await y.meta.put({key:a,value:e})}async function T(){let a=await k("deviceId",null);return a||(a=De(),await E("deviceId",a)),a}async function z(){return await k("years",["1A","1B","2A","2B","3A","3B","4A","4B","5A","5B","6A","6B"])}async function H(a){await E("years",a)}async function se(a){const e=await z(),n=a.trim();return n&&!e.includes(n)&&(e.push(n),await H(e)),e}function x(a){return a?a.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," "):""}function _(a,e){const n=x(a),t=x(e);return`${n} ${t} ${t} ${n}`}async function Y(a){const e=Date.now(),n=U(),t=a.firstName.trim(),s=a.lastName.trim(),r={id:n,firstName:t,lastName:s,gender:a.gender,year:a.year.trim(),active:a.active!==void 0?a.active:!0,notes:(a.notes||"").trim(),createdAt:new Date(e).toISOString(),updatedAt:e,dirty:1,searchKey:_(t,s)};return await y.students.put(r),r}async function ae(a){const e=await y.students.get(a.id);if(!e)throw new Error(`Élève introuvable pour l'identifiant ${a.id}`);const n=Date.now(),t=a.firstName!==void 0?a.firstName.trim():e.firstName,s=a.lastName!==void 0?a.lastName.trim():e.lastName,r={...e,firstName:t,lastName:s,gender:a.gender!==void 0?a.gender:e.gender,year:a.year!==void 0?a.year.trim():e.year,notes:a.notes!==void 0?a.notes.trim():e.notes,active:a.active!==void 0?a.active:e.active,updatedAt:n,dirty:1,searchKey:_(t,s)};return await y.students.put(r),r}async function ie(a){return await y.students.get(a)}async function M(){return await y.students.toArray()}async function P(a={}){let e=await y.students.toArray();if(a.onlyActive&&(e=e.filter(n=>n.active)),a.years&&a.years.length>0&&!a.years.includes("all")){const n=new Set(a.years);e=e.filter(t=>n.has(t.year))}if(a.query&&a.query.trim()){const n=x(a.query);e=e.filter(t=>t.searchKey.includes(n))}if(a.initialLetter&&a.initialLetter!=="ALL"){const n=x(a.initialLetter);e=e.filter(t=>x(t.firstName).startsWith(n))}return e.sort((n,t)=>{const s=n.firstName.localeCompare(t.firstName,"fr",{sensitivity:"base"});return s!==0?s:n.lastName.localeCompare(t.lastName,"fr",{sensitivity:"base"})})}async function ze(a,e,n,t){const s=x(a),r=x(e),i=n.trim();return(await y.students.toArray()).some(d=>t&&d.id===t?!1:x(d.firstName)===s&&x(d.lastName)===r&&d.year.trim()===i)}async function J(){return await y.students.where("dirty").equals(1).toArray()}async function K(a){await y.transaction("rw",y.students,async()=>{for(const e of a)await y.students.update(e,{dirty:0})})}async function O(a,e,n,t){const s=ne(a,e,n),r=await y.attendances.get(s),i=Date.now(),o=await T(),d=t!==void 0?t:r?!r.present:!0,c={id:s,studentId:a,date:e,type:n,present:d,markedAt:i,deviceId:o,updatedAt:i,dirty:1};return await y.attendances.put(c),c}async function re(a,e){return await y.attendances.where("[date+type]").equals([a,e]).toArray()}async function Re(a){return await y.attendances.where("studentId").equals(a).toArray()}async function oe(){return await y.attendances.toArray()}async function X(){return await y.attendances.where("dirty").equals(1).toArray()}async function Z(a){await y.transaction("rw",y.attendances,async()=>{for(const e of a)await y.attendances.update(e,{dirty:0})})}async function qe(a,e,n,t,s){const i=await fetch(a,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action:"push",token:e,deviceId:n,students:t,attendances:s})});if(!i.ok)throw new Error(`Erreur réseau HTTP ${i.status}`);const o=await i.json();if(!o.ok)throw new Error(o.error||"Erreur lors du push serveur");return o}async function Ce(a,e,n){const s=await fetch(a,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action:"pull",token:e,since:n})});if(!s.ok)throw new Error(`Erreur réseau HTTP ${s.status}`);const r=await s.json();if(!r.ok)throw new Error(r.error||"Erreur lors du pull serveur");return r}class L{static instance;isSyncing=!1;debounceTimer=null;listeners=new Set;retryDelayMs=3e4;isOnline=typeof navigator<"u"?navigator.onLine:!0;constructor(){typeof window<"u"&&(window.addEventListener("online",()=>{this.isOnline=!0,this.triggerSync("online_event")}),window.addEventListener("offline",()=>{this.isOnline=!1,this.notifyListeners()}),document.addEventListener("visibilitychange",()=>{document.visibilityState==="visible"&&this.triggerSync("visibility_change")}))}static getInstance(){return L.instance||(L.instance=new L),L.instance}subscribe(e){return this.listeners.add(e),this.notifyListeners(),()=>{this.listeners.delete(e)}}scheduleDebouncedSync(e=1e4){this.notifyListeners(),this.debounceTimer&&clearTimeout(this.debounceTimer),this.debounceTimer=setTimeout(()=>{this.triggerSync("debounced_auto")},e)}async getPendingCount(){const e=await J(),n=await X();return e.length+n.length}async notifyListeners(){const e=await this.getPendingCount();let n="synced";this.isOnline?e>0&&(n="pending"):n="offline";for(const t of this.listeners)t(n,e)}async triggerSync(e="manual"){if(this.isSyncing)return{success:!1,message:"Synchronisation déjà en cours."};if(!this.isOnline)return this.notifyListeners(),{success:!1,message:"Appareil hors ligne."};const n=await k("syncUrl",""),t=await k("syncToken","");if(!n||!t)return this.notifyListeners(),{success:!1,message:"URL ou jeton de synchronisation non configuré."};this.isSyncing=!0;try{const s=await T(),r=await J(),i=await X();if(r.length>0||i.length>0){const c=r.slice(0,500),h=i.slice(0,500),m=await qe(n,t,s,c,h);if(m.accepted){const f=new Set(m.accepted),v=c.filter(p=>f.has(p.id)).map(p=>p.id),l=h.filter(p=>f.has(p.id)).map(p=>p.id);await K(v),await Z(l)}if(m.rejected){const f=new Set(m.rejected),v=c.filter(p=>f.has(p.id)).map(p=>p.id),l=h.filter(p=>f.has(p.id)).map(p=>p.id);await K(v),await Z(l)}}const o=await k("lastPullCursor",0),d=await Ce(n,t,o);return(d.students||d.attendances)&&await y.transaction("rw",[y.students,y.attendances,y.meta],async()=>{if(d.students)for(const c of d.students){const h=await y.students.get(c.id);(!h||c.updatedAt>h.updatedAt)&&await y.students.put({...c,dirty:0})}if(d.attendances)for(const c of d.attendances){const h=await y.attendances.get(c.id);(!h||c.updatedAt>h.updatedAt)&&await y.attendances.put({...c,dirty:0})}d.cursor!==void 0&&await E("lastPullCursor",d.cursor),await E("lastSyncAt",Date.now())}),this.retryDelayMs=3e4,await this.notifyListeners(),{success:!0}}catch(s){return console.error(`[Sync Engine Error (${e})]:`,s),this.retryDelayMs<6e5&&(this.retryDelayMs*=4),this.notifyListeners(),{success:!1,message:s?.message||"Erreur inconnue lors de la synchronisation."}}finally{this.isSyncing=!1}}}const He="ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");function ce(a,e){const n=He.map(s=>{const r=a.has(s),i=e===s;let o="az-letter";return i&&(o+=" active"),r?o+=" available":o+=" disabled",`
      <button class="${o}" data-letter="${s}" ${!r&&!i?"disabled":""}>
        ${s}
      </button>
    `}).join("");return`
    <div class="az-bar" aria-label="Filtre par initiale du prénom">
      <button class="az-letter ${e==="ALL"||!e?"active":"available"}" data-letter="ALL">
        Tous
      </button>
      ${n}
    </div>
  `}function de(a,e){a.querySelectorAll(".az-letter").forEach(t=>{t.addEventListener("click",()=>{const s=t.dataset.letter||"ALL";e(s)})})}function le(a,e){const n=e.length===0||e.includes("all"),t=`
    <button class="chip ${n?"active":""}" data-year="all">
      ${u.header.allYears}
    </button>
  `,s=a.map(r=>`
      <button class="chip ${!n&&e.includes(r)?"active":""}" data-year="${r}">
        ${r}
      </button>
    `).join("");return`
    <div class="chips-scroll" aria-label="Filtre par année scolaire">
      ${t}
      ${s}
    </div>
  `}function ue(a,e,n){a.querySelectorAll(".chip").forEach(s=>{s.addEventListener("click",()=>{const r=s.dataset.year;if(!r)return;if(r==="all"){n(["all"]);return}let i=e.filter(o=>o!=="all");i.includes(r)?i=i.filter(o=>o!==r):i.push(r),i.length===0&&(i=["all"]),n(i)})})}function pe(a,e,n){let t=0,s=0,r=0;const i={};for(const o of a){if(!o.present||n&&o.type!==n)continue;const d=e.get(o.studentId);if(!d)continue;t++,d.gender==="F"?s++:d.gender==="M"&&r++;const c=d.year||"Non spécifiée";i[c]||(i[c]={girls:0,boys:0,total:0}),i[c].total++,d.gender==="F"?i[c].girls++:d.gender==="M"&&i[c].boys++}return{total:t,girls:s,boys:r,byYear:i}}function Te(a){const e=new Map;for(const n of a){if(!n.present)continue;let t=e.get(n.studentId);t||(t={studentId:n.studentId,presences:0,courses:0,total:0,lastSeen:null},e.set(n.studentId,t)),n.type==="presence"?t.presences++:n.type==="course"&&t.courses++,t.total++,(!t.lastSeen||n.date>t.lastSeen)&&(t.lastSeen=n.date)}return e}class Me{container;options;searchQuery="";selectedYears=["all"];selectedLetter="ALL";students=[];attendanceMap=new Map;yearsList=[];constructor(e,n){this.container=e,this.options=n}async updateOptions(e){this.options=e,await this.loadDataAndRender()}async render(){await this.loadDataAndRender()}async loadDataAndRender(){this.yearsList=await z();const e=await re(this.options.date,this.options.type);this.attendanceMap.clear();for(const o of e)o.present&&this.attendanceMap.set(o.studentId,!0);const n=await P({onlyActive:!0});let t=n;if(this.selectedYears.length>0&&!this.selectedYears.includes("all")){const o=new Set(this.selectedYears);t=t.filter(d=>o.has(d.year))}if(this.searchQuery.trim()){const o=x(this.searchQuery);t=t.filter(d=>d.searchKey.includes(o))}const s=new Set;for(const o of t){const d=x(o.firstName);d.length>0&&s.add(d.charAt(0).toUpperCase())}this.students=await P({query:this.searchQuery,years:this.selectedYears,initialLetter:this.selectedLetter,onlyActive:!0});const r=new Map(n.map(o=>[o.id,o])),i=pe(e,r,this.options.type);this.container.innerHTML=`
      <div style="padding: 12px 16px;">
        <div class="filter-section">
          <div class="search-bar">
            <svg class="search-icon" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            <input type="text" id="pointage-search" class="search-input" placeholder="${u.header.searchPlaceholder}" value="${this.escapeHtml(this.searchQuery)}" />
            ${this.searchQuery?'<button class="clear-search-btn" id="pointage-clear-search">✕</button>':""}
          </div>

          <div>${le(this.yearsList,this.selectedYears)}</div>
          <div>${ce(s,this.selectedLetter)}</div>

          ${this.searchQuery||!this.selectedYears.includes("all")||this.selectedLetter!=="ALL"?`
            <div style="display: flex; justify-content: flex-end;">
              <button class="btn btn-secondary" id="pointage-reset-filters" style="min-height: 36px; padding: 0 12px; font-size: 0.8rem;">
                ${u.header.resetFilters}
              </button>
            </div>
          `:""}
        </div>

        <div class="student-list" id="pointage-student-list" style="margin-top: 12px; padding: 0;">
          ${this.renderStudentListHtml()}
        </div>
      </div>

      <div class="sticky-counter-bar">
        <div>
          <span>${this.options.type==="presence"?u.types.presence:u.types.course} : </span>
          <span style="color: var(--accent-active); font-size: 1.1rem;">${i.total}</span>
        </div>
        <div style="font-weight: 500; font-size: 0.85rem; color: var(--text-secondary);">
          <span>F: ${i.girls}</span> | <span>G: ${i.boys}</span>
        </div>
      </div>
    `,this.attachEvents()}renderStudentListHtml(){return this.students.length===0?`
        <div style="text-align: center; padding: 32px 16px; color: var(--text-muted);">
          <p>Aucun élève ne correspond aux critères de recherche.</p>
          ${this.searchQuery.trim().length>0?`
            <button class="btn btn-primary" id="pointage-add-quick" style="margin-top: 16px;">
              ${u.actions.addStudent} « ${this.escapeHtml(this.searchQuery.trim())} »
            </button>
          `:""}
        </div>
      `:this.students.map(e=>{const n=this.attendanceMap.get(e.id)||!1;return`
          <div class="student-card ${n?"marked-present":""}" data-student-id="${e.id}">
            <div class="student-info">
              <div class="student-name">${this.escapeHtml(e.firstName)} ${this.escapeHtml(e.lastName)}</div>
              <div class="student-meta">
                <span class="badge-year">${this.escapeHtml(e.year)}</span>
                <span class="badge-gender ${e.gender}">${e.gender==="F"?"Fille":"Garçon"}</span>
              </div>
            </div>
            <div class="check-indicator">
              ${n?'<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>':""}
            </div>
          </div>
        `}).join("")}attachEvents(){const e=this.container.querySelector("#pointage-search");if(e){e.focus();const i=e.value.length;e.setSelectionRange(i,i),e.addEventListener("input",()=>{this.searchQuery=e.value,this.loadDataAndRender()})}const n=this.container.querySelector("#pointage-clear-search");n&&n.addEventListener("click",()=>{this.searchQuery="",this.loadDataAndRender()});const t=this.container.querySelector("#pointage-reset-filters");t&&t.addEventListener("click",()=>{this.searchQuery="",this.selectedYears=["all"],this.selectedLetter="ALL",this.loadDataAndRender()}),ue(this.container,this.selectedYears,i=>{this.selectedYears=i,this.loadDataAndRender()}),de(this.container,i=>{this.selectedLetter=i,this.loadDataAndRender()}),this.container.querySelectorAll(".student-card").forEach(i=>{i.addEventListener("click",async()=>{const o=i.dataset.studentId;if(!o)return;Ee();const d=await O(o,this.options.date,this.options.type);if(this.attendanceMap.set(o,d.present),d.present){i.classList.add("marked-present");const c=i.querySelector(".check-indicator");c&&(c.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>')}else{i.classList.remove("marked-present");const c=i.querySelector(".check-indicator");c&&(c.innerHTML="")}this.options.onRefreshNeeded()})});const r=this.container.querySelector("#pointage-add-quick");r&&r.addEventListener("click",async()=>{const i=this.searchQuery.trim(),o=i.split(" "),d=o[0]||i,c=o.slice(1).join(" ")||"Élève",h=this.yearsList[0]||"1A",m=await Y({firstName:d,lastName:c,gender:"F",year:h,active:!0});await O(m.id,this.options.date,this.options.type,!0),b(`Élève ${d} créé et marqué présent !`),this.searchQuery="",this.loadDataAndRender(),this.options.onRefreshNeeded()})}escapeHtml(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}}class Pe{container;options;activeTab;constructor(e,n){this.container=e,this.options=n,this.activeTab=n.type}async render(){await this.loadDataAndRender()}async loadDataAndRender(){const n=(await re(this.options.date,this.activeTab)).filter(c=>c.present),t=await M(),s=new Map(t.map(c=>[c.id,c])),r=pe(n,new Map(t.map(c=>[c.id,c])),this.activeTab),i=n.map(c=>({attendance:c,student:s.get(c.studentId)})).filter(c=>!!c.student).sort((c,h)=>h.attendance.markedAt-c.attendance.markedAt),o=j([{value:"presence",label:u.types.presence},{value:"course",label:u.types.course}],this.activeTab),d=Object.entries(r.byYear).sort(([c],[h])=>c.localeCompare(h)).map(([c,h])=>`
        <tr>
          <td><strong>${this.escapeHtml(c)}</strong></td>
          <td>${h.girls}</td>
          <td>${h.boys}</td>
          <td><strong>${h.total}</strong></td>
        </tr>
      `).join("");this.container.innerHTML=`
      <div style="padding: 16px; display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h2>${I(this.options.date)}</h2>
          <button class="btn btn-secondary" id="jour-copy-summary-btn" style="min-height: 38px; padding: 0 12px;">
            ${u.actions.copySummary}
          </button>
        </div>

        <div>${o}</div>

        <!-- Carte de résumé -->
        <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px; display: flex; flex-direction: column; gap: 12px; box-shadow: var(--shadow-sm);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: var(--font-size-base); font-weight: 700; color: var(--text-primary);">
              Résumé — ${this.activeTab==="presence"?u.types.presence:u.types.course}
            </span>
            <span style="font-size: var(--font-size-xl); font-weight: 800; color: var(--accent-active);">
              ${r.total} élève(s)
            </span>
          </div>

          <div style="display: flex; gap: 16px; font-size: var(--font-size-sm); color: var(--text-secondary);">
            <div>Filles : <strong style="color: #db2777;">${r.girls}</strong></div>
            <div>Garçons : <strong style="color: #0284c7;">${r.boys}</strong></div>
          </div>

          ${Object.keys(r.byYear).length>0?`
            <table class="data-table" style="margin-top: 8px;">
              <thead>
                <tr>
                  <th>Année</th>
                  <th>Filles</th>
                  <th>Garçons</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${d}
              </tbody>
            </table>
          `:'<p style="font-size: 0.85rem; color: var(--text-muted);">Aucune répartition disponible.</p>'}
        </div>

        <!-- Liste des élèves présent(e)s -->
        <div>
          <h3 style="margin-bottom: 8px; font-size: var(--font-size-base);">${u.nav.jour} (${i.length})</h3>
          <p style="font-size: var(--font-size-xs); color: var(--text-muted); margin-bottom: 8px;">${u.stats.longPressHint}</p>

          ${i.length===0?`
            <div style="text-align: center; padding: 24px; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              ${u.stats.noAttendanceToday}
            </div>
          `:`
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${i.map(c=>`
                <div class="student-card" data-student-id="${c.student.id}" data-attendance-id="${c.attendance.id}">
                  <div class="student-info">
                    <div class="student-name">${this.escapeHtml(c.student.firstName)} ${this.escapeHtml(c.student.lastName)}</div>
                    <div class="student-meta">
                      <span class="badge-year">${this.escapeHtml(c.student.year)}</span>
                      <span class="badge-gender ${c.student.gender}">${c.student.gender==="F"?"Fille":"Garçon"}</span>
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: var(--font-size-xs); color: var(--text-muted); font-weight: 500;">
                      ${V(c.attendance.markedAt)}
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
    `,this.attachEvents(r)}attachEvents(e){B(this.container,s=>{this.activeTab=s,this.loadDataAndRender()});const n=this.container.querySelector("#jour-copy-summary-btn");n&&n.addEventListener("click",()=>{let s=`Résumé des ${this.activeTab==="presence"?"présences":"courses"} — ${I(this.options.date)}
`;s+=`Total: ${e.total} (Filles: ${e.girls}, Garçons: ${e.boys})

`,s+=`Répartition par année:
`;for(const[r,i]of Object.entries(e.byYear))s+=`- ${r}: ${i.total} (F: ${i.girls}, G: ${i.boys})
`;navigator.clipboard.writeText(s),b(u.actions.copiedSuccess)}),this.container.querySelectorAll(".student-card").forEach(s=>{const r=s.dataset.studentId;if(!r)return;const i=s.querySelector(".jour-cancel-btn");i&&i.addEventListener("click",async o=>{o.stopPropagation(),await O(r,this.options.date,this.activeTab,!1),b("Pointage annulé"),this.loadDataAndRender(),this.options.onRefreshNeeded()}),s.addEventListener("click",()=>{this.options.onStudentCardClick(r)})})}escapeHtml(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}}class je{container;options;searchQuery="";selectedYears=["all"];selectedLetter="ALL";showInactive=!1;students=[];yearsList=[];constructor(e,n){this.container=e,this.options=n}async render(){await this.loadDataAndRender()}async loadDataAndRender(){this.yearsList=await z();const e=await P({onlyActive:!this.showInactive}),n=new Set;for(const t of e){const s=x(t.firstName);s.length>0&&n.add(s.charAt(0).toUpperCase())}this.students=await P({query:this.searchQuery,years:this.selectedYears,initialLetter:this.selectedLetter,onlyActive:!this.showInactive}),this.container.innerHTML=`
      <div style="padding: 12px 16px; position: relative; min-height: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h2>${u.nav.eleves} (${this.students.length})</h2>
          <button class="btn btn-primary" id="eleves-add-btn">
            + ${u.actions.addStudent}
          </button>
        </div>

        <div class="filter-section">
          <div class="search-bar">
            <svg class="search-icon" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            <input type="text" id="eleves-search" class="search-input" placeholder="${u.header.searchPlaceholder}" value="${this.escapeHtml(this.searchQuery)}" />
            ${this.searchQuery?'<button class="clear-search-btn" id="eleves-clear-search">✕</button>':""}
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px;">
            <div>${le(this.yearsList,this.selectedYears)}</div>
            <label style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; cursor: pointer; white-space: nowrap;">
              <input type="checkbox" id="eleves-show-inactive" ${this.showInactive?"checked":""} />
              ${u.header.includeInactive}
            </label>
          </div>

          <div>${ce(n,this.selectedLetter)}</div>
        </div>

        <div class="student-list" style="margin-top: 12px; padding: 0;">
          ${this.students.length===0?`
            <div style="text-align: center; padding: 32px; color: var(--text-muted);">
              Aucun élève trouvé.
            </div>
          `:this.students.map(t=>`
            <div class="student-card" data-student-id="${t.id}">
              <div class="student-info">
                <div class="student-name" style="${t.active?"":"text-decoration: line-through; opacity: 0.6;"}">
                  ${this.escapeHtml(t.firstName)} ${this.escapeHtml(t.lastName)}
                  ${t.active?"":' <span style="font-size: 0.75rem; color: var(--color-danger);">(Inactif)</span>'}
                </div>
                <div class="student-meta">
                  <span class="badge-year">${this.escapeHtml(t.year)}</span>
                  <span class="badge-gender ${t.gender}">${t.gender==="F"?"Fille":"Garçon"}</span>
                  ${t.notes?`<span style="color: var(--text-muted); font-size: 0.75rem;">📝 ${this.escapeHtml(t.notes)}</span>`:""}
                </div>
              </div>
              <button class="btn btn-secondary eleves-edit-btn" data-student-id="${t.id}" style="min-height: 38px; padding: 0 10px; font-size: 0.8rem;">
                ${u.actions.edit}
              </button>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- Zone Modale Formulaire -->
      <div id="eleves-modal-container"></div>
    `,this.attachEvents()}attachEvents(){const e=this.container.querySelector("#eleves-search");e&&e.addEventListener("input",()=>{this.searchQuery=e.value,this.loadDataAndRender()});const n=this.container.querySelector("#eleves-clear-search");n&&n.addEventListener("click",()=>{this.searchQuery="",this.loadDataAndRender()});const t=this.container.querySelector("#eleves-show-inactive");t&&t.addEventListener("change",()=>{this.showInactive=t.checked,this.loadDataAndRender()}),ue(this.container,this.selectedYears,o=>{this.selectedYears=o,this.loadDataAndRender()}),de(this.container,o=>{this.selectedLetter=o,this.loadDataAndRender()});const s=this.container.querySelector("#eleves-add-btn");s&&s.addEventListener("click",()=>{this.openStudentModal()}),this.container.querySelectorAll(".eleves-edit-btn").forEach(o=>{o.addEventListener("click",async d=>{d.stopPropagation();const c=o.dataset.studentId;if(c){const h=await ie(c);h&&this.openStudentModal(h)}})}),this.container.querySelectorAll(".student-card").forEach(o=>{o.addEventListener("click",()=>{const d=o.dataset.studentId;d&&this.options.onStudentCardClick(d)})})}async openStudentModal(e){const n=!!e,t=this.container.querySelector("#eleves-modal-container");if(!t)return;let s=e?e.gender:"F";t.innerHTML=`
      <div class="modal-overlay" id="eleves-modal-overlay">
        <div class="modal-content">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: var(--font-size-lg); font-weight: 700;">
              ${n?u.actions.edit:u.actions.addStudent}
            </h3>
            <button class="btn btn-secondary" id="modal-close-btn" style="min-height: 36px; padding: 0 10px;">✕</button>
          </div>

          <form id="student-form" style="display: flex; flex-direction: column; gap: 14px;">
            <div id="duplicate-warning-banner" class="past-date-banner" style="display: none;">
              ${u.student.duplicateWarning}
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${u.student.firstName} *
              </label>
              <input type="text" id="form-first-name" class="search-input" value="${e?this.escapeHtml(e.firstName):""}" required />
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${u.student.lastName} *
              </label>
              <input type="text" id="form-last-name" class="search-input" value="${e?this.escapeHtml(e.lastName):""}" required />
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${u.student.gender} *
              </label>
              <div id="form-gender-toggle">
                ${j([{value:"F",label:u.student.female},{value:"M",label:u.student.male}],s)}
              </div>
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${u.student.year} *
              </label>
              <select id="form-year-select" class="search-input" style="appearance: auto;">
                ${this.yearsList.map(g=>`
                  <option value="${g}" ${e&&e.year===g?"selected":""}>${g}</option>
                `).join("")}
              </select>
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${u.student.notes}
              </label>
              <textarea id="form-notes" class="search-input" style="min-height: 70px; resize: vertical;">${e?this.escapeHtml(e.notes):""}</textarea>
            </div>

            ${n?`
              <div style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" id="form-active-checkbox" ${e?.active?"checked":""} />
                <label for="form-active-checkbox" style="font-size: var(--font-size-sm); font-weight: 600;">
                  ${u.student.active}
                </label>
              </div>
            `:""}

            <div style="display: flex; gap: 10px; margin-top: 12px;">
              <button type="button" class="btn btn-secondary" id="form-cancel-btn" style="flex: 1;">
                ${u.actions.cancel}
              </button>
              <button type="submit" class="btn btn-primary" style="flex: 1;">
                ${u.actions.save}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;const r=()=>{t.innerHTML=""},i=t.querySelector("#eleves-modal-overlay");i&&i.addEventListener("click",g=>{g.target===i&&r()});const o=t.querySelector("#modal-close-btn");o&&o.addEventListener("click",r);const d=t.querySelector("#form-cancel-btn");d&&d.addEventListener("click",r);const c=t.querySelector("#form-gender-toggle");c&&B(c,g=>{s=g});const h=t.querySelector("#form-first-name"),m=t.querySelector("#form-last-name"),f=t.querySelector("#form-year-select"),v=t.querySelector("#duplicate-warning-banner"),l=async()=>{if(!h||!m||!f||!v)return;const g=h.value,w=m.value,S=f.value;if(g.trim()&&w.trim()){const $=await ze(g,w,S,e?.id);v.style.display=$?"block":"none"}};h&&h.addEventListener("input",l),m&&m.addEventListener("input",l),f&&f.addEventListener("change",l);const p=t.querySelector("#student-form");p&&p.addEventListener("submit",async g=>{if(g.preventDefault(),!h||!m||!f)return;const w=h.value.trim(),S=m.value.trim(),$=f.value.trim(),R=(t.querySelector("#form-notes")?.value||"").trim(),F=n?t.querySelector("#form-active-checkbox")?.checked??!0:!0;if(!w||!S||!$){b("Veuillez remplir les champs obligatoires.");return}await se($),n&&e?(await ae({id:e.id,firstName:w,lastName:S,gender:s,year:$,notes:R,active:F}),b("Élève mis à jour.")):(await Y({firstName:w,lastName:S,gender:s,year:$,notes:R,active:!0}),b("Élève créé.")),r(),await this.loadDataAndRender(),this.options.onRefreshNeeded()})}escapeHtml(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}}class Be{container;options;student=null;typeFilter="all";constructor(e,n){this.container=e,this.options=n}async render(){await this.loadDataAndRender()}async loadDataAndRender(){const e=await ie(this.options.studentId);if(!e){this.container.innerHTML=`
        <div style="padding: 24px; text-align: center;">
          <p>Élève introuvable.</p>
          <button class="btn btn-secondary" id="fiche-back-btn" style="margin-top: 16px;">Retour</button>
        </div>
      `;const d=this.container.querySelector("#fiche-back-btn");d&&d.addEventListener("click",this.options.onBack);return}this.student=e;const t=(await Re(e.id)).filter(d=>d.present);let s=0,r=0,i=null;for(const d of t)d.type==="presence"?s++:d.type==="course"&&r++,(!i||d.date>i)&&(i=d.date);let o=t;this.typeFilter!=="all"&&(o=o.filter(d=>d.type===this.typeFilter)),o.sort((d,c)=>c.markedAt-d.markedAt),this.container.innerHTML=`
      <div style="padding: 16px; display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; items-center; justify-content: space-between;">
          <button class="btn btn-secondary" id="fiche-back-btn" style="min-height: 38px; padding: 0 12px;">
            ← Retour
          </button>
          <button class="btn btn-primary" id="fiche-toggle-active-btn" style="min-height: 38px; padding: 0 12px; font-size: 0.8rem; background-color: ${e.active?"var(--color-danger)":"var(--accent-active)"}">
            ${e.active?"Désactiver l'élève":"Réactiver l'élève"}
          </button>
        </div>

        <!-- En-tête Identité -->
        <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px; box-shadow: var(--shadow-sm);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h2 style="font-size: var(--font-size-xl); font-weight: 700;">
                ${this.escapeHtml(e.firstName)} ${this.escapeHtml(e.lastName)}
              </h2>
              <div style="display: flex; gap: 8px; margin-top: 6px; align-items: center;">
                <span class="badge-year">${this.escapeHtml(e.year)}</span>
                <span class="badge-gender ${e.gender}">${e.gender==="F"?"Fille":"Garçon"}</span>
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
              <div style="font-size: var(--font-size-xl); font-weight: 800; color: var(--accent-presence);">${s}</div>
              <div style="font-size: var(--font-size-xs); font-weight: 600; color: var(--accent-presence);">${u.types.presence}s</div>
            </div>

            <div style="background: var(--accent-course-light); padding: 10px 4px; border-radius: var(--radius-md);">
              <div style="font-size: var(--font-size-xl); font-weight: 800; color: var(--accent-course);">${r}</div>
              <div style="font-size: var(--font-size-xs); font-weight: 600; color: var(--accent-course);">${u.types.course}s</div>
            </div>

            <div style="background: var(--bg-surface-hover); padding: 10px 4px; border-radius: var(--radius-md);">
              <div style="font-size: var(--font-size-xl); font-weight: 800; color: var(--text-primary);">${s+r}</div>
              <div style="font-size: var(--font-size-xs); font-weight: 600; color: var(--text-secondary);">${u.stats.total}</div>
            </div>
          </div>

          <div style="margin-top: 12px; font-size: var(--font-size-xs); color: var(--text-muted); text-align: center;">
            ${u.student.lastSeen} : <strong>${i?I(i):u.student.never}</strong>
          </div>
        </div>

        <!-- Historique chronologique -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h3 style="font-size: var(--font-size-base);">${u.nav.historique} (${o.length})</h3>
            <select id="fiche-type-filter" class="search-input" style="width: auto; min-height: 36px; padding: 0 8px; font-size: 0.8rem;">
              <option value="all" ${this.typeFilter==="all"?"selected":""}>Tous les types</option>
              <option value="presence" ${this.typeFilter==="presence"?"selected":""}>Présences</option>
              <option value="course" ${this.typeFilter==="course"?"selected":""}>Courses</option>
            </select>
          </div>

          ${o.length===0?`
            <div style="text-align: center; padding: 24px; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              Aucun pointage enregistré pour cet élève.
            </div>
          `:`
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${o.map(d=>{const c=d.type==="presence",h=c?"var(--accent-presence)":"var(--accent-course)",m=c?"var(--accent-presence-light)":"var(--accent-course-light)";return`
                  <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px 14px; display: flex; align-items: center; justify-content: space-between;">
                    <div>
                      <div style="font-size: var(--font-size-sm); font-weight: 600;">${I(d.date)}</div>
                      <div style="font-size: var(--font-size-xs); color: var(--text-muted); margin-top: 2px;">Heure : ${V(d.markedAt)}</div>
                    </div>
                    <span style="background: ${m}; color: ${h}; padding: 4px 10px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 700;">
                      ${c?u.types.presence:u.types.course}
                    </span>
                  </div>
                `}).join("")}
            </div>
          `}
        </div>
      </div>
    `,this.attachEvents()}attachEvents(){const e=this.container.querySelector("#fiche-back-btn");e&&e.addEventListener("click",this.options.onBack);const n=this.container.querySelector("#fiche-toggle-active-btn");n&&this.student&&n.addEventListener("click",async()=>{if(!this.student)return;const s=!this.student.active;await ae({id:this.student.id,active:s}),b(s?"Élève réactivé.":"Élève désactivé."),await this.loadDataAndRender(),this.options.onRefreshNeeded()});const t=this.container.querySelector("#fiche-type-filter");t&&t.addEventListener("change",()=>{this.typeFilter=t.value,this.loadDataAndRender()})}escapeHtml(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}}const Fe="modulepreload",Oe=function(a,e){return new URL(a,e).href},ee={},he=function(e,n,t){let s=Promise.resolve();if(n&&n.length>0){let i=function(h){return Promise.all(h.map(m=>Promise.resolve(m).then(f=>({status:"fulfilled",value:f}),f=>({status:"rejected",reason:f}))))};const o=document.getElementsByTagName("link"),d=document.querySelector("meta[property=csp-nonce]"),c=d?.nonce||d?.getAttribute("nonce");s=i(n.map(h=>{if(h=Oe(h,t),h in ee)return;ee[h]=!0;const m=h.endsWith(".css"),f=m?'[rel="stylesheet"]':"";if(!!t)for(let p=o.length-1;p>=0;p--){const g=o[p];if(g.href===h&&(!m||g.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${h}"]${f}`))return;const l=document.createElement("link");if(l.rel=m?"stylesheet":Fe,m||(l.as="script"),l.crossOrigin="",l.href=h,c&&l.setAttribute("nonce",c),document.head.appendChild(l),m)return new Promise((p,g)=>{l.addEventListener("load",p),l.addEventListener("error",()=>g(new Error(`Unable to preload CSS for ${h}`)))})}))}function r(i){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=i,window.dispatchEvent(o),!o.defaultPrevented)throw i}return s.then(i=>{for(const o of i||[])o.status==="rejected"&&r(o.reason);return e().catch(r)})};async function Ve(a,e,n,t){const s={id:U(),date:new Date().toISOString(),fileName:a,created:e,updated:n,skipped:t};return await y.importLog.put(s),s}async function W(){return await he(()=>import("./sheetjs-DGuHH-KN.js"),[],import.meta.url)}function Ue(a){let e="",n="",t="",s="",r="";for(const i of a){const o=x(i);["nom","nom de famille","last name","lastname"].includes(o)&&!e?e=i:["prenom","first name","firstname"].includes(o)&&!n?n=i:["sexe","genre","f/m","g/f","gender"].includes(o)&&!t?t=i:["annee","classe","niveau","year"].includes(o)&&!s?s=i:["remarque","notes","commentaire","remark"].includes(o)&&!r&&(r=i)}return e||(e=a.find(i=>x(i).includes("nom"))||a[0]||""),n||(n=a.find(i=>x(i).includes("prenom"))||a[1]||""),t||(t=a.find(i=>["sexe","genre"].some(o=>x(i).includes(o)))||""),s||(s=a.find(i=>["annee","classe","niveau"].some(o=>x(i).includes(o)))||""),{lastNameCol:e,firstNameCol:n,genderCol:t,yearCol:s,notesCol:r}}function _e(a){if(!a)return null;const e=x(String(a));return["f","fille","feminin","féminin","female"].includes(e)?"F":["m","g","garcon","garçon","masculin","male"].includes(e)?"M":null}async function Ye(a,e,n,t){const s=new Map;for(const i of t){const o=`${x(i.lastName)}_${x(i.firstName)}`;s.set(o,i)}const r=[];for(let i=0;i<a.length;i++){const o=a[i],d=String(o[e.lastNameCol]||"").trim(),c=String(o[e.firstNameCol]||"").trim(),h=o[e.genderCol],m=String(o[e.yearCol]||"").trim(),f=String(o[e.notesCol]||"").trim();if(!d&&!c)continue;const v=_e(h);if(!d||!c){r.push({rowIndex:i+2,lastName:d,firstName:c,gender:v,year:m,notes:f,status:"error",errorReason:"Nom et prénom requis."});continue}if(!v){r.push({rowIndex:i+2,lastName:d,firstName:c,gender:null,year:m,notes:f,status:"error",errorReason:`Sexe invalide (${String(h||"")}).`});continue}if(!m){r.push({rowIndex:i+2,lastName:d,firstName:c,gender:v,year:"",notes:f,status:"error",errorReason:"Année manquante."});continue}const l=`${x(d)}_${x(c)}`,p=s.get(l);p?r.push({rowIndex:i+2,lastName:d,firstName:c,gender:v,year:m,notes:f,status:"skip",errorReason:"Doublon existant (ignoré).",existingId:p.id}):r.push({rowIndex:i+2,lastName:d,firstName:c,gender:v,year:m,notes:f,status:"create"})}return r}async function We(a,e){const n=Date.now();let t=0,s=0,r=0;return await y.transaction("rw",[y.students,y.importLog],async()=>{for(const i of a){if(i.status==="skip"||i.status==="error"){r++;continue}if(await se(i.year),i.status==="create"){const d={id:U(),firstName:i.firstName,lastName:i.lastName,gender:i.gender,year:i.year,active:!0,notes:i.notes,createdAt:new Date(n).toISOString(),updatedAt:n,dirty:1,searchKey:_(i.firstName,i.lastName)};await y.students.put(d),t++}else if(i.status==="update"&&i.existingId){const o=await y.students.get(i.existingId);if(o){const d={...o,gender:i.gender,year:i.year,notes:i.notes||o.notes,updatedAt:n,dirty:1};await y.students.put(d),s++}}}await Ve(e,t,s,r)}),{created:t,updated:s,skipped:r}}async function Ge(){const a=await W(),e=[{Nom:"DUPONT",Prénom:"Alice",Sexe:"F",Année:"1A",Remarque:"Exemple"},{Nom:"MARTIN",Prénom:"Lucas",Sexe:"M",Année:"2B",Remarque:"Exemple"}],n=a.utils.json_to_sheet(e),t=a.utils.book_new();a.utils.book_append_sheet(t,n,"Élèves"),a.writeFile(t,"modele_import_eleves.xlsx")}async function Qe(a,e,n){const t=await W(),s=D(),r=new Map(a.map(l=>[l.id,l])),i=a.map(l=>({ID:l.id,Nom:l.lastName,Prénom:l.firstName,Sexe:l.gender,Année:l.year,Actif:l.active?"Oui":"Non",Notes:l.notes,"Date Création":l.createdAt})),o=e.filter(l=>l.present);o.sort((l,p)=>p.markedAt-l.markedAt);const d=o.map(l=>{const p=r.get(l.studentId);return{Date:l.date,Type:l.type==="presence"?"Présence":"Course",Nom:p?p.lastName:"Inconnu",Prénom:p?p.firstName:"Inconnu",Année:p?p.year:"",Sexe:p?p.gender:"",Heure:V(l.markedAt),Appareil:l.deviceId}}),c=a.map(l=>{const p=n.get(l.id)||{presences:0,courses:0,total:0,lastSeen:null,studentId:l.id};return{Nom:l.lastName,Prénom:l.firstName,Année:l.year,Sexe:l.gender,Actif:l.active?"Oui":"Non",Présences:p.presences,Courses:p.courses,Total:p.total,"Dernière venue":p.lastSeen||"Aucune"}}),h=t.utils.book_new(),m=t.utils.json_to_sheet(i),f=t.utils.json_to_sheet(d),v=t.utils.json_to_sheet(c);t.utils.book_append_sheet(h,m,"Élèves"),t.utils.book_append_sheet(h,f,"Présences"),t.utils.book_append_sheet(h,v,"Synthèse"),t.writeFile(h,`presences_${s}.xlsx`)}class Je{container;options;activeTab="students";periodPreset="all";startDate="";endDate="";yearFilter="all";typeFilter="all";includeInactive=!1;sortField="lastName";sortOrder="asc";students=[];attendances=[];yearsList=[];constructor(e,n){this.container=e,this.options=n}async render(){await this.loadDataAndRender()}async loadDataAndRender(){this.yearsList=await z(),this.students=await M(),this.attendances=await oe();let e=this.attendances.filter(s=>s.present);this.startDate&&(e=e.filter(s=>s.date>=this.startDate)),this.endDate&&(e=e.filter(s=>s.date<=this.endDate)),this.typeFilter!=="all"&&(e=e.filter(s=>s.type===this.typeFilter));let n=this.students;this.includeInactive||(n=n.filter(s=>s.active)),this.yearFilter!=="all"&&(n=n.filter(s=>s.year===this.yearFilter));const t=Te(e);this.container.innerHTML=`
      <div style="padding: 16px; display: flex; flex-direction: column; gap: 14px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h2>${u.nav.historique}</h2>
          <button class="btn btn-primary" id="historique-export-btn" style="min-height: 38px; padding: 0 12px; font-size: 0.8rem;">
            ${u.actions.exportExcel}
          </button>
        </div>

        <div>
          ${j([{value:"students",label:u.stats.tabByStudent},{value:"dates",label:u.stats.tabByDate}],this.activeTab)}
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
              ${this.yearsList.map(s=>`<option value="${s}" ${this.yearFilter===s?"selected":""}>${s}</option>`).join("")}
            </select>

            <label style="display: flex; align-items: center; gap: 4px; font-size: 0.75rem; white-space: nowrap;">
              <input type="checkbox" id="historique-inactive-chk" ${this.includeInactive?"checked":""} />
              Inactifs
            </label>
          </div>
        </div>

        <!-- Vue contenu par Élève ou par Date -->
        ${this.activeTab==="students"?this.renderStudentsTableHtml(n,t):this.renderDatesListHtml(e)}
      </div>
    `,this.attachEvents(t)}renderStudentsTableHtml(e,n){const t=e.map(r=>{const i=n.get(r.id)||{presences:0,courses:0,total:0,lastSeen:null,studentId:r.id};return{student:r,stat:i}});t.sort((r,i)=>{let o=0;return this.sortField==="lastName"?o=r.student.lastName.localeCompare(i.student.lastName,"fr"):this.sortField==="firstName"?o=r.student.firstName.localeCompare(i.student.firstName,"fr"):this.sortField==="year"?o=r.student.year.localeCompare(i.student.year,"fr"):this.sortField==="presences"?o=r.stat.presences-i.stat.presences:this.sortField==="courses"?o=r.stat.courses-i.stat.courses:this.sortField==="total"&&(o=r.stat.total-i.stat.total),this.sortOrder==="asc"?o:-o});const s=r=>this.sortField!==r?"":this.sortOrder==="asc"?" ▲":" ▼";return`
      <div style="overflow-x: auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th data-sort="lastName">Nom${s("lastName")}</th>
              <th data-sort="firstName">Prénom${s("firstName")}</th>
              <th data-sort="year">Année${s("year")}</th>
              <th data-sort="presences">Prés.${s("presences")}</th>
              <th data-sort="courses">Cour.${s("courses")}</th>
              <th data-sort="total">Total${s("total")}</th>
            </tr>
          </thead>
          <tbody>
            ${t.length===0?`
              <tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Aucune donnée disponible.</td></tr>
            `:t.map(r=>`
              <tr class="historique-student-row" data-student-id="${r.student.id}" style="cursor: pointer;">
                <td><strong>${this.escapeHtml(r.student.lastName)}</strong></td>
                <td>${this.escapeHtml(r.student.firstName)}</td>
                <td><span class="badge-year">${this.escapeHtml(r.student.year)}</span></td>
                <td><strong style="color: var(--accent-presence);">${r.stat.presences}</strong></td>
                <td><strong style="color: var(--accent-course);">${r.stat.courses}</strong></td>
                <td><strong>${r.stat.total}</strong></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `}renderDatesListHtml(e){const n=new Map;for(const s of e){let r=n.get(s.date);r||(r={presences:0,courses:0},n.set(s.date,r)),s.type==="presence"?r.presences++:s.type==="course"&&r.courses++}const t=Array.from(n.keys()).sort().reverse();return`
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${t.length===0?`
          <div style="text-align: center; padding: 24px; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--radius-md);">
            Aucun pointage trouvé pour cette période.
          </div>
        `:t.map(s=>{const r=n.get(s);return`
            <div class="historique-date-card" data-date="${s}" style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
              <div>
                <div style="font-size: var(--font-size-base); font-weight: 600;">${I(s)}</div>
                <div style="font-size: var(--font-size-xs); color: var(--text-muted); margin-top: 2px;">${s}</div>
              </div>
              <div style="display: flex; gap: 12px; font-size: var(--font-size-sm); font-weight: 700;">
                <span style="color: var(--accent-presence);">Prés. ${r.presences}</span>
                <span style="color: var(--accent-course);">Cour. ${r.courses}</span>
              </div>
            </div>
          `}).join("")}
      </div>
    `}attachEvents(e){B(this.container,l=>{this.activeTab=l,this.loadDataAndRender()});const n=this.container.querySelector("#historique-export-btn");n&&n.addEventListener("click",async()=>{try{b("Génération du fichier Excel en cours..."),await Qe(this.students,this.attendances,e),b("Exportation Excel réussie !")}catch(l){console.error(l),b("Erreur lors de l'exportation Excel.")}});const t=D(),s=this.container.querySelector("#preset-all");s&&s.addEventListener("click",()=>{this.periodPreset="all",this.startDate="",this.endDate="",this.loadDataAndRender()});const r=this.container.querySelector("#preset-month");r&&r.addEventListener("click",()=>{this.periodPreset="month";const l=we(t);this.startDate=l.start,this.endDate=l.end,this.loadDataAndRender()});const i=this.container.querySelector("#preset-schoolyear");i&&i.addEventListener("click",()=>{this.periodPreset="schoolyear";const l=xe(t);this.startDate=l.start,this.endDate=l.end,this.loadDataAndRender()});const o=this.container.querySelector("#historique-start-date");o&&o.addEventListener("change",()=>{this.periodPreset="custom",this.startDate=o.value,this.loadDataAndRender()});const d=this.container.querySelector("#historique-end-date");d&&d.addEventListener("change",()=>{this.periodPreset="custom",this.endDate=d.value,this.loadDataAndRender()});const c=this.container.querySelector("#historique-year-filter");c&&c.addEventListener("change",()=>{this.yearFilter=c.value,this.loadDataAndRender()});const h=this.container.querySelector("#historique-inactive-chk");h&&h.addEventListener("change",()=>{this.includeInactive=h.checked,this.loadDataAndRender()}),this.container.querySelectorAll("th[data-sort]").forEach(l=>{l.addEventListener("click",()=>{const p=l.dataset.sort;this.sortField===p?this.sortOrder=this.sortOrder==="asc"?"desc":"asc":(this.sortField=p,this.sortOrder="asc"),this.loadDataAndRender()})}),this.container.querySelectorAll(".historique-student-row").forEach(l=>{l.addEventListener("click",()=>{const p=l.dataset.studentId;p&&this.options.onStudentCardClick(p)})}),this.container.querySelectorAll(".historique-date-card").forEach(l=>{l.addEventListener("click",()=>{const p=l.dataset.date;p&&this.options.onInspectDateClick(p)})})}escapeHtml(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}}class Ke{container;options;constructor(e,n){this.container=e,this.options=n}async render(){await this.loadDataAndRender()}async loadDataAndRender(){const e=await k("syncUrl",""),n=await k("syncToken",""),t=await T(),s=await k("lastSyncAt",null),r=await z(),o=await L.getInstance().getPendingCount(),d=s?new Date(s).toLocaleString("fr-BE"):"Jamais";this.container.innerHTML=`
      <div style="padding: 16px; display: flex; flex-direction: column; gap: 20px;">
        <h2>${u.nav.parametres}</h2>

        <!-- Synchronisation Google Sheets -->
        <section style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 12px;">
          <h3 style="font-size: var(--font-size-base); font-weight: 700;">Synchronisation Google Sheets</h3>
          
          <div>
            <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
              ${u.sync.syncUrl}
            </label>
            <input type="text" id="param-sync-url" class="search-input" value="${this.escapeHtml(e)}" placeholder="https://script.google.com/macros/s/.../exec" />
          </div>

          <div>
            <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
              ${u.sync.syncToken}
            </label>
            <input type="password" id="param-sync-token" class="search-input" value="${this.escapeHtml(n)}" placeholder="Votre jeton de sécurité" />
          </div>

          <div>
            <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
              ${u.sync.deviceName}
            </label>
            <input type="text" id="param-device-name" class="search-input" value="${this.escapeHtml(t)}" />
          </div>

          <div style="font-size: var(--font-size-xs); color: var(--text-secondary); display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
            <span>${u.sync.lastSync} <strong>${d}</strong></span>
            <span>En attente : <strong>${o}</strong></span>
          </div>

          <div style="display: flex; gap: 10px; margin-top: 8px;">
            <button class="btn btn-secondary" id="param-save-sync-btn" style="flex: 1;">
              Enregistrer
            </button>
            <button class="btn btn-primary" id="param-sync-now-btn" style="flex: 1;">
              ${u.actions.syncNow}
            </button>
          </div>
        </section>

        <!-- Import / Export Excel -->
        <section style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 12px;">
          <h3 style="font-size: var(--font-size-base); font-weight: 700;">Import & Export des données</h3>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label class="btn btn-secondary" style="cursor: pointer; width: 100%;">
              📂 ${u.actions.importExcel}
              <input type="file" id="param-import-file" accept=".xlsx, .xls, .csv" style="display: none;" />
            </label>

            <button class="btn btn-secondary" id="param-download-template-btn">
              📄 ${u.actions.downloadTemplate}
            </button>
          </div>

          <div id="param-import-preview-zone"></div>
        </section>

        <!-- Gestion des Années Scolaires -->
        <section style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 12px;">
          <h3 style="font-size: var(--font-size-base); font-weight: 700;">Liste des Années / Classes</h3>

          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${r.map(c=>`
              <span class="chip" style="cursor: default;">
                ${this.escapeHtml(c)}
                <button class="param-delete-year-btn" data-year="${this.escapeHtml(c)}" style="background: none; border: none; margin-left: 6px; cursor: pointer; color: var(--color-danger); font-weight: bold;">✕</button>
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
              📥 ${u.actions.backupJson}
            </button>
            <label class="btn btn-secondary" style="flex: 1; cursor: pointer;">
              📤 ${u.actions.restoreJson}
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
              🔄 ${u.actions.updateApp}
            </button>
          </div>
        </section>
      </div>
    `,this.attachEvents(r)}attachEvents(e){const n=this.container.querySelector("#param-save-sync-btn");n&&n.addEventListener("click",async()=>{const v=this.container.querySelector("#param-sync-url"),l=this.container.querySelector("#param-sync-token"),p=this.container.querySelector("#param-device-name");v&&await E("syncUrl",v.value.trim()),l&&await E("syncToken",l.value.trim()),p&&p.value.trim()&&await E("deviceId",p.value.trim()),b("Paramètres de synchronisation enregistrés."),this.options.onRefreshNeeded()});const t=this.container.querySelector("#param-sync-now-btn");t&&t.addEventListener("click",async()=>{b("Synchronisation en cours...");const v=await L.getInstance().triggerSync("manual");v.success?(b(u.sync.syncSuccess),await this.loadDataAndRender()):b(v.message||u.sync.syncError)});const s=this.container.querySelector("#param-download-template-btn");s&&s.addEventListener("click",async()=>{await Ge()});const r=this.container.querySelector("#param-import-file");r&&r.addEventListener("change",async()=>{const v=r.files?.[0];if(v)try{b("Lecture du fichier en cours...");const l=await W(),p=await v.arrayBuffer(),g=l.read(p,{type:"array"}),w=g.SheetNames[0],S=g.Sheets[w],$=l.utils.sheet_to_json(S);if($.length===0){b("Fichier vide ou format non reconnu.");return}const R=Object.keys($[0]),F=Ue(R),fe=await M(),q=await Ye($,F,"ignore",fe),C=this.container.querySelector("#param-import-preview-zone");if(C){const G=q.filter(A=>A.status==="create").length,ye=q.filter(A=>A.status==="skip").length,ve=q.filter(A=>A.status==="error").length;C.innerHTML=`
              <div style="background: var(--bg-surface-hover); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px; margin-top: 8px;">
                <h4 style="font-size: var(--font-size-sm); font-weight: 700; margin-bottom: 6px;">Aperçu de l'importation :</h4>
                <div style="font-size: var(--font-size-xs); display: flex; gap: 12px;">
                  <span style="color: var(--color-success);">Nouveaux : <strong>${G}</strong></span>
                  <span style="color: var(--text-muted);">Doublons ignorés : <strong>${ye}</strong></span>
                  <span style="color: var(--color-danger);">Erreurs : <strong>${ve}</strong></span>
                </div>
                <button class="btn btn-primary" id="confirm-import-btn" style="width: 100%; margin-top: 10px;">
                  Confirmer et importer ${G} élève(s)
                </button>
              </div>
            `;const Q=C.querySelector("#confirm-import-btn");Q&&Q.addEventListener("click",async()=>{const A=await We(q,v.name);b(`Importation terminée : ${A.created} créés, ${A.skipped} ignorés.`),C.innerHTML="",this.options.onRefreshNeeded()})}}catch(l){console.error(l),b("Erreur lors de la lecture du fichier.")}}),this.container.querySelectorAll(".param-delete-year-btn").forEach(v=>{v.addEventListener("click",async()=>{const l=v.dataset.year;if(l){const p=e.filter(g=>g!==l);await H(p),await this.loadDataAndRender()}})});const o=this.container.querySelector("#param-add-year-btn"),d=this.container.querySelector("#param-add-year-input");o&&d&&o.addEventListener("click",async()=>{const v=d.value.trim();v&&!e.includes(v)&&(e.push(v),await H(e),await this.loadDataAndRender())});const c=this.container.querySelector("#param-backup-json-btn");c&&c.addEventListener("click",async()=>{const v=await M(),l=await oe(),p={version:1,date:new Date().toISOString(),students:v,attendances:l},g=new Blob([JSON.stringify(p,null,2)],{type:"application/json"}),w=URL.createObjectURL(g),S=document.createElement("a");S.href=w,S.download=`sauvegarde_presences_${D()}.json`,S.click(),URL.revokeObjectURL(w),b("Sauvegarde JSON générée.")});const h=this.container.querySelector("#param-restore-file");h&&h.addEventListener("change",async()=>{const v=h.files?.[0];if(!v)return;const l=await v.text();try{const p=JSON.parse(l);p.students&&Array.isArray(p.students)&&(await y.transaction("rw",[y.students,y.attendances],async()=>{for(const g of p.students)await y.students.put({...g,dirty:1});if(p.attendances&&Array.isArray(p.attendances))for(const g of p.attendances)await y.attendances.put({...g,dirty:1})}),b("Restauration des données réussie !"),this.options.onRefreshNeeded())}catch{b("Fichier de sauvegarde invalide.")}});const m=this.container.querySelector("#param-seed-demo-btn");m&&m.addEventListener("click",async()=>{b("Génération de 200 élèves et 3 mois d'historique..."),await this.generateDemoData(),b("Jeu de démonstration créé avec succès !"),this.options.onRefreshNeeded()});const f=this.container.querySelector("#param-update-app-btn");f&&f.addEventListener("click",()=>{this.options.onUpdateAppClick()})}async generateDemoData(){const e=["1A","1B","2A","2B","3A","3B","4A","4B","5A","5B","6A","6B"];await H(e);const n=["Emma","Jade","Louise","Alice","Chloé","Lina","Léa","Rose","Mia","Anna","Manon","Julia","Inès","Camille","Sarah","Zoé","Eva","Lola","Victoire","Mathilde"],t=["Gabriel","Léo","Raphaël","Maël","Louis","Noah","Jules","Adam","Lucas","Hugo","Arthur","Liam","Ethan","Paul","Tom","Sacha","Théo","Mathis","Antoine","Victor"],s=["Martin","Bernard","Thomas","Petit","Robert","Richard","Durand","Dubois","Moreau","Laurent","Simon","Michel","Lefebvre","Leroy","Roux","David","Bertrand","Morel","Fournier","Girard"],r=Date.now(),i=[];await y.transaction("rw",y.students,async()=>{for(let c=0;c<200;c++){const h=c%2===0?"F":"M",m=h==="F"?n:t,f=m[Math.floor(Math.random()*m.length)]+(c>40?` ${c}`:""),v=s[Math.floor(Math.random()*s.length)],l=e[c%e.length],p=await Y({firstName:f,lastName:v,gender:h,year:l,active:!0});i.push(p)}});const o=new Date,d=await T();await y.transaction("rw",y.attendances,async()=>{for(let c=0;c<90;c+=3){const h=new Date(o);h.setDate(o.getDate()-c);const m=h.toISOString().substring(0,10);for(let f=0;f<40;f++){const v=i[Math.floor(Math.random()*i.length)],l=Math.random()>.3?"presence":"course",p=h.getTime()+Math.floor(Math.random()*288e5),g=ne(v.id,m,l);await y.attendances.put({id:g,studentId:v.id,date:m,type:l,present:!0,markedAt:p,deviceId:d,updatedAt:r,dirty:1})}}})}escapeHtml(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}}function Xe(a={}){const{immediate:e=!1,onNeedRefresh:n,onOfflineReady:t,onRegistered:s,onRegisteredSW:r,onRegisterError:i}=a;let o,d,c;const h=async(f=!0)=>{await d,c?.()};async function m(){if("serviceWorker"in navigator){if(o=await he(async()=>{const{Workbox:f}=await import("./workbox-window.prod.es5-BBnX5xw4.js");return{Workbox:f}},[],import.meta.url).then(({Workbox:f})=>new f("./sw.js",{scope:"./",type:"classic"})).catch(f=>{i?.(f)}),!o)return;c=()=>{o?.messageSkipWaiting()};{let f=!1;const v=()=>{f=!0,o?.addEventListener("controlling",l=>{l.isUpdate&&window.location.reload()}),n?.()};o.addEventListener("installed",l=>{typeof l.isUpdate>"u"?typeof l.isExternal<"u"&&l.isExternal?v():!f&&t?.():l.isUpdate||t?.()}),o.addEventListener("waiting",v)}o.register({immediate:e}).then(f=>{r?r("./sw.js",f):s?.(f)}).catch(f=>{i?.(f)})}}return d=m(),h}class Ze{appElement;router;syncEngine;headerState={date:D(),type:"presence",syncStatus:"synced",pendingCount:0};activeViewInstance=null;updateSWHandler=null;constructor(){const e=document.getElementById("app");if(!e)throw new Error("Élément #app introuvable");this.appElement=e,this.router=new ge,this.syncEngine=L.getInstance()}async init(){if(typeof navigator<"u"&&navigator.storage&&navigator.storage.persist)try{await navigator.storage.persist()}catch(e){console.warn("Persistance de stockage non accordée:",e)}this.appElement.innerHTML=`
      <div id="header-container"></div>
      <main class="app-content" id="view-container"></main>
      <div id="navbar-container"></div>
      <div id="sw-update-banner" style="display: none; position: fixed; top: 0; left: 0; right: 0; background: var(--color-warning); color: #fff; padding: 8px 16px; text-align: center; font-size: 0.85rem; z-index: 1000; font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
        <span>Mise à jour disponible !</span>
        <button id="sw-update-btn" class="btn btn-secondary" style="min-height: 32px; padding: 0 10px; font-size: 0.75rem;">
          Mettre à jour
        </button>
      </div>
    `,this.syncEngine.subscribe((e,n)=>{this.headerState.syncStatus=e,this.headerState.pendingCount=n,this.renderHeaderUI()}),this.setupRoutes(),this.initServiceWorker(),this.syncEngine.triggerSync("app_init")}renderHeaderUI(){const e=document.getElementById("header-container");e&&(e.innerHTML=$e(this.headerState),Ae(e,n=>{this.headerState.date=n,this.renderHeaderUI(),this.activeViewInstance&&typeof this.activeViewInstance.updateOptions=="function"?this.activeViewInstance.updateOptions({...this.activeViewInstance.options,date:n}):this.activeViewInstance&&typeof this.activeViewInstance.render=="function"&&this.activeViewInstance.render()},n=>{this.headerState.type=n,this.renderHeaderUI(),this.activeViewInstance&&typeof this.activeViewInstance.updateOptions=="function"?this.activeViewInstance.updateOptions({...this.activeViewInstance.options,type:n}):this.activeViewInstance&&typeof this.activeViewInstance.render=="function"&&this.activeViewInstance.render()},()=>{b("Synchronisation en cours..."),this.syncEngine.triggerSync("header_button")},()=>{this.router.navigate("#/parametres")}))}renderNavbarUI(e){const n=document.getElementById("navbar-container");n&&(n.innerHTML=Le(e),ke(n,t=>{this.router.navigate(t)}))}setupRoutes(){const e=document.getElementById("view-container");if(!e)return;const n=()=>{this.syncEngine.scheduleDebouncedSync(1e4),this.syncEngine.notifyListeners()};this.router.addRoute("#/pointage",()=>{this.renderHeaderUI(),this.renderNavbarUI("#/pointage");const t=new Me(e,{date:this.headerState.date,type:this.headerState.type,onStudentCardClick:s=>{this.router.navigate(`#/fiche?id=${s}`)},onRefreshNeeded:n});this.activeViewInstance=t,t.render()}),this.router.addRoute("#/jour",()=>{this.renderHeaderUI(),this.renderNavbarUI("#/jour");const t=new Pe(e,{date:this.headerState.date,type:this.headerState.type,onStudentCardClick:s=>{this.router.navigate(`#/fiche?id=${s}`)},onRefreshNeeded:n});this.activeViewInstance=t,t.render()}),this.router.addRoute("#/eleves",()=>{this.renderHeaderUI(),this.renderNavbarUI("#/eleves");const t=new je(e,{onStudentCardClick:s=>{this.router.navigate(`#/fiche?id=${s}`)},onRefreshNeeded:n});this.activeViewInstance=t,t.render()}),this.router.addRoute("#/fiche",(t,s)=>{this.renderHeaderUI(),this.renderNavbarUI("#/eleves");const r=s.id||"",i=new Be(e,{studentId:r,onBack:()=>{window.history.back()},onRefreshNeeded:n});this.activeViewInstance=i,i.render()}),this.router.addRoute("#/historique",()=>{this.renderHeaderUI(),this.renderNavbarUI("#/historique");const t=new Je(e,{onStudentCardClick:s=>{this.router.navigate(`#/fiche?id=${s}`)},onInspectDateClick:s=>{this.headerState.date=s,this.router.navigate("#/jour")}});this.activeViewInstance=t,t.render()}),this.router.addRoute("#/parametres",()=>{this.renderHeaderUI(),this.renderNavbarUI("#/parametres");const t=new Ke(e,{onRefreshNeeded:n,onUpdateAppClick:()=>{this.updateSWHandler?this.updateSWHandler():b("L'application est déjà à jour.")}});this.activeViewInstance=t,t.render()}),this.router.init()}initServiceWorker(){if("serviceWorker"in navigator){const e=Xe({onNeedRefresh:()=>{const n=document.getElementById("sw-update-banner"),t=document.getElementById("sw-update-btn");n&&(n.style.display="flex"),this.updateSWHandler=()=>{e(!0)},t&&t.addEventListener("click",this.updateSWHandler)},onOfflineReady:()=>{b(u.pwa.offlineReady)}})}}}document.addEventListener("DOMContentLoaded",()=>{new Ze().init()});
