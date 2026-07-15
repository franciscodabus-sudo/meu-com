'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type Usuario = { id: string; name: string | null; email: string; createdAt: string };

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const res = await fetch('/api/admin/usuarios');
    setUsuarios(await res.json());
    setCarregando(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    const res = await fetch('/api/admin/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErro(data.error ?? 'Erro ao criar usuário');
    } else {
      setNome(''); setEmail(''); setSenha('');
      carregar();
    }
    setSalvando(false);
  }

  async function excluir(id: string, emailUsuario: string) {
    if (!confirm(`Excluir o usuário ${emailUsuario}?`)) return;
    const res = await fetch(`/api/admin/usuarios/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) alert(data.error);
    else carregar();
  }

  return (
    <main className="min-h-screen bg-bg pb-28 lg:pb-0">
      <div className="max-w-[430px] mx-auto px-4 py-6">

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/configuracoes" className="text-mut hover:text-tx">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-tx">Usuários</h1>
        </div>

        {/* Lista de usuários */}
        <div className="mb-8">
          {carregando ? (
            <p className="text-sm text-mut">Carregando...</p>
          ) : usuarios.length === 0 ? (
            <p className="text-sm text-mut">Nenhum usuário cadastrado.</p>
          ) : (
            <div className="space-y-2">
              {usuarios.map(u => (
                <div key={u.id}
                  className="flex items-center justify-between bg-card rounded-xl px-4 py-3 border border-bord">
                  <div>
                    <p className="text-sm font-medium text-tx">{u.name ?? '—'}</p>
                    <p className="text-xs text-mut">{u.email}</p>
                  </div>
                  <button
                    onClick={() => excluir(u.id, u.email)}
                    className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formulário de criação */}
        <div className="bg-card rounded-2xl p-4 border border-bord">
          <h2 className="text-sm font-semibold text-tx mb-4">Novo usuário</h2>
          <form onSubmit={criar} className="space-y-3">
            <input
              type="text"
              placeholder="Nome (opcional)"
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="w-full bg-bg border border-bord rounded-xl px-3 py-2.5 text-sm text-tx placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              required
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-bg border border-bord rounded-xl px-3 py-2.5 text-sm text-tx placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            <input
              type="password"
              placeholder="Senha"
              value={senha}
              required
              onChange={e => setSenha(e.target.value)}
              className="w-full bg-bg border border-bord rounded-xl px-3 py-2.5 text-sm text-tx placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            {erro && <p className="text-xs text-red-500">{erro}</p>}
            <button
              type="submit"
              disabled={salvando}
              className="w-full bg-accent text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 transition-opacity"
            >
              {salvando ? 'Criando...' : 'Criar usuário'}
            </button>
          </form>
        </div>

      </div>
    </main>
  );
}
