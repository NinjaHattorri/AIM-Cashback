'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function RedeemForm() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState('details'); // 'details', 'otp', 'payment', 'complete'
  const [code, setCode] = useState('');
  const [isCodeHardcoded, setIsCodeHardcoded] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [finalCashbackAmount, setFinalCashbackAmount] = useState(0);

  // Payment details state
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' or 'bank'
  const [upiId, setUpiId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');

  useEffect(() => {
    const prefilledCode = searchParams.get('code');
    if (prefilledCode) {
      setCode(prefilledCode);
      setIsCodeHardcoded(true);
    }
  }, [searchParams]);

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    setIsLoading(true);

    try {
      const validateRes = await fetch('/api/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const validateData = await validateRes.json();

      if (!validateData.success) {
        throw new Error(validateData.message);
      }
      
      setMessage('Code valid! Sending OTP...');
      const otpRes = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      });
      const otpData = await otpRes.json();

      if (otpData.success) {
        setMessage(`OTP sent to ${mobile}. Please enter it below. (Test OTP: ${otpData.otp})`);
        setIsError(false);
        setStep('otp');
      } else {
        throw new Error(otpData.message);
      }
    } catch (error) {
      setMessage(error.message);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    setIsLoading(true);

    try {
      const verifyRes = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp }),
      });
      const verifyData = await verifyRes.json();

      if (verifyData.success) {
        setMessage('OTP Verified! Please enter your payment details.');
        setIsError(false);
        setStep('payment');
      } else {
        throw new Error(verifyData.message);
      }
    } catch (error) {
      setMessage(error.message);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    setIsLoading(true);

    try {
      const paymentDetails = {
        code,
        buyerName: name,
        buyerMobile: mobile,
        paymentMethod,
        upiId: paymentMethod === 'upi' ? upiId : undefined,
        bankDetails: paymentMethod === 'bank' ? { accountNumber, ifscCode, accountHolderName } : undefined,
      };

      const redeemRes = await fetch('/api/redeem-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentDetails),
      });
      const redeemData = await redeemRes.json();

      if (redeemData.success) {
        setFinalCashbackAmount(redeemData.data.cashbackAmount);
        setMessage(`Cashback of ₹${redeemData.data.cashbackAmount} successfully redeemed!`);
        setIsError(false);
        setStep('complete');
      } else {
        throw new Error(redeemData.message);
      }
    } catch (error) {
      setMessage(error.message);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'details':
        return (
          <form onSubmit={handleDetailsSubmit} style={styles.form}>
            {isCodeHardcoded ? (
              <div style={styles.formGroup}>
                <label htmlFor="code" style={styles.label}>Cashback Code</label>
                <input 
                  type="text" 
                  id="code" 
                  value={code} 
                  required 
                  style={{...styles.input, backgroundColor: '#f4f4f4', color: '#888'}} 
                  readOnly={true}
                />
              </div>
            ) : (
                <div style={styles.noCodeWarning}>
                    <p>⚠️ No valid cashback code detected.</p>
                    <p style={{fontSize: '0.85em'}}>Please scan the QR code on your product packaging to redeem your reward.</p>
                </div>
            )}
            
            <div style={styles.formGroup}>
              <label htmlFor="name" style={styles.label}>Your Name</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required style={styles.input} placeholder="Enter your full name" />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="mobile" style={styles.label}>Mobile Number</label>
              <input type="tel" id="mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} pattern="[0-9]{10}" title="Please enter a 10-digit mobile number" required style={styles.input} placeholder="10-digit mobile number" />
            </div>
            
            <button 
                type="submit" 
                style={styles.button} 
                disabled={isLoading || !isCodeHardcoded}
            >
                {isLoading ? 'Processing...' : 'Verify Number & Get OTP'}
            </button>
          </form>
        );
      case 'otp':
        return (
          <form onSubmit={handleOtpSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label htmlFor="otp" style={styles.label}>Enter 6-Digit OTP</label>
              <input type="text" id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} required style={styles.input} placeholder="Enter OTP" maxLength="6" />
            </div>
            <button type="submit" style={styles.button} disabled={isLoading}>{isLoading ? 'Verifying...' : 'Verify OTP'}</button>
          </form>
        );
      case 'payment':
        return (
          <form onSubmit={handlePaymentSubmit} style={styles.form}>
            <h2 style={styles.subHeader}>Receive Your Cashback</h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>Select Payout Method</label>
              <div style={styles.radioGroup}>
                <label style={styles.radioLabel}>
                  <input type="radio" name="payout" value="upi" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} /> UPI ID
                </label>
                <label style={styles.radioLabel}>
                  <input type="radio" name="payout" value="bank" checked={paymentMethod === 'bank'} onChange={() => setPaymentMethod('bank')} /> Bank Account
                </label>
              </div>
            </div>
            {paymentMethod === 'upi' && (
              <div style={styles.formGroup}>
                <label htmlFor="upiId" style={styles.label}>UPI ID</label>
                <input type="text" id="upiId" value={upiId} onChange={(e) => setUpiId(e.target.value)} required style={styles.input} placeholder="username@upi" />
              </div>
            )}
            {paymentMethod === 'bank' && (
              <>
                <div style={styles.formGroup}><label htmlFor="accountNumber" style={styles.label}>Account Number</label><input type="text" id="accountNumber" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required style={styles.input} /></div>
                <div style={styles.formGroup}><label htmlFor="ifscCode" style={styles.label}>IFSC Code</label><input type="text" id="ifscCode" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} required style={styles.input} /></div>
                <div style={styles.formGroup}><label htmlFor="accountHolderName" style={styles.label}>Account Holder Name</label><input type="text" id="accountHolderName" value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value)} required style={styles.input} /></div>
              </>
            )}
            <button type="submit" style={styles.button} disabled={isLoading}>{isLoading ? 'Initiating Payout...' : 'Redeem Instant Cashback'}</button>
          </form>
        );
      case 'complete':
        return (
          <div style={styles.completionMessage}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.subHeader}>Redemption Successful!</h2>
            <p style={{color: 'var(--light-text-color)'}}>Your reward is on its way</p>
            <p style={styles.cashbackAmount}>₹{finalCashbackAmount}</p>
            <p style={{fontSize: '0.9em', margin: '20px 0'}}>The amount has been initiated to your {paymentMethod === 'upi' ? 'UPI ID' : 'Bank Account'}.</p>
            <button style={{...styles.button, backgroundColor: 'var(--secondary-color)'}} onClick={() => window.location.reload()}>Redeem Another Code</button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={styles.pageContainer}>
      <header style={styles.headerBar}>
        <div style={styles.logoContainer}>
          <span style={styles.logoTextMain}>AIM</span>
          <span style={styles.logoTextSub}>FILAMENTS</span>
        </div>
        <div style={styles.headerTagline}>CASHBACK PROGRAM</div>
      </header>

      <main style={styles.mainContent}>
        <div style={styles.formContainer}>
          <h1 style={styles.formHeader}>Claim Reward</h1>
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
          {renderStep()}
        </div>
      </main>

      <footer style={styles.footer}>
        © {new Date().getFullYear()} Aim Filaments. All Rights Reserved.
      </footer>
    </div>
  );
}

export default function RedeemPage() {
  return (
    <Suspense fallback={<div style={{textAlign: 'center', padding: '50px'}}>Loading...</div>}>
      <RedeemForm />
    </Suspense>
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
    borderBottom: '3px solid var(--primary-color)',
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
    maxWidth: '450px',
    backgroundColor: 'var(--form-background-color)',
    padding: '30px',
    borderRadius: 'var(--border-radius)',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid var(--border-color)',
  },
  formHeader: {
    textAlign: 'center',
    color: 'var(--secondary-color)',
    marginBottom: '25px',
    fontSize: '1.6em',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  subHeader: {
    textAlign: 'center',
    color: 'var(--secondary-color)',
    marginBottom: '20px',
    fontSize: '1.2em',
    fontWeight: '600',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    marginBottom: '18px',
  },
  label: {
    marginBottom: '6px',
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
    transition: 'border-color 0.2s',
    outline: 'none',
  },
  radioGroup: {
    display: 'flex',
    gap: '20px',
    marginTop: '5px',
    backgroundColor: '#f8f9fa',
    padding: '10px',
    borderRadius: 'var(--border-radius)',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '0.95em',
    fontWeight: '500',
  },
  button: {
    backgroundColor: 'var(--primary-color)',
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
    transition: 'background-color 0.2s',
  },
  message: {
    marginBottom: '20px',
    padding: '12px',
    borderRadius: 'var(--border-radius)',
    textAlign: 'center',
    fontSize: '0.9em',
    fontWeight: '500',
  },
  completionMessage: {
    textAlign: 'center',
    padding: '20px 0',
  },
  successIcon: {
    width: '60px',
    height: '60px',
    backgroundColor: 'var(--success-color)',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '30px',
    margin: '0 auto 20px',
  },
  cashbackAmount: {
    fontSize: '3.5em',
    fontWeight: '900',
    color: 'var(--secondary-color)',
    margin: '10px 0',
  },
  noCodeWarning: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '15px',
    borderRadius: 'var(--border-radius)',
    marginBottom: '20px',
    textAlign: 'center',
    border: '1px solid #ffeeba',
    fontSize: '0.9em',
    fontWeight: '500',
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
