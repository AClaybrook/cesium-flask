from flask import Flask, render_template, url_for, send_file, send_from_directory

# Initialize app
app = Flask(__name__)

# Add root of website
@app.route('/')
def home():
    return render_template('index.html',data={'online':True})

# Return czml
@app.route('/czml1')
def get_czml1():
    filename = 'data/data1.czml'
    return send_file(filename)

# Return czml
@app.route('/czml2')
def get_czml2():
    filename = 'data/data2.czml'
    return send_file(filename)

# Return data 
@app.route('/json')
def get_json():
    filename = 'data/data.json'
    return send_file(filename)


# Return Ground Stations 
@app.route('/GroundStations')
def get_groundstations():
    filename = 'data/GroundStations.json'
    return send_file(filename)

# Run if main
if __name__ == "__main__":
    app.run(debug=True)
