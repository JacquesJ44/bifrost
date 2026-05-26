param(
    [string]$ApiUrl = "http://localhost:5000/api/signup",
    [string]$UserAgent = "Mozilla/5.0",
    [string]$PackageName = "Test Package",
    [string]$EmailDomain = "gmail.com"
)

$ErrorActionPreference = "Stop"

function New-IsoTimestampSecondsAgo {
    param([int]$SecondsAgo)
    return (Get-Date).ToUniversalTime().AddSeconds(-$SecondsAgo).ToString("o")
}

function Get-ValidSignupSeed {
    param(
        [string]$SignupEndpointUrl,
        [string]$Domain,
        [string]$PkgName
    )

    $baseUri = [System.Uri]$SignupEndpointUrl
    $apiRoot = "$($baseUri.Scheme)://$($baseUri.Authority)"

    $sitesUrl = "$apiRoot/api/sites"
    $sites = Invoke-RestMethod -Uri $sitesUrl -Method Get
    if (-not $sites -or $sites.Count -eq 0) {
        throw "No sites available from $sitesUrl"
    }

    $chosenSite = $null
    $chosenUnit = $null

    foreach ($site in $sites) {
        $unitsUrl = "$apiRoot/api/units?site_id=$($site.id)"
        $units = Invoke-RestMethod -Uri $unitsUrl -Method Get
        if ($units -and $units.Count -gt 0) {
            $chosenSite = $site
            $chosenUnit = [string]$units[0]
            break
        }
    }

    if (-not $chosenSite) {
        throw "No available units found for any site. Cannot build a valid signup payload."
    }

    $nonce = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $email = "bot-sim-$nonce@$Domain"

    return @{
        first_name = "Bot"
        last_name = "Simulation"
        email = $email
        phone = "0123456789"
        site_id = [int]$chosenSite.id
        unit_number = @($chosenUnit)
        package = $PkgName
        activation_type = "ASAP"
        signup_type = "individual"
        notes = "Automated bot-filter scenario test"
    }
}

function Invoke-Scenario {
    param(
        [string]$Name,
        [hashtable]$Payload,
        [string]$Url,
        [string]$ScenarioUserAgent
    )

    $json = $Payload | ConvertTo-Json -Depth 6

    try {
        $response = Invoke-RestMethod -Uri $Url -Method Post -ContentType "application/json" -Headers @{ "User-Agent" = $ScenarioUserAgent } -Body $json
        [pscustomobject]@{
            Scenario = $Name
            HttpStatus = 200
            Error = ""
            Classification = "Passed signup checks"
            Raw = ($response | ConvertTo-Json -Depth 6 -Compress)
        }
    }
    catch {
        $statusCode = 0
        $rawResponse = ""
        $errorMessage = $_.Exception.Message
        $responseObj = $_.Exception.Response

        if ($responseObj) {
            if ($null -ne $responseObj.StatusCode) {
                $statusCode = [int]$responseObj.StatusCode
            }

            # PowerShell 7 often exposes HttpResponseMessage; Windows PowerShell uses WebResponse.
            if ($responseObj.PSObject.Methods.Name -contains "GetResponseStream") {
                $stream = $responseObj.GetResponseStream()
                if ($stream) {
                    $reader = New-Object System.IO.StreamReader($stream)
                    $rawResponse = $reader.ReadToEnd()
                    $reader.Close()
                }
            }
            elseif ($null -ne $responseObj.Content) {
                try {
                    $rawResponse = $responseObj.Content.ReadAsStringAsync().GetAwaiter().GetResult()
                }
                catch {
                    # Content can be disposed in some PowerShell versions.
                    $rawResponse = ""
                }
            }
        }

        if ([string]::IsNullOrWhiteSpace($rawResponse) -and $_.ErrorDetails -and $_.ErrorDetails.Message) {
            $rawResponse = $_.ErrorDetails.Message
        }

        $classification = "Not blocked by bot filter"
        if ($rawResponse -match "Blocked suspicious submission") {
            $classification = "Blocked by bot filter"
        }

        [pscustomobject]@{
            Scenario = $Name
            HttpStatus = $statusCode
            Error = $errorMessage
            Classification = $classification
            Raw = $rawResponse
        }
    }
}

$scenarios = @(
    @{
        Name = "A) Extremely fast (<2s), no honeypot"
        SecondsAgo = -1
        Website = ""
    },
    @{
        Name = "B) Fast (<10s), no honeypot"
        SecondsAgo = 5
        Website = ""
    },
    @{
        Name = "C) Fast + honeypot"
        SecondsAgo = 5
        Website = "autofilled-value"
    },
    @{
        Name = "D) Honeypot only (normal timing)"
        SecondsAgo = 20
        Website = "autofilled-value"
    },
    @{
        Name = "E) Honeypot + non-browser UA"
        SecondsAgo = 20
        Website = "autofilled-value"
        UserAgent = "python-requests/2.32"
    }
)

$seed = Get-ValidSignupSeed -SignupEndpointUrl $ApiUrl -Domain $EmailDomain -PkgName $PackageName

$results = foreach ($scenario in $scenarios) {
    $ua = if ($scenario.ContainsKey("UserAgent")) { $scenario.UserAgent } else { $UserAgent }

    # Build payload right before request so timing thresholds are tested accurately.
    $payload = @{
        first_name = $seed.first_name
        last_name = $seed.last_name
        email = $seed.email
        phone = $seed.phone
        site_id = $seed.site_id
        unit_number = $seed.unit_number
        package = $seed.package
        activation_type = $seed.activation_type
        signup_type = $seed.signup_type
        notes = $seed.notes
        website = $scenario.Website
        form_loaded_at = New-IsoTimestampSecondsAgo -SecondsAgo $scenario.SecondsAgo
    }

    Invoke-Scenario -Name $scenario.Name -Payload $payload -Url $ApiUrl -ScenarioUserAgent $ua
}

Write-Host ""
Write-Host "Results summary:" -ForegroundColor Cyan
$results | Select-Object Scenario, HttpStatus, Classification | Format-Table -AutoSize

Write-Host ""
Write-Host "Payload seed used:" -ForegroundColor Cyan
Write-Host "site_id=$($seed.site_id), unit_number=$($seed.unit_number -join ','), email=$($seed.email), package=$($seed.package)"

Write-Host ""
Write-Host "Detailed response bodies:" -ForegroundColor Cyan
foreach ($result in $results) {
    Write-Host ""
    Write-Host "[$($result.Scenario)]" -ForegroundColor Yellow
    Write-Host "Status: $($result.HttpStatus)"
    Write-Host "Classification: $($result.Classification)"
    Write-Host "Raw: $($result.Raw)"
}
