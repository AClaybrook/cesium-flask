from flask import Flask, render_template, url_for

# Initialize app
app = Flask(__name__)

# Add root of websire
@app.route('/')
def home():
    return render_template('index.html',data={'online':True})

# Run if main
if __name__ == "__main__":
    app.run(debug=True)
