import './globals.css'; // Assuming a global CSS file might be needed

export const metadata = {
  title: 'QR Cashback Redemption',
  description: 'Redeem your cashback easily',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
