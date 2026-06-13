'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

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
      {/* Painel esquerdo — formulário */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-fundo">
        <div className="w-full max-w-[360px]">
          {/* Logo / marca */}
          <div className="mb-8">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-[16px] font-disp mb-5"
              style={{ background: 'linear-gradient(135deg,#0E5F66,#17996B)' }}
            >
              C
            </div>
            <h1 className="font-disp text-[26px] font-bold text-ink">Entrar</h1>
            <p className="text-[13px] text-mut mt-1">Acesse seu painel de marketing</p>
          </div>

          <form onSubmit={entrar} className="flex flex-col gap-4">
            {/* Campo Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-mut uppercase tracking-wide">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                required
                className="w-full px-4 py-3 rounded-2xl border text-[14px] outline-none transition text-ink"
                style={{
                  background: '#fff',
                  borderColor: erro ? '#FECACA' : '#D9E2E5',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#0E5F66')}
                onBlur={e => (e.currentTarget.style.borderColor = erro ? '#FECACA' : '#D9E2E5')}
              />
            </div>

            {/* Campo Senha */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-semibold text-mut uppercase tracking-wide">
                  Senha
                </label>
                <button
                  type="button"
                  className="text-[12px] font-medium"
                  style={{ color: '#0E5F66' }}
                  onClick={() => setErro(null)}
                  title="Esqueceu a senha? Entre em contato com o suporte."
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-2xl border text-[14px] outline-none transition text-ink"
                  style={{
                    background: '#fff',
                    borderColor: erro ? '#FECACA' : '#D9E2E5',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#0E5F66')}
                  onBlur={e => (e.currentTarget.style.borderColor = erro ? '#FECACA' : '#D9E2E5')}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mut text-[18px] leading-none"
                  tabIndex={-1}
                  title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarSenha ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Erro */}
            {erro && (
              <p className="text-[12px] font-medium rounded-xl px-3 py-2.5 text-center"
                style={{ background: '#FEF2F2', color: '#DC2626' }}>
                {erro}
              </p>
            )}

            {/* Botão principal */}
            <button
              type="submit"
              disabled={carregando || !email || !senha}
              className="w-full py-3.5 rounded-2xl text-white font-semibold text-[15px] transition active:scale-[.98] disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#0E5F66,#17996B)' }}
            >
              {carregando ? 'Entrando…' : 'Entrar'}
            </button>

            {/* Divisor */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px" style={{ background: '#E8EDEE' }} />
              <span className="text-[12px] text-mut">ou</span>
              <div className="flex-1 h-px" style={{ background: '#E8EDEE' }} />
            </div>

            {/* Botão Google desabilitado */}
            <div className="relative">
              <button
                type="button"
                disabled
                className="w-full py-3.5 rounded-2xl font-semibold text-[14px] flex items-center justify-center gap-2.5 border disabled:opacity-40 cursor-not-allowed"
                style={{ background: '#fff', borderColor: '#D9E2E5', color: '#475B63' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar com Google
              </button>
              <span
                className="absolute -top-2 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: '#E8EDEE', color: '#6B7E85' }}
              >
                em breve
              </span>
            </div>
          </form>

          {/* Rodapé */}
          <p className="text-center text-[12px] text-mut mt-8">
            Não tem conta?{' '}
            <span className="font-semibold" style={{ color: '#0E5F66' }}>
              Criar conta
            </span>
          </p>
        </div>
      </div>

      {/* Painel direito — gradiente da marca (oculto em mobile) */}
      <div
        className="hidden md:flex flex-1 flex-col items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#0E5F66 0%,#0B4A52 40%,#123A42 100%)' }}
      >
        {/* Círculos decorativos */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: '#17996B', top: '-100px', right: '-120px' }}
        />
        <div
          className="absolute w-[320px] h-[320px] rounded-full opacity-10"
          style={{ background: '#17996B', bottom: '-80px', left: '-60px' }}
        />

        <div className="relative text-center px-10">
          <div className="text-[56px] mb-6">✦</div>
          <h2 className="font-disp text-[32px] font-bold text-white leading-tight mb-4">
            Seu CMO de bolso
          </h2>
          <p className="text-[15px] leading-relaxed max-w-[280px] mx-auto" style={{ color: 'rgba(255,255,255,.7)' }}>
            Posts gerados por IA, aprovados por você, publicados nos seus canais — com 1 toque.
          </p>

          <div className="mt-10 flex flex-col gap-3 text-left">
            {[
              { icon: '📱', text: 'Posts para IG, FB e LinkedIn' },
              { icon: '📰', text: 'Radar de notícias do mercado' },
              { icon: '📅', text: 'Agenda e campanhas visuais' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-[20px]">{icon}</span>
                <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,.85)' }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
