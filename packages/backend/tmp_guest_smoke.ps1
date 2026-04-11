$base = 'http://localhost:3002/api'
$ConfirmPreference = 'None'
$ProgressPreference = 'SilentlyContinue'
$ErrorActionPreference = 'Stop'

function Invoke-Test {
  param(
    [string]$Name,
    [string]$Method,
    [string]$Url,
    [object]$Body = $null,
    [hashtable]$Headers = $null
  )

  try {
    if ($null -ne $Body) {
      $json = $Body | ConvertTo-Json -Depth 10
      $resp = Invoke-WebRequest -UseBasicParsing -Uri $Url -Method $Method -Headers $Headers -ContentType 'application/json' -Body $json
    }
    else {
      $resp = Invoke-WebRequest -UseBasicParsing -Uri $Url -Method $Method -Headers $Headers
    }

    $body = [string]$resp.Content
    $bodyShort = $body.Substring(0, [Math]::Min(220, $body.Length))
    [PSCustomObject]@{ name = $Name; status = [int]$resp.StatusCode; ok = $true; body = $bodyShort }
  }
  catch {
    if ($_.Exception.Response) {
      $r = $_.Exception.Response
      $status = [int]$r.StatusCode
      $stream = $r.GetResponseStream()
      $reader = New-Object System.IO.StreamReader($stream)
      $raw = $reader.ReadToEnd()
      $bodyShort = $raw.Substring(0, [Math]::Min(220, $raw.Length))
      [PSCustomObject]@{ name = $Name; status = $status; ok = $false; body = $bodyShort }
    }
    else {
      [PSCustomObject]@{ name = $Name; status = -1; ok = $false; body = $_.Exception.Message }
    }
  }
}

$results = @()
$results += Invoke-Test -Name 'public-popular-cities' -Method 'GET' -Url "$base/search/popular-cities"
$results += Invoke-Test -Name 'public-search' -Method 'GET' -Url "$base/search?city=Cairo&page=1&limit=5"
$results += Invoke-Test -Name 'public-nearby-invalid' -Method 'GET' -Url "$base/search/nearby?lat=200&lng=200"
$results += Invoke-Test -Name 'public-property-1' -Method 'GET' -Url "$base/properties/1"
$results += Invoke-Test -Name 'google-auth-entry' -Method 'GET' -Url "$base/auth/google"

$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$email = "guest$ts@testmail.com"
$pass = 'Password123!'

$register = Invoke-Test -Name 'auth-register' -Method 'POST' -Url "$base/auth/register" -Body @{
  firstName = 'Guest'
  lastName = 'Tester'
  email = $email
  password = $pass
  preferredLanguage = 'en'
}
$results += $register

$login = Invoke-Test -Name 'auth-login' -Method 'POST' -Url "$base/auth/login" -Body @{
  email = $email
  password = $pass
}
$results += $login

$token = $null
try {
  $loginJson = ($login.body | ConvertFrom-Json)
  $token = $loginJson.accessToken
}
catch {}

if (-not $token -and $register.ok) {
  try {
    $regRaw = Invoke-WebRequest -UseBasicParsing -Uri "$base/auth/register" -Method 'POST' -ContentType 'application/json' -Body (@{firstName='G';lastName='T';email=("alt$ts@testmail.com");password=$pass} | ConvertTo-Json)
    $regObj = $regRaw.Content | ConvertFrom-Json
    $token = $regObj.accessToken
  }
  catch {}
}

if ($token) {
  $auth = @{ Authorization = "Bearer $token" }
  $results += Invoke-Test -Name 'auth-me' -Method 'GET' -Url "$base/auth/me" -Headers $auth
  $results += Invoke-Test -Name 'auth-send-verification-email' -Method 'POST' -Url "$base/auth/send-verification-email" -Body @{} -Headers $auth
  $results += Invoke-Test -Name 'auth-send-phone-verification' -Method 'POST' -Url "$base/auth/send-phone-verification" -Body @{ phone = '+201000000000' } -Headers $auth
  $results += Invoke-Test -Name 'bookings-my-trips' -Method 'GET' -Url "$base/bookings/my-trips" -Headers $auth
  $results += Invoke-Test -Name 'notifications-list' -Method 'GET' -Url "$base/notifications" -Headers $auth
  $results += Invoke-Test -Name 'wishlists-list' -Method 'GET' -Url "$base/wishlists" -Headers $auth
  $results += Invoke-Test -Name 'wishlists-create' -Method 'POST' -Url "$base/wishlists" -Body @{ name = 'QA List'; isPublic = $false } -Headers $auth
  $results += Invoke-Test -Name 'saved-searches-list' -Method 'GET' -Url "$base/saved-searches" -Headers $auth
  $results += Invoke-Test -Name 'payments-create-intent-invalid' -Method 'POST' -Url "$base/payments/create-intent" -Body @{ bookingId = 999999; bookingType = 'stay' } -Headers $auth
  $results += Invoke-Test -Name 'bookings-create-invalid-property' -Method 'POST' -Url "$base/bookings" -Body @{ propertyId = 999999; checkIn = '2026-06-10'; checkOut = '2026-06-12'; guestsCount = 2 } -Headers $auth
  $results += Invoke-Test -Name 'bookings-cancel-invalid-id' -Method 'PATCH' -Url "$base/bookings/999999/cancel" -Body @{ reason = 'test' } -Headers $auth
}
else {
  $results += [PSCustomObject]@{ name = 'token-extraction'; status = -1; ok = $false; body = 'Could not get access token from register/login' }
}

$results | ConvertTo-Json -Depth 5
