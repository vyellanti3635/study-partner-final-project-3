import mongoose, { Document, Schema, Types } from 'mongoose';

export type Priority = 'Low' | 'Medium' | 'High';
export type Status = 'Not Started' | 'In Progress' | 'Completed';

export interface ITask extends Document {
  userId: Types.ObjectId;
  subjectId: Types.ObjectId;
  title: string;
  notes?: string;
  dueDate: Date;
  priority: Priority;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [1, 'Title must be at least 1 character'],
      maxlength: [200, 'Title must be at most 200 characters'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes must be at most 1000 characters'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    priority: {
      type: String,
      enum: {
        values: ['Low', 'Medium', 'High'],
        message: 'Priority must be Low, Medium, or High',
      },
      required: [true, 'Priority is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['Not Started', 'In Progress', 'Completed'],
        message: 'Status must be Not Started, In Progress, or Completed',
      },
      default: 'Not Started',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes to support common queries (design.md: Task Model Indexes)
// Supports "due today" and sorted task listings
taskSchema.index({ userId: 1, dueDate: 1 });
// Supports subject-filtered listings
taskSchema.index({ userId: 1, subjectId: 1 });
// Supports completed/active status filtering
taskSchema.index({ userId: 1, status: 1 });

// toJSON transform: rename _id to id, remove __v
taskSchema.set('toJSON', {
  versionKey: false,
  transform(_doc, ret) {
    const output = ret as unknown as Record<string, unknown>;
    output['id'] = String(output['_id']);
    delete output['_id'];
    return output;
  },
});

export const Task = mongoose.model<ITask>('Task', taskSchema);
