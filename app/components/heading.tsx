import { sriracha } from '@/_fonts';

export default function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className={`text-primary uppercase font-bold text-lg ${sriracha.className}`}>{children}</h2>;
}
