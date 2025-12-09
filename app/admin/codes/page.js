'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminCodesPage() {
  const [codes, setCodes] = useState([]);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const response = await fetch('/api/admin/codes');
        const data = await response.json();

        if (data.success) {
          setCodes(data.data);
        } else {
          setMessage(`Error: ${data.message}`);
          setIsError(true);
        }
      } catch (error) {
        console.error('Failed to fetch codes:', error);
        setMessage('An unexpected error occurred while fetching codes.');
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCodes();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusChip = (status) => {
    const style = {
      ...styles.statusChip,
      backgroundColor: status === 'redeemed' ? 'var(--success-color)' : (status === 'expired' ? 'var(--error-color)' : '#6c757d'),
    };
    return <span style={style}>{status}</span>;
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.headerBar}>
        <button onClick={() => router.back()} style={styles.backButton}>&larr; Back to Dashboard</button>
        <h1 style={styles.header}>All Cashback Codes</h1>
      </div>
      
      {message && (
        <p style={{ ...styles.message, color: isError ? 'var(--error-color)' : 'var(--success-color)' }}>
          {message}
        </p>
      )}

      <div style={styles.tableContainer}>
        {isLoading ? (
          <p style={styles.loading}>Loading codes...</p>
        ) : codes.length === 0 ? (
          <p style={styles.noData}>No codes generated yet.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Code</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Cashback Amount</th>
                <th style={styles.th}>Generated At</th>
                <th style={styles.th}>Expires At</th>
                <th style={styles.th}>Redeemed At</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((codeItem) => (
                <tr key={codeItem._id}>
                  <td style={styles.td}>{codeItem.code}</td>
                  <td style={styles.td}>{getStatusChip(codeItem.status)}</td>
                  <td style={styles.td}>{codeItem.cashbackAmount > 0 ? `₹${codeItem.cashbackAmount}` : 'N/A'}</td>
                  <td style={styles.td}>{formatDate(codeItem.generatedAt)}</td>
                  <td style={styles.td}>{formatDate(codeItem.expiresAt)}</td>
                  <td style={styles.td}>{formatDate(codeItem.redeemedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles = {
  pageContainer: {
    fontFamily: 'var(--font-family, Arial, sans-serif)',
    padding: '20px',
    maxWidth: '1200px',
    margin: '20px auto',
  },
  headerBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    borderBottom: '1px solid var(--border-color, #eee)',
    paddingBottom: '15px',
    marginBottom: '30px',
  },
  header: {
    color: 'var(--text-color, #333)',
    margin: 0,
    fontSize: '1.8em',
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: 'var(--primary-color, #007bff)',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
  },
  message: {
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center',
    marginBottom: '20px',
  },
  loading: {
    textAlign: 'center',
    fontSize: '1.1em',
    color: 'var(--light-text-color, #666)',
  },
  noData: {
    textAlign: 'center',
    fontSize: '1.1em',
    color: '#888',
    padding: '40px',
    backgroundColor: 'var(--form-background-color, #fff)',
    borderRadius: '12px',
  },
  tableContainer: {
    overflowX: 'auto',
    backgroundColor: 'var(--form-background-color, #fff)',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    padding: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    borderBottom: '2px solid var(--border-color, #ddd)',
    padding: '12px 15px',
    textAlign: 'left',
    fontWeight: '600',
    color: 'var(--light-text-color, #666)',
  },
  td: {
    borderBottom: '1px solid var(--border-color, #ddd)',
    padding: '12px 15px',
    textAlign: 'left',
  },
  statusChip: {
    padding: '4px 10px',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '0.8em',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
};

