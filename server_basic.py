#!/usr/bin/env python3
"""
Local Development Server (Basic HTTP Server - Backup)
Starts a Python HTTP server and opens the site in a browser window.
This is the original basic server kept as a backup.

Usage:
    python server_basic.py [port]
"""

import http.server
import socketserver
import webbrowser
import sys
import os
import traceback
import time
import socket
from pathlib import Path

# Default port
DEFAULT_PORT = 8000

def make_handler(directory):
    """
    Create a custom request handler class for the specified directory.
    
    Args:
        directory: Directory to serve files from
        
    Returns:
        Custom handler class
    """
    class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
        """Custom request handler that ensures proper request handling."""
        
        def __init__(self, *args, **kwargs):
            """Initialise handler with explicit directory."""
            # Ensure directory is absolute path
            abs_directory = os.path.abspath(directory)
            super().__init__(*args, directory=abs_directory, **kwargs)
        
        def handle_one_request(self):
            """Handle a single HTTP request with connection error handling."""
            try:
                super().handle_one_request()
            except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError, OSError) as e:
                # Client disconnected during request - this is normal, just log and continue
                error_code = getattr(e, 'winerror', getattr(e, 'errno', None))
                if error_code == 10053 or error_code == 10054:  # Windows connection aborted/reset
                    # Silently ignore - client disconnected
                    pass
                else:
                    print(f"[WARNING] Connection error (client may have disconnected): {type(e).__name__}")
                # Close the connection gracefully
                try:
                    self.connection.close()
                except:
                    pass
            except Exception as e:
                # Log other unexpected errors but don't crash
                print(f"[ERROR] Unexpected error in request handler: {type(e).__name__}: {e}")
                try:
                    self.connection.close()
                except:
                    pass
        
        def copyfile(self, source, outputfile):
            """Copy file with connection error handling."""
            try:
                super().copyfile(source, outputfile)
            except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError, OSError) as e:
                # Client disconnected during file transfer - this is normal
                error_code = getattr(e, 'winerror', getattr(e, 'errno', None))
                if error_code == 10053 or error_code == 10054:  # Windows connection aborted/reset
                    # Silently ignore - client disconnected
                    pass
                else:
                    print(f"[WARNING] Connection error during file transfer (client may have disconnected): {type(e).__name__}")
                # Re-raise to let handle_one_request catch it
                raise
        
        def translate_path(self, path):
            """Translate URL path to filesystem path with better error handling."""
            try:
                # Call parent method first
                translated = super().translate_path(path)
                # Log the translation for debugging
                if not os.path.exists(translated):
                    print(f"[DEBUG] Path not found: {translated} (requested: {path})")
                return translated
            except Exception as e:
                print(f"[ERROR] Error translating path '{path}': {e}")
                raise
        
        def end_headers(self):
            """Add headers to ensure proper browser compatibility."""
            # Add CORS headers for local development
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', '*')
            # Ensure proper content type handling
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            super().end_headers()
        
        def do_OPTIONS(self):
            """Handle OPTIONS requests for CORS preflight."""
            self.send_response(200)
            self.end_headers()
        
        def log_message(self, format, *args):
            """Override to ensure all requests are logged."""
            super().log_message(format, *args)
            # Flush immediately to ensure logs are visible
            sys.stdout.flush()
        
        def log_error(self, format, *args):
            """Override to log errors with more detail."""
            print(f"[ERROR] {format % args}")
            sys.stdout.flush()
            super().log_error(format, *args)
    
    return CustomHTTPRequestHandler

def check_server_ready(host, port, timeout=5):
    """
    Check if the server is ready to accept connections.
    
    Args:
        host: Server hostname
        port: Server port
        timeout: Maximum time to wait in seconds
        
    Returns:
        True if server is ready, False otherwise
    """
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex((host, port))
            sock.close()
            if result == 0:
                return True
        except Exception:
            pass
        time.sleep(0.1)
    return False

def start_server(port=DEFAULT_PORT):
    """
    Starts an HTTP server and opens the site in a browser.
    
    Args:
        port: Port number to run the server on (default: 8000)
    """
    httpd = None
    
    try:
        # Change to the script's directory (project root)
        script_dir = Path(__file__).parent.resolve()
        print(f"[INFO] Changing to directory: {script_dir}")
        os.chdir(script_dir)
        print(f"[INFO] Current working directory: {os.getcwd()}")
        
        # Verify the directory exists and contains index.html
        if not script_dir.exists():
            print(f"[ERROR] Directory does not exist: {script_dir}")
            sys.exit(1)
        
        index_path = script_dir / "index.html"
        if not index_path.exists():
            print(f"[WARNING] index.html not found in {script_dir}")
            print(f"[WARNING] Server will still start, but root requests may fail")
        else:
            print(f"[INFO] Verified index.html exists at {index_path}")
        
        # Create server handler with custom request handling and explicit directory
        handler = make_handler(str(script_dir))
        
        # Allow address reuse to avoid "Address already in use" errors
        socketserver.TCPServer.allow_reuse_address = True
        
        print(f"[INFO] Creating server on port {port}...")
        
        # Create server with high connection queue
        try:
            httpd = socketserver.TCPServer(("0.0.0.0", port), handler, bind_and_activate=False)
            httpd.request_queue_size = 10000  # Allow up to 10000 queued connections
            
            # Override handle_error to prevent server crashes from connection errors
            original_handle_error = httpd.handle_error
            
            def handle_error_with_recovery(request, client_address):
                """Handle errors gracefully without crashing the server."""
                try:
                    original_handle_error(request, client_address)
                except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError, OSError) as e:
                    # Connection errors are normal - client disconnected
                    error_code = getattr(e, 'winerror', getattr(e, 'errno', None))
                    if error_code not in (10053, 10054):  # Only log if not standard disconnect
                        print(f"[WARNING] Connection error handled: {type(e).__name__}")
                except Exception as e:
                    # Log other errors but don't crash
                    print(f"[ERROR] Error in request handling: {type(e).__name__}: {e}")
            
            httpd.handle_error = handle_error_with_recovery
            
            print(f"[INFO] Server object created, binding to port {port}...")
            httpd.server_bind()
            print(f"[INFO] Server bound successfully, activating...")
            httpd.server_activate()
            print(f"[INFO] Server activated successfully")
        except OSError as bind_error:
            error_msg = str(bind_error)
            if "Address already in use" in error_msg or "address is already in use" in error_msg.lower():
                print(f"[ERROR] Port {port} is already in use.")
                print(f"[ERROR] Please use a different port or stop the process using port {port}.")
                sys.exit(1)
            else:
                print(f"[ERROR] Failed to bind server: {bind_error}")
                traceback.print_exc()
                sys.exit(1)
        except Exception as server_error:
            print(f"[ERROR] Failed to create server: {server_error}")
            traceback.print_exc()
            sys.exit(1)
        
        url = f"http://localhost:{port}"
        
        # Give the server a moment to fully initialise
        time.sleep(0.2)
        
        # Verify server is ready before proceeding
        print("[INFO] Verifying server is ready to accept connections...")
        if check_server_ready("localhost", port, timeout=5):
            print("[INFO] Server is ready and accepting connections")
        else:
            print("[WARNING] Server readiness check timed out, but continuing...")
        
        print("=" * 60)
        print(f"Server started successfully at {url}")
        print(f"Also accessible at: http://127.0.0.1:{port}")
        print(f"Serving directory: {script_dir}")
        print(f"Connection queue size: {httpd.request_queue_size}")
        print("=" * 60)
        print("Press Ctrl+C to stop the server")
        print()
        
        # Flush output to ensure messages are displayed
        sys.stdout.flush()
        sys.stderr.flush()
        
        # Open browser
        print(f"[INFO] Attempting to open browser at {url}...")
        try:
            webbrowser.open(url)
            print(f"[INFO] Browser opened successfully")
        except Exception as browser_error:
            print(f"[WARNING] Could not open browser automatically: {browser_error}")
            print(f"[WARNING] Please manually open: {url}")
        
        # Start serving - this blocks until interrupted
        print("[INFO] Server is running and ready to accept connections...")
        sys.stdout.flush()
        sys.stderr.flush()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[INFO] Received shutdown signal (Ctrl+C)")
            print("[INFO] Shutting down server...")
            try:
                if httpd:
                    httpd.shutdown()
                    httpd.server_close()
                    print("[INFO] Server closed successfully")
            except Exception as shutdown_error:
                print(f"[ERROR] Error during shutdown: {shutdown_error}")
                traceback.print_exc()
            print("[INFO] Server stopped.")
            sys.exit(0)
        except Exception as serve_error:
            print(f"\n[ERROR] Server crashed while serving requests!")
            print(f"[ERROR] Error type: {type(serve_error).__name__}")
            print(f"[ERROR] Error message: {serve_error}")
            print(f"[ERROR] Full traceback:")
            traceback.print_exc()
            try:
                if httpd:
                    httpd.shutdown()
                    httpd.server_close()
            except Exception as cleanup_error:
                print(f"[ERROR] Error during cleanup: {cleanup_error}")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n[INFO] Received interrupt signal before server started")
        sys.exit(0)
    except OSError as e:
        error_msg = str(e)
        print(f"[ERROR] Operating system error occurred!")
        print(f"[ERROR] Error type: {type(e).__name__}")
        print(f"[ERROR] Error message: {error_msg}")
        if "Address already in use" in error_msg or "address is already in use" in error_msg.lower():
            print(f"[ERROR] Port {port} is already in use.")
            print(f"[ERROR] Please use a different port or stop the process using port {port}.")
        else:
            print(f"[ERROR] Full traceback:")
            traceback.print_exc()
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Unexpected error occurred!")
        print(f"[ERROR] Error type: {type(e).__name__}")
        print(f"[ERROR] Error message: {e}")
        print(f"[ERROR] Full traceback:")
        traceback.print_exc()
        try:
            if httpd:
                httpd.shutdown()
                httpd.server_close()
        except:
            pass
        sys.exit(1)

if __name__ == "__main__":
    try:
        # Parse port from command line if provided
        port = DEFAULT_PORT
        if len(sys.argv) > 1:
            try:
                port = int(sys.argv[1])
                if port < 1 or port > 65535:
                    print(f"[ERROR] Invalid port number: {port}")
                    print(f"[ERROR] Port must be between 1 and 65535")
                    sys.exit(1)
            except ValueError:
                print(f"[ERROR] Invalid port number '{sys.argv[1]}'")
                print(f"[ERROR] Port must be a number")
                print(f"Usage: python server_basic.py [port]")
                sys.exit(1)
        
        print(f"[INFO] Starting server on port {port}...")
        start_server(port)
        
    except KeyboardInterrupt:
        print("\n[INFO] Interrupted before starting")
        sys.exit(0)
    except Exception as e:
        print(f"[ERROR] Fatal error in main: {e}")
        traceback.print_exc()
        sys.exit(1)
