import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskCreateSchema, type TaskCreateInput } from '../../schemas/task.schema';
import { FormField } from '../FormField/FormField';
import { useSubjectsList, useCreateSubject } from '../../hooks/useSubjects';
import { useToast } from '../../hooks/useToast';
import type { Task } from '../../types/api';
import styles from './TaskForm.module.scss';

type Props = {
  mode: 'create' | 'edit';
  initialValues?: Task;
  onSubmit: (values: TaskCreateInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
};

function formatDateForInput(dateStr: string): string {
  // Convert ISO date string to YYYY-MM-DD for <input type="date">
  return dateStr.substring(0, 10);
}

export function TaskForm({ mode, initialValues, onSubmit, onCancel, isSubmitting: externalSubmitting }: Props) {
  const { addToast } = useToast();
  const { data: subjects = [] } = useSubjectsList();
  const createSubject = useCreateSubject();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting: formSubmitting },
  } = useForm<TaskCreateInput>({
    resolver: zodResolver(taskCreateSchema),
    defaultValues: initialValues
      ? {
          title: initialValues.title,
          subjectId: initialValues.subjectId,
          dueDate: formatDateForInput(initialValues.dueDate),
          priority: initialValues.priority,
          status: initialValues.status,
          notes: initialValues.notes ?? '',
        }
      : {
          status: 'Not Started',
          priority: undefined,
          notes: '',
        },
  });

  // When subjects load after initial render, re-sync for edit mode
  useEffect(() => {
    if (mode === 'edit' && initialValues?.subjectId) {
      setValue('subjectId', initialValues.subjectId);
    }
  }, [mode, initialValues?.subjectId, setValue]);

  const isSubmitting = formSubmitting || externalSubmitting;

  const handleSubjectSelectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    if (value === '__new__') {
      // Prompt for new subject name
      const newName = window.prompt('Enter new subject name:');
      if (!newName || !newName.trim()) return;

      try {
        const { subject } = await createSubject.mutateAsync(newName.trim());
        setValue('subjectId', subject.id, { shouldValidate: true });
      } catch {
        addToast('Failed to create subject', 'error');
      }
    } else {
      setValue('subjectId', value, { shouldValidate: true });
    }
  };

  const handleFormSubmit = async (data: TaskCreateInput) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={(e) => void handleSubmit(handleFormSubmit)(e)} noValidate>
      {/* Row 1: Title + Subject */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-md-6">
          <FormField
            label="Task Title"
            required
            registration={register('title')}
            type="text"
            placeholder="e.g. Complete Assignment 3"
            error={errors.title?.message}
          />
        </div>
        <div className="col-12 col-md-6">
          <div className={styles.field}>
            <label htmlFor="subjectId" className={styles.label}>
              Subject <span className={styles.required}> *</span>
            </label>
            <select
              id="subjectId"
              className={`form-select ${errors.subjectId ? 'is-invalid' : ''}`}
              {...register('subjectId')}
              onChange={(e) => void handleSubjectSelectChange(e)}
            >
              <option value="">Select subject...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
              <option value="__new__">+ Add new subject</option>
            </select>
            {errors.subjectId && (
              <span className="form-error">{errors.subjectId.message}</span>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Due Date + Priority */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-md-6">
          <FormField
            label="Due Date"
            required
            registration={register('dueDate')}
            type="date"
            error={errors.dueDate?.message}
          />
        </div>
        <div className="col-12 col-md-6">
          <FormField
            as="select"
            label="Priority"
            required
            registration={register('priority')}
            error={errors.priority?.message}
          >
            <option value="">Select priority...</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </FormField>
        </div>
      </div>

      {/* Notes */}
      <div className="mb-3">
        <FormField
          as="textarea"
          label="Notes (optional)"
          registration={register('notes')}
          rows={4}
          placeholder="Add any extra notes or reminders here..."
          error={errors.notes?.message}
        />
      </div>

      {/* Status */}
      <div className="mb-4">
        <FormField
          as="select"
          label="Status"
          registration={register('status')}
          error={errors.status?.message}
        >
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </FormField>
      </div>

      <hr />

      {/* Actions */}
      <div className={`d-flex gap-2 justify-content-end ${styles.actions}`}>
        <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-dark" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : mode === 'create' ? 'Save Task' : 'Update Task'}
        </button>
      </div>
    </form>
  );
}
