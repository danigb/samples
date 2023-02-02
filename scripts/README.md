## SF2 Format

To convert SF2 format to wav files I've used https://www.polyphone-soundfonts.com/. Select all samples use "Export to wav..." from toolbox. See https://www.polyphone-soundfonts.com/documentation/en/manual/soundfont-editor/tools/sample-tools

I've tried https://www.mossgrabers.de/Software/ConvertWithMoss/ConvertWithMoss.html without success.

## Wav to ogg and mp4

```
for i in *.wav; do ffmpeg -i "$i" -c:a aac -b:a 128k "${i%.*}.m4a"; done
for i in *.wav; do ffmpeg -i "$i" -c:a libopus -b:a 64k "${i%.*}.ogg"; done
```
