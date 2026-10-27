const router = require('express').Router();
const c = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadRoomImages, verifySignatures } = require('../middleware/uploadMiddleware');

router.get('/', c.listRooms);
// "/upload" must be declared before "/:id" routes.
router.post('/upload', protect, authorize('admin'), uploadRoomImages, verifySignatures, c.uploadImages);
router.get('/:id', c.getRoom);
router.post('/', protect, authorize('admin'), c.createRoom);
router.put('/:id', protect, authorize('admin'), c.updateRoom);
router.delete('/:id', protect, authorize('admin'), c.deleteRoom);

module.exports = router;
