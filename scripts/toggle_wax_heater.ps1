#!/usr/bin/env -S pwsh -noProfile -nologo

param()

$basePath = $PSScriptRoot
$zigbee2MqttREST = "${basePath}/invoke_rest.ps1"

& $zigbee2MqttREST -endpoint wax_heater -power "toggle"
