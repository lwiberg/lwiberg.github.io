import subprocess
from pathlib import Path

source_dir = Path(r"c:\repos\lwiberg.github.io\projects\showreel")

for mp4_path in source_dir.glob("*.mp4"):
    if mp4_path.name.endswith(".tmp.mp4"):
        continue

    tmp_path = mp4_path.with_suffix(".tmp.mp4")
    cmd = [
        "ffmpeg",
        "-y",
        "-i", str(mp4_path),
        "-vf", "scale=1920:1080",
        "-c:v", "libx264",
        "-crf", "18",
        "-preset", "medium",
        "-c:a", "copy",
        str(tmp_path),
    ]

    print(f"Resizing {mp4_path.name} -> {tmp_path.name}")
    subprocess.run(cmd, check=True)

    if mp4_path.exists():
        mp4_path.unlink()
    tmp_path.rename(mp4_path)