First, the question is asking for the maximum or minimum of something. Second, we have to make decisions that may depend on previously made decisions, which is very typical of a problem involving subsequences.

# Top 5 DP Patterns

https://www.youtube.com/watch?v=mBNrRy2_hVs&list=WL

* Fib
* 0/1 Knapsack
* Unbounded Knapsack
* Longest Common Subsequence
* Pallendromes

# Fib DP

```cpp
unordered_map<int, int> memo;

int fib(int n) {
    if (memo.find(n) != memo.end())
        return memo[n];
    if (n==0) return 0;
    if (n==1) return 1;
    int f = fib(n - 1) + fib(n - 2);
    memo[n] = f;
    return f;
}

```

# Grid Traveler

m-1 and n-1 because target is at 1,1 and 0 or 0 is out of bounds.

https://leetcode.com/problems/unique-paths/

```cpp
int memo[101][101];

int helper(int m, int n) {
    if (memo[m][n] != -1) return memo[m][n];
    if (m==1 && n==1) return 1;
    if (m==0 || n==0) return 0;

    int r = helper(m - 1, n) + helper(m, n - 1);
    memo[m][n] = r;
    return r;
}

int uniquePaths(int m, int n) {
    for (int i=0; i<101; i++)
        for (int j=0; j<101;j++)
            memo[i][j] = -1;
    return helper(m, n);
}

```

# Climbing Stairs (steps)

https://leetcode.com/problems/climbing-stairs/

```cpp
array<int, 45> memo;

int climb_Stairs(int i, int n)  {
    if (i > n) {
        return 0;
    }
    if (i == n) {
        return 1;
    }
    if (memo[i] > 0) {
        return memo[i];
    }
    memo[i] = climb_Stairs(i + 1, n) + climb_Stairs(i + 2, n);
    return memo[i];
}

int climbStairs(int n) {
    return climb_Stairs(0, n);
}

```

# Can Sum

```javascript
var memo = {}

canSum = (targetSum, numbers) => {
  if (targetSum in memo) return memo[targetSum];
  if (targetSum === 0) return true;
  if (targetSum < 0) return false;

  for (let num of numbers) {
    const rem = targetSum - num;
    if (canSum(rem, numbers) === true) {
      memo[targetSum] = true;
      return true;
    }
  }
  memo[targetSum] = false;
  return false;
}

```

# How Sum

```javascript
var memo = {};

howSum = (targetSum, numbers) => {
    if (targetSum in memo) return memo[targetSum];
    if (targetSum === 0) return [];
    if (targetSum < 0) return false;

    for (let num of numbers) {
        const rem = targetSum - num;
        const remResult = howSum(rem, numbers);

        if (remResult != null) {
            memo[targetSum] = [...remResult, num];
            return memo[targetSum];
        }
    }
    memo[targetSum] = null;
    return null;
}

```

# Coin Change

https://leetcode.com/problems/coin-change

```cpp
int min_count = INT_MAX;

void helper(vector<int>& coins, int amount, int depth) {
    if (amount == 0) {
        min_count = min(depth, min_count);
    };

    if (amount < 0) return;

    for (auto& c : coins) {
        int a = amount - c;
        helper(coins, a, depth + 1);
    }
}

int coinChange(vector<int>& coins, int amount) {
    helper(coins, amount, 0);
    return min_count == INT_MAX ? -1 : min_count;
}

```

```cpp
map<int, int> memo;

int helper(vector<int>& coins, int amount, int depth) {
    if (amount == 0) {
        return 0;
    };

    if (amount < 0) {
        return -1;
    }

    if (memo.find(amount) != memo.end()) {
        return memo[amount];
    }

    int mn = INT_MAX;

    for (auto& c : coins) {
        int r = helper(coins, amount - c, depth + 1);
        if (r >= 0 && r < mn) {
            mn = 1 + r;
        }
    }

    memo[amount] = mn == INT_MAX ? -1 : mn;
    return memo[amount];
}

int coinChange(vector<int>& coins, int amount) {
    if (amount < 1) return 0;
    return helper(coins, amount, 0);
}

```

# Decode Ways

https://leetcode.com/problems/decode-ways/submissions/

```cpp
vector<string> grammar;
map<string, int> memo;

bool isPrefix(string& a, string& b) {
    auto res = std::mismatch(a.begin(), a.end(), b.begin());
    return res.first == a.end();
}

int decode(string s) {
    if (s.length() == 0) {
        return 0;
    }
    if (memo.find(s) != memo.end()) {
        return memo[s];
    }

    int count = 0;
    for (auto& p : grammar) {
        if (isPrefix(p, s)) {
            if (s.length() == p.length()) {
                count++;
            }
            else {
                count += decode(s.substr(p.length()));
            }
        }
    }

    memo[s] = count;
    return count;
}

int numDecodings(string s) {
    for (int i = 1; i <= 26; i++) {
        grammar.push_back(to_string(i));
    }
    return decode(s);
}

```

# Longest Increasing Subsequence

DP, size of nums, init to 1. The minimum LIS from all values is 1.
Quadratic loop i,j+1 max. Return longest from DP.
https://leetcode.com/problems/longest-increasing-subsequence/

[10,9,2,5,3,7,101,18]

```cpp
int lengthOfLIS(vector<int>& nums) {
    vector<int> dp(nums.size());
    for (int i = 0; i < nums.size(); i++)
        dp[i] = 1;

    for (int i = nums.size()-1; i >=0 ; i--) {
        for (int j = i+1; j < nums.size(); j++) {
            if (nums[i] < nums[j]) {
                dp[i] = std::max(dp[i], dp[j] + 1);
            }
        }
    }

    int longest = 0;
    for (int i = 0; i < nums.size(); i++) {
        longest = std::max(longest, dp[i]);
    }
    return longest;
}

```

# Longest Common Subsequence

https://leetcode.com/problems/longest-common-subsequence/

```cpp
int lcs(string X, string Y, int m, int n) {
    if (m == 0 || n == 0)
        return 0;

    if (X[m - 1] == Y[n - 1])
        return 1 + lcs(X, Y, m - 1, n - 1);
    else
        return max(lcs(X, Y, m, n - 1),
                   lcs(X, Y, m - 1, n));
}

```

```cpp
int lcs(string X, string Y, int m, int n, int dp[][maximum]) {
    // base case
    if (m == 0 || n == 0)
        return 0;

    // if the same state has already been
    // computed
    if (dp[m - 1][n - 1] != -1)
        return dp[m - 1][n - 1];

    // if equal, then we store the value of the
    // function call
    if (X[m - 1] == Y[n - 1]) {
        // store it in arr to avoid further repetitive
        // work in future function calls
        dp[m - 1][n - 1] = 1 + lcs(X, Y, m - 1, n - 1, dp);
        return dp[m - 1][n - 1];
    }
    else {
        // store it in arr to avoid further repetitive
        // work in future function calls
        dp[m - 1][n - 1] = max(lcs(X, Y, m, n - 1, dp),
                               lcs(X, Y, m - 1, n, dp));
        return dp[m - 1][n - 1];
    }
}

```

# Combination Sum IV

https://leetcode.com/problems/combination-sum-iv

```java
class Solution {
    private HashMap<Integer, Integer> memo;

    public int combinationSum4(int[] nums, int target) {
        // minor optimization
        // Arrays.sort(nums);
        memo = new HashMap<>();
        return combs(nums, target);
    }

    private int combs(int[] nums, int remain) {
        if (remain == 0)
            return 1;
        if (memo.containsKey(remain))
            return memo.get(remain);

        int result = 0;
        for (int num : nums) {
            if (remain - num >= 0)
                result += combs(nums, remain - num);
            // minor optimizaton, early stopping
            // else
            //     break;
        }
        memo.put(remain, result);
        return result;
    }
}

```

# Word Break

https://leetcode.com/problems/word-break/solution/

```cpp
unordered_map<string, bool> memo;

bool wordBreak(string s, vector<string>& wordDict) {
    if (s == "")
        return true;

    if (memo.find(s) != memo.end()) {
        return memo[s];
    }

    bool ok = false;

    for (auto& word : wordDict) {
        string c = s.substr(0, word.length());

        if (c == word) {
           ok |= wordBreak(s.substr(word.length(), s.length()), wordDict);
        }
    }

    memo[s] = ok;
    return ok;
}

```


# Regex Matching

```cpp
// Brute Force
bool dfs(string& s, string& p, int i, int j) {
    // Both pointers moved beyond s and b, we have a match
    if (i >= s.length() && j >= p.length())
        return true;
    // no match
    if (j >= p.length())
        return false;

    // if i in bounds and char match or '.' match set flag. 
    bool match = i < s.length() && (s[i] == p[j] || p[j] == '.');
    bool has_star = j + 1 < p.length() && p[j + 1] == '*';

    if (has_star) {
        return dfs(s, p, i, j + 2) ||        // use *
            (match && dfs(s, p, i + 1, j));  // dont use *
    }
    if (match) {
        return dfs(s, p, i + 1, j + 1);
    }

    return false;
}

bool isMatch(string s, string p) {
    return dfs(s, p, 0, 0);
}

```

```cpp
unordered_map<string, bool> memo;

bool check_memo(string& key) {
    return memo.find(key) != memo.end();
}

bool dfs(string& s, string& p, int i, int j) {
    string key = to_string(i) + "x" + to_string(j);

    if (check_memo(key))
        return memo[key];

    // Both pointers moved beyond s and b, we have a match
    if (i >= s.length() && j >= p.length())
        return true;
    // no match
    if (j >= p.length())
        return false;

    // if i in bounds and char match or '.' match set flag. 
    bool match = i < s.length() && (s[i] == p[j] || p[j] == '.');
    bool has_star = j+1 < p.length() && p[j + 1] == '*';

    if (has_star) {
        memo[key] = dfs(s, p, i, j + 2) ||       // use *
            (match && dfs(s, p, i + 1, j));      // dont use *
        return memo[key];
    }
    if (match) {
        memo[key] = dfs(s, p, i + 1, j + 1);
        return memo[key];
    }

    memo[key] = false;
    return false;
}

bool isMatch(string s, string p) {
    return dfs(s, p, 0, 0);
}
```

# Remove Invalid Parenthesis

BFS not DFS. BFS makes much more sense.

```cpp
bool isValid(string expr) {
    int count = 0;
    for (auto& ch : expr) {
        if (ch != '(' && ch != ')') {
            continue;
        }
        if (ch == '(') {
            count++;
        }
        if (ch == ')') {
            count--;
        }
        if (count < 0) {
            return false;
        }
    }
    return count == 0;
}
#include <deque>
#include <unordered_set>

vector<string> removeInvalidParentheses(string s) {
    if (s.size() == 0) {
        return { "" };
    }

    vector<string> output;

    std::unordered_set<string> visited;
    std::deque<string> q;
    q.push_back(s);
    bool found = false;

    while (q.size() != 0) {
        string expr = q.front();
        q.pop_front();
        if (isValid(expr)) {
            output.push_back(expr);
            found = true;
        }

        if (found) {
            continue;
        }

        for (int i = 0; i < expr.size(); i++) {
            if (expr[i] != '(' && expr[i] != ')') {
                continue;
            }

            string candidate = expr.substr(0, i) + expr.substr(i + 1, expr.size());
            if (visited.find(candidate) == visited.end()) {
                q.push_back(candidate);
                visited.insert(candidate);
            }
        }
    }

    return output;
}

```

```
---
)())() // A
(())() // B
()))()
()()()
()()()
()()))
()())(
--- // Of A try all combinations, none are valid so go to B
())()
)))()
)()()
)()()
)()))
)())(
B is valid return
```

# Word Break II

https://leetcode.com/problems/word-break-ii/

```java
class Solution {
    protected Set<String> wordSet;
    protected HashMap<String, List<List<String>>> memo;

    public List<String> wordBreak(String s, List<String> wordDict) {
        wordSet = new HashSet<>();
        for (String word : wordDict) {
            wordSet.add(word);
        }
        memo = new HashMap<String, List<List<String>>>();

        _wordBreak_topdown(s);

        // chain up words together
        List<String> ret = new ArrayList<String>();
        for (List<String> words : memo.get(s)) {
            StringBuffer sentence = new StringBuffer();
            for (String word : words) {
                sentence.insert(0, word);
                sentence.insert(0, " ");
            }
            ret.add(sentence.toString().strip());
        }

        return ret;
    }

    protected List<List<String>> _wordBreak_topdown(String s) {
        if (s.equals("")) {
            List<List<String>> solutions = new ArrayList<List<String>>();
            solutions.add(new ArrayList<String>());
            return solutions;
        }

        if (memo.containsKey(s)) {
            return memo.get(s);
        } else {
            List<List<String>> solutions = new ArrayList<List<String>>();
            memo.put(s, solutions);
        }

        for (int endIndex = 1; endIndex <= s.length(); ++endIndex) {
            String word = s.substring(0, endIndex);
            if (wordSet.contains(word)) {
                List<List<String>> subsentences = _wordBreak_topdown(s.substring(endIndex));
                for (List<String> subsentence : subsentences) {
                    List<String> newSentence = new ArrayList<String>(subsentence);
                    newSentence.add(word);
                    memo.get(s).add(newSentence);
                }
            }
        }
        return memo.get(s);
    }
}

```

# House Robber

https://www.youtube.com/watch?v=73r3KWiEvyk

```python3
class Solution:
    def rob(self, nums: List[int]) -> int:
        rob1, rob2 = 0, 0
        for n in nums:
            temp = max(n+rob1, rob2)
            rob1 = rob2
            rob2 = temp
        return rob2

```
