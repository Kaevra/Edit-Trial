import './globals.css';
import { fontCss } from '@/lib/template';
export const metadata = { title: 'Carousel Studio' };
export default function Layout({ children }) {
  return (
    <html lang="id">
      <head><style dangerouslySetInnerHTML={{ __html: fontCss() }} /></head>
      <body>{children}</body>
    </html>
  );
}
