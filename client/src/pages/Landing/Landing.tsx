import { Link } from 'react-router-dom';
import { Navbar } from '../../components/Navbar/Navbar';
import styles from './Landing.module.scss';

const FEATURES = [
  {
    label: 'Secure Login',
    description: 'Sign up, log in, and keep your tasks private.',
    initial: 'SL',
  },
  {
    label: 'Task Manager',
    description: 'Add, edit, and organize tasks by subject.',
    initial: 'TM',
  },
  {
    label: 'PWA Ready',
    description: 'Install on your phone and use offline.',
    initial: 'PW',
  },
  {
    label: 'Dashboard',
    description: "See today's tasks and your weekly progress.",
    initial: 'DB',
  },
];

export function Landing() {
  return (
    <div>
      <Navbar variant="public" />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroLogoPlaceholder} aria-hidden="true">
          SP
        </div>
        <h1 className={styles.heroTitle}>StudyPartner</h1>
        <p className={styles.heroSubtitle}>
          Your personal study &amp; task manager — stay on top of every deadline.
        </p>
        <div className={styles.ctaRow}>
          <Link to="/signup" className="btn btn-dark">
            Get Started
          </Link>
          <Link to="/login" className="btn btn-outline-secondary">
            Login
          </Link>
        </div>
      </section>

      {/* Feature strip */}
      <section className={styles.featureStrip} id="features">
        <div className="container">
          <div className={styles.featureGrid}>
            {FEATURES.map((f) => (
              <div key={f.label} className={styles.featureCard}>
                <div className={styles.featureIconPlaceholder} aria-hidden="true">
                  {f.initial}
                </div>
                <div className={styles.featureLabel}>{f.label}</div>
                <p className={styles.featureDesc}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About section */}
      <section className={styles.aboutSection} id="about">
        <div className="container">
          <div className={styles.aboutGrid}>
            <div>
              <div className={styles.aboutSectionLabel}>About StudyPartner</div>
              <h2 className={styles.aboutTitle}>Built for students, by students.</h2>
              <p className={styles.aboutText}>
                StudyPartner helps you keep all your assignments, deadlines, and notes in one
                place. No more sticky notes, no more forgotten due dates.
              </p>
              <div className="mt-3">
                <Link to="/signup" className="btn btn-dark">
                  Create Free Account
                </Link>
              </div>
            </div>
            <img
              src="/img.png"
              alt="StudyPartner app screenshot"
              className={styles.aboutImg}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          &copy; 2026 StudyPartner &nbsp;&middot;&nbsp; Privacy &nbsp;&middot;&nbsp; Terms
          &nbsp;&middot;&nbsp; Contact
        </div>
      </footer>
    </div>
  );
}
