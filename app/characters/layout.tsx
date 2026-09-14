import AuthGuard from '../../components/AuthGuard';

export default function CharactersLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
