from flask import Flask, jsonify, request, send_from_directory
import os
import time
import socket

app = Flask(__name__)

# Configuration
app.config['STATIC_FOLDER'] = 'static'
app.config['MEDIA_FOLDER'] = 'media'

# Get hostname for identifying which instance is responding
HOSTNAME = socket.gethostname()
START_TIME = time.time()

@app.route('/health')
def health():
    """Health check endpoint for Docker healthcheck"""
    return jsonify({
        'status': 'healthy',
        'service': 'app1-flask',
        'hostname': HOSTNAME,
        'uptime': time.time() - START_TIME
    }), 200

@app.route('/')
def index():
    """Main page"""
    return jsonify({
        'message': 'Welcome to App1 (Flask)',
        'hostname': HOSTNAME,
        'endpoints': {
            'health': '/health',
            'info': '/info',
            'slow': '/slow',
            'cached': '/cached',
            'static': '/static/<filename>'
        }
    })

@app.route('/info')
def info():
    """Return information about the request"""
    return jsonify({
        'service': 'app1-flask',
        'hostname': HOSTNAME,
        'client_ip': request.remote_addr,
        'headers': dict(request.headers),
        'method': request.method,
        'path': request.path,
        'timestamp': time.time()
    })

@app.route('/slow')
def slow():
    """Simulate slow endpoint (for testing timeouts)"""
    delay = int(request.args.get('delay', 2))
    time.sleep(delay)
    return jsonify({
        'message': f'Delayed response after {delay} seconds',
        'hostname': HOSTNAME
    })

@app.route('/cached')
def cached():
    """Endpoint that should be cached by Nginx"""
    return jsonify({
        'message': 'This response should be cached by Nginx',
        'hostname': HOSTNAME,
        'timestamp': time.time(),
        'cache_hint': 'If timestamp does not update, caching is working!'
    })

@app.route('/error')
def error():
    """Simulate error for testing error handling"""
    return jsonify({'error': 'Simulated error'}), 500

@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files (though Nginx should handle this)"""
    return send_from_directory(app.config['STATIC_FOLDER'], filename)

if __name__ == '__main__':
    port = int(os.getenv('APP_PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)