$port = 5000
echo "Checking port $port..."
$processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($processes) {
    foreach ($p in $processes) {
        if ($p -ne 0) {
            echo "Killing PID $p..."
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        }
    }
    echo "Port $port cleared."
} else {
    echo "No process found on port $port."
}
