import React, { useContext, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { io } from "socket.io-client";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import Images from "./AutoScrollGallery";
import "@fortawesome/fontawesome-free/css/all.min.css";
import headerBackImage from "../assets/header-back.jpg";
import BackImage from "../assets/back-2.jpg";
import mainImage from "../assets/main-back5.webp";
import AboutImage from "../assets/main-back3.webp";
import AboutImage2 from "../assets/main-back6.webp";
import "../styles/homepage.scss";
import "../styles/Dashboard.scss";
import API_BASE_URL from "../config/api";

const SOCKET_SERVER_URL =
  process.env.REACT_APP_SOCKET_URL || "http://localhost:5002";

function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const userId = user?.id;

  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const testimonials = [
    {
      name: "John Doe",
      quote:
        "TripMate helped me find amazing travel buddies. It was a life-changing experience!",
      image: "test-image-3.jpg",
    },
    {
      name: "Jane Smith",
      quote:
        "The events and companions I discovered through TripMate made my trips unforgettable!",
      image: "test-image-2.jpg",
    },
    {
      name: "Anna Lee",
      quote:
        "A perfect platform for solo travelers looking to connect and explore.",
      image: "test-image.jpg",
    },
    {
      name: "Alexander Brown",
      quote:
        "I've met some of my best friends through TripMate. Highly recommended!",
      image: "test-image-4.jpg",
    },
  ];

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    fetch(`${API_BASE_URL}/checkban`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message === "You have been banned") {
          alert("You have been banned.");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
      })
      .catch((error) => {
        console.error("Error checking ban status:", error);
      });
  }, [navigate]);

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL, { transports: ["websocket"] });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && userId) {
      socket.emit("registerUser", userId);
    }
  }, [socket, userId]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!userId) return;

      try {
        const response = await fetch(`${API_BASE_URL}/notifications/${userId}`);
        const data = await response.json();

        setNotifications(data);
        localStorage.setItem("notifications", JSON.stringify(data));
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    if (!socket || !userId) return;

    const handleConnectionRequest = (data) => {
      const { senderId, user } = data;

      const newNotification = {
        type: "connectionRequest",
        senderId,
        senderName: user.name,
        message: `${user.name} wants to connect with you.`,
        read: false,
      };

      setNotifications((prev) => {
        const updated = [...prev, newNotification];
        localStorage.setItem("notifications", JSON.stringify(updated));
        return updated;
      });
    };

    socket.on("connectionRequest", handleConnectionRequest);

    return () => {
      socket.off("connectionRequest", handleConnectionRequest);
    };
  }, [socket, userId]);

  useEffect(() => {
    const handleScroll = () => {
      const banners = document.querySelectorAll(".welcome-banner-image");
      banners.forEach((banner) => {
        const scrollPosition = window.pageYOffset;
        banner.style.transform = `translateY(${scrollPosition * 0.7}px)`;
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const banners = document.querySelectorAll(".parallax-image");
      banners.forEach((banner) => {
        const scrollPosition = window.pageYOffset;
        banner.style.transform = `translateY(${scrollPosition * 0.3}px)`;
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          } else {
            entry.target.classList.remove("visible");
          }
        });
      },
      { threshold: 0.9 }
    );

    const headings = document.querySelectorAll("h1, h2");
    headings.forEach((heading) => observer.observe(heading));

    return () => {
      headings.forEach((heading) => observer.unobserve(heading));
    };
  }, []);

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo">
          <a href="/dashboard">
            <img className="app-image" src="/logo-1-Photoroom.png" alt="App Logo" />
          </a>
        </div>

        <div className="hamburger" onClick={toggleMenu}>
          <i className="fas fa-bars"></i>
        </div>

        <div className={`navbar-links ${isMenuOpen ? "open" : ""}`}>
          <div
            className="notifications-icon"
            onClick={() => navigate("/notifications")}
          >
            <i className="fa-regular fa-envelope"></i>
            {notifications.length > 0 && (
              <span className="badge">{notifications.length}</span>
            )}
          </div>

          <div className="dropdown">
            <a href="#">
              <i className="fa fa-user"></i> Hello {user?.name || "Traveler"} !
            </a>
            <div className="dropdown-content">
              <a href="/profile">Profile</a>
              <a href="/messages">Messages</a>
              <a href="#" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i> Logout
              </a>
            </div>
          </div>

          <div className="dropdown">
            <a href="#">
              <i className="fas fa-calendar-alt"></i> Travel Exploration
              <i className="fas fa-caret-down"></i>
            </a>
            <div className="dropdown-content">
              <a href="/explore-events">Explore Events</a>
              <a href="/matching">Travel Companions</a>
            </div>
          </div>

          <div className="dropdown">
            <a href="#">
              <i className="fa fa-info-circle"></i> Support & Information
              <i className="fas fa-caret-down"></i>
            </a>
            <div className="dropdown-content">
              <a href="#">About Us</a>
              <a href="#">Contact Us</a>
            </div>
          </div>
        </div>
      </nav>

      <div className="dashboard-container">
        <div className="dashboard-banner">
          <img
            src={headerBackImage}
            alt="Welcome Banner"
            className="welcome-banner-image"
          />
        </div>

        <div className="welcome-banner-content">
          <h1>Discover Events and Connect with Fellow Travelers</h1>
          <p>
            Join a vibrant community of solo travelers eager to explore the world
            together. Whether it is a local festival or an international adventure,
            there's an event waiting for you!
          </p>
          <button
            className="banner-button"
            onClick={() => navigate("/explore-events")}
          >
            Join
          </button>
        </div>

        <section className="features-section">
          <h2>Why Choose TripMate?</h2>
          <div className="features-list">
            <div className="feature-item" data-aos="fade-right">
              <div className="feature-image-wrapper">
                <img
                  src="feature-1.jpg"
                  alt="Find Companions"
                  className="feature-image"
                />
                <div className="feature-description" data-aos="fade-right">
                  <h3>Find Companions</h3>
                  <p>Meet travelers who share your interests.</p>
                  <button
                    className="feature-button"
                    onClick={() => navigate("/matching")}
                  >
                    Find Travel Buddies
                  </button>
                </div>
              </div>
            </div>

            <div
              className="feature-item"
              data-aos="fade-left"
              data-aos-delay="100"
            >
              <div className="feature-image-wrapper">
                <img
                  src="feature-2.png"
                  alt="Explore Destinations"
                  className="feature-image"
                />
                <div className="feature-description" data-aos="fade-left">
                  <h3>Explore Destinations</h3>
                  <p>Discover the most popular travel spots.</p>
                  <button
                    className="feature-button"
                    onClick={() => navigate("/explore-events")}
                  >
                    Explore Events
                  </button>
                </div>
              </div>
            </div>

            <div
              className="feature-item"
              data-aos="fade-right"
              data-aos-delay="200"
            >
              <div className="feature-image-wrapper">
                <img
                  src="feature-3.png"
                  alt="Companions"
                  className="feature-image"
                />
                <div className="feature-description" data-aos="fade-right">
                  <h3>Companions</h3>
                  <p>
                    Find and search for travel companions who share your interests.
                  </p>
                  <button
                    className="feature-button"
                    onClick={() => navigate("/matching")}
                  >
                    Start Matching
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="parallax-background">
          <img
            src={BackImage}
            alt="New Parallax Background"
            className="parallax-image"
          />
        </div>

        <div className="dashboard-gallery">
          <h2>Highlights</h2>
          <Images />

          <section id="about" className="about-section">
            <div className="about-content">
              <img
                src={mainImage}
                alt="Travel"
                className="about-image"
                data-aos="fade-right"
              />
              <div className="about-text" data-aos="fade-left">
                <h2>Discover the World with Like-Minded Travelers</h2>
                <p>
                  At TripMate, we believe that travel is more than just a journey—it’s
                  about the connections you make along the way. Whether you're an
                  experienced solo traveler, an adventure seeker, or someone looking to
                  step out of their comfort zone, we’re here to make every trip more
                  exciting and meaningful.
                </p>
              </div>
            </div>

            <div className="about-content reverse">
              <div className="about-text" data-aos="fade-right">
                <h2>Our Mission</h2>
                <p>
                  Our mission is to bring travelers together, creating a global
                  community where like-minded individuals can find companions, share
                  experiences, and explore the world without limits. Traveling solo can
                  be thrilling, but the right company turns an ordinary trip into an
                  unforgettable adventure.
                </p>
              </div>
              <img
                src={AboutImage}
                alt="Travel Experience"
                className="about-image"
                data-aos="fade-left"
              />
            </div>

            <div className="about-content">
              <img
                src={AboutImage2}
                alt="Cultural Exchange"
                className="about-image"
                data-aos="fade-right"
              />
              <div className="about-text" data-aos="fade-left">
                <h2>Building a Global Travel Community</h2>
                <p>
                  We envision a world where no traveler ever feels alone unless they
                  choose to be. By fostering genuine connections, encouraging cultural
                  exchanges, and making travel more accessible, TripMate is
                  revolutionizing the way people experience the world.
                </p>
              </div>
            </div>
          </section>

          <section className="testimonials-section">
            <h2>What Our Travelers Say</h2>

            <Swiper
              modules={[Autoplay, Navigation, Pagination]}
              spaceBetween={50}
              slidesPerView={3}
              loop={true}
              autoplay={{
                delay: 2500,
                disableOnInteraction: false,
              }}
              navigation={true}
              pagination={{ clickable: true }}
              className="testimonials-swiper"
            >
              {testimonials.map((testimonial, index) => (
                <SwiperSlide key={index} className="testimonial-item">
                  <div className="testimonial-card">
                    <img
                      src={testimonial.image}
                      alt={`${testimonial.name}'s testimonial`}
                      className="testimonial-image"
                    />
                    <p className="testimonial-quote">"{testimonial.quote}"</p>
                    <h4 className="testimonial-name">- {testimonial.name}</h4>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </section>

          <footer className="dashboard-footer">
            <div className="footer-content">
              <div className="footer-section">
                <h3>About Us</h3>
                <p className="footer-description">
                  Your ultimate companion for finding events, meeting travel buddies,
                  and exploring the world together.
                </p>
              </div>

              <div className="footer-section">
                <h3>Quick Links</h3>
                <ul>
                  <li>
                    <Link to="/profile">Profile</Link>
                  </li>
                  <li>
                    <Link to="/explore-events">Explore Events</Link>
                  </li>
                  <li>
                    <Link to="/matching">Travel Companions</Link>
                  </li>
                  <li>
                    <Link to="/contact">Contact Us</Link>
                  </li>
                </ul>
              </div>

              <div className="footer-section">
                <h3>Follow Us</h3>
                <div className="social-icons">
                  <a href="#"><i className="fab fa-facebook-f"></i></a>
                  <a href="#"><i className="fab fa-twitter"></i></a>
                  <a href="#"><i className="fab fa-instagram"></i></a>
                  <a href="#"><i className="fab fa-linkedin-in"></i></a>
                </div>
              </div>
            </div>

            <div className="footer-bottom">
              <p className="footer-description">
                &copy; {new Date().getFullYear()} TripMate. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;