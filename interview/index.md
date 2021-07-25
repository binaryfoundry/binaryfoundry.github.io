# Operations

## Bit on:

x |= (1 << 15);

## Bit off:

x &= ~(1 << 0);

## Byte Mask

x & 0xFF;

## Chars

'a' + x

## Literals

uint32_t n = 0b11111111111111111111111111111101;
uint32_t n = 0xFF;

# Tips

* BFS, DFS, greedy? DP?
* Remember to enumerate the outputs, there's not usually enough in the examples to see a pattern.
* With some enumerations there might not be many, like factorials within 32 bits.
* Can I used an unordered set/map instead of an ordered one?
* Can a lookup table be built and always O(1), usually with characters.
* Is min/max heap appropriate?
* Can XOR trick to find missing duplicate number be used?
* Is there a k boundary that means a linear time sort can be used?
* Should the problem be done backwards? e.g. Can Sum subtracts from target.
* In a graph problem starting from base bottom up can help, when instinct is starting top down.
* Longest Univalue Path is best post order traversal.
* Can a binary tree problem be broken down in to just a single node and its children problem?
* Set union or disjoint?
* __gcd greatest common divisor?
* __builtin_popcount?
* Is this a left and right pointer problem like filled water tanks or minimum containing substr?
* Manhattan distance

[https://www.geeksforgeeks.org/fundamentals-of-algorithms/]

[https://www.geeksforgeeks.org/greedy-algorithms/]

With permutations the order matters, with combinations the order does not matter. 123 is a different permutation of 132 but is the same combination.

# Big O

[https://www.bigocheatsheet.com/]

# Solutions

* [Backtracking](backtracking.md)
* [Bits](bits.md)
* [Combinations](combinations.md)
* [Concurrency](concurrency.md)
* [Design](design.md)
* [Dynamic Programming](dynamic.md)
* [Graph](graph.md)
* [Greedy](greedy.md)
* [Intervals](intervals.md)
* [Lists](lists.md)
* [Math](math.md)
* [Search](search.md)
* [Sets](sets.md)
* [Sort](sort.md)
* [Strings](strings.md)
* [Subarrays](subarray.md)
* [Trees](tree.md)

# Recursion

Given a recursion algorithm, its time complexity is typically the product of the number of recursion invocations.

There are mainly two parts of the space consumption that one should bear in mind when calculating the space complexity of a recursive algorithm: recursion related and non-recursion related space.

# Misc

## Fib Hash

[https://probablydance.com/2018/06/16/fibonacci-hashing-the-optimization-that-the-world-forgot-or-a-better-alternative-to-integer-modulo/]

## Find the Duplicate Number

Floyd's Tortoise and Hare (Cycle Detection)

[https://www.geeksforgeeks.org/detect-loop-in-a-linked-list/]

[https://leetcode.com/problems/find-the-duplicate-number/]

```java
public int findDuplicate(int[] nums) {
    // Find the intersection point of the two runners.
    int tortoise = nums[0];
    int hare = nums[0];
    do {
        tortoise = nums[tortoise];
        hare = nums[nums[hare]];
    } while (tortoise != hare);

    // Find the "entrance" to the cycle.
    tortoise = nums[0];
    while (tortoise != hare) {
        tortoise = nums[tortoise];
        hare = nums[hare];
    }

    return hare;
}

```

## Remove Duplicates from Sorted List

[https://leetcode.com/problems/remove-duplicates-from-sorted-list/]
[https://leetcode.com/problems/remove-duplicates-from-sorted-list-ii/]

## First Missing Positive

Create an array of n+1 length, discard nums negative or larger than array.

[https://leetcode.com/problems/first-missing-positive/]

## Number of Islands

[https://leetcode.com/problems/number-of-islands/]

## Missing Number

XOR with 0..n+1, then XOR with all nums.

[https://leetcode.com/problems/missing-number/]

## Stack using Queues

[https://leetcode.com/problems/implement-stack-using-queues/]

## Queue using Stacks

[https://leetcode.com/problems/implement-queue-using-stacks/]

## Car Parking Roofs (Parking Dilemma)

[https://www.programmersought.com/article/51466642015/]
