import React from 'react';
import { Link } from 'react-router-dom';
import '../css/Landing.css';  
import logo from '../assets/logo.jpg';

function Landing() {
  return (
    <div>
      {/* Hero Section */}
      <header className="hero">
        <div className="container">
          <img src={logo} alt="TablEase Logo" className="hero-logo" />
          <h1 className="hero-title">TablEase</h1>
          <p className="hero-subtitle">Where Order Meets Ease</p>

          <div className="hero-buttons">
            <Link to="/login" className="btn btn-primary">Login to Dashboard</Link>
            <Link to="/signup" className="btn btn-secondary">Create Account</Link>
          </div>
        </div>
      </header>

      {/* About Section */}
      <section className="about">
        <div className="container">
          <h2>About TablEase</h2>
          <p>
            TablEase is a modern web-based Point of Sale system designed for small to medium restaurants. 
            It helps waiters take orders quickly, sync with the kitchen in real-time, track inventory automatically, 
            handle billing with cash or digital payments (Khalti/eSewa), and manage your team with secure role-based access 
            for Waiter, Cashier, Manager, Admin, and Kitchen Staff.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2>Powerful Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📋</div>
              <h3 className="feature-title">Fast Order Management</h3>
              <p className="feature-desc">
                Quick order entry, real-time kitchen sync, special notes & allergy alerts.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💳</div>
              <h3 className="feature-title">Smart Billing</h3>
              <p className="feature-desc">
                Cash, QR (Khalti/eSewa), split bills, receipts & instant verification.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📦</div>
              <h3 className="feature-title">Inventory Control</h3>
              <p className="feature-desc">
                Auto stock deduction on order confirmation + low-stock alerts.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3 className="feature-title">Role-Based Access</h3>
              <p className="feature-desc">
                Secure dashboards for Waiter, Cashier, Manager, Admin & Kitchen Staff.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3 className="feature-title">Reports & Analytics</h3>
              <p className="feature-desc">
                Sales reports, daily/weekly insights, top-selling items & more.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3 className="feature-title">Real-Time Sync</h3>
              <p className="feature-desc">
                Instant updates between front-of-house, kitchen, and management.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact">
        <div className="container">
          <h2>Contact Us</h2>
          <p className="contact-text">
            Have questions or need support? We're here to help!
          </p>
          <div className="contact-info">
            <div className="contact-item">
              <span className="contact-icon">📧</span>
              <div>
                <p>Email</p>
                <a href="mailto:support@tablEase.com">support@tablEase.com</a>
              </div>
            </div>
            <div className="contact-item">
              <span className="contact-icon">☎</span>
              <div>
                <p>Phone</p>
                <a href="tel:+9779801234567">+977-980-1234567</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Ready to Transform Your Restaurant?</h2>
          <p>Start managing restaurant operations efficiently with TablEase.</p>
          <div className="cta-buttons">
            <Link to="/signup" className="btn btn-primary">Get Started Free</Link>
            <Link to="/login" className="btn btn-secondary">Login</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container">
          <p>© {new Date().getFullYear()} TablEase. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;