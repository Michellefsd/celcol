export default function BaseCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
      {children}
    </div>
  );
}
