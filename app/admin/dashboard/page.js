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
      <header style={styles.headerBar}>
        <div style={{...styles.logoContainer, cursor: 'pointer'}} onClick={() => navigateTo('/admin/dashboard')}>
          <img src="/Aim_LOGO.jpg" alt="AIM Filaments" style={styles.logoImage} />
        </div>
        <div style={styles.headerActions}>
          <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
        </div>
      </header>
      
      <main style={styles.mainContent}>
        <div style={styles.welcomeSection}>
          <h1 style={styles.welcomeTitle}>Dashboard Overview</h1>
          <p style={styles.welcomeSubtitle}>Performance and Management Control Panel</p>
        </div>

        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h3 style={styles.statTitle}>Generated Codes</h3>
            <p style={styles.statValue}>{isLoading ? '...' : stats.totalCodesGenerated}</p>
            <div style={{...styles.statIndicator, backgroundColor: 'var(--secondary-color)'}}></div>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statTitle}>Redeemed Codes</h3>
            <p style={styles.statValue}>{isLoading ? '...' : stats.totalCodesRedeemed}</p>
            <div style={{...styles.statIndicator, backgroundColor: 'var(--success-color)'}}></div>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statTitle}>Cashback Disbursed</h3>
            <p style={{...styles.statValue, color: 'var(--primary-color)'}}>
                {isLoading ? '...' : `₹${stats.totalCashbackPaid.toFixed(0)}`}
            </p>
            <div style={{...styles.statIndicator, backgroundColor: 'var(--primary-color)'}}></div>
          </div>
        </div>
        
        <div style={styles.menuSection}>
          <h2 style={styles.sectionTitle}>System Management</h2>
          <div style={styles.menuGrid}>
            <button onClick={() => navigateTo('/admin/bulk-generate')} style={styles.menuButton}>
              <div style={styles.buttonIcon}>➕</div>
              <div style={styles.buttonText}>
                <strong>Batch Generation</strong>
                <span>Create new QR batches</span>
              </div>
            </button>
            <button onClick={() => navigateTo('/admin/codes')} style={styles.menuButton}>
              <div style={styles.buttonIcon}>📋</div>
              <div style={styles.buttonText}>
                <strong>Inventory</strong>
                <span>Manage existing codes</span>
              </div>
            </button>
            <button onClick={() => navigateTo('/admin/redemptions')} style={styles.menuButton}>
              <div style={styles.buttonIcon}>💰</div>
              <div style={styles.buttonText}>
                <strong>Payouts</strong>
                <span>Track successful claims</span>
              </div>
            </button>
          </div>
        </div>
      </main>

      <footer style={styles.footer}>
        © {new Date().getFullYear()} Aim Filaments. Internal Admin System.
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
    padding: '10px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '3px solid var(--primary-color)',
    boxShadow: 'var(--shadow-sm)',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  logoImage: {
    height: '45px',
    width: 'auto',
    objectFit: 'contain',
  },
  logoutButton: {
    backgroundColor: 'var(--secondary-color)',
    color: 'white',
    padding: '8px 20px',
    border: 'none',
    borderRadius: 'var(--border-radius)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  mainContent: {
    flex: 1,
    padding: '40px auto',
    maxWidth: '1100px',
    width: '100%',
    margin: '40px auto',
  },
  welcomeSection: {
    marginBottom: '40px',
    textAlign: 'center',
  },
  welcomeTitle: {
    fontSize: '2.2em',
    fontWeight: '800',
    color: 'var(--secondary-color)',
    margin: 0,
    textTransform: 'uppercase',
  },
  welcomeSubtitle: {
    color: 'var(--light-text-color)',
    fontSize: '1.1em',
    marginTop: '5px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '25px',
    marginBottom: '50px',
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: 'var(--border-radius)',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid var(--border-color)',
    position: 'relative',
    overflow: 'hidden',
  },
  statIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '4px',
  },
  statTitle: {
    margin: '0 0 10px 0',
    color: 'var(--light-text-color)',
    fontSize: '0.9em',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  statValue: {
    margin: 0,
    color: 'var(--secondary-color)',
    fontSize: '3em',
    fontWeight: '900',
  },
  menuSection: {
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: 'var(--border-radius)',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid var(--border-color)',
  },
  sectionTitle: {
    marginBottom: '30px',
    fontSize: '1.4em',
    fontWeight: '700',
    color: 'var(--secondary-color)',
    textTransform: 'uppercase',
    borderLeft: '5px solid var(--primary-color)',
    paddingLeft: '15px',
  },
  menuGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
  },
  menuButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '25px',
    backgroundColor: '#f8f9fa',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s',
    gap: '20px',
  },
  buttonIcon: {
    fontSize: '2em',
    backgroundColor: '#ffffff',
    width: '60px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    boxShadow: 'var(--shadow-sm)',
  },
  buttonText: {
    display: 'flex',
    flexDirection: 'column',
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
