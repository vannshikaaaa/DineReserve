import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

def train_demand_model():
    print('Loading bookings dataset...')
    df = pd.read_csv('ai/datasets/bookings_dataset.csv')

    df['table_category'] = pd.cut(
        df['guests'],
        bins=[0, 2, 4, 100],
        labels=[0, 1, 2]  
    ).astype(int)

    agg = df.groupby(
        ['restaurant_id', 'table_category', 'day_of_week', 'hour', 'month']
    ).size().reset_index(name='demand_count')

    print(f'Aggregated into {len(agg)} demand rows')

    features = ['table_category', 'day_of_week', 'hour', 'month']
    X = agg[features]
    y = agg['demand_count']

    if len(agg) < 30:
        print('WARNING: Small dataset. More bookings = better model.')
        model = GradientBoostingRegressor(n_estimators=50, random_state=42)
        model.fit(X, y)
    else:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        model = GradientBoostingRegressor(
            n_estimators=200,
            learning_rate=0.05,
            max_depth=5,
            random_state=42
        )
        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        r2  = r2_score(y_test, y_pred)
        print(f'Mean Absolute Error: {mae:.2f} bookings')
        print(f'R2 Score: {r2:.3f}')

    os.makedirs('ai/models', exist_ok=True)
    joblib.dump({'model': model, 'features': features}, 'ai/models/demand_model.pkl')
    print('Model saved to ai/models/demand_model.pkl')

if __name__ == '__main__':
    train_demand_model()
