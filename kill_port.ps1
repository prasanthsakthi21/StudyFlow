$port = 8081
echo "Checking port $port..."
$processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($processes) {
    foreach ($pid in $processes) {
        if ($pid -ne 0) {
            echo "Killing PID $pid..."
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
    echo "Port $port cleared."
} else {
    echo "No process found on port $port."
}
