import json
import os
import subprocess


def convert_with_ffmpeg(input_file, output_file, codec):
    """Convert the given file using ffmpeg and specified codec."""
    if codec == "opus":
        subprocess.call(['ffmpeg', '-i', input_file,
                        '-c:a', 'libopus', output_file])
    elif codec == "aac":
        subprocess.call(['ffmpeg', '-i', input_file,
                        '-c:a', 'aac', output_file])


def main(folder_path):
    print(f"Processing folder: {folder_path}")
    # Gather all WAV files
    wav_files = [f for f in os.listdir(folder_path) if f.endswith('.wav')]

    slugged_files = []

    for file in wav_files:
        original_path = os.path.join(folder_path, file)
        slugged_name = os.path.splitext(file)[0]
        slugged_files.append(slugged_name)

        # Convert to ogg opus if doesn't exist
        ogg_opus_path = os.path.join(folder_path, slugged_name + ".ogg")
        if not os.path.exists(ogg_opus_path):
            convert_with_ffmpeg(original_path, ogg_opus_path, "opus")

        # Convert to m4a aac if doesn't exist
        m4a_path = os.path.join(folder_path, slugged_name + ".m4a")
        if not os.path.exists(m4a_path):
            convert_with_ffmpeg(original_path, m4a_path, "aac")

        # os.remove(original_path)

    ogg_files = [f for f in os.listdir(folder_path) if f.endswith('.ogg')]
    samples = []
    for file in ogg_files:
        name = os.path.splitext(file)[0]
        samples.append(name)

    # sort samples
    samples.sort()

    # Write to samples.json
    with open(os.path.join(folder_path, 'samples.json'), 'w') as f:
        json.dump(samples, f)


def list_subfolders(folder_path):
    """List all subfolders of a given folder."""
    return [d for d in os.listdir(folder_path) if os.path.isdir(os.path.join(folder_path, d))]


folders = list_subfolders('audio/mellotron')
print(f"Found {len(folders)} folders.")

with open('audio/mellotron/instruments.json', 'w') as f:
    data = {
        "source": "https://archive.org/details/mellotron-archive-cd-rom-nki-wav.-7z",
        "license": "unknown",
        "instruments": folders}
    json.dump(data, f, indent=4)


for folder in folders:
    print(f"Processing folder: {folder}")
    main(os.path.join('audio/mellotron', folder))
