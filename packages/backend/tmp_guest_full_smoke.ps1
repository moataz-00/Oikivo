$base = if ($env:API_BASE) { $env:API_BASE } else { 'http://localhost:3002/api' }
$ConfirmPreference = 'None'
$ProgressPreference = 'SilentlyContinue'
$ErrorActionPreference = 'Stop'

$results = New-Object System.Collections.Generic.List[Object]

function Invoke-Test {
  param(
    [string]$Name,
    [string]$Method,
    [string]$Path,
    [object]$Body = $null,
    [hashtable]$Headers = $null,
    [int[]]$Expected = @(200)
  )

  $url = if ($Path.StartsWith('http')) { $Path } else { "$base$Path" }
  $status = -1
  $rawBody = ''
  $shortBody = ''
  $ok = $false

  try {
    if ($null -ne $Body) {
      $json = $Body | ConvertTo-Json -Depth 12
      $resp = Invoke-WebRequest -UseBasicParsing -Uri $url -Method $Method -Headers $Headers -ContentType 'application/json' -Body $json
    }
    else {
      $resp = Invoke-WebRequest -UseBasicParsing -Uri $url -Method $Method -Headers $Headers
    }

    $status = [int]$resp.StatusCode
    $rawBody = [string]$resp.Content
    $ok = $true
  }
  catch {
    if ($_.Exception.Response) {
      $r = $_.Exception.Response
      $status = [int]$r.StatusCode
      $stream = $r.GetResponseStream()
      if ($stream) {
        $reader = New-Object System.IO.StreamReader($stream)
        $rawBody = $reader.ReadToEnd()
      }
      else {
        $rawBody = $_.Exception.Message
      }
    }
    else {
      $status = -1
      $rawBody = $_.Exception.Message
    }
  }

  $shortBody = if ($rawBody) { $rawBody.Substring(0, [Math]::Min(300, $rawBody.Length)) } else { '' }
  $passed = $Expected -contains $status

  $results.Add([PSCustomObject]@{
      name = $Name
      method = $Method
      path = $Path
      url = $url
      status = $status
      expected = ($Expected -join ',')
      pass = $passed
      transportOk = $ok
      body = $shortBody
      rawBody = $rawBody
    })

  return [PSCustomObject]@{ status = $status; rawBody = $rawBody }
}

function Try-Json {
  param([string]$Raw)
  if (-not $Raw) { return $null }
  try { return ($Raw | ConvertFrom-Json) } catch { return $null }
}

function Get-FirstPropertyIdFromSearch {
  param([object]$json)
  if ($null -eq $json) { return $null }

  if ($json.data -and $json.data.items -and $json.data.items.Count -gt 0) {
    return [int]$json.data.items[0].id
  }
  if ($json.items -and $json.items.Count -gt 0) {
    return [int]$json.items[0].id
  }
  if ($json.data -and $json.data.Count -gt 0) {
    return [int]$json.data[0].id
  }
  if ($json.results -and $json.results.Count -gt 0) {
    return [int]$json.results[0].id
  }
  return $null
}

function Get-FirstExperienceIdFromSearch {
  param([object]$json)
  if ($null -eq $json) { return $null }

  if ($json.data -and $json.data.items -and $json.data.items.Count -gt 0) {
    return [int]$json.data.items[0].id
  }
  if ($json.items -and $json.items.Count -gt 0) {
    return [int]$json.items[0].id
  }
  if ($json.data -and $json.data.Count -gt 0) {
    return [int]$json.data[0].id
  }
  return $null
}

# Public + auth-boundary checks
Invoke-Test -Name 'public-search-popular-cities' -Method 'GET' -Path '/search/popular-cities' -Expected @(200) | Out-Null
$searchResp = Invoke-Test -Name 'public-search-main' -Method 'GET' -Path '/search?city=Cairo&page=1&limit=5' -Expected @(200)
Invoke-Test -Name 'public-search-nearby-invalid' -Method 'GET' -Path '/search/nearby?lat=200&lng=200' -Expected @(400) | Out-Null
Invoke-Test -Name 'public-amenities' -Method 'GET' -Path '/amenities' -Expected @(200) | Out-Null
Invoke-Test -Name 'public-categories' -Method 'GET' -Path '/categories' -Expected @(200) | Out-Null
Invoke-Test -Name 'public-property-1' -Method 'GET' -Path '/properties/1' -Expected @(200,404) | Out-Null
Invoke-Test -Name 'public-availability-property-1' -Method 'GET' -Path '/availability/1?year=2026&month=6' -Expected @(200,404) | Out-Null
Invoke-Test -Name 'public-availability-ranges-property-1' -Method 'GET' -Path '/availability/1/ranges?from=2026-06-10&to=2026-06-20' -Expected @(200,404) | Out-Null
Invoke-Test -Name 'public-experiences-search' -Method 'GET' -Path '/experiences/search?city=Cairo&page=1&limit=5' -Expected @(200) | Out-Null
Invoke-Test -Name 'public-experiences-categories' -Method 'GET' -Path '/experiences/categories' -Expected @(200) | Out-Null
Invoke-Test -Name 'public-reviews-property-1' -Method 'GET' -Path '/reviews/property/1?page=1&limit=5' -Expected @(200,404) | Out-Null
Invoke-Test -Name 'public-google-auth-start' -Method 'GET' -Path '/auth/google' -Expected @(200,302) | Out-Null
Invoke-Test -Name 'public-google-callback-direct' -Method 'GET' -Path '/auth/google/callback' -Expected @(200,302) | Out-Null
Invoke-Test -Name 'unauth-me' -Method 'GET' -Path '/auth/me' -Expected @(401) | Out-Null
Invoke-Test -Name 'unauth-wishlists' -Method 'GET' -Path '/wishlists' -Expected @(401) | Out-Null
Invoke-Test -Name 'unauth-bookings-my-trips' -Method 'GET' -Path '/bookings/my-trips' -Expected @(401) | Out-Null
Invoke-Test -Name 'unauth-notifications' -Method 'GET' -Path '/notifications' -Expected @(401) | Out-Null
Invoke-Test -Name 'unauth-saved-searches' -Method 'GET' -Path '/saved-searches' -Expected @(401) | Out-Null
Invoke-Test -Name 'auth-verify-email-no-token' -Method 'GET' -Path '/auth/verify-email' -Expected @(400) | Out-Null
Invoke-Test -Name 'auth-confirm-email-change-no-token' -Method 'GET' -Path '/auth/confirm-email-change' -Expected @(400) | Out-Null
Invoke-Test -Name 'users-host-activation-confirm-no-token' -Method 'GET' -Path '/users/host-activation/confirm' -Expected @(400) | Out-Null

# Register/login flow
$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$email = "guest.full.$ts@testmail.com"
$pass = 'Password123!'

$regResp = Invoke-Test -Name 'auth-register' -Method 'POST' -Path '/auth/register' -Body @{
  firstName = 'Guest'
  lastName = 'FullSweep'
  email = $email
  password = $pass
  preferredLanguage = 'en'
} -Expected @(201)

Invoke-Test -Name 'auth-register-duplicate' -Method 'POST' -Path '/auth/register' -Body @{
  firstName = 'Guest'
  lastName = 'Dup'
  email = $email
  password = $pass
  preferredLanguage = 'en'
} -Expected @(409) | Out-Null

$loginResp = Invoke-Test -Name 'auth-login' -Method 'POST' -Path '/auth/login' -Body @{ email = $email; password = $pass } -Expected @(200,401)
Invoke-Test -Name 'auth-login-wrong-password' -Method 'POST' -Path '/auth/login' -Body @{ email = $email; password = 'WrongPassword123!' } -Expected @(401) | Out-Null

$regJson = Try-Json -Raw $regResp.rawBody
$loginJson = Try-Json -Raw $loginResp.rawBody
$token = $null
$refreshToken = $null

if ($loginJson -and $loginJson.accessToken) {
  $token = $loginJson.accessToken
  $refreshToken = $loginJson.refreshToken
}
elseif ($regJson -and $regJson.accessToken) {
  $token = $regJson.accessToken
  $refreshToken = $regJson.refreshToken
}

if (-not $token) {
  $results.Add([PSCustomObject]@{
      name = 'token-extraction'
      method = 'INTERNAL'
      path = '-'
      url = '-'
      status = -1
      expected = 'token from login/register'
      pass = $false
      transportOk = $false
      body = 'Could not extract access token'
      rawBody = 'Could not extract access token from auth-register/auth-login response bodies.'
    })
}

if ($token) {
  $auth = @{ Authorization = "Bearer $token" }

  # Core authenticated profile/session
  Invoke-Test -Name 'auth-me' -Method 'GET' -Path '/auth/me' -Headers $auth -Expected @(200) | Out-Null
  Invoke-Test -Name 'users-me' -Method 'GET' -Path '/users/me' -Headers $auth -Expected @(200) | Out-Null
  Invoke-Test -Name 'users-update-me' -Method 'PATCH' -Path '/users/me' -Headers $auth -Body @{ firstName = 'GuestQA'; preferredLanguage = 'en' } -Expected @(200) | Out-Null
  Invoke-Test -Name 'auth-sessions' -Method 'GET' -Path '/auth/sessions' -Headers $auth -Expected @(200) | Out-Null
  Invoke-Test -Name 'auth-send-verification-email' -Method 'POST' -Path '/auth/send-verification-email' -Headers $auth -Body @{} -Expected @(200) | Out-Null
  Invoke-Test -Name 'auth-send-phone-verification' -Method 'POST' -Path '/auth/send-phone-verification' -Headers $auth -Body @{} -Expected @(200,400) | Out-Null
  Invoke-Test -Name 'auth-verify-phone-invalid-code' -Method 'POST' -Path '/auth/verify-phone' -Headers $auth -Body @{ code = '000000' } -Expected @(400) | Out-Null
  Invoke-Test -Name 'auth-request-email-change' -Method 'POST' -Path '/auth/request-email-change' -Headers $auth -Body @{ newEmail = "guest.changed.$ts@testmail.com" } -Expected @(200,400) | Out-Null
  Invoke-Test -Name 'auth-change-password-wrong-current' -Method 'POST' -Path '/auth/change-password' -Headers $auth -Body @{ currentPassword = 'WrongPassword123!'; newPassword = 'Password123!A' } -Expected @(400,401) | Out-Null
  Invoke-Test -Name 'auth-set-password-on-password-user' -Method 'POST' -Path '/auth/set-password' -Headers $auth -Body @{ newPassword = 'Password123!A' } -Expected @(400) | Out-Null
  Invoke-Test -Name 'auth-totp-setup' -Method 'POST' -Path '/auth/totp/setup' -Headers $auth -Body @{} -Expected @(200) | Out-Null
  Invoke-Test -Name 'auth-totp-enable-invalid' -Method 'POST' -Path '/auth/totp/enable' -Headers $auth -Body @{ code = '000000' } -Expected @(400) | Out-Null
  Invoke-Test -Name 'auth-google-unlink' -Method 'DELETE' -Path '/auth/google/unlink' -Headers $auth -Expected @(400) | Out-Null

  # Notifications
  $notifResp = Invoke-Test -Name 'notifications-list' -Method 'GET' -Path '/notifications?page=1&limit=10' -Headers $auth -Expected @(200)
  Invoke-Test -Name 'notifications-unread-count' -Method 'GET' -Path '/notifications/unread-count' -Headers $auth -Expected @(200) | Out-Null
  Invoke-Test -Name 'notifications-mark-all-read' -Method 'PATCH' -Path '/notifications/mark-all-read' -Headers $auth -Body @{} -Expected @(200) | Out-Null
  Invoke-Test -Name 'notifications-mark-read-invalid' -Method 'PATCH' -Path '/notifications/999999/read' -Headers $auth -Body @{} -Expected @(404) | Out-Null

  # Wishlists
  Invoke-Test -Name 'wishlists-list' -Method 'GET' -Path '/wishlists' -Headers $auth -Expected @(200) | Out-Null
  $wishlistCreate = Invoke-Test -Name 'wishlists-create' -Method 'POST' -Path '/wishlists' -Headers $auth -Body @{ name = 'Guest QA List'; isPublic = $false } -Expected @(201)
  $wishlistJson = Try-Json -Raw $wishlistCreate.rawBody
  $wishlistId = $null
  if ($wishlistJson -and $wishlistJson.id) { $wishlistId = [int]$wishlistJson.id }
  if ($wishlistId) {
    Invoke-Test -Name 'wishlists-get-one' -Method 'GET' -Path "/wishlists/$wishlistId" -Headers $auth -Expected @(200) | Out-Null
    Invoke-Test -Name 'wishlists-update' -Method 'PATCH' -Path "/wishlists/$wishlistId" -Headers $auth -Body @{ name = 'Guest QA List Updated'; isPublic = $true } -Expected @(200) | Out-Null
    Invoke-Test -Name 'wishlists-add-item-invalid-property' -Method 'POST' -Path "/wishlists/$wishlistId/items" -Headers $auth -Body @{ propertyId = 999999 } -Expected @(404) | Out-Null
    Invoke-Test -Name 'wishlists-rotate-token' -Method 'POST' -Path "/wishlists/$wishlistId/rotate-token" -Headers $auth -Body @{} -Expected @(200,201) | Out-Null
  }

  # Saved searches
  Invoke-Test -Name 'saved-searches-list' -Method 'GET' -Path '/saved-searches' -Headers $auth -Expected @(200) | Out-Null
  $savedCreate = Invoke-Test -Name 'saved-searches-create' -Method 'POST' -Path '/saved-searches' -Headers $auth -Body @{ name = 'Cairo cheap'; filters = @{ city = 'Cairo'; maxPrice = 1500 } } -Expected @(201)
  $savedJson = Try-Json -Raw $savedCreate.rawBody
  if ($savedJson -and $savedJson.id) {
    Invoke-Test -Name 'saved-searches-delete' -Method 'DELETE' -Path ("/saved-searches/" + [int]$savedJson.id) -Headers $auth -Expected @(200) | Out-Null
  }

  # Booking and payment path
  $searchJson = Try-Json -Raw $searchResp.rawBody
  $propertyId = Get-FirstPropertyIdFromSearch -json $searchJson
  if (-not $propertyId) { $propertyId = 1 }

  Invoke-Test -Name 'properties-price-preview' -Method 'GET' -Path "/properties/$propertyId/price-preview?checkIn=2026-06-10&checkOut=2026-06-12&guests=2" -Expected @(200,404,400) | Out-Null
  Invoke-Test -Name 'bookings-my-trips' -Method 'GET' -Path '/bookings/my-trips' -Headers $auth -Expected @(200) | Out-Null
  $bookingCreate = Invoke-Test -Name 'bookings-create' -Method 'POST' -Path '/bookings' -Headers $auth -Body @{ propertyId = $propertyId; checkIn = '2026-06-10'; checkOut = '2026-06-12'; guestsCount = 2 } -Expected @(201,400,403,404,409)

  $bookingId = $null
  $bookingJson = Try-Json -Raw $bookingCreate.rawBody
  if ($bookingJson -and $bookingJson.id) { $bookingId = [int]$bookingJson.id }
  if ($bookingJson -and $bookingJson.data -and $bookingJson.data.id) { $bookingId = [int]$bookingJson.data.id }

  if ($bookingId) {
    Invoke-Test -Name 'bookings-get-one' -Method 'GET' -Path "/bookings/$bookingId" -Headers $auth -Expected @(200) | Out-Null
    Invoke-Test -Name 'bookings-cancellation-preview' -Method 'GET' -Path "/bookings/$bookingId/cancellation-preview" -Headers $auth -Expected @(200) | Out-Null
    Invoke-Test -Name 'bookings-submit-payment' -Method 'PATCH' -Path "/bookings/$bookingId/submit-payment" -Headers $auth -Body @{ method = 'instapay'; reference = 'QA-REF-123'; note = 'guest payment test' } -Expected @(200,400,409) | Out-Null
    Invoke-Test -Name 'payments-create-intent-booking' -Method 'POST' -Path '/payments/create-intent' -Headers $auth -Body @{ bookingId = $bookingId; bookingType = 'stay' } -Expected @(200,400,404,409,503) | Out-Null
    Invoke-Test -Name 'bookings-cancel' -Method 'PATCH' -Path "/bookings/$bookingId/cancel" -Headers $auth -Body @{ reason = 'Guest smoke test cancellation' } -Expected @(200,400,409) | Out-Null
  }
  else {
    Invoke-Test -Name 'bookings-cancel-invalid-id' -Method 'PATCH' -Path '/bookings/999999/cancel' -Headers $auth -Body @{ reason = 'invalid test' } -Expected @(404) | Out-Null
    Invoke-Test -Name 'payments-create-intent-invalid-booking' -Method 'POST' -Path '/payments/create-intent' -Headers $auth -Body @{ bookingId = 999999; bookingType = 'stay' } -Expected @(404) | Out-Null
    Invoke-Test -Name 'payments-refund-invalid-booking' -Method 'POST' -Path '/payments/refund' -Headers $auth -Body @{ bookingId = 999999; bookingType = 'stay'; reason = 'test' } -Expected @(404,400) | Out-Null
  }

  # Experience guest flow
  $expSearchResp = Invoke-Test -Name 'experiences-search-auth-context' -Method 'GET' -Path '/experiences/search?city=Cairo&page=1&limit=5' -Expected @(200)
  Invoke-Test -Name 'experience-bookings-my-trips' -Method 'GET' -Path '/experience-bookings/my-trips' -Headers $auth -Expected @(200) | Out-Null
  $expId = Get-FirstExperienceIdFromSearch -json (Try-Json -Raw $expSearchResp.rawBody)
  if ($expId) {
    Invoke-Test -Name 'experiences-price-preview' -Method 'GET' -Path "/experiences/$expId/price-preview?guests=2" -Expected @(200,400) | Out-Null
    $expBook = Invoke-Test -Name 'experience-bookings-create' -Method 'POST' -Path '/experience-bookings' -Headers $auth -Body @{ experienceId = $expId; date = '2026-07-01'; guests = 2; notes = 'guest qa booking' } -Expected @(201,400,404,409)
    $expBookJson = Try-Json -Raw $expBook.rawBody
    $expBookingId = $null
    if ($expBookJson -and $expBookJson.id) { $expBookingId = [int]$expBookJson.id }
    if ($expBookJson -and $expBookJson.data -and $expBookJson.data.id) { $expBookingId = [int]$expBookJson.data.id }

    if ($expBookingId) {
      Invoke-Test -Name 'experience-bookings-get-one' -Method 'GET' -Path "/experience-bookings/$expBookingId" -Headers $auth -Expected @(200) | Out-Null
      Invoke-Test -Name 'experience-bookings-submit-payment' -Method 'PATCH' -Path "/experience-bookings/$expBookingId/submit-payment" -Headers $auth -Body @{ method = 'instapay'; reference = 'EXP-REF-001' } -Expected @(200,400,409) | Out-Null
      Invoke-Test -Name 'experience-bookings-cancel' -Method 'PATCH' -Path "/experience-bookings/$expBookingId/cancel" -Headers $auth -Body @{ reason = 'guest qa cancel' } -Expected @(200,400,409) | Out-Null
    }
  }

  # Messaging guest path (expected to fail without valid participant/property)
  Invoke-Test -Name 'messages-conversations' -Method 'GET' -Path '/messages/conversations' -Headers $auth -Expected @(200) | Out-Null
  Invoke-Test -Name 'messages-search' -Method 'GET' -Path '/messages/search?q=test&page=1&limit=10' -Headers $auth -Expected @(200) | Out-Null
  Invoke-Test -Name 'messages-unread-count' -Method 'GET' -Path '/messages/unread-count' -Headers $auth -Expected @(200) | Out-Null
  Invoke-Test -Name 'messages-start-conversation-invalid-participant' -Method 'POST' -Path '/messages/conversations' -Headers $auth -Body @{ receiverId = 999999; content = 'Hello from QA guest sweep' } -Expected @(400,404) | Out-Null

  # Auth lifecycle end
  Invoke-Test -Name 'auth-refresh' -Method 'POST' -Path '/auth/refresh' -Body @{ refreshToken = $refreshToken } -Expected @(200,401) | Out-Null
  Invoke-Test -Name 'auth-logout' -Method 'POST' -Path '/auth/logout' -Headers $auth -Body @{} -Expected @(200) | Out-Null
  Invoke-Test -Name 'auth-me-after-logout' -Method 'GET' -Path '/auth/me' -Headers $auth -Expected @(200,401) | Out-Null
}

# Final summary
$summary = [PSCustomObject]@{
  timestamp = (Get-Date).ToString('s')
  total = $results.Count
  passed = (@($results | Where-Object { $_.pass }).Count)
  failed = (@($results | Where-Object { -not $_.pass }).Count)
  serverErrors = @($results | Where-Object { $_.status -ge 500 }).Count
  results = $results
}

$resultsPath = Join-Path (Get-Location) 'tmp_guest_full_smoke_results.json'
$summary | ConvertTo-Json -Depth 15 | Out-File -FilePath $resultsPath -Encoding utf8

Write-Output ('RESULT_FILE=' + $resultsPath)
Write-Output ('TOTAL=' + $summary.total)
Write-Output ('PASSED=' + $summary.passed)
Write-Output ('FAILED=' + $summary.failed)
Write-Output ('SERVER_ERRORS=' + $summary.serverErrors)

if ($summary.failed -gt 0) {
  Write-Output 'FAILED_TESTS_BEGIN'
  $results |
    Where-Object { -not $_.pass } |
    Select-Object name, method, path, status, expected, body |
    ForEach-Object {
      Write-Output (($_ | ConvertTo-Json -Compress))
    }
  Write-Output 'FAILED_TESTS_END'
}
