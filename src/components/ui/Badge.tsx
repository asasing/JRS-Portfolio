interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export default function Badge({ children, color, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${className}`}
      style={color ? { backgroundColor: color + "20", color } : undefined}
    >
      {children}
    </span>
  );
}
