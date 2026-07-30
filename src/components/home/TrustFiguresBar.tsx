const FIGURES = [
  { value: '15+ years', label: 'operating' },
  { value: '10,000+', label: 'safe trips' },
  { value: '4.8/5', label: 'from 500 reviews' },
  { value: 'Verified', label: 'professional and family friendly drivers' },
];

export default function TrustFiguresBar() {
  return (
    <div className="bg-white border-y border-slate-200">
      <div className="container mx-auto px-4 py-6 md:py-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 md:gap-y-0 md:h-[72px] md:items-center text-center">
          {FIGURES.map((figure) => (
            <div key={figure.label}>
              <div className="text-xl md:text-2xl font-semibold tabular-nums text-ink">
                {figure.value}
              </div>
              <div className="text-sm text-slate-500">{figure.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
