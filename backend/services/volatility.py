"""
Realized Volatility computation for Market Oracle.
"""
import numpy as np
import random
from typing import Literal


VolRegime = Literal["LOW", "MEDIUM", "HIGH", "EXTREME"]


def compute_rv(closes: list[float], window: int = 20) -> list[float]:
    """
    Compute annualized realized volatility as rolling std of log returns.
    RV = std(log(P_t / P_{t-1}), window=window) * sqrt(252)
    """
    if len(closes) < window + 1:
        return []
    arr = np.array(closes, dtype=float)
    log_returns = np.log(arr[1:] / arr[:-1])
    rv = []
    for i in range(window - 1, len(log_returns)):
        window_returns = log_returns[i - window + 1 : i + 1]
        rv.append(float(np.std(window_returns) * np.sqrt(252)))
    return rv


def get_regime(rv_value: float) -> VolRegime:
    """Classify volatility into regimes."""
    if rv_value < 0.10:
        return "LOW"
    elif rv_value < 0.20:
        return "MEDIUM"
    elif rv_value < 0.35:
        return "HIGH"
    else:
        return "EXTREME"


def compute_autocorrelation(series: list[float], lag: int = 1) -> float:
    """Lag-1 autocorrelation of the RV series (measures clustering strength)."""
    if len(series) < lag + 2:
        return 0.0
    arr = np.array(series)
    corr = np.corrcoef(arr[:-lag], arr[lag:])
    return float(corr[0, 1])


def mock_forecast(rv_series: list[float], horizon: int = 5) -> dict:
    """
    Generate a mock TimesFM forecast using simple random walk on RV.
    Used when Modal is not configured. Replace with real Modal call once tokens are set.
    """
    if not rv_series:
        base = 0.18
    else:
        base = rv_series[-1]

    # Simple mean-reverting random walk around the last value
    long_run_mean = np.mean(rv_series[-20:]) if len(rv_series) >= 20 else base
    point = []
    current = base
    for _ in range(horizon):
        # Mean reversion + small noise
        current = current + 0.1 * (long_run_mean - current) + random.gauss(0, 0.01)
        current = max(0.05, current)
        point.append(round(current, 4))

    # Uncertainty cone: ±15% around median
    q50 = point
    q10 = [round(v * 0.85, 4) for v in q50]
    q90 = [round(v * 1.15, 4) for v in q50]

    return {
        "point": point,
        "q10": q10,
        "q50": q50,
        "q90": q90,
        "horizon": horizon,
        "source": "mock",  # Will be "timesfm" when Modal is configured
    }
