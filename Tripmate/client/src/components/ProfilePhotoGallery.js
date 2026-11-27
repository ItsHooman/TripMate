import React, { useRef, useEffect, useState } from "react";
import {
  FiPlus,
  FiX,
  FiStar,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

import "../styles/ProfilePhotoGallery.css";

const MAX_PHOTOS = 6;
const MAX_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

function PhotoPreview({ photo }) {
  const [src, setSrc] = useState(photo.url || "");

  useEffect(() => {
    if (!photo.file) {
      setSrc(photo.url || "");
      return;
    }

    const url = URL.createObjectURL(photo.file);
    setSrc(url);

    return () => URL.revokeObjectURL(url);
  }, [photo.file, photo.url]);

  return <img src={src} alt="Profile photo" />;
}

export default function ProfilePhotoGallery({
  photos,
  onChange,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");

  const handleFiles = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    setError("");

    if (photos.length + files.length > MAX_PHOTOS) {
      setError("You can add a maximum of 6 photos.");
      return;
    }

    if (files.some(file => !ALLOWED_TYPES.includes(file.type))) {
      setError("Please select JPG, PNG or WEBP images.");
      return;
    }

    if (files.some(file => file.size > MAX_SIZE)) {
      setError("Each photo must be smaller than 5 MB.");
      return;
    }

    const newPhotos = files.map(file => ({
      id: crypto.randomUUID(),
      file,
    }));

    onChange([...photos, ...newPhotos]);
  };

  const removePhoto = (index) => {
    onChange(
      photos.filter((_, i) => i !== index)
    );
    setError("");
  };

  const makeMain = (index) => {
    const updated = [...photos];
    const [selected] = updated.splice(index, 1);

    updated.unshift(selected);
    onChange(updated);
  };

  const movePhoto = (index, direction) => {
    const nextIndex = index + direction;

    if (
      nextIndex < 0 ||
      nextIndex >= photos.length
    ) return;

    const updated = [...photos];

    [updated[index], updated[nextIndex]] = [
      updated[nextIndex],
      updated[index],
    ];

    onChange(updated);
  };

  return (
    <section className="ppg-section">
      <div className="ppg-heading">
        <h2>Your travel photos</h2>

        <p>
          Show other travellers your personality
          and adventures.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        disabled={disabled}
        onChange={handleFiles}
      />

      <div className="ppg-grid">
        {Array.from({ length: MAX_PHOTOS }, (_, index) => {
          const photo = photos[index];

          if (!photo) {
            return (
              <button
                key={`empty-${index}`}
                type="button"
                className="ppg-empty"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
              >
                <FiPlus />
                <span>Add photo</span>
              </button>
            );
          }

          return (
            <div
              key={photo.id}
              className="ppg-card"
            >
              <div className="ppg-image">
                <PhotoPreview photo={photo} />

                <button
                  type="button"
                  className="ppg-remove"
                  aria-label={`Remove photo ${index + 1}`}
                  disabled={disabled}
                  onClick={() => removePhoto(index)}
                >
                  <FiX />
                </button>

                {index === 0 && (
                  <span className="ppg-main-badge">
                    <FiStar /> Main photo
                  </span>
                )}
              </div>

              <div className="ppg-controls">
                <button
                  type="button"
                  aria-label="Move photo left"
                  disabled={disabled || index === 0}
                  onClick={() => movePhoto(index, -1)}
                >
                  <FiChevronLeft />
                </button>

                <button
                  type="button"
                  className="ppg-main-button"
                  disabled={disabled || index === 0}
                  onClick={() => makeMain(index)}
                >
                  {index === 0 ? "Main" : "Make main"}
                </button>

                <button
                  type="button"
                  aria-label="Move photo right"
                  disabled={
                    disabled ||
                    index === photos.length - 1
                  }
                  onClick={() => movePhoto(index, 1)}
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="ppg-footer">
        <span>{photos.length} of 6 photos</span>
        <span>Max 5 MB each</span>
      </div>

      {error && (
        <p className="ppg-error" role="alert">
          {error}
        </p>
      )}

      <p className="ppg-note">
        Your main photo appears on your matching
        card and in conversations.
      </p>
    </section>
  );
}