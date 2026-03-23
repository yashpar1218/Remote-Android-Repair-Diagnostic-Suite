import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { CreditCard, Landmark, Loader2, ArrowLeft } from 'lucide-react';

const API_URL = 'http://localhost:5000';

export default function PaymentPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [method, setMethod] = useState('card');
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '' });
  const [bank, setBank] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axios.get(`${API_URL}/api/tickets/${ticketId}`);
        setTicket(response.data);
      } catch (err) {
        console.error('Error fetching ticket:', err);
        setError(err.response?.data?.error || 'Failed to load ticket');
      } finally {
        setLoading(false);
      }
    };
    if (ticketId) fetchTicket();
  }, [ticketId]);

  const payableAmount = ticket?.amount ?? '-';
  const isPaymentPending = ticket?.status === 'PAYMENT_PENDING';

  const handlePay = async (e) => {
    e.preventDefault();
    if (!isPaymentPending) {
      alert('Payment is not available for this ticket.');
      return;
    }
    if (method === 'card' && (!card.number || !card.expiry || !card.cvv)) {
      alert('Please complete card details.');
      return;
    }
    if (method === 'netbanking' && !bank) {
      alert('Please select a bank.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axios.post(`${API_URL}/api/payments`, {
        ticket_id: ticket?.ticket_id,
        payment_method: method,
        amount: ticket?.amount
      });
      alert(response.data?.message || 'Payment completed');
      navigate('/customer/tickets');
    } catch (err) {
      console.error('Payment failed:', err);
      alert(err.response?.data?.error || 'Payment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-400" size={32} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/customer/tickets')} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Payment</h1>
          <p className="text-slate-400">Ticket {ticketId}</p>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">{error}</div>}

      <div className="form-card mb-6">
        <p className="text-slate-400 text-sm">Payable Amount</p>
        <p className="text-2xl font-bold text-white">INR {payableAmount}</p>
        {!isPaymentPending && (
          <p className="text-sm text-amber-300 mt-2">This ticket is not ready for payment.</p>
        )}
      </div>

      <form onSubmit={handlePay} className="form-card">
        <h2 className="text-lg font-semibold text-white mb-4">Payment Method</h2>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <label className={`flex items-center gap-3 p-4 rounded-lg border ${method === 'card' ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700'} cursor-pointer`}>
            <input type="radio" name="method" value="card" checked={method === 'card'} onChange={() => setMethod('card')} />
            <CreditCard size={18} className="text-blue-400" />
            <span className="text-white">Card</span>
          </label>
          <label className={`flex items-center gap-3 p-4 rounded-lg border ${method === 'netbanking' ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700'} cursor-pointer`}>
            <input type="radio" name="method" value="netbanking" checked={method === 'netbanking'} onChange={() => setMethod('netbanking')} />
            <Landmark size={18} className="text-blue-400" />
            <span className="text-white">Net Banking</span>
          </label>
        </div>

        {method === 'card' && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="form-label">Card Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="1234 5678 9012 3456"
                value={card.number}
                onChange={(e) => setCard({ ...card, number: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Expiry</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="MM/YY"
                  value={card.expiry}
                  onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">CVV</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="***"
                  value={card.cvv}
                  onChange={(e) => setCard({ ...card, cvv: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {method === 'netbanking' && (
          <div className="mb-6">
            <label className="form-label">Select Bank</label>
            <select className="form-input" value={bank} onChange={(e) => setBank(e.target.value)}>
              <option value="">Choose bank</option>
              <option value="HDFC">HDFC</option>
              <option value="ICICI">ICICI</option>
              <option value="SBI">SBI</option>
              <option value="AXIS">Axis</option>
            </select>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isPaymentPending || isSubmitting}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-white"
          >
            {isSubmitting ? 'Processing...' : 'Pay'}
          </button>
        </div>
      </form>
    </div>
  );
}


