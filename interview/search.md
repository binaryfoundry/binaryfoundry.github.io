# First Bad Version

https://www.geeksforgeeks.org/binary-search/

```cpp
int firstBadVersion(int n) {
    int l = 1;
    int r = n;
    while (l < r) {
        int mid = left + (r - l) / 2;
        if (isBadVersion(mid)) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left;
}

```

```cpp
int findPeakElement(vector<int>& nums) {
    int l = 0;
    int r = nums.size() - 1;
    while (l < r) {
        int mid = (l + r) / 2;
        if (nums[mid] > nums[mid + 1])
            r = mid;
        else
            l = mid + 1;
    }
    return l;
}

```

# First and Last Position of Element in Sorted Array

Find bound.

https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array
https://www.youtube.com/watch?v=4sQL7R5ySUU

```cpp
int findBound(vector<int>& nums, int target, bool is_first) {
    int l = 0;
    int r = nums.size() - 1;
    while (l <= r) {
        int mid = (l + r) / 2;
        if (nums[mid] == target) {
            if (is_first) {
                if (mid == l || nums[mid - 1] != target) {
                    return mid;
                }
                r = mid - 1;
            } else {
                if (mid == r || nums[mid + 1] != target) {
                    return mid;
                }
                l = mid + 1;
            }
        }
        else if (nums[mid] > target) {
            r = mid - 1;
        }
        else {
            l = mid + 1;
        }
    }
    return -1;
}

vector<int> searchRange(vector<int>& nums, int target) {
    int low = findBound(nums, target, true);
    if (low == -1) return { -1, -1 };
    int high = findBound(nums, target, false);
    return { low, high };
}

```

# Rotated Sorted Array

1. Take an index in the middle mid as a pivot.
2. If nums[mid] == target, the job is done, return mid.
3. Now there could be two situations
4. Pivot element is larger than the first element in the array, i.e. the subarray from the first element to the pivot is non-rotated, as shown in the following graph.
5. Pivot element is smaller than the first element of the array, i.e. the rotation index is somewhere between 0 and mid. It implies that the sub-array from the pivot element to the last one is non-rotated, as shown in the following graph.

```cpp

public int search(int[] nums, int target) {
    int start = 0, end = nums.length - 1;
    while (start <= end) {
        int mid = start + (end - start) / 2;
        if (nums[mid] == target) return mid;
        else if (nums[mid] >= nums[start]) {
            if (target >= nums[start] && target < nums[mid]) end = mid - 1;
            else start = mid + 1;
        }
        else {
            if (target <= nums[end] && target > nums[mid]) start = mid + 1;
            else end = mid - 1;
        }
    }
    return -1;
}

```
