import { LoginController } from "./js/login/loginController.js";
import { LoginModel } from "./js/login/loginModel.js";
import { LoginView } from "./js/login/loginView.js";

const model = new LoginModel();
const view = new LoginView();
const controller = new LoginController(model, view);

controller.initialize();
