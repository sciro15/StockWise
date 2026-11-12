import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  LucideAngularModule,
  Mail,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ModalComponent } from '../../shared/components/modal.component';
import { StockwiseLogoComponent } from '../../shared/components/stockwise-logo.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    StockwiseLogoComponent,
    ModalComponent,
  ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  readonly showPassword = signal(false);
  readonly errorMsg = signal('');
  readonly recoveryOpen = signal(false);
  readonly recoverySent = signal(false);

  readonly MailIcon = Mail;
  readonly LockIcon = Lock;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;
  readonly ArrowRightIcon = ArrowRight;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly TrendingUpIcon = TrendingUp;
  readonly SparklesIcon = Sparkles;
  readonly CheckCircleIcon = CheckCircle2;

  readonly form = this.fb.nonNullable.group({
    email: ['admin@stockwise.com', [Validators.required, Validators.email]],
    password: ['StockWise123', [Validators.required, Validators.minLength(6)]],
    rememberMe: [true],
  });

  readonly recoveryForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  fillDemoCredentials(): void {
    this.form.patchValue({
      email: 'admin@stockwise.com',
      password: 'StockWise123',
      rememberMe: true,
    });
    this.errorMsg.set('');
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password, rememberMe } = this.form.getRawValue();
    const res = this.auth.login(email, password, rememberMe);

    if (!res.ok) {
      this.errorMsg.set(res.error ?? 'Error de autenticación.');
      return;
    }

    this.notifications.success('Bienvenido a StockWise', 'Sesión iniciada en TechStore Medellín.');
    void this.router.navigate(['/dashboard']);
  }

  openRecovery(): void {
    this.recoverySent.set(false);
    this.recoveryForm.reset({ email: this.form.controls.email.value || '' });
    this.recoveryOpen.set(true);
  }

  submitRecovery(): void {
    if (this.recoveryForm.invalid) {
      this.recoveryForm.markAllAsTouched();
      return;
    }
    this.recoverySent.set(true);
  }
}

