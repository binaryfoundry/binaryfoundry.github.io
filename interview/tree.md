# Binary Trees

## BFS

Can also go right to left.

```cpp
queue<TreeNode*> q;
q.push(root);
while (!q.empty()) {
    TreeNode* t  = q.front();
    q.pop();
    if (t->left != nullptr)
        q.push(t->left);
    if (t->right != nullptr)
        q.push(t->right);
}

```

BFS level

```cpp
int level = 0;
queue<TreeNode*> q;
q.push(root);
while (!q.empty()) {
    int level_size = q.size();

    while (level_size--) {
        TreeNode* t  = q.front();
        q.pop();

        if (t->left != nullptr)
            q.push(t->left);
        if (t->right != nullptr)
            q.push(t->right);
    }
    level++;
}

```

## Validate BST

```cpp
int prev = -INT_MAX;

bool isValidBST(TreeNode* root) {
    if (root == nullptr) return true;
    if(!isValidBST(root->left)) return false;
    if(prev != -INT_MAX && root->val <= prev) return false;
    prev = root->val;
    return isValidBST(root->right);
}

```

## Same Tree

https://leetcode.com/problems/same-tree

```cpp
bool isSameTree(TreeNode* p, TreeNode* q) {
    // p and q are both null
    if (p == nullptr && q == nullptr) return true;
    // one of p and q is null
    if (q == nullptr || p == nullptr) return false;
    if (p->val != q->val) return false;
    return isSameTree(p->right, q->right) &&
            isSameTree(p->left, q->left);
}
```

## Merge Binary Trees

https://leetcode.com/problems/merge-two-binary-trees/

```cpp
TreeNode* mergeTrees(TreeNode* t1, TreeNode* t2) {
    if (t1 == nullptr)
        return t2;
    if (t2 == nullptr)
        return t1;
    t1->val += t2->val;
    t1->left = mergeTrees(t1->left, t2->left);
    t1->right = mergeTrees(t1->right, t2->right);
    return t1;
}
```

```java
public TreeNode mergeTrees(TreeNode t1, TreeNode t2) {
    if (t1 == null)
        return t2;
    Stack < TreeNode[] > stack = new Stack < > ();
    stack.push(new TreeNode[] {t1, t2});
    while (!stack.isEmpty()) {
        TreeNode[] t = stack.pop();
        if (t[0] == null || t[1] == null) {
            continue;
        }
        t[0].val += t[1].val;
        if (t[0].left == null) {
            t[0].left = t[1].left;
        } else {
            stack.push(new TreeNode[] {t[0].left, t[1].left});
        }
        if (t[0].right == null) {
            t[0].right = t[1].right;
        } else {
            stack.push(new TreeNode[] {t[0].right, t[1].right});
        }
    }
    return t1;
}

```

## Is Binary Tree Mirror

```cpp
bool isMirror(TreeNode* t1, TreeNode* t2) {
    if (t1 == nullptr && t2 == nullptr) return true;
    if (t1 == nullptr || t2 == nullptr) return false;
    return (t1->val == t2->val)
        && isMirror(t1->right, t2->left)
        && isMirror(t1->left, t2->right);
}

bool isSymmetric(TreeNode* root) {
    return isMirror(root, root);
}

```

## Binary Tree Vertical Order Traversal

https://leetcode.com/problems/binary-tree-vertical-order-traversal/

```cpp
map<int, vector<tuple<int, int>>> cols;

void helper(TreeNode* node, int row, int col) {
    if (node == nullptr) return;
    cols[col].push_back({node->val, col});
    helper(node->left, row + 1, col - 1);
    helper(node->right, row + 1, col + 1);
}

vector<vector<int>> verticalOrder(TreeNode* root) {
    helper(root, 0, 0);

    vector<vector<int>> r;
    r.resize(cols.size());
    int row = 0;
    for (auto& b : cols) {
        int key = b.first;
        auto& c = b.second;
        std::sort(begin(c), end(c), 
            [](tuple<int, int> const &t1, tuple<int, int> const &t2) {
                return get<1>(t1) < get<1>(t2);
            }
        );
        for (auto& v : c) {
            r[row].push_back(get<0>(v));
        }
        row++;
    }

    return r;
}

```

## Lowest Common Ancestor

https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree-iii/

```cpp

Node* lowestCommonAncestor(Node* p, Node * q) {
    Node* pp = p, *qq = q;
    while(pp!=qq)
    {
        pp = pp->parent ? pp->parent : q;
        qq = qq->parent ? qq->parent : p;
    }
    return pp;
}

```


## Unique Binary Search Trees

Catalan numbers get big fast, consider a 32-bit LUT.
https://leetcode.com/problems/unique-binary-search-trees/solution/

```cpp
vector<int> dp;
int helper(int n) {
    if(n==0 || n==1) return 1;

    if(dp[n] != -1) return dp[n];

    int ans = 0;

    // (1..i-1) left permutations * (n-i) right permutations
    for(int i = 1;i <= n; i++) {
        ans = ans + helper(i - 1) * helper(n - i);
    }

    return dp[n] = ans;
}
int numTrees(int n) {
    dp.resize(n + 1, -1);
    return helper(n);
}

```

```cpp
int numTrees(int n) {
    vector<uint64_t> catalan = { 1, 1, 2, 5, 14, 42, 132, 429, 1430, 4862, 16796, 58786, 208012, 742900, 2674440, 9694845, 35357670, 129644790, 477638700, 1767263190, 6564120420, 24466267020, 91482563640, 343059613650, 1289904147324, 4861946401452, 18367353072152, 69533550916004, 263747951750360, 1002242216651368 };
    return catalan[n];
}
```

## Flatten Binary Tree to Linked List

Stack.
https://leetcode.com/problems/flatten-binary-tree-to-linked-list/

```java
public void flatten(TreeNode root) {

    // Handle the null scenario
    if (root == null) {
        return;
    }

    TreeNode node = root;

    while (node != null) {

        // If the node has a left child
        if (node.left != null) {

            // Find the rightmost node
            TreeNode rightmost = node.left;
            while (rightmost.right != null) {
                rightmost = rightmost.right;
            }

            // rewire the connections
            rightmost.right = node.right;
            node.right = node.left;
            node.left = null;
        }

        // move on to the right side of the tree
        node = node.right;
    }
}

```

## Univalued Binary Tree

A tree is univalued if both its children are univalued, plus the root node has the same value as the child nodes.

## Longest Univalue Path

Remember to start from base.
https://leetcode.com/problems/longest-univalue-path/

```cpp

int max_path = 0;
int longestUnivaluePath(TreeNode* root) {
    postorder(root);
    return max_path;
}

bool sameas(TreeNode* node, int value) {
    return node && node->val == value;
}

int postorder(TreeNode* root) {
    if (root == nullptr) return 0;

    int left_length = postorder(root->left);
    int right_length = postorder(root->right);

    int lhs = sameas(root->left, root->val) ? left_length : 0;
    int rhs = sameas(root->right, root->val) ? right_length : 0;

    max_path = max(max_path, lhs + rhs);
    return max(lhs, rhs) + 1;
}


```


## Binary Tree Path Sum

```cpp
int target = 0;
bool found = false;

void checkTarget(TreeNode* node, int sum) {
    if (node == nullptr) return;
    sum += node->val;
    if (node->left == nullptr && node->right == nullptr) {
        if (sum == target) found = true;
        return;
    }

    checkTarget(node->left, sum);
    checkTarget(node->right, sum);
}

bool hasPathSum(TreeNode* root, int targetSum) {
    target = targetSum;
    checkTarget(root, 0);
    return found;
}

```

## Invert Binary Tree

```cpp
TreeNode* invertTree(TreeNode* root) {
    if (root == nullptr) return nullptr;
    invertTree(root->left);
    invertTree(root->right);
    TreeNode* t = root->left;
    root->left = root->right;
    root->right = t;
    return root;
}

```

## Binary Tree Diameter

https://leetcode.com/problems/diameter-of-binary-tree/solution/

```cpp
int diameter = 0;

int helper(TreeNode* root) {
    if (root == nullptr)
        return 0;

    int l = helper(root->left);
    int r = helper(root->right);
    diameter = max(diameter, l + r);
    return max(l, r) + 1;
}

int diameterOfBinaryTree(TreeNode* root) {
    helper(root);
    return diameter;
}

```

## Is Sub Tree

https://www.geeksforgeeks.org/check-if-a-binary-tree-is-subtree-of-another-binary-tree/?ref=lbp

## Symmetric Tree

Pass in root as parameter twice.
https://leetcode.com/problems/symmetric-tree/
