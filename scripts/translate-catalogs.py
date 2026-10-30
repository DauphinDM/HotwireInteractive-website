"""Offline, missing-entry-only translation using Argos/OpenNMT model packages.

Install the pinned CPU dependencies in an isolated environment, then pass its
Python executable to scripts/i18n.mjs through HOTWIRE_I18N_PYTHON. Only model
downloads use the network; source/translated copy is processed on this machine.
"""
import argparse
import gc
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parent.parent
# Public Argos package mirror, pinned revision and SHA-256 (repository declares MIT).
MODEL_REVISION = "0fbbd0e16e6b24c56685217b8a0b3bbffc9775c7"
MODEL_BASE = f"https://huggingface.co/TiberiuCristianLeon/Argostranslate/resolve/{MODEL_REVISION}"
MODELS = {
    "nl": "91406f040619fb519e16af9c304709e9f3195297e626eec6924d62c7c981a33b",
    "fr": "3a65ed83364f4e7b06e30f9dd823db1934899ed3ce839e63f46dc7b09dc797b4",
    "de": "0e3446449aef7bcac9db685b86697bfcc27ecb3afd834583e8042f6125a42f53",
}
PROTECTED = re.compile(
    r"(\{\w+\}|\||https?://\S+|[\w.+-]+@[\w.-]+\.[A-Za-z]+|"
    r"Hotwire Interactive|Hotwire|Dauphin de Moulin|Liam van Looveren|"
    r"Max Hermanelei 55|Brasschaat 2930|Webhero|JouwWeb|Webflux|"
    r"Fieldwork|Forma|Objects|Still|Starter|Growth|Scale|Enterprise|"
    r"Google Fonts|Manrope|Space Grotesk|GDPR|CMS|API|PHP|EUR|"
    r"€?\d[\d.,]*\+?%?)"
)


def download_model(locale, cache):
    destination = cache / locale
    if list(destination.rglob("model.bin")):
        return destination
    archive = cache / (locale + ".argosmodel")
    if not archive.exists():
        print(f"Downloading public English→{locale} model (no website text is sent).", flush=True)
        request = urllib.request.Request(f"{MODEL_BASE}/en_{locale}.argosmodel", headers={"User-Agent": "Hotwire-i18n-build/1.0"})
        with urllib.request.urlopen(request, timeout=120) as response, archive.with_suffix(".part").open("wb") as output:
            shutil.copyfileobj(response, output)
        archive.with_suffix(".part").replace(archive)
    with archive.open("rb") as contents:
        if hashlib.file_digest(contents, "sha256").hexdigest() != MODELS[locale]:
            raise RuntimeError(f"Model integrity check failed: {archive}")
    with zipfile.ZipFile(archive) as package:
        for item in package.infolist():
            if Path(item.filename).is_absolute() or ".." in Path(item.filename).parts:
                raise RuntimeError("Unsafe path in model archive")
        package.extractall(destination)
    return destination


def translate_locale(locale, model_root):
    import ctranslate2
    import sentencepiece as spm

    file = ROOT / "src" / "i18n" / "messages" / (locale + ".json")
    catalog = json.loads(file.read_text(encoding="utf-8"))
    missing = [key for key, value in catalog.items() if not value]
    if not missing:
        print(f"{locale}: no missing translations; existing editorial changes preserved.", flush=True)
        return
    model = next(model_root.rglob("model.bin")).parent
    tokenizers = list(model_root.rglob("sentencepiece.model")) + list(model_root.rglob("spm.model"))
    if not tokenizers:
        raise RuntimeError(f"No sentencepiece tokenizer found in {model_root}")
    tokenizer = spm.SentencePieceProcessor(model_file=str(tokenizers[0]))
    translator = ctranslate2.Translator(str(model), device="cpu", compute_type="int8", inter_threads=1, intra_threads=min(4, os.cpu_count() or 1))
    pieces_by_key = {key: PROTECTED.split(key) for key in missing}
    fragments = set()
    for parts in pieces_by_key.values():
        for index in range(0, len(parts), 2):
            text = parts[index].strip()
            if re.search(r"[A-Za-z]", text):
                fragments.add(text)
    fragments = sorted(fragments)
    translated = {}
    for offset in range(0, len(fragments), 32):
        batch = fragments[offset:offset + 32]
        results = translator.translate_batch(
            [tokenizer.encode(text, out_type=str) for text in batch],
            beam_size=2, max_decoding_length=512, max_batch_size=1024, batch_type="tokens",
        )
        for source, result in zip(batch, results):
            # Argos packages can expose target-side SentencePiece space markers
            # after decoding with the shared tokenizer (also handled upstream).
            decoded = tokenizer.decode(result.hypotheses[0]).replace("▁", " ").replace("_", " ")
            translated[source] = re.sub(r"\s+", " ", decoded).strip() or source
        if offset % 256 == 0:
            print(f"{locale}: translated {min(offset + 32, len(fragments))}/{len(fragments)} unique fragments locally.", flush=True)
    for key, parts in pieces_by_key.items():
        for index in range(0, len(parts), 2):
            raw = parts[index]
            stripped = raw.strip()
            if stripped in translated:
                left = raw[:len(raw) - len(raw.lstrip())]
                right = raw[len(raw.rstrip()):]
                parts[index] = left + translated[stripped] + right
        value = "".join(parts)
        if sorted(re.findall(r"\{\w+\}", value)) != sorted(re.findall(r"\{\w+\}", key)):
            raise RuntimeError(f"Placeholder changed: {key}")
        if re.search(r"[▁�⁇]|<unk>", value, re.IGNORECASE):
            raise RuntimeError(f"Tokenizer artifact; translate this entry manually: {key}")
        catalog[key] = value
    file.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{locale}: saved {len(missing)} new draft translations; review before publication.", flush=True)
    del translator
    gc.collect()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-dir", default=os.environ.get("HOTWIRE_I18N_MODELS"))
    parser.add_argument("--download-models", action="store_true", help="Opt in to downloading public Argos models; no copy is uploaded")
    parser.add_argument("--prepare-only", action="store_true")
    args = parser.parse_args()
    if not args.model_dir:
        parser.error("Pass --model-dir or set HOTWIRE_I18N_MODELS. See ai_here/languages.md.")
    cache = Path(args.model_dir).resolve()
    cache.mkdir(parents=True, exist_ok=True)
    for locale in MODELS:
        if args.download_models:
            directory = download_model(locale, cache)
        else:
            directory = cache / locale
            if not list(directory.rglob("model.bin")):
                parser.error(f"Missing {locale} model. Use --download-models once to opt in to its download.")
        if not args.prepare_only:
            translate_locale(locale, directory)
