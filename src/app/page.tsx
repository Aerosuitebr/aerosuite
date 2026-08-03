export default function HomePage() {
  return (
    <main className="wrap">
      <p className="muted" style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 800, fontSize: 12 }}>
        Aerosuite
      </p>
      <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', lineHeight: 1.05, margin: '0.6rem 0' }}>
        Tecnologia para resolver o dia a dia — e prospectar o próximo cliente.
      </h1>
      <p className="muted" style={{ maxWidth: '40rem', lineHeight: 1.65 }}>
        Plataforma mãe do ecossistema: Resolva Jato (hub de ferramentas) e MIRA (busca B2B com base CNPJ).
      </p>

      <div className="grid three" style={{ marginTop: '2.5rem' }}>
        <a className="card" href="https://resolvajato.com.br" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h2 style={{ marginTop: 0 }}>Resolva Jato</h2>
          <p className="muted">Hub de ferramentas gratuitas e freemium.</p>
        </a>
        <a className="card" href="https://search.aerosuite.com.br/escolher-busca" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h2 style={{ marginTop: 0 }}>MIRA</h2>
          <p className="muted">Busca B2B de empresas e profissionais.</p>
        </a>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Ops</h2>
          <p className="muted">Docs de deploy Vultr / Cloudflare em `docs/`.</p>
        </div>
      </div>
    </main>
  );
}
