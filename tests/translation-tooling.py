"""Optional offline-tool regression; standard library only, no model downloads."""
import contextlib
import io
import json
from pathlib import Path
import tempfile
import types
import unittest
from unittest.mock import patch


class WholeMessageDraftTest(unittest.TestCase):
    def test_whole_messages_are_preserved_and_catalogues_are_not_written(self):
        script = Path(__file__).resolve().parent.parent / "scripts/translate-catalogs.py"
        namespace = {"__file__": str(script), "__name__": "offline_translator_test"}
        exec(compile(script.read_text(encoding="utf-8"), str(script), "exec"), namespace)
        seen = []

        class Tokenizer:
            def __init__(self, **kwargs):
                pass

            def encode(self, text, out_type):
                seen.append(text)
                return [text]

            def decode(self, tokens):
                return tokens[0]

        class Translator:
            def __init__(self, *args, **kwargs):
                pass

            def translate_batch(self, batch, **kwargs):
                return [types.SimpleNamespace(hypotheses=[[
                    "Hallo" if item[0] == "Hello {name}" else "Starter vanaf €500 met een ontvangen aanbetaling van 50%."
                ]]) for item in batch]

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            catalog_file = root / "src/i18n/messages/nl.json"
            catalog_file.parent.mkdir(parents=True)
            source = {"Starter from €500 with a cleared 50% deposit.": "", "Hello {name}": "", "Existing editorial sentence.": "Bestaande redactionele vertaling."}
            catalog_file.write_text(json.dumps(source), encoding="utf-8")
            model = root / "models/nl"
            model.mkdir(parents=True)
            (model / "model.bin").touch()
            (model / "sentencepiece.model").touch()
            namespace["ROOT"] = root
            with patch.dict("sys.modules", {
                "ctranslate2": types.SimpleNamespace(Translator=Translator),
                "sentencepiece": types.SimpleNamespace(SentencePieceProcessor=Tokenizer),
            }), contextlib.redirect_stdout(io.StringIO()):
                candidates = namespace["translate_locale"]("nl", model)
            self.assertEqual(seen, list(source)[:2])
            self.assertEqual(json.loads(catalog_file.read_text(encoding="utf-8")), source)
            self.assertEqual(candidates["Existing editorial sentence."], source["Existing editorial sentence."])
            self.assertEqual(candidates["Hello {name}"], "")
            self.assertIn("50%", candidates[list(source)[0]])


if __name__ == "__main__":
    unittest.main()
