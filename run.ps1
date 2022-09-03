#!/bin/pwsh -nologo

$processes = Get-Process

$log = "${HOME}/quickkeys_runner.log"

try {
    if (!($processes | where ProcessName -CContains 'node')) {
        $currentPath = $PSScriptRoot
        push-location $currentPath

        $command = 'pnpm run start'
        bash -c "screen -S quick_keys -d -m $command 2>&1>$log"
        echo "Started quick keys"
    }
} finally {
    pop-location
}