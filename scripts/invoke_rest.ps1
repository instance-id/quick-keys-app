#!/usr/bin/pwsh -noprofile

[System.Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSAvoidUsingCmdletAliases', '')]
[System.Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseDeclaredVarsMoreThanAssignments', '')]
Param (
    [string]$power = 'off'
)

$basePath = $PSScriptRoot
$config = Import-PowerShellDataFile -Path "${basePath}/config.psd1"

$body = @{ 'state' = "${power}" } | ConvertTo-Json
$header = @{'Content-Type' = 'application/json' }

[Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
$null = Invoke-RestMethod -Uri "$($config.restAddress)/line_source" -Method 'Post' -Body $body -Headers $header | ConvertTo-HTML