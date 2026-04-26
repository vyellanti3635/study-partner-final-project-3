import { RequestHandler } from 'express';
import { Types } from 'mongoose';
import { Subject } from '../models/Subject';
import { ok } from '../lib/apiResponse';

// GET /api/subjects
// Returns all subjects belonging to the current user, sorted alphabetically by name.
export const list: RequestHandler = async (req, res, next) => {
  try {
    const userId = new Types.ObjectId(req.session.userId);

    const subjects = await Subject.find({ userId })
      .sort({ name: 1 })
      .lean({ virtuals: false });

    // Normalize lean docs to the public shape (id instead of _id)
    const data = subjects.map((s) => ({
      id: String(s._id),
      name: s.name,
      createdAt: (s.createdAt as unknown as Date).toISOString(),
    }));

    res.status(200).json(ok(data));
  } catch (error) {
    next(error);
  }
};

// POST /api/subjects
// Creates a new subject scoped to the current user.
// On case-insensitive name collision (E11000), fetches the existing record and returns 409
// with the existing subject's data so the client can transparently reuse it (Req 8.3).
export const create: RequestHandler = async (req, res, next) => {
  const userId = new Types.ObjectId(req.session.userId);
  // req.body is pre-validated by validate(subjectCreateSchema) middleware
  const { name } = req.body as { name: string };

  try {
    const subject = await Subject.create({ userId, name });

    const subjectJson = subject.toJSON() as unknown as {
      id: string;
      name: string;
      createdAt: string;
    };

    res.status(201).json(ok({ id: subjectJson.id, name: subjectJson.name, createdAt: subjectJson.createdAt }));
  } catch (error) {
    // E11000 = duplicate key — same userId + name (case-insensitive via collation index)
    if ((error as { code?: number }).code === 11000) {
      try {
        // Fetch the existing subject and return it with 409 so the client can reuse the id
        const existing = await Subject.findOne({ userId, name })
          .collation({ locale: 'en', strength: 2 });

        if (existing) {
          const existingJson = existing.toJSON() as unknown as {
            id: string;
            name: string;
            createdAt: string;
          };
          res.status(409).json(ok({ id: existingJson.id, name: existingJson.name, createdAt: existingJson.createdAt }));
          return;
        }
      } catch (fetchError) {
        next(fetchError);
        return;
      }
    }
    next(error);
  }
};
