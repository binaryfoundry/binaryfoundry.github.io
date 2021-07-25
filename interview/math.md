# Pow

The code relies on the fact that: x^y == (x*x)^(y/2)

The loop is doing exactly that: dividing the exponent by two while squaring the base.

https://en.wikipedia.org/wiki/Exponentiation_by_squaring

```cpp
double fastPow(double x, long long n) {
    if (n == 0) {
        return 1.0;
    }
    double half = fastPow(x, n / 2);
    if (n % 2 == 0) {
        return half * half;
    } else {
        return half * half * x;
    }
}
double myPow(double x, int n) {
    long long N = n;
    if (N < 0) {
        x = 1 / x;
        N = -N;
    }
    return fastPow(x, N);
}
```

## Approximation of e^x

```
1+x+(1/2*x^2)+(1/6*x^3)+(1/24*x^4)+(1/120*x^5)
```

# Int SQRT

Ordinary binary search.
https://www.geeksforgeeks.org/square-root-of-an-integer/
https://leetcode.com/problems/sqrtx/solution/

```cpp
int floorSqrt(uint64_t x) {
    // Base cases
    if (x == 0 || x == 1)
        return x;

    // Do Binary Search for floor(sqrt(x))
    uint64_t start = 1, end = x, ans;
    while (start <= end) {
        uint64_t mid = (start + end) / 2;

        // If x is a perfect square
        // (additional optimization)
        if (mid * mid == x)
            return mid;

        // Since we need floor, we update answer when
        // mid*mid is smaller than x, and move closer to
        // sqrt(x)

        /*
           if(mid*mid<=x)
                   {
                           start = mid+1;
                           ans = mid;
                   }
            Here basically if we multiply mid with itself so
           there will be integer overflow which will throw
           tle for larger input so to overcome this
           situation we can use long or we can just divide
            the number by mid which is same as checking
           mid*mid < x

           */
        if (mid <= x / mid) {
            start = mid + 1;
            ans = mid;
        }
        else // If mid*mid is greater than x
            end = mid - 1;
    }
    return ans;
}
```

## Newton's Method

X2 = X1 - f(X1) / f'(X1)

x0 - (((x0*x0) - x) / (2 * x0));

(x0 + x / x0)

```java
public int mySqrt(int x) {
    if (x < 2) return x;

    double x0 = x;
    double x1 = (x0 + x / x0) / 2.0;
    while (Math.abs(x0 - x1) >= 1) {
        x0 = x1;
        x1 = (x0 + x / x0) / 2.0;
    }

    return (int)x1;
}

```

# Inverse SQRT

rsqrtss / _mm_rsqrt_ss

```c
float Q_rsqrt( float number )
{
  long i;
  float x2, y;
  const float threehalfs = 1.5F;

  x2 = number * 0.5F;
  y  = number;
  i  = * ( long * ) &y;                       // evil floating point bit level hacking
  i  = 0x5f3759df - ( i >> 1 );               // what?
  y  = * ( float * ) &i;
  y  = y * ( threehalfs - ( x2 * y * y ) );   // 1st iteration
//  y  = y * ( threehalfs - ( x2 * y * y ) );   // 2nd iteration, this can be removed

  return y;
}

```

# Maclaurin Series of Sqrt(1+x)

```
1+(x/2)-(x^2/8)+(x^3/16)
```

# Factorial Trailing Zeroes

List out the factorials, there's not many.
https://leetcode.com/problems/factorial-trailing-zeroes/

# Basic Calculator II

https://leetcode.com/problems/basic-calculator-ii/

```cpp
int calculate(string s) {
    int len = s.length();
    if (len == 0) return 0;
    stack<int> stack;
    int currentNumber = 0;
    char operation = '+';
    for (int i = 0; i < len; i++) {
        char currentChar = s[i];
        if (isdigit(currentChar)) {
            currentNumber = (currentNumber * 10) + (currentChar - '0');
        }
        if (!isdigit(currentChar) && !iswspace(currentChar) || i == len - 1) {
            if (operation == '-') {
                stack.push(-currentNumber);
            } else if (operation == '+') {
                stack.push(currentNumber);
            } else if (operation == '*') {
                int stackTop = stack.top();
                stack.pop();
                stack.push(stackTop * currentNumber);
            } else if (operation == '/') {
                int stackTop = stack.top();
                stack.pop();
                stack.push(stackTop / currentNumber);
            }
            operation = currentChar;
            currentNumber = 0;
        }
    }
    int result = 0;
    while (stack.size() != 0) {
        result += stack.top();
        stack.pop();
    }
    return result;
}


```

# Add Binary

Full adder logic
https://leetcode.com/problems/add-binary/

```cpp
bool getDigit(string s, int i) {
    if (i >= s.length())
        return 0;
    return s.at(i) == '0' ? 0 : 1;
}

string addBinary(string a, string b) {
    string r;
    int len = max(a.length(), b.length());
    bool c = 0; // carry flag
    int ai = a.length()-1;
    int bi = b.length()-1;
    for (int i = 0; i < len; i++) {
        bool x = getDigit(a, ai--);
        bool y = getDigit(b, bi--);
        bool c1 = x ^ y;
        bool sum = c1 ^ c;
        r = (sum == 0 ? '0' : '1') + r;
        c = (x & y) | (c & c1);
    }
    if (c) r = '1' + r;
    return r;
}

```

# Plus One

```cpp
vector<int> plusOne(vector<int>& digits) {
    vector<int> r;
    size_t e = digits.size() - 1;
    for (int i = e; i >=0; i--) {
        r.push_back(digits[i]);
    }
    r[0]++;
    for (int i = 0; i < digits.size(); i++) {
        if (r[i] > 9) {
            r[i] = 0;
            if (i+1 >= digits.size())
                r.push_back(0);
            r[i+1]++;
        }
    }
    std::reverse(r.begin(), r.end());
    return r;
}
```

# Roman to Integer

```cpp
int romanToInt(string str) {
    map<char, int> m;
    m.insert({ 'I', 1 });
    m.insert({ 'V', 5 });
    m.insert({ 'X', 10 });
    m.insert({ 'L', 50 });
    m.insert({ 'C', 100 });
    m.insert({ 'D', 500 });
    m.insert({ 'M', 1000 });
    int sum = 0;
    for (int i = 0; i < str.length(); i++) {
        /*If present value is less than next value,
          subtract present from next value and add the
          resultant to the sum variable.*/
        if (m[str[i]] < m[str[i + 1]]) {
            sum += m[str[i+1]] - m[str[i]];
            i++;
            continue;
        }
        sum += m[str[i]];
    }
    return sum;
}
```

# Int to Roman

```cpp
string intToRoman(int number) {
    stringstream ss;
    int num[] = {1,4,5,9,10,40,50,90,100,400,500,900,1000};
    string sym[] = {"I","IV","V","IX","X","XL","L","XC","C","CD","D","CM","M"};
    int i = 12;
    while(number > 0) {
        int div = number / num[i];
        number = number % num[i];
        while(div--) {
            ss << sym[i];
        }
        i--;
    }
    return ss.str();
}
```

# Two Sum

Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

```cpp
vector<int> twoSum(vector<int>& nums, int target) {
    vector<int> result;
    unordered_map<int, int> hash;
    for (int i = 0; i < nums.size(); i++) {
        hash[nums[i]] = i;
    }
    for (int i = 0; i < nums.size(); i++) {
        int complement = target - nums[i];
        if (hash.find(complement) != hash.end() && hash.at(complement) != i) {
            result.push_back(i);
            result.push_back(hash.at(complement));
            return result;
        }
    }
    return result;
}
```

Time complexity : O(n). We traverse the list containing nn elements exactly twice. Since the hash table reduces the look up time to O(1), the time complexity is O(n).

Space complexity : O(n). The extra space required depends on the number of items stored in the hash table, which stores exactly nn elements.

# Two Sum II

```cpp
vector<int> twoSum(vector<int>& numbers, int target) {
    int l = 0;
    int r = numbers.size() - 1;
    while (l < r) {
        int sum = numbers[l] + numbers[r];
        if (sum == target)
            return {l + 1, r + 1};
        else if (sum < target)
            ++l;
        else
            --r;
    }
    return {-1, -1};
}

```

# Three Sum

TODO

https://leetcode.com/problems/3sum/solution/

```cpp
vector<vector<int>> threeSum(vector<int>& nums) {
    sort(begin(nums), end(nums));
    vector<vector<int>> res;
    for (int i = 0; i < nums.size() && nums[i] <= 0; ++i) {
        if (i == 0 || nums[i - 1] != nums[i]) {
            twoSumII(nums, i, res);
        }
    }
    return res;
}
void twoSumII(vector<int>& nums, int i, vector<vector<int>> &res) {
    int lo = i + 1, hi = nums.size() - 1;
    while (lo < hi) {
        int sum = nums[i] + nums[lo] + nums[hi];
        if (sum < 0) {
            ++lo;
        } else if (sum > 0) {
            --hi;
        } else {
            res.push_back({ nums[i], nums[lo++], nums[hi--] });
            while (lo < hi && nums[lo] == nums[lo - 1])
                ++lo;
        }
    }
}

```

# Best Time to Buy and Sell Stock

https://leetcode.com/problems/best-time-to-buy-and-sell-stock/

```cpp
int maxProfit(vector<int>& prices) {
    int minprice = INT_MAX;
    int maxprofit = 0;
    for (int i = 0; i < prices.size(); i++) {
        if (prices[i] < minprice)
            minprice = prices[i];
        else if (prices[i] - minprice > maxprofit)
            maxprofit = prices[i] - minprice;
    }
    return maxprofit;
}

```
