import urllib.request
import urllib.parse
import json

def test_auth_flow():
    print("Testing Authentication flow...")
    login_url = "http://127.0.0.1:8000/api/auth/login"
    payload = {
        "email": "residenta@apartmenthub.com",
        "password": "resident123"
    }
    
    # 1. Login
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        login_url, 
        data=data, 
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = json.loads(response.read().decode('utf-8'))
            print("Login successful!")
            print("Received token prefix:", res_body['access_token'][:15])
            print("User name:", res_body['user']['first_name'], res_body['user']['last_name'])
            print("User roles:", res_body['roles'])
            token = res_body['access_token']
    except Exception as e:
        print("Login failed:", e)
        return

    # 2. Get Profile (/me) using token
    me_url = "http://127.0.0.1:8000/api/auth/me"
    req_me = urllib.request.Request(me_url)
    req_me.add_header('Authorization', f'Bearer {token}')
    
    try:
        with urllib.request.urlopen(req_me) as response:
            profile = json.loads(response.read().decode('utf-8'))
            print("Fetch /me successful!")
            print("Profile details: Email =", profile['email'], "| verified =", profile['is_verified'])
    except Exception as e:
        print("Fetch /me failed:", e)

if __name__ == "__main__":
    test_auth_flow()
