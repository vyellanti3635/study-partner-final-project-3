import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { signupSchema, type SignupInput } from '../../schemas/auth.schema';
import { useAuth } from '../../auth/AuthContext';
import { FormField } from '../../components/FormField/FormField';
import styles from './Signup.module.scss';

export function Signup() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupInput) => {
    setServerError(null);
    try {
      await auth.signup(data);
      navigate('/app/dashboard', { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const body = err.response?.data as
          | { error?: { message?: string; fields?: Record<string, string> } }
          | undefined;

        if (status === 409) {
          setError('email', { message: 'Email is already in use' });
          return;
        }

        if (status === 400 && body?.error?.fields) {
          const fields = body.error.fields;
          (Object.keys(fields) as Array<keyof SignupInput>).forEach((key) => {
            setError(key, { message: fields[key] });
          });
          return;
        }

        setServerError(body?.error?.message ?? 'An unexpected error occurred. Please try again.');
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div className={styles.page}>
      {/* Left brand sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogoPlaceholder} aria-hidden="true">
          SP
        </div>
        <h2 className={styles.sidebarTitle}>StudyPartner</h2>
        <p className={styles.sidebarText}>
          Join thousands of students already staying on top of their deadlines.
        </p>
        <ul className={styles.sidebarList}>
          <li>Free to use</li>
          <li>No ads</li>
          <li>Works offline</li>
          <li>Secure and private</li>
        </ul>
      </aside>

      {/* Right form panel */}
      <div className={styles.formPanel}>
        <h2 className={styles.formTitle}>Create Your Account</h2>
        <p className={styles.formSubtitle}>Fill in the details below to get started.</p>
        <hr className={styles.divider} />

        {serverError && <div className="form-alert">{serverError}</div>}

        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate>
          <FormField
            label="Full Name"
            required
            registration={register('name')}
            type="text"
            placeholder="e.g. Jane Smith"
            error={errors.name?.message}
            autoComplete="name"
          />
          <FormField
            label="Email Address"
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
            placeholder="minimum 8 characters"
            error={errors.password?.message}
            autoComplete="new-password"
          />
          <FormField
            label="Confirm Password"
            required
            registration={register('confirmPassword')}
            type="password"
            placeholder="repeat password"
            error={errors.confirmPassword?.message}
            autoComplete="new-password"
          />

          <div className="mt-3">
            <button
              type="submit"
              className="btn btn-dark w-100"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </div>
        </form>

        <hr className={styles.divider} />
        <p className={styles.loginLink}>
          Already have an account?{' '}
          <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
