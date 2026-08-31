const express = require('express');
const {
    createBranch,
    getAllBranches,
    getBranchDetails,
    updateBranch,
    deleteBranch
} = require('../controllers/branchController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.route('/branches').get(getAllBranches);
router.route('/branch/:id').get(getBranchDetails);

// Admin Routes
router.route('/admin/branch/new').post(isAuthenticatedUser, authorizeRoles("admin"), createBranch);
router.route('/admin/branch/:id')
    .put(isAuthenticatedUser, authorizeRoles("admin"), updateBranch)
    .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteBranch);

module.exports = router;
