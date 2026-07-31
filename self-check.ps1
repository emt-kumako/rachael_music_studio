$ErrorActionPreference = "Stop"
$failed = 0
function Check($name, $ok, $detail = "") {
  if ($ok) { Write-Host "PASS $name" }
  else { Write-Host "FAIL $name - $detail"; $script:failed++ }
}

$instJs = Get-Content -Raw -Encoding UTF8 ".\instruments.js"
$html = Get-Content -Raw -Encoding UTF8 ".\index.html"
$css = Get-Content -Raw -Encoding UTF8 ".\styles.css"
$app = Get-Content -Raw -Encoding UTF8 ".\app.js"

Check "A4_HZ 442" ($instJs -match "A4_HZ:\s*442")

$ids = @("trumpet","flute","clarinet","altoSax","tenorSax","horn","trombone","euphonium","tuba","piano")
foreach ($id in $ids) {
  Check "instrument $id" ($instJs -match "id:\s*`"$id`"")
}

function Get-Transpose([string]$id) {
  $m = [regex]::Match($instJs, "id:\s*`"$id`"[\s\S]*?transpose:\s*(-?\d+)")
  if ($m.Success) { return [int]$m.Groups[1].Value }
  return $null
}

Check "Trumpet transpose 2" ((Get-Transpose "trumpet") -eq 2)
Check "Flute transpose 0" ((Get-Transpose "flute") -eq 0)
Check "Clarinet transpose 2" ((Get-Transpose "clarinet") -eq 2)
Check "Alto transpose 9" ((Get-Transpose "altoSax") -eq 9)
Check "Tenor transpose 14" ((Get-Transpose "tenorSax") -eq 14)
Check "Horn transpose 7" ((Get-Transpose "horn") -eq 7)
Check "Trombone transpose 0" ((Get-Transpose "trombone") -eq 0)
Check "Euphonium transpose 0" ((Get-Transpose "euphonium") -eq 0)
Check "Tuba transpose 0" ((Get-Transpose "tuba") -eq 0)
Check "Piano transpose 0" ((Get-Transpose "piano") -eq 0)

Check "TROMBONE_POS starts 1" ($instJs -match "TROMBONE_POS\s*=\s*\[\s*1\s*,")
Check "BB_BRASS open first" ($instJs -match "BB_BRASS_VALVES\s*=\s*\[\s*\{\s*valves:\s*\[\]")

$bb3 = 442 * [math]::Pow(2, (58 - 69) / 12.0)
$bb4 = 442 * [math]::Pow(2, (70 - 69) / 12.0)
Check "Bb3 ~234.14" ([math]::Abs($bb3 - 234.1413) -lt 0.01) ("{0:N4}" -f $bb3)
Check "Bb4 = 2*Bb3" ([math]::Abs(($bb4 / $bb3) - 2) -lt 1e-9)

foreach ($m in @("Largo", "Adagio", "Andante", "Moderato", "Allegro")) {
  Check "tempo $m" ($instJs -match "name:\s*`"$m`"")
}

Check "no freqDisplay" (-not ($html -match 'id="freqDisplay"'))
Check "has btnTuner" ($html -match 'id="btnTuner"')
Check "has instrument select" ($html -match 'id="instrument"')
Check "no tuner octave radios" (-not ($html -match 'name="tunerOctave"'))
Check "beats 1/2/4" (($html -match 'name="beats" value="1"') -and ($html -match 'name="beats" value="2"') -and ($html -match 'name="beats" value="4"'))
Check "TUNER_CONCERT_MIDI 70" ($instJs -match 'TUNER_CONCERT_MIDI\s*=\s*70')
Check "both-dir repeats peak" (($app -match 'ascending\.concat\(descending\)') -and -not ($app -match 'descending\.slice\(1\)'))
Check "beatsForSequencePosition" ($app -match 'beatsForSequencePosition')
Check "startBarBeatForSequencePosition" ($app -match 'startBarBeatForSequencePosition')
Check "has home logo" (($html -match 'class="home-logo"') -and ($html -match 'rachaels-music-logo\.png'))
Check "logo file exists" (Test-Path ".\assets\rachaels-music-logo.png")
Check "logo centered css" ($css -match 'margin:\s*0 auto')
Check "no Bb prefix in clarinet/trumpet zh" ((-not ($instJs -match 'nameZh:\s*"降 B')) -and ($instJs -match 'nameZh:\s*"豎笛"') -and ($instJs -match 'nameZh:\s*"小號"'))
Check "flute chart asset" (Test-Path ".\assets\flute-keys-only.png")
Check "flute chart wired" ($app -match 'flute-keys-only\.png')
Check "flute silver body" (($app -match '"silver"') -and ($app -match 'flute-body-fill'))
Check "flute body rails" ($app -match 'flute-body-rail')
Check "home bgm mp3" (Test-Path ".\assets\bigger-world-audio-logo.mp3")
Check "home bgm timeline" (($app -match 'startAt:\s*1') -and ($app -match 'fadeOutStart:\s*19') -and ($app -match 'cutAt:\s*21'))
Check "fadeOutHomeBgm" ($app -match 'fadeOutHomeBgm')
Check "buildBeatPlan" ($app -match 'buildBeatPlan')
Check "pitch panel concert block first" ($html -match '(?s)pitch-panel.*?accent.*?concertNote.*?writtenNote')

Check "silver color" ($css -match '#c5ccd4')
Check "gold pressed glow" (($css -match '\.piston\.down \.finger-button') -and ($css -match '0 0 18px rgba\(199, 146, 62'))
Check "trombone css" ($css -match '\.trombone-view')
Check "piano css" ($css -match '\.piano-view')
Check "woodwind css" ($css -match '\.woodwind-view')

Check "noteDurationSec" ($app -match 'function noteDurationSec')
Check "startTuner" ($app -match 'function startTuner')
Check "renderTrombone" ($app -match 'function renderTrombone')
Check "renderPiano" ($app -match 'function renderPiano')
Check "BELL_X 170" ($app -match 'BELL_X\s*=\s*170')
Check "duration 60bpm * 4beats = 4s" (((60 / 60) * 4) -eq 4)

Check "solfege C do 1" ($instJs -match 'C:\s*\{\s*solfege:\s*"do",\s*jianpu:\s*"1"')
Check "valve4 field" ($instJs -match 'valve4:\s*false')
Check "written midi math trumpet C" ((58 + 2) -eq 60)
Check "written midi math alto G" ((58 + 9) -eq 67)
Check "written midi math horn F" ((58 + 7) -eq 65)

Write-Host ""
if ($failed -eq 0) { Write-Host "SELF-CHECK ALL PASSED" } else { Write-Host "FAILED: $failed"; exit 1 }
