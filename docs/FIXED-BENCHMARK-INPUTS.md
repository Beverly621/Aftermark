# Task 02-B — Fixed G02 and G06 Benchmark Inputs

These two benchmark inputs are now frozen.

Do not substitute different portrait/night images between providers or tuning passes.

## G02 — Single Person / Casual Portrait

**Frozen asset:** `G02_PORTRAIT_CC0.jpg`

- Source title: Texting Woman Phone
- Creator: Kristin Hardwick
- License: CC0 1.0
- Source page: https://negativespace.co/texting-woman-phone/
- Direct image: https://negativespace.co/wp-content/uploads/2022/05/negative-space-woman-smartphone-communication.jpg

Why this input:
- one real person in an ordinary mobile/lifestyle context
- not a polished studio headshot
- useful skin/clothing/background palette
- intentionally off-center, so center-label crop robustness is exercised
- good test of keeping doodles away from the person in the protected center

## G06 — Night / Low Saturation

**Frozen asset:** `G06_NIGHT_LOW_SATURATION_CC0.jpg`

- Source title: Street at night, black and white
- Creator: www.Pixel.la Free Stock Photos
- License: CC0 1.0
- Source page: https://commons.wikimedia.org/wiki/File:Street_at_night,_black_and_white.jpg
- Direct image: https://upload.wikimedia.org/wikipedia/commons/9/92/Street_at_night%2C_black_and_white.jpg

Why this input:
- true night scene
- genuinely low-saturation / black-and-white
- forces the generator to derive a restrained structural palette
- tests whether the 10% surprise accent remains intentional rather than turning into rainbow noise
- tests acrylic marker visibility against dark Classic vinyl

## Freeze Procedure

Codex should:

1. Download each asset once from the exact direct URL above.
2. Save it under `assets/benchmark-inputs/` with the exact frozen filename.
3. Compute and record SHA-256 after download.
4. Add the hashes to the benchmark manifest.
5. Use those local files for every provider and every later tuning pass.
6. Do not re-download on each benchmark run.
7. Do not silently substitute another image if download fails.
8. Keep the CC0 provenance information beside the assets.
9. Do not modify README.

After the files are present locally, the initial benchmark set is:

- G01 — existing coast landscape
- G02 — frozen casual portrait above
- G06 — frozen black-and-white night street above

Each runs:
- `text_led`
- `motif_led`

Across:
- OpenAI
- Gemini
- FLUX

Total planned real benchmark renders: **18**.
