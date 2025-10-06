// src/components/ui/IconButton.tsx
import clsx from 'clsx';
import { ButtonHTMLAttributes, ElementType } from 'react';

type Props = {
  icon: ElementType;
  title: string;
  label?: string;          // etiqueta opcional
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export default function IconButton({
  icon: Icon,
  title,
  label,
  className,
  ...props
}: Props) {
  return (
    <button
      title={title}
      {...props}
      className={clsx(
        'flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-all',
        className
      )}
    >
      <Icon className="w-5 h-5" />
      {label && <span>{label}</span>}
    </button>
  );
}
