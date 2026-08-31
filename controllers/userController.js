const User = require('../models/userModel');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const sendToken = require('../utils/sendToken');
const ErrorHandler = require('../utils/errorHandler');
const sendEmail = require('../utils/sendEmail');
const sendWelcomeEmail = require('../utils/welcomeEmail'); // ADDED: Welcome email utility
const crypto = require('crypto');
const cloudinary = require('cloudinary');

// ===== REGISTER USER =====
exports.registerUser = asyncErrorHandler(async (req, res, next) => {
    const {
        name,
        email,
        phone,
        address,
        gender,
        role,
        password,
        clinicname,
        // clinicid, // Might be missing, so we generate if needed
        qualification,
        specialization,
        registrationNumber,
        medicalCouncilName,
        yearsOfExperience
    } = req.body;

    // Required fields check
    if (!name || !email || !phone || !address || !gender || !password || !role) {
        return next(new ErrorHandler("Please fill all required fields", 400));
    }

    let finalRole = role.toLowerCase();
    if (finalRole.includes("doctor")) {
        finalRole = "doctor";
    }

    const userData = { name, email, phone, address, gender, password, role: finalRole };

    if (finalRole === "doctor") {
        userData.clinicname = clinicname;
        // Generate clinicid if not provided
        userData.clinicid = req.body.clinicid || `CLINIC_${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
        userData.qualification = qualification;
        userData.specialization = specialization;
        userData.registrationNumber = registrationNumber;
        userData.medicalCouncilName = medicalCouncilName;
        userData.yearsOfExperience = yearsOfExperience;

        // Document Uploads
        if (req.body.registrationCertificate) {
            const myCloud = await cloudinary.v2.uploader.upload(req.body.registrationCertificate, {
                folder: "doctors/certificates",
            });
            userData.registrationCertificate = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }

        if (req.body.doctorIdProof) {
            const myCloud = await cloudinary.v2.uploader.upload(req.body.doctorIdProof, {
                folder: "doctors/id_proofs",
            });
            userData.doctorIdProof = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }

        if (req.body.profilePhoto) {
            const myCloud = await cloudinary.v2.uploader.upload(req.body.profilePhoto, {
                folder: "doctors/profiles",
            });
            userData.profilePhoto = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
    }

    const user = await User.create(userData);
    
    // ADDED: Send welcome email (non-blocking - runs in background)
    sendWelcomeEmail(user.email, user.name).catch(err => 
        console.error('Background welcome email error:', err)
    );
    
    sendToken(user, 201, res);
});

// ===== LOGIN USER =====
exports.loginUser = asyncErrorHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorHandler("Please Enter Email And Password", 400));
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        return next(new ErrorHandler("Invalid Email or Password", 401));
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid Email or Password", 401));
    }

    const loginPortal = req.headers['x-role'];

    // Prevent Admin from logging into User Portal
    if (loginPortal === 'user' && user.role === 'admin') {
        return next(new ErrorHandler("Admins cannot login through the User portal. Please use the Admin login page.", 403));
    }

    // Prevent Normal Users from logging into Admin Portal
    if (loginPortal === 'admin' && user.role !== 'admin') {
        return next(new ErrorHandler("Access Denied! Only administrators can login through this portal.", 403));
    }

    sendToken(user, 200, res);
});

// ===== LOGOUT USER =====
exports.logoutUser = asyncErrorHandler(async (req, res, next) => {
    const role = req.headers['x-role'];
    const cookieName = role === 'admin' ? 'adminToken' : 'token';

    res.cookie(cookieName, null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });

    res.status(200).json({
        success: true,
        message: "Logged Out",
    });
});

// ===== GET USER DETAILS =====
exports.getUserDetails = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    let userData = user.toObject();

    const Role = require('../models/roleModel');
    try {
        const roleDoc = await Role.findOne({ name: new RegExp(`^${userData.role}$`, 'i') });
        userData.permissions = roleDoc ? roleDoc.permissions : [];
    } catch (e) {
        userData.permissions = [];
    }

    res.status(200).json({
        success: true,
        user: userData,
    });
});

// ===== FORGOT PASSWORD =====
exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) return next(new ErrorHandler("User Not Found", 404));

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetPasswordUrl = `https://${req.get("host")}/password/reset/${resetToken}`;

    try {
        await sendEmail({
            email: user.email,
            templateId: process.env.SENDGRID_RESET_TEMPLATEID,
            data: { reset_url: resetPasswordUrl }
        });

        res.status(200).json({
            success: true,
            message: `Email sent to ${user.email} successfully`,
        });
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new ErrorHandler(error.message, 500));
    }
});

// ===== RESET PASSWORD =====
exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) return next(new ErrorHandler("Invalid reset password token", 404));

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    sendToken(user, 200, res);
});

// ===== UPDATE PASSWORD =====
exports.updatePassword = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).select("+password");

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

    if (!isPasswordMatched) return next(new ErrorHandler("Old Password is Invalid", 400));

    user.password = req.body.newPassword;
    await user.save();
    sendToken(user, 200, res);
});

// ===== UPDATE PROFILE =====
exports.updateProfile = asyncErrorHandler(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        gender: req.body.gender,
        address: req.body.address,
        // Doctor specific fields update
        clinicname: req.body.clinicname,
        clinicid: req.body.clinicid,
        qualification: req.body.qualification,
        specialization: req.body.specialization,
        registrationNumber: req.body.registrationNumber,
        medicalCouncilName: req.body.medicalCouncilName,
        yearsOfExperience: req.body.yearsOfExperience,
    };

    // Handle Profile Photo (previously avatar)
    // NOTE: Schema uses profilePhoto, not avatar.
    if (req.body.profilePhoto) {
        const user = await User.findById(req.user.id);
        if (user.profilePhoto?.public_id) {
            await cloudinary.v2.uploader.destroy(user.profilePhoto.public_id);
        }
        const myCloud = await cloudinary.v2.uploader.upload(req.body.profilePhoto, {
            folder: "doctors/profiles", // Keeping consistent with registration
            width: 150,
            crop: "scale",
        });
        newUserData.profilePhoto = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        };
    } else if (req.body.avatar) {
        // Fallback if frontend still sends 'avatar' key but means profilePhoto
        const user = await User.findById(req.user.id);
        if (user.profilePhoto?.public_id) {
            await cloudinary.v2.uploader.destroy(user.profilePhoto.public_id);
        }
        const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: "doctors/profiles",
            width: 150,
            crop: "scale",
        });
        newUserData.profilePhoto = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        };
    }

    // Handle Doctor Documents
    const handleDocUpload = async (docName, folder) => {
        if (req.body[docName]) {
            const user = await User.findById(req.user.id);
            if (user[docName]?.public_id) {
                await cloudinary.v2.uploader.destroy(user[docName].public_id);
            }
            const myCloud = await cloudinary.v2.uploader.upload(req.body[docName], {
                folder: `doctors/${folder}`,
            });
            newUserData[docName] = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
    };

    await handleDocUpload('registrationCertificate', 'certificates');
    await handleDocUpload('doctorIdProof', 'id_proofs');
    // profilePhoto is handled above

    await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({ success: true });
});

// ===== ADMIN ROUTES =====
exports.getAllUsers = asyncErrorHandler(async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({ success: true, users });
});

exports.getSingleUser = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) return next(new ErrorHandler(`User not found with id: ${req.params.id}`, 404));
    res.status(200).json({ success: true, user });
});

exports.updateUserRole = asyncErrorHandler(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        gender: req.body.gender,
        role: req.body.role,
    };

    await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({ success: true });
});

exports.deleteUser = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) return next(new ErrorHandler(`User not found with id: ${req.params.id}`, 404));

    await user.remove();
    res.status(200).json({ success: true });
});

// ===== ADD ADDRESS =====
exports.addAddress = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    
    // If it's the first address or set as default, we could handle isDefault here
    // For now just add it to the array
    user.addresses.push(req.body);
    await user.save();

    res.status(200).json({
        success: true,
        addresses: user.addresses
    });
});

// ===== DELETE ADDRESS =====
exports.deleteAddress = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    user.addresses = user.addresses.filter(
        (addr) => addr._id.toString() !== req.params.id.toString()
    );

    await user.save();

    res.status(200).json({
        success: true,
        addresses: user.addresses
    });
});