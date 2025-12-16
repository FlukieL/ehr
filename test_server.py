#!/usr/bin/env python3
"""Quick test to verify server can start and listen."""

import http.server
import socketserver
import sys
import time

port = 8002
handler = http.server.SimpleHTTPRequestHandler
socketserver.TCPServer.allow_reuse_address = True

try:
    httpd = socketserver.TCPServer(("0.0.0.0", port), handler)
    print(f"Server created successfully on port {port}")
    print(f"Server is listening at http://localhost:{port}")
    print("Server will run for 10 seconds, then exit...")
    
    # Run for 10 seconds then exit
    httpd.timeout = 1
    start_time = time.time()
    while time.time() - start_time < 10:
        httpd.handle_request()
    
    httpd.server_close()
    print("Server test completed successfully!")
    sys.exit(0)
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
