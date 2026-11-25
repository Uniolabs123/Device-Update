# Device-Update

Browser-based firmware flasher for Unio Labs ESP32 devices, served with GitHub Pages:
https://uniolabs123.github.io/Device-Update/

| File | Purpose |
|---|---|
| `index.html` | Web flasher page (ESP Web Tools) |
| `manifest.json` | Flash manifest (chip family, file offsets) |
| `bootloader.bin`, `partitions.bin`, `firmware.bin` | Images written to the device |

## Usage
Open the page in Chrome/Edge, connect the device over USB, click **Connect**, and follow the prompts.

To release a new build, replace `firmware.bin` (and the other images if they changed) and update `manifest.json`.
