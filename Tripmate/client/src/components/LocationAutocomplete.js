import React, { useState, useEffect, useRef } from "react";
import { FiMapPin, FiSearch, FiCheck } from "react-icons/fi";
import "../styles/LocationAutocomplete.css";

export default function LocationAutocomplete({
  value = "",
  onChange,
  onSelect,
  placeholder = "Search for a city...",
  type = "city",
  disabled = false,
  id,
}) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const containerRef = useRef(null);

  // Search after the user stops typing
  useEffect(() => {
    if (
      !isOpen ||
      value.trim().length < 2 ||
      value === selectedLabel
    ) {
      setResults([]);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();

    setResults([]);
    setLoading(true);
    setError("");

    const timeout = setTimeout(async () => {
      try {
        const token = localStorage.getItem("token");

        const params = new URLSearchParams({
          q: value.trim(),
          type,
        });

        const response = await fetch(
          `/api/locations/autocomplete?${params}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error("Location search failed.");
        }

        const data = await response.json();

        if (!controller.signal.aborted) {
          setResults(Array.isArray(data) ? data : []);
        }

      } catch (err) {
        if (!controller.signal.aborted) {
          setError("Unable to search locations. Try again.");
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 400);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [value, type, isOpen, selectedLabel]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const handleChange = (event) => {
    setSelectedLabel("");
    setIsOpen(true);
    onChange(event.target.value);
  };

  const handleSelect = (place) => {
    setSelectedLabel(place.label);
    setResults([]);
    setIsOpen(false);
    onSelect(place);
  };

  const showDropdown =
    isOpen &&
    value.trim().length >= 2 &&
    value !== selectedLabel;

  return (
    <div
      className="la-container"
      ref={containerRef}
    >
      <div className="la-input-wrapper">
        <FiSearch className="la-search-icon" />

        <input
          id={id}
          type="text"
          aria-label={placeholder}
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          disabled={disabled}
          onChange={handleChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setIsOpen(false);
            }

            if (event.key === "Enter") {
              event.preventDefault();

              if (results.length > 0) {
                handleSelect(results[0]);
              }
            }
          }}
        />

        {selectedLabel &&
          selectedLabel === value && (
            <FiCheck className="la-check-icon" />
          )}
      </div>

      {showDropdown && (
        <div className="la-dropdown">
          {loading ? (
            <div className="la-status">
              <span className="la-spinner" />
              Searching locations...
            </div>
          ) : error ? (
            <div className="la-status la-error">
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="la-status">
              No locations found.
            </div>
          ) : (
            results.map((place) => (
              <button
                key={place.placeId}
                type="button"
                className="la-result"
                onClick={() => handleSelect(place)}
              >
                <div className="la-result-icon">
                  <FiMapPin />
                </div>

                <div className="la-result-text">
                  <strong>{place.name}</strong>
                  <span>{place.label}</span>
                </div>
              </button>
            ))
          )}

          <div className="la-attribution">
            Location data by Geoapify
          </div>
        </div>
      )}
    </div>
  );
}