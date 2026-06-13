'use client';
import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type Stats = { postsHoje: number; canaisAtivos: number; totalPosts: number };

// ── SVG animado de rede neural ───────────────────────────────────────────────

function RedeNeural() {
  return (
    <svg
      viewBox="0 0 400 500"
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.18 }}
      aria-hidden
    >
      <defs>
        <style>{`
          @keyframes pulso { 0%,100%{r:5} 50%{r:8} }
          @keyframes brilho { 0%{stroke-dashoffset:200} 100%{stroke-dashoffset:0} }
          .no { animation: pulso 3s ease-in-out infinite; fill: white; }
          .no2 { animation: pulso 3s ease-in-out infinite 1s; fill: white; }
          .no3 { animation: pulso 3s ease-in-out infinite 2s; fill: white; }
          .li { stroke: white; stroke-width: 1; fill: none; stroke-dasharray: 200; animation: brilho 4s linear infinite; }
          .li2 { stroke: white; stroke-width: 1; fill: none; stroke-dasharray: 200; animation: brilho 4s linear infinite 1.5s; }
          .li3 { stroke: white; stroke-width: 1; fill: none; stroke-dasharray: 200; animation: brilho 4s linear infinite 3s; }
        `}</style>
      </defs>

      {/* Linhas de conexão */}
      <path className="li"  d="M200 80 L80 180" />
      <path className="li2" d="M200 80 L320 180" />
      <path className="li"  d="M80 180 L140 300" />
      <path className="li3" d="M320 180 L260 300" />
      <path className="li2" d="M140 300 L200 400" />
      <path className="li"  d="M260 300 L200 400" />
      <path className="li3" d="M80 180 L260 300" />
      <path className="li2" d="M320 180 L140 300" />
      <path className="li"  d="M200 80 L200 400" />

      {/* Grade de pontos de fundo */}
      {[60, 140, 220, 300, 380].flatMap(x =>
        [80, 160, 240, 320, 420].map(y => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={1.5} fill="white" opacity={0.4} />
        ))
      )}

      {/* Nós principais — representam canais e IA */}
      <circle className="no"  cx={200} cy={80}  r={7} />
      <circle className="no2" cx={80}  cy={180} r={7} />
      <circle className="no3" cx={320} cy={180} r={7} />
      <circle className="no2" cx={140} cy={300} r={5} />
      <circle className="no3" cx={260} cy={300} r={5} />
      <circle className="no"  cx={200} cy={400} r={7} />

      {/* Ícones dos nós (texto SVG) */}
      <text x={200} y={76}  textAnchor="middle" fontSize={10} fill="white" fontFamily="sans-serif">IA</text>
      <text x={80}  y={176} textAnchor="middle" fontSize={9}  fill="white" fontFamily="sans-serif">IG</text>
      <text x={320} y={176} textAnchor="middle" fontSize={9}  fill="white" fontFamily="sans-serif">LI</text>
      <text x={200} y={396} textAnchor="middle" fontSize={9}  fill="white" fontFamily="sans-serif">FB</text>
    </svg>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────

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

      {/* ── PAINEL ESQUERDO — escuro, visual/marketing ── */}
      <div
        className="hidden md:flex flex-[3] flex-col justify-between relative overflow-hidden p-10"
        style={{ background: 'linear-gradient(160deg,#0B3D3A 0%,#082E2B 60%,#061F1D 100%)' }}
      >
        <RedeNeural />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-[15px]"
              style={{ background: '#1D9E75' }}
            >✦</div>
            <span className="font-bold text-white text-[17px] tracking-tight">Meu CMO</span>
          </div>
        </div>

        {/* Headline + features */}
        <div className="relative z-10">
          <h1 className="font-bold text-white text-[38px] leading-[1.15] mb-4 tracking-tight">
            Seu CMO<br />de bolso
          </h1>
          <p className="text-[15px] leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,.65)' }}>
            Posts gerados por IA, aprovados por você,<br />publicados nos seus canais — com 1 toque.
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
                <span className="text-[13.5px]" style={{ color: 'rgba(255,255,255,.8)' }}>{text}</span>
              </div>
            ))}
          </div>

          {/* Prova social com dados reais */}
          {stats !== null && (
            <div className="flex gap-4">
              {stats.postsHoje > 0 && (
                <div className="px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,.07)' }}>
                  <p className="text-[22px] font-bold text-white">{stats.postsHoje}</p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,.55)' }}>posts hoje</p>
                </div>
              )}
              {stats.canaisAtivos > 0 && (
                <div className="px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,.07)' }}>
                  <p className="text-[22px] font-bold text-white">{stats.canaisAtivos}</p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,.55)' }}>
                    {stats.canaisAtivos === 1 ? 'rede conectada' : 'redes conectadas'}
                  </p>
                </div>
              )}
              {stats.totalPosts > 0 && (
                <div className="px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,.07)' }}>
                  <p className="text-[22px] font-bold text-white">{stats.totalPosts}</p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,.55)' }}>publicados</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Accent bottom */}
        <div className="relative z-10">
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,.3)' }}>
            © 2026 Meu CMO · Vip Insurance
          </p>
        </div>
      </div>

      {/* ── PAINEL DIREITO — branco, formulário ── */}
      <div className="flex-[2] flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-[340px]">
          {/* Logo mobile (só aparece quando painel esquerdo está oculto) */}
          <div className="md:hidden mb-8 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[13px] font-bold"
              style={{ background: '#1D9E75' }}>✦</div>
            <span className="font-bold text-ink text-[16px]">Meu CMO</span>
          </div>

          <h2 className="font-bold text-ink text-[26px] mb-1">Entrar</h2>
          <p className="text-[13px] text-mut mb-8">Acesse seu painel de marketing</p>

          <form onSubmit={entrar} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label className="text-[11.5px] font-semibold text-mut uppercase tracking-wide block mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                required
                className="w-full px-4 py-3 rounded-2xl border text-[14px] outline-none transition text-ink bg-[#F8FAFA]"
                style={{ borderColor: erro ? '#FECACA' : '#E4ECEE' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#1D9E75')}
                onBlur={e => (e.currentTarget.style.borderColor = erro ? '#FECACA' : '#E4ECEE')}
              />
            </div>

            {/* Senha */}
            <div>
              <label className="text-[11.5px] font-semibold text-mut uppercase tracking-wide block mb-1.5">
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
                  className="w-full px-4 py-3 pr-12 rounded-2xl border text-[14px] outline-none transition text-ink bg-[#F8FAFA]"
                  style={{ borderColor: erro ? '#FECACA' : '#E4ECEE' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#1D9E75')}
                  onBlur={e => (e.currentTarget.style.borderColor = erro ? '#FECACA' : '#E4ECEE')}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mut text-[18px] leading-none"
                  tabIndex={-1}
                >
                  {mostrarSenha ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Erro */}
            {erro && (
              <p className="text-[12.5px] font-medium rounded-xl px-3 py-2.5 text-center"
                style={{ background: '#FEF2F2', color: '#DC2626' }}>
                {erro}
              </p>
            )}

            {/* Botão entrar */}
            <button
              type="submit"
              disabled={carregando || !email || !senha}
              className="w-full py-3.5 rounded-2xl text-white font-semibold text-[15px] transition active:scale-[.98] disabled:opacity-50 mt-1"
              style={{ background: 'linear-gradient(135deg,#0B3D3A,#1D9E75)' }}
            >
              {carregando ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          {/* Rodapé */}
          <p className="text-center text-[12px] text-mut mt-8">
            Não tem conta?{' '}
            <span className="font-semibold" style={{ color: '#0E5F66' }}>Criar conta</span>
          </p>
        </div>
      </div>
    </div>
  );
}
