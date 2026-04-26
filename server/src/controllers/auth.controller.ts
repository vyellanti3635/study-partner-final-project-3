import { RequestHandler } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { ok, err } from '../lib/apiResponse';
import { AppError } from '../lib/httpErrors';
import { env } from '../config/env';

// POST /api/auth/signup
export const signup: RequestHandler = async (req, res, next) => {
  try {
    const { name, email, password } = req.body as {
      name: string;
      email: string;
      password: string;
    };

    const passwordHash = await bcrypt.hash(password, env.BCRYPT_COST);

    const user = await User.create({ name, email, passwordHash });

    req.session.userId = String(user._id);

    const userJson = user.toJSON() as { id: string; name: string; email: string };

    res.status(201).json(ok({ user: { id: userJson.id, name: userJson.name, email: userJson.email } }));
  } catch (error) {
    // E11000 duplicate key on email field
    if ((error as { code?: number }).code === 11000) {
      next(new AppError(409, 'Email is already in use'));
      return;
    }
    next(error);
  }
};

// POST /api/auth/login
export const login: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    // Retrieve user including passwordHash (excluded by default via select: false)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');

    if (!user) {
      throw new AppError(401, 'Incorrect email or password');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new AppError(401, 'Incorrect email or password');
    }

    req.session.userId = String(user._id);

    const userJson = user.toJSON() as { id: string; name: string; email: string };

    res.status(200).json(ok({ user: { id: userJson.id, name: userJson.name, email: userJson.email } }));
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
export const logout: RequestHandler = (req, res, next) => {
  req.session.destroy((destroyError) => {
    if (destroyError) {
      next(destroyError);
      return;
    }
    res.clearCookie('sp.sid');
    res.status(204).send();
  });
};

// GET /api/auth/me
export const me: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      res.status(200).json(ok({ user: null }));
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      // Session points to a deleted user — treat as unauthenticated
      req.session.destroy(() => undefined);
      res.status(200).json(ok({ user: null }));
      return;
    }

    const userJson = user.toJSON() as { id: string; name: string; email: string };

    res.status(200).json(ok({ user: { id: userJson.id, name: userJson.name, email: userJson.email } }));
  } catch (error) {
    next(error);
  }
};
