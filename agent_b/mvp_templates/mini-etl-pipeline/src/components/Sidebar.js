import Link from 'next/link';

const sidebarStyle = {
  width: '240px',
  background: '#111c33',
  borderRight: '1px solid rgba(56,189,248,0.25)',
  padding: '20px 0',
  height: '100vh',
  position: 'fixed',
  left: 0,
  top: 0,
  overflowY: 'auto'
};

const navItemStyle = {
  display: 'block',
  padding: '12px 24px',
  color: '#94a3b8',
  textDecoration: 'none',
  fontSize: '14px',
  transition: 'all 0.2s',
  borderLeft: '3px solid transparent'
};

const activeNavItemStyle = {
  ...navItemStyle,
  color: '#38bdf8',
  background: 'rgba(56,189,248,0.1)',
  borderLeftColor: '#38bdf8'
};

const sectionStyle = {
  marginBottom: '32px'
};

const sectionTitleStyle = {
  padding: '0 24px 8px',
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: '#64748b',
  fontWeight: 600
};

export default function Sidebar({ currentPage = 'canvas' }) {
  return (
    <aside style={sidebarStyle}>
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Pipeline</div>
        <Link href="/" style={currentPage === 'canvas' ? activeNavItemStyle : navItemStyle}>
          🎨 Canvas
        </Link>
        <Link href="/inspector" style={currentPage === 'inspector' ? activeNavItemStyle : navItemStyle}>
          ⚙️ Inspector
        </Link>
      </div>
      
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Documentation</div>
        <a 
          href="https://dummyjson.com/docs/products" 
          target="_blank" 
          rel="noopener noreferrer"
          style={navItemStyle}
        >
          📚 API Docs
        </a>
      </div>
    </aside>
  );
}

