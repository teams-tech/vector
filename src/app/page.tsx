import dynamic from 'next/dynamic';

const MiaWidget = dynamic(() => import('./MiaWidget'), { ssr: false });

export default function Home() {
  return (
    <>
      {/* Header */}
      <header className="header-bar">
        <div className="header-logo">
          <div className="logo-primary">
            <span>T</span><span>E</span><span>A</span><span>M</span><span>S</span>
          </div>
          <div className="logo-secondary gold">
            <span>T</span><span>E</span><span>C</span><span>H</span><span>N</span><span>O</span><span>L</span><span>O</span><span>G</span><span>Y</span>
          </div>
        </div>
        <nav className="header-nav">
          <a href="#">Platform</a>
          <a href="#">Integrations</a>
          <a href="#">Docs</a>
          <a href="#" className="nav-btn">Dashboard</a>
        </nav>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-logo">
          <div className="logo-primary xl">
            <span>T</span><span>E</span><span>A</span><span>M</span><span>S</span>
          </div>
          <div className="logo-secondary xl gold">
            <span>T</span><span>E</span><span>C</span><span>H</span><span>N</span><span>O</span><span>L</span><span>O</span><span>G</span><span>Y</span>
          </div>
        </div>

        <div className="hero-content">
          <div className="hero-label">Voice Assistant</div>
          <h2 className="hero-title">Talk to Mia</h2>
          <div className="hero-rule" />
          <p className="hero-desc">
            AI-powered dealership operations and customer experience. Sales, F&amp;I, desking, service, inventory, floor plans, and customer care — all by voice.
          </p>
          <div className="hero-widget">
            <MiaWidget />
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="divider">Capabilities</div>

      {/* Features */}
      <section className="features">
        <div className="grid-4">
          <div className="card">
            <div className="card-accent" />
            <h3>SALES</h3>
            <p>Inventory search, vehicle details, lender matching, and customer follow-ups — hands-free.</p>
            <span className="card-tag">Customer Facing</span>
          </div>
          <div className="card">
            <div className="card-accent" />
            <h3>F&amp;I</h3>
            <p>Warranty eligibility, lender products, deal structuring, and contract support.</p>
            <span className="card-tag">Finance &amp; Insurance</span>
          </div>
          <div className="card">
            <div className="card-accent" />
            <h3>DESKING</h3>
            <p>TEAMS pricing, pack calculations, profit modeling, and deal negotiation support.</p>
            <span className="card-tag">Deal Structure</span>
          </div>
          <div className="card">
            <div className="card-accent" />
            <h3>SERVICE</h3>
            <p>Active repair orders, service history, and Tekmetric integration across locations.</p>
            <span className="card-tag">Service Dept</span>
          </div>
          <div className="card">
            <div className="card-accent" />
            <h3>INVENTORY</h3>
            <p>Search by make, model, price, color, or stock number. Real-time HubSpot data.</p>
            <span className="card-tag">Voice Search</span>
          </div>
          <div className="card">
            <div className="card-accent" />
            <h3>FLOOR PLANS</h3>
            <p>Balances, curtailments, and payoffs across AFC and NextGear lenders.</p>
            <span className="card-tag">Financial Data</span>
          </div>
          <div className="card">
            <div className="card-accent" />
            <h3>CUSTOMER CARE</h3>
            <p>Proactive follow-ups, heat mitigation, complaint resolution, and satisfaction tracking.</p>
            <span className="card-tag">Customer Service</span>
          </div>
          <div className="card">
            <div className="card-accent" />
            <h3>PERSISTENT MEMORY</h3>
            <p>Mia remembers every conversation. Context, follow-ups, and history across calls.</p>
            <span className="card-tag">AI Memory</span>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="divider">Security</div>

      {/* Security */}
      <section className="security">
        <div className="grid-4">
          {[
            ['SEC001', 'Server-side identity resolution. Caller role claims ignored.'],
            ['SEC002', 'Field-level RBAC filtering. Financial data gated by verified role.'],
            ['SEC003', '6-digit PIN verification. Three failures triggers 15-minute lockout.'],
            ['SEC004', 'Unverified callers limited to vehicle search and general info only.'],
          ].map(([code, text]) => (
            <div key={code} className="sec-item">
              <div className="sec-code">{code}</div>
              <div className="sec-text">{text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-line" />
        <div className="footer-logo">
          <div className="logo-primary sm">
            <span>T</span><span>E</span><span>A</span><span>M</span><span>S</span>
          </div>
          <div className="logo-secondary sm gold">
            <span>T</span><span>E</span><span>C</span><span>H</span><span>N</span><span>O</span><span>L</span><span>O</span><span>G</span><span>Y</span>
          </div>
        </div>
        <p className="footer-tagline">Dealer infrastructure. Transparent by design.</p>
        <p className="footer-copy">&copy; {new Date().getFullYear()} TEAMS Technology. All rights reserved.</p>
      </footer>

      <style>{`
        /* ═══════════════════════════════════════════════
           LOGO SYSTEM — both lines stretch to same width
           ═══════════════════════════════════════════════ */
        .header-logo,
        .hero-logo,
        .footer-logo {
          display: inline-flex;
          flex-direction: column;
          align-items: stretch;
        }
        .logo-primary {
          font-weight: 100;
          display: flex;
          justify-content: space-between;
          font-size: 28px;
        }
        .logo-primary span { display: inline-block; }
        .logo-secondary {
          font-weight: 200;
          display: flex;
          justify-content: space-between;
          margin-top: 4px;
          font-size: 6px;
          margin-left: 3%;
          margin-right: 3%;
        }
        .logo-secondary span { display: inline-block; }
        .logo-secondary.gold { color: #d4a574; }

        /* Size: XL (hero) */
        .logo-primary.xl { font-size: 120px; }
        .logo-secondary.xl { font-size: 20px; margin-top: 10px; }

        /* Size: SM (footer) */
        .logo-primary.sm { font-size: 42px; }
        .logo-secondary.sm { font-size: 8px; margin-top: 4px; }

        /* ═══════════════════
           HEADER
           ═══════════════════ */
        .header-bar {
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 40px;
          background: rgba(10, 10, 10, 0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #1a1a1a;
        }
        .header-nav {
          display: flex;
          gap: 28px;
          align-items: center;
        }
        .header-nav a {
          color: rgba(255,255,255,0.4);
          text-decoration: none;
          font-size: 11px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          font-weight: 300;
          transition: color 0.2s;
        }
        .header-nav a:hover { color: white; }
        .nav-btn {
          background: #4a6fa5 !important;
          color: white !important;
          padding: 10px 22px;
        }

        /* ═══════════════════
           HERO
           ═══════════════════ */
        .hero {
          min-height: 85vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px 20px 60px;
          text-align: center;
          background: radial-gradient(ellipse at 50% 30%, #151515 0%, #0a0a0a 70%);
        }
        .hero-content { margin-top: 40px; }
        .hero-label {
          font-size: 13px;
          letter-spacing: 0.25em;
          color: #c41e3a;
          text-transform: uppercase;
          font-weight: 400;
          margin-bottom: 20px;
        }
        .hero-title {
          font-size: 56px;
          font-weight: 100;
          letter-spacing: 0.05em;
          color: white;
        }
        .hero-rule {
          width: 50px;
          height: 2px;
          background: #c41e3a;
          margin: 28px auto;
        }
        .hero-desc {
          font-size: 15px;
          font-weight: 300;
          color: #666;
          max-width: 460px;
          line-height: 1.9;
          margin: 0 auto;
        }

        /* ═══════════════════
           MIA WIDGET
           ═══════════════════ */
        .hero-widget {
          margin-top: 40px;
          display: flex;
          justify-content: center;
        }
        .mia-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          font-family: 'Montserrat', sans-serif;
        }
        .mia-ring {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 2px solid #333;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        .mia-btn:hover .mia-ring {
          border-color: #c41e3a;
          box-shadow: 0 0 20px rgba(196, 30, 58, 0.15);
        }
        .mia-ring-pulse {
          border-color: #c41e3a !important;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(196, 30, 58, 0.3); }
          50% { box-shadow: 0 0 0 12px rgba(196, 30, 58, 0); }
        }
        .mia-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 200;
          color: #d4a574;
          letter-spacing: 1px;
        }
        .mia-label {
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #555;
          font-weight: 300;
          transition: color 0.3s;
        }
        .mia-btn:hover .mia-label { color: #888; }
        .mia-active .mia-label { color: #c41e3a; }

        /* ═══════════════════
           DIVIDER
           ═══════════════════ */
        .divider {
          width: 100%;
          padding: 28px;
          background: #111;
          text-align: center;
          font-size: 11px;
          letter-spacing: 3px;
          color: #444;
          text-transform: uppercase;
          font-weight: 300;
          border-top: 1px solid #1a1a1a;
          border-bottom: 1px solid #1a1a1a;
        }

        /* ═══════════════════
           CARDS / GRID
           ═══════════════════ */
        .features, .security {
          padding: 80px 40px;
          display: flex;
          justify-content: center;
        }
        .grid-4 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          max-width: 1200px;
          width: 100%;
        }
        .card {
          background: linear-gradient(180deg, #141414 0%, #0c0c0c 100%);
          border: 1px solid #1a1a1a;
          padding: 35px 28px;
          transition: border-color 0.3s;
        }
        .card:hover { border-color: #333; }
        .card-accent {
          width: 28px;
          height: 2px;
          background: #4a6fa5;
          margin-bottom: 20px;
        }
        .card h3 {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 2px;
          margin-bottom: 14px;
        }
        .card p {
          font-size: 12px;
          color: #555;
          line-height: 1.8;
          font-weight: 300;
        }
        .card-tag {
          display: block;
          font-size: 9px;
          letter-spacing: 2px;
          color: #2a2a2a;
          margin-top: 18px;
          text-transform: uppercase;
          font-weight: 400;
        }

        /* ═══════════════════
           SECURITY
           ═══════════════════ */
        .sec-item {
          padding: 24px 22px;
          border: 1px solid #1a1a1a;
          background: #101010;
          transition: border-color 0.3s;
        }
        .sec-item:hover { border-color: #2a2a2a; }
        .sec-code {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 2px;
          color: #c41e3a;
          margin-bottom: 10px;
        }
        .sec-text {
          font-size: 12px;
          color: #555;
          line-height: 1.7;
          font-weight: 300;
        }

        /* ═══════════════════
           FOOTER
           ═══════════════════ */
        .footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 20px 50px;
        }
        .footer-line {
          width: 100%;
          height: 1px;
          background: #1a1a1a;
          margin-bottom: 60px;
        }
        .footer-tagline {
          font-size: 11px;
          color: #444;
          letter-spacing: 2px;
          margin-top: 30px;
          text-transform: uppercase;
          font-weight: 300;
        }
        .footer-copy {
          font-size: 10px;
          color: #2a2a2a;
          margin-top: 12px;
          letter-spacing: 1px;
          font-weight: 300;
        }

        /* ═══════════════════
           MOBILE
           ═══════════════════ */
        @media (max-width: 900px) {
          .logo-primary.xl { font-size: 60px; }
          .logo-secondary.xl { font-size: 10px; margin-top: 6px; }
          .hero-title { font-size: 36px; }
          .header-nav { display: none; }
          .grid-4 { grid-template-columns: 1fr; }
        }
      `}</style>

    </>
  );
}
