import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { Navbar } from '../../components/Navbar/Navbar';
import { FormField } from '../../components/FormField/FormField';
import { useAuth } from '../../auth/AuthContext';
import { userApi } from '../../api/user';
import { profileUpdateSchema, passwordChangeSchema } from '../../schemas/user.schema';
import type { ProfileUpdateInput, PasswordChangeInput } from '../../schemas/user.schema';
import { useToast } from '../../hooks/useToast';
import styles from './Profile.module.scss';

// ─── Account Information Card ────────────────────────────────────────────────

function AccountInfoCard() {
  const auth = useAuth();
  const { addToast } = useToast();
  const user = auth.status === 'authenticated' ? auth.user : null;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      currentPassword: '',
    },
  });

  const watchedEmail = watch('email');
  const isEmailDirty = Boolean(dirtyFields.email);
  const requiresCurrentPassword = isEmailDirty && watchedEmail !== user?.email;

  const onSubmit = async (data: ProfileUpdateInput) => {
    try {
      await userApi.updateProfile(data);
      await auth.refresh();
      addToast('Profile updated');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const body = error.response?.data as
          | { error?: { message?: string } }
          | undefined;

        if (status === 409) {
          addToast('Email is already in use', 'error');
        } else if (status === 401) {
          addToast('Current password is incorrect', 'error');
        } else {
          addToast(body?.error?.message ?? 'Failed to update profile', 'error');
        }
      } else {
        addToast('Failed to update profile', 'error');
      }
    }
  };

  return (
    <div className={`card mb-4 ${styles.card}`}>
      <div className={styles.cardAccent} />
      <div className="card-body">
        <h2 className="h6 fw-bold mb-1">Account Information</h2>
        <p className="text-muted small mb-3">Update your name and email address.</p>
        <hr />
        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate>
          <div className="mb-3">
            <FormField
              label="Full Name"
              required
              registration={register('name')}
              type="text"
              error={errors.name?.message}
            />
          </div>
          <div className="mb-3">
            <FormField
              label="Email Address"
              required
              registration={register('email')}
              type="email"
              error={errors.email?.message}
            />
          </div>

          {requiresCurrentPassword && (
            <div className="mb-3">
              <FormField
                label="Current Password"
                required
                registration={register('currentPassword')}
                type="password"
                placeholder="Required when changing email"
                error={errors.currentPassword?.message}
              />
            </div>
          )}

          <div className="d-flex justify-content-end">
            <button
              type="submit"
              className="btn btn-dark btn-sm"
              disabled={isSubmitting || !isDirty}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Change Password Card ─────────────────────────────────────────────────────

function ChangePasswordCard() {
  const { addToast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
  });

  const onSubmit = async (data: PasswordChangeInput) => {
    setServerError(null);
    try {
      await userApi.changePassword(data);
      addToast('Password updated');
      reset();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const body = error.response?.data as
          | { error?: { message?: string; fields?: Record<string, string> } }
          | undefined;

        if (status === 401) {
          // Per Req 16.8: inline error on currentPassword field
          setError('currentPassword', {
            type: 'server',
            message: body?.error?.message ?? 'Current password is incorrect',
          });
        } else if (status === 400) {
          const fields = body?.error?.fields;
          if (fields?.['confirmPassword']) {
            setError('confirmPassword', {
              type: 'server',
              message: fields['confirmPassword'],
            });
          } else {
            setServerError(body?.error?.message ?? 'Failed to update password');
          }
        } else {
          setServerError(body?.error?.message ?? 'Failed to update password');
        }
      } else {
        setServerError('Failed to update password');
      }
    }
  };

  return (
    <div className={`card ${styles.card}`}>
      <div className={styles.cardAccent} />
      <div className="card-body">
        <h2 className="h6 fw-bold mb-1">Change Password</h2>
        <p className="text-muted small mb-3">Choose a strong password of at least 8 characters.</p>
        <hr />

        {serverError && (
          <div className="form-alert" role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate>
          <div className="mb-3">
            <FormField
              label="Current Password"
              required
              registration={register('currentPassword')}
              type="password"
              error={errors.currentPassword?.message}
              autoComplete="current-password"
            />
          </div>
          <div className="mb-3">
            <FormField
              label="New Password"
              required
              registration={register('newPassword')}
              type="password"
              error={errors.newPassword?.message}
              autoComplete="new-password"
            />
          </div>
          <div className="mb-3">
            <FormField
              label="Confirm New Password"
              required
              registration={register('confirmPassword')}
              type="password"
              error={errors.confirmPassword?.message}
              autoComplete="new-password"
            />
          </div>
          <div className="d-flex justify-content-end">
            <button type="submit" className="btn btn-dark btn-sm" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────

export function Profile() {
  return (
    <div>
      <Navbar variant="auth" />
      <div className="container py-4">
        <div className={styles.profileLayout}>
          <h1 className="h4 mb-4">Profile</h1>
          <AccountInfoCard />
          <ChangePasswordCard />
        </div>
      </div>
    </div>
  );
}
