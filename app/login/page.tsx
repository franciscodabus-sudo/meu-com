'use client';
import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type Stats = { postsHoje: number; canaisAtivos: number; totalPosts: number };

// ── SVG fundo: grade + linhas com degradê da marca ───────────────────────────
function FundoAnimado() {
  return (
    <svg viewBox="0 0 400 600" className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.08 }} aria-hidden>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#8B2FC9"/>
          <stop offset="50%"  stopColor="#D63AA0"/>
          <stop offset="100%" stopColor="#F04E3E"/>
        </linearGradient>
        <style>{`
          @keyframes bp{0%,100%{r:4}50%{r:7}}
          @keyframes bl{0%{stroke-dashoffset:300}100%{stroke-dashoffset:0}}
          .bn{animation:bp 3s ease-in-out infinite;fill:white}
          .bn2{animation:bp 3s ease-in-out infinite 1s;fill:white}
          .bn3{animation:bp 3s ease-in-out infinite 2s;fill:white}
          .bl{stroke:url(#lg);stroke-width:1.2;fill:none;stroke-dasharray:300;animation:bl 5s linear infinite}
          .bl2{stroke:url(#lg);stroke-width:1.2;fill:none;stroke-dasharray:300;animation:bl 5s linear infinite 1.8s}
          .bl3{stroke:url(#lg);stroke-width:1.2;fill:none;stroke-dasharray:300;animation:bl 5s linear infinite 3.2s}
        `}</style>
      </defs>
      {/* Grade de pontos */}
      {[50,100,150,200,250,300,350].flatMap(x =>
        [50,120,190,260,330,400,480,550].map(y => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={1.5} fill="white" opacity={0.5}/>
        ))
      )}
      {/* Linhas animadas */}
      <path className="bl"  d="M200 80 L80 200"/>
      <path className="bl2" d="M200 80 L320 200"/>
      <path className="bl"  d="M80 200 L160 340"/>
      <path className="bl3" d="M320 200 L240 340"/>
      <path className="bl2" d="M160 340 L200 460"/>
      <path className="bl"  d="M240 340 L200 460"/>
      <path className="bl3" d="M80 200 L240 340"/>
      <path className="bl2" d="M320 200 L160 340"/>
      {/* Nós */}
      <circle className="bn"  cx={200} cy={80}  r={6}/>
      <circle className="bn2" cx={80}  cy={200} r={6}/>
      <circle className="bn3" cx={320} cy={200} r={6}/>
      <circle className="bn2" cx={160} cy={340} r={5}/>
      <circle className="bn3" cx={240} cy={340} r={5}/>
      <circle className="bn"  cx={200} cy={460} r={6}/>
    </svg>
  );
}

// ── Logo component (usa imagem se existir, SVG inline como fallback) ──────────
function Logo({ height = 48 }: { height?: number }) {
  const [imgError, setImgError] = useState(false);
  if (!imgError) {
    return (
      <Image
        src="/logo.png"
        alt="Vip Insurance"
        height={height}
        width={height * 3}
        style={{ height, width: 'auto', objectFit: 'contain' }}
        onError={() => setImgError(true)}
        priority
      />
    );
  }
  // Fallback SVG inline
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center justify-center text-white font-bold rounded-xl"
        style={{
          width: height, height, fontSize: height * 0.45,
          background: 'var(--brand-gradient)',
          borderRadius: height * 0.22,
        }}>
        V
      </div>
      <div>
        <p className="font-bold leading-tight" style={{ fontSize: height * 0.38, color: 'white' }}>Vip Insurance</p>
      </div>
    </div>
  );
}

function LogoDark({ height = 48 }: { height?: number }) {
  const [imgError, setImgError] = useState(false);
  if (!imgError) {
    return (
      <Image
        src="/logo.png"
        alt="Vip Insurance"
        height={height}
        width={height * 3}
        style={{ height, width: 'auto', objectFit: 'contain' }}
        onError={() => setImgError(true)}
        priority
      />
    );
  }
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center text-white font-bold rounded-xl"
        style={{
          width: height * 0.8, height: height * 0.8, fontSize: height * 0.38,
          background: 'var(--brand-gradient)',
          borderRadius: height * 0.18,
        }}>
        V
      </div>
      <div>
        <p className="font-bold leading-tight" style={{ fontSize: height * 0.35, color: '#1A0A2E' }}>Vip Insurance</p>
      </div>
    </div>
  );
}

// ── Página de login ───────────────────────────────────────────────────────────
export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/stats').then(r => r.ok ? r.json() : null).then(d => { if (d) setStats(d); });
  }, []);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !senha) return;
    setCarregando(true);
    setErro(null);
    const resultado = await signIn('credentials', {
      redirect: false,
      email: email.trim().toLowerCase(),
      password: senha,
    });
    if (resultado?.ok) {
      router.replace('/');
    } else {
      setErro('E-mail ou senha incorretos. Tente novamente.');
      setCarregando(false);
    }
  }

  return (
    <div className="fixed inset-0 flex" style={{ maxWidth: 'none', zIndex: 50 }}>

      {/* ── PAINEL ESQUERDO — escuro, marketing ── */}
      <div
        className="hidden md:flex flex-[3] flex-col justify-between relative overflow-hidden p-10"
        style={{ background: 'linear-gradient(160deg,#1A0A2E 0%,#110620 60%,#0D051A 100%)' }}
      >
        <FundoAnimado />

        {/* Logo grande no topo */}
        <div className="relative z-10">
          <Logo height={56} />
        </div>

        {/* Headline + features */}
        <div className="relative z-10">
          <h1 className="font-bold text-white text-[40px] leading-[1.12] mb-4 tracking-tight">
            Seu CMO<br />de bolso
          </h1>
          <p className="text-[15px] leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,.55)' }}>
            Posts gerados por IA, aprovados por você,<br />
            publicados nas suas redes — com 1 toque.
          </p>

          <div className="flex flex-col gap-3 mb-10">
            {[
              { icon: '✦', text: 'IA cria posts para IG, FB e LinkedIn' },
              { icon: '📡', text: 'Radar monitora notícias do seu mercado' },
              { icon: '📅', text: 'Agenda e campanhas em um só lugar' },
              { icon: '🎯', text: 'Cenários configuráveis por marca' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-[16px]">{icon}</span>
                <span className="text-[13.5px]" style={{ color: 'rgba(255,255,255,.75)' }}>{text}</span>
              </div>
            ))}
          </div>

          {/* Prova social */}
          {stats !== null && (stats.postsHoje > 0 || stats.canaisAtivos > 0 || stats.totalPosts > 0) && (
            <div className="flex gap-3 flex-wrap">
              {stats.postsHoje > 0 && (
                <div className="px-4 py-3 rounded-2xl" style={{ background: 'rgba(240,78,62,.12)', border: '1px solid rgba(240,78,62,.25)' }}>
                  <p className="text-[22px] font-bold" style={{ color: '#F04E3E' }}>{stats.postsHoje}</p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,.45)' }}>posts hoje</p>
                </div>
              )}
              {stats.canaisAtivos > 0 && (
                <div className="px-4 py-3 rounded-2xl" style={{ background: 'rgba(240,78,62,.12)', border: '1px solid rgba(240,78,62,.25)' }}>
                  <p className="text-[22px] font-bold" style={{ color: '#F04E3E' }}>{stats.canaisAtivos}</p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,.45)' }}>
                    {stats.canaisAtivos === 1 ? 'rede conectada' : 'redes conectadas'}
                  </p>
                </div>
              )}
              {stats.totalPosts > 0 && (
                <div className="px-4 py-3 rounded-2xl" style={{ background: 'rgba(240,78,62,.12)', border: '1px solid rgba(240,78,62,.25)' }}>
                  <p className="text-[22px] font-bold" style={{ color: '#F04E3E' }}>{stats.totalPosts}</p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,.45)' }}>publicados</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="relative z-10">
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,.2)' }}>© 2026 Meu CMO</p>
        </div>
      </div>

      {/* ── PAINEL DIREITO — branco, formulário ── */}
      <div className="flex-[2] flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-[340px]">
          {/* Logo mobile */}
          <div className="md:hidden mb-8">
            <LogoDark height={40} />
          </div>

          <h2 className="font-bold text-[26px] mb-1" style={{ color: '#1A0A2E' }}>Entrar</h2>
          <p className="text-[13px] mb-8" style={{ color: '#7B6B8A' }}>Acesse seu painel de marketing</p>

          <form onSubmit={entrar} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label className="text-[11.5px] font-semibold uppercase tracking-wide block mb-1.5"
                style={{ color: '#7B6B8A' }}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                required
                className="w-full px-4 py-3 rounded-2xl border text-[14px] outline-none transition"
                style={{ background: '#FAF7FF', borderColor: erro ? '#FECACA' : '#EDE6F5', color: '#1A0A2E' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#8B2FC9')}
                onBlur={e => (e.currentTarget.style.borderColor = erro ? '#FECACA' : '#EDE6F5')}
              />
            </div>

            {/* Senha */}
            <div>
              <label className="text-[11.5px] font-semibold uppercase tracking-wide block mb-1.5"
                style={{ color: '#7B6B8A' }}>
                Senha
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-2xl border text-[14px] outline-none transition"
                  style={{ background: '#FAF7FF', borderColor: erro ? '#FECACA' : '#EDE6F5', color: '#1A0A2E' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#8B2FC9')}
                  onBlur={e => (e.currentTarget.style.borderColor = erro ? '#FECACA' : '#EDE6F5')}
                />
                <button type="button" onClick={() => setMostrarSenha(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[18px] leading-none"
                  style={{ color: '#7B6B8A' }} tabIndex={-1}>
                  {mostrarSenha ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Erro */}
            {erro && (
              <p className="text-[12.5px] font-medium rounded-xl px-3 py-2.5 text-center"
                style={{ background: '#FDE8E7', color: '#F04E3E' }}>
                {erro}
              </p>
            )}

            {/* Botão entrar */}
            <button
              type="submit"
              disabled={carregando || !email || !senha}
              className="w-full py-3.5 rounded-2xl text-white font-semibold text-[15px] transition active:scale-[.98] disabled:opacity-50 mt-1"
              style={{ background: 'var(--brand-gradient)' }}
            >
              {carregando ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-[12px] mt-8" style={{ color: '#7B6B8A' }}>
            Acesso restrito. Fale com o administrador.
          </p>
        </div>
      </div>
    </div>
  );
}
