const translationService = require("../services/translation.service");
const axios = require("axios");

exports.create = async (req, res) => {
  console.log(req.body);
  try {
    const translation = await translationService.createTranslation(
      req.body,
      req.user.id,
    );
    res.status(201).json(translation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { userResponse } = req.body;

    const updated = await translationService.updateTranslation(
      id,
      req.user.id,
      userResponse,
    );
    if (!updated) return res.status(404).json({ message: "Not found" });

    await axios.post("http://localhost:5678/webhook-test/correction", {
      originalText: updated.textContent,
      userResponse: userResponse,
      userEmail: req.user.email,
    });
    res.status(200).json(updated);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

exports.findAll = async (req, res) => {
  try {
    const translations = await translationService.getAllTranslations(
      req.user.id,
    );
    res.json(translations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const translation = await translationService.getTranslationById(
      req.params.id,
      req.user.id,
    );
    if (!translation) return res.status(404).json({ message: "Not found" });
    res.json(translation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const result = await translationService.deleteTranslation(
      req.params.id,
      req.user.id,
    );
    if (!result) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Translation deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
