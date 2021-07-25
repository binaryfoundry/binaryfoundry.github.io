# Linked List Insert

Or use sentinel.
Remember to clear final next to nullptr.

```cpp
ListNode* nhead = nullptr;
ListNode* ncurrent = nullptr;
void insert(ListNode* head) {
    if (nhead == nullptr) {
        nhead = head;
        ncurrent = head;
    }
    else {
        ncurrent->next = head;
        ncurrent = head;
    }
}

```

# Reverse Linked List

This one is trickier than it sounds, can result in cycles.

```java
public ListNode reverseList(ListNode head) {
    if (head == null || head.next == null) return head;
    ListNode p = reverseList(head.next);
    head.next.next = head;
    head.next = null;
    return p;
}

```

# Linked List Cycle

```cpp
bool hasCycle(ListNode *head) {
    ListNode *slow = head, *fast = head;

    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (fast == slow) return true;
    }

    return false;
}
```

# Linked List Cycle II Where Begins

https://leetcode.com/problems/linked-list-cycle-ii/

# Reverse Linked List

https://leetcode.com/problems/reverse-linked-list/

# Add Two Numbers

You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.

You may assume the two numbers do not contain any leading zero, except the number 0 itself.

```cpp
ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
    ListNode* dummyHead = new ListNode(0);
    ListNode* p = l1;
    ListNode* q = l2;
    ListNode* curr = dummyHead;
    int carry = 0;
    while (p != nullptr || q != nullptr) {
        int x = (p != nullptr) ? p->val : 0;
        int y = (q != nullptr) ? q->val : 0;
        int sum = carry + x + y;
        carry = sum / 10;
        curr->next = new ListNode(sum % 10);
        curr = curr->next;
        if (p != nullptr) p = p->next;
        if (q != nullptr) q = q->next;
    }
    if (carry > 0) {
        curr->next = new ListNode(carry);
    }
    return dummyHead->next;
}

```
