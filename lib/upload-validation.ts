export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
export function imageType(bytes: Buffer) {
  if (bytes.length < 12) throw new Error('Invalid image file');
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
    return 'image/png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP')
    return 'image/webp';
  throw new Error('Upload a PNG, JPG, JPEG, or WEBP image');
}
