As others have noted, worst case of Quicksort is O(n^2), while mergesort and heapsort stay at O(nlogn). On the average case, however, all three are O(nlogn); so they're for the vast majority of cases comparable.

What makes Quicksort better on average is that the inner loop implies comparing several values with a single one, while on the other two both terms are different for each comparison. In other words, Quicksort does half as many reads as the other two algorithms. On modern CPUs performance is heavily dominated by access times, so in the end Quicksort ends up being a great first choice.

# Big Data Sort

Merge sort
Radix sort
https://en.wikipedia.org/wiki/Smoothsort
https://www.geeksforgeeks.org/algorithms-searching-and-sorting-question-16/

# Counting Sort

```cpp
#define K 4

void sortColors(vector<int>& nums) {
    std::array<int, K> c = {0,0,0,0};
    vector<int> b(nums.size());
    for (auto& n : nums) {
        c[n]++;
    }
    for (int i = 1; i < K; i++) {
        c[i] += c[i - 1];
    }
    for (int i = nums.size() - 1; i >=0; i--) {
        b[c[nums[i]] - 1] = nums[i];
        c[nums[i]]--;
    }
    for (int i = 0; i < nums.size(); i++) {
        nums[i] = b[i];
    }
}

```


# kthSmallest

```cpp
int kthSmallest(TreeNode* root, int k) {
    stack<TreeNode*> st;

    while (true) {
      while (root != nullptr) {
        st.push(root);
        root = root->left;
      }
      root = st.top();
      st.pop();
      if (--k == 0) return root->val;
      root = root->right;
    }
}

```

Quickselect is a selection algorithm to find the k-th smallest element in an unordered list. It is related to the quick sort sorting algorithm.

The algorithm is similar to QuickSort. The difference is, instead of recurring for both sides (after finding pivot), it recurs only for the part that contains the k-th smallest element. The logic is simple, if index of partitioned element is more than k, then we recur for left part. If index is same as k, we have found the k-th smallest element and we return. If index is less than k, then we recur for right part. This reduces the expected complexity from O(n log n) to O(n), with a worst case of O(n^2).

```cpp
int partition(int arr[], int l, int r) {
    int x = arr[r], i = l;
    for (int j = l; j <= r - 1; j++) {
        if (arr[j] <= x) {
            swap(arr[i], arr[j]);
            i++;
        }
    }
    swap(arr[i], arr[r]);
    return i;
}

// This function returns k'th smallest
// element in arr[l..r] using QuickSort
// based method.  ASSUMPTION: ALL ELEMENTS
// IN ARR[] ARE DISTINCT
int kthSmallest(int arr[], int l, int r, int k) {
    // If k is smaller than number of
    // elements in array
    if (k > 0 && k <= r - l + 1) {

        // Partition the array around last
        // element and get position of pivot
        // element in sorted array
        int index = partition(arr, l, r);

        // If position is same as k
        if (index - l == k - 1)
            return arr[index];

        // If position is more, recur
        // for left subarray
        if (index - l > k - 1)
            return kthSmallest(arr, l, index - 1, k);

        // Else recur for right subarray
        return kthSmallest(arr, index + 1, r,
                            k - index + l - 1);
    }

    // If k is more than number of
    // elements in array
    return INT_MAX;
}

```

```java
import java.util.Random;
class Solution {
  int [] nums;

  public void swap(int a, int b) {
    int tmp = this.nums[a];
    this.nums[a] = this.nums[b];
    this.nums[b] = tmp;
  }


  public int partition(int left, int right, int pivot_index) {
    int pivot = this.nums[pivot_index];
    // 1. move pivot to end
    swap(pivot_index, right);
    int store_index = left;

    // 2. move all smaller elements to the left
    for (int i = left; i <= right; i++) {
      if (this.nums[i] < pivot) {
        swap(store_index, i);
        store_index++;
      }
    }

    // 3. move pivot to its final place
    swap(store_index, right);

    return store_index;
  }

  public int quickselect(int left, int right, int k_smallest) {
    /*
    Returns the k-th smallest element of list within left..right.
    */

    if (left == right) // If the list contains only one element,
      return this.nums[left];  // return that element

    // select a random pivot_index
    Random random_num = new Random();
    int pivot_index = left + random_num.nextInt(right - left); 
    
    pivot_index = partition(left, right, pivot_index);

    // the pivot is on (N - k)th smallest position
    if (k_smallest == pivot_index)
      return this.nums[k_smallest];
    // go left side
    else if (k_smallest < pivot_index)
      return quickselect(left, pivot_index - 1, k_smallest);
    // go right side
    return quickselect(pivot_index + 1, right, k_smallest);
  }

  public int findKthLargest(int[] nums, int k) {
    this.nums = nums;
    int size = nums.length;
    // kth largest is (N - k)th smallest
    return quickselect(0, size - 1, size - k);
  }
}

```


# Sort Colors

Counting sort.
https://leetcode.com/problems/sort-colors

```cpp
void sortColors(vector<int>& nums) {
    std::array<int, 4> c = {0,0,0,0};
    vector<int> b(nums.size());
    for (auto& n : nums) {
        c[n]++;
    }
    for (int i = 1; i < 4; i++) {
        c[i] += c[i - 1];
    }
    for (int i = nums.size() - 1; i >=0; i--) {
        b[c[nums[i]] - 1] = nums[i];
        c[nums[i]]--;
    }
    for (int i = 0; i < nums.size(); i++) {
        nums[i] = b[i];
    }
}

```

# Min Stack

```cpp
class MinStack {
public:
    /** initialize your data structure here. */
    stack<int> st;
    stack<int> mn;
    int min = INT_MAX;

    MinStack() {
    }

    void push(int val) {
        st.push(val);
        if (val <= min) {
            mn.push(min);
            min = val;
        }
    }

    void pop() {
        if (st.top() == min) {
            min = mn.top();
            mn.pop();
        }
        st.pop();
    }

    int top() {
        return st.top();
    }

    int getMin() {
        if (mn.size() == 0) return 0;
        return min;
    }
};
```

