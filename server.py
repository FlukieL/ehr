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
        # Allow address reuse to avoid "Address already in use" errors
        socketserver.TCPServer.allow_reuse_address = True
        
        # Bind to all interfaces (0.0.0.0) to ensure accessibility
        httpd = socketserver.TCPServer(("0.0.0.0", port), handler)
        url = f"http://localhost:{port}"
        
        print("=" * 60)
        print(f"Server starting at {url}")
        print(f"Also accessible at: http://127.0.0.1:{port}")
        print(f"Serving directory: {script_dir}")
        print("=" * 60)
        print("Press Ctrl+C to stop the server")
        print()
        
        # Flush output to ensure messages are displayed
        sys.stdout.flush()
        
        # Open browser
        print(f"Opening browser at {url}...")
        try:
            webbrowser.open(url)
        except Exception as browser_error:
            print(f"Warning: Could not open browser automatically: {browser_error}")
            print(f"Please manually open: {url}")
        
        # Start serving - this blocks until interrupted
        print("Server is running and ready to accept connections...")
        sys.stdout.flush()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
            try:
                httpd.shutdown()
                httpd.server_close()
            except:
                pass
            print("Server stopped.")
            sys.exit(0)
        except Exception as serve_error:
            print(f"\nError while serving: {serve_error}")
            import traceback
            traceback.print_exc()
            try:
                httpd.shutdown()
                httpd.server_close()
            except:
                pass
            sys.exit(1)
            
    except OSError as e:
        if "Address already in use" in str(e) or "address is already in use" in str(e).lower():
            print(f"Error: Port {port} is already in use.")
            print(f"Please use a different port or stop the process using port {port}.")
            sys.exit(1)
        else:
            raise
    except Exception as e:
        print(f"Error starting server: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

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
