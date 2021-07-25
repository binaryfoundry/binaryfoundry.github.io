# Maximum Subarray

Remove negative prefix along sliding window

```cpp
//https://www.geeksforgeeks.org/largest-sum-contiguous-subarray/
//Kadane’s algorithm
// https://www.youtube.com/watch?v=5WZl3MMT0Eg
int maxSubArray(vector<int>& nums) {
    int m = nums[0];
    int current_sum = 0;

    for (auto& n : nums) {
        if (current_sum < 0) current_sum = 0; // <--
        current_sum += n;
        m = max(current_sum, m);
    }
    return m;
}

```

# Sub Array Sum

https://leetcode.com/problems/continuous-subarray-sum/

[23,2,6,4,7], k=6

```cpp
bool checkSubarraySum(vector<int>& nums, int k) {
    if (nums.size()<2) return false;
    vector<int> pref (nums.size()+1, 0);

    for (int i = 1;i<=nums.size();i++) {
        pref[i] = pref[i-1] + nums[i-1];
        if (i < nums.size() && nums[i-1] == 0 && nums[i] == 0) {
            return true;
        }
    }

    for (int i = 2; i <= nums.size();i++) {
        if(pref[i] -pref[0] < k) continue;
        for(int j = 0 ; j < i-1;j++) {
            if ((pref[i] - pref[j])%k ==0) {
                return true;
            }
        }
    }

    return false;
}

```

# kth Smallest Subarray Sum

https://leetcode.com/problems/kth-smallest-subarray-sum/

```cpp
int kthSmallestSubarraySum(vector<int>& nums, int k) {
    int l = 0, r = 1e9, ans = -1, n = nums.size();
    while(l <= r){
        int mid = (l+r) >> 1;

        int count = 0;
        for(int i = 0, j = 0, sum = 0; j < n; j++){
            sum += nums[j];
            while(i <= j and sum > mid) sum -= nums[i++];
            count += j - i + 1;
        }

        if(count >= k){
            ans = mid;
            r = mid - 1;
        }
        else l = mid + 1;
    }
    return ans;
}

```

# Subarray Sum Equals K

https://leetcode.com/problems/subarray-sum-equals-k/

## Using Cumulative Sum

```cpp
int subarraySumA(vector<int>& nums, int k) {
    int count = 0;
    vector<int> sum (nums.size() + 1);
    sum[0] = 0;
    for (int i = 1; i <= nums.size(); i++) {
        sum[i] = sum[i - 1] + nums[i - 1];
    }
    for (int start = 0; start < nums.size(); start++) {
        for (int end = start + 1; end <= nums.size(); end++) {
            if (sum[end] - sum[start] == k) {
                count++;
            }
        }
    }
    return count;
}


```

## Using Hashmap

[3,4,7,2,-3,1,4,2]

We can do this in O(n) but we have to track when k is found multiple times. Works similarly to Two Sum.

 if the cumulative sum up to two indices, say i and j is at a difference of k i.e. if ksum[i]− sum[j] = k, the sum of elements lying between indices i and j is k.

```cpp
int subarraySum(vector<int>& nums, int k) {
    int count = 0, sum = 0;
    unordered_map<int,int> hmap;
    hmap[0] = 1; // because we start with cumsum == 0
    for (int i = 0; i < nums.size(); i++) {
        // track cumsum
        sum += nums[i];
        // If there is an entry with cumsum - k then add value count
        if (hmap.find(sum - k) != hmap.end()) {
            count += hmap[sum - k];
        }
        // update for cumsums found more than once
        int hs = 0;
        if (hmap.find(sum) != hmap.end()) {
            hs = hmap[sum];
        }
        // update for cumsums found at least once
        hmap[sum] = hs + 1;
    }
    return count;
}

```
