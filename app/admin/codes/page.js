'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';

function QRModal({ code, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (code) {
      const redemptionUrl = `${window.location.origin}/redeem?code=${code}`;
      QRCode.toDataURL(redemptionUrl, { width: 300, margin: 2 })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error(err));
    }
  }, [code]);

  if (!code) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 style={{color: 'var(--secondary-color)', marginBottom: '15px'}}>{code}</h2>
        {qrDataUrl ? (
          <img src={qrDataUrl} alt={`QR for ${code}`} style={{width: '250px', height: '250px', border: '1px solid #eee'}} />
        ) : (
          <p>Generating QR...</p>
        )}
        <div style={{marginTop: '25px'}}>
          <button onClick={onClose} style={{...styles.cancelButton, width: '100%'}}>Close Preview</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCodesPage() {
  const [codes, setCodes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ status: '', cashbackAmount: 0, expiresAt: '' });
  const [viewingQrCode, setViewingQrCode] = useState(null);
  
  const router = useRouter();

  const fetchCodes = async (query = '', status = 'all') => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/codes?q=${query}&status=${status}`);
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

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCodes(searchQuery, statusFilter);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, statusFilter]);

  const handleEditClick = (codeItem) => {
    setEditingId(codeItem._id);
    setEditForm({
      status: codeItem.status,
      cashbackAmount: codeItem.cashbackAmount || 0,
      expiresAt: codeItem.expiresAt ? new Date(codeItem.expiresAt).toISOString().split('T')[0] : ''
    });
  };

  const handleSaveEdit = async (id) => {
    try {
      const response = await fetch('/api/admin/codes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editForm }),
      });
      const data = await response.json();

      if (data.success) {
        setMessage('Code updated successfully!');
        setIsError(false);
        setEditingId(null);
        fetchCodes(searchQuery);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setMessage(`Update failed: ${error.message}`);
      setIsError(true);
    }
  };

  const handleDeleteCode = async (id) => {
    if (!window.confirm('Are you sure you want to delete this code? Users scanning its QR will get an "Invalid Code" message.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/codes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();

      if (data.success) {
        setMessage('Code deleted successfully!');
        setIsError(false);
        fetchCodes(searchQuery);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setMessage(`Delete failed: ${error.message}`);
      setIsError(true);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusChip = (status) => {
    const style = {
      ...styles.statusChip,
      backgroundColor: status === 'redeemed' ? 'var(--success-color)' : (status === 'expired' ? 'var(--error-color)' : 'var(--secondary-color)'),
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
        <h1 style={styles.pageTitle}>Code Inventory</h1>

        <div style={styles.searchContainer}>
          <div style={{display: 'flex', gap: '15px'}}>
            <input
                type="text"
                placeholder="🔍 Search codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{...styles.searchInput, flex: 2, marginBottom: 0}}
            />
            <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)} 
                style={{...styles.searchInput, flex: 1, marginBottom: 0}}
            >
                <option value="all">All Statuses</option>
                <option value="generated">Generated</option>
                <option value="redeemed">Redeemed</option>
                <option value="expired">Expired</option>
            </select>
          </div>
        </div>
        
        {message && (
          <p style={{ 
            ...styles.message, 
            color: isError ? 'var(--error-color)' : 'var(--success-color)',
            backgroundColor: isError ? '#fff5f5' : '#f5fff5',
            border: `1px solid ${isError ? 'var(--error-color)' : 'var(--success-color)'}`
          }}>
            {message}
          </p>
        )}

        <div style={styles.tableContainer}>
          {isLoading ? (
            <p style={styles.loading}>Synchronizing database...</p>
          ) : codes.length === 0 ? (
            <p style={styles.noData}>No records match your search criteria.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Unique Code</th>
                  <th style={styles.th}>Current Status</th>
                  <th style={styles.th}>Value</th>
                  <th style={styles.th}>Expiry</th>
                  <th style={styles.th}>Control</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((codeItem) => (
                  <tr key={codeItem._id}>
                    <td style={styles.td}><strong>{codeItem.code}</strong></td>
                    <td style={styles.td}>
                      {editingId === codeItem._id ? (
                        <select 
                          value={editForm.status} 
                          onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                          style={styles.editInput}
                        >
                          <option value="generated">generated</option>
                          <option value="pending_redemption">pending_redemption</option>
                          <option value="redeemed">redeemed</option>
                          <option value="expired">expired</option>
                        </select>
                      ) : (
                        getStatusChip(codeItem.status)
                      )}
                    </td>
                    <td style={styles.td}>
                      {editingId === codeItem._id ? (
                        <input 
                          type="number" 
                          value={editForm.cashbackAmount} 
                          onChange={(e) => setEditForm({...editForm, cashbackAmount: e.target.value})}
                          style={styles.editInput}
                        />
                      ) : (
                        codeItem.cashbackAmount > 0 ? `₹${codeItem.cashbackAmount}` : '—'
                      )}
                    </td>
                    <td style={styles.td}>
                      {editingId === codeItem._id ? (
                        <input 
                          type="date" 
                          value={editForm.expiresAt} 
                          onChange={(e) => setEditForm({...editForm, expiresAt: e.target.value})}
                          style={styles.editInput}
                        />
                      ) : (
                        formatDate(codeItem.expiresAt)
                      )}
                    </td>
                    <td style={styles.td}>
                      {editingId === codeItem._id ? (
                        <div style={styles.actionButtons}>
                          <button onClick={() => handleSaveEdit(codeItem._id)} style={styles.saveButton}>Save</button>
                          <button onClick={() => setEditingId(null)} style={styles.cancelButton}>Cancel</button>
                        </div>
                      ) : (
                        <div style={styles.actionButtons}>
                          <button onClick={() => setViewingQrCode(codeItem.code)} style={styles.viewQrButton}>QR</button>
                          <button onClick={() => handleEditClick(codeItem)} style={styles.editButton}>Edit</button>
                          <button onClick={() => handleDeleteCode(codeItem._id)} style={styles.deleteButton}>Del</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      <QRModal code={viewingQrCode} onClose={() => setViewingQrCode(null)} />
      
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
    fontWeight: '500',
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
    fontSize: '0.95em',
  },
  statusChip: {
    padding: '4px 10px',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '0.75em',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  viewQrButton: {
    backgroundColor: 'var(--success-color)',
    color: 'white',
    border: 'none',
    padding: '6px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '5px',
    fontSize: '0.8em',
    fontWeight: '700',
  },
  editButton: {
    backgroundColor: 'var(--primary-color)',
    color: 'white',
    border: 'none',
    padding: '6px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '5px',
    fontSize: '0.8em',
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: '#666',
    color: 'white',
    border: 'none',
    padding: '6px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8em',
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: 'var(--success-color)',
    color: 'white',
    border: 'none',
    padding: '6px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '5px',
    fontSize: '0.8em',
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '6px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8em',
    fontWeight: '700',
  },
  actionButtons: {
    display: 'flex',
  },
  editInput: {
    padding: '6px',
    borderRadius: '4px',
    border: '1px solid #ced4da',
    width: '100%',
    fontSize: '0.9em',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(43, 49, 55, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: 'var(--border-radius)',
    textAlign: 'center',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
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
