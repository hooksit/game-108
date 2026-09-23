import wave
import math
import struct
import os
import random

os.makedirs('client/public/assets/sounds', exist_ok=True)
SAMPLE_RATE = 44100

def write_wav(filename, samples):
    with wave.open(filename, 'w') as wf:
        wf.setnchannels(1) # mono
        wf.setsampwidth(2) # 16-bit
        wf.setframerate(SAMPLE_RATE)
        packed = b''.join(struct.pack('<h', max(-32767, min(32767, int(s * 32767)))) for s in samples)
        wf.writeframes(packed)
    print(f"Generated {filename} ({len(samples)} samples, {len(samples)/SAMPLE_RATE:.2f}s)")

# 1. deal.wav: Soft card slide/flick across felt
def gen_deal():
    duration = 0.14
    n_samples = int(duration * SAMPLE_RATE)
    samples = []
    # Bandpass filtered noise + soft whoosh
    noise_prev = 0.0
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        # Envelope: fast attack (0.01s), decay to 0
        if t < 0.015:
            env = t / 0.015
        else:
            env = math.exp(-(t - 0.015) * 28)
        
        # Soft noise with low-pass filtering
        raw_noise = random.uniform(-1, 1)
        filtered = noise_prev * 0.75 + raw_noise * 0.25
        noise_prev = filtered
        
        # Subtle pitch slide
        whoosh = math.sin(2 * math.pi * (600 - t * 1500) * t) * 0.15
        val = (filtered * 0.85 + whoosh) * env * 0.5
        samples.append(val)
    return samples

# 2. play.wav: Realistic card snap/click onto table
def gen_play():
    duration = 0.08
    n_samples = int(duration * SAMPLE_RATE)
    samples = []
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        env = math.exp(-t * 65) # Sharp snap decay
        # Crisp card click harmonics: 1400Hz + 850Hz + 320Hz body
        tone1 = math.sin(2 * math.pi * 1350 * t) * 0.5
        tone2 = math.sin(2 * math.pi * 820 * t) * 0.35
        tone3 = math.sin(2 * math.pi * 320 * t) * 0.25
        click = (random.uniform(-1, 1) if t < 0.005 else 0) * 0.3
        val = (tone1 + tone2 + tone3 + click) * env * 0.65
        samples.append(val)
    return samples

# 3. penalty.wav: Ominous low penalty warning tone
def gen_penalty():
    duration = 0.45
    n_samples = int(duration * SAMPLE_RATE)
    samples = []
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        env = math.exp(-t * 6.5)
        # Low dual frequency 196Hz (G3) -> 146Hz (D3)
        freq = 196 - t * 80
        tone1 = math.sin(2 * math.pi * freq * t) * 0.6
        tone2 = math.sin(2 * math.pi * (freq * 1.5) * t) * 0.25
        val = (tone1 + tone2) * env * 0.6
        samples.append(val)
    return samples

# 4. victory.wav: Celebratory warm golden chime arpeggio (C5 - E5 - G5 - C6)
def gen_victory():
    duration = 1.6
    n_samples = int(duration * SAMPLE_RATE)
    samples = [0.0] * n_samples
    notes = [
        (0.00, 523.25), # C5
        (0.18, 659.25), # E5
        (0.36, 783.99), # G5
        (0.54, 1046.50) # C6
    ]
    for start_t, freq in notes:
        start_idx = int(start_t * SAMPLE_RATE)
        for i in range(start_idx, n_samples):
            t = (i - start_idx) / SAMPLE_RATE
            env = math.exp(-t * 3.2)
            # Bell/chime harmonics
            bell = (
                math.sin(2 * math.pi * freq * t) * 0.6 +
                math.sin(2 * math.pi * freq * 2 * t) * 0.25 +
                math.sin(2 * math.pi * freq * 3 * t) * 0.1
            )
            samples[i] += bell * env * 0.25
    return samples

# 5. pass.wav: Subtle gentle wooden tap
def gen_pass():
    duration = 0.07
    n_samples = int(duration * SAMPLE_RATE)
    samples = []
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        env = math.exp(-t * 55)
        tone = math.sin(2 * math.pi * 420 * t) * 0.7
        samples.append(tone * env * 0.4)
    return samples

# 6. message.wav: Pleasant gentle chime for chat messages
def gen_message():
    duration = 0.28
    n_samples = int(duration * SAMPLE_RATE)
    samples = [0.0] * n_samples
    notes = [
        (0.00, 659.25),  # E5
        (0.08, 987.77)   # B5
    ]
    for start_t, freq in notes:
        start_idx = int(start_t * SAMPLE_RATE)
        for i in range(start_idx, n_samples):
            t = (i - start_idx) / SAMPLE_RATE
            env = math.exp(-t * 18.0)
            bell = math.sin(2 * math.pi * freq * t) * 0.65 + math.sin(2 * math.pi * freq * 2 * t) * 0.2
            samples[i] += bell * env * 0.35
    return samples

write_wav('client/public/assets/sounds/deal.wav', gen_deal())
write_wav('client/public/assets/sounds/play.wav', gen_play())
write_wav('client/public/assets/sounds/penalty.wav', gen_penalty())
write_wav('client/public/assets/sounds/victory.wav', gen_victory())
write_wav('client/public/assets/sounds/pass.wav', gen_pass())
write_wav('client/public/assets/sounds/message.wav', gen_message())
print("All realistic sound effects generated successfully.")

