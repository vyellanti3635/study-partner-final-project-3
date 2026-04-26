import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { loginSchema, type LoginInput } from '../../schemas/auth.schema';
import { useAuth } from '../../auth/AuthContext';
import { FormField } from '../../components/FormField/FormField';
import styles from './Login.module.scss';

// Decision: "Forgot password" is omitted per Gate 1 decision.
// "Remember me" is omitted per Gate 1 decision.
// "Continue with Google" is omitted — no OAuth in v1.

export function Login() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setFormError(null);
    try {
      await auth.login(data);
      navigate('/app/dashboard', { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const body = err.response?.data as
          | { error?: { message?: string } }
          | undefined;

        if (status === 401 || status === 400) {
          // Per Req 2.3: generic error at top of form, not pointing at specific field
          setFormError('Incorrect email or password');
          return;
        }

        if (status === 429) {
          setFormError('Too many attempts. Please try again in 15 minutes.');
          return;
        }

        setFormError(body?.error?.message ?? 'An unexpected error occurred. Please try again.');
      } else {
        setFormError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.cardAccentBar} aria-hidden="true" />

        <div className={styles.cardHeader}>
          <div className={styles.logoPlaceholder} aria-hidden="true">SP</div>
          <h2 className={styles.cardTitle}>Welcome Back</h2>
          <p className={styles.cardSubtitle}>Sign in to your StudyPartner account</p>
        </div>

        <hr className={styles.divider} />

        {/* Top-of-form error — not attached to any specific field per Req 2.3 */}
        {formError && <div className="form-alert" role="alert">{formError}</div>}

        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate>
          <FormField
            label="Email"
            required
            registration={register('email')}
            type="email"
            placeholder="you@email.com"
            error={errors.email?.message}
            autoComplete="email"
          />
          <FormField
            label="Password"
            required
            registration={register('password')}
            type="password"
            placeholder="password"
            error={errors.password?.message}
            autoComplete="current-password"
          />

          <div className="mt-3">
            <button
              type="submit"
              className="btn btn-dark w-100"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Logging in...' : 'Log In'}
            </button>
          </div>
        </form>

        <hr className={styles.divider} />
        <p className={styles.signupLink}>
          Don&apos;t have an account?{' '}
          <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
