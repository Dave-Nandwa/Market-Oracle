"""
TimesFM v2.5 inference on Modal GPU.
Deploy: modal deploy modal/timesfm_inference.py
Call:   from modal.timesfm_inference import forecast_volatility
"""
import modal

app = modal.App("market-oracle-timesfm")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "timesfm[torch]",
        "numpy",
        "pandas",
        "torch",
        "huggingface_hub",
    )
)


@app.function(
    gpu="T4",
    image=image,
    timeout=120,
    memory=8192,
)
def forecast_volatility(rv_series: list, horizon: int = 5) -> dict:
    """
    Zero-shot realized volatility forecast using TimesFM 2.0-500m.
    
    Args:
        rv_series: Historical realized volatility series (annualized, e.g. [0.18, 0.21, ...])
        horizon: Number of days to forecast (default 5)
    
    Returns:
        dict with point, q10, q50, q90 forecasts
    """
    import timesfm
    import numpy as np

    tfm = timesfm.TimesFm(
        hparams=timesfm.TimesFmHparams(
            backend="gpu",
            per_core_batch_size=32,
            horizon_len=horizon,
        ),
        checkpoint=timesfm.TimesFmCheckpoint(
            huggingface_repo_id="google/timesfm-2.0-500m-pytorch"
        ),
    )

    # Use last 512 points as context (TimesFM supports up to 16k)
    context = rv_series[-512:] if len(rv_series) > 512 else rv_series

    point_forecast, quantile_forecast = tfm.forecast(
        [context],
        freq=[0],  # 0 = high frequency (daily)
        quantile_levels=[0.1, 0.5, 0.9],
    )

    return {
        "point": point_forecast[0].tolist(),
        "q10": quantile_forecast[0, :, 0].tolist(),
        "q50": quantile_forecast[0, :, 1].tolist(),
        "q90": quantile_forecast[0, :, 2].tolist(),
        "horizon": horizon,
        "source": "timesfm",
    }


@app.local_entrypoint()
def main():
    """Test the function locally."""
    import numpy as np
    # Simulate a RV series
    test_rv = [0.18 + 0.02 * np.sin(i / 10) + np.random.normal(0, 0.01) for i in range(100)]
    result = forecast_volatility.remote(test_rv, horizon=5)
    print("Forecast result:", result)
