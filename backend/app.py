import json, logging, time

from flask import Flask, request, g
from flask_cors import CORS

import lcautils

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app,
    resources={r"/*": {"origins": ["http://127.0.0.1:81"]}},
)

@app.before_request
def start_timer():
    g.start_time = time.time()

@app.after_request
def log_output(response):
    if hasattr(g, 'lcia4'):
        logger.info(f'>>> LCIA request: {g.lcia4} --- Response: {g.lciaResp} --- Took: {time.time() - g.start_time}')

    return response



@app.get("/listscenarios/")
def respond_with_scenarios():
    return json.dumps(lcautils.list_scenarios()), 200


@app.get("/listmethods/")
def respond_with_methods():
    return json.dumps(lcautils.list_methods()), 200


@app.post("/listactivities/")
def respond_with_activities():
    lciLookup4 = json.loads(request.data.decode("utf-8"))

    return json.dumps(lcautils.list_activities(lciLookup4)), 200


@app.post("/lcia/")
def respond_with_scores():
    lcia4 = json.loads(request.data.decode("utf-8"))

    lciaResp = lcautils.gather_lcia_results(lcia4)

    g.lcia4 = lcia4
    g.lciaResp = lciaResp

    return json.dumps(lciaResp), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
