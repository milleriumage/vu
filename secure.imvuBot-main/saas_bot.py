import os
print("DEBUG: Script starting...")
import time
import json
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from selenium.webdriver.common.keys import Keys
import google.generativeai as genai
import openai

load_dotenv()

# --- Configuration ---
SUPABASE_URL = os.environ.get("SUPABASE_URL", "YOUR_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "YOUR_SUPABASE_ANON_KEY")
BOT_ID = os.environ.get("BOT_ID", "bot-alpha-1")

# Initialize Supabase
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"Error initializing Supabase: {e}")
    supabase = None

def fetch_bot_config():
    """Fetches configuration for this bot from Supabase."""
    if not supabase:
        return None
    try:
        response = supabase.table('bots').select('*').eq('id', BOT_ID).execute()
        if response.data:
            return response.data[0] 
    except Exception as e:
        print(f"Failed to fetch config: {e}")
    return None

def update_status(status, details=""):
    """Updates the bot's status in the database (Heartbeat)."""
    if not supabase:
        return
    try:
        supabase.table('bots').update({
            'status': status, 
            'last_seen': datetime.now().isoformat(),
            'current_activity': details
        }).eq('id', BOT_ID).execute()
    except Exception as e:
        print(f"Failed to update status: {e}")

# --- AI Logic ---

def generate_ai_reply(config, user_message):
    """Generates a reply using the selected AI model (OpenAI or Gemini)."""
    if not config.get('ai_enabled'):
        return None
        
    system_prompt = config.get('system_prompt', "You are a helpful IMVU bot.")
    selected_model = config.get('ai_model', 'gpt-3.5-turbo') # Default to GPT-3.5
    
    # --- OpenAI Models ---
    if 'gpt' in selected_model:
        # Check if explicitly disabled
        if config.get('openai_enabled') is False:
             print("OpenAI is disabled in settings. Skipping.")
             return None

        openai_key = config.get('openai_api_key')
        if not openai_key:
            print(f"Skipping OpenAI: No API Key for model {selected_model}")
            return None
            
        try:
            client = openai.OpenAI(api_key=openai_key)
            response = client.chat.completions.create(
                model=selected_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=60
            )
            reply = response.choices[0].message.content.strip()
            print(f"[AI Reply - {selected_model}] {reply}")
            return reply
        except Exception as e:
            print(f"OpenAI Failed: {e}")
            return None 

    # --- Gemini Models ---
    elif 'gemini' in selected_model:
        # Check if explicitly disabled
        if config.get('gemini_enabled') is False:
             print("Gemini is disabled in settings. Skipping.")
             return None

        gemini_key = config.get('gemini_api_key')
        if not gemini_key:
            print(f"Skipping Gemini: No API Key for model {selected_model}")
            return None
            
        try:
            genai.configure(api_key=gemini_key)
            
            # Map frontend values to actual API model names if needed
            # Map frontend values to actual API model names
            model_name = selected_model
            
            if model_name == 'gemini-flash-latest':
               model_name = 'gemini-1.5-flash'
            elif model_name == 'gemini-2.0-flash-exp':
               model_name = 'gemini-2.0-flash-exp'
            
            print(f"Using Gemini Model: {model_name}")
            model = genai.GenerativeModel(model_name)
            
            full_prompt = f"{system_prompt}\n\nUser: {user_message}"
            
            response = model.generate_content(full_prompt)
            reply = response.text.strip()
            print(f"[AI Reply - {model_name}] {reply}")
            return reply
        except Exception as e:
            print(f"Gemini Failed: {e}")
            return None
            
    return None

# --- Bot Actions ---

def login_to_imvu(driver, username, password):
    """Logs into IMVU using Selenium with robust checks."""
    login_url = "https://secure.imvu.com/welcome/login/"
    print(f"Navigating to {login_url}...")
    driver.get(login_url)
    
    # Debug: Print where we actually are
    print(f"Landed on: {driver.current_url}")
    
    MAX_RETRIES = 3
    for attempt in range(MAX_RETRIES):
        print(f"--- Login Attempt {attempt + 1}/{MAX_RETRIES} ---")
        try:
            # 0. Try to close Cookie Banners
            try:
                driver.find_element(By.ID, "onetrust-accept-btn-handler").click()
                print("Accepted cookies.")
                time.sleep(2)
            except:
                pass

            # 0.5. Check for "Entrar" or "Log In" link on landing page
            print("Checking for Landing Page 'Log In' button...")
            try:
                # Robust XPath searching for the specific Portuguese text container or just "Entrar"
                # Looking for ANY clickable element containing "Entrar" inside "Já possui..." context if possible, or just huge wildcard
                landing_login_btn = driver.find_element(By.XPATH, "//*[contains(text(), 'ENTRAR') or contains(text(), 'Entrar') or contains(text(), 'Log In')]")
                # Ensure it's clickable/visible
                if landing_login_btn.is_displayed():
                    landing_login_btn.click()
                    print("Clicked Landing Page 'Log In/Entrar'.")
                    time.sleep(3)
            except:
                print("Landing page 'Log In' button not found (might be directly on form).")

            # 1. Wait for username field
            print("Looking for username field...")
            try:
                u_name = WebDriverWait(driver, 30).until(EC.visibility_of_element_located((By.NAME, 'avatarname')))
            except:
                print("Standard 'avatarname' not found, trying generic 'username'...")
                u_name = WebDriverWait(driver, 10).until(EC.visibility_of_element_located((By.NAME, 'username')))
                
            u_name.clear()
            u_name.send_keys(username)
            print(f"Username '{username}' entered.")
            
            # 2. Wait for password field
            print("Looking for password field...")
            u_pass = WebDriverWait(driver, 30).until(EC.visibility_of_element_located((By.NAME, 'password')))
            u_pass.clear()
            u_pass.send_keys(password)
            print("Password entered.")
            
            # 3. Click login button
            try:
                driver.find_element(By.XPATH, '//*[@id="imvu"]/section[2]/div/div/div/section/form/div[4]/button').click()
            except:
                print("Specific button not found, submitting form...")
                u_pass.submit()
                
            print("Login button clicked.")
            
            time.sleep(10) # Wait for redirect
            
            # Check if we moved past login
            if "login" not in driver.current_url:
                print("Login successful (URL changed).")
                return True
            else:
                print("Warning: Still on login page. Retrying...")
                driver.refresh()
                time.sleep(5)
                continue # Try again

        except TimeoutException:
            print("Login timed out. Element not found.")
            driver.refresh()
            time.sleep(5)
        except Exception as e:
            print(f"Login attempt failed: {e}")
            driver.refresh()
            time.sleep(5)
            
    print("All login attempts failed.")
    return False

def send_chat_message(driver, message):
    """Types and sends a message in the chat."""
    try:
        # 1. Try generic input
        # 2. Try specific specific class or structure (observed from source or standard practices)
        # Often in modern SPAs it's an input with a specific placeholder or class
        
        # Method 1: Broad search for text input
        chat_input = None
        try:
             chat_input = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "input[type='text'], textarea"))
            )
        except:
             pass

        if not chat_input:
             # Method 2: Fallback for potentially hidden or specific inputs
             # Try looking for "Say something..." placeholder style inputs
             # Use JS to find active element if nothing else works, but let's try specificity first
             print("Standard input not found, trying broad xpath...")
             chat_input = driver.find_element(By.XPATH, "//input | //textarea")

        chat_input.click()
        chat_input.clear()
        chat_input.send_keys(message)
        time.sleep(0.5)
        chat_input.send_keys(Keys.RETURN)
        print(f"Sent message: {message}")
        return True
    except Exception as e:
        print(f"Failed to send message: {e}")
        return False

def enter_room(driver, room_url):
    """Navigates to the specified room."""
    print(f"Entering room: {room_url}")
    driver.get(room_url)
    time.sleep(15) # Wait for room load (increased)
    
    # Handle "Join Room" button (English and Portuguese)
    clicked_join = False
    try:
        # Try multiple selectors for the Join button (Case insensitive and broad search)
        # 1. Broad text search in buttons
        xpath = "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'join') or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'entrar') or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'participar')]"
        join_btn = driver.find_element(By.XPATH, xpath)
        join_btn.click()
        print("Clicked Join/Entrar button (Method 1).")
        clicked_join = True
        time.sleep(10)
    except:
        try:
             # 2. Try looking for the specific class if known or generic container
             text_el = driver.find_element(By.XPATH, "//*[contains(text(), 'PARTICIPAR') or contains(text(), 'Participar')]")
             text_el.click()
             print("Clicked text element 'Participar' (Method 2).")
             clicked_join = True
             time.sleep(10)
        except:
             print("Join button not found or already in room.")

    # Try to close any popups (like 'Daily Spin' or 'Tutorial') if they exist
    try:
        driver.find_element(By.CSS_SELECTOR, "button[class*='close']").click()
    except:
        pass
        
    return True


# --- Main Engine ---

def run_bot():
    print(f"Starting SaaS Bot Engine ({BOT_ID})...")
    
    # Wait for config
    config = fetch_bot_config()
    while not config:
        print("Waiting for configuration from Dashboard...")
        time.sleep(5)
        config = fetch_bot_config()

    print(f"Configuration received for user: {config.get('imvu_username')}")
    print(f"DEBUG: Using credentials -> User: {config.get('imvu_username')}, Pass: {'*' * len(config.get('imvu_password', ''))}")
    
    # Setup Driver (Real Browser)
    print("Launching Browser...")
    driver = None
    options = webdriver.ChromeOptions()
    options.add_argument("--incognito")
        
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
    except Exception as e:
        print(f"Failed to launch Chrome: {e}")
        return

    try:
        # Login
        if login_to_imvu(driver, config['imvu_username'], config['imvu_password']):
            update_status("ONLINE", "Logged in successfully")
            
            # --- Auto-Join Room Logic ---
            # Check if we have a target room and join immediately
            current_config = fetch_bot_config() # Refresh config to be sure
            target_room = current_config.get('target_room')
            if target_room:
                 update_status("WORKING", f"Auto-joining {target_room}")
                 if enter_room(driver, target_room):
                     # Auto-Greeting Logic
                     if current_config.get('greeting_enabled'):
                         greeting = current_config.get('greeting_message', "Hello everyone!")
                         print(f"Sending Auto-Greeting: {greeting}")
                         send_chat_message(driver, greeting)
                 
                 # Switch to MONITOR
                 supabase.table('bots').update({'command': 'MONITOR_CHAT'}).eq('id', BOT_ID).execute()
            else:
                 print("No target room defined. Waiting for commands.")

            # Command Loop
            while True:
                # 1. Heartbeat
                update_status("RUNNING", "Monitoring Chat")
                
                # 2. Fetch latest config
                current_config = fetch_bot_config()
                command = current_config.get('command')
                
                if command == 'STOP':
                    print("Received STOP command.")
                    update_status("STOPPED", "Stopped by user")
                    break
                
                # Manual Join Command (still useful if user changes room later)
                if command == 'JOIN_ROOM':
                    room_url = current_config.get('target_room')
                    if room_url:
                        update_status("WORKING", f"Joining {room_url}")
                        enter_room(driver, room_url)
                        supabase.table('bots').update({'command': 'MONITOR_CHAT'}).eq('id', BOT_ID).execute()
                
                if command == 'MONITOR_CHAT':
                    # 1. Read Chat
                    last_msg = get_last_chat_message(driver)
                    
                    if last_msg:
                        print(f"Saw message: {last_msg}")
                        
                        # 2. Canned Responses (Priority #1)
                        # If Canned is enabled, we check it. 
                        # If we find a match, we send it and SKIP AI.
                        # This allows "No AI" mode if AI is disabled.
                        canned_reply = check_canned_response(last_msg, current_config)
                        if canned_reply:
                            print(f"[Canned Reply] {canned_reply}")
                            send_chat_message(driver, canned_reply)
                            time.sleep(5) # Cooldown
                            continue # Loop again (Skip AI)

                    # 3. AI Reply (Priority #2)
                    # Only runs if AI is explicitly enabled AND we didn't send a canned reply above
                    if current_config.get('ai_enabled'):
                        # Using a random chance to simulate "thinking" or waiting for a direct mention would be better
                        # For now, we simulate a low response rate to avoid spamming every single message
                        # Real usage: You'd probably check if 'last_msg' contains bot name.
                        import random
                        if last_msg and random.random() < 0.2: # 20% chance to reply to a message
                             reply = generate_ai_reply(current_config, last_msg)
                             if reply:
                                 send_chat_message(driver, reply)
                                 time.sleep(5)
                                 
                if command == 'TEST_AI':
                    print("Testing AI capability...")
                    update_status("WORKING", "Testing AI Response")
                    # Simulate receiving a message
                    reply = generate_ai_reply(current_config, "Hello! Are you a bot?")
                    
                    if reply:
                        update_status("ONLINE", f"AI Test Success: {reply[:30]}...")
                    else:
                        update_status("ERROR", "AI Test Failed (Check logs/Detailed status)")
                        print("AI Test Failed: Check API Key or Quota.")
                        
                    # Always reset command to prevent infinite loop
                    supabase.table('bots').update({'command': 'MONITOR_CHAT'}).eq('id', BOT_ID).execute()
                    
                time.sleep(5) 
                
    except Exception as e:
        print(f"Critical Error: {e}")
        update_status("CRASHED", str(e))
    finally:
        if driver:
            print("Closing browser...")
            driver.quit()

# --- Helper Functions (Moved to Global Scope) ---

def get_last_chat_message(driver):
    """Scrapes the last message from the chat log."""
    try:
        messages = driver.find_elements(By.XPATH, "//div[contains(@class, 'chat-log')]//div[contains(@class, 'message-text')]")
        if not messages:
            messages = driver.find_elements(By.CSS_SELECTOR, "li p, div[role='listitem'] span")
            
        if messages:
            return messages[-1].text.strip()
    except Exception as e:
        pass 
    return None

def check_canned_response(message, config):
    """Checks if message matches a canned trigger."""
    if not config.get('canned_enabled'):
        return None
    responses = config.get('canned_responses', [])
    if not responses:
        return None
    message_lower = message.lower()
    for item in responses:
        trigger = item.get('trigger', '').lower()
        if trigger and trigger in message_lower:
            return item.get('response')
    return None


if __name__ == "__main__":
    run_bot()
