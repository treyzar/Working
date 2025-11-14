import { catalogItems } from "./constants/constants";
import "./Catalog.scss";

const Catalog = () => {
  return (
    <div className="catalog-page">
      <div className="catalog-container">
        <div className="catalog-grid">
          {catalogItems.map((item, index) => (
            <div key={index} className="catalog-card">
              <h4>{item.title}</h4>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Catalog;
