// Reexporta todos los controladores necesarios desde el módulo auth
export {
	loginController,
	registerUserByAdminController,
	setPinController,
	validatePinController,
	forgotPasswordController
} from "../auth/auth.controller.js";
