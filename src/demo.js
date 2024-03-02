import React, { useState, useEffect } from "react";
import { getStorage, ref,uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "./firebase";

const ImageUpload = () => {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleImageUpload = async () => {
    if (!image) {
      alert("Please select an image.");
      return;
    }

    const storage = getStorage();
    const storageRef = ref(storage, `images/${image.name}`);

    // Upload image to Firebase Storage
    await uploadBytes(storageRef, image);

    // Get the download URL of the uploaded image
    const downloadURL = await getDownloadURL(storageRef);
    setImageUrl(downloadURL);
  };

  // Function to fetch and display image from Firebase Storage
  const fetchAndDisplayImage = async () => {
    const storage = getStorage();
    const storageRef = ref(storage, "images/example.jpg"); // Change the path to your image

    try {
      const downloadURL = await getDownloadURL(storageRef);
      setImageUrl(downloadURL);
    } catch (error) {
      console.error("Error fetching image:", error);
    }
  };

  useEffect(() => {
    // Fetch and display image when the component mounts
    fetchAndDisplayImage();
  }, []); // Empty dependency array ensures that it only runs once

  return (
    <div>
      <input type="file" onChange={handleImageChange} />
      <button onClick={handleImageUpload}>Upload Image</button>

      {imageUrl && (
        <div>
          <p>Image URL:</p>
          <img src={imageUrl} alt="Uploaded" style={{ maxWidth: "300px" }} />
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
