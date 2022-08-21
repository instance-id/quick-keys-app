#!/bin/pwsh

try {
    $currentPath = $PSScriptRoot
    push-location $currentPath

    import-module nvm
    Set-NodeVersion
    yarn run start
} finally {
    pop-location
}