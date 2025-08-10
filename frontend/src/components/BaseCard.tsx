export default function BaseCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 border border-slate-200">
      {children}
    </div>
  );
}
