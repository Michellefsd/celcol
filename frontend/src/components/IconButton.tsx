// src/components/ui/IconButton.tsx
import clsx from 'clsx';
import { ButtonHTMLAttributes, ElementType } from 'react';

type Props = {
  icon: ElementType;
  title: string;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export default function IconButton({ icon: Icon, title, className, ...props }: Props) {
  return (
    <button
      title={title}
      className={clsx(
        'p-1 rounded hover:bg-gray-100 transition-all duration-200 ease-in-out',
        className
      )}
      {...props}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}
