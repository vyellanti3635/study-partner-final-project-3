import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISubject extends Document {
  userId: Types.ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubjectPublic {
  id: string;
  name: string;
  createdAt: string;
}

const subjectSchema = new Schema<ISubject>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [1, 'Name must be at least 1 character'],
      maxlength: [50, 'Name must be at most 50 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index with case-insensitive collation (Property 6: Subject Uniqueness per User)
// collation strength 2 = case-insensitive so "Math 101" and "math 101" are treated as identical
subjectSchema.index(
  { userId: 1, name: 1 },
  {
    unique: true,
    collation: { locale: 'en', strength: 2 },
  }
);

// toJSON transform: rename _id to id, remove __v
subjectSchema.set('toJSON', {
  versionKey: false,
  transform(_doc, ret) {
    const output = ret as unknown as Record<string, unknown>;
    output['id'] = String(output['_id']);
    delete output['_id'];
    return output;
  },
});

export const Subject = mongoose.model<ISubject>('Subject', subjectSchema);
