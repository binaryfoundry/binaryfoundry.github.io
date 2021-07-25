
## List all Permutations:

```cpp
void permutations(vector<int> nums, int size, int depth = 0) {
    if (depth == size) {
        for (int i = 0; i < size; i++) {
            cout << nums[i];
        }
        cout << "\n";
        return;
    }
    for (int i = depth; i < nums.size(); i++) {
        swap(nums[depth], nums[i]);
        permutations(nums, size, depth + 1);
        swap(nums[depth], nums[i]);
    }
}

```

```cpp
void counting(vector<int> nums, string o = "", int depth = 0) {
    if (depth == nums.size()) {
        cout << o << "\n";
        return;
    }
    for (int i = 0; i < nums.size(); i++) {
        counting(nums, o + std::to_string(nums[i]), depth + 1);
    }
}

```

## Next Permutation

https://leetcode.com/problems/next-permutation/solution/

Next highest number with same digits.

1. Find first decreasing element to left: A
2. Find next larger element than A to right: B
3. Swap A and B
4. Reverse A+1 to end

```cpp
public void nextPermutation(int[] nums) {
    int i = nums.length - 2;
    while (i >= 0 && nums[i + 1] <= nums[i]) {
        i--;
    }
    if (i >= 0) {
        int j = nums.length - 1;
        while (nums[j] <= nums[i]) {
            j--;
        }
        swap(nums, i, j);
    }
    reverse(nums, i + 1);
}

private void reverse(int[] nums, int start) {
    int i = start, j = nums.length - 1;
    while (i < j) {
        swap(nums, i, j);
        i++;
        j--;
    }
}

private void swap(int[] nums, int i, int j) {
    int temp = nums[i];
    nums[i] = nums[j];
    nums[j] = temp;
}

```

## List all Combinations:

https://www.geeksforgeeks.org/print-all-possible-combinations-of-r-elements-in-a-given-array-of-size-n/
https://leetcode.com/problems/combinations/
https://www.geeksforgeeks.org/make-combinations-size-k/

```cpp
void combinations(vector<int> nums, string o = "", int depth = 0) {
    cout << o << "\n";
    for (int i = depth; i < nums.size(); i++) {
        combinations(nums, o + std::to_string(nums[i]), i + 1);
    }
}

```

## Letter Combinations

https://leetcode.com/problems/letter-combinations-of-a-phone-number/

```cpp
vector<string> r;

const vector<string> grammar = {
    "",
    "",
    "abc",
    "def",
    "ghi",
    "jkl",
    "mno",
    "pqrs",
    "tuv",
    "wxyz"
};

void helper(string& s, string w, int i) {
    if (i >= s.length()) {
        r.push_back(w);
        return;
    }

    int digit = s[i] - '0';
    string word = grammar[digit];

    for (int j = 0; j < word.size(); j++) {
        string w2 = w + word.at(j);
        helper(s, w2, i+1);
    }
}

vector<string> letterCombinations(string digits) {
    if (digits.size() > 0)
        helper(digits, "", 0);
    return r;
}

```

## Subsets

Has solution.
https://leetcode.com/problems/subsets/

```cpp
vector<vector<int>>result;
vector<int>path;

void backtrack(vector<int>&nums,int start) {
    result.push_back(path);

    for(int i = start; i < nums.size(); i++) {
        path.push_back(nums[i]);
        backtrack(nums,i+1);
        path.pop_back();
    }
}

vector<vector<int>> subsets(vector<int>& nums) {
    backtrack(nums,0);
    return result;
}

```

## Letter Combinations of a Phone Number

```cpp
const vector<string> grammar = {
    "",
    "",
    "abc",
    "def",
    "ghi",
    "jkl",
    "mno",
    "pqrs",
    "tuv",
    "wxyz"
};

void helper(string& s, vector<string>& r, string w = "", int i = 0) {
    if (s.size() == 0)
        return;

    if (i >= s.length()) {
        r.push_back(w);
        return;
    }

    int digit = s[i] - '0';
    string word = grammar[digit];

    for (int j = 0; j < word.size(); j++) {
        string w2 = w + word.at(j);
        helper(s, r, w2, i + 1);
    }
}

vector<string> letterCombinations(string digits) {
    vector<string> r;
    helper(digits, r);
    return r;
}

```
