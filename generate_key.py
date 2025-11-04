# generate_key.py
# This script generates a secure, random 16-byte (128-bit) key
# for AES encryption.

import os
import binascii

# Generate 16 random bytes
key_bytes = os.urandom(16)

# Convert the bytes to a hexadecimal string
# This is easier to copy, paste, and store
key_hex = binascii.hexlify(key_bytes).decode('utf-8')

print("--- Your Secure AES-128 Key ---")
print("\nKeep this key SECRET and SAFE!")
print("You will need to paste this hex key into both your Python simulator and your HTML/JS dashboard.\n")
print(f"Your AES secret key (in hex): {key_hex}")
print(f"\nThis key is 32 characters long (16 bytes).")