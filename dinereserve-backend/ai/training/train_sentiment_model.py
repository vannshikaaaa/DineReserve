from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import joblib
import os
 
def train_sentiment_model():
    print("Setting up VADER Sentiment Analyzer...")

    analyzer = SentimentIntensityAnalyzer()
    test_sentences = [
        "The food was absolutely amazing and the service was great!",
        "It was okay, nothing special.",
        "Terrible experience. Food was cold and staff was rude.",
    ]
    print("\nTest results:")
    for sentence in test_sentences:
        scores = analyzer.polarity_scores(sentence)
        compound = scores["compound"]
        if compound >= 0.05:
            label = "Positive"
        elif compound <= -0.05:
            label = "Negative"
        else:
            label = "Neutral"
        print(f"  [{label}] {sentence[:50]}...")
 
    os.makedirs("ai/models", exist_ok=True)
    joblib.dump(analyzer, "ai/models/sentiment_model.pkl")
    print("\nModel saved to ai/models/sentiment_model.pkl")
 
if __name__ == "__main__":
    train_sentiment_model()
