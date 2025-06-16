#include <bits/stdc++.h>
using namespace std;

namespace my::project::utils {
    inline constexpr double PI = 3.1415926535;
}

template<typename... Args>
auto sum(Args... args) {
    return (args + ...);
}

template<typename T>
auto process_value(const T& value) {
    if constexpr (is_same_v<T, int>) {
        return value * 2;
    } else if constexpr (is_same_v<T, string>) {
        return "Hello " + value;
    } else {
        return value;
    }
}

int main() {
    // Structured bindings with array
    array<int, 3> arr = {10, 20, 30};
    auto [a, b, c] = arr;
    cout << "Structured binding: " << a << ", " << b << ", " << c << "\n";

    // If with initializer
    if (auto result = rand() % 10; result > 5) {
        cout << "If-initializer: " << result << " > 5\n";
    }

    // Constexpr lambda
    constexpr auto square = [](int n) { return n * n; };
    cout << "Constexpr lambda: " << square(5) << "\n";

    // Fold expression
    cout << "Fold sum: " << sum(1, 2.5, 3, 4.2) << "\n";

    // If constexpr
    cout << "Processed int: " << process_value(10) << "\n";
    cout << "Processed string: " << process_value(string("World")) << "\n";

    // Nested namespace and inline variable
    cout << "Inline variable: " << my::project::utils::PI << "\n";

    // [[maybe_unused]] attribute
    [[maybe_unused]] int unused_var = 42;

    return 0;
}