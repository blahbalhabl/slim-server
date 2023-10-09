const { Router } = require("express");
const { verify } = require("../middlewares/verifyToken");
const { getMembers, uploadMember, updateMember } = require('../controllers/memberController');

const router = Router();
router.use(verify);

router.get('/sanggunian-members', getMembers);
router.put('/update-member', updateMember)
router.post('/new-member', uploadMember);

module.exports = router;
