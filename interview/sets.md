# Intersection of Two Arrays

https://leetcode.com/problems/intersection-of-two-arrays/solution/
https://leetcode.com/problems/intersection-of-two-arrays-ii/solution/

```cpp
vector<int> intersection(vector<int>& nums1, vector<int>& nums2) {
    set<int> a;
    set<int> b;
    for (auto& n : nums1) {
        a.insert(n);
    }
    for (auto& n : nums2) {
        b.insert(n);
    }
    std::vector<int> r;
    std::set_intersection(
        a.begin(), a.end(),
        b.begin(), b.end(),
        std::back_inserter(r));
    return r;
}

```

# Accounts Merge

TODO

Disjoint set.
https://leetcode.com/problems/accounts-merge/

For easier interoperability between our DSU template, we will map each email to some integer index by using emailToID. Then, dsu.find(email) will tell us a unique id representing what component that email is in.

For more information on DSU, please look at Approach #2 in the article here. For brevity, the solutions showcased below do not use union-by-rank.
