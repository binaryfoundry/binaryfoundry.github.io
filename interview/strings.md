# Find the Difference

XOR a[i] and b[i+1], init properly.

https://leetcode.com/problems/find-the-difference/

# Minimum Remove to Make Valid Parentheses

https://leetcode.com/problems/minimum-remove-to-make-valid-parentheses/solution/

```
function is_balanced_parentheses(string)
    balance = 0
    for each char in the string
        if char == "("
            balance = balance + 1
        if char == ")"
            balance = balance - 1
        if balance < 0
            return false
    return balance == 0
```

# Longest Common Prefix

Quadratic scan is easy solution. Binary Search Better.
https://leetcode.com/problems/longest-common-prefix/

```java
public String longestCommonPrefix(String[] strs) {
    if (strs == null || strs.length == 0)
        return "";
    int minLen = Integer.MAX_VALUE;
    for (String str : strs)
        minLen = Math.min(minLen, str.length());
    int low = 1;
    int high = minLen;
    while (low <= high) {
        int middle = (low + high) / 2;
        if (isCommonPrefix(strs, middle))
            low = middle + 1;
        else
            high = middle - 1;
    }
    return strs[0].substring(0, (low + high) / 2);
}

private boolean isCommonPrefix(String[] strs, int len){
    String str1 = strs[0].substring(0,len);
    for (int i = 1; i < strs.length; i++)
        if (!strs[i].startsWith(str1))
            return false;
    return true;
}
```

# Valid Palindrome II

```cpp
bool palin(string s,int index) //this function delete s[i] or s[j] 
{                                           // and checks whether rest is palindrome or not
    string temp1,temp2;
    for(int i=0;i<s.length();i++)
    {
        if(i!=index) temp1+=s[i];
    }
    temp2=temp1;
    reverse(temp2.begin(),temp2.end());
    if(temp1==temp2) return true;
    return false;
}
bool validPalindrome(string s) {
    int i=0,j=s.length()-1;
    while(i<j)
    {
        if(s[i]!=s[j]) //mismatch occured;
        {
            if(palin(s,i)==true) return true; //delete s[i] and check;
            if(palin(s,j)==true) return true; //delete s[j] and check;
            return false;
        }
        i++; // s[i]==s[j], so i++ and j-- 
        j--;
    }
    return true;
}

```

# To Hex

```cpp
char hexChar(int x) {
    if (x<=9) return '0' + x;
    return 'a' + (x-10);
}

string toHex(int num) {
    if (num == 0) return "0";
    uint32_t n = abs(num);
    if (num < 0) {
        n = (~n) + 1;
    }
    string s;
    while (n > 0) {
        s = hexChar(n % 16) + s;
        n = n / 16;
    }
    return s;
}

```

# Group Anagrams

Map key by bit hash.
http://leetcode.com/problems/group-anagrams/

```cpp
vector<int> getHashValue(string s){
    vector<int> hash(26,0);
    for(int i=0;i<s.size();i++){
        hash[s[i] - 'a']++;
    }
    return hash;
}
vector<vector<string>> groupAnagrams(vector<string>& strs) {
    map<vector<int>,vector<string>>mp;
    vector<vector<string>> ans;
    for(auto str : strs){
        vector<int> hash = getHashValue(str);
        mp[hash].push_back(str);
    }
    for(auto it : mp){
        vector<string>t = it.second;
        ans.push_back(t);
    }
    return ans;
}

```

# Minimum Window Substring

Left and right pointer sliding window.
https://leetcode.com/problems/minimum-window-substring/

# Longest Substring Without Repeating Characters

Sliding window with character LUT.
lastIndex contains the last time a character was seen, so the window start.
If a substring from index i to j - 1 is already checked to have no duplicate characters. We only need to check if s[j] is already in the substring.

https://leetcode.com/problems/longest-substring-without-repeating-characters/

# Verifying an Alien Dictionary

Build lookup table map from english to alien for O(1) guaranteed.
https://leetcode.com/problems/verifying-an-alien-dictionary/

```java
public boolean isAlienSorted(String[] words, String order) {
    int[] orderMap = new int[26];
    for (int i = 0; i < order.length(); i++){
        orderMap[order.charAt(i) - 'a'] = i;
    }

    for (int i = 0; i < words.length - 1; i++) {
        for (int j = 0; j < words[i].length(); j++) {
            // If we do not find a mismatch letter between words[i] and words[i + 1],
            // we need to examine the case when words are like ("apple", "app").
            if (j >= words[i + 1].length()) return false;

            if (words[i].charAt(j) != words[i + 1].charAt(j)) {
                int currentWordChar = words[i].charAt(j) - 'a';
                int nextWordChar = words[i + 1].charAt(j) - 'a';
                if (orderMap[currentWordChar] > orderMap[nextWordChar]) return false;
                // if we find the first different letter and they are sorted,
                // then there's no need to check remaining letters
                else break;
            }
        }
    }

    return true;
}

```
