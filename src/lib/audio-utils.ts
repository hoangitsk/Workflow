export const MAX_SCENE_WORDS = 150;
export function countWords(text: string) { return text.trim() ? text.trim().split(/\s+/).length : 0; }
export function splitScript(text: string): string[] {
  const sentences = text.trim().split(/(?<=[.!?。])\s+|\n+/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/);
    // Very long sentences still respect the model's hard word limit.
    for (let i = 0; i < words.length; i += 140) {
      const part = words.slice(i, i + 140).join(" ");
      if (current && countWords(current) + countWords(part) > 140) { chunks.push(current); current = ""; }
      current = current ? `${current} ${part}` : part;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const channels = buffer.numberOfChannels, length = buffer.length;
  const array = new ArrayBuffer(44 + length * channels * 2), view = new DataView(array);
  const str = (at: number, value: string) => { for (let i=0;i<value.length;i++) view.setUint8(at+i,value.charCodeAt(i)); };
  str(0,"RIFF"); view.setUint32(4,array.byteLength-8,true); str(8,"WAVE"); str(12,"fmt ");
  view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,channels,true);
  view.setUint32(24,buffer.sampleRate,true); view.setUint32(28,buffer.sampleRate*channels*2,true);
  view.setUint16(32,channels*2,true); view.setUint16(34,16,true); str(36,"data"); view.setUint32(40,array.byteLength-44,true);
  const data = Array.from({length:channels},(_,c) => buffer.getChannelData(c));
  let offset=44;
  for(let i=0;i<length;i++) for(let c=0;c<channels;c++) { const s=Math.max(-1,Math.min(1,data[c][i])); view.setInt16(offset,s<0?s*0x8000:s*0x7fff,true); offset+=2; }
  return new Blob([array],{type:"audio/wav"});
}
