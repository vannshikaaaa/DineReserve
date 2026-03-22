import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import joblib
import os

def train_dish_model():
    print('Loading dish dataset...')
    df = pd.read_csv('ai/datasets/dish_dataset.csv')
    df = df.dropna(subset=['dish_name'])

    df['text_profile'] = (
        df['cuisine_type'].fillna('') + ' ' +
        df['food_preference'].fillna('') + ' ' +
        df['restaurant_type'].fillna('') + ' ' +
        df['description'].fillna('')
    ).str.lower().str.strip()

    print(f'Training on {len(df)} dishes...')

    vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1,2))
    tfidf_matrix = vectorizer.fit_transform(df['text_profile'])

    similarity_matrix = cosine_similarity(tfidf_matrix, tfidf_matrix)

    model_data = {
        'vectorizer':        vectorizer,
        'similarity_matrix': similarity_matrix,
        'dish_names':        df['dish_name'].values,
        'restaurant_ids':    df['restaurant_id'].values,
        'cuisine_types':     df['cuisine_type'].values,
        'food_preferences':  df['food_preference'].values,
        'df':                df,
    }

    os.makedirs('ai/models', exist_ok=True)
    joblib.dump(model_data, 'ai/models/dish_model.pkl')
    print('Model saved to ai/models/dish_model.pkl')
    print(f'Dish model trained with {len(df)} menu items.')

if __name__ == '__main__':
    train_dish_model()
