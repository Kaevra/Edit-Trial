import { redirect } from 'next/navigation';
// Buka link utama -> langsung masuk halaman admin.
export default function Home() { redirect('/admin'); }
