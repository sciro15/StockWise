import { computed, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthSession } from '../models/inventory.models';

const SESSION_KEY = 'stockwise_v1_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _session = signal<AuthSession | null>(this.loadInitialSession());

  readonly session = this._session.asReadonly();
  readonly isAuthenticated = computed(() => this._session() !== null);

  constructor(private readonly router: Router) {}

  private loadInitialSession(): AuthSession | null {
    try {
      const fromLocal = localStorage.getItem(SESSION_KEY);
      if (fromLocal) return JSON.parse(fromLocal) as AuthSession;
      const fromSession = sessionStorage.getItem(SESSION_KEY);
      if (fromSession) return JSON.parse(fromSession) as AuthSession;
      return null;
    } catch {
      return null;
    }
  }

  login(email: string, password: string, rememberMe: boolean): { ok: boolean; error?: string } {
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail === 'admin@stockwise.com' && password === 'StockWise123') {
      const session: AuthSession = {
        userId: 'usr-1',
        fullName: 'Carlos Restrepo',
        email: 'admin@stockwise.com',
        role: 'Administrador',
        rememberMe,
        loggedInAt: new Date().toISOString(),
      };

      this._session.set(session);
      const serialized = JSON.stringify(session);

      if (rememberMe) {
        localStorage.setItem(SESSION_KEY, serialized);
        sessionStorage.removeItem(SESSION_KEY);
      } else {
        sessionStorage.setItem(SESSION_KEY, serialized);
        localStorage.removeItem(SESSION_KEY);
      }

      return { ok: true };
    }

    return {
      ok: false,
      error: 'Credenciales inválidas. Verifica tu correo y contraseña de demostración.',
    };
  }

  logout(): void {
    this._session.set(null);
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    void this.router.navigate(['/login']);
  }
}

