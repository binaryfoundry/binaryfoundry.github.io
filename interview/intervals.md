Usually think sorting.

# Merge Intervals

```cpp
vector<vector<int>> merge(vector<vector<int>>& intervals) {
    sort(intervals.begin(), intervals.end());

    vector<vector<int>> merged;
    for (auto interval : intervals) {
        // if the list of merged intervals is empty or if the current
        // interval does not overlap with the previous, simply append it.
        if (merged.empty() || merged.back()[1] < interval[0]) {
            merged.push_back(interval);
        }
        // otherwise, there is overlap, so we merge the current and previous
        // intervals.
        else {
            merged.back()[1] = max(merged.back()[1], interval[1]);
        }
    }
    return merged;
}

```

# Interval Scheduling Problem

Use this algo Sort the elements by finish time. Use greedy and include the first interval. Mark its end time.

If second interval starts after end time, include it as well and update end time. Else move on to third interval.

https://stackoverflow.com/questions/56500343/maximum-number-of-meetings-that-we-can-conduct/56502047#56502047

The following greedy algorithm, called Earliest deadline first scheduling, does find the optimal solution for unweighted single-inteval scheduling:

1. Select the interval, x, with the earliest finishing time.
2. Remove x, and all intervals intersecting x, from the set of candidate intervals.
3. Repeat until the set of candidate intervals is empty.

The greedy algorithm can be executed in time O(n log n), where n is the number of tasks, using a preprocessing step in which the tasks are sorted by their finishing times.
