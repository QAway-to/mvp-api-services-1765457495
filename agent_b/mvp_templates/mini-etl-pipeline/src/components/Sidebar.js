import Link from 'next/link';

export default function Sidebar({ currentPage }) {
  const navItems = [
    { href: '/', label: 'Pipeline Canvas', icon: '🔄' },
    { href: '/inspector', label: 'Block Inspector', icon: '🔍' }
  ];

  return (
    <aside style={sidebarStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>ETL Pipeline</h2>
        <p style={subtitleStyle}>Visual Data Pipeline</p>
      </div>
      <nav style={navStyle}>
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              ...navItemStyle,
              ...(currentPage === item.href ? activeNavItemStyle : {})
            }}
          >
            <span style={iconStyle}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div style={footerStyle}>
        <p style={footerTextStyle}>PoC Version 1.0</p>
      </div>
    </aside>
  );
}

const sidebarStyle = {
  width: 240,
  background: '#111c33',
  borderRight: '1px solid rgba(56,189,248,0.25)',
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  position: 'fixed',
  left: 0,
  top: 0,
  zIndex: 10
};

const headerStyle = {
  padding: '24px 20px',
  borderBottom: '1px solid rgba(56,189,248,0.15)'
};

const titleStyle = {
  margin: 0,
  fontSize: 20,
  fontWeight: 700,
  color: '#f8fafc'
};

const subtitleStyle = {
  margin: '4px 0 0',
  fontSize: 12,
  color: '#94a3b8'
};

const navStyle = {
  flex: 1,
  padding: '16px 0',
  overflowY: 'auto'
};

const navItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 20px',
  color: '#cbd5f5',
  textDecoration: 'none',
  fontSize: 14,
  transition: 'all 0.2s'
};

const activeNavItemStyle = {
  background: 'rgba(56,189,248,0.15)',
  color: '#38bdf8',
  borderLeft: '3px solid #38bdf8'
};

const iconStyle = {
  fontSize: 18
};

const footerStyle = {
  padding: '16px 20px',
  borderTop: '1px solid rgba(56,189,248,0.15)'
};

const footerTextStyle = {
  margin: 0,
  fontSize: 11,
  color: '#64748b',
  textAlign: 'center'
};

