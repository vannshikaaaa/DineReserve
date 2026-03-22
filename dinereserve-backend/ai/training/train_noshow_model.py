import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

def train_noshow_model():
    print("Loading bookings dataset...")
    df = pd.read_csv("ai/datasets/bookings_dataset.csv")

    df["is_noshow"] = (df["status"] == "no_show").astype(int)

    features = ["hour", "day_of_week", "month", "guests"]
    X = df[features].fillna(0)
    y = df["is_noshow"]

    print(f"Total bookings : {len(df)}")
    print(f"No-shows       : {y.sum()} ({y.mean()*100:.1f}%)")

    if len(df) < 50:
        print("WARNING: Very small dataset.")
        model = RandomForestClassifier(
            n_estimators=50,
            class_weight="balanced",
            random_state=42
        )
        model.fit(X, y)
    else:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        model = RandomForestClassifier(
            n_estimators=200,
            max_depth=8,
            class_weight="balanced",
            random_state=42
        )
        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        print(f"Accuracy : {accuracy_score(y_test, y_pred)*100:.1f}%")
        print(classification_report(
            y_test, y_pred, target_names=["Show Up", "No Show"]
        ))

    importances = dict(zip(features, model.feature_importances_))
    print("Feature importances:", importances)

    os.makedirs("ai/models", exist_ok=True)
    joblib.dump({"model": model, "features": features}, "ai/models/noshow_model.pkl")
    print("Saved: ai/models/noshow_model.pkl")

if __name__ == "__main__":
    train_noshow_model()