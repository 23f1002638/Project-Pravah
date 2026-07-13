import requests
import json
import sys

# Backend endpoint (via secure Pinggy tunnel)
url = "https://pravah-backend-wcp6.onrender.com/api/evaluate-risk"

# Mock orders matching the page.tsx configuration
mock_orders = [
    {
        "order_id": 12345,
        "region": "Southeast Asia",
        "shipping_mode": "Standard Class",
        "customer_segment": "Consumer",
        "value": 850,
        "scheduled_days": 5,
        "qty": 12
    },
    {
        "order_id": 99821,
        "region": "Western Europe",
        "shipping_mode": "First Class",
        "customer_segment": "Corporate",
        "value": 4200,
        "scheduled_days": 2,
        "qty": 4
    },
    {
        "order_id": 55432,
        "region": "Central America",
        "shipping_mode": "Same Day",
        "customer_segment": "Home Office",
        "value": 120,
        "scheduled_days": 1,
        "qty": 1
    }
]

def test_integration():
    output_lines = []
    
    def log(msg):
        print(msg)
        output_lines.append(msg)
        
    log("Starting integration verification tests against the local Flask server...")
    
    for order in mock_orders:
        log("\n==========================================")
        log(f"Testing Order ID: {order['order_id']}")
        log("==========================================")
        
        payload = {
            "order_id": order["order_id"],
            "Shipping Mode": order["shipping_mode"],
            "Order Region": order["region"],
            "Customer Segment": order["customer_segment"],
            "Days for shipment (scheduled)": order["scheduled_days"],
            "Product Price": order["value"] / order["qty"],
            "Order Item Quantity": order["qty"],
            "Sales": order["value"]
        }
        
        log("Sending payload:")
        log(json.dumps(payload, indent=2))
        
        try:
            response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
            log(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                log("Status: Success")
                log("ML Metrics:")
                log(json.dumps(result.get("ml_metrics"), indent=2))
                log("Amber Advisory:")
                log(result.get("amber_advisory", ""))
            else:
                log("Error Response:")
                log(response.text)
        except Exception as e:
            log(f"Connection failed: {e}")
            
    with open("test_output.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(output_lines))
    print("\nSaved output to test_output.txt")

if __name__ == "__main__":
    test_integration()
