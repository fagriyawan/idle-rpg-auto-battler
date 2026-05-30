import { describe, it, expect, vi, beforeEach } from "vitest";
import * as resourceService from "../services/resource.service";
import * as resourceRepository from "../repositories/resource.repository";

vi.mock("../repositories/resource.repository");

const mockedRepo = vi.mocked(resourceRepository);

describe("resource.service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("getResources", () => {
    it("should return resources from repository", async () => {
      const resources = { gold: 500, gems: 50, energy: 100 };
      mockedRepo.getResources.mockResolvedValue(resources);

      const result = await resourceService.getResources("player-1");

      expect(mockedRepo.getResources).toHaveBeenCalledWith("player-1");
      expect(result).toEqual(resources);
    });

    it("should return null when player has no resource record", async () => {
      mockedRepo.getResources.mockResolvedValue(null);

      const result = await resourceService.getResources("player-1");

      expect(result).toBeNull();
    });
  });

  describe("deductResource", () => {
    it("should deduct resource when valid input and sufficient balance", async () => {
      const updatedResources = { gold: 300, gems: 50, energy: 100 };
      mockedRepo.deductResource.mockResolvedValue(updatedResources);

      const result = await resourceService.deductResource("player-1", "gold", 200);

      expect(mockedRepo.deductResource).toHaveBeenCalledWith("player-1", "gold", 200);
      expect(result).toEqual(updatedResources);
    });

    it("should throw when amount is not a positive integer (zero)", async () => {
      await expect(
        resourceService.deductResource("player-1", "gold", 0)
      ).rejects.toThrow("Amount must be a positive integer");
    });

    it("should throw when amount is not a positive integer (negative)", async () => {
      await expect(
        resourceService.deductResource("player-1", "gold", -5)
      ).rejects.toThrow("Amount must be a positive integer");
    });

    it("should throw when amount is not an integer (decimal)", async () => {
      await expect(
        resourceService.deductResource("player-1", "gold", 2.5)
      ).rejects.toThrow("Amount must be an integer");
    });

    it("should throw when resource type is invalid", async () => {
      await expect(
        resourceService.deductResource("player-1", "diamonds", 10)
      ).rejects.toThrow("Resource type must be one of: gold, gems, energy");
    });

    it("should throw with details when insufficient balance", async () => {
      mockedRepo.deductResource.mockResolvedValue(null);
      mockedRepo.getResources.mockResolvedValue({ gold: 50, gems: 50, energy: 100 });

      try {
        await resourceService.deductResource("player-1", "gold", 200);
        expect.fail("Should have thrown");
      } catch (error: any) {
        expect(error.message).toBe("Insufficient resources");
        expect(error.resource).toBe("gold");
        expect(error.required).toBe(200);
        expect(error.available).toBe(50);
      }
    });

    it("should report available as 0 when no resource record exists", async () => {
      mockedRepo.deductResource.mockResolvedValue(null);
      mockedRepo.getResources.mockResolvedValue(null);

      try {
        await resourceService.deductResource("player-1", "gold", 100);
        expect.fail("Should have thrown");
      } catch (error: any) {
        expect(error.message).toBe("Insufficient resources");
        expect(error.available).toBe(0);
      }
    });
  });

  describe("awardResource", () => {
    it("should award resource when valid input", async () => {
      const updatedResources = { gold: 700, gems: 50, energy: 100 };
      mockedRepo.awardResource.mockResolvedValue(updatedResources);

      const result = await resourceService.awardResource("player-1", "gold", 200);

      expect(mockedRepo.awardResource).toHaveBeenCalledWith("player-1", "gold", 200);
      expect(result).toEqual(updatedResources);
    });

    it("should throw when amount is not a positive integer (zero)", async () => {
      await expect(
        resourceService.awardResource("player-1", "gems", 0)
      ).rejects.toThrow("Amount must be a positive integer");
    });

    it("should throw when amount is not a positive integer (negative)", async () => {
      await expect(
        resourceService.awardResource("player-1", "energy", -1)
      ).rejects.toThrow("Amount must be a positive integer");
    });

    it("should throw when amount is not an integer (decimal)", async () => {
      await expect(
        resourceService.awardResource("player-1", "gold", 1.5)
      ).rejects.toThrow("Amount must be an integer");
    });

    it("should throw when resource type is invalid", async () => {
      await expect(
        resourceService.awardResource("player-1", "mana", 10)
      ).rejects.toThrow("Resource type must be one of: gold, gems, energy");
    });

    it("should throw when player resource record not found", async () => {
      mockedRepo.awardResource.mockResolvedValue(null);

      await expect(
        resourceService.awardResource("player-1", "gold", 100)
      ).rejects.toThrow("Player resource record not found");
    });
  });
});
