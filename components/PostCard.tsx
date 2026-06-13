'use client';
import { useState } from 'react';
import type { PreviewPost } from './PreviewModal';

export type Post = PreviewPost & {
  whyNow: string | null; stage: string | null;
};

const CORES: Record<string, string> = {
  instagram: 'from-[#175E68] to-[#0E2E35]',
  facebook: 'from-[#1265B5] to-[#0A2F55]',
  linkedin: 'from-[#0A66C2] to-[#083E73]'
};

export default function PostCard({ post, onAprovar, onDone }: {
  post: Post;
  onAprovar: (post: Post) => void;
  onDone: (id: string) => void;
}) {
  const [why, setWhy] = useState(false);
  const [busy, setBusy] = useState(false);

  async function pular() {
    setBusy(true);
    await fetch('/api/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: post.id, action: 'skip' })
    });
    onDone(post.id);
  }

  return (
    <div className="bg-white rounded-card shadow-card p-3.5 mb-3.5">
      <div className={`rounded-2xl p-4 pt-14 min-h-[150px] flex flex-col justify-end bg-gradient-to-br ${CORES[post.channel] ?? 'from-ink to-mut'} text-white relative overflow-hidden`}>
        {post.mediaUrl && (
          <>
            <img src={post.mediaUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <span className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(10,24,28,.18) 20%,rgba(10,24,28,.86))' }} />
          </>
        )}
        <span className="absolute top-3 left-3 bg-white/90 text-ink text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize z-10">
          {post.channel}
        </span>
        <h3 className="font-disp font-semibold text-[17px] leading-snug relative z-10">{post.title}</h3>
      </div>

      {post.whyNow && (
        <button onClick={() => setWhy(!why)} className="text-left w-full text-[12.5px] text-mut pt-2.5 px-1">
          <b className="text-brand">Por que este post?</b> {why ? post.whyNow : 'toque para ver ⌄'}
        </button>
      )}

      <div className="flex gap-2 mt-2.5">
        <button
          disabled={busy}
          onClick={() => onAprovar(post)}
          className="flex-[2] text-white font-semibold rounded-xl py-3 text-sm active:scale-95 transition"
          style={{ background: 'var(--brand-gradient)' }}
        >
          ✓ Aprovar
        </button>
        <button
          disabled={busy}
          onClick={pular}
          className="flex-1 font-semibold rounded-xl py-3 text-sm active:scale-95 transition"
          style={{ background: '#F0E8FA', color: '#7B6B8A' }}
        >
          Pular
        </button>
      </div>
    </div>
  );
}
