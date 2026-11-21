'use client';
import { use, useEffect, useState } from 'react';
import Editor from '@/components/Editor';
import { getMaterial } from '@/lib/storage';

export default function Page({ params }) {
  const { id } = use(params);
  const [m, setM] = useState(undefined);
  useEffect(() => { getMaterial(id).then(setM); }, [id]);
  if (m === undefined) return <div className="wrap">Memuat…</div>;
  if (m === null) return <div className="wrap">Materi tidak ditemukan. <a href="/admin">Kembali</a></div>;
  return <Editor initial={m} />;
}
