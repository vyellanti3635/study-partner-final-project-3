import { RequestHandler } from 'express';
import { Types } from 'mongoose';
import { Task } from '../models/Task';
import { Subject } from '../models/Subject';
import { ok, err } from '../lib/apiResponse';
import { AppError } from '../lib/httpErrors';

// Helper: normalize a lean or Mongoose task doc to the public shape.
function toPublicTask(t: {
  _id: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  subjectId: Types.ObjectId | string;
  title: string;
  notes?: string;
  dueDate: Date;
  priority: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: String(t._id),
    userId: String(t.userId),
    subjectId: String(t.subjectId),
    title: t.title,
    notes: t.notes,
    dueDate: t.dueDate.toISOString(),
    priority: t.priority,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

// POST /api/tasks
export const create: RequestHandler = async (req, res, next) => {
  try {
    const userId = new Types.ObjectId(req.session.userId);
    const { title, subjectId, dueDate, priority, status, notes } = req.body as {
      title: string;
      subjectId: string;
      dueDate: string;
      priority: 'Low' | 'Medium' | 'High';
      status?: 'Not Started' | 'In Progress' | 'Completed';
      notes?: string;
    };

    // Verify the subjectId belongs to the current user (Req 5.5)
    const subjectExists = await Subject.exists({
      _id: new Types.ObjectId(subjectId),
      userId,
    });

    if (!subjectExists) {
      res.status(400).json(err('Validation failed', { subjectId: 'Invalid subject' }));
      return;
    }

    const task = await Task.create({
      userId,
      subjectId: new Types.ObjectId(subjectId),
      title,
      notes,
      dueDate: new Date(dueDate),
      priority,
      status: status ?? 'Not Started',
    });

    res.status(201).json(ok(toPublicTask(task)));
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks
// Supports: page, limit, subjectId, q (title search), sort, status
export const list: RequestHandler = async (req, res, next) => {
  try {
    const userId = new Types.ObjectId(req.session.userId);

    // Parse and coerce query params
    const page = Math.max(1, parseInt(String(req.query['page'] ?? '1'), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query['limit'] ?? '6'), 10) || 6));
    const subjectId = req.query['subjectId'] as string | undefined;
    const q = req.query['q'] as string | undefined;
    const sort = req.query['sort'] as string | undefined;
    const statusFilter = req.query['status'] as string | undefined;

    // Build the MongoDB filter
    const filter: Record<string, unknown> = { userId };

    if (subjectId && /^[0-9a-fA-F]{24}$/.test(subjectId)) {
      filter['subjectId'] = new Types.ObjectId(subjectId);
    }

    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'open') {
        filter['status'] = { $ne: 'Completed' };
      } else if (statusFilter === 'done') {
        filter['status'] = 'Completed';
      }
    }

    if (q && q.trim()) {
      // Case-insensitive title search
      filter['title'] = { $regex: q.trim(), $options: 'i' };
    }

    // Sort map
    let sortOption: Record<string, 1 | -1> = { dueDate: 1 };
    if (sort === 'createdAt') {
      sortOption = { createdAt: -1 };
    } else if (sort === 'priority') {
      // High -> Medium -> Low: map to numeric for sort
      // Use a pipeline aggregation for priority sort
      sortOption = { priority: 1 }; // Fallback; handled via addFields below
    } else if (sort === 'status') {
      sortOption = { status: 1 };
    }

    let tasks;
    let total;

    if (sort === 'priority') {
      // MongoDB cannot directly sort by custom enum order, use aggregation
      const pipeline = [
        { $match: filter },
        {
          $addFields: {
            priorityOrder: {
              $switch: {
                branches: [
                  { case: { $eq: ['$priority', 'High'] }, then: 1 },
                  { case: { $eq: ['$priority', 'Medium'] }, then: 2 },
                  { case: { $eq: ['$priority', 'Low'] }, then: 3 },
                ],
                default: 4,
              },
            },
          },
        },
        { $sort: { priorityOrder: 1 as 1 } },
        {
          $facet: {
            data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
            count: [{ $count: 'total' }],
          },
        },
      ];

      const [result] = await Task.aggregate(pipeline);
      tasks = result.data;
      total = result.count[0]?.total ?? 0;
    } else {
      [total, tasks] = await Promise.all([
        Task.countDocuments(filter),
        Task.find(filter)
          .sort(sortOption)
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
      ]);
    }

    const data = (tasks as {
      _id: Types.ObjectId;
      userId: Types.ObjectId;
      subjectId: Types.ObjectId;
      title: string;
      notes?: string;
      dueDate: Date;
      priority: string;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    }[]).map(toPublicTask);

    res.status(200).json(ok(data, { total, page, limit }));
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/:id
export const getById: RequestHandler = async (req, res, next) => {
  try {
    const userId = new Types.ObjectId(req.session.userId);
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json(err('Task not found'));
      return;
    }

    const task = await Task.findOne({ _id: new Types.ObjectId(id), userId }).lean();

    if (!task) {
      // 404 regardless of whether the task exists but belongs to another user
      // (anti-enumeration, Req 4.3)
      res.status(404).json(err('Task not found'));
      return;
    }

    res.status(200).json(ok(toPublicTask(task)));
  } catch (error) {
    next(error);
  }
};

// PATCH /api/tasks/:id
export const update: RequestHandler = async (req, res, next) => {
  try {
    const userId = new Types.ObjectId(req.session.userId);
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json(err('Task not found'));
      return;
    }

    const body = req.body as {
      title?: string;
      subjectId?: string;
      dueDate?: string;
      priority?: 'Low' | 'Medium' | 'High';
      status?: 'Not Started' | 'In Progress' | 'Completed';
      notes?: string;
      isComplete?: boolean;
    };

    // Handle isComplete toggle convenience field
    const updateFields: Record<string, unknown> = {};

    if (body.isComplete !== undefined) {
      updateFields['status'] = body.isComplete ? 'Completed' : 'Not Started';
    }

    if (body.title !== undefined) updateFields['title'] = body.title;
    if (body.dueDate !== undefined) updateFields['dueDate'] = new Date(body.dueDate);
    if (body.priority !== undefined) updateFields['priority'] = body.priority;
    if (body.status !== undefined) updateFields['status'] = body.status;
    if (body.notes !== undefined) updateFields['notes'] = body.notes;

    if (body.subjectId !== undefined) {
      // Verify the new subjectId belongs to the current user
      const subjectExists = await Subject.exists({
        _id: new Types.ObjectId(body.subjectId),
        userId,
      });

      if (!subjectExists) {
        res.status(400).json(err('Validation failed', { subjectId: 'Invalid subject' }));
        return;
      }

      updateFields['subjectId'] = new Types.ObjectId(body.subjectId);
    }

    const task = await Task.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId },
      { $set: updateFields },
      { new: true, runValidators: true }
    ).lean();

    if (!task) {
      res.status(404).json(err('Task not found'));
      return;
    }

    res.status(200).json(ok(toPublicTask(task)));
  } catch (error) {
    next(error);
  }
};

// DELETE /api/tasks/:id
export const remove: RequestHandler = async (req, res, next) => {
  try {
    const userId = new Types.ObjectId(req.session.userId);
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json(err('Task not found'));
      return;
    }

    const deleted = await Task.findOneAndDelete({
      _id: new Types.ObjectId(id),
      userId,
    });

    if (!deleted) {
      res.status(404).json(err('Task not found'));
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/today
// Returns open tasks whose dueDate falls within today's UTC calendar day.
// dueDate is stored as UTC midnight of the date string the user submitted (e.g. "2026-04-26"
// parses to 2026-04-26T00:00:00.000Z). We therefore compare against UTC day boundaries so
// that a task created for "today" is always found regardless of the server's local timezone.
export const today: RequestHandler = async (req, res, next) => {
  try {
    const userId = new Types.ObjectId(req.session.userId);

    const now = new Date();
    // UTC day boundaries
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    const tasks = await Task.find({
      userId,
      dueDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'Completed' },
    })
      .sort({ dueDate: 1 })
      .lean();

    const data = (tasks as Parameters<typeof toPublicTask>[0][]).map(toPublicTask);

    res.status(200).json(ok(data));
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/upcoming
// Next 5 open tasks ordered by dueDate ascending, with dueDate strictly after today (UTC).
export const upcoming: RequestHandler = async (req, res, next) => {
  try {
    const userId = new Types.ObjectId(req.session.userId);

    const now = new Date();
    // Anything after today's UTC end-of-day is "upcoming"
    const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    const limitParam = parseInt(String(req.query['limit'] ?? '5'), 10);
    const upcomingLimit = isNaN(limitParam) || limitParam < 1 ? 5 : limitParam;

    const tasks = await Task.find({
      userId,
      dueDate: { $gt: endOfToday },
      status: { $ne: 'Completed' },
    })
      .sort({ dueDate: 1 })
      .limit(upcomingLimit)
      .lean();

    const data = (tasks as Parameters<typeof toPublicTask>[0][]).map(toPublicTask);

    res.status(200).json(ok(data));
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/stats
// Returns { total, dueToday, completed, subjects, weeklyProgress }
// weeklyProgress: per-subject progress in the current ISO week (Mon-Sun)
export const stats: RequestHandler = async (req, res, next) => {
  try {
    const userId = new Types.ObjectId(req.session.userId);

    const now = new Date();

    // Today boundaries in UTC (matches how dueDate is stored)
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    // ISO week boundaries in UTC (Mon = start, Sun = end)
    const dayOfWeek = now.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysFromMonday, 0, 0, 0, 0));
    const endOfWeek = new Date(Date.UTC(startOfWeek.getUTCFullYear(), startOfWeek.getUTCMonth(), startOfWeek.getUTCDate() + 6, 23, 59, 59, 999));

    const [total, dueToday, completed, subjectCount, weekTasks, allSubjects] = await Promise.all([
      Task.countDocuments({ userId }),
      Task.countDocuments({ userId, dueDate: { $gte: startOfDay, $lte: endOfDay }, status: { $ne: 'Completed' } }),
      Task.countDocuments({ userId, status: 'Completed' }),
      Subject.countDocuments({ userId }),
      Task.find({ userId, dueDate: { $gte: startOfWeek, $lte: endOfWeek } }).lean(),
      Subject.find({ userId }).lean(),
    ]);

    // Build weekly progress map keyed by subjectId string
    const subjectMap = new Map<string, string>(
      (allSubjects as { _id: Types.ObjectId; name: string }[]).map((s) => [String(s._id), s.name])
    );

    const weekGroups = new Map<string, { total: number; completed: number }>();
    for (const t of weekTasks as { subjectId: Types.ObjectId; status: string }[]) {
      const sid = String(t.subjectId);
      const entry = weekGroups.get(sid) ?? { total: 0, completed: 0 };
      const updated = {
        total: entry.total + 1,
        completed: entry.completed + (t.status === 'Completed' ? 1 : 0),
      };
      weekGroups.set(sid, updated);
    }

    const weeklyProgress = Array.from(weekGroups.entries())
      .filter(([, g]) => g.total > 0)
      .map(([sid, g]) => ({
        subjectId: sid,
        name: subjectMap.get(sid) ?? 'Unknown',
        percent: Math.round((g.completed / g.total) * 100),
      }));

    res.status(200).json(
      ok({
        total,
        dueToday,
        completed,
        subjects: subjectCount,
        weeklyProgress,
      })
    );
  } catch (error) {
    next(error);
  }
};

// Throw a typed AppError (re-exported for use in routes if needed)
export { AppError };
