const Emoji = require("./emoji");
const db = require("../db");

// FILE: models/emoji.test.js

"use strict";


jest.mock("../db");

describe("Emoji model", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getRandomEmoji", () => {
    it("should return an emoji when one is found", async () => {
      const mockEmoji = { emoji: "😊" };
      db.query.mockResolvedValue({ rows: [mockEmoji] });

      const result = await Emoji.getRandomEmoji();
      expect(result).toEqual(mockEmoji);
    });

    it("should throw an error when no emoji is found", async () => {
      db.query.mockResolvedValue({ rows: [] });

      await expect(Emoji.getRandomEmoji()).rejects.toThrow("No emoji found");
    });
  });
});