# 1 Bits

```cpp
int hammingWeight(uint32_t n) {
    return __builtin_popcount(n);
}
```

# Power of Two

https://leetcode.com/problems/power-of-two

```cpp
bool isPowerOfTwo(int n) {
    return n < 0 ? false : __builtin_popcount(n) == 1;
}
```

# Popcount

```cpp
#include <iostream>

using namespace std;

int main() {
   unsigned long long int input=679043ULL; // just a big number, for demo
   unsigned char lookup[16]={ 0,1,1,2,1,2,2,3,1,2,2,3,2,3,3,4 };
   unsigned char result = 0;

   while (input > 0) {
       cout << (unsigned int) result << " " << (input&0xf) << " " << input << endl;
       result+=lookup[input & 0xf];
       input >>= 4;
   }
   cout << (unsigned int)result << endl;
   return 0;
}

```

# Reverse Bits

```cpp
uint32_t reverseBits(uint32_t n) {
    //uint32_t result = 0;
    //for (uint32_t i = 0; i < 32; i++) {
    //    uint32_t j = 31 - i;
    //    int x = n & (1 << i);
    //    if (x > 0) result |= (1 << j);
    //}
    //return result;

    uint32_t ret = 0; uint32_t power = 31;
    while (n != 0) {
      ret += (n & 1) << power;
      n = n >> 1;
      power -= 1;
    }
    return ret;
}
```
