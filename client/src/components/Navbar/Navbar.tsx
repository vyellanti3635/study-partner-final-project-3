import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import styles from './Navbar.module.scss';

type Props = {
  variant?: 'public' | 'auth';
};

export function Navbar({ variant }: Props) {
  const auth = useAuth();
  const isAuth = variant === 'auth' || auth.status === 'authenticated';

  const handleLogout = async () => {
    try {
      await auth.logout();
    } catch {
      // logout errors are non-critical — session is cleared client-side
    }
  };

  return (
    <nav className={`navbar navbar-expand-md navbar-light ${styles.navbar}`}>
      <div className="container">
        <Link to="/" className={styles.brand}>
          StudyPartner
        </Link>

        {/* Hamburger toggle for mobile */}
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav ms-auto align-items-center gap-1">
            {isAuth ? (
              <>
                <li className="nav-item">
                  <NavLink
                    to="/app/dashboard"
                    className={({ isActive }) =>
                      `${styles.navLink}${isActive ? ` ${styles.active}` : ''}`
                    }
                  >
                    Dashboard
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/app/tasks"
                    className={({ isActive }) =>
                      `${styles.navLink}${isActive ? ` ${styles.active}` : ''}`
                    }
                  >
                    My Tasks
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/app/profile"
                    className={({ isActive }) =>
                      `${styles.navLink}${isActive ? ` ${styles.active}` : ''}`
                    }
                  >
                    Profile
                  </NavLink>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    className={styles.logoutBtn}
                    onClick={() => void handleLogout()}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                      `${styles.navLink}${isActive ? ` ${styles.active}` : ''}`
                    }
                  >
                    Home
                  </NavLink>
                </li>
                <li className="nav-item">
                  <a href="#features" className={styles.navLink}>
                    Features
                  </a>
                </li>
                <li className="nav-item">
                  <a href="#about" className={styles.navLink}>
                    About
                  </a>
                </li>
                <li className="nav-item ms-2">
                  <Link to="/login" className={styles.btnOutline}>
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/signup" className={styles.btnFill}>
                    Sign Up
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
