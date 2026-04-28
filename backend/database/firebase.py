import os
import firebase_admin
from firebase_admin import credentials, firestore, auth, messaging
from dotenv import load_dotenv

load_dotenv()

_app = None

def init_firebase():
    global _app
    if _app is not None:
        return

    project_id = os.getenv("FIREBASE_PROJECT_ID")
    private_key = os.getenv("FIREBASE_ADMIN_PRIVATE_KEY")
    client_email = os.getenv("FIREBASE_ADMIN_CLIENT_EMAIL")
    
    if project_id and private_key and client_email:
        # Fix escaped newlines in env var
        private_key = private_key.replace('\\n', '\n')
        cert_dict = {
            "type": "service_account",
            "project_id": project_id,
            "private_key_id": "",
            "private_key": private_key,
            "client_email": client_email,
            "client_id": "",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{client_email}"
        }
        cred = credentials.Certificate(cert_dict)
    else:
        service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "./firebase-service-account.json")

        if not os.path.exists(service_account_path):
            raise FileNotFoundError(
                f"Firebase service account JSON not found at: {service_account_path}\n"
                "Download it from Firebase Console > Project Settings > Service Accounts."
            )

        cred = credentials.Certificate(service_account_path)
        
    _app = firebase_admin.initialize_app(cred)


# Initialize on import
init_firebase()

# Re-export commonly used modules
db = firestore.client()
