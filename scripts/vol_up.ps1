#!/usr/bin/env -S pwsh -noProfile -nologo

$sink = $(pactl list short sinks | cut -f 2) 
$output = $sink | where  {$_ -match 'hdmi-stereo'}

pactl set-sink-volume $output +2% > /dev/null 2>&1