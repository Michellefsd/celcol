export default function BaseHeading({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-2xl font-semibold text-[#2C2C2C] mb-4">{children}</h1>
  );
}
