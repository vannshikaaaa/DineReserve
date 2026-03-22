import sys
sys.path.append('.')

from ai.prediction.predict import (
    predict_dishes,
    predict_noshow,
    predict_peak_hours,
    predict_table_demand,
)

print("=" * 55)
print("  Testing all 4 models")
print("=" * 55)

print("\n[1/4] Dish Recommendation")
dishes = predict_dishes(
    restaurant_id='test',
    food_preference='Veg',
    top_n=3
)
if dishes and 'error' not in str(dishes[0]):
    for d in dishes:
        print(f"  {d['dish_name']} ({d['cuisine_type']}) — score: {d['popularity_score']}")
else:
    print(f"  Result: {dishes}")

print("\n[2/4] No-Show Prediction")
result = predict_noshow(hour=20, day_of_week=4, month=12, guests=2)
print(f"  Risk level  : {result['risk_level']}")
print(f"  Probability : {result['probability'] * 100:.1f}%")
print(f"  Advice      : {result['recommendation']}")

print("\n[3/4] Peak Hour Prediction  (Friday, December)")
peaks = predict_peak_hours(day_of_week=4, month=12)
print("  Top 4 busiest hours:")
for slot in peaks[:4]:
    tag = " <- PEAK" if slot['is_peak'] else ""
    print(f"  {slot['hour_label']:>10}  |  {slot['predicted_bookings']} bookings{tag}")

print("\n[4/4] Table Demand Prediction  (medium table, Friday 7pm)")
demand = predict_table_demand(
    table_category=1,
    day_of_week=4,
    hour=19,
    month=12,
)
print(f"  Table size  : {demand['table_size']}")
print(f"  Demand      : {demand['demand_level']}")
print(f"  Advice      : {demand['availability_advice']}")

print("\n" + "=" * 55)
print("  All tests complete!")
print("=" * 55)