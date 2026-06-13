// UI Elements
const installBtn = document.getElementById('install-btn');
const firmwareSelect = document.getElementById('firmware-select');
const terminalOutput = document.getElementById('terminal-output');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const progressPercentage = document.getElementById('progress-percentage');

function log(message, type = 'info') {
    const div = document.createElement('div');
    div.textContent = `> ${message}`;
    div.className = `log-${type}`;
    terminalOutput.appendChild(div);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function setProgress(percent, text) {
    if (progressContainer.classList.contains('hidden')) {
        progressContainer.classList.remove('hidden');
        progressContainer.classList.remove('opacity-0');
    }
    progressBar.style.width = `${percent}%`;
    progressPercentage.textContent = `${percent}%`;
    if (text) progressText.textContent = text;
}

async function rebootToBootloader() {
    log('Attempting to reboot device to BOOTSEL mode...', 'highlight');
    try {
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 1200 });
        await port.close();
        log('1200 baud touch sent. Device should reboot into RPI-RP2 drive in 2 seconds...', 'success');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return true;
    } catch (err) {
        log(`Serial reboot skipped: ${err.message}`, 'warning');
        log('Please manually hold the BOOTSEL button and plug in your Pico.', 'warning');
        return false;
    }
}

async function flashFirmwareFS(firmwareUrl) {
    try {
        // MUST call showDirectoryPicker immediately on click due to Chrome security!
        let directoryHandle;
        try {
            directoryHandle = await window.showDirectoryPicker({
                mode: 'readwrite'
            });
        } catch (err) {
            throw new Error("Folder selection was cancelled or blocked by browser.");
        }

        log(`Drive selected: ${directoryHandle.name}`, 'success');

        if (directoryHandle.name !== "RPI-RP2" && !directoryHandle.name.includes("RP2") && !directoryHandle.name.includes("USB")) {
            log('Warning: You might not have selected the RPI-RP2 drive. Attempting to write anyway...', 'warning');
        }

        log(`Fetching firmware: ${firmwareUrl}...`);
        setProgress(10, 'Downloading firmware...');
        const response = await fetch(firmwareUrl);
        if (!response.ok) throw new Error(`Failed to fetch firmware: ${response.statusText}`);
        
        const firmwareBlob = await response.blob();
        log(`Firmware downloaded (${(firmwareBlob.size / 1024).toFixed(1)} KB).`, 'success');

        setProgress(30, 'Creating file on Pico...');
        log('Creating update file on device...');

        const fileHandle = await directoryHandle.getFileHandle('update.uf2', { create: true });
        
        setProgress(50, 'Writing firmware...');
        log('Writing firmware data to device...');
        
        const writable = await fileHandle.createWritable();
        await writable.write(firmwareBlob);
        await writable.close();

        setProgress(100, 'Flashing complete!');
        log('Firmware written successfully!', 'success');
        log('The Pico will now automatically reboot and disappear from your computer.', 'highlight');

        // Reset UI
        installBtn.querySelector('span:last-child').textContent = 'Install Firmware';
        installBtn.disabled = false;
        installBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-green-600');
        installBtn.classList.add('bg-primary');
        currentStep = 1;

    } catch (err) {
        setProgress(0, 'Error occurred');
        log(`Flashing error: ${err.message}`, 'error');
        console.error(err);
        
        // Reset UI on error
        installBtn.querySelector('span:last-child').textContent = 'Install Firmware';
        installBtn.disabled = false;
        installBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-green-600');
        installBtn.classList.add('bg-primary');
        currentStep = 1;
    }
}

// Track application state
let currentStep = 1;
let selectedFirmware = "";

// Main Execution Flow
installBtn.addEventListener('click', async () => {
    if (!('showDirectoryPicker' in window)) {
        log('Your browser does not support the File System Access API. Please use Google Chrome or Edge.', 'error');
        return;
    }

    if (currentStep === 1) {
        // STEP 1: Reboot the Pico
        installBtn.disabled = true;
        installBtn.classList.add('opacity-50', 'cursor-not-allowed');
        progressContainer.classList.add('hidden');
        progressBar.style.width = '0%';
        
        log('--- Starting Installation Process ---', 'highlight');
        selectedFirmware = firmwareSelect.value;
        
        if ('serial' in navigator) {
            await rebootToBootloader();
        }

        // Prepare UI for Step 2
        log('Waiting for user to select the RPI-RP2 drive...', 'highlight');
        installBtn.querySelector('span:last-child').textContent = 'Step 2: Select Drive & Flash';
        installBtn.classList.remove('bg-primary', 'opacity-50', 'cursor-not-allowed');
        installBtn.classList.add('bg-green-600');
        installBtn.disabled = false;
        currentStep = 2;

    } else if (currentStep === 2) {
        // STEP 2: Pick Directory & Flash
        // This runs immediately upon the second click, satisfying Chrome's security rule.
        installBtn.disabled = true;
        installBtn.classList.add('opacity-50', 'cursor-not-allowed');
        await flashFirmwareFS(selectedFirmware);
    }
});
