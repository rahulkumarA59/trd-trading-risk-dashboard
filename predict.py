from __future__ import annotations

import io
import pickle
import sys
import urllib.error
import urllib.request
import warnings
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor

warnings.filterwarnings("ignore")

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "stock_model.pkl"
MODEL_TTL_HOURS = 12
MIN_TRAINING_ROWS = 80


def load_model_store() -> dict:
    if not MODEL_PATH.exists():
        return {}

    try:
        with MODEL_PATH.open("rb") as file_handle:
            store = pickle.load(file_handle)
            return store if isinstance(store, dict) else {}
    except Exception:
        return {}


def save_model_store(store: dict) -> None:
    with MODEL_PATH.open("wb") as file_handle:
        pickle.dump(store, file_handle)


def is_stale(trained_at: str | None) -> bool:
    if not trained_at:
        return True

    try:
        trained_time = datetime.fromisoformat(trained_at)
    except ValueError:
        return True

    if trained_time.tzinfo is None:
        trained_time = trained_time.replace(tzinfo=timezone.utc)

    return datetime.now(timezone.utc) - trained_time > timedelta(hours=MODEL_TTL_HOURS)


def download_history(symbol: str) -> pd.DataFrame:
    loaders = [load_history_from_yfinance, load_history_from_stooq]
    errors: list[str] = []

    for loader in loaders:
        try:
            history = loader(symbol)
            if not history.empty:
                return history
        except Exception as exc:
            errors.append(f"{loader.__name__}: {exc}")

    raise RuntimeError("Unable to load historical data. " + " | ".join(errors))


def load_history_from_yfinance(symbol: str) -> pd.DataFrame:
    try:
        import yfinance as yf
    except ImportError as exc:
        raise RuntimeError("yfinance is not installed") from exc

    history = yf.download(
        symbol,
        period="5y",
        interval="1d",
        progress=False,
        auto_adjust=False,
        threads=False,
    )

    if history.empty:
        raise RuntimeError(f"No historical data returned for {symbol} from yfinance")

    history = history.reset_index()
    return normalize_history_frame(history)


def load_history_from_stooq(symbol: str) -> pd.DataFrame:
    stooq_symbol = symbol.lower()
    if ".us" not in stooq_symbol:
        stooq_symbol = f"{stooq_symbol}.us"

    url = f"https://stooq.com/q/d/l/?s={stooq_symbol}&i=d"
    request = urllib.request.Request(url, headers={"User-Agent": "TRD-ML-Predictor/1.0"})

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            csv_payload = response.read().decode("utf-8")
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Unable to fetch Stooq data for {symbol}") from exc

    history = pd.read_csv(io.StringIO(csv_payload))
    if history.empty or "Close" not in history.columns:
        raise RuntimeError(f"No historical data returned for {symbol} from Stooq")

    return normalize_history_frame(history)


def normalize_history_frame(history: pd.DataFrame) -> pd.DataFrame:
    normalized = history.copy()
    normalized.columns = [str(column).strip().title() for column in normalized.columns]

    required_columns = {"Date", "Close"}
    if not required_columns.issubset(normalized.columns):
        raise RuntimeError("Historical data does not contain the required columns")

    if "Volume" not in normalized.columns:
        normalized["Volume"] = 0

    normalized["Date"] = pd.to_datetime(normalized["Date"], errors="coerce")
    normalized["Close"] = pd.to_numeric(normalized["Close"], errors="coerce")
    normalized["Volume"] = pd.to_numeric(normalized["Volume"], errors="coerce").fillna(0)

    normalized = normalized.dropna(subset=["Date", "Close"]).sort_values("Date").reset_index(drop=True)
    if len(normalized) < MIN_TRAINING_ROWS:
        raise RuntimeError(f"Not enough historical rows to train the model. Found {len(normalized)}")

    return normalized


def build_feature_frame(history: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    frame = history[["Date", "Close", "Volume"]].copy()
    frame["return_1"] = frame["Close"].pct_change()

    for lag in (1, 2, 3, 5, 10):
        frame[f"lag_{lag}"] = frame["Close"].shift(lag)

    frame["sma_5"] = frame["Close"].rolling(5).mean()
    frame["sma_10"] = frame["Close"].rolling(10).mean()
    frame["sma_20"] = frame["Close"].rolling(20).mean()
    frame["ema_10"] = frame["Close"].ewm(span=10, adjust=False).mean()
    frame["volatility_5"] = frame["return_1"].rolling(5).std()
    frame["volume_sma_5"] = frame["Volume"].rolling(5).mean()
    frame["volume_ratio"] = frame["Volume"] / frame["volume_sma_5"].replace(0, np.nan)
    frame["target"] = frame["Close"].shift(-1)

    feature_columns = [
        "lag_1",
        "lag_2",
        "lag_3",
        "lag_5",
        "lag_10",
        "return_1",
        "sma_5",
        "sma_10",
        "sma_20",
        "ema_10",
        "volatility_5",
        "volume_sma_5",
        "volume_ratio",
    ]

    return frame, feature_columns


def train_model(feature_frame: pd.DataFrame, feature_columns: list[str]) -> RandomForestRegressor:
    training_data = feature_frame.dropna(subset=feature_columns + ["target"]).copy()
    if len(training_data) < MIN_TRAINING_ROWS:
        raise RuntimeError(f"Training dataset is too small after feature engineering. Found {len(training_data)}")

    model = RandomForestRegressor(
        n_estimators=250,
        max_depth=10,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=1,
    )
    model.fit(training_data[feature_columns], training_data["target"])
    return model


def predict_next_close(symbol: str) -> float:
    symbol = symbol.upper().strip()
    history = download_history(symbol)
    feature_frame, feature_columns = build_feature_frame(history)

    latest_features = feature_frame[feature_columns].tail(1).copy()
    if latest_features.isnull().any(axis=None):
        raise RuntimeError("Latest feature row contains null values; unable to generate prediction")

    model_store = load_model_store()
    artifact = model_store.get(symbol)

    if not artifact or is_stale(artifact.get("trained_at")) or artifact.get("feature_columns") != feature_columns:
        model = train_model(feature_frame, feature_columns)
        model_store[symbol] = {
            "trained_at": datetime.now(timezone.utc).isoformat(),
            "feature_columns": feature_columns,
            "model": model,
        }
        save_model_store(model_store)
    else:
        model = artifact["model"]

    prediction = float(model.predict(latest_features)[0])
    last_close = float(history["Close"].iloc[-1])

    if not np.isfinite(prediction) or prediction <= 0:
        raise RuntimeError("Model returned an invalid predicted price")

    return round(max(prediction, last_close * 0.5), 4)


def main() -> int:
    if len(sys.argv) < 2 or not sys.argv[1].strip():
        print("Usage: python predict.py <SYMBOL>", file=sys.stderr)
        return 1

    symbol = sys.argv[1].strip().upper()

    try:
        predicted_price = predict_next_close(symbol)
        print(f"{predicted_price:.4f}")
        return 0
    except Exception as exc:
        print(f"Prediction failed for {symbol}: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
