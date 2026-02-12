import { LazyChatWidget, LazyMiaWidget } from './LazyWidgets';
import styles from './page.module.css';

export default function Home() {
  return (
    <>
      {/* Header */}
      <header className={styles['header-bar']}>
        <div className={styles['header-logo']}>
          <div className={styles['logo-primary']}>
            <span>T</span><span>E</span><span>A</span><span>M</span><span>S</span>
          </div>
          <div className={`${styles['logo-secondary']} ${styles.gold}`}>
            <span>T</span><span>E</span><span>C</span><span>H</span><span>N</span><span>O</span><span>L</span><span>O</span><span>G</span><span>Y</span>
          </div>
        </div>
        <nav className={styles['header-nav']}>
          <a href="#">Platform</a>
          <a href="#">Integrations</a>
          <a href="#">Docs</a>
          <a href="#" className={styles['nav-btn']}>Dashboard</a>
        </nav>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles['hero-logo']}>
          <div className={`${styles['logo-primary']} ${styles.xl}`}>
            <span>T</span><span>E</span><span>A</span><span>M</span><span>S</span>
          </div>
          <div className={`${styles['logo-secondary']} ${styles.xl} ${styles.gold}`}>
            <span>T</span><span>E</span><span>C</span><span>H</span><span>N</span><span>O</span><span>L</span><span>O</span><span>G</span><span>Y</span>
          </div>
        </div>

        <div className={styles['hero-content']}>
          <div className={styles['hero-label']}>Voice Assistant</div>
          <h2 className={styles['hero-title']}>Talk to Mia</h2>
          <div className={styles['hero-rule']} />
          <p className={styles['hero-desc']}>
            AI-powered dealership operations and customer experience. Sales, F&amp;I, desking, service, inventory, floor plans, and customer care — all by voice.
          </p>
          <div className={styles['hero-widget']}>
            <LazyMiaWidget />
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className={styles.divider}>Capabilities</div>

      {/* Features */}
      <section className={styles.features}>
        <div className={styles['grid-4']}>
          <div className={styles.card}>
            <div className={styles['card-accent']} />
            <h3>SALES</h3>
            <p>Inventory search, vehicle details, F&amp;I handoff for lender matching, and customer follow-ups — hands-free.</p>
            <span className={styles['card-tag']}>Customer Facing</span>
          </div>
          <div className={styles.card}>
            <div className={styles['card-accent']} />
            <h3>F&amp;I</h3>
            <p>Warranty eligibility, lender products, deal structuring, and contract support.</p>
            <span className={styles['card-tag']}>Finance &amp; Insurance</span>
          </div>
          <div className={styles.card}>
            <div className={styles['card-accent']} />
            <h3>DESKING</h3>
            <p>TEAMS pricing, pack calculations, profit modeling, and deal negotiation support.</p>
            <span className={styles['card-tag']}>Deal Structure</span>
          </div>
          <div className={styles.card}>
            <div className={styles['card-accent']} />
            <h3>SERVICE</h3>
            <p>Active repair orders, service history, and Tekmetric integration across locations.</p>
            <span className={styles['card-tag']}>Service Dept</span>
          </div>
          <div className={styles.card}>
            <div className={styles['card-accent']} />
            <h3>INVENTORY</h3>
            <p>Search by make, model, price, color, or stock number. Real-time HubSpot data.</p>
            <span className={styles['card-tag']}>Voice Search</span>
          </div>
          <div className={styles.card}>
            <div className={styles['card-accent']} />
            <h3>FLOOR PLANS</h3>
            <p>Balances, curtailments, and payoffs across AFC and NextGear floor plan companies (FPCs).</p>
            <span className={styles['card-tag']}>Financial Data</span>
          </div>
          <div className={styles.card}>
            <div className={styles['card-accent']} />
            <h3>CUSTOMER CARE</h3>
            <p>Proactive follow-ups, heat mitigation, complaint resolution, and satisfaction tracking.</p>
            <span className={styles['card-tag']}>Customer Service</span>
          </div>
          <div className={styles.card}>
            <div className={styles['card-accent']} />
            <h3>PERSISTENT MEMORY</h3>
            <p>Mia remembers every conversation. Context, follow-ups, and history across calls.</p>
            <span className={styles['card-tag']}>AI Memory</span>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className={styles.divider}>Security</div>

      {/* Security */}
      <section className={styles.security}>
        <div className={styles['grid-4']}>
          {[
            ['SEC001', 'Server-side identity resolution. Caller role claims ignored.'],
            ['SEC002', 'Field-level RBAC filtering. Financial data gated by verified role.'],
            ['SEC003', '6-digit PIN verification. Three failures triggers 15-minute lockout.'],
            ['SEC004', 'Unverified callers limited to vehicle search and general info only.'],
          ].map(([code, text]) => (
            <div key={code} className={styles['sec-item']}>
              <div className={styles['sec-code']}>{code}</div>
              <div className={styles['sec-text']}>{text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles['footer-line']} />
        <div className={styles['footer-logo']}>
          <div className={`${styles['logo-primary']} ${styles.sm}`}>
            <span>T</span><span>E</span><span>A</span><span>M</span><span>S</span>
          </div>
          <div className={`${styles['logo-secondary']} ${styles.sm} ${styles.gold}`}>
            <span>T</span><span>E</span><span>C</span><span>H</span><span>N</span><span>O</span><span>L</span><span>O</span><span>G</span><span>Y</span>
          </div>
        </div>
        <p className={styles['footer-tagline']}>Dealer infrastructure. Transparent by design.</p>
        <p className={styles['footer-copy']}>&copy; {new Date().getFullYear()} TEAMS Technology. All rights reserved.</p>
      </footer>

      {/* Floating Chat Widget */}
      <LazyChatWidget />
    </>
  );
}
