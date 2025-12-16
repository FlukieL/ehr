#!/usr/bin/env python3
"""
Local Development Server
Starts a Python HTTP server and opens the site in a browser window.

Usage:
    python server.py [port]
"""

import http.server
import socketserver
import webbrowser
import sys
import os
from pathlib import Path

# Default port
DEFAULT_PORT = 8000

def start_server(port=DEFAULT_PORT):
    """
    Starts an HTTP server and opens the site in a browser.
    
    Args:
        port: Port number to run the server on (default: 8000)
    """
    # Change to the script's directory (project root)
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Create server
    handler = http.server.SimpleHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", port), handler) as httpd:
            url = f"http://localhost:{port}"
            print(f"Starting server at {url}")
            print(f"Serving directory: {script_dir}")
            print("Press Ctrl+C to stop the server")
            
            # Open browser
            print(f"Opening browser at {url}...")
            webbrowser.open(url)
            
            # Start serving
            httpd.serve_forever()
            
    except OSError as e:
        if "Address already in use" in str(e) or "address is already in use" in str(e).lower():
            print(f"Error: Port {port} is already in use.")
            print(f"Please use a different port or stop the process using port {port}.")
            sys.exit(1)
        else:
            raise
    except KeyboardInterrupt:
        print("\nServer stopped.")
        sys.exit(0)

if __name__ == "__main__":
    # Parse port from command line if provided
    port = DEFAULT_PORT
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"Error: Invalid port number '{sys.argv[1]}'")
            print(f"Usage: python server.py [port]")
            sys.exit(1)
    
    start_server(port)
