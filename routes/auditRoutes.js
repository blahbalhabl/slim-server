const { Router } = require("express");
const { verify } = require("../middlewares/verifyToken");
const { getAudits, getAudit } = require("../controllers/auditController");
const router = Router();

router.use(verify);

router.get('/audits', getAudits);
router.get('/profile-audit/:userId', getAudit);

module.exports = router ;