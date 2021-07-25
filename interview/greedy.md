# Jump Game

## Greedy.

```cpp
bool canJump(vector<int>& nums) {
    // Tracks the furthest reachable position
    int lastGood = 0;
    for(int i = 0; i < nums.size(); i++) {
        // We have run out of steps
        if(i > lastGood) 
            return false;
        lastGood = max(lastGood, i + nums[i]);
    }
    return true;
}

```

## Backtracking

```cpp
bool canJumpFromPosition(int position, vector<int>& nums) {
    if (position == nums.size() - 1) {
        return true;
    }

    int furthestJump = std::min(position + nums[position], (int)(nums.size() - 1));
    for (int nextPosition = position + 1; nextPosition <= furthestJump; nextPosition++) {
        if (canJumpFromPosition(nextPosition, nums)) {
            return true;
        }
    }

    return false;
}

bool canJump(vector<int> nums) {
    return canJumpFromPosition(0, nums);
}

```

## DP

```cpp
unordered_map<int, bool> memo;

bool canJumpFromPosition(int position, vector<int>& nums) {
    if (memo.find(position) != memo.end()) {
        return memo[position];
    }

    if (position == nums.size() - 1) {
        return true;
    }

    int furthestJump = std::min(position + nums[position], (int)(nums.size() - 1));
    for (int nextPosition = position + 1; nextPosition <= furthestJump; nextPosition++) {
        if (canJumpFromPosition(nextPosition, nums)) {
            memo[position] = true;
            return true;
        }
    }

    memo[position] = false;
    return false;
}

bool canJump(vector<int> nums) {
    memo[nums.size() - 1] = true;
    return canJumpFromPosition(0, nums);
}

```

# Jump Game 2 Min Jumps

```cpp
// We will use proof by contradiction to verify that the greedy algorithm is correct. Our statement is: if at any step, we make a different choice than what our greedy algorithm would make, we can find a better solution to the problem.

// Consider two people A and B, where A follows our greedy strategy and B follows the optimal solution. The number at each index defines the maximum jump distance. Let's assume that until this point, their decisions have been identical, and this is when the disagreement happens.

// Note that the choice they make for this jump will define the subarray for the next jump. The greedy solution always picks the largest subarray. Thus A will always have a larger subarray than B. Henceforth, it's not possible to beat the greedy algorithm at any step and reach the end of the array in fewer jumps; this contradicts our statement.

int jump(vector<int>& nums) {
    int jumps = 0, currentJumpEnd = 0, farthest = 0;
    for (int i = 0; i < nums.size() - 1; i++) {
        // we continuously find the how far we can reach in the current jump
        farthest = max(farthest, i + nums[i]);
        // if we have come to the end of the current jump,
        // we need to make another jump
        if (i == currentJumpEnd) {
            jumps++;
            currentJumpEnd = farthest;
        }
    }
    return jumps;
}


```
