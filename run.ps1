#!/bin/pwsh

try {
    $currentPath = $PSScriptRoot
    push-location $currentPath

    import-module nvm
    Set-NodeVersion
    pnpm run start
} finally {
    pop-location
}