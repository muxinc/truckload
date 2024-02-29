export default function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className={`text-primary uppercase font-bold text-lg font-sans`}>{children}</h2>;
}
