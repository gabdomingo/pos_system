$login = Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/login -ContentType 'application/json' -Body (@{ email='customer@charliepc.ph'; password='cust123' } | ConvertTo-Json)
Write-Output "LOGIN: $($login.user.email) role=$($login.user.role)"
$token = $login.token
$products = Invoke-RestMethod -Method Get -Uri http://localhost:5000/products
Write-Output "PRODUCTS_COUNT: $($products.Count)"
$p = $products[0]
Write-Output "Chosen product id=$($p.id) stock=$($p.stock)"
$body = @{ items = @(@{ id = $p.id; quantity = 1; price = $p.price }); total = $p.price; paymentMethod = 'Online' } | ConvertTo-Json
$res = Invoke-RestMethod -Method Post -Uri http://localhost:5000/sales -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $body
Write-Output "SALE: $($res | ConvertTo-Json -Depth 5)"
$p2 = Invoke-RestMethod -Method Get -Uri ("http://localhost:5000/products/" + $p.id)
Write-Output "STOCK_AFTER: $($p2.stock)"
