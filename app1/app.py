from flask import Flask, jsonify
import os
import time
app = Flask(__name__)

@app.route('/')
def hello():
    return jsonify({
        "message": "Hello from App1!",
        "timestamp": time.time(),
        "instance": "app1"
    })

@app.route("/health")
def health():
    return jsonify({"status": "healthy", "service": "app1"})

@app.route('/api/data')
def api_data():
    time.sleep(0.1)
    return jsonify({
        "data": [{"id": i, "value": f"item_{i}"} for i in range(10)],
        "source": "app1"
    })

@app.route('/static/exapmle.txt')
def static_example():
    return "This is static content from App1"


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)