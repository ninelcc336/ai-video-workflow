# remove-bg-batch

Portable Codex skill for batch background removal with transparent PNG output.

## Folder layout

```text
remove-bg-batch/
  SKILL.md
  SKILL.zh.md
  README.md
  requirements.txt
  input/
  output/
  scripts/
    remove_bg_batch.py
```

## Requirements

- Python 3.10+
- `rembg`

Install dependencies from the skill root:

```bash
pip install -r requirements.txt
```

## Default usage

From the skill root:

```bash
python scripts/remove_bg_batch.py
```

This reads from `input/` and writes transparent PNG files to `output/`.

## Custom directories

```bash
python scripts/remove_bg_batch.py --input "D:\images" --output "D:\images-no-bg"
```

## Notes

- Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.bmp`, `.tiff`
- The script scans input folders recursively
- Output files keep the original relative subfolder structure
- Failed files are reported without stopping the whole batch

## Sharing

Share the entire `remove-bg-batch` directory. The script computes its default paths from its own location, so the skill remains portable after moving it.
