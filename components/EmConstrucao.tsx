type Props = {
  emoji: string;
  titulo: string;
  descricao: string;
  semana: string;
  recursos: string[];
};

export default function EmConstrucao({ emoji, titulo, descricao, semana, recursos }: Props) {
  return (
    <main className="px-4 pt-10 pb-8">
      <div className="text-center mb-8">
        <div
          className="w-20 h-20 rounded-[28px] flex items-center justify-center text-4xl mx-auto mb-5 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #0E5F66, #123A42)' }}
        >
          {emoji}
        </div>
        <h1 className="font-disp text-[22px] font-bold text-ink mb-2">{titulo}</h1>
        <p className="text-[14px] text-mut leading-relaxed max-w-[280px] mx-auto">{descricao}</p>
      </div>

      <div className="bg-white rounded-card shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[12px] font-bold text-mut uppercase tracking-wider">Em desenvolvimento</span>
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: '#E5F1F0', color: '#0E5F66' }}
          >
            {semana}
          </span>
        </div>
        <div className="h-1.5 rounded-full mb-1" style={{ background: '#E8EDEE' }}>
          <div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #0E5F66, #17996B)', width: '30%' }}
          />
        </div>
        <p className="text-[11px] text-soft mt-1.5">Progresso do roadmap</p>
      </div>

      <div className="bg-white rounded-card shadow-sm p-4">
        <p className="text-[12px] font-bold text-mut uppercase tracking-wider mb-3">O que vem por aí</p>
        <div className="flex flex-col gap-2.5">
          {recursos.map((r, i) => (
            <div key={i} className="flex items-start gap-3">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                style={{ background: '#E5F1F0', color: '#0E5F66' }}
              >
                {i + 1}
              </span>
              <p className="text-[13.5px] text-ink">{r}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-[12px] text-soft mt-6">
        ✦ Seu CMO está em construção — volte em breve
      </p>
    </main>
  );
}
