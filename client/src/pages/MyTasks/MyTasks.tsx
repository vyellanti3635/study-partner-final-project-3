import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/Navbar/Navbar';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { Pagination } from '../../components/Pagination/Pagination';
import { useTasksList, useUpdateTask, useDeleteTask } from '../../hooks/useTasks';
import { useSubjectsList } from '../../hooks/useSubjects';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import type { Task } from '../../types/api';
import styles from './MyTasks.module.scss';

const PAGE_SIZE = 6;

type StatusFilter = 'all' | 'open' | 'done';
type SortOption = 'dueDate' | 'createdAt' | 'priority' | 'status';

function PriorityBadge({ priority }: { priority: Task['priority'] }) {
  const classMap: Record<Task['priority'], string> = {
    High: 'badge bg-dark text-white',
    Medium: 'badge bg-secondary text-white',
    Low: 'badge bg-light text-dark border',
  };
  return <span className={classMap[priority]}>{priority}</span>;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function MyTasks() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Filter / search / sort state
  const [searchRaw, setSearchRaw] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortOption>('dueDate');
  const [page, setPage] = useState(1);

  const searchDebounced = useDebounce(searchRaw, 250);

  // When any filter changes, reset to page 1
  const handleSearchChange = (value: string) => {
    setSearchRaw(value);
    setPage(1);
  };

  const handleSubjectChange = (value: string) => {
    setSubjectId(value);
    setPage(1);
  };

  const handleStatusChange = (value: StatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleSortChange = (value: SortOption) => {
    setSort(value);
    setPage(1);
  };

  const query = {
    page,
    limit: PAGE_SIZE,
    subjectId: subjectId || undefined,
    q: searchDebounced || undefined,
    status: statusFilter,
    sort,
  };

  const { data: tasksResponse, isLoading } = useTasksList(query);
  const { data: subjects = [] } = useSubjectsList();

  const tasks = tasksResponse?.data ?? [];
  const total = tasksResponse?.meta?.total ?? 0;

  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const handleToggle = (task: Task) => {
    const isComplete = task.status !== 'Completed';
    updateTask.mutate(
      { id: task.id, input: { isComplete } },
      {
        onError: () => {
          addToast('Failed to update task status', 'error');
        },
      }
    );
  };

  const handleDelete = (task: Task) => {
    const confirmed = window.confirm(`Delete "${task.title}"? This cannot be undone.`);
    if (!confirmed) return;
    deleteTask.mutate(task.id, {
      onSuccess: () => {
        addToast('Task deleted');
      },
      onError: () => {
        addToast('Failed to delete task', 'error');
      },
    });
  };

  const hasNoTasksAtAll = !isLoading && total === 0 && !searchRaw && !subjectId && statusFilter === 'all';
  const hasNoMatches = !isLoading && total === 0 && (searchRaw || subjectId || statusFilter !== 'all');

  return (
    <div>
      <Navbar variant="auth" />

      <div className="container py-4">
        {/* Page header */}
        <div className={`d-flex align-items-center justify-content-between mb-3 ${styles.pageHeader}`}>
          <h1 className="h4 mb-0">My Tasks</h1>
          <Link to="/app/tasks/new" className="btn btn-dark btn-sm">
            + Add Task
          </Link>
        </div>

        {/* Search bar */}
        <div className="mb-2">
          <input
            type="search"
            className="form-control"
            placeholder="Search tasks..."
            value={searchRaw}
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label="Search tasks"
          />
        </div>

        {/* Subject filter tabs */}
        <div className={`d-flex flex-wrap gap-1 mb-2 ${styles.filterTabs}`}>
          <button
            type="button"
            className={`btn btn-sm ${subjectId === '' ? 'btn-dark' : 'btn-outline-secondary'}`}
            onClick={() => handleSubjectChange('')}
          >
            All
          </button>
          {subjects.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`btn btn-sm ${subjectId === s.id ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => handleSubjectChange(s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* Status + Sort row */}
        <div className={`d-flex flex-wrap align-items-center gap-2 mb-3 ${styles.sortRow}`}>
          <div className="d-flex gap-1">
            {(['all', 'open', 'done'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                type="button"
                className={`btn btn-sm ${statusFilter === s ? 'btn-dark' : 'btn-outline-secondary'}`}
                onClick={() => handleStatusChange(s)}
              >
                {s === 'all' ? 'All' : s === 'open' ? 'Open' : 'Done'}
              </button>
            ))}
          </div>
          <div className="ms-auto d-flex align-items-center gap-2">
            <label htmlFor="sort-select" className="small text-muted mb-0">
              Sort by:
            </label>
            <select
              id="sort-select"
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={sort}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
            >
              <option value="dueDate">Due Date</option>
              <option value="createdAt">Created</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && <p className="text-muted">Loading...</p>}

        {/* Empty states */}
        {hasNoTasksAtAll && (
          <EmptyState
            title="No tasks yet"
            description="Add your first task to get started."
            action={
              <Link to="/app/tasks/new" className="btn btn-dark btn-sm">
                Add Task
              </Link>
            }
          />
        )}

        {hasNoMatches && (
          <EmptyState
            title="No tasks match"
            description="Try adjusting your search or filters."
            action={
              <Link to="/app/tasks/new" className="btn btn-dark btn-sm">
                Add Task
              </Link>
            }
          />
        )}

        {/* Task table */}
        {!isLoading && tasks.length > 0 && (
          <>
            <div className="table-responsive">
              <table className={`table table-sm align-middle ${styles.taskTable}`}>
                <thead>
                  <tr>
                    <th style={{ width: '32px' }} />
                    <th>Task</th>
                    <th>Subject</th>
                    <th>Due Date</th>
                    <th>Priority</th>
                    <th style={{ width: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => {
                    const isDone = task.status === 'Completed';
                    return (
                      <tr key={task.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={isDone}
                            onChange={() => handleToggle(task)}
                            aria-label={`Mark "${task.title}" ${isDone ? 'incomplete' : 'complete'}`}
                          />
                        </td>
                        <td>
                          <span className={isDone ? styles.strikethrough : styles.taskTitle}>
                            {task.title}
                          </span>
                        </td>
                        <td className="text-muted small">
                          {subjectMap.get(task.subjectId) ?? '—'}
                        </td>
                        <td className="text-muted small">{formatDate(task.dueDate)}</td>
                        <td>
                          <PriorityBadge priority={task.priority} />
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => navigate(`/app/tasks/${task.id}/edit`)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleDelete(task)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              total={total}
              limit={PAGE_SIZE}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          </>
        )}
      </div>
    </div>
  );
}
