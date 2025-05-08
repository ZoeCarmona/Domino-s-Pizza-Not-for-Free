import osmnx as ox
import networkx as nx
import matplotlib.pyplot as plt
import heapq
import math


# 1) Download a “drive” network around your pizza shop
#    Here: 5 km radius around (19.33622141133345, -99.17826954663425)
shop_point = (19.33622141133345, -99.17826954663425)
G = ox.graph_from_point(shop_point, dist=5000, network_type="drive")

# 2) Snap origin & destination points to the nearest graph nodes
orig_node = ox.distance.nearest_nodes(G, shop_point[1], shop_point[0])
# example customer ~1 km north-west
cust_point = (19.33494911708172, -99.18156102459615)
dest_node = ox.distance.nearest_nodes(G, cust_point[1], cust_point[0])

# ── 2) Compute a travel_time (in seconds) for each edge
vmax = 20 / 3.6 # max speed in m/s (20 km/h)
for u, v, data in G.edges(data=True):
    data['travel_time'] = data.get('length', 0) / vmax

# ── 4) Heuristic: haversine straight-line distance ÷ vmax
def haversine(u, v):
    lat1, lon1 = G.nodes[u]['y'], G.nodes[u]['x']
    lat2, lon2 = G.nodes[v]['y'], G.nodes[v]['x']
    φ1, φ2 = math.radians(lat1), math.radians(lat2)
    dφ = math.radians(lat2 - lat1)
    dλ = math.radians(lon2 - lon1)
    a = math.sin(dφ/2)**2 + math.cos(φ1)*math.cos(φ2)*math.sin(dλ/2)**2
    return 2 * 6_371_000 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def heuristic(u):
    return haversine(u, dest_node) / vmax

# ── 5) Custom A* implementation
def a_star(graph, start, goal):
    open_heap = [(heuristic(start), 0, start)]
    came_from = {}
    g_score = {start: 0}
    closed = set()

    while open_heap:
        f, g, current = heapq.heappop(open_heap)
        if current == goal:
            # rebuild path
            path = [current]
            while current in came_from:
                current = came_from[current]
                path.append(current)
            return list(reversed(path))

        if current in closed:
            continue
        closed.add(current)

        for _, nbr, data in graph.out_edges(current, data=True):
            tg = g + data['travel_time']
            if tg < g_score.get(nbr, float('inf')):
                came_from[nbr] = current
                g_score[nbr] = tg
                heapq.heappush(open_heap, (tg + heuristic(nbr), tg, nbr))

    return None

route = a_star(G, orig_node, dest_node)
if not route:
    raise RuntimeError("No path found!")

# ── 6) Sum up the actual travel_time along that route
total_time = 0
for u, v in zip(route[:-1], route[1:]):
    ed = G.get_edge_data(u, v)
    # pick the fastest edge if multiple parallel ones exist
    tt = min(d['travel_time'] for d in ed.values())
    total_time += tt

print(f"🕑 Estimated total travel time: {total_time/60:.2f} minutes")

# ── 7) Plot the route for visual check
fig, ax = ox.plot_graph_route(
    G, route,
    route_linewidth=4,
    node_size=0,
    bgcolor="white"
)
plt.show()