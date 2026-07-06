"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cashbookController_1 = require("../controllers/cashbookController");
const router = (0, express_1.Router)();
router.get('/', cashbookController_1.getCashBookRecords);
exports.default = router;
