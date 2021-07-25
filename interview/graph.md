# Graphs

## Is Graph Bipartite?

TODO

We'll keep an array (or hashmap) to lookup the color of each node: color[node]. The colors could be 0, 1, or uncolored (-1 or null).

We should be careful to consider disconnected components of the graph, by searching each node. For each uncolored node, we'll start the coloring process by doing a depth-first-search on that node. Every neighbor gets colored the opposite color from the current node. If we find a neighbor colored the same color as the current node, then our coloring was impossible.

To perform the depth-first search, we use a stack. For each uncolored neighbor in graph[node], we'll color it and add it to our stack, which acts as a sort of "todo list" of nodes to visit next. Our larger loop for start... ensures that we color every node. Here is a visual dry-run of the algorithm whose Python code is below.

```cpp
bool isBipartite(vector<vector<int>>& graph) {
    int n = graph.size();
    vector<int> color(n, -1);

    for (int start = 0; start < n; ++start) {
        if (color[start] == -1) {
            stack<int> stk;
            stk.push(start);
            color[start] = 0;

            while (!stk.empty()) {
                int node = stk.top();
                stk.pop();

                for (int neigh : graph[node]) {
                    if (color[neigh] == -1) {
                        stk.push(neigh);
                        color[neigh] = color[node] ^ 1;
                    } else if (color[neigh] == color[node]) {
                        return false;
                    }
                }
            }
        }
    }
    return true;
}


```

## Shortest Path Between Buildings

https://leetcode.com/explore/interview/card/facebook/52/trees-and-graphs/3026
Disktra shortest path. Flood fill, signed distance field.

```cpp
struct Point2D {
    int x;
    int y;
};

vector<Point2D> const dmove{ {0, -1}, {0, +1}, {-1, 0}, {+1, 0} };

struct Frontier
{
    Point2D               point;
    int                   distance;
    std::vector<Point2D>  path;

    bool operator<(const struct Frontier& other) const {
        return distance > other.distance;
    }
};

vector<int> distancesA;
vector<int> distancesB;

void Dijkstra(vector<vector<int>> &graph, int width, int height, Point2D source) {
    vector<int> visited(height*width, 0);
    priority_queue<Frontier> frontierList;

    frontierList.push({ source, 0, {} });
    while (!frontierList.empty()) {
        auto current = frontierList.top();
        frontierList.pop();

        auto currentPath = current.path;
        auto currentDist = current.distance;
        currentPath.push_back(current.point);

        for (auto& dm : dmove) {
            int x = current.point.x + dm.x;
            int y = current.point.y + dm.y;
            if (x < 0 || x >= width || y < 0 || y >= height) {
                continue;
            }

            if (graph.at(y).at(x) == 0 && visited[(y * width ) + x] != 1) {
                visited[(y * width) + x] = true;
                distancesA[(y * width) + x] += currentDist + 1;
                distancesB[(y * width) + x] += 1;
                frontierList.push({ {x,y}, currentDist + 1, currentPath });
            }
        }
    }
}

int shortestDistance(vector<vector<int>>& grid) {
    int shortest = INT_MAX;
    int width = grid[0].size();
    int height = grid.size();

    distancesA.resize(height*width);
    distancesB.resize(height*width);

    vector<Point2D> buildings;
    for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
            if (grid.at(y).at(x) == 1) {
                buildings.push_back({ x, y });
            }
        }
    }

    for (auto b : buildings) {
        Dijkstra(grid, width, height, b);
    }

    int mind = INT_MAX;
    for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
            if (distancesB[(y * width) + x] == buildings.size()) {
                mind = min(mind, distancesA[(y * width) + x]);
            }
        }
    }

    return mind == INT_MAX ? -1 : mind;
}
```


## Unfinished A*

```cpp
class Solution {
public:
    struct Position {
        int x;
        int y;
        bool operator == (const struct Position& other) const {
            return x == other.x && y == other.y;
        }
    };

    struct PositionPriority {
        int priority;
        Position position;

        PositionPriority(int pri, Position& pos) :
            priority(pri), position(pos) {
        }

        bool operator<(const struct PositionPriority& other) const {
            return priority < other.priority;
        }
    };

    int d(Position a, Position b) {
        return abs(b.x - a.x) + abs(b.y - a.y);
    }

    int aStar(vector<vector<int>>& grid, Position& start, Position& goal) {
        auto h = [=](Position c) {
            return d(c, goal);
        };

        priority_queue<PositionPriority> open_set;
        open_set.push({0, start});

        vector<vector<int>> came_from = grid;
        came_from.clear();

        vector<vector<int>> g_score = grid;
        g_score.clear(); 
        g_score[start.x][start.y] = 0;

        vector<vector<int>> f_score = grid;
        for (auto &i : f_score)
            std::fill(i.begin(), i.end(), INT_MAX);

        f_score[start.x][start.y] = h(start);

        while (open_set.size() != 0) {
            auto current = open_set.top().position;
            open_set.pop();
            if (current == goal) {
                return 0; // todo
            }
            
            
        }
        return 0;
    }

    int shortestDistance(vector<vector<int>>& grid) {
        return 0;
    }
};

```

## Dijkstra’s shortest path

We maintain two sets, one set contains vertices included in shortest path tree, other set includes vertices not yet included in shortest path tree. At every step of the algorithm, we find a vertex which is in the other set (set of not yet included) and has a minimum distance from the source.

https://www.geeksforgeeks.org/dijkstras-shortest-path-algorithm-greedy-algo-7/

## Alien Dictionary

Kahn's Algorithm

1. extract char orderings from word orderings
2. build a graph using char orderings as edges and chars as nodes
3. topologically sort said graph

https://leetcode.com/problems/alien-dictionary/

## Clone

```java
class Solution {
    private HashMap <Node, Node> visited = new HashMap <> ();
    public Node cloneGraph(Node node) {
        if (node == null) {
            return node;
        }

        // If the node was already visited before.
        // Return the clone from the visited dictionary.
        if (visited.containsKey(node)) {
            return visited.get(node);
        }

        // Create a clone for the given node.
        // Note that we don't have cloned neighbors as of now, hence [].
        Node cloneNode = new Node(node.val, new ArrayList());
        // The key is original node and value being the clone node.
        visited.put(node, cloneNode);

        // Iterate through the neighbors to generate their clones
        // and prepare a list of cloned neighbors to be added to the cloned node.
        for (Node neighbor: node.neighbors) {
            cloneNode.neighbors.add(cloneGraph(neighbor));
        }
        return cloneNode;
    }
}

```
