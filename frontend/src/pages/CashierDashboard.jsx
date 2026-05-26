import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { handleSuccess, handleError } from '../utils';
import {
  MdLogout, MdRefresh, MdClose, MdCheck,
  MdReceipt, MdPrint, MdPointOfSale
} from 'react-icons/md';
import '../css/cashier-dashboard.css';
import CryptoJS from 'crypto-js';
import logo from '../assets/logo.jpg';
import { useNavigate } from 'react-router-dom';
import API from '../config';

// eSewa sandbox credentials and endpoint
const ESEWA_SECRET = '8gBm/:&EnhH.1/q';
const ESEWA_PRODUCT_CODE = 'EPAYTEST';
const ESEWA_URL = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';

function CashierDashboard() {

  const navigate = useNavigate();

  // Which tab is active — billing or receipts
  const [activeTab, setActiveTab] = useState('billing');

  // Ready orders fetched from backend
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Currently selected order for billing
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Payment method selected by cashier: cash, qr, or esewa
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Amount entered for cash payment
  const [cashReceived, setCashReceived] = useState('');

  // Prevents double-clicking confirm payment
  const [processing, setProcessing] = useState(false);

  // Controls receipt modal visibility after successful payment
  const [showReceipt, setShowReceipt] = useState(false);

  // Stores the last paid order for receipt display
  const [paidOrder, setPaidOrder] = useState(null);

  // Receipts tab — paid orders list and filter
  const [receipts, setReceipts] = useState([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptSummary, setReceiptSummary] = useState({ totalRevenue: 0, totalOrders: 0 });

  // Bill type: normal receipt or VAT invoice (for companies)
  const [billType, setBillType] = useState('normal');
  const [showVatForm, setShowVatForm] = useState(false);
  const [vatCustomer, setVatCustomer] = useState({ name: '', pan: '', address: '' });

  // Restaurant info fetched from backend .env (name, address, VAT no, PAN no)
  const [restaurantInfo, setRestaurantInfo] = useState(null);

  // Invoice document generated after payment (contains invoice number)
  const [invoice, setInvoice] = useState(null);

  const printRef = useRef();

  // JWT auth header for all API requests
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // Fetches all orders with status "ready" from backend
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

  // Fetches paid orders filtered by date for the receipts tab
  const fetchReceipts = async (date = filterDate) => {
    setLoadingReceipts(true);
    try {
      const res = await axios.get(`${API}/api/orders/receipts?date=${date}`, { headers });
      setReceipts(res.data.data.orders || []);
      setReceiptSummary({
        totalRevenue: res.data.data.totalRevenue || 0,
        totalOrders: res.data.data.totalOrders || 0
      });
    } catch (err) {
      handleError('Failed to fetch receipts');
    } finally {
      setLoadingReceipts(false);
    }
  };

  // Fetches restaurant details stored in backend .env
  // Used in printed receipts (name, address, VAT no, PAN no)
  const fetchRestaurantInfo = async () => {
    try {
      const res = await axios.get(`${API}/api/payments/restaurant-info`, { headers });
      setRestaurantInfo(res.data.data);
    } catch (err) {
      console.error('Failed to fetch restaurant info');
    }
  };

  // On mount: load ready orders, restaurant info, set auto-refresh every 30s
  useEffect(() => {
    fetchOrders();
    fetchRestaurantInfo();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load receipts when switching to the receipts tab
  useEffect(() => {
    if (activeTab === 'receipts') fetchReceipts();
  }, [activeTab]);

  // Clears auth and redirects to login
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  // VAT-inclusive bill calculations
  // Nepal IRD standard: prices are VAT inclusive at 13%
  // Formula: Taxable = Total / 1.13, VAT = Total - Taxable
  const grossAmount = selectedOrder?.totalAmount || 0;
  const discount = 0;
  const taxableAmount = (grossAmount - discount) / 1.13;
  const vatAmount = (grossAmount - discount) - taxableAmount;
  const netAmount = grossAmount - discount;
  const change = cashReceived ? parseFloat(cashReceived) - netAmount : 0;

  // Same VAT calculation used for receipt history display
  const getReceiptCalc = (order) => {
    const gross = order?.totalAmount || 0;
    const taxable = gross / 1.13;
    const vat = gross - taxable;
    return { gross, taxable, vat, net: gross };
  };

  // Creates an Invoice document in the database
  // Returns invoice number used on printed receipt
  const generateInvoice = async (orderId, type, customerData = {}) => {
    try {
      const res = await axios.post(`${API}/api/payments/generate-invoice`, {
        orderId,
        billType: type,
        customerName: customerData.name || '',
        customerPAN: customerData.pan || '',
        customerAddress: customerData.address || ''
      }, { headers });
      return res.data.data;
    } catch (err) {
      console.error('Invoice generation failed');
      return null;
    }
  };

  // Handles cash and QR payment confirmation
  // Marks order as paid, frees table, generates invoice, shows receipt modal
  const handlePayment = async () => {
    if (paymentMethod === 'cash' && (!cashReceived || parseFloat(cashReceived) < netAmount)) {
      return handleError('Cash received is less than the total amount');
    }
    if (billType === 'vat' && !vatCustomer.name) {
      return handleError('Customer name is required for VAT bill');
    }

    setProcessing(true);
    try {
      // Mark order as paid in database — also frees the table
      await axios.patch(`${API}/api/orders/${selectedOrder._id}/pay`, { paymentMethod }, { headers });

      // Generate and store invoice with sequential invoice number
      const inv = await generateInvoice(
        selectedOrder._id,
        billType,
        billType === 'vat' ? vatCustomer : {}
      );
      setInvoice(inv);

      // Store paid order data for receipt modal display
      setPaidOrder({
        ...selectedOrder, grossAmount, discount, taxableAmount,
        vatAmount, netAmount, cashReceived: parseFloat(cashReceived || 0),
        change, paymentMethod, billType,
        customerName: vatCustomer.name,
        customerPAN: vatCustomer.pan,
        customerAddress: vatCustomer.address
      });

      // Show receipt modal and reset form
      setShowReceipt(true);
      setSelectedOrder(null);
      setCashReceived('');
      setBillType('normal');
      setVatCustomer({ name: '', pan: '', address: '' });
      setShowVatForm(false);
      fetchOrders();
      handleSuccess('Payment successful!');
    } catch (err) {
      handleError('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Handles eSewa payment — generates HMAC SHA256 signature and submits form to eSewa gateway
  // eSewa redirects back to success/failure URL after payment
  const handleEsewaPayment = () => {
    if (!selectedOrder) return;

    // Transaction UUID format required by eSewa: YYYYMMdd-HHmmss
    const now = new Date();
    const transactionUuid = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;

    const totalAmt = netAmount.toFixed(2);

    // HMAC SHA256 signature generated using eSewa's secret key
    const message = `total_amount=${totalAmt},transaction_uuid=${transactionUuid},product_code=${ESEWA_PRODUCT_CODE}`;
    const signature = CryptoJS.HmacSHA256(message, ESEWA_SECRET).toString(CryptoJS.enc.Base64);

    // Save order ID to localStorage so success page can verify and mark order paid
    localStorage.setItem('pendingEsewaPayment', JSON.stringify({
      orderId: selectedOrder._id,
      transactionUuid,
      amount: netAmount
    }));

    // Create and submit hidden form to eSewa payment gateway
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = ESEWA_URL;

    const fields = {
      amount: totalAmt,
      tax_amount: '0',
      total_amount: totalAmt,
      transaction_uuid: transactionUuid,
      product_code: ESEWA_PRODUCT_CODE,
      product_service_charge: '0',
      product_delivery_charge: '0',
      success_url: `${import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/esewa/success`,
      failure_url: `${import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/esewa/failure`,
      signed_field_names: 'total_amount,transaction_uuid,product_code',
      signature
    };

    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    console.log('success_url:', fields.success_url);
    console.log('failure_url:', fields.failure_url);
    form.submit();

    
  };

  // Opens a print window with formatted receipt
  // Supports both normal receipt and VAT invoice formats
  const handlePrint = (order, invData) => {
    const calc = getReceiptCalc(order);
    const isVat = order.billType === 'vat' || invData?.billType === 'vat';
    const invoiceNum = invData?.invoiceNumber || '—';

    const restaurant = restaurantInfo || {
      name: 'TablEase Restaurant',
      address: 'Kathmandu, Nepal',
      phone: '9800000000',
      vatNo: '123456789',
      panNo: '987654321'
    };

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${isVat ? 'VAT Invoice' : 'Receipt'} - ${order.table?.tableNumber}</title>
          <style>
            body { font-family: 'Courier New', monospace; width: 320px; margin: 0 auto; padding: 20px; font-size: 12px; }
            h2 { text-align: center; font-size: 16px; margin-bottom: 2px; }
            .center { text-align: center; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .solid { border-top: 1px solid #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 3px 0; }
            .bold { font-weight: bold; }
            .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; }
            .vat-title { text-align: center; font-weight: bold; font-size: 14px; border: 1px solid #000; padding: 4px; margin: 6px 0; }
          </style>
        </head>
        <body>
          <h2>${restaurant.name}</h2>
          <p class="center">${restaurant.address}</p>
          <p class="center">Tel: ${restaurant.phone}</p>

          ${isVat ? `
            <p class="center">VAT No: ${restaurant.vatNo}</p>
            <p class="center">PAN No: ${restaurant.panNo}</p>
            <div class="vat-title">TAX INVOICE</div>
          ` : '<div class="vat-title">RECEIPT</div>'}

          <div class="divider"></div>
          <div class="row"><span>Invoice No:</span><span>${invoiceNum}</span></div>
          <div class="row"><span>Date:</span><span>${new Date().toLocaleDateString('en-GB')}</span></div>
          <div class="row"><span>Time:</span><span>${new Date().toLocaleTimeString()}</span></div>
          <div class="row"><span>Table:</span><span>${order.table?.tableNumber}</span></div>
          <div class="row"><span>Payment:</span><span>${order.paymentMethod || 'Cash'}</span></div>
          <div class="row"><span>Served by:</span><span>${order.waiter?.name || 'Staff'}</span></div>

          ${isVat ? `
            <div class="divider"></div>
            <div class="bold">Bill To:</div>
            <div class="row"><span>Name:</span><span>${order.customerName || invData?.customerName || '—'}</span></div>
            <div class="row"><span>PAN:</span><span>${order.customerPAN || invData?.customerPAN || '—'}</span></div>
            <div class="row"><span>Address:</span><span>${order.customerAddress || invData?.customerAddress || '—'}</span></div>
          ` : ''}

          <div class="divider"></div>
          <div class="row bold">
            <span style="flex:2">Item</span>
            <span style="flex:0.5;text-align:center">Qty</span>
            <span style="flex:1;text-align:right">Rate</span>
            <span style="flex:1;text-align:right">Amount</span>
          </div>
          <div class="divider"></div>

          ${order.items.map(item => `
            <div class="row">
              <span style="flex:2">${item.name}</span>
              <span style="flex:0.5;text-align:center">${item.qty}</span>
              <span style="flex:1;text-align:right">Rs.${(item.price / 1.13).toFixed(2)}</span>
              <span style="flex:1;text-align:right">Rs.${(item.price * item.qty / 1.13).toFixed(2)}</span>
            </div>
          `).join('')}

          <div class="divider"></div>
          <div class="row"><span>Gross Amount:</span><span>Rs. ${calc.taxable.toFixed(2)}</span></div>
          <div class="row"><span>Discount:</span><span>Rs. 0.00</span></div>
          <div class="row"><span>Taxable Amount:</span><span>Rs. ${calc.taxable.toFixed(2)}</span></div>
          <div class="row"><span>VAT (13%):</span><span>Rs. ${calc.vat.toFixed(2)}</span></div>
          <div class="solid"></div>
          <div class="total-row"><span>Net Amount:</span><span>Rs. ${calc.net.toFixed(2)}</span></div>

          ${order.paymentMethod === 'cash' ? `
            <div class="divider"></div>
            <div class="row"><span>Tender:</span><span>Rs. ${order.cashReceived?.toFixed ? order.cashReceived.toFixed(2) : order.cashReceived}</span></div>
            <div class="row"><span>Change:</span><span>Rs. ${order.change?.toFixed ? order.change.toFixed(2) : order.change}</span></div>
          ` : ''}

          <div class="divider"></div>
          <p class="center">Thank you for dining with us!</p>
          <p class="center">${restaurant.name}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="cashier-layout">

      {/* Header — logo, tab buttons, refresh, logout */}
      <header className="cashier-header">
        <div className="cashier-brand">
          <img
            src={logo}
            alt="TablEase"
            className="cashier-logo"
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div>
            <h1>Cashier Dashboard</h1>
            <p>Welcome, {localStorage.getItem('loggedInUser') || 'Cashier'}</p>
          </div>
        </div>

        <div className="cashier-header-right">
          {/* Tab switcher between Billing and Receipts */}
          <div className="cashier-tabs">
            <button
              className={`cashier-tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
              onClick={() => setActiveTab('billing')}
            >
              <MdPointOfSale size={16} /> Billing
            </button>
            <button
              className={`cashier-tab-btn ${activeTab === 'receipts' ? 'active' : ''}`}
              onClick={() => setActiveTab('receipts')}
            >
              <MdReceipt size={16} /> Receipts
            </button>
          </div>

          <button
            className="refresh-btn"
            onClick={activeTab === 'billing' ? fetchOrders : () => fetchReceipts()}
          >
            <MdRefresh size={18} /> Refresh
          </button>

          <button className="logout-btn" onClick={handleLogout}>
            <MdLogout size={18} /> Logout
          </button>
        </div>
      </header>

      {/* Billing Tab */}
      {/* Left panel: list of ready orders | Right panel: bill details and payment */}
      {activeTab === 'billing' && (
        <div className="cashier-main">

          {/* Left — Ready orders list */}
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
                      // Select order and reset all form fields
                      setSelectedOrder(order);
                      setCashReceived('');
                      setPaymentMethod('cash');
                      setBillType('normal');
                      setShowVatForm(false);
                      setVatCustomer({ name: '', pan: '', address: '' });
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

          {/* Right — Bill details, bill type, payment method */}
          <div className="billing-panel">
            {!selectedOrder ? (
              <div className="no-selection">
                <span>👈</span>
                <p>Select an order to generate bill</p>
              </div>
            ) : (
              <>
                {/* Bill header with table number and close button */}
                <div className="bill-header">
                  <h2>Bill — Table {selectedOrder.table?.tableNumber}</h2>
                  <button className="close-btn" onClick={() => setSelectedOrder(null)}>
                    <MdClose />
                  </button>
                </div>

                {/* Itemized list — prices shown ex-VAT (divided by 1.13) */}
                <div className="bill-items">
                  {selectedOrder.items.map((item, i) => {
                    const itemExVat = (item.price * item.qty) / 1.13;
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

                {/* VAT breakdown following Nepal IRD standard */}
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

                {/* Bill type selector — Normal Bill or VAT Bill (for companies) */}
                <div className="bill-type-section">
                  <h3>Bill Type</h3>
                  <div className="bill-type-buttons">
                    <button
                      className={`bill-type-btn ${billType === 'normal' ? 'active' : ''}`}
                      onClick={() => { setBillType('normal'); setShowVatForm(false); }}
                    >
                      🧾 Normal Bill
                    </button>
                    <button
                      className={`bill-type-btn ${billType === 'vat' ? 'active' : ''}`}
                      onClick={() => { setBillType('vat'); setShowVatForm(true); }}
                    >
                      📋 VAT Bill
                    </button>
                  </div>

                  {/* VAT form — shown only when VAT Bill is selected */}
                  {showVatForm && (
                    <div className="vat-form">
                      <div className="vat-form-group">
                        <label>Customer / Company Name *</label>
                        <input
                          type="text"
                          value={vatCustomer.name}
                          onChange={e => setVatCustomer({ ...vatCustomer, name: e.target.value })}
                          placeholder="e.g. ABC Company Pvt. Ltd."
                        />
                      </div>
                      <div className="vat-form-group">
                        <label>PAN Number (optional)</label>
                        <input
                          type="text"
                          value={vatCustomer.pan}
                          onChange={e => setVatCustomer({ ...vatCustomer, pan: e.target.value })}
                          placeholder="e.g. 123456789"
                          maxLength={9}
                        />
                      </div>
                      <div className="vat-form-group">
                        <label>Address</label>
                        <input
                          type="text"
                          value={vatCustomer.address}
                          onChange={e => setVatCustomer({ ...vatCustomer, address: e.target.value })}
                          placeholder="e.g. Kathmandu, Nepal"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment method selection — Cash, QR, or eSewa */}
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
                    <button
                      className={`method-btn ${paymentMethod === 'esewa' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('esewa')}
                    >
                      🟢 eSewa
                    </button>
                  </div>
                </div>

                {/* Cash payment — enter amount received, shows change */}
                {paymentMethod === 'cash' && (
                  <div className="cash-section">
                    <label>Cash Received (Rs.)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cashReceived}
                      onChange={e => {
                        const val = e.target.value;
                        // Only allow valid number input
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setCashReceived(val);
                        }
                      }}
                      placeholder="Enter amount received"
                      autoComplete="off"
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

                {/* QR payment — shows eSewa QR code for customer to scan */}
                {paymentMethod === 'qr' && (
                  <div className="qr-section">
                    <p className="qr-instruction">
                      Scan to pay <strong>Rs. {netAmount.toFixed(2)}</strong> via eSewa
                    </p>
                    <div className="qr-code">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://esewa.com.np`}
                        alt="eSewa QR Code"
                      />
                    </div>
                    <div className="qr-esewa-info">
                      <img
                        src="https://esewa.com.np/common/images/esewa_logo.png"
                        alt="eSewa"
                        style={{ height: '28px', marginBottom: '8px' }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                      <p>Scan with eSewa app to pay</p>
                      <p className="qr-note">After customer pays, click confirm below</p>
                    </div>
                  </div>
                )}

                {/* eSewa payment — redirects customer to eSewa gateway */}
                {paymentMethod === 'esewa' && (
                  <div className="esewa-section">
                    <img
                      src="https://esewa.com.np/common/images/esewa_logo.png"
                      alt="eSewa"
                      className="esewa-logo"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                    <p>Pay <strong>Rs. {netAmount.toFixed(2)}</strong> via eSewa</p>
                    <p className="esewa-note">
                      Customer will be redirected to eSewa to complete payment
                    </p>
                    {/* Test credentials for eSewa sandbox environment */}
                    <div className="esewa-test-creds">
                      <p><strong>Test Credentials:</strong></p>
                      <p>eSewa ID: 9806800001</p>
                      <p>Password: Nepal@123</p>
                      <p>Token: 123456</p>
                    </div>
                    <button className="esewa-pay-btn" onClick={handleEsewaPayment}>
                      Pay with eSewa →
                    </button>
                  </div>
                )}

                {/* Confirm payment button — hidden for eSewa (uses redirect instead) */}
                {paymentMethod !== 'esewa' && (
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
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Receipts Tab */}
      {/* Shows all paid orders for a selected date with print option */}
      {activeTab === 'receipts' && (
        <div className="receipts-layout">

          {/* Summary cards and date filter */}
          <div className="receipts-header">
            <div className="receipts-summary">
              <div className="summary-card">
                <h3>Total Orders</h3>
                <p>{receiptSummary.totalOrders}</p>
              </div>
              <div className="summary-card">
                <h3>Total Revenue</h3>
                <p>Rs. {receiptSummary.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
            <div className="receipts-filter">
              <label>Filter by Date:</label>
              <input
                type="date"
                value={filterDate}
                onChange={e => { setFilterDate(e.target.value); fetchReceipts(e.target.value); }}
              />
            </div>
          </div>

          <div className="receipts-content">

            {/* Left — List of paid orders for selected date */}
            <div className="receipts-list-panel">
              <h2>Paid Orders</h2>
              {loadingReceipts ? (
                <div className="cashier-loading">Loading receipts...</div>
              ) : receipts.length === 0 ? (
                <div className="cashier-empty">
                  <span>🧾</span>
                  <p>No paid orders for this date</p>
                </div>
              ) : (
                <div className="orders-list">
                  {receipts.map(receipt => (
                    <div
                      key={receipt._id}
                      className={`order-card ${selectedReceipt?._id === receipt._id ? 'selected' : ''}`}
                      onClick={() => setSelectedReceipt(receipt)}
                    >
                      <div className="order-card-top">
                        <span className="order-table">Table {receipt.table?.tableNumber}</span>
                        <span className="order-amount">Rs. {receipt.totalAmount}</span>
                      </div>
                      <div className="order-items-preview">
                        {receipt.items.slice(0, 2).map((item, i) => (
                          <span key={i} className="preview-item">{item.name} x{item.qty}</span>
                        ))}
                        {receipt.items.length > 2 && (
                          <span className="preview-more">+{receipt.items.length - 2} more</span>
                        )}
                      </div>
                      <div className="receipt-meta">
                        <span className="order-time">
                          {new Date(receipt.updatedAt).toLocaleTimeString()}
                        </span>
                        <span className="payment-badge">{receipt.paymentMethod || 'cash'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right — Full receipt details with print button */}
            <div className="receipt-detail-panel">
              {!selectedReceipt ? (
                <div className="no-selection">
                  <span>👈</span>
                  <p>Select a receipt to view details</p>
                </div>
              ) : (
                <>
                  <div className="bill-header">
                    <h2>Receipt — Table {selectedReceipt.table?.tableNumber}</h2>
                    <button
                      className="print-btn"
                      onClick={() => handlePrint(selectedReceipt, null)}
                    >
                      <MdPrint size={18} /> Print
                    </button>
                  </div>

                  {/* Receipt metadata */}
                  <div className="receipt-info">
                    <p><strong>Date:</strong> {new Date(selectedReceipt.updatedAt).toLocaleString()}</p>
                    <p><strong>Waiter:</strong> {selectedReceipt.waiter?.name || 'N/A'}</p>
                    <p><strong>Payment:</strong> {selectedReceipt.paymentMethod || 'cash'}</p>
                  </div>

                  {/* Itemized list */}
                  <div className="bill-items">
                    {selectedReceipt.items.map((item, i) => {
                      const itemExVat = (item.price * item.qty) / 1.13;
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

                  {/* VAT breakdown */}
                  {(() => {
                    const calc = getReceiptCalc(selectedReceipt);
                    return (
                      <div className="bill-totals">
                        <div className="bill-row">
                          <span>Gross Amount</span>
                          <span>Rs. {calc.taxable.toFixed(2)}</span>
                        </div>
                        <div className="bill-row">
                          <span>Discount</span>
                          <span>Rs. 0.00</span>
                        </div>
                        <div className="bill-row">
                          <span>Taxable Amount</span>
                          <span>Rs. {calc.taxable.toFixed(2)}</span>
                        </div>
                        <div className="bill-row">
                          <span>VAT (13%)</span>
                          <span>Rs. {calc.vat.toFixed(2)}</span>
                        </div>
                        <div className="bill-row grand-total">
                          <span>Net Amount</span>
                          <span>Rs. {calc.net.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })()}

                  <button
                    className="confirm-payment-btn"
                    style={{ background: '#2980b9' }}
                    onClick={() => handlePrint(selectedReceipt, null)}
                  >
                    <MdPrint size={18} /> Print Receipt
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {/* Shows after successful payment — displays full receipt with print option */}
      {showReceipt && paidOrder && (
        <div className="modal-overlay" onClick={() => setShowReceipt(false)}>
          <div className="receipt-modal" onClick={e => e.stopPropagation()}>

            <div className="receipt-header">
              <h2>🧾 {restaurantInfo?.name || 'TablEase'}</h2>
              <p>{paidOrder.billType === 'vat' ? 'TAX INVOICE' : 'Payment Receipt'}</p>
            </div>

            <div className="receipt-body">

              {/* VAT bill extra fields — seller and buyer details */}
              {paidOrder.billType === 'vat' && (
                <>
                  <p><strong>VAT No:</strong> {restaurantInfo?.vatNo}</p>
                  <p><strong>PAN No:</strong> {restaurantInfo?.panNo}</p>
                  <div className="receipt-divider" />
                  <p><strong>Bill To:</strong></p>
                  <p>{paidOrder.customerName}</p>
                  <p>PAN: {paidOrder.customerPAN}</p>
                  <p>{paidOrder.customerAddress}</p>
                </>
              )}

              <div className="receipt-divider" />

              {/* Order info */}
              <p><strong>Invoice No:</strong> {invoice?.invoiceNumber || '—'}</p>
              <p><strong>Table:</strong> {paidOrder.table?.tableNumber}</p>
              <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
              <p><strong>Payment:</strong> {
                paidOrder.paymentMethod === 'cash' ? '💵 Cash' :
                paidOrder.paymentMethod === 'esewa' ? '🟢 eSewa' : '📱 QR Pay'
              }</p>

              <div className="receipt-divider" />

              {/* Items list */}
              {paidOrder.items.map((item, i) => (
                <div key={i} className="receipt-item">
                  <span>{item.name} x{item.qty}</span>
                  <span>Rs. {(item.price * item.qty / 1.13).toFixed(2)}</span>
                </div>
              ))}

              <div className="receipt-divider" />

              {/* Totals */}
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

              {/* Cash change row — only for cash payments */}
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

            {/* Close and Print buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="receipt-close-btn"
                style={{ flex: 1 }}
                onClick={() => setShowReceipt(false)}
              >
                Close
              </button>
              <button
                className="receipt-close-btn"
                style={{ flex: 1, background: '#2980b9' }}
                onClick={() => handlePrint(paidOrder, invoice)}
              >
                🖨️ Print
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default CashierDashboard;