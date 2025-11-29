import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0b10' }}>
      <Component {...pageProps} />
    </div>
  )
}

