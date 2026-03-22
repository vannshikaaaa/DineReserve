import { useState } from "react";
 
function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");
 
  const handleSearch = () => onSearch({ search: query });
  const handleEnter = (e) => { if (e.key === "Enter") handleSearch(); };
 
  return (
    <div className="search-bar">
      <input type="text" placeholder="Search restaurants..."
        value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleEnter} />
      <button onClick={handleSearch}>Search</button>
    </div>
  );
}
 
export default SearchBar;
