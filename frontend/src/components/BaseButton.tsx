'use client';

export default function BaseButton({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-[#597BFF] text-white px-4 py-2 rounded-xl hover:bg-[#4a6ee0] transition"
    >
      {children}
    </button>
  );
}
