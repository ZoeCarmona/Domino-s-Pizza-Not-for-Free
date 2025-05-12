from flask import Flask, request, jsonify
from flask_cors import CORS
import osmnx as ox
import math
import heapq

# Configuration of Flask app
app = Flask(__name__)
CORS(app)  # allowing petitions from any origin (front)

# Charging the network around a specific point
shop_point = (19.33622141133345, -99.17826954663425)
G = ox.graph_from_point(shop_point, dist=5000, network_type="drive")

# Precomputing travel_time for each edge
vmax = 20 / 3.6  # m/s
for u, v, data in G.edges(data=True):
    data['travel_time'] = data.get('length', 0) / vmax

# Using Haversine Heuristic to estimate the distance between two points
def haversine(u, v):
    lat1, lon1 = G.nodes[u]['y'], G.nodes[u]['x']
    lat2, lon2 = G.nodes[v]['y'], G.nodes[v]['x']
    φ1, φ2 = math.radians(lat1), math.radians(lat2)
    dφ = math.radians(lat2 - lat1)
    dλ = math.radians(lon2 - lon1)
    a = math.sin(dφ/2)**2 + math.cos(φ1)*math.cos(φ2)*math.sin(dλ/2)**2
    return 2 * 6_371_000 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def a_star(start, goal):
    # We need to define the heuristic function
    def heuristic(u):
        return haversine(u, goal) / vmax

    open_heap = [(heuristic(start), 0, start)]
    came_from, g_score, closed = {}, {start: 0}, set()

    while open_heap:
        f, g, current = heapq.heappop(open_heap)
        if current == goal:
            # Reconstruct the path from start to goal
            path = [current]
            while current in came_from:
                current = came_from[current]
                path.append(current)
            return list(reversed(path)), g

        if current in closed:
            continue
        closed.add(current)

        for _, nbr, data in G.out_edges(current, data=True):
            tg = g + data['travel_time']
            if tg < g_score.get(nbr, float('inf')):
                came_from[nbr] = current
                g_score[nbr] = tg
                heapq.heappush(open_heap, (tg + heuristic(nbr), tg, nbr))

    return None, None

# ── Endpoint /route ──
@app.route('/route')
def route():
    # We receive the coordinates of the start and end points
    try:
        lat1, lng1 = float(request.args['lat1']), float(request.args['lng1'])
        lat2, lng2 = float(request.args['lat2']), float(request.args['lng2'])
    except (KeyError, ValueError):
        return jsonify(error="Parámetros inválidos"), 400

    orig = ox.distance.nearest_nodes(G, lng1, lat1)
    dest = ox.distance.nearest_nodes(G, lng2, lat2)

    path, total_time = a_star(orig, dest)
    if path is None:
        return jsonify(error="No se encontró ruta"), 404

    # Making the nodes into a list of coordinates
    coords = [[G.nodes[n]['y'], G.nodes[n]['x']] for n in path]
    return jsonify({
        "coords": coords,
        "time_min": round(total_time/60, 2)
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
