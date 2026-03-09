import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { handleSuccess, handleError } from '../utils';
import { MdLogout, MdRefresh, MdClose, MdCheck } from 'react-icons/md';
import '../css/cashier-dashboard.css';

const API = 'http://localhost:8080';

function CashierDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [paidOrder, setPaidOrder] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/orders/ready`, { headers });
      setOrders(res.data.data || []);
    } catch (err) {
      handleError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  // VAT inclusive calculations (Nepal IRD standard)
  const grossAmount = selectedOrder?.totalAmount || 0;
  const discount = 0;
  const taxableAmount = (grossAmount - discount) / 1.13;
  const vatAmount = (grossAmount - discount) - taxableAmount;
  const netAmount = grossAmount - discount;
  const change = cashReceived ? parseFloat(cashReceived) - netAmount : 0;

  const handlePayment = async () => {
    if (paymentMethod === 'cash' && (!cashReceived || parseFloat(cashReceived) < netAmount)) {
      return handleError('Cash received is less than the total amount');
    }

    setProcessing(true);
    try {
      await axios.patch(
        `${API}/api/orders/${selectedOrder._id}/pay`,
        { paymentMethod },
        { headers }
      );
      setPaidOrder({
        ...selectedOrder,
        grossAmount,
        discount,
        taxableAmount,
        vatAmount,
        netAmount,
        cashReceived: parseFloat(cashReceived || 0),
        change,
        paymentMethod
      });
      setShowReceipt(true);
      setSelectedOrder(null);
      setCashReceived('');
      fetchOrders();
      handleSuccess('Payment successful!');
    } catch (err) {
      handleError('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="cashier-layout">
      {/* Header */}
      <header className="cashier-header">
        <div className="cashier-brand">
          <span>💰</span>
          <div>
            <h1>Cashier Dashboard</h1>
            <p>TablEase POS</p>
          </div>
        </div>
        <div className="cashier-header-right">
          <span className="ready-count">{orders.length} orders ready</span>
          <button className="refresh-btn" onClick={fetchOrders}><MdRefresh size={18} /> Refresh</button>
          <button className="logout-btn" onClick={handleLogout}><MdLogout size={18} /> Logout</button>
        </div>
      </header>

      <div className="cashier-main">
        {/* LEFT: Ready Orders List */}
        <div className="orders-panel">
          <h2>Ready to Bill</h2>
          {loading ? (
            <div className="cashier-loading">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="cashier-empty">
              <span>✅</span>
              <p>No orders ready for billing</p>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map(order => (
                <div
                  key={order._id}
                  className={`order-card ${selectedOrder?._id === order._id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedOrder(order);
                    setCashReceived('');
                    setPaymentMethod('cash');
                  }}
                >
                  <div className="order-card-top">
                    <span className="order-table">Table {order.table?.tableNumber}</span>
                    <span className="order-amount">Rs. {order.totalAmount}</span>
                  </div>
                  <div className="order-items-preview">
                    {order.items.slice(0, 2).map((item, i) => (
                      <span key={i} className="preview-item">{item.name} x{item.qty}</span>
                    ))}
                    {order.items.length > 2 && (
                      <span className="preview-more">+{order.items.length - 2} more</span>
                    )}
                  </div>
                  <div className="order-time">
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Bill & Payment */}
        <div className="billing-panel">
          {!selectedOrder ? (
            <div className="no-selection">
              <span>👈</span>
              <p>Select an order to generate bill</p>
            </div>
          ) : (
            <>
              <div className="bill-header">
                <h2>Bill — Table {selectedOrder.table?.tableNumber}</h2>
                <button className="close-btn" onClick={() => setSelectedOrder(null)}>
                  <MdClose />
                </button>
              </div>

              {/* Itemized Bill */}
              <div className="bill-items">
                {selectedOrder.items.map((item, i) => {
                  const itemTotal = item.price * item.qty;
                  const itemExVat = itemTotal / 1.13;
                  return (
                    <div key={i} className="bill-item">
                      <span className="bill-item-name">{item.name}</span>
                      <span className="bill-item-qty">x{item.qty}</span>
                      <span className="bill-item-price">Rs. {itemExVat.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="bill-divider" />

              {/* Totals */}
              <div className="bill-totals">
                <div className="bill-row">
                  <span>Gross Amount</span>
                  <span>Rs. {taxableAmount.toFixed(2)}</span>
                </div>
                <div className="bill-row">
                  <span>Discount</span>
                  <span>Rs. {discount.toFixed(2)}</span>
                </div>
                <div className="bill-row">
                  <span>Taxable Amount</span>
                  <span>Rs. {taxableAmount.toFixed(2)}</span>
                </div>
                <div className="bill-row">
                  <span>VAT (13%)</span>
                  <span>Rs. {vatAmount.toFixed(2)}</span>
                </div>
                <div className="bill-row grand-total">
                  <span>Net Amount</span>
                  <span>Rs. {netAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="bill-divider" />

              {/* Payment Method */}
              <div className="payment-methods">
                <h3>Payment Method</h3>
                <div className="method-buttons">
                  <button
                    className={`method-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    💵 Cash
                  </button>
                  <button
                    className={`method-btn ${paymentMethod === 'qr' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('qr')}
                  >
                    📱 QR Pay
                  </button>
                </div>
              </div>

              {/* Cash Payment */}
              {paymentMethod === 'cash' && (
                <div className="cash-section">
                  <label>Cash Received (Rs.)</label>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={e => setCashReceived(e.target.value)}
                    placeholder="Enter amount received"
                    min={netAmount}
                  />
                  {cashReceived && parseFloat(cashReceived) >= netAmount && (
                    <div className="change-display">
                      Change: <strong>Rs. {change.toFixed(2)}</strong>
                    </div>
                  )}
                  {cashReceived && parseFloat(cashReceived) < netAmount && (
                    <div className="change-display insufficient">
                      Insufficient: Rs. {(netAmount - parseFloat(cashReceived)).toFixed(2)} more needed
                    </div>
                  )}
                </div>
              )}

              {/* QR Payment */}
              {paymentMethod === 'qr' && (
                <div className="qr-section">
                  <p className="qr-instruction">
                    Scan QR code to pay <strong>Rs. {netAmount.toFixed(2)}</strong>
                  </p>
                  <div className="qr-code">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=TablEase-Payment-Rs${netAmount.toFixed(2)}-Table${selectedOrder.table?.tableNumber}`}
                      alt="QR Code"
                    />
                  </div>
                  <p className="qr-note">After customer scans and pays, click confirm below</p>
                </div>
              )}

              {/* Confirm Payment */}
              <button
                className="confirm-payment-btn"
                onClick={handlePayment}
                disabled={
                  processing ||
                  (paymentMethod === 'cash' && (!cashReceived || parseFloat(cashReceived) < netAmount))
                }
              >
                {processing ? 'Processing...' : <><MdCheck size={18} /> Confirm Payment</>}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && paidOrder && (
        <div className="modal-overlay" onClick={() => setShowReceipt(false)}>
          <div className="receipt-modal" onClick={e => e.stopPropagation()}>
            <div className="receipt-header">
              <h2>🧾 TablEase</h2>
              <p>Payment Receipt</p>
            </div>
            <div className="receipt-body">
              <p><strong>Table:</strong> {paidOrder.table?.tableNumber}</p>
              <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
              <p><strong>Payment:</strong> {paidOrder.paymentMethod === 'cash' ? '💵 Cash' : '📱 QR Pay'}</p>
              <div className="receipt-divider" />
              {paidOrder.items.map((item, i) => (
                <div key={i} className="receipt-item">
                  <span>{item.name} x{item.qty}</span>
                  <span>Rs. {(item.price * item.qty / 1.13).toFixed(2)}</span>
                </div>
              ))}
              <div className="receipt-divider" />
              <div className="receipt-row">
                <span>Gross Amount</span>
                <span>Rs. {paidOrder.taxableAmount?.toFixed(2)}</span>
              </div>
              <div className="receipt-row">
                <span>Discount</span>
                <span>Rs. {paidOrder.discount?.toFixed(2)}</span>
              </div>
              <div className="receipt-row">
                <span>Taxable Amount</span>
                <span>Rs. {paidOrder.taxableAmount?.toFixed(2)}</span>
              </div>
              <div className="receipt-row">
                <span>VAT (13%)</span>
                <span>Rs. {paidOrder.vatAmount?.toFixed(2)}</span>
              </div>
              <div className="receipt-row total">
                <span>Net Amount</span>
                <span>Rs. {paidOrder.netAmount?.toFixed(2)}</span>
              </div>
              {paidOrder.paymentMethod === 'cash' && (
                <>
                  <div className="receipt-row">
                    <span>Tender</span>
                    <span>Rs. {paidOrder.cashReceived?.toFixed(2)}</span>
                  </div>
                  <div className="receipt-row">
                    <span>Change</span>
                    <span>Rs. {paidOrder.change?.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
            <button className="receipt-close-btn" onClick={() => setShowReceipt(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CashierDashboard;