import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Navbar } from '../../components/Navbar/Navbar';
import { TaskForm } from '../../components/TaskForm/TaskForm';
import { useCreateTask } from '../../hooks/useTasks';
import { useToast } from '../../hooks/useToast';
import type { TaskCreateInput } from '../../schemas/task.schema';
import styles from './AddTask.module.scss';

export function AddTask() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const createTask = useCreateTask();

  const handleSubmit = async (values: TaskCreateInput) => {
    try {
      await createTask.mutateAsync(values);
      addToast('Task created');
      navigate('/app/tasks');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const body = error.response?.data as
          | { error?: { message?: string } }
          | undefined;
        const message = body?.error?.message ?? 'Failed to create task';
        addToast(message, 'error');
      } else {
        addToast('Failed to create task', 'error');
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
          {' / Add New Task'}
        </div>

        <div className="card">
          <div className={styles.cardAccent} />
          <div className="card-body">
            <h2 className="h5 mb-1">Add New Task</h2>
            <p className="text-muted small mb-3">Fields marked with * are required.</p>
            <hr />
            <TaskForm
              mode="create"
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={createTask.isPending}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
