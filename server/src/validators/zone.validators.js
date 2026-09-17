const { z } = require('zod');

// Shared schemas for boundaries and facilities
const pointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]),
});

const facilitySchema = z.object({
  type: z.enum(['medical_camp', 'exit', 'help_desk']),
  name: z.string().trim().min(1, 'Facility name is required'),
  location: pointSchema,
});

const polygonSchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
});

// Validators for endpoints
const createZoneSchema = z.object({
  name: z.string().trim().min(2, 'Zone name must be at least 2 characters').max(100),
  boundary: polygonSchema,
  zoneAdminId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid zoneAdminId ObjectId'),
  facilities: z.array(facilitySchema).optional(),
});

const updateZoneSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  boundary: polygonSchema.optional(),
  zoneAdminId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  facilities: z.array(facilitySchema).optional(),
});

const updateFacilitiesSchema = z.object({
  facilities: z.array(facilitySchema),
});

module.exports = {
  createZoneSchema,
  updateZoneSchema,
  updateFacilitiesSchema,
};
