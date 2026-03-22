import { useState } from "react";
 
function Filters({ onFilter }) {
  const [filters, setFilters] = useState({
    food_preference: "", cuisine: "", restaurant_type: "", budget: "", guests: ""
  });
 
  const handleChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
 
  const applyFilters = () => {
    const clean = {};
    Object.keys(filters).forEach((k) => { if (filters[k] !== "") clean[k] = filters[k]; });
    onFilter(clean);
  };
  return (
    <div className="filters-container">
      <h3>Filter Restaurants</h3>
      <div className="filters-grid">
        <select name="food_preference" onChange={handleChange}>
          <option value="">Food Preference</option>
          <option value="Veg">Veg</option>
          <option value="Non-Veg">Non-Veg</option>
        </select>
        <select name="cuisine" onChange={handleChange}>
          <option value="">Cuisine</option>
          <option value="Indian">Indian</option>
          <option value="Chinese">Chinese</option>
          <option value="Italian">Italian</option>
          <option value="Continental">Continental</option>
        </select>
        <select name="restaurant_type" onChange={handleChange}>
          <option value="">Restaurant Type</option>
          <option value="Cafe">Cafe</option>
          <option value="Casual Dining">Casual Dining</option>
          <option value="Fine Dining">Fine Dining</option>
        </select>
        <select name="budget" onChange={handleChange}>
          <option value="">Budget</option>
          <option value="800">Under ₹800</option>
          <option value="1500">Under ₹1500</option>
          <option value="2000">Under ₹2000</option>
          <option value="15000">Under ₹15000</option>
        </select>
        <input type="number" name="guests" placeholder="Guests" onChange={handleChange} />
      </div>
      <button className="filter-btn" onClick={applyFilters}>Find Restaurants</button>
    </div>
  );
}
 
export default Filters;