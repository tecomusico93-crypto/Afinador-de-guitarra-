const noteEl = document.getElementById("note");
const freqEl = document.getElementById("freq");
const btn = document.getElementById("startBtn");

let audioContext;
let analyser;

btn.onclick = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);

  analyser = audioContext.createAnalyser();
  source.connect(analyser);

  detectPitch();
};

function detectPitch() {
  const buffer = new Float32Array(2048);
  analyser.getFloatTimeDomainData(buffer);

  const pitch = autoCorrelate(buffer, audioContext.sampleRate);

  if (pitch !== -1) {
    freqEl.textContent = pitch.toFixed(2) + " Hz";
    noteEl.textContent = getNote(pitch);
  }

  requestAnimationFrame(detectPitch);
}

function autoCorrelate(buf, sampleRate) {
  let SIZE = buf.length;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    let val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;

  let r1 = 0, r2 = SIZE - 1;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < 0.2) { r1 = i; break; }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < 0.2) { r2 = SIZE - i; break; }
  }

  buf = buf.slice(r1, r2);
  SIZE = buf.length;

  let c = new Array(SIZE).fill(0);
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE - i; j++) {
      c[i] = c[i] + buf[j] * buf[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < SIZE; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }

  let T0 = maxpos;
  return sampleRate / T0;
}

function getNote(freq) {
  const notes = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const A4 = 440;
  const n = Math.round(12 * Math.log2(freq / A4)) + 57;
  return notes[n % 12];
}