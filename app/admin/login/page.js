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
      <div style={styles.formContainer}>
        <h1 style={styles.header}>Admin Panel Login</h1>
        {message && (
          <p style={{ ...styles.message, color: isError ? 'var(--error-color)' : 'var(--success-color)' }}>
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
            />
          </div>
          <button type="submit" style={styles.button} disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  pageContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
    backgroundColor: 'var(--background-color)',
  },
  formContainer: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: 'var(--form-background-color)',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
  },
  header: {
    textAlign: 'center',
    color: 'var(--text-color)',
    marginBottom: '30px',
    fontSize: '1.8em',
    fontWeight: '600',
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
    color: 'var(--light-text-color)',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    boxSizing: 'border-box',
    fontSize: '16px',
  },
  button: {
    backgroundColor: 'var(--error-color)', // Admin panel uses red theme
    color: 'white',
    padding: '12px 15px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    marginTop: '10px',
  },
  message: {
    marginTop: '-10px',
    marginBottom: '20px',
    padding: '10px',
    borderRadius: '8px',
    textAlign: 'center',
    fontSize: '0.9em',
  },
};

