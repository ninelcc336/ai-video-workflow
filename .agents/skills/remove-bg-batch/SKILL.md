---
name: remove-bg-batch
description: Batch-remove image backgrounds and export transparent PNG files. Use this skill whenever the user wants to remove backgrounds from one or more images, process a whole folder of images, generate cutout PNG assets, or build a local background-removal workflow. Default to the skill's built-in input/output folders, but also support user-specified input and output directories.
---

# Remove Background Batch

Use this skill to run a local batch background-removal workflow with `Python` and `rembg`.

## What this skill provides

- A bundled script at `scripts/remove_bg_batch.py`
- A default input folder: `input/`
- A default output folder: `output/`
- Transparent `PNG` output files
- Recursive folder scanning for supported image formats

## Default behavior

If the user does not provide directories, use:

- Input: `<skill-root>/input`
- Output: `<skill-root>/output`

If the user explicitly provides directories, use those instead.

## Supported formats

- `.jpg`
- `.jpeg`
- `.png`
- `.webp`
- `.bmp`
- `.tiff`

## Workflow

1. Determine the input directory and output directory.
2. If the user did not specify them, use the default `input/` and `output/` folders in this skill.
3. Run the bundled script:

```bash
python scripts/remove_bg_batch.py
```

4. If the user specifies directories, run:

```bash
python scripts/remove_bg_batch.py --input "D:\images" --output "D:\images-no-bg"
```

5. Report:
   - the input directory used
   - the output directory used
   - how many files succeeded
   - which files failed, if any

## Dependency handling

The script requires `rembg`.

If it is missing, the script will tell the user to install it:

```bash
pip install rembg
```

If the skill is being shared as a folder, users can also install dependencies from the skill root with:

```bash
pip install -r requirements.txt
```

Do not silently rewrite the tool into another implementation unless the user asks.

## Notes

- Preserve relative subfolder structure when writing output files.
- Always write output files as transparent `.png`.
- If the input directory has no supported images, report that clearly instead of treating it as an error.

## Example requests

- "Batch remove the backgrounds from these images."
- "Use the remove-bg-batch skill on `D:\products\raw` and save to `D:\products\cutouts`."
- "Process the default input folder and export transparent PNGs."

## Distribution notes

- Share the whole `remove-bg-batch/` directory, not just the script.
- Keep the folder structure intact: `SKILL.md`, `SKILL.zh.md`, `scripts/`, `input/`, `output/`, and `requirements.txt`.
- The bundled script derives default directories from its own location, so it remains portable after moving the folder.
