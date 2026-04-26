import { Link } from 'react-router-dom';
import { Navbar } from '../../components/Navbar/Navbar';
import { useAuth } from '../../auth/AuthContext';
import { useTodayTasks, useUpcomingTasks, useTaskStats, useUpdateTask } from '../../hooks/useTasks';
import { useSubjectsList } from '../../hooks/useSubjects';
import type { Task, Subject } from '../../types/api';
import styles from './Dashboard.module.scss';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getFirstName(fullName: string): string {
  return fullName.trim().split(' ')[0] ?? fullName;
}

function buildSubjectMap(subjects: Subject[]): Map<string, string> {
  return new Map(subjects.map((s) => [s.id, s.name]));
}

function PriorityBadge({ priority }: { priority: Task['priority'] }) {
  const classMap: Record<Task['priority'], string> = {
    High: 'badge bg-dark text-white',
    Medium: 'badge bg-secondary text-white',
    Low: 'badge bg-light text-dark border',
  };
  return <span className={classMap[priority]}>{priority}</span>;
}

function WelcomeBar({ name, dueTodayCount }: { name: string; dueTodayCount: number }) {
  return (
    <div className={styles.welcomeBar}>
      <span className={styles.welcomeName}>
        {getGreeting()}, {name}
      </span>
      <span className={styles.welcomeSub}>
        {' '}— You have {dueTodayCount} task{dueTodayCount !== 1 ? 's' : ''} due today.
      </span>
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: number;
};

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statNum}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

type DueTodayPanelProps = {
  tasks: Task[];
  subjectMap: Map<string, string>;
  onToggleComplete: (task: Task) => void;
};

function DueTodayPanel({ tasks, subjectMap, onToggleComplete }: DueTodayPanelProps) {
  return (
    <div>
      <div className={styles.sectionLabel}>Due Today</div>
      {tasks.length === 0 ? (
        <p className="text-muted">No tasks due today.</p>
      ) : (
        <table className={`table table-sm ${styles.dueTodayTable}`}>
          <thead>
            <tr>
              <th>Task</th>
              <th>Subject</th>
              <th>Due</th>
              <th>Priority</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>
                  <input
                    type="checkbox"
                    className="form-check-input me-2"
                    checked={task.status === 'Completed'}
                    onChange={() => onToggleComplete(task)}
                    aria-label={`Mark "${task.title}" complete`}
                  />
                  <span className={task.status === 'Completed' ? styles.strikethrough : ''}>
                    {task.title}
                  </span>
                </td>
                <td className="text-muted small">{subjectMap.get(task.subjectId) ?? '—'}</td>
                <td className="text-muted small">{formatDate(task.dueDate)}</td>
                <td>
                  <PriorityBadge priority={task.priority} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="mt-2">
        <Link to="/app/tasks" className={styles.viewAllLink}>
          View all tasks
        </Link>
      </div>
    </div>
  );
}

type WeeklyProgressPanelProps = {
  weeklyProgress: Array<{ subjectId: string; name: string; percent: number }>;
};

function WeeklyProgressPanel({ weeklyProgress }: WeeklyProgressPanelProps) {
  return (
    <div>
      <div className={styles.sectionLabel}>Progress This Week</div>
      <div className={styles.card}>
        {weeklyProgress.length === 0 ? (
          <p className="text-muted small mb-0">No task activity this week.</p>
        ) : (
          weeklyProgress.map((item) => (
            <div key={item.subjectId} className={styles.progressItem}>
              <div className={styles.progressHeader}>
                <span className="small">{item.name}</span>
                <span className="text-muted small">{Math.round(item.percent)}%</span>
              </div>
              <div className="progress" style={{ height: '6px' }}>
                <div
                  className="progress-bar bg-dark"
                  role="progressbar"
                  style={{ width: `${item.percent}%` }}
                  aria-valuenow={item.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

type UpcomingPanelProps = {
  tasks: Task[];
  subjectMap: Map<string, string>;
};

function UpcomingPanel({ tasks, subjectMap }: UpcomingPanelProps) {
  return (
    <div>
      <div className={`${styles.sectionLabel} mt-4`}>Upcoming</div>
      <div className={styles.card}>
        {tasks.length === 0 ? (
          <p className="text-muted small mb-0">No upcoming tasks.</p>
        ) : (
          tasks.map((task, idx) => (
            <div
              key={task.id}
              className={idx < tasks.length - 1 ? styles.upcomingItem : undefined}
            >
              <span className={styles.upcomingTitle}>{task.title}</span>
              <span className="text-muted small">
                {' '}— {subjectMap.get(task.subjectId) ?? '—'} · {formatDate(task.dueDate)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function Dashboard() {
  const auth = useAuth();
  const name = auth.status === 'authenticated' ? auth.user.name : '';

  const { data: todayTasks = [], isLoading: todayLoading } = useTodayTasks();
  const { data: upcomingTasks = [], isLoading: upcomingLoading } = useUpcomingTasks();
  const { data: stats, isLoading: statsLoading } = useTaskStats();
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjectsList();
  const updateTask = useUpdateTask();

  const subjectMap = buildSubjectMap(subjects);

  const handleToggleComplete = (task: Task) => {
    const isComplete = task.status !== 'Completed';
    updateTask.mutate({ id: task.id, input: { isComplete } });
  };

  const isLoading = todayLoading || upcomingLoading || statsLoading || subjectsLoading;

  return (
    <div>
      <Navbar variant="auth" />
      <WelcomeBar
        name={getFirstName(name)}
        dueTodayCount={stats?.dueToday ?? todayTasks.length}
      />

      <div className="container py-4">
        {isLoading ? (
          <p className="text-muted">Loading...</p>
        ) : (
          <>
            {/* Stat cards row */}
            <div className="row g-3 mb-4">
              <div className="col-6 col-lg-3">
                <StatCard label="Total Tasks" value={stats?.total ?? 0} />
              </div>
              <div className="col-6 col-lg-3">
                <StatCard label="Due Today" value={stats?.dueToday ?? 0} />
              </div>
              <div className="col-6 col-lg-3">
                <StatCard label="Completed" value={stats?.completed ?? 0} />
              </div>
              <div className="col-6 col-lg-3">
                <StatCard label="Subjects" value={stats?.subjects ?? 0} />
              </div>
            </div>

            {/* Two-column main area */}
            <div className="row g-4">
              <div className="col-12 col-lg-8">
                <DueTodayPanel
                  tasks={todayTasks}
                  subjectMap={subjectMap}
                  onToggleComplete={handleToggleComplete}
                />
              </div>
              <div className="col-12 col-lg-4">
                <WeeklyProgressPanel weeklyProgress={stats?.weeklyProgress ?? []} />
                <UpcomingPanel tasks={upcomingTasks} subjectMap={subjectMap} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
