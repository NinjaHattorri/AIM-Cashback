'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRedemptionsPage() {
  const [redemptions, setRedemptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchRedemptions = async (query = '', status = 'all') => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/redemptions?q=${query}&status=${status}`);
      const data = await response.json();

      if (data.success) {
        setRedemptions(data.data);
      } else {
        setMessage(`Error: ${data.message}`);
        setIsError(true);
      }
    } catch (error) {
      console.error('Failed to fetch redemptions:', error);
      setMessage('An unexpected error occurred while fetching redemptions.');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchRedemptions(searchQuery, statusFilter);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, statusFilter]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getPaymentInfo = (redemption) => {
    if (redemption.upiId) {
      return `UPI: ${redemption.upiId}`;
    }
    if (redemption.bankDetails && redemption.bankDetails.accountNumber) {
      return `A/C: ${redemption.bankDetails.accountNumber}`;
    }
    return 'N/A';
  };

  const getStatusChip = (status) => {
    const style = {
      ...styles.statusChip,
      backgroundColor: status === 'completed' ? 'var(--success-color)' : (status === 'failed' ? 'var(--error-color)' : 'var(--secondary-color)'),
    };
    return <span style={style}>{status}</span>;
  };

  return (
    <div style={styles.pageContainer}>
      <header style={styles.headerBar}>
        <div style={{...styles.logoContainer, cursor: 'pointer'}} onClick={() => router.push('/admin/dashboard')}>
          <img src="/Aim_LOGO.jpg" alt="AIM Filaments" style={styles.logoImage} />
        </div>
        <button onClick={() => router.push('/admin/dashboard')} style={styles.backButton}>Dashboard</button>
      </header>

      <main style={styles.mainContent}>
        <h1 style={styles.pageTitle}>Redemption Logs</h1>

        <div style={styles.searchContainer}>
          <div style={{display: 'flex', gap: '15px'}}>
            <input
                type="text"
                placeholder="🔍 Search redemptions (Name, Mobile, or Code)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{...styles.searchInput, flex: 2, marginBottom: 0}}
            />
            <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)} 
                style={{...styles.searchInput, flex: 1, marginBottom: 0}}
            >
                <option value="all">All Payout Status</option>
                <option value="initiated">Initiated</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
            </select>
          </div>
        </div>
        
        {message && (
          <p style={{ ...styles.message, color: isError ? 'var(--error-color)' : 'var(--success-color)' }}>
            {message}
          </p>
        )}

        <div style={styles.tableContainer}>
          {isLoading ? (
            <p style={styles.loading}>Retrieving redemption history...</p>
          ) : redemptions.length === 0 ? (
            <p style={styles.noData}>No redemptions found matching your search.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Timestamp</th>
                  <th style={styles.th}>Code</th>
                  <th style={styles.th}>Payout</th>
                  <th style={styles.th}>Recipient</th>
                  <th style={styles.th}>Payment Details</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {redemptions.map((redemption) => (
                  <tr key={redemption._id}>
                    <td style={styles.td}>{formatDate(redemption.redeemedAt)}</td>
                    <td style={styles.td}><strong>{redemption.codeId ? redemption.codeId.code : 'DELETED'}</strong></td>
                    <td style={styles.td}>₹{redemption.cashbackAmount}</td>
                    <td style={styles.td}>
                        <div style={{fontWeight: '600'}}>{redemption.buyerName}</div>
                        <div style={{fontSize: '0.85em', color: 'var(--light-text-color)'}}>{redemption.buyerMobile}</div>
                    </td>
                    <td style={styles.td}>{getPaymentInfo(redemption)}</td>
                    <td style={styles.td}>{getStatusChip(redemption.payoutStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
  backButton: {
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
    padding: '40px 20px',
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
  },
  pageTitle: {
    fontSize: '2em',
    fontWeight: '800',
    color: 'var(--secondary-color)',
    marginBottom: '30px',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  searchContainer: {
    marginBottom: '25px',
  },
  searchInput: {
    width: '100%',
    padding: '14px 20px',
    borderRadius: 'var(--border-radius)',
    border: '1px solid #ced4da',
    fontSize: '16px',
    boxShadow: 'var(--shadow-sm)',
    outline: 'none',
  },
  message: {
    padding: '15px',
    borderRadius: 'var(--border-radius)',
    textAlign: 'center',
    marginBottom: '25px',
  },
  loading: {
    textAlign: 'center',
    fontSize: '1.1em',
    color: 'var(--light-text-color)',
    padding: '40px',
  },
  noData: {
    textAlign: 'center',
    fontSize: '1.1em',
    color: '#888',
    padding: '60px',
    backgroundColor: '#fff',
    borderRadius: 'var(--border-radius)',
    border: '1px solid var(--border-color)',
  },
  tableContainer: {
    overflowX: 'auto',
    backgroundColor: '#ffffff',
    borderRadius: 'var(--border-radius)',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid var(--border-color)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    borderBottom: '2px solid #eee',
    padding: '15px 20px',
    textAlign: 'left',
    fontWeight: '700',
    color: 'var(--secondary-color)',
    textTransform: 'uppercase',
    fontSize: '0.85em',
    backgroundColor: '#fcfcfc',
  },
  td: {
    borderBottom: '1px solid #eee',
    padding: '15px 20px',
    textAlign: 'left',
    fontSize: '0.9em',
  },
  statusChip: {
    padding: '4px 10px',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '0.75em',
    fontWeight: '700',
    textTransform: 'uppercase',
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
