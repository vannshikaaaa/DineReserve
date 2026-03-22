import { Link } from "react-router-dom";
 
function RestaurantCard({ restaurant }) {
  if (!restaurant) return null;
  const cuisine = Array.isArray(restaurant.cuisine)
    ? restaurant.cuisine.join(", ")
    : restaurant.cuisine || "Not specified";
 
  return (
    <div className="restaurant-card">
      <img src={restaurant.image} alt={restaurant.name} className="restaurant-image" />
      <div className="restaurant-info">
        <h3 className="restaurant-name">{restaurant.name}</h3>
        <p className="restaurant-rating">⭐ Rating: {restaurant.rating ?? "N/A"}</p>
        <p><strong>Cuisine:</strong> {cuisine}</p>
        <p><strong>Price Range:</strong> {restaurant.price_range ?? "Not specified"}</p>
        <Link to={`/restaurant/${restaurant._id}`}>
          <button className="view-btn">View Details</button>
        </Link>
      </div>
    </div>
  );
}
 
export default RestaurantCard;
