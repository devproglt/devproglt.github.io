/**
 * Routeur par Hash pour l'application SPA/PWA.
 */

export type RouteHandler = (route: string, params: Record<string, string>) => void;

export class Router {
  private routes: Record<string, RouteHandler> = {};
  private currentRoute = '';

  constructor() {
    window.addEventListener('hashchange', () => this.handleHashChange());
  }

  public addRoute(path: string, handler: RouteHandler): void {
    this.routes[path] = handler;
  }

  public navigate(route: string): void {
    window.location.hash = route;
  }

  public init(): void {
    this.handleHashChange();
  }

  private handleHashChange(): void {
    const hash = window.location.hash || '#/pointage';
    this.currentRoute = hash;

    const [path, queryString] = hash.split('?');
    const params: Record<string, string> = {};

    if (queryString) {
      const searchParams = new URLSearchParams(queryString);
      searchParams.forEach((val, key) => {
        params[key] = val;
      });
    }

    const handler = this.routes[path];
    if (handler) {
      handler(path, params);
    } else {
      // Route par défaut
      const defaultHandler = this.routes['#/pointage'];
      if (defaultHandler) {
        defaultHandler('#/pointage', params);
      }
    }
  }

  public getCurrentRoute(): string {
    return this.currentRoute;
  }
}
