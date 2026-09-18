"""Create a fictional girl-like timbre locally from the existing Kokoro recordings.

This is processed synthetic speech, not a recording of a real child.
Pitch and tempo are adjusted independently; browser playback remains at 1x.
"""
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
output = root / 'dist' / 'voice-girl'
output.mkdir(exist_ok=True)
for source in sorted((root / 'dist' / 'voice-ai').glob('*.mp3')):
    subprocess.run([
        'ffmpeg', '-y', '-v', 'error', '-i', str(source),
        '-af', 'rubberband=tempo=1.12:pitch=1.28:formant=shifted,highpass=f=100,loudnorm=I=-18:TP=-2:LRA=7',
        '-b:a', '128k', str(output / source.name)
    ], check=True)
print(f'Generated {len(list(output.glob("*.mp3")))} synthetic girl-like voice files')
