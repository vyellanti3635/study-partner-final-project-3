import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [1, 'Name must be at least 1 character'],
      maxlength: [100, 'Name must be at most 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      maxlength: [254, 'Email must be at most 254 characters'],
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Email must be a valid address',
      ],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index on email (enforces Property 3: Email Uniqueness Invariant)
userSchema.index({ email: 1 }, { unique: true });

// toJSON transform: strip passwordHash, rename _id to id
userSchema.set('toJSON', {
  versionKey: false,
  transform(_doc, ret) {
    const output = ret as unknown as Record<string, unknown>;
    output['id'] = String(output['_id']);
    delete output['_id'];
    delete output['passwordHash'];
    return output;
  },
});

export const User = mongoose.model<IUser>('User', userSchema);
