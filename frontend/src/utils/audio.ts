let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let currentMusicSource: AudioBufferSourceNode | null = null;
let musicBufferCache: Map<string, AudioBuffer> = new Map();
let beatInterval: ReturnType<typeof setTimeout> | null = null;

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    musicGain = audioCtx.createGain();
    musicGain.connect(masterGain);
    sfxGain = audioCtx.createGain();
    sfxGain.connect(masterGain);
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function initAudio() {
  getContext();
}

export function setMusicVolume(vol: number) {
  if (musicGain) musicGain.gain.value = vol;
}

export function setSfxVolume(vol: number) {
  if (sfxGain) sfxGain.gain.value = vol;
}

export async function preloadMusic(musicFile: string): Promise<void> {
  if (musicBufferCache.has(musicFile)) return;
  const ctx = getContext();
  const url = `/assets/${musicFile}`;
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  musicBufferCache.set(musicFile, audioBuffer);
}

export function startMusic(
  musicFile: string,
  bpm: number,
  onBeat?: () => void,
  startOffset = 0,
  playbackRate = 1,
) {
  stopMusic();
  const ctx = getContext();
  if (!musicGain) return;

  const buffer = musicBufferCache.get(musicFile);
  if (buffer) {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.playbackRate.value = playbackRate;
    source.connect(musicGain);
    source.start(0, startOffset);
    currentMusicSource = source;
  }

  if (onBeat) {
    const beatMs = ((60 / bpm) * 1000) / playbackRate;
    beatInterval = setInterval(onBeat, beatMs);
  }
}

export function stopMusic() {
  if (currentMusicSource) {
    try {
      currentMusicSource.stop();
      currentMusicSource.disconnect();
    } catch {
      // ignore
    }
    currentMusicSource = null;
  }
  if (beatInterval) {
    clearInterval(beatInterval);
    beatInterval = null;
  }
}

export function playJumpSfx() {
  const ctx = getContext();
  if (!sfxGain) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
}

export function playDeathSfx() {
  const ctx = getContext();
  if (!sfxGain) return;

  const bufferSize = ctx.sampleRate * 0.2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const t = i / ctx.sampleRate;
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 15);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  source.connect(gain);
  gain.connect(sfxGain);
  source.start();

  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(80, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.15);
  oscGain.gain.setValueAtTime(0.3, ctx.currentTime);
  oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.connect(oscGain);
  oscGain.connect(sfxGain);
  osc.start();
  osc.stop(ctx.currentTime + 0.15);
}

export function playCompleteSfx() {
  const ctx = getContext();
  if (!sfxGain) return;

  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const startTime = ctx.currentTime + i * 0.1;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
    osc.connect(gain);
    gain.connect(sfxGain!);
    osc.start(startTime);
    osc.stop(startTime + 0.3);
  });
}
