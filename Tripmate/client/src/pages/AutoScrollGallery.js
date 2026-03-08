import React from "react";
import "../styles/AutoScrollGallery.css"; // Custom CSS for styling

const images = [
  "https://images.unsplash.com/photo-1501238295340-c810d3c156d2?q=80&w=2340&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1444210971048-6130cf0c46cf?q=80&w=2346&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1505842465776-3b4953ca4f44?q=80&w=2340&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1696348013618-8bbb95b7fc3e?q=80&w=2340&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1532347922424-c652d9b7208e?q=80&w=2186&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1415226556993-1404e0c6e727?q=80&w=2259&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522729525412-d848b2319ded?q=80&w=2187&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2340&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1464207687429-7505649dae38?q=80&w=2346&auto=format&fit=crop",
];

function Gallery() {
  return (
    <div className="gallery">
      {images.map((img, index) => (
        <div key={index} className="gallery-card">
          <img src={img} alt={`Gallery item ${index + 1}`} />
        </div>
      ))}
    </div>
  );
}

export default Gallery;
