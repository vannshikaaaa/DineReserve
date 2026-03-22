import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

def train_peak_model():
    print('Loading bookings dataset...')
    df = pd.read_csv('ai/datasets/bookings_dataset.csv')

    agg = df.groupby(
        ['restaurant_id', 'hour', 'day_of_week', 'month']
    ).size().reset_index(name='total_bookings')

    print(f'Aggregated into {len(agg)} hour-slot rows')

    features = ['hour', 'day_of_week', 'month']
    X = agg[features]
    y = agg['total_bookings']

    if len(agg) < 30:
        print('WARNING: Small dataset — model will improve with more bookings.')
        model = RandomForestRegressor(n_estimators=50, random_state=42)
        model.fit(X, y)
    else:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        model = RandomForestRegressor(
            n_estimators=200,
            max_depth=10,
            random_state=42
        )
        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        mae  = mean_absolute_error(y_test, y_pred)
        r2   = r2_score(y_test, y_pred)
        print(f'Mean Absolute Error: {mae:.2f} bookings')
        print(f'R2 Score: {r2:.3f}  (1.0 = perfect)')

    os.makedirs('ai/models', exist_ok=True)
    joblib.dump({'model': model, 'features': features}, 'ai/models/peak_model.pkl')
    print('Model saved to ai/models/peak_model.pkl')

if __name__ == '__main__':
    train_peak_model()
