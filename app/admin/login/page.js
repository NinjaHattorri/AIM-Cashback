'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Login successful! Redirecting...');
        setIsError(false);
        router.push('/admin/dashboard');
      } else {
        setMessage(`Error: ${data.message}`);
        setIsError(true);
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setMessage('An unexpected error occurred. Please try again.');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <header style={styles.headerBar}>
        <div style={styles.logoContainer}>
          <span style={styles.logoTextMain}>AIM</span>
          <span style={styles.logoTextSub}>FILAMENTS</span>
        </div>
        <div style={styles.headerTagline}>ADMIN PORTAL</div>
      </header>

      <main style={styles.mainContent}>
        <div style={styles.formContainer}>
          <h1 style={styles.formHeader}>Admin Login</h1>
          {message && (
            <p style={{ 
                ...styles.message, 
                color: isError ? 'var(--error-color)' : 'var(--success-color)',
                border: `1px solid ${isError ? 'var(--error-color)' : 'var(--success-color)'}`,
                backgroundColor: isError ? '#fff5f5' : '#f5fff5'
            }}>
              {message}
            </p>
          )}
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label htmlFor="username" style={styles.label}>Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={styles.input}
                placeholder="Enter admin username"
              />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="password" style={styles.label}>Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
                placeholder="Enter admin password"
              />
            </div>
            <button type="submit" style={styles.button} disabled={isLoading}>
              {isLoading ? 'Authenticating...' : 'Secure Login'}
            </button>
          </form>
        </div>
      </main>

      <footer style={styles.footer}>
        © {new Date().getFullYear()} Aim Filaments. All Rights Reserved.
      </footer>
    </div>
  );
}

const styles = {
  pageContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: 'var(--background-color)',
  },
  headerBar: {
    backgroundColor: '#ffffff',
    padding: '15px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '3px solid var(--secondary-color)',
    boxShadow: 'var(--shadow-sm)',
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: '1',
  },
  logoTextMain: {
    fontSize: '24px',
    fontWeight: '900',
    color: 'var(--secondary-color)',
    letterSpacing: '1px',
  },
  logoTextSub: {
    fontSize: '10px',
    fontWeight: '700',
    color: 'var(--primary-color)',
    letterSpacing: '3px',
  },
  headerTagline: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--light-text-color)',
    borderLeft: '1px solid #ddd',
    paddingLeft: '15px',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  formContainer: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: 'var(--border-radius)',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid var(--border-color)',
  },
  formHeader: {
    textAlign: 'center',
    color: 'var(--secondary-color)',
    marginBottom: '30px',
    fontSize: '1.8em',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    marginBottom: '8px',
    display: 'block',
    color: 'var(--secondary-color)',
    fontWeight: '600',
    fontSize: '0.9em',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ced4da',
    borderRadius: 'var(--border-radius)',
    fontSize: '16px',
    outline: 'none',
  },
  button: {
    backgroundColor: 'var(--secondary-color)',
    color: 'white',
    padding: '14px',
    border: 'none',
    borderRadius: 'var(--border-radius)',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '700',
    marginTop: '10px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  message: {
    marginBottom: '20px',
    padding: '12px',
    borderRadius: 'var(--border-radius)',
    textAlign: 'center',
    fontSize: '0.9em',
  },
  footer: {
    textAlign: 'center',
    padding: '20px',
    fontSize: '12px',
    color: 'var(--light-text-color)',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #eee',
  }
};
