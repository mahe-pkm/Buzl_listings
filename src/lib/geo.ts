export function parseEwkbPoint(hex: string | null): { lat: number; lng: number } | null {
  if (!hex || hex.length < 42) return null;
  try {
    const buffer = Buffer.from(hex, 'hex');
    const isLittleEndian = buffer.readUInt8(0) === 1;
    const lng = isLittleEndian ? buffer.readDoubleLE(9) : buffer.readDoubleBE(9);
    const lat = isLittleEndian ? buffer.readDoubleLE(17) : buffer.readDoubleBE(17);
    if (isNaN(lat) || isNaN(lng)) return null;
    return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
  } catch {
    return null;
  }
}
