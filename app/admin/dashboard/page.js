'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalCodesGenerated: 0,
    totalCodesRedeemed: 0,
    totalCashbackPaid: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const navigateTo = (path) => {
    router.push(path);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Failed to logout:', error);
      alert('Logout failed. Please try again.');
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.headerBar}>
        <h1 style={styles.header}>Admin Dashboard</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
      </div>
      
      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Total Codes Generated</h3>
          <p style={styles.statValue}>{isLoading ? '...' : stats.totalCodesGenerated}</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Total Codes Redeemed</h3>
          <p style={styles.statValue}>{isLoading ? '...' : stats.totalCodesRedeemed}</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Total Cashback Paid</h3>
          <p style={styles.statValue}>{isLoading ? '...' : `₹${stats.totalCashbackPaid.toFixed(2)}`}</p>
        </div>
      </div>
      
      <div style={styles.menu}>
        <h2 style={styles.menuTitle}>Management Tools</h2>
        <div style={styles.menuGrid}>
          <button onClick={() => navigateTo('/admin/bulk-generate')} style={styles.menuButton}>
            Manage Codes
          </button>
          <button onClick={() => navigateTo('/admin/redemptions')} style={styles.menuButton}>
            View Redemptions
          </button>
          <button onClick={() => navigateTo('/admin/codes')} style={styles.menuButton}>
            View All Codes
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageContainer: {
    fontFamily: 'var(--font-family, Arial, sans-serif)',
    padding: '20px',
    maxWidth: '1000px',
    margin: '20px auto',
    color: 'var(--text-color, #333)',
  },
  headerBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-color, #eee)',
    paddingBottom: '15px',
    marginBottom: '30px',
  },
  header: {
    color: 'var(--text-color, #333)',
    margin: 0,
    fontSize: '1.8em',
  },
  logoutButton: {
    backgroundColor: '#6c757d',
    color: 'white',
    padding: '10px 18px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  statCard: {
    backgroundColor: 'var(--form-background-color, #fff)',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    textAlign: 'center',
  },
  statTitle: {
    margin: '0 0 10px 0',
    color: 'var(--light-text-color, #666)',
    fontSize: '1em',
    fontWeight: '500',
  },
  statValue: {
    margin: 0,
    color: 'var(--error-color, #dc3545)',
    fontSize: '2.2em',
    fontWeight: '700',
  },
  menu: {
    backgroundColor: 'var(--form-background-color, #fff)',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  },
  menuTitle: {
    textAlign: 'center',
    marginBottom: '25px',
    fontSize: '1.5em',
  },
  menuGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  menuButton: {
    backgroundColor: '#f8f9fa',
    color: 'var(--text-color, #333)',
    padding: '25px',
    border: '1px solid var(--border-color, #ddd)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    textAlign: 'center',
    transition: 'transform 0.2s, box-shadow 0.2s',
  }
};
