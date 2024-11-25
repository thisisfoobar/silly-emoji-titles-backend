const Strava = require("./strava");
const db = require("../db");
const { NotFoundError } = require("../expressError");

// FILE: models/strava.test.js

"use strict";


jest.mock("../db");

describe("Strava model", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createUser", () => {
    it("should update user if duplicate is found", async () => {
      const mockUser = { athlete_id: 1, access_token: "token1", refresh_token: "refresh1", token_expires_at: "2023-10-10" };
      db.query.mockResolvedValueOnce({ rows: [mockUser] });
      db.query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await Strava.createUser(1, "token1", "refresh1", "2023-10-10");
      expect(result).toEqual(mockUser);
      expect(db.query).toHaveBeenCalledTimes(2);
    });

    it("should create user if no duplicate is found", async () => {
      const mockUser = { athlete_id: 1, access_token: "token1", refresh_token: "refresh1", token_expires_at: "2023-10-10" };
      db.query.mockResolvedValueOnce({ rows: [] });
      db.query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await Strava.createUser(1, "token1", "refresh1", "2023-10-10");
      expect(result).toEqual(mockUser);
      expect(db.query).toHaveBeenCalledTimes(2);
    });
  });
describe("updateUser", () => {
  it("should update user if user exists", async () => {
    const mockUser = { athlete_id: 1, access_token: "token1", refresh_token: "refresh1", token_expires_at: "2023-10-10" };
    db.query.mockResolvedValueOnce({ rows: [mockUser] });

    const result = await Strava.updateUser(1, "token1", "refresh1", "2023-10-10");
    expect(result).toEqual(mockUser);
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  it("should throw NotFoundError if user does not exist", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    await expect(Strava.updateUser(1, "token1", "refresh1", "2023-10-10")).rejects.toThrow(NotFoundError);
    expect(db.query).toHaveBeenCalledTimes(1);
  });
});

describe("getUser", () => {
  it("should return user if user exists", async () => {
    const mockUser = { athlete_id: 1, access_token: "token1", refresh_token: "refresh1", token_expires_at: "2023-10-10" };
    db.query.mockResolvedValueOnce({ rows: [mockUser] });

    const result = await Strava.getUser(1);
    expect(result).toEqual(mockUser);
    expect(db.query).toHaveBeenCalledTimes(1);
  });
});

describe("deleteUser", () => {
  it("should delete user if user exists", async () => {
    const mockUser = { athlete_id: 1 };
    db.query.mockResolvedValueOnce({ rows: [mockUser] });

    await Strava.deleteUser(1);
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  it("should throw NotFoundError if user does not exist", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    await expect(Strava.deleteUser(1)).rejects.toThrow(NotFoundError);
    expect(db.query).toHaveBeenCalledTimes(1);
  });
});
});