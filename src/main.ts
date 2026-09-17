import './ui/styles/variables.css';
import './ui/styles/main.css';

import { Router } from './router';
import { STRINGS } from './ui/strings';
import { renderHeader, setupHeaderEvents, type HeaderState } from './ui/components/header';
import { renderNavbar, setupNavbarEvents } from './ui/components/navbar';
import { showToast } from './ui/components/toast';
import { getTodayBrussels } from './domain/dates';
import { SyncEngine, type SyncStatus } from './sync/engine';
import { getAttendancesByDateAndType } from './db/attendances';
import { getAllStudents } from './db/students';
import { calculateDaySummary } from './domain/stats';

import { PointageView } from './ui/views/pointage';
import { JourView } from './ui/views/jour';
import { ElevesView } from './ui/views/eleves';
import { FicheView } from './ui/views/fiche';
import { HistoriqueView } from './ui/views/historique';
import { ParametresView } from './ui/views/parametres';

// Importer le Service Worker PWA de façon conditionnelle / sécurisée
import { registerSW } from 'virtual:pwa-register';

class App {
  private appElement: HTMLElement;
  private router: Router;
  private syncEngine: SyncEngine;

  private headerState: HeaderState = {
    date: getTodayBrussels(),
    type: 'presence',
    syncStatus: 'synced',
    pendingCount: 0,
    daySummary: { total: 0, girls: 0, boys: 0, internals: 0 },
  };

  private activeViewInstance: any = null;
  private updateSWHandler: (() => void) | null = null;

  constructor() {
    const root = document.getElementById('app');
    if (!root) throw new Error('Élément #app introuvable');
    this.appElement = root;

    this.router = new Router();
    this.syncEngine = SyncEngine.getInstance();
  }

  private async updateDaySummaryHeader(): Promise<void> {
    try {
      const [attendances, allStudents] = await Promise.all([
        getAttendancesByDateAndType(this.headerState.date, this.headerState.type),
        getAllStudents(),
      ]);
      const studentsMap = new Map(allStudents.map((s) => [s.id, s]));
      const summary = calculateDaySummary(attendances, studentsMap, this.headerState.type);
      this.headerState.daySummary = {
        total: summary.total,
        girls: summary.girls,
        boys: summary.boys,
        internals: summary.internals,
      };
      this.renderHeaderUI();
    } catch (err) {
      console.warn('Erreur lors de la mise à jour du résumé journalier:', err);
    }
  }

  public async init(): Promise<void> {
    // 1. Demande de persistance du stockage navigateur (PWA Android)
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      try {
        await navigator.storage.persist();
      } catch (err) {
        console.warn('Persistance de stockage non accordée:', err);
      }
    }

    // 2. Initialisation des composants UI fixes
    this.appElement.innerHTML = `
      <div id="header-container"></div>
      <main class="app-content" id="view-container"></main>
      <div id="navbar-container"></div>
      <div id="sw-update-banner" style="display: none; position: fixed; top: 0; left: 0; right: 0; background: var(--color-warning); color: #fff; padding: 8px 16px; text-align: center; font-size: 0.85rem; z-index: 1000; font-weight: 600; justify-content: space-between; align-items: center;">
        <span>Mise à jour disponible !</span>
        <button id="sw-update-btn" class="btn btn-secondary" style="min-height: 32px; padding: 0 10px; font-size: 0.75rem;">
          Mettre à jour
        </button>
      </div>
    `;

    // 3. Écoute de l'état de la synchronisation
    this.syncEngine.subscribe((status: SyncStatus, pendingCount: number) => {
      this.headerState.syncStatus = status;
      this.headerState.pendingCount = pendingCount;
      this.renderHeaderUI();
    });

    // 4. Configuration des routes
    this.setupRoutes();

    // 5. Mise à jour initiale du topo header
    await this.updateDaySummaryHeader();

    // 6. Enregistrement du Service Worker PWA
    this.initServiceWorker();

    // 7. Lancement initial de la synchronisation (push/pull)
    this.syncEngine.triggerSync('app_init');
  }

  private renderHeaderUI(): void {
    const headerContainer = document.getElementById('header-container');
    if (!headerContainer) return;

    headerContainer.innerHTML = renderHeader(this.headerState);
    setupHeaderEvents(
      headerContainer,
      async (date) => {
        this.headerState.date = date;
        await this.updateDaySummaryHeader();
        if (this.activeViewInstance && typeof this.activeViewInstance.updateOptions === 'function') {
          this.activeViewInstance.updateOptions({ ...this.activeViewInstance.options, date });
        } else if (this.activeViewInstance && typeof this.activeViewInstance.render === 'function') {
          this.activeViewInstance.render();
        }
      },
      () => {
        showToast('Synchronisation en cours...');
        this.syncEngine.triggerSync('header_button');
      },
      () => {
        this.router.navigate('#/parametres');
      }
    );
  }

  private renderNavbarUI(currentRoute: string): void {
    const navbarContainer = document.getElementById('navbar-container');
    if (!navbarContainer) return;

    navbarContainer.innerHTML = renderNavbar(currentRoute);
    setupNavbarEvents(navbarContainer, (route) => {
      this.router.navigate(route);
    });
  }

  private setupRoutes(): void {
    const viewContainer = document.getElementById('view-container');
    if (!viewContainer) return;

    const refreshCallback = async () => {
      this.syncEngine.scheduleDebouncedSync(10000);
      this.syncEngine.notifyListeners();
      await this.updateDaySummaryHeader();
    };

    // Route Pointage
    this.router.addRoute('#/pointage', async () => {
      this.headerState.showTopo = true;
      await this.updateDaySummaryHeader();
      this.renderNavbarUI('#/pointage');
      const pointageView = new PointageView(viewContainer, {
        date: this.headerState.date,
        type: this.headerState.type,
        onStudentCardClick: (studentId) => {
          this.router.navigate(`#/fiche?id=${studentId}`);
        },
        onRefreshNeeded: refreshCallback,
        onTypeChange: async (type) => {
          this.headerState.type = type;
          await this.updateDaySummaryHeader();
        },
      });
      this.activeViewInstance = pointageView;
      pointageView.render();
    });

    // Route Jour (Aujourd'hui)
    this.router.addRoute('#/jour', async () => {
      this.headerState.showTopo = false;
      this.renderHeaderUI();
      this.renderNavbarUI('#/jour');
      const jourView = new JourView(viewContainer, {
        date: this.headerState.date,
        type: this.headerState.type,
        onStudentCardClick: (studentId) => {
          this.router.navigate(`#/fiche?id=${studentId}`);
        },
        onRefreshNeeded: refreshCallback,
      });
      this.activeViewInstance = jourView;
      jourView.render();
    });

    // Route Élèves
    this.router.addRoute('#/eleves', async () => {
      this.headerState.showTopo = false;
      this.renderHeaderUI();
      this.renderNavbarUI('#/eleves');
      const elevesView = new ElevesView(viewContainer, {
        onStudentCardClick: (studentId) => {
          this.router.navigate(`#/fiche?id=${studentId}`);
        },
        onRefreshNeeded: refreshCallback,
      });
      this.activeViewInstance = elevesView;
      elevesView.render();
    });

    // Route Fiche élève
    this.router.addRoute('#/fiche', async (_, params) => {
      this.headerState.showTopo = false;
      this.renderHeaderUI();
      this.renderNavbarUI('#/eleves');
      const studentId = params.id || '';
      const ficheView = new FicheView(viewContainer, {
        studentId,
        onBack: () => {
          window.history.back();
        },
        onRefreshNeeded: refreshCallback,
      });
      this.activeViewInstance = ficheView;
      ficheView.render();
    });

    // Route Historique
    this.router.addRoute('#/historique', async () => {
      this.headerState.showTopo = false;
      this.renderHeaderUI();
      this.renderNavbarUI('#/historique');
      const historiqueView = new HistoriqueView(viewContainer, {
        onStudentCardClick: (studentId) => {
          this.router.navigate(`#/fiche?id=${studentId}`);
        },
        onInspectDateClick: async (dateStr) => {
          this.headerState.date = dateStr;
          this.router.navigate('#/jour');
        },
      });
      this.activeViewInstance = historiqueView;
      historiqueView.render();
    });

    // Route Paramètres
    this.router.addRoute('#/parametres', async () => {
      this.headerState.showTopo = false;
      this.renderHeaderUI();
      this.renderNavbarUI('#/parametres');
      const parametresView = new ParametresView(viewContainer, {
        onRefreshNeeded: refreshCallback,
        onUpdateAppClick: () => {
          if (this.updateSWHandler) {
            this.updateSWHandler();
          } else {
            showToast('L\'application est déjà à jour.');
          }
        },
      });
      this.activeViewInstance = parametresView;
      parametresView.render();
    });

    this.router.init();
  }

  private initServiceWorker(): void {
    if ('serviceWorker' in navigator) {
      const updateSW = registerSW({
        onNeedRefresh: () => {
          const banner = document.getElementById('sw-update-banner');
          const btn = document.getElementById('sw-update-btn');
          if (banner) banner.style.display = 'flex';
          this.updateSWHandler = () => {
            updateSW(true);
          };
          if (btn) btn.addEventListener('click', this.updateSWHandler);
        },
        onOfflineReady: () => {
          showToast(STRINGS.pwa.offlineReady);
        },
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
