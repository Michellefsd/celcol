'use client';

type BaseButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
};

export default function BaseButton({ children, onClick, variant = 'primary' }: BaseButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold text-base px-6 py-3 rounded-xl transition-all duration-300 shadow-sm';

  const variants = {
    primary: `
      bg-gradient-to-r from-[#597BFF] to-[#4a6ee0] text-white
      hover:from-[#4a6ee0] hover:to-[#3658d4]
      hover:shadow-lg hover:brightness-110
      transform hover:scale-[1.03]
    `,
    secondary: `
      border border-slate-300 bg-white text-slate-700
      hover:bg-slate-50 hover:border-slate-400
      hover:shadow-md
      transform hover:scale-[1.02]
    `,
  };

  return (
    <button onClick={onClick} className={`${baseClasses} ${variants[variant]}`}>
      {children}
    </button>
  );
}
