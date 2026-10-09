import * as zlib from 'zlib';

export function extrairTextoDocx(buffer: Buffer): string | null {
  let offset = 0;
  while (offset + 30 < buffer.length) {
    if (buffer.readUInt32LE(offset) !== 0x04034b50) {
      offset += 1;
      continue;
    }
    const method = buffer.readUInt16LE(offset + 8);
    const compSize = buffer.readUInt32LE(offset + 18);
    const nameLen = buffer.readUInt16LE(offset + 26);
    const extraLen = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const name = buffer.slice(nameStart, nameStart + nameLen).toString('utf8');
    const dataStart = nameStart + nameLen + extraLen;
    if (name === 'word/document.xml' && compSize > 0 && dataStart + compSize <= buffer.length) {
      const compressed = buffer.slice(dataStart, dataStart + compSize);
      const xml = method === 0 ? compressed.toString('utf8') : zlib.inflateRawSync(compressed).toString('utf8');
      return xml
        .replace(/<w:p[^>]*>/g, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }
    if (compSize === 0) return null;
    offset = dataStart + compSize;
  }
  return null;
}
