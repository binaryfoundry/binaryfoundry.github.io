# Ring Buffer

```cpp
#include <atomic>

template <typename T, size_t S>
class CircularBuffer {
private:
    static inline uint64_t toIndex(const uint64_t v) {
        return v % S;
    }

    std::array<T, S> buffer;

    std::atomic<uint64_t> head;
    std::atomic<uint64_t> tail;

public:
    CircularBuffer() {
    }

    bool empty() {
        return head == tail;
    }

    T read() {
        T val = buffer[toIndex(tail)];
        ++tail;
        return val;
    }

    void write(T& val) {
        buffer[toIndex(head)] = val;
        ++head;
    }
};


```

```cpp
#include <thread>
#include <chrono>

CircularBuffer<uint64_t, 256> cb;

std::atomic<bool> terminate = false;

std::thread tc([&]() {
    while (!terminate) {
        while (!cb.empty()) {
            std::cout << cb.read() << "\n";
        }
        std::this_thread::sleep_for(10ms);
    }
});

std::thread tp([&]() {
    uint64_t counter = 0;
    while (counter < 128) {
        cb.write(counter);
        counter++;
        std::this_thread::sleep_for(50ms);
    }
    terminate = true;
});

tc.join();
tp.join();

```

# Fizz Buzz

```cpp
class FooBar {
private:
    int n;
    std::atomic_flag lock1 = ATOMIC_FLAG_INIT;
    std::atomic_flag lock2 = ATOMIC_FLAG_INIT;

public:
    FooBar(int n) {
        this->n = n;
        lock1.clear(std::memory_order_release);
        lock2.test_and_set(std::memory_order_acq_rel);
    }

    void foo(function<void()> printFoo) {
        
        for (int i = 0; i < n; i++) {
           while (lock1.test_and_set(std::memory_order_acq_rel))  {
              std::this_thread::yield();
           } 
        	// printFoo() outputs "foo". Do not change or remove this line.
        	printFoo();
            lock2.clear(std::memory_order_release);
        }
    }

    void bar(function<void()> printBar) {
        
        for (int i = 0; i < n; i++) {
            while (lock2.test_and_set(std::memory_order_acq_rel)) {
                std::this_thread::yield();
            }
        	// printBar() outputs "bar". Do not change or remove this line.
        	printBar();
            lock1.clear(std::memory_order_release);
        }
    }
};

```