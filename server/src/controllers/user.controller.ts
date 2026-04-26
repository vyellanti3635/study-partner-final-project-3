import { RequestHandler } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { ok, err } from '../lib/apiResponse';
import { AppError } from '../lib/httpErrors';
import { env } from '../config/env';

// GET /api/user/profile
// Returns the current user's profile (same shape as /api/auth/me's user field).
export const getProfile: RequestHandler = async (req, res, next) => {
  try {
    const user = await User.findById(req.session.userId);

    if (!user) {
      throw new AppError(401, 'Authentication required');
    }

    const userJson = user.toJSON() as unknown as {
      id: string;
      name: string;
      email: string;
      createdAt: string;
    };

    res.status(200).json(ok({ id: userJson.id, name: userJson.name, email: userJson.email, createdAt: userJson.createdAt }));
  } catch (error) {
    next(error);
  }
};

// PATCH /api/user/profile
// Updates name and/or email. If email is changing, currentPassword must be provided.
export const updateProfile: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.session.userId as string;
    const { name, email, currentPassword } = req.body as {
      name?: string;
      email?: string;
      currentPassword?: string;
    };

    // Load the user including passwordHash for potential bcrypt check
    const user = await User.findById(userId).select('+passwordHash');

    if (!user) {
      throw new AppError(401, 'Authentication required');
    }

    const normalizedEmail = email ? email.toLowerCase().trim() : undefined;
    const emailChanging = normalizedEmail !== undefined && normalizedEmail !== user.email;

    if (emailChanging) {
      // currentPassword is required when email changes (Req 16.4)
      if (!currentPassword) {
        res.status(400).json(
          err('Validation failed', { currentPassword: 'Current password is required when changing email' })
        );
        return;
      }

      const passwordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!passwordValid) {
        throw new AppError(401, 'Incorrect password');
      }
    }

    // Build the update object — only include fields that were provided
    const updates: Record<string, string> = {};
    if (name !== undefined) updates['name'] = name;
    if (normalizedEmail !== undefined) updates['email'] = normalizedEmail;

    let updatedUser;
    try {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
      );
    } catch (updateError) {
      // E11000 = email already in use by a different user
      if ((updateError as { code?: number }).code === 11000) {
        throw new AppError(409, 'Email is already in use');
      }
      throw updateError;
    }

    if (!updatedUser) {
      throw new AppError(401, 'Authentication required');
    }

    const userJson = updatedUser.toJSON() as unknown as {
      id: string;
      name: string;
      email: string;
      createdAt: string;
    };

    res.status(200).json(ok({ id: userJson.id, name: userJson.name, email: userJson.email, createdAt: userJson.createdAt }));
  } catch (error) {
    next(error);
  }
};

// PATCH /api/user/password
// Changes the user's password. Does not invalidate other sessions (by design, v1 scope).
export const changePassword: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.session.userId as string;
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    };

    // Load the user with passwordHash
    const user = await User.findById(userId).select('+passwordHash');

    if (!user) {
      throw new AppError(401, 'Authentication required');
    }

    // Verify current password
    const passwordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordValid) {
      throw new AppError(401, 'Current password is incorrect');
    }

    // Hash and save the new password (cost factor from env, default 12)
    const newHash = await bcrypt.hash(newPassword, env.BCRYPT_COST);

    await User.findByIdAndUpdate(userId, { $set: { passwordHash: newHash } });

    // Session remains valid (do not destroy — v1 design decision, Req 16.9)
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
