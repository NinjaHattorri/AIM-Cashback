const CASHFREE_BASE_URL = process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION'
  ? 'https://api.cashfree.com/payout'
  : 'https://sandbox.cashfree.com/payout';

const CASHFREE_CLIENT_ID = process.env.CASHFREE_CLIENT_ID;
const CASHFREE_CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET;

/**
 * Cashfree Payouts Service (v2 API)
 */
export const CashfreeService = {
  /**
   * Send a payout via UPI or Bank Account
   * @param {Object} payoutDetails 
   * @returns {Promise<Object>}
   */
  async initiateTransfer({ transferId, amount, upiId, bankAccount, ifsc, name, phone }) {
    try {
      if (!CASHFREE_CLIENT_ID || !CASHFREE_CLIENT_SECRET) {
        throw new Error('Cashfree credentials are not configured');
      }

      const payload = {
        transfer_id: transferId,
        transfer_amount: parseFloat(amount),
        transfer_currency: 'INR',
        transfer_mode: upiId ? 'UPI' : 'IMPS', // Default to IMPS for bank accounts
        beneficiary_details: {
          beneficiary_name: name,
          beneficiary_phone: phone,
        }
      };

      if (upiId) {
        payload.beneficiary_details.beneficiary_vpa = upiId;
      } else {
        payload.beneficiary_details.beneficiary_account_number = bankAccount;
        payload.beneficiary_details.beneficiary_ifsc = ifsc;
      }

      const response = await fetch(`${CASHFREE_BASE_URL}/transfer`, {
        method: 'POST',
        headers: {
          'x-client-id': CASHFREE_CLIENT_ID,
          'x-client-secret': CASHFREE_CLIENT_SECRET,
          'Content-Type': 'application/json',
          'x-api-version': '2024-01-01' // Standard v2 versioning
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Cashfree Transfer Error:', data);
        throw new Error(data.message || 'Failed to initiate transfer');
      }

      return data;
    } catch (error) {
      console.error('Cashfree Service Error:', error);
      throw error;
    }
  },

  /**
   * Get status of a transfer
   * @param {string} transferId 
   * @returns {Promise<Object>}
   */
  async getTransferStatus(transferId) {
    try {
      const response = await fetch(`${CASHFREE_BASE_URL}/transfers/${transferId}`, {
        method: 'GET',
        headers: {
          'x-client-id': CASHFREE_CLIENT_ID,
          'x-client-secret': CASHFREE_CLIENT_SECRET,
          'Content-Type': 'application/json',
          'x-api-version': '2024-01-01'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch transfer status');
      }

      return data;
    } catch (error) {
      console.error('Cashfree Status Error:', error);
      throw error;
    }
  },

  /**
   * Get Payout wallet balance
   * @returns {Promise<Object>}
   */
  async getBalance() {
    try {
      const response = await fetch(`${CASHFREE_BASE_URL}/self/balance`, {
        method: 'GET',
        headers: {
          'x-client-id': CASHFREE_CLIENT_ID,
          'x-client-secret': CASHFREE_CLIENT_SECRET,
          'Content-Type': 'application/json',
          'x-api-version': '2024-01-01'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch balance');
      }

      return data;
    } catch (error) {
      console.error('Cashfree Balance Error:', error);
      throw error;
    }
  }
};
