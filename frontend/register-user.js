import { AdminController } from "./js/admin/adminController.js";
import { AdminModel } from "./js/admin/adminModel.js";
import { AdminView } from "./js/admin/adminView.js";

const controller = new AdminController(new AdminModel(), new AdminView());
controller.initialize();
