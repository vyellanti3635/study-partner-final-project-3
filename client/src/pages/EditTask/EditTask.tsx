import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Navbar } from '../../components/Navbar/Navbar';
import { TaskForm } from '../../components/TaskForm/TaskForm';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { useTaskById, useUpdateTask } from '../../hooks/useTasks';
import { useToast } from '../../hooks/useToast';
import type { TaskCreateInput } from '../../schemas/task.schema';
import styles from './EditTask.module.scss';

export function EditTask() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const updateTask = useUpdateTask();

  const { data: task, isLoading, error } = useTaskById(id ?? '');

  const handleSubmit = async (values: TaskCreateInput) => {
    if (!id) return;
    try {
      await updateTask.mutateAsync({ id, input: values });
      addToast('Task updated');
      navigate('/app/tasks');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const body = err.response?.data as
          | { error?: { message?: string } }
          | undefined;
        const message = body?.error?.message ?? 'Failed to update task';
        addToast(message, 'error');
      } else {
        addToast('Failed to update task', 'error');
      }
    }
  };

  const handleCancel = () => {
    navigate('/app/tasks');
  };

  return (
    <div>
      <Navbar variant="auth" />
      <div className="container py-4" style={{ maxWidth: '860px' }}>
        {/* Breadcrumb */}
        <div className={`text-muted small mb-3 ${styles.breadcrumb}`}>
          <Link to="/app/tasks" className="text-muted">
            My Tasks
          </Link>
          {' / Edit Task'}
        </div>

        {isLoading && <p className="text-muted">Loading...</p>}

        {!isLoading && error != null && (
          <EmptyState
            title="Task not found"
            description="This task does not exist or you do not have access to it."
            action={
              <Link to="/app/tasks" className="btn btn-dark btn-sm">
                Back to My Tasks
              </Link>
            }
          />
        )}

        {!isLoading && task && (
          <div className="card">
            <div className={styles.cardAccent} />
            <div className="card-body">
              <h2 className="h5 mb-1">Edit Task</h2>
              <p className="text-muted small mb-3">Fields marked with * are required.</p>
              <hr />
              <TaskForm
                mode="edit"
                initialValues={task}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isSubmitting={updateTask.isPending}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
