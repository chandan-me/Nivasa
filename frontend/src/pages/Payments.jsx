import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { paymentService } from '../services/paymentService';
import { CreditCard, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

const Payments = () => {
  const { user } = useAuth();
  
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({ total_due: 0.0, total_paid: 0.0, total_overdue: 0.0 });
  const [loading, setLoading] = useState(true);
  
  // Checkout modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const fetchPaymentsData = async () => {
    try {
      const [payList, sumData] = await Promise.all([
        paymentService.getPayments(),
        paymentService.getSummary()
      ]);
      setPayments(payList);
      setSummary(sumData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsData();
  }, []);

  const handlePay = async (e) => {
    e.preventDefault();
    setCheckoutLoading(true);

    try {
      // Mock gateway delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const reference = 'MOCK-TXN-' + Math.floor(Math.random() * 9000000 + 1000000);
      await paymentService.checkout(selectedInvoice.id, 'SUCCESSFUL', reference);
      
      setCheckoutSuccess(true);
      setTimeout(() => {
        setCheckoutSuccess(false);
        setSelectedInvoice(null);
        // Reset form
        setCardNumber('');
        setCardExpiry('');
        setCardCvv('');
        setCardHolder('');
        fetchPaymentsData();
      }, 2000);
      
    } catch (err) {
      alert('Mock payment checkout failed. Please retry.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESSFUL':
        return <span className="bg-green-50 text-green-700 text-[10px] px-2.5 py-0.5 rounded-full font-bold">Paid</span>;
      case 'PENDING':
        return <span className="bg-yellow-50 text-yellow-700 text-[10px] px-2.5 py-0.5 rounded-full font-bold">Pending</span>;
      case 'OVERDUE':
        return <span className="bg-red-50 text-red-700 text-[10px] px-2.5 py-0.5 rounded-full font-bold">Overdue</span>;
      default:
        return <span className="bg-gray-50 text-gray-500 text-[10px] px-2.5 py-0.5 rounded-full font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-800">Billing & Invoices</h2>
        <p className="text-sm text-gray-400">Review outstanding society dues and pay bills instantly using our secure mock checkout.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Due Dues</span>
            <h3 className="text-2xl font-black text-gray-800">${summary.total_due.toFixed(2)}</h3>
            <p className="text-[10px] text-gray-400">Awaiting your checkout</p>
          </div>
          <div className="w-11 h-11 bg-yellow-50 text-yellow-600 rounded-lg flex items-center justify-center">
            <CreditCard size={20} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Paid This Month</span>
            <h3 className="text-2xl font-black text-gray-800">${summary.total_paid.toFixed(2)}</h3>
            <p className="text-[10px] text-gray-400">Clear invoices archive</p>
          </div>
          <div className="w-11 h-11 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Overdue Dues</span>
            <h3 className="text-2xl font-black text-red-600">${summary.total_overdue.toFixed(2)}</h3>
            <p className="text-[10px] text-red-400">Past grace period</p>
          </div>
          <div className="w-11 h-11 bg-red-50 text-red-500 rounded-lg flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-xs text-gray-400">Loading invoice statements...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm text-gray-400 text-xs font-semibold">
          No billing invoices raised for your unit.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden text-left">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-4">Billing Item</th>
                <th className="px-6 py-4">Charge Category</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action / Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-bold text-gray-800">{p.title}</td>
                  <td className="px-6 py-4 text-gray-500 text-[10px] tracking-wider font-bold uppercase">{p.charge_type}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(p.due_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-gray-800 font-extrabold">${parseFloat(p.amount).toFixed(2)}</td>
                  <td className="px-6 py-4">{getStatusBadge(p.status)}</td>
                  <td className="px-6 py-4">
                    {p.status === 'SUCCESSFUL' ? (
                      <div className="text-[10px] text-gray-400 font-semibold space-y-0.5">
                        <p>Ref: <span className="text-gray-600">{p.transaction_reference}</span></p>
                        <p>Paid: {new Date(p.paid_at).toLocaleDateString()}</p>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setSelectedInvoice(p)}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm text-xs"
                      >
                        Pay Invoice
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Checkout Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full p-6 space-y-5 text-left">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Secure Billing Checkout</h3>
              <p className="text-xs text-gray-400">Mock payment gateway integration screen.</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center border border-gray-100">
              <span className="text-xs font-bold text-gray-600">{selectedInvoice.title}</span>
              <span className="text-sm font-black text-gray-800">${parseFloat(selectedInvoice.amount).toFixed(2)}</span>
            </div>

            {checkoutSuccess ? (
              <div className="py-8 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center shadow-sm">
                  <ShieldCheck size={28} />
                </div>
                <h4 className="font-extrabold text-green-700 text-sm">Payment Successful!</h4>
                <p className="text-[10px] text-gray-400">Verifying bank transactions...</p>
              </div>
            ) : (
              <form onSubmit={handlePay} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Cardholder Name</label>
                  <input 
                    type="text" required value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} 
                    placeholder="e.g. John Doe"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" 
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Card Number</label>
                  <input 
                    type="text" required value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} 
                    placeholder="4111 2222 3333 4444"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Expiry Date</label>
                    <input 
                      type="text" required value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} 
                      placeholder="MM/YY"
                      className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" 
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">CVV</label>
                    <input 
                      type="password" required value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} 
                      placeholder="•••"
                      className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" 
                    />
                  </div>
                </div>

                <div className="flex gap-4 justify-end pt-2">
                  <button type="button" onClick={() => setSelectedInvoice(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={checkoutLoading} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-sm disabled:bg-green-400">
                    {checkoutLoading ? 'Processing transaction...' : `Pay $${parseFloat(selectedInvoice.amount).toFixed(2)}`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
