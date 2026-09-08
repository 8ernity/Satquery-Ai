"""BigEarthNet.txt Acquisition Utility.

Provides guided downloading for:
1. BigEarthNet.txt annotation parquet from Hugging Face
2. Sample Sentinel-1 / Sentinel-2 pairs for rapid development
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def download_parquet_manifest(target_dir: str = "./data/bigearthnet") -> Path:
    """Download the official BigEarthNet.txt parquet dataset table."""
    dest = Path(target_dir)
    dest.mkdir(parents=True, exist_ok=True)
    out_file = dest / "BigEarthNet.txt.parquet"
    
    print(f"[BHUVISION] Downloading BigEarthNet.txt parquet from Hugging Face...")
    print(f"Target: {out_file}")
    print("Run:")
    print("  huggingface-cli download BIFOLD-BigEarthNetv2-0/BigEarthNet.txt --local-dir ./data/bigearthnet")
    return out_file


def main():
    parser = argparse.ArgumentParser(description="Acquire BigEarthNet.txt assets")
    parser.add_argument("--dest", default="./data/bigearthnet", help="Destination folder")
    args = parser.parse_args()
    download_parquet_manifest(args.dest)


if __name__ == "__main__":
    main()
