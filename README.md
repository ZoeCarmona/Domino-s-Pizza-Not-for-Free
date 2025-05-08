# Domino’s Pizza Not for Free!

A web application that checks whether a Domino’s Pizza can be delivered to a customer in under 30 minutes—otherwise, the pizza is free! If the customer is outside the 6-mile (9.6 km) delivery radius, the app notifies them that delivery isn’t available. Otherwise, it computes the fastest route from the pizzeria to the customer’s address and displays the estimated delivery time.

---

## Table of Contents

- [Features](#features)  
- [Technologies](#technologies)  
- [Algorithm](#algorithm)  

---

## Features

- **Delivery Radius Check**  
  Ensures the customer’s address is within a 6 mile (9.6 km) radius; otherwise shows an “out of range” warning.

- **Fastest-Route Calculation**  
  Fetches live traffic data and routing restrictions to determine the quickest path.

- **30-Minute Guarantee**  
  If the estimated delivery time exceeds 30 minutes, displays a “pizza for free” message.

---

## Technologies

1. **Google Maps Directions API**  
   - Real-time traffic  
   - Route restrictions  
   - Estimated durations  
2. **A\*** **Pathfinding Algorithm**  
   - \(g(n)\): Exact cost from the start node  
   - \(h(n)\): Heuristic cost estimate to the goal  
3. **Frontend**  
   - HTML5 / CSS3 / JavaScript  
   - (Framework of your choice: React, Vue, or plain JS)  
4. **Backend** (optional)  
   - Node.js / Express (or any server-side framework)  
   - Environment variables for API keys  

---

## Algorithm

We use the A\* algorithm to balance accuracy and performance:

- **g(n)**: Actual travel time from the pizzeria to the current waypoint, obtained from Directions API legs.  
- **h(n)**: Heuristic estimate—straight-line (“as-the-crow-flies”) distance divided by average speed.

This combination ensures we efficiently zero in on the fastest route while accounting for real-time conditions.

---

