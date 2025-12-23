import numpy as np

# Standard iterative WHT
def wht_standard(func):
    n = len(func)
    wht = np.array([1 - 2 * f for f in func], dtype=np.float64)
    
    h = 1
    while h < n:
        for i in range(0, n, h * 2):
            for j in range(i, i + h):
                x = wht[j]
                y = wht[j + h]
                wht[j] = x + y
                wht[j + h] = x - y
        h *= 2
    
    return [int(w) for w in wht]

# Vectorized WHT (current)
def wht_vectorized(func):
    n = len(func)
    wht = np.array(func, dtype=int)
    wht = 1 - 2 * wht
    
    h = 1
    while h < n:
        wht = wht.reshape((n // (2 * h), 2, h))
        x = wht[:, 0, :]
        y = wht[:, 1, :]
        wht[:, 0, :] = x + y
        wht[:, 1, :] = x - y
        wht = wht.reshape(n)
        h *= 2
    
    return wht.tolist()

# Test with a simple function
test_func = [0, 1, 0, 1, 1, 0, 1, 0]

print("Standard WHT:", wht_standard(test_func))
print("Vectorized WHT:", wht_vectorized(test_func))
print("Match:", wht_standard(test_func) == wht_vectorized(test_func))
