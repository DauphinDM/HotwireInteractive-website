"""Optional offline DRAFT generation using Argos/OpenNMT model packages.

Install the pinned CPU dependencies in an isolated environment, then pass its
Python executable to scripts/i18n.mjs through HOTWIRE_I18N_PYTHON. Only model
downloads use the network; source/translated copy is processed on this machine.
Whole messages are translated together, never fragments around names/numbers.
Only an explicitly selected candidate file is written, not public catalogues.
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
        return catalog
    model = next(model_root.rglob("model.bin")).parent
    tokenizers = list(model_root.rglob("sentencepiece.model")) + list(model_root.rglob("spm.model"))
    if not tokenizers:
        raise RuntimeError(f"No sentencepiece tokenizer found in {model_root}")
    tokenizer = spm.SentencePieceProcessor(model_file=str(tokenizers[0]))
    translator = ctranslate2.Translator(str(model), device="cpu", compute_type="int8", inter_threads=1, intra_threads=min(4, os.cpu_count() or 1))
    for offset in range(0, len(missing), 16):
        batch = missing[offset:offset + 16]
        results = translator.translate_batch(
            [tokenizer.encode(text, out_type=str) for text in batch],
            beam_size=4, max_decoding_length=512, max_batch_size=1024, batch_type="tokens",
        )
        for source, result in zip(batch, results):
            # Argos packages can expose target-side SentencePiece space markers
            # after decoding with the shared tokenizer (also handled upstream).
            decoded = tokenizer.decode(result.hypotheses[0]).replace("▁", " ").replace("_", " ")
            value = re.sub(r"\s+", " ", decoded).strip()
            if sorted(re.findall(r"\{\w+\}", value)) != sorted(re.findall(r"\{\w+\}", source)) or re.search(r"[▁�⁇]|<unk>", value, re.IGNORECASE):
                print(f"{locale}: manual translation needed; placeholder/tokenizer failure: {source}", flush=True)
                continue
            catalog[source] = value
        if offset % 256 == 0:
            print(f"{locale}: translated {min(offset + 16, len(missing))}/{len(missing)} whole messages locally.", flush=True)
    del translator
    gc.collect()
    return catalog


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-dir", default=os.environ.get("HOTWIRE_I18N_MODELS"))
    parser.add_argument("--download-models", action="store_true", help="Opt in to downloading public Argos models; no copy is uploaded")
    parser.add_argument("--prepare-only", action="store_true")
    parser.add_argument("--output", help="Private review-candidate JSON file; public catalogues are never overwritten")
    args = parser.parse_args()
    if not args.model_dir:
        parser.error("Pass --model-dir or set HOTWIRE_I18N_MODELS. See ai_here/languages.md.")
    if not args.prepare_only and not args.output:
        parser.error("Pass --output PATH for draft candidates. Generation no longer edits publishable catalogues.")
    output = Path(args.output).resolve() if args.output else None
    if output and any(output.is_relative_to(ROOT / directory) for directory in ["public", "dist", "src"]):
        parser.error("Keep review candidates outside public, dist, and src.")
    source = json.loads((ROOT / "src/i18n/messages/en.json").read_text(encoding="utf-8"))
    result = {"provider": "Argos/OpenNMT offline whole-message drafts; review required", "sourceDigest": hashlib.sha256(json.dumps(source, ensure_ascii=False, separators=(",", ":")).encode("utf-8")).hexdigest(), "locales": {}}
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
            result["locales"][locale] = translate_locale(locale, directory)
    if output:
        output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Review candidates saved to {output}. Public catalogues unchanged; review and apply explicitly.", flush=True)
