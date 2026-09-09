import './globals.css';

export const metadata = {
  title: 'Dark Romance Promo',
  description: 'Générateur de vidéos promo pour auteurs de dark romance',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
