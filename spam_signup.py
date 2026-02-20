import requests

url = "http://localhost:5000/api/signup"
headers = {"Content-Type": "application/json"}
data = {"website": ""}

for i in range(3):
    r = requests.post(url, json=data, headers=headers)
    print(f"Request {i+1}: {r.status_code} - {r.text}")