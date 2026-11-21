// SATU-SATUNYA tempat penyimpanan data.
// Versi sekarang: localStorage (data tersimpan di browser masing-masing, belum dibagi ke tim).
// Nanti ganti isi 4 fungsi ini ke Firebase/Firestore (atau database lain); bagian lain tidak perlu diubah.
const K = 'carousel_materials_v1';
const read = () => { try { return JSON.parse(localStorage.getItem(K) || '[]'); } catch { return []; } };
const write = (a) => localStorage.setItem(K, JSON.stringify(a));

export const listMaterials = async () => read();
export const getMaterial = async (id) => read().find((m) => m.id === id) || null;
export const saveMaterial = async (m) => {
  const a = read(); const i = a.findIndex((x) => x.id === m.id);
  m.updatedAt = Date.now();
  if (i < 0) a.push(m); else a[i] = m;
  write(a); return m;
};
export const deleteMaterial = async (id) => write(read().filter((m) => m.id !== id));
