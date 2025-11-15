import { Request, Response, NextFunction } from "express";
import {
  Address,
  ValidateAddressResponse,
  CalculateDeliveryCostResponse,
  DeliveryErrorCode,
} from "../types/delivery.type";
import {
  isLosAngelesAddress,
  getZipCodeCoordinates,
} from "../lib/laZipCodes";
import { calculateDistance } from "../lib/distanceCalculator";

// Configuration from environment variables with defaults
const WAREHOUSE_LAT = parseFloat(process.env.WAREHOUSE_LAT || "34.0522");
const WAREHOUSE_LNG = parseFloat(process.env.WAREHOUSE_LNG || "-118.2437");
const FREE_DELIVERY_DISTANCE = parseFloat(process.env.FREE_DELIVERY_DISTANCE || "10"); // Distance threshold for free delivery eligibility
const FREE_DELIVERY_THRESHOLD = parseFloat(process.env.FREE_DELIVERY_THRESHOLD || "1000");
const NEAR_RANGE_DISTANCE = parseFloat(process.env.NEAR_RANGE_DISTANCE || "5");
const NEAR_RANGE_COST = parseFloat(process.env.NEAR_RANGE_COST || "25");
const MID_RANGE_DISTANCE = parseFloat(process.env.MID_RANGE_DISTANCE || "10");
const MID_RANGE_COST = parseFloat(process.env.MID_RANGE_COST || "50");
const FAR_RANGE_COST = parseFloat(process.env.FAR_RANGE_COST || "100"); // 10+ miles within LA

/**
 * Validates delivery address
 * POST /api/delivery/validate-address
 */
export const validateAddress = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { address } = req.body;

    // Normalize address country
    const normalizedAddress: Address = {
      street: address?.street || "",
      city: address?.city || "",
      state: address?.state || "",
      zip_code: address?.zip_code || "",
      country: address?.country || "United States",
    };

    // Skip validation if DEBUG mode is enabled
    const isDebugMode = process.env.DEBUG === 'true';
    if (isDebugMode) {
      console.log(`🐛 DEBUG MODE: Skipping address validation`);
      res.status(200).json({
        address: normalizedAddress,
        is_valid: true,
        is_in_zone: true,
        distance_miles: 0,
        message: "DEBUG MODE: Validation bypassed",
      } as ValidateAddressResponse);
      return;
    }

    // Check if required fields are present
    if (!normalizedAddress.street || !normalizedAddress.city || !normalizedAddress.state || !normalizedAddress.zip_code) {
      console.log(`❌ Address validation failed: Missing required fields`);
      res.status(400).json({
        address: normalizedAddress,
        is_valid: false,
        is_in_zone: false,
        distance_miles: 0,
        message: "Invalid address: street, city, state, and zip_code are required",
      } as ValidateAddressResponse);
      return;
    }

    // Validate if address is in Los Angeles
    const isLA = isLosAngelesAddress(
      normalizedAddress.city,
      normalizedAddress.state,
      normalizedAddress.zip_code
    );

    if (!isLA) {
      console.log(`❌ Address validation failed: Not in Los Angeles - ${normalizedAddress.city}, ${normalizedAddress.state} ${normalizedAddress.zip_code}`);
      res.status(400).json({
        address: normalizedAddress,
        is_valid: true, // Address format is valid
        is_in_zone: false, // But not in our delivery zone
        distance_miles: 0,
        message: "Delivery is only available in Los Angeles, CA",
      } as ValidateAddressResponse);
      return;
    }

    // Get coordinates for the ZIP code
    const coordinates = getZipCodeCoordinates(normalizedAddress.zip_code);

    if (!coordinates) {
      console.log(`❌ Distance calculation failed for ZIP: ${normalizedAddress.zip_code}`);
      res.status(500).json({
        error: DeliveryErrorCode.DISTANCE_CALCULATION_FAILED,
        message: "Unable to calculate distance for this address",
      });
      return;
    }

    // Calculate distance from warehouse
    const distance_miles = calculateDistance(
      WAREHOUSE_LAT,
      WAREHOUSE_LNG,
      coordinates.lat,
      coordinates.lng
    );

    console.log(`📍 Distance calculated: ${distance_miles.toFixed(2)} miles from warehouse to ${normalizedAddress.zip_code}`);

    // Address is valid and within LA delivery zone (we deliver to all of LA regardless of distance)
    console.log(`✅ Address validated successfully: ${normalizedAddress.city}, ${normalizedAddress.state} ${normalizedAddress.zip_code} (${distance_miles.toFixed(2)} miles)`);
    res.status(200).json({
      address: normalizedAddress,
      is_valid: true,
      is_in_zone: true, // All LA addresses are in zone
      distance_miles: parseFloat(distance_miles.toFixed(2)),
    } as ValidateAddressResponse);
  } catch (error) {
    console.error("❌ Error in validateAddress:", error);
    next(error);
  }
};

/**
 * Calculates delivery cost based on address and order total
 * POST /api/delivery/calculate-cost
 */
export const calculateDeliveryCost = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { address, order_total } = req.body;

    // Validate order_total
    if (order_total === undefined || order_total === null || typeof order_total !== "number" || order_total < 0) {
      console.log(`❌ Calculate cost failed: Invalid order total`);
      res.status(400).json({
        error: DeliveryErrorCode.MISSING_REQUIRED_FIELDS,
        message: "Order total is required and must be a positive number",
      });
      return;
    }

    // Normalize address
    const normalizedAddress: Address = {
      street: address?.street || "",
      city: address?.city || "",
      state: address?.state || "",
      zip_code: address?.zip_code || "",
      country: address?.country || "United States",
    };

    // Validate address format
    if (!normalizedAddress.street || !normalizedAddress.city || !normalizedAddress.state || !normalizedAddress.zip_code) {
      console.log(`❌ Calculate cost failed: Invalid address format`);
      res.status(400).json({
        error: DeliveryErrorCode.INVALID_ADDRESS,
        message: "Invalid address format. All fields are required.",
      });
      return;
    }

    // Skip LA validation if DEBUG mode is enabled
    const isDebugMode = process.env.DEBUG === 'true';
    if (isDebugMode) {
      console.log(`🐛 DEBUG MODE: Skipping LA address validation, using default distance`);
      const debugDistance = 5; // Default to near range for debug mode
      let delivery_cost = NEAR_RANGE_COST;
      let is_free = false;
      let reason = "DEBUG MODE: Using default near range pricing";
      
      if (order_total >= FREE_DELIVERY_THRESHOLD && debugDistance < FREE_DELIVERY_DISTANCE) {
        is_free = true;
        delivery_cost = 0;
        reason = `DEBUG MODE: Free delivery (order >= $${FREE_DELIVERY_THRESHOLD})`;
      }
      
      res.status(200).json({
        address: normalizedAddress,
        order_total: order_total,
        distance_miles: debugDistance,
        delivery_cost: delivery_cost,
        is_free: is_free,
        reason: reason,
        tier: "DEBUG: 0-5 miles",
      } as CalculateDeliveryCostResponse);
      return;
    }

    // Validate if address is in Los Angeles
    const isLA = isLosAngelesAddress(
      normalizedAddress.city,
      normalizedAddress.state,
      normalizedAddress.zip_code
    );

    if (!isLA) {
      console.log(`❌ Calculate cost failed: Not in LA - ${normalizedAddress.city}, ${normalizedAddress.state}`);
      res.status(400).json({
        error: DeliveryErrorCode.INVALID_ADDRESS,
        message: "Delivery is only available in Los Angeles, CA",
      });
      return;
    }

    // Get coordinates for the ZIP code
    const coordinates = getZipCodeCoordinates(normalizedAddress.zip_code);

    if (!coordinates) {
      console.log(`❌ Calculate cost failed: Cannot get coordinates for ZIP ${normalizedAddress.zip_code}`);
      res.status(500).json({
        error: DeliveryErrorCode.DISTANCE_CALCULATION_FAILED,
        message: "Unable to calculate distance for this address",
      });
      return;
    }

    // Calculate distance from warehouse
    const distance_miles = calculateDistance(
      WAREHOUSE_LAT,
      WAREHOUSE_LNG,
      coordinates.lat,
      coordinates.lng
    );

    console.log(`📍 Calculating cost for ${distance_miles.toFixed(2)} miles, order total: $${order_total}`);

    // Calculate delivery cost based on distance and order total
    let delivery_cost = 0;
    let is_free = false;
    let reason = "";
    let tier = "";

    // Determine pricing tier based on distance
    if (distance_miles <= NEAR_RANGE_DISTANCE) {
      // 0-5 miles range
      tier = "0-5 miles";
      
      // Free delivery only if order >= threshold AND distance < 10 miles
      if (order_total >= FREE_DELIVERY_THRESHOLD && distance_miles < FREE_DELIVERY_DISTANCE) {
        is_free = true;
        delivery_cost = 0;
        reason = `Free delivery for orders over $${FREE_DELIVERY_THRESHOLD.toLocaleString()} within ${FREE_DELIVERY_DISTANCE} miles`;
      } else {
        delivery_cost = NEAR_RANGE_COST;
        if (order_total < FREE_DELIVERY_THRESHOLD) {
          const amountNeeded = FREE_DELIVERY_THRESHOLD - order_total;
          reason = `Delivery cost $${NEAR_RANGE_COST} for ${tier} distance. Add $${amountNeeded.toFixed(2)} more to qualify for free delivery.`;
        } else {
          reason = `Delivery cost $${NEAR_RANGE_COST} for ${tier} distance.`;
        }
      }
    } else if (distance_miles <= MID_RANGE_DISTANCE) {
      // 5-10 miles range
      tier = "5-10 miles";
      
      // Free delivery only if order >= threshold AND distance < 10 miles
      if (order_total >= FREE_DELIVERY_THRESHOLD && distance_miles < FREE_DELIVERY_DISTANCE) {
        is_free = true;
        delivery_cost = 0;
        reason = `Free delivery for orders over $${FREE_DELIVERY_THRESHOLD.toLocaleString()} within ${FREE_DELIVERY_DISTANCE} miles`;
      } else {
        delivery_cost = MID_RANGE_COST;
        if (order_total < FREE_DELIVERY_THRESHOLD) {
          const amountNeeded = FREE_DELIVERY_THRESHOLD - order_total;
          reason = `Delivery cost $${MID_RANGE_COST} for ${tier} distance. Add $${amountNeeded.toFixed(2)} more to qualify for free delivery.`;
        } else {
          reason = `Delivery cost $${MID_RANGE_COST} for ${tier} distance.`;
        }
      }
    } else {
      // 10+ miles range
      tier = "10+ miles";
      delivery_cost = FAR_RANGE_COST;
      // No free delivery for 10+ miles, regardless of order total
      reason = `Delivery cost $${FAR_RANGE_COST} for ${tier} distance within Los Angeles.`;
    }

    console.log(`✅ Delivery cost calculated: $${delivery_cost} (Free: ${is_free}, Tier: ${tier})`);

    // Return success response
    res.status(200).json({
      address: normalizedAddress,
      order_total: order_total,
      distance_miles: parseFloat(distance_miles.toFixed(2)),
      delivery_cost: delivery_cost,
      is_free: is_free,
      reason: reason,
      tier: tier,
    } as CalculateDeliveryCostResponse);
  } catch (error) {
    console.error("❌ Error in calculateDeliveryCost:", error);
    next(error);
  }
};

