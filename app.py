from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_mail import Mail, Message

from sqlalchemy import text
from datetime import datetime, timezone
from email_validator import validate_email, EmailNotValidError
import logging
import dns.resolver
from dotenv import load_dotenv
import re
import time
import os

from db import HeimdallSession

load_dotenv()

app = Flask(__name__)

# Apply CORS immediately after app creation
CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": "*"}}, allow_headers=["Content-Type", "Authorization"])

limiter = Limiter(get_remote_address, app=app)

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT'))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS') == 'True'
# app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_SUPPRESS_SEND'] = False  # Set to True to disable email sending (for testing)

mail = Mail(app)

# Configure logging to a file
logging.basicConfig(
    filename='blocked_attempts.log',
    level=logging.INFO,
    format='%(asctime)s %(levelname)s: %(message)s'
)
def fetch_sites():
    session = HeimdallSession()
    try:
        result = session.execute(text("SELECT id, name FROM sites ORDER BY name"))
        return [{"id": row[0], "name": row[1]} for row in result]  # convert to list of dictionaries
    finally:
        session.close()

def fetch_units_by_site_id(site_id):
    session = HeimdallSession()
    try:
        # Adjust table/column names to match your schema
        query = """
            SELECT s.unit_number
            FROM services s
            WHERE s.site_id = :site_id
              AND s.status = 'Inactive'
            ORDER BY s.unit_number
        """
        # Convert site_id to int for safety
        site_id_int = int(site_id)
        result = session.execute(text(query), {"site_id": site_id_int})
        units = [row[0] for row in result.fetchall()]
        return units
    finally:
        session.close()

def validate_email_domain(email: str) -> tuple[bool, str | None]:
    """
    Returns (is_valid, normalized_email_or_error_message)
    """

    try:
        # Syntax + normalization
        v = validate_email(email, check_deliverability=False)
        normalized_email = v.email
    except EmailNotValidError as e:
        return False, str(e)

    domain = normalized_email.split("@")[1]

    try:
        # Check MX records
        dns.resolver.resolve(domain, "MX")
    except Exception:
        return False, "Email domain cannot receive mail"

    # If valid, return normalized email
    return True, normalized_email

def send_support_email(payload):
    """
    Sends a new sign-up notification to support staff.
    """
    support_email = "jacquesj44@gmail.com"
    
    subject = f"New Fibre Sign-Up: {payload['name']} - {payload['unit']} - {payload['site']}"
    
    body = f"""
    <h2><strong>New sign-up received:</strong></h2>

    <p>
        Name: {payload['name']} <br>
        Email: {payload['email']} <br>
        Phone: {payload['phone']} <br>
        <strong> Site: {payload['site']} </strong> <br>
        Unit: {payload['unit']} <br>
        Package: {payload['package']} <br>
        Activation: {payload['activation']} <br> 
        Notes: {payload['notes']} 
    </p>
    """

    msg = Message(subject=subject, recipients=[support_email], html=body)
    
    try:
        mail.send(msg)
        print("Support email sent successfully.")
    except Exception as e:
        print("Failed to send support email:", e)


@app.route('/api/sites', methods=['GET'])
def get_sites():
    allsites = fetch_sites()
    return jsonify(allsites), 200

@app.route("/api/units", methods=["GET"])
def get_units():
    site_id = request.args.get("site_id")
    if not site_id:
        return jsonify({"error": "site_id parameter is required"}), 400

    try:
        units = fetch_units_by_site_id(site_id)
    except ValueError:
        return jsonify({"error": "site_id must be an integer"}), 400

    return jsonify(units), 200

@app.route("/api/signup", methods=["POST"])
@limiter.limit("5 per minute")
def signup():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400
    
    # --- Honeypot check ---
    website = data.get("website", "")
    form_loaded_at = data.get("form_loaded_at")

    is_bot = False
    reason = ""

    # 1. Company field filled in (should be empty)
    if website.strip():
        is_bot = True
        reason = "Honeypot field filled"

    # 2. Form submitted too fast (e.g., < 3 seconds)
    if form_loaded_at:
        try:
            load_time = datetime.fromisoformat(form_loaded_at)

            # ensure it's timezone-aware
            if load_time.tzinfo is None:
                load_time = load_time.replace(tzinfo=timezone.utc)

            delta = (datetime.now(timezone.utc) - load_time).total_seconds()
            if delta < 10:  # threshold in seconds
                is_bot = True
                reason = f"Form submitted too fast ({delta:.2f}s)"
        except Exception as e:
            # ignore parsing errors
            pass

    if is_bot:
        logging.info(f"Blocked bot attempt: {reason}, IP={request.remote_addr}, data={data}")
        return jsonify({"error": "Blocked suspicious submission"}), 400

    # --- Required fields ---
    required_fields = [
        "first_name",
        "last_name",
        "email",
        "phone",
        "site_id",
        "unit_number",
        "package",
        "activation_type",
        "signup_type"
    ]

    if data["signup_type"] == "company":
        if not data.get("company_name"):
            return jsonify({"error": "Company name and VAT Reg No are required when signing up as a company"}), 400

    missing = [f for f in required_fields if not data.get(f)]
    if missing:
        return jsonify({
            "error": "Missing required fields",
            "fields": missing
        }), 400

    # --- Email validation (syntax + domain + MX) ---
    is_valid, email_result = validate_email_domain(data["email"])

    if not is_valid:
        return jsonify({"error": email_result}), 400

    email = email_result  # normalized email

    # --- Activation logic ---
    activation_type = data["activation_type"]
    activation_date = data.get("activation_date")

    if activation_type == "Scheduled" and not activation_date:
        return jsonify({
            "error": "activation_date is required when activation_type is Scheduled"
        }), 400

    if activation_type == "ASAP":
        activation_date = "ASAP"

    # --- (Optional) Verify site_id exists ---
    session = HeimdallSession()
    try:
        site_check = session.execute(
            text("SELECT name FROM sites WHERE id = :id"),
            {"id": data["site_id"]}
        ).fetchone()

        if not site_check:
            return jsonify({"error": "Invalid site_id"}), 400

        site_name = site_check[0]

    finally:
        session.close()

    # --- Build email payload ---
    email_payload = {
        "name": f"{data['first_name']} {data['last_name']}",
        "email": email,
        "phone": data["phone"],
        "site": site_name,
        "unit": data["unit_number"],
        "package": data["package"],
        "activation": activation_date,
        "notes": data.get("notes", ""),
        "signup_type": data["signup_type"],
        "company_name": data.get("company_name", ""),
        "vat_reg_no": data.get("vat_reg_no", "")
    }

    send_support_email(email_payload)  # <-- sends email to support staff

    # --- Success ---
    return jsonify({
        "status": "ok",
        "message": "Signup received",
        "data": email_payload
    }), 200

if __name__ == '__main__':
    app.run()