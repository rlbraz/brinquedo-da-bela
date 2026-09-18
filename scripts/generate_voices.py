from __future__ import annotations

import argparse
import os
import subprocess
import tempfile
from pathlib import Path

import soundfile as sf
from kokoro_onnx import Kokoro


PHRASES = {
    "welcome": "Oi Bela, vamos trabalhar?",
    "lion_1": "O leão faz rrrr! Coragem, Bela!",
    "lion_2": "Um rugido fofinho para a Bela!",
    "lion_3": "O leão dourado quer brincar!",
    "dog_1": "Au, au! O cachorrinho chegou!",
    "dog_2": "O cãozinho mandou um beijo para a Bela!",
    "dog_3": "Abana o rabinho, cachorrinho!",
    "cat_1": "Miau! A gatinha quer carinho!",
    "cat_2": "Ronrom, ronrom. Que gostoso, Bela!",
    "cat_3": "A gatinha pulou bem alto!",
    "cow_1": "Muuu! A vaquinha disse olá!",
    "cow_2": "A vaquinha passeia no campo!",
    "cow_3": "Muuu! Muito bem, Bela!",
    "frog_1": "Coax, coax! O sapinho pulou!",
    "frog_2": "Pula, pula, sapinho verde!",
    "frog_3": "O sapinho achou uma flor!",
    "bird_1": "Piu-piu! O passarinho cantou!",
    "bird_2": "Voa, passarinho! Voa até a Bela!",
    "bird_3": "Uma canção alegre para a Bela!",
    "duck_1": "Quá-quá! O patinho chegou!",
    "duck_2": "O patinho nada devagarinho!",
    "duck_3": "Quá-quá! Que alegria, Bela!",
    "elephant_1": "Pruuu! O elefante levantou a tromba!",
    "elephant_2": "Passos grandes e coração fofinho!",
    "elephant_3": "O elefante azul dança com a Bela!",
    "owl_1": "Uhuu! A coruja acordou!",
    "owl_2": "A corujinha viu uma estrela!",
    "owl_3": "Uhuu! Bela é muito esperta!",
    "bunny_1": "O coelhinho pulou bem alto!",
    "bunny_2": "Focinho fofinho e orelhas compridas!",
    "bunny_3": "O coelhinho trouxe uma cenoura!",
    "belina_1": "A princesa Belina trouxe um coração para a Bela!",
    "belina_2": "A princesa Belina abriu as portas do castelo encantado!",
    "estela_1": "A princesa Estela acendeu as estrelas!",
    "estela_2": "A princesa Estela encontrou uma estrela brilhante!",
    "marina_1": "A princesa Marina dança com as ondas!",
    "marina_2": "A princesa Marina encontrou uma concha azul!",
    "flora_1": "A princesa Flora fez o jardim florescer!",
    "flora_2": "A princesa Flora trouxe uma flor cheirosa para a Bela!",
    "celina_1": "A princesa Celina iluminou o céu!",
    "celina_2": "A princesa Celina convidou a Bela para o baile!",
    "rainbow": "Um arco-íris colorido para a Bela!",
    "rain": "Chuvinha gostosa no jardim!",
    "ocean": "O mar faz shhh, shhh, shhh!",
    "stars": "As estrelinhas estão dançando!",
    "garden": "O jardim mágico acordou, Bela!",
}


def main() -> None:
    parser = argparse.ArgumentParser(description="Gera as falas locais do Brinquedo da Bela com Kokoro.")
    parser.add_argument("--model", required=True)
    parser.add_argument("--voices", required=True)
    parser.add_argument("--output", default="dist/voice-ai")
    parser.add_argument("--ffmpeg", default="ffmpeg")
    args = parser.parse_args()

    output_dir = Path(args.output).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    kokoro = Kokoro(args.model, args.voices)

    with tempfile.TemporaryDirectory(prefix="bela-kokoro-") as temp_dir:
        temp_path = Path(temp_dir)
        for index, (name, phrase) in enumerate(PHRASES.items(), start=1):
            samples, sample_rate = kokoro.create(
                phrase,
                voice="pf_dora",
                speed=0.78,
                lang="pt-br",
            )
            wav_path = temp_path / f"{name}.wav"
            mp3_path = output_dir / f"{name}.mp3"
            sf.write(wav_path, samples, sample_rate)
            subprocess.run(
                [
                    args.ffmpeg,
                    "-y",
                    "-v",
                    "error",
                    "-i",
                    os.fspath(wav_path),
                    "-af",
                    "loudnorm=I=-18:TP=-2:LRA=7",
                    "-b:a",
                    "96k",
                    os.fspath(mp3_path),
                ],
                check=True,
            )
            print(f"[{index:02d}/{len(PHRASES)}] {name}.mp3")


if __name__ == "__main__":
    main()

