/**
 * Delivery Service
 * Handles geolocation and address retrieval for delivery orders
 */

/**
 * Get user's current location using browser geolocation API
 * Uses high accuracy settings for better precision
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number}>}
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
          default:
            errorMessage = "An unknown error occurred while getting location.";
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true, // Use GPS if available for better accuracy
        timeout: 15000, // Increased timeout
        maximumAge: 0, // Don't use cached position
      }
    );
  });
};

/**
 * Reverse geocode coordinates to get a detailed readable address
 * Uses OpenStreetMap Nominatim API with higher zoom level for street-level detail
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<string>}
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    // Use zoom level 18 for maximum detail (street level)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&extratags=1&namedetails=1`,
      {
        headers: {
          "User-Agent": "TapNOrder/1.0", // Required by Nominatim
          "Accept-Language": "en", // Request English language
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch address");
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    // Format address from response - prioritize street-level details
    const address = data.address;
    if (!address) {
      // Fallback to display_name if available
      return data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }

    // Build detailed address string with street-level priority
    const addressParts = [];
    
    // Priority 1: Building/House details (most specific)
    if (address.house_number) {
      addressParts.push(address.house_number);
    }
    if (address.building) {
      addressParts.push(address.building);
    }
    
    // Priority 2: Street/Road name (critical for delivery)
    if (address.road) {
      addressParts.push(address.road);
    } else if (address.street) {
      addressParts.push(address.street);
    } else if (address.pedestrian) {
      addressParts.push(address.pedestrian);
    }
    
    // Priority 3: Neighborhood/Locality
    if (address.neighbourhood) {
      addressParts.push(address.neighbourhood);
    }
    if (address.suburb) {
      addressParts.push(address.suburb);
    }
    if (address.locality && !addressParts.includes(address.locality)) {
      addressParts.push(address.locality);
    }
    
    // Priority 4: City/Town/Village
    if (address.city) {
      addressParts.push(address.city);
    } else if (address.town) {
      addressParts.push(address.town);
    } else if (address.village) {
      addressParts.push(address.village);
    }
    
    // Priority 5: District/County
    if (address.district) {
      addressParts.push(address.district);
    }
    if (address.county) {
      addressParts.push(address.county);
    }
    
    // Priority 6: State/Region
    if (address.state) {
      addressParts.push(address.state);
    } else if (address.region) {
      addressParts.push(address.region);
    }
    
    // Priority 7: Postal code
    if (address.postcode) {
      addressParts.push(address.postcode);
    }
    
    // Priority 8: Country (usually last)
    if (address.country) {
      addressParts.push(address.country);
    }

    // If we have a good address, use it
    if (addressParts.length > 0) {
      const formattedAddress = addressParts.join(", ");
      // Always return if we have street/road information
      if (address.road || address.street || address.pedestrian) {
        return formattedAddress;
      }
      // If no street but we have other details, still return it
      // User can manually edit if needed
      if (addressParts.length >= 3) {
        return formattedAddress;
      }
    }

    // Fallback: Use display_name which often has better formatting and includes street names
    // This is usually more reliable than manually building the address
    if (data.display_name && data.display_name.length > 10) {
      // Check if display_name contains street-level information
      const displayNameLower = data.display_name.toLowerCase();
      const hasStreetInfo = displayNameLower.includes("street") || 
                            displayNameLower.includes("road") || 
                            displayNameLower.includes("avenue") || 
                            displayNameLower.includes("lane") ||
                            displayNameLower.includes("drive") ||
                            displayNameLower.includes("boulevard") ||
                            displayNameLower.includes("way") ||
                            address.road || address.street;
      
      // Prefer display_name if it has street info or if our manual build doesn't have street
      if (hasStreetInfo || !address.road) {
        return data.display_name;
      }
    }

    // Last resort: coordinates
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    // Fallback to coordinates if reverse geocoding fails
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
};

/**
 * Get user's current address by combining geolocation and reverse geocoding
 * Includes retry logic for better accuracy
 * @returns {Promise<string>}
 */
export const getCurrentAddress = async () => {
  try {
    // Step 1: Get current location with high accuracy
    const location = await getCurrentLocation();
    const { latitude, longitude, accuracy } = location;
    
    // Log accuracy for debugging (can be removed in production)
    // console.log(`Location accuracy: ${accuracy} meters`);
    
    // Step 2: Reverse geocode to get address
    const address = await reverseGeocode(latitude, longitude);
    
    // Check if address has street-level information
    const addressLower = address.toLowerCase();
    const hasStreetInfo = addressLower.includes("street") || 
                          addressLower.includes("road") || 
                          addressLower.includes("avenue") || 
                          addressLower.includes("lane") ||
                          addressLower.includes("drive") ||
                          addressLower.includes("boulevard") ||
                          addressLower.includes("way") ||
                          addressLower.includes("st") ||
                          addressLower.includes("rd") ||
                          addressLower.includes("ave");
    
    // If accuracy is poor (>100m) and address doesn't contain street info, try again
    if (accuracy > 100 && !hasStreetInfo) {
      // console.log("Low accuracy or missing street info detected, attempting to get better location...");
      // Wait a bit and try once more
      await new Promise(resolve => setTimeout(resolve, 1000));
      const retryLocation = await getCurrentLocation();
      const retryAddress = await reverseGeocode(retryLocation.latitude, retryLocation.longitude);
      const retryAddressLower = retryAddress.toLowerCase();
      const retryHasStreetInfo = retryAddressLower.includes("street") || 
                                  retryAddressLower.includes("road") || 
                                  retryAddressLower.includes("avenue") || 
                                  retryAddressLower.includes("lane") ||
                                  retryAddressLower.includes("drive") ||
                                  retryAddressLower.includes("boulevard") ||
                                  retryAddressLower.includes("way");
      // Use retry address if it seems better (has street info or better accuracy)
      if (retryHasStreetInfo || retryLocation.accuracy < accuracy) {
        return retryAddress;
      }
    }
    
    return address;
  } catch (error) {
    throw error;
  }
};

