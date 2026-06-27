import requests

url = "http://127.0.0.1:5000/api/chat"
session = requests.Session()

# First get questions to initialize session/cookies
print("Initializing session...")
session.get("http://127.0.0.1:5000/api/questions")

# Send a greeting message
print("\n--- Test 1: Greeting ---")
response = session.post(url, json={"message": "hello"})
print("Status Code:", response.status_code)
try:
    print("Response:", response.json())
except Exception as e:
    print("Failed to decode JSON:", response.text)

# Send a career question
print("\n--- Test 2: General career guidance ---")
response = session.post(url, json={"message": "how can I choose the right career?"})
print("Status Code:", response.status_code)
try:
    print("Response:", response.json())
except Exception as e:
    print("Failed to decode JSON:", response.text)
