// Search folders in natural name order, continuing past empty/unavailable branches.
export async function findCover(album, { list, sort, active, images = [], visited = new Set() }) {
  if (!active()) return null;
  if (album.imageAlbum) return images[0] || null;
  if (album.mimeType === 'application/pdf' || album.mimeType?.startsWith('image/')) return album;
  if (album.coverFile) return album.coverFile;
  if (visited.has(album.id)) return null;
  visited.add(album.id);
  let data;
  try { data = await list(album.id); } catch { return null; }
  if (!active()) return null;
  const items = sort([...data.files]);
  const media = items.find(file => file.mimeType.startsWith('image/') || file.mimeType === 'application/pdf');
  if (media) return media;
  for (const folder of items.filter(file => file.mimeType === 'application/vnd.google-apps.folder')) {
    if (!active()) return null;
    const file = await findCover(folder, { list, sort, active, images, visited });
    if (file) return file;
  }
  return null;
}
