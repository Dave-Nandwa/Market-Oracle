"""
Modal client for calling TimesFM inference from the FastAPI backend.
Set MODAL_TOKEN_ID and MODAL_TOKEN_SECRET in backend/.env to enable.
"""
import os


def get_forecast(rv_series: list, horizon: int = 5) -> dict | None:
    """
    Call the Modal TimesFM function. Returns None if Modal is not configured.
    Falls back to mock forecast in the backend.
    """
    token_id = os.getenv("MODAL_TOKEN_ID")
    token_secret = os.getenv("MODAL_TOKEN_SECRET")

    if not token_id or not token_secret:
        return None  # Modal not configured — backend will use mock forecast

    try:
        import modal
        # Set credentials
        modal.config._profile = modal.config.Config()
        
        forecast_fn = modal.Function.lookup("market-oracle-timesfm", "forecast_volatility")
        result = forecast_fn.remote(rv_series, horizon=horizon)
        return result
    except Exception as e:
        print(f"[Modal] Inference failed: {e}")
        return None
