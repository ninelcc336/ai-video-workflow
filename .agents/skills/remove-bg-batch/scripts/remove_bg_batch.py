from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    from rembg import new_session, remove
except ImportError:
    print("Missing dependency: rembg")
    print("Install it with: pip install rembg")
    sys.exit(1)


SKILL_DIR = Path(__file__).resolve().parents[1]
DEFAULT_INPUT_DIR = SKILL_DIR / "input"
DEFAULT_OUTPUT_DIR = SKILL_DIR / "output"
SUPPORTED_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Batch remove image backgrounds and export transparent PNG files."
    )
    parser.add_argument(
        "--input",
        dest="input_dir",
        default=str(DEFAULT_INPUT_DIR),
        help=f"Input directory. Default: {DEFAULT_INPUT_DIR}",
    )
    parser.add_argument(
        "--output",
        dest="output_dir",
        default=str(DEFAULT_OUTPUT_DIR),
        help=f"Output directory. Default: {DEFAULT_OUTPUT_DIR}",
    )
    return parser.parse_args()


def iter_images(folder: Path) -> list[Path]:
    return sorted(
        path
        for path in folder.rglob("*")
        if path.is_file() and path.suffix.lower() in SUPPORTED_SUFFIXES
    )


def build_output_path(source: Path, input_dir: Path, output_dir: Path) -> Path:
    relative_path = source.relative_to(input_dir)
    return output_dir / relative_path.with_suffix(".png")


def main() -> int:
    args = parse_args()
    input_dir = Path(args.input_dir).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve()

    input_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)

    image_paths = iter_images(input_dir)

    print(f"Input directory: {input_dir}")
    print(f"Output directory: {output_dir}")

    if not image_paths:
        print(f"No images found in: {input_dir}")
        print("Put source images into the input folder and run again.")
        return 0

    session = new_session()
    success_count = 0
    failed_paths: list[Path] = []

    for image_path in image_paths:
        output_path = build_output_path(image_path, input_dir, output_dir)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            output_bytes = remove(image_path.read_bytes(), session=session)
            output_path.write_bytes(output_bytes)
            success_count += 1
            print(f"[OK] {image_path} -> {output_path}")
        except Exception as exc:  # noqa: BLE001
            failed_paths.append(image_path)
            print(f"[FAIL] {image_path} :: {exc}")

    print()
    print(f"Finished. Success: {success_count}, Failed: {len(failed_paths)}")

    if failed_paths:
        print("Failed files:")
        for failed_path in failed_paths:
            print(f" - {failed_path}")
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
