import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/products?gender=male">Men</Link>          {/* ⭐ 수정 */}
        <Link to="/products?gender=female">Women</Link>       {/* ⭐ 수정 */}
        <Link to="/products?sort=latest">New Arrivals</Link> {/* ⭐ 수정 */}
      </div>
    </nav>
  );
}

export default Navbar;