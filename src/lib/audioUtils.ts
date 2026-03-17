export function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output;
}

export function int16ToFloat32(input: Int16Array): Float32Array {
  const output = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) {
    output[i] = input[i] / (input[i] < 0 ? 0x8000 : 0x7FFF);
  }
  return output;
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export class AudioStreamPlayer {
  context: AudioContext;
  nextTime: number = 0;

  constructor(sampleRate: number = 24000) {
    this.context = new AudioContext({ sampleRate });
  }

  addPCM16(base64: string) {
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    
    const uint8 = base64ToUint8Array(base64);
    const int16 = new Int16Array(uint8.buffer);
    const float32 = int16ToFloat32(int16);

    const buffer = this.context.createBuffer(1, float32.length, this.context.sampleRate);
    buffer.getChannelData(0).set(float32);

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);

    if (this.nextTime < this.context.currentTime) {
      this.nextTime = this.context.currentTime;
    }
    source.start(this.nextTime);
    this.nextTime += buffer.duration;
  }

  stop() {
    this.context.close();
  }
}

export class AudioRecorder {
  context: AudioContext;
  stream: MediaStream;
  processor: ScriptProcessorNode;
  onData: (base64: string) => void;

  constructor(stream: MediaStream, onData: (base64: string) => void) {
    this.stream = stream;
    this.onData = onData;
    this.context = new AudioContext({ sampleRate: 16000 });
    const source = this.context.createMediaStreamSource(stream);
    
    // 4096 buffer size is a good balance between latency and performance
    this.processor = this.context.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const float32 = e.inputBuffer.getChannelData(0);
      const int16 = floatTo16BitPCM(float32);
      const uint8 = new Uint8Array(int16.buffer);
      this.onData(uint8ArrayToBase64(uint8));
    };

    source.connect(this.processor);
    this.processor.connect(this.context.destination); // Required for ScriptProcessor to work
  }

  stop() {
    this.processor.disconnect();
    this.context.close();
    this.stream.getTracks().forEach(t => t.stop());
  }
}
